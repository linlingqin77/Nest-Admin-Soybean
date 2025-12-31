import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BusinessException } from 'src/common/exceptions';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum, DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { LOGIN_TOKEN_EXPIRESIN } from 'src/common/constant/index';
import { ResponseCode, Result } from 'src/common/response';
import { GenerateUUID } from 'src/common/utils/index';
import { LoginDto, RegisterDto } from 'src/module/main/dto/index';
import { UserType } from '../dto/user';
import { ClientInfoDto } from 'src/common/decorators/common.decorator';
import { CacheEvict, Cacheable } from 'src/common/decorators/redis.decorator';
import { Captcha } from 'src/common/decorators/captcha.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from '../user.repository';
import { SYS_USER_TYPE } from 'src/common/constant/index';
import { SysDept, SysPost, SysRole, SysUser } from '@prisma/client';
import { Uniq } from 'src/common/utils/index';
import { RoleService } from '../../role/role.service';
import { LoginSecurityService } from 'src/common/security/login-security.service';
import { TokenBlacklistService } from 'src/common/security/token-blacklist.service';

type UserWithDept = SysUser & { dept?: SysDept | null };
type UserWithRelations = UserWithDept & { roles?: SysRole[]; posts?: SysPost[] };

/**
 * 用户认证服务
 *
 * @description 处理用户登录、注册、Token管理等认证相关逻辑
 */
@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly roleService: RoleService,
    private readonly loginSecurityService: LoginSecurityService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * 用户登录
   * 需求 4.3: 登录失败 5 次后锁定账户 15 分钟
   */
  @Captcha('user')
  async login(user: LoginDto, clientInfo: ClientInfoDto) {
    // 检查账户是否被锁定
    const lockStatus = await this.loginSecurityService.validateBeforeLogin(user.userName);
    if (lockStatus.locked) {
      return Result.fail(ResponseCode.ACCOUNT_LOCKED, lockStatus.message);
    }

    const data = await this.userRepo.findByUserName(user.userName);

    if (!(data && bcrypt.compareSync(user.password, data.password))) {
      // 记录登录失败
      const securityStatus = await this.loginSecurityService.recordLoginFailure(user.userName);
      
      if (securityStatus.isLocked) {
        return Result.fail(ResponseCode.ACCOUNT_LOCKED, `登录失败次数过多，账户已被锁定 15 分钟`);
      }
      
      return Result.fail(
        ResponseCode.BUSINESS_ERROR, 
        `帐号或密码错误，还剩 ${securityStatus.remainingAttempts} 次尝试机会`
      );
    }

    // 登录成功，清除失败记录
    await this.loginSecurityService.clearFailedAttempts(user.userName);

    // 清除用户缓存
    await this.clearUserCache(data.userId);

    const userData = await this.getUserinfo(data.userId);

    if (userData.delFlag === DelFlagEnum.DELETE) {
      return Result.fail(ResponseCode.BUSINESS_ERROR, `您已被禁用，如需正常使用请联系管理员`);
    }
    if (userData.status === StatusEnum.STOP) {
      return Result.fail(ResponseCode.BUSINESS_ERROR, `您已被停用，如需正常使用请联系管理员`);
    }

    const loginDate = new Date();
    await this.userRepo.updateLoginTime(data.userId);
    await this.prisma.sysUser.update({
      where: { userId: data.userId },
      data: { loginIp: clientInfo.ipaddr },
    });

    const uuid = GenerateUUID();
    // 需求 4.9: 获取当前 token 版本，用于密码修改后失效
    const tokenVersion = await this.tokenBlacklistService.getUserTokenVersion(userData.userId);
    const token = this.createToken({ uuid: uuid, userId: userData.userId, tokenVersion });
    const permissions = await this.getUserPermissions(userData.userId);
    const deptData = userData.deptId
      ? await this.prisma.sysDept.findFirst({ where: { deptId: userData.deptId }, select: { deptName: true } })
      : null;

    const roles = (userData.roles ?? []).map((item) => item.roleKey);

    const safeDept = userData.dept ?? null;
    const safeRoles = userData.roles ?? [];
    const safePosts = userData.posts ?? [];
    
    // Build user object with deptName
    const userObj = {
      ...(userData as unknown as UserType['user']),
      dept: safeDept,
      roles: safeRoles,
      posts: safePosts,
    };
    // Add deptName to user object
    Object.assign(userObj, { deptName: deptData?.deptName || '' });
    
    const userInfo: Partial<UserType> = {
      browser: clientInfo.browser,
      ipaddr: clientInfo.ipaddr,
      loginLocation: clientInfo.loginLocation,
      loginTime: loginDate,
      os: clientInfo.os,
      deviceType: clientInfo.deviceType,
      permissions: permissions,
      roles: roles,
      token: uuid,
      user: userObj,
      userId: userData.userId,
      userName: userData.userName,
      deptId: userData.deptId,
    };

    await this.updateRedisToken(uuid, userInfo);

    return Result.ok(
      {
        token,
      },
      '登录成功',
    );
  }

  /**
   * 用户注册
   */
  async register(user: RegisterDto) {
    const loginDate = new Date();
    const salt = bcrypt.genSaltSync(10);
    if (user.password) {
      user.password = bcrypt.hashSync(user.password, salt);
    }
    const checkUserNameUnique = await this.userRepo.findByUserName(user.userName);
    if (checkUserNameUnique) {
      return Result.fail(ResponseCode.BUSINESS_ERROR, `保存用户'${user.userName}'失败，注册账号已存在`);
    }
    await this.userRepo.create({
      userName: user.userName,
      nickName: user.userName,
      password: user.password,
      loginDate,
      userType: SYS_USER_TYPE.CUSTOM,
      phonenumber: '',
      sex: '0',
      avatar: '',
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      loginIp: '',
    });
    return Result.ok();
  }

  /**
   * 创建JWT Token
   * 需求 4.9: 包含 token 版本用于密码修改后失效
   */
  createToken(payload: { uuid: string; userId: number; tokenVersion?: number }): string {
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }

  /**
   * 解析JWT Token
   */
  parseToken(token: string) {
    try {
      if (!token) return null;
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * 更新Redis中的Token信息
   */
  async updateRedisToken(token: string, metaData: Partial<UserType>) {
    const oldMetaData = await this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${token}`);

    let newMetaData = metaData;
    if (oldMetaData) {
      newMetaData = Object.assign(oldMetaData, metaData);
    }

    await this.redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${token}`, newMetaData, LOGIN_TOKEN_EXPIRESIN);
  }

  /**
   * 更新Redis中的用户角色和权限
   */
  async updateRedisUserRolesAndPermissions(uuid: string, userId: number) {
    const userData = await this.getUserinfo(userId);
    const permissions = await this.getUserPermissions(userId);
    const roles = (userData.roles ?? []).map((item) => item.roleKey);

    await this.updateRedisToken(uuid, {
      permissions: permissions,
      roles: roles,
    });
  }

  /**
   * 清除用户缓存
   */
  @CacheEvict(CacheEnum.SYS_USER_KEY, '{userId}')
  async clearUserCache(userId: number) {
    return userId;
  }

  /**
   * 获取用户角色ID列表
   */
  async getRoleIds(userIds: Array<number>) {
    if (!userIds.length) {
      return [];
    }
    const roleList = await this.prisma.sysUserRole.findMany({
      where: {
        userId: { in: userIds },
      },
      select: { roleId: true },
    });
    const roleIds = roleList.map((item) => item.roleId);
    return Uniq(roleIds);
  }

  /**
   * 获取用户权限列表
   * 添加缓存以提升性能，减少数据库查询
   */
  @Cacheable(CacheEnum.SYS_USER_KEY, 'permissions:{userId}')
  async getUserPermissions(userId: number) {
    const roleIds = await this.getRoleIds([userId]);
    const list = await this.roleService.getPermissionsByRoleIds(roleIds);
    const permissions = Uniq(list.map((item) => item.perms)).filter((item) => item);
    return permissions;
  }

  /**
   * 获取用户详细信息（含部门、角色、岗位）
   */
  async getUserinfo(userId: number): Promise<UserWithRelations> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '用户不存在');
    }

    const [dept, roleIds, postRelations] = await Promise.all([
      user.deptId
        ? this.prisma.sysDept.findFirst({ where: { deptId: user.deptId, delFlag: DelFlagEnum.NORMAL } })
        : Promise.resolve(null),
      this.getRoleIds([userId]),
      this.prisma.sysUserPost.findMany({ where: { userId }, select: { postId: true } }),
    ]);

    const posts = postRelations.length
      ? await this.prisma.sysPost.findMany({
          where: {
            delFlag: DelFlagEnum.NORMAL,
            postId: {
              in: postRelations.map((item) => item.postId),
            },
          },
        })
      : [];

    const roles = roleIds.length
      ? await this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL, roleId: { in: roleIds } } })
      : [];

    return {
      ...user,
      dept,
      posts,
      roles,
    };
  }
}
