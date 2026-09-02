import { Injectable } from '@nestjs/common';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';
import { Idempotent } from 'src/core/http/decorators/idempotent.decorator';
import { SYS_USER_TYPE } from 'src/shared/constants/index';
import { Result } from 'src/shared/response';
import {
  BatchCreateUserRequestDto,
  BatchDeleteUserRequestDto,
  BatchResultItemResponseDto,
  BatchResultResponseDto,
} from '../dto/index';

import { UserRepository } from '../user.repository';
import { PasswordService } from 'src/shared/services/password.service';

/**
 * 用户批量操作服务
 *
 * 提供用户批量操作功能：
 * - 批量创建用户
 * - 批量删除用户
 *
 * @class UserBatchService
 */
@Injectable()
export class UserBatchService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}
  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 批量创建用户
   */
  @Idempotent({
    timeout: 30,
    message: '批量创建用户正在处理中，请勿重复提交',
  })
  @Transactional()
  async batchCreate(batchCreateDto: BatchCreateUserRequestDto): Promise<Result<BatchResultResponseDto>> {
    const results: BatchResultItemResponseDto[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batchCreateDto.users.length; i++) {
      const userDto = batchCreateDto.users[i];
      try {
        const existingUser = await this.userRepo.existsByUserName(userDto.userName);
        if (existingUser) {
          results.push({ index: i, success: false, error: `用户名 "${userDto.userName}" 已存在` });
          failedCount++;
          continue;
        }

        if (userDto.phonenumber) {
          const existingPhone = await this.userRepo.existsByPhoneNumber(userDto.phonenumber);
          if (existingPhone) {
            results.push({ index: i, success: false, error: `手机号 "${userDto.phonenumber}" 已存在` });
            failedCount++;
            continue;
          }
        }

        if (userDto.email) {
          const existingEmail = await this.userRepo.existsByEmail(userDto.email);
          if (existingEmail) {
            results.push({ index: i, success: false, error: `邮箱 "${userDto.email}" 已存在` });
            failedCount++;
            continue;
          }
        }

        const hashedPassword = await this.passwordService.hash(userDto.password);

        const user = await this.userRepo.create({
          userName: userDto.userName,
          nickName: userDto.nickName,
          password: hashedPassword,
          email: userDto.email ?? '',
          phonenumber: userDto.phonenumber ?? '',
          sex: userDto.sex ?? '0',
          status: userDto.status ?? '0',
          deptId: userDto.deptId,
          remark: userDto.remark ?? '',
          userType: SYS_USER_TYPE.CUSTOM,
          avatar: '',
          delFlag: '0',
          loginIp: '',
        });

        if (userDto.postIds && userDto.postIds.length > 0) {
          await this.prisma.sysUserPost.createMany({
            data: userDto.postIds.map((postId) => ({ userId: user.userId, postId })),
            skipDuplicates: true,
          });
        }

        if (userDto.roleIds && userDto.roleIds.length > 0) {
          await this.prisma.sysUserRole.createMany({
            data: userDto.roleIds.map((roleId) => ({ userId: user.userId, roleId })),
            skipDuplicates: true,
          });
        }

        results.push({ index: i, success: true, userId: user.userId });
        successCount++;
      } catch (error) {
        results.push({ index: i, success: false, error: error instanceof Error ? error.message : '创建失败' });
        failedCount++;
      }
    }

    return Result.ok({ successCount, failedCount, totalCount: batchCreateDto.users.length, results });
  }

  /**
   * 批量删除用户
   */
  @Transactional()
  async batchDelete(batchDeleteDto: BatchDeleteUserRequestDto): Promise<Result<BatchResultResponseDto>> {
    const results: BatchResultItemResponseDto[] = [];
    let successCount = 0;
    let failedCount = 0;

    const filteredUserIds = batchDeleteDto.userIds.filter((id) => id !== 1);
    const blockedIds = batchDeleteDto.userIds.filter((id) => id === 1);

    for (const id of blockedIds) {
      results.push({ index: batchDeleteDto.userIds.indexOf(id), success: false, error: '系统管理员不可删除' });
      failedCount++;
    }

    for (const userId of filteredUserIds) {
      try {
        const user = await this.userRepo.findById(userId);
        if (!user) {
          results.push({
            index: batchDeleteDto.userIds.indexOf(userId),
            success: false,
            error: `用户ID ${userId} 不存在`,
          });
          failedCount++;
          continue;
        }

        if (user.userType === SYS_USER_TYPE.SYS) {
          results.push({ index: batchDeleteDto.userIds.indexOf(userId), success: false, error: '系统用户不可删除' });
          failedCount++;
          continue;
        }

        await this.userRepo.softDeleteBatch([userId]);
        results.push({ index: batchDeleteDto.userIds.indexOf(userId), success: true, userId });
        successCount++;
      } catch (error) {
        results.push({
          index: batchDeleteDto.userIds.indexOf(userId),
          success: false,
          error: error instanceof Error ? error.message : '删除失败',
        });
        failedCount++;
      }
    }

    return Result.ok({ successCount, failedCount, totalCount: batchDeleteDto.userIds.length, results });
  }
}
