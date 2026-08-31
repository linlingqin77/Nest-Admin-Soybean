import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { BusinessException } from 'src/shared/exceptions';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/index';
import { ResponseCode, Result } from 'src/shared/response';
import { SUPER_ADMIN_USER_ID } from 'src/shared/constants/index';
import { UserType } from '../dto/user';
import { UpdateProfileRequestDto, UpdatePwdRequestDto, ResetPwdRequestDto } from '../dto/index';
import { PrismaService } from 'src/platform/prisma';
import { UserRepository } from '../user.repository';
import { TokenBlacklistService } from 'src/core/auth/token-blacklist.service';
import { Lock } from 'src/core/http/decorators/lock.decorator';

/**
 * 用户个人资料服务
 *
 * @description 处理用户个人资料更新、密码修改等操作
 */
@Injectable()
export class UserProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepo: UserRepository,
    private readonly redisService: RedisService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * 获取用户个人资料
   */
  async profile(user: UserType) {
    return Result.ok(user);
  }

  /**
   * 更新用户个人资料
   */
  async updateProfile(user: UserType, updateProfileDto: UpdateProfileRequestDto) {
    await this.prisma.sysUser.update({
      where: { userId: user.user.userId },
      data: updateProfileDto,
    });

    // 同步更新Redis中的用户信息
    const userData = await this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`);
    if (userData) {
      userData.user = Object.assign(userData.user, updateProfileDto);
      await this.redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`, userData);
    }

    return Result.ok();
  }

  /**
   * 用户修改密码
   * 需求 4.9: 密码修改后使所有 Token 失效
   */
  async updatePwd(user: UserType, updatePwdDto: UpdatePwdRequestDto) {
    BusinessException.throwIf(
      updatePwdDto.oldPassword === updatePwdDto.newPassword,
      '新密码不能与旧密码相同',
      ResponseCode.BUSINESS_ERROR,
    );

    // 验证旧密码 - 需要用compareSync而不是直接比较
    BusinessException.throwIf(
      !bcrypt.compareSync(updatePwdDto.oldPassword, user.user.password),
      '修改密码失败，旧密码错误',
      ResponseCode.BUSINESS_ERROR,
    );

    const password = bcrypt.hashSync(updatePwdDto.newPassword, bcrypt.genSaltSync(10));
    await this.userRepo.resetPassword(user.user.userId, password);

    // 需求 4.9: 使该用户所有 Token 失效
    await this.tokenBlacklistService.invalidateAllUserTokens(user.user.userId, 'password_change');

    return Result.ok();
  }

  /**
   * 重置用户密码（管理员操作）
   * 需求 4.9: 密码修改后使所有 Token 失效
   */
  @Lock({
    key: 'user:pwd:reset:{body.userId}',
    leaseTime: 10,
    message: '密码正在重置中，请稍后重试',
  })
  async resetPwd(body: ResetPwdRequestDto) {
    BusinessException.throwIf(body.userId === SUPER_ADMIN_USER_ID, '超级管理员密码不能通过此接口重置', ResponseCode.BUSINESS_ERROR);
    if (body.password) {
      body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(10));
    }
    await this.userRepo.resetPassword(body.userId, body.password);

    // 需求 4.9: 使该用户所有 Token 失效
    await this.tokenBlacklistService.invalidateAllUserTokens(body.userId, 'admin_password_reset');

    return Result.ok();
  }

  /**
   * 更新用户头像
   */
  async updateAvatar(user: UserType, avatarUrl: string) {
    await this.prisma.sysUser.update({
      where: { userId: user.user.userId },
      data: { avatar: avatarUrl },
    });

    // 同步更新Redis
    const userData = await this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`);
    if (userData) {
      userData.user.avatar = avatarUrl;
      await this.redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`, userData);
    }

    return Result.ok();
  }
}
