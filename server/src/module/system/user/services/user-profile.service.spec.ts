import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileService } from './user-profile.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { UserRepository } from '../user.repository';
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { ResponseCode } from 'src/common/response';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import * as bcrypt from 'bcryptjs';
import { UserType } from '../dto/user';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let redis: jest.Mocked<RedisService>;
  let userRepo: jest.Mocked<UserRepository>;

  const mockUser: UserType = {
    userId: 1,
    userName: 'testuser',
    deptId: 100,
    token: 'test-token',
    browser: 'Chrome',
    ipaddr: '127.0.0.1',
    loginLocation: '内网IP',
    loginTime: new Date(),
    os: 'Windows 10',
    permissions: ['system:user:list'],
    roles: ['admin'],
    deviceType: 'PC',
    user: {
      userId: 1,
      tenantId: '000000',
      deptId: 100,
      userName: 'testuser',
      nickName: '测试用户',
      userType: 'SYSTEM' as any,
      email: 'test@example.com',
      phonenumber: '13800138000',
      sex: 'MALE' as any,
      avatar: '',
      password: bcrypt.hashSync('oldpassword', 10),
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: '',
      dept: {
        tenantId: '000000',
        deptId: 100,
        parentId: 0,
        ancestors: '0',
        deptName: '测试部门',
        orderNum: 1,
        leader: 'admin',
        phone: '13800138000',
        email: 'test@example.com',
        status: 'NORMAL' as any,
        delFlag: 'NORMAL' as any,
        createBy: 'admin',
        createTime: new Date(),
        updateBy: 'admin',
        updateTime: new Date(),
        remark: '',
      },
      roles: [],
      posts: [],
    } as any,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: RedisService,
          useValue: MockServiceFactory.createRedisService(),
        },
        {
          provide: UserRepository,
          useValue: {
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    redis = module.get(RedisService);
    userRepo = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      const result = await service.profile(mockUser);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateDto = {
        nickName: '新昵称',
        email: 'newemail@example.com',
        phonenumber: '13900139000',
        sex: 'MALE',
      };

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({} as any);
      redis.get.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      const result = await service.updateProfile(mockUser, updateDto);

      expect(result.code).toBe(200);
      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { userId: mockUser.user.userId },
        data: updateDto,
      });
    });

    it('should update Redis cache after profile update', async () => {
      const updateDto = {
        nickName: '新昵称',
        email: 'test@example.com',
        phonenumber: '13800138000',
        sex: 'MALE',
      };

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({} as any);
      redis.get.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      await service.updateProfile(mockUser, updateDto);

      expect(redis.get).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should handle missing Redis cache gracefully', async () => {
      const updateDto = {
        nickName: '新昵称',
        email: 'test@example.com',
        phonenumber: '13800138000',
        sex: 'MALE',
      };

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({} as any);
      redis.get.mockResolvedValue(null);

      const result = await service.updateProfile(mockUser, updateDto);

      expect(result.code).toBe(200);
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('updatePwd', () => {
    it('should update password successfully', async () => {
      const updatePwdDto = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      userRepo.resetPassword.mockResolvedValue({} as any);

      const result = await service.updatePwd(mockUser, updatePwdDto);

      expect(result.code).toBe(200);
      expect(userRepo.resetPassword).toHaveBeenCalledWith(
        mockUser.user.userId,
        expect.any(String),
      );
    });

    it('should fail when new password equals old password', async () => {
      const updatePwdDto = {
        oldPassword: 'oldpassword',
        newPassword: 'oldpassword',
      };

      const result = await service.updatePwd(mockUser, updatePwdDto);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('新密码不能与旧密码相同');
    });

    it('should fail when old password is incorrect', async () => {
      const updatePwdDto = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      const result = await service.updatePwd(mockUser, updatePwdDto);

      expect(result.code).toBe(ResponseCode.OLD_PASSWORD_ERROR);
    });
  });

  describe('resetPwd', () => {
    it('should reset user password successfully', async () => {
      const resetPwdDto = {
        userId: 2,
        password: 'newpassword123',
      };

      userRepo.resetPassword.mockResolvedValue({} as any);

      const result = await service.resetPwd(resetPwdDto);

      expect(result.code).toBe(200);
      expect(userRepo.resetPassword).toHaveBeenCalledWith(
        resetPwdDto.userId,
        expect.any(String),
      );
    });

    it('should fail to reset password for system user (userId=1)', async () => {
      const resetPwdDto = {
        userId: 1,
        password: 'newpassword123',
      };

      const result = await service.resetPwd(resetPwdDto);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('系统用户不能重置密码');
    });

    it('should hash password before resetting', async () => {
      const resetPwdDto = {
        userId: 2,
        password: 'plainpassword',
      };

      userRepo.resetPassword.mockResolvedValue({} as any);

      await service.resetPwd(resetPwdDto);

      const callArgs = userRepo.resetPassword.mock.calls[0];
      expect(callArgs[1]).not.toBe('plainpassword');
      expect(callArgs[1]).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar successfully', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({} as any);
      redis.get.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      const result = await service.updateAvatar(mockUser, avatarUrl);

      expect(result.code).toBe(200);
      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { userId: mockUser.user.userId },
        data: { avatar: avatarUrl },
      });
    });

    it('should update Redis cache after avatar update', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({} as any);
      redis.get.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      await service.updateAvatar(mockUser, avatarUrl);

      expect(redis.get).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should handle missing Redis cache gracefully', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({} as any);
      redis.get.mockResolvedValue(null);

      const result = await service.updateAvatar(mockUser, avatarUrl);

      expect(result.code).toBe(200);
      expect(redis.set).not.toHaveBeenCalled();
    });
  });
});
