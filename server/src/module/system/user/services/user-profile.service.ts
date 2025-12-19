import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { BusinessException } from 'src/common/exceptions';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';
import { ResponseCode, Result } from 'src/common/response';
import { UserType } from '../dto/user';
import { UpdateProfileDto, UpdatePwdDto, ResetPwdDto } from '../dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from '../user.repository';

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
    ) { }

    /**
     * 获取用户个人资料
     */
    async profile(user: UserType) {
        return Result.ok(user);
    }

    /**
     * 更新用户个人资料
     */
    async updateProfile(user: UserType, updateProfileDto: UpdateProfileDto) {
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
     */
    async updatePwd(user: UserType, updatePwdDto: UpdatePwdDto) {
        if (updatePwdDto.oldPassword === updatePwdDto.newPassword) {
            return Result.fail(ResponseCode.BUSINESS_ERROR, '新密码不能与旧密码相同');
        }

        // 验证旧密码 - 需要用compareSync而不是直接比较
        if (!bcrypt.compareSync(updatePwdDto.oldPassword, user.user.password)) {
            return Result.fail(ResponseCode.BUSINESS_ERROR, '修改密码失败，旧密码错误');
        }

        const password = bcrypt.hashSync(updatePwdDto.newPassword, bcrypt.genSaltSync(10));
        await this.userRepo.resetPassword(user.user.userId, password);
        return Result.ok();
    }

    /**
     * 重置用户密码（管理员操作）
     */
    async resetPwd(body: ResetPwdDto) {
        if (body.userId === 1) {
            return Result.fail(ResponseCode.BUSINESS_ERROR, '系统用户不能重置密码');
        }
        if (body.password) {
            body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(10));
        }
        await this.userRepo.resetPassword(body.userId, body.password);
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
