import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MainService } from './main.service';
import { RegisterDto, LoginDto } from './dto/index';
import { createMath } from 'src/common/utils/captcha';
import { Result, ResponseCode } from 'src/common/response';
import { GenerateUUID } from 'src/common/utils/index';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';
import { ConfigService } from 'src/module/system/config/config.service';
import { ClientInfo, ClientInfoDto } from 'src/common/decorators/common.decorator';
import { NotRequireAuth, User, UserDto } from 'src/module/system/user/user.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { LoginVo, CaptchaVo, GetInfoVo } from './vo/main.vo';
import { RouterVo } from 'src/module/system/menu/vo/menu.vo';

@ApiTags('根目录')
@Controller('/')
@ApiBearerAuth('Authorization')
export class MainController {
  constructor(
    private readonly mainService: MainService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Api({
    summary: '用户登录',
    description: '用户登录接口，需要用户名、密码和验证码',
    body: LoginDto,
    security: false,
    type: LoginVo,
  })
  @NotRequireAuth()
  @Post('/login')
  @HttpCode(200)
  login(@Body() user: LoginDto, @ClientInfo() clientInfo: ClientInfoDto) {
    return this.mainService.login(user, clientInfo);
  }

  @Api({
    summary: '退出登录',
    description: '退出当前登录状态，清除登录令牌',
  })
  @NotRequireAuth()
  @Post('/logout')
  @HttpCode(200)
  async logout(@User() user: UserDto, @ClientInfo() clientInfo: ClientInfoDto) {
    if (user?.token) {
      await this.redisService.del(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`);
    }
    return this.mainService.logout(clientInfo);
  }

  @Api({
    summary: '用户注册',
    description: '新用户注册接口，需要用户名、密码和验证码',
    body: RegisterDto,
    security: false,
  })
  @NotRequireAuth()
  @Post('/register')
  @HttpCode(200)
  register(@Body() user: RegisterDto) {
    return this.mainService.register(user);
  }

  @Api({
    summary: '是否开启用户注册',
    description: '查询系统是否开启用户自主注册功能',
    security: false,
  })
  @NotRequireAuth()
  @Get('/registerUser')
  async registerUser() {
    // 使用 getSystemConfigValue 不依赖租户上下文（登录前调用）
    const res = await this.configService.getSystemConfigValue('sys.account.registerUser');
    const enable = res === 'true';
    return Result.ok(enable, '操作成功');
  }

  @Api({
    summary: '获取验证码图片',
    description: '获取登录/注册所需的图形验证码，返回 Base64 图片和 UUID',
    security: false,
    type: CaptchaVo,
  })
  @NotRequireAuth()
  @Get('/captchaImage')
  async captchaImage() {
    // 使用公共配置方法，不依赖租户上下文（登录前没有租户信息）
    const enable = await this.configService.getSystemConfigValue('sys.account.captchaEnabled');
    const captchaEnabled: boolean = enable === 'true';
    const data = {
      captchaEnabled,
      img: '',
      uuid: '',
    };
    try {
      if (captchaEnabled) {
        const captchaInfo = createMath();
        data.img = captchaInfo.data;
        data.uuid = GenerateUUID();
        await this.redisService.set(
          CacheEnum.CAPTCHA_CODE_KEY + data.uuid,
          captchaInfo.text.toLowerCase(),
          1000 * 60 * 5,
        );
      }
      return Result.ok(data, '操作成功');
    } catch (err) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '生成验证码错误，请重试');
    }
  }

  @Api({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的基本信息、角色和权限',
    type: GetInfoVo,
  })
  @Get('/getInfo')
  async getInfo(@User() user: UserDto) {
    return {
      msg: '操作成功',
      code: 200,
      permissions: user.permissions,
      roles: user.roles,
      user: user.user,
    };
  }

  @Api({
    summary: '获取路由菜单',
    description: '获取当前用户的前端路由菜单数据',
    type: RouterVo,
    isArray: true,
  })
  @Get('/getRouters')
  getRouters(@User() user: UserDto) {
    const userId = user.user.userId.toString();
    return this.mainService.getRouters(+userId);
  }
}
