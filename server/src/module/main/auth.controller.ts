import { Controller, Get, Post, Body, HttpCode, Logger, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AppConfigService } from 'src/config/app-config.service';
import { MainService } from './main.service';
import { AuthLoginDto, AuthRegisterDto, SocialLoginDto } from './dto/auth.dto';
import { LoginTokenVo, CaptchaCodeVo, LoginTenantVo, UserInfoVo } from './vo/auth.vo';
import { createMath } from 'src/common/utils/captcha';
import { Result, ResponseCode } from 'src/common/response';
import { GenerateUUID } from 'src/common/utils/index';
import { RedisService } from 'src/module/common/redis/redis.service';
import { StatusEnum } from 'src/common/enum/index';
import { CacheEnum } from 'src/common/enum/index';
import { ConfigService as SysConfigService } from 'src/module/system/config/config.service';
import { ClientInfo, ClientInfoDto } from 'src/common/decorators/common.decorator';
import { NotRequireAuth, User, UserDto } from 'src/module/system/user/user.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { TenantContext, IgnoreTenant } from 'src/common/tenant';
import { SkipDecrypt } from 'src/common/crypto';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 认证控制器 - 匹配 Soybean 前端 API
 *
 * 路由前缀: /auth
 * 对应前端: src/service/api/auth.ts
 */
@ApiTags('认证模块')
@Controller('auth')
@ApiBearerAuth('Authorization')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly mainService: MainService,
    private readonly redisService: RedisService,
    private readonly sysConfigService: SysConfigService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取租户列表 - GET /auth/tenant/list
   * 对应前端: fetchTenantList()
   */
  @Api({
    summary: '获取租户列表',
    description: '获取系统中所有可用的租户列表，用于登录时选择租户',
    security: false,
    type: LoginTenantVo,
  })
  @Get('tenant/list')
  @NotRequireAuth()
  @IgnoreTenant()
  async getTenantList(): Promise<Result> {
    const tenantEnabled = this.config.tenant.enabled;

    const result: LoginTenantVo = {
      tenantEnabled,
      voList: [],
    };

    if (tenantEnabled) {
      try {
        // 查询所有正常状态的租户
        const tenants = await this.prisma.sysTenant.findMany({
          where: { status: StatusEnum.NORMAL },
          select: {
            tenantId: true,
            companyName: true,
            domain: true,
          },
          orderBy: { createTime: 'asc' },
        });

        result.voList = tenants.map((t) => ({
          tenantId: t.tenantId,
          companyName: t.companyName,
          domain: t.domain || '',
        }));
      } catch (error) {
        // 如果表不存在，返回默认租户
        this.logger.warn('SysTenant table may not exist yet:', error.message);
        result.voList = [
          {
            tenantId: TenantContext.SUPER_TENANT_ID,
            companyName: '默认租户',
            domain: '',
          },
        ];
      }
    }

    return Result.ok(result);
  }

  /**
   * 获取验证码 - GET /auth/code
   * 对应前端: fetchCaptchaCode()
   */
  @Api({
    summary: '获取验证码',
    description: '获取登录/注册所需的图形验证码',
    security: false,
    type: CaptchaCodeVo,
  })
  @Get('code')
  @NotRequireAuth()
  async getCaptchaCode(): Promise<Result> {
    // 使用公共配置方法，不依赖租户上下文（登录前没有租户信息）
    const enable = await this.sysConfigService.getSystemConfigValue('sys.account.captchaEnabled');
    const captchaEnabled: boolean = enable === 'true';

    const result: CaptchaCodeVo = {
      captchaEnabled,
      uuid: '',
      img: '',
    };

    if (captchaEnabled) {
      try {
        const captchaInfo = createMath();
        result.img = captchaInfo.data;
        result.uuid = GenerateUUID();
        await this.redisService.set(
          CacheEnum.CAPTCHA_CODE_KEY + result.uuid,
          captchaInfo.text.toLowerCase(),
          1000 * 60 * 5,
        );
      } catch (err) {
        this.logger.error('生成验证码错误:', err);
        return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '生成验证码错误，请重试');
      }
    }

    return Result.ok(result);
  }

  /**
   * 用户登录 - POST /auth/login
   * 对应前端: fetchLogin()
   */
  @Api({
    summary: '用户登录',
    description: '用户登录接口，支持租户、验证码验证',
    body: AuthLoginDto,
    security: false,
    type: LoginTokenVo,
  })
  @Post('login')
  @HttpCode(200)
  @NotRequireAuth()
  @ApiHeader({ name: 'tenant-id', description: '租户ID', required: false })
  async login(
    @Body() loginDto: AuthLoginDto,
    @ClientInfo() clientInfo: ClientInfoDto,
    @Headers('tenant-id') headerTenantId?: string,
  ): Promise<Result> {
    // 优先使用 header 中的租户ID，其次使用 body 中的
    const tenantId = headerTenantId || loginDto.tenantId || TenantContext.SUPER_TENANT_ID;

    this.logger.log(`用户登录: ${loginDto.username}, 租户: ${tenantId}`);

    // 转换为原有的登录 DTO 格式调用服务（注意：原服务使用 userName 而非 username）
    const loginData = {
      userName: loginDto.username, // Soybean 前端用 username，后端用 userName
      password: loginDto.password,
      code: loginDto.code,
      uuid: loginDto.uuid,
    };

    // 设置租户上下文后执行登录
    return TenantContext.run({ tenantId }, async () => {
      const result = await this.mainService.login(loginData as any, clientInfo);

      // 转换响应格式为 Soybean 前端期望的格式
      if (result.code === 200 && result.data?.token) {
        const jwtExpires = this.config.jwt.expiresin;
        const refreshExpires = this.config.jwt.refreshExpiresIn;

        const loginToken: LoginTokenVo = {
          access_token: result.data.token,
          refresh_token: result.data.token, // 暂时使用同一个 token
          expire_in: this.parseExpiresIn(jwtExpires),
          refresh_expire_in: this.parseExpiresIn(refreshExpires),
          client_id: loginDto.clientId || 'pc',
          scope: '',
          openid: '',
        };

        return Result.ok(loginToken);
      }

      return result;
    });
  }

  /**
   * 用户注册 - POST /auth/register
   * 对应前端: fetchRegister()
   */
  @Api({
    summary: '用户注册',
    description: '新用户注册接口',
    body: AuthRegisterDto,
    security: false,
  })
  @Post('register')
  @HttpCode(200)
  @NotRequireAuth()
  @ApiHeader({ name: 'tenant-id', description: '租户ID', required: false })
  async register(@Body() registerDto: AuthRegisterDto, @Headers('tenant-id') headerTenantId?: string): Promise<Result> {
    // 验证密码一致性
    if (registerDto.password !== registerDto.confirmPassword) {
      return Result.fail(ResponseCode.BAD_REQUEST, '两次输入的密码不一致');
    }

    const tenantId = headerTenantId || registerDto.tenantId || TenantContext.SUPER_TENANT_ID;

    // 转换为原有的注册 DTO 格式
    const registerData = {
      username: registerDto.username,
      password: registerDto.password,
      code: registerDto.code,
      uuid: registerDto.uuid,
    };

    return TenantContext.run({ tenantId }, async () => {
      return this.mainService.register(registerData as any);
    });
  }

  /**
   * 退出登录 - POST /auth/logout
   * 对应前端: fetchLogout()
   */
  @Api({
    summary: '退出登录',
    description: '退出当前登录状态',
  })
  @NotRequireAuth()
  @Post('logout')
  @HttpCode(200)
  async logout(@User() user: UserDto, @ClientInfo() clientInfo: ClientInfoDto): Promise<Result> {
    if (user?.token) {
      await this.redisService.del(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`);
    }
    return this.mainService.logout(clientInfo);
  }

  /**
   * 社交登录回调 - POST /auth/social/callback
   * 对应前端: fetchSocialLoginCallback()
   */
  @Api({
    summary: '社交登录回调',
    description: '第三方社交平台登录回调处理',
    body: SocialLoginDto,
    security: false,
  })
  @Post('social/callback')
  @HttpCode(200)
  @NotRequireAuth()
  async socialCallback(@Body() socialDto: SocialLoginDto): Promise<Result> {
    // TODO: 实现社交登录逻辑
    return Result.fail(ResponseCode.NOT_IMPLEMENTED, '社交登录功能暂未实现');
  }

  /**
   * 获取加密公钥 - GET /auth/publicKey
   * 用于前端加密数据
   */
  @Api({
    summary: '获取加密公钥',
    description: '获取RSA公钥用于数据加密',
    security: false,
  })
  @Get('publicKey')
  @NotRequireAuth()
  async getPublicKey(): Promise<Result> {
    // TODO: 从 CryptoService 获取公钥
    return Result.ok({ publicKey: '' });
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresIn(expires: string): number {
    const match = expires.match(/^(\d+)(h|m|s|d)?$/);
    if (!match) return 3600;

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    switch (unit) {
      case 'd':
        return value * 86400;
      case 'h':
        return value * 3600;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return value;
    }
  }
}
