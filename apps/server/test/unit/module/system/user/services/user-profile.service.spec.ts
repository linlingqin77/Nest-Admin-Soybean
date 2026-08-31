/**
 * @file user-profile.service.spec.ts
 * @description Migrated from src/modules/users/services/user-profile.service.spec.ts
 * Unit tests for UserProfileService
 */
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileService } from '@/modules/users/services/user-profile.service';
import { PrismaService } from '@/platform/prisma';
import { UserRepository } from '@/modules/users/user.repository';
import { RedisService } from '@/platform/redis/redis.service';
import { TokenBlacklistService } from '@/core/auth/token-blacklist.service';
import { ResponseCode } from '@/shared/response';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UserProfileService', () => {
  let service: UserProfileService;
  let prismaMock: any;
  let userRepoMock: any;
  let redisMock: any;
  let tokenBlacklistMock: any;

  const mockUser = {
    user: {
      userId: 1,
      userName: 'admin',
      password: '$2a$10$hashedpassword',
      nickName: 'Admin',
      email: 'admin@test.com',
    },
    token: 'test-token',
  };

  beforeEach(async () => {
    prismaMock = {
      sysUser: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    userRepoMock = {
      resetPassword: jest.fn().mockResolvedValue({}),
    };

    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

    tokenBlacklistMock = {
      invalidateAllUserTokens: jest.fn().mockResolvedValue(undefined),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UserRepository, useValue: userRepoMock },
        { provide: RedisService, useValue: redisMock },
        { provide: TokenBlacklistService, useValue: tokenBlacklistMock },
      ],
    }).compile();

    service = modules.get<UserProfileService>(UserProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      const result = await service.profile(mockUser as any);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { nickName: 'New Name', email: 'new@test.com', phonenumber: '13800138000', sex: '0' };

      const result = await service.updateProfile(mockUser as any, updateDto);

      expect(result.code).toBe(200);
      expect(prismaMock.sysUser.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: updateDto,
      });
    });

    it('should update Redis cache when user data exists', async () => {
      const cachedUser = { ...mockUser };
      redisMock.get.mockResolvedValue(cachedUser);
      const updateDto = { nickName: 'New Name', email: 'test@test.com', phonenumber: '13800138000', sex: '0' };

      await service.updateProfile(mockUser as any, updateDto);

      expect(redisMock.set).toHaveBeenCalled();
    });

    it('should not update Redis when no cached data', async () => {
      redisMock.get.mockResolvedValue(null);
      const updateDto = { nickName: 'New Name', email: 'test@test.com', phonenumber: '13800138000', sex: '0' };

      await service.updateProfile(mockUser as any, updateDto);

      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  describe('updatePwd', () => {
    beforeEach(() => {
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (bcrypt.hashSync as jest.Mock).mockReturnValue('$2a$10$newhash');
      (bcrypt.genSaltSync as jest.Mock).mockReturnValue('$2a$10$salt');
    });

    it('should fail when new password equals old password', async () => {
      const updateDto = { oldPassword: 'same', newPassword: 'same' };

      const result = await service.updatePwd(mockUser as any, updateDto);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('新密码不能与旧密码相同');
    });

    it('should fail when old password is incorrect', async () => {
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
      const updateDto = { oldPassword: 'wrong', newPassword: 'newpass' };

      const result = await service.updatePwd(mockUser as any, updateDto);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('旧密码错误');
    });

    it('should update password successfully', async () => {
      const updateDto = { oldPassword: 'oldpass', newPassword: 'newpass' };

      const result = await service.updatePwd(mockUser as any, updateDto);

      expect(result.code).toBe(200);
      expect(userRepoMock.resetPassword).toHaveBeenCalledWith(1, '$2a$10$newhash');
      expect(tokenBlacklistMock.invalidateAllUserTokens).toHaveBeenCalledWith(1, 'password_change');
    });
  });

  describe('resetPwd', () => {
    beforeEach(() => {
      (bcrypt.hashSync as jest.Mock).mockReturnValue('$2a$10$newhash');
      (bcrypt.genSaltSync as jest.Mock).mockReturnValue('$2a$10$salt');
    });

    it('should fail for system user (userId=1)', async () => {
      const result = await service.resetPwd({ userId: 1, password: 'newpass' });

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('系统用户不能重置密码');
    });

    it('should reset password successfully', async () => {
      const result = await service.resetPwd({ userId: 2, password: 'newpass' });

      expect(result.code).toBe(200);
      expect(userRepoMock.resetPassword).toHaveBeenCalledWith(2, '$2a$10$newhash');
      expect(tokenBlacklistMock.invalidateAllUserTokens).toHaveBeenCalledWith(2, 'admin_password_reset');
    });

    it('should handle empty password', async () => {
      const result = await service.resetPwd({ userId: 2, password: '' });

      expect(result.code).toBe(200);
      expect(userRepoMock.resetPassword).toHaveBeenCalledWith(2, '');
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar successfully', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      const result = await service.updateAvatar(mockUser as any, avatarUrl);

      expect(result.code).toBe(200);
      expect(prismaMock.sysUser.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { avatar: avatarUrl },
      });
    });

    it('should update Redis cache when user data exists', async () => {
      const cachedUser = { ...mockUser };
      redisMock.get.mockResolvedValue(cachedUser);
      const avatarUrl = 'https://example.com/avatar.jpg';

      await service.updateAvatar(mockUser as any, avatarUrl);

      expect(redisMock.set).toHaveBeenCalled();
    });
  });
});
