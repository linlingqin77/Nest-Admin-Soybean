import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockUser = {
    userId: 1,
    tenantId: '000000',
    deptId: 100,
    userName: 'admin',
    nickName: '管理员',
    userType: 'SYSTEM' as any,
    email: 'admin@example.com',
    phonenumber: '13800138000',
    sex: 'MALE' as any,
    avatar: '',
    password: 'hashedpassword',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    loginIp: '127.0.0.1',
    loginDate: new Date(),
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserName', () => {
    it('should find user by username', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findByUserName('admin');

      expect(result).toEqual(mockUser);
      expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
        where: { userName: 'admin', delFlag: DelFlagEnum.NORMAL },
      });
    });

    it('should return null when user not found', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByUserName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByPhoneNumber', () => {
    it('should find user by phone number', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findByPhoneNumber('13800138000');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByPhoneNumber('00000000000');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findByEmail('admin@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('existsByUserName', () => {
    it('should return true when username exists', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByUserName('admin');

      expect(result).toBe(true);
    });

    it('should return false when username does not exist', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByUserName('nonexistent');

      expect(result).toBe(false);
    });

    it('should exclude specific user id', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByUserName('admin', 1);

      expect(result).toBe(false);
      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: {
          userName: 'admin',
          delFlag: DelFlagEnum.NORMAL,
          userId: { not: 1 },
        },
      });
    });
  });

  describe('existsByPhoneNumber', () => {
    it('should return true when phone number exists', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByPhoneNumber('13800138000');

      expect(result).toBe(true);
    });

    it('should return false when phone number does not exist', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByPhoneNumber('00000000000');

      expect(result).toBe(false);
    });

    it('should exclude specific user id', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByPhoneNumber('13800138000', 1);

      expect(result).toBe(false);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByEmail('admin@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should exclude specific user id', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByEmail('admin@example.com', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPageWithDept', () => {
    it('should return paginated users with dept info', async () => {
      const mockUsersWithDept = [
        { ...mockUser, dept: { deptId: 100, deptName: '测试部门' } },
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue([mockUsersWithDept, 1]);

      const result = await repository.findPageWithDept(
        { delFlag: DelFlagEnum.NORMAL },
        0,
        10
      );

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.list[0].dept?.deptName).toBe('测试部门');
    });

    it('should use custom orderBy', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await repository.findPageWithDept(
        { delFlag: DelFlagEnum.NORMAL },
        0,
        10,
        { userName: 'asc' }
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('updateLoginTime', () => {
    it('should update user login time', async () => {
      (prisma.sysUser.update as jest.Mock).mockResolvedValue(mockUser);

      await repository.updateLoginTime(1);

      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { loginDate: expect.any(Date) },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      (prisma.sysUser.update as jest.Mock).mockResolvedValue(mockUser);

      await repository.resetPassword(1, 'newhashedpassword');

      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { password: 'newhashedpassword' },
      });
    });
  });

  describe('softDeleteBatch', () => {
    it('should soft delete multiple users', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.softDeleteBatch([1, 2]);

      expect(result).toBe(2);
      expect(prisma.sysUser.updateMany).toHaveBeenCalledWith({
        where: {
          userId: { in: [1, 2] },
          delFlag: DelFlagEnum.NORMAL,
        },
        data: { delFlag: DelFlagEnum.DELETED },
      });
    });

    it('should return 0 when no users deleted', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await repository.softDeleteBatch([999]);

      expect(result).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findById(1);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user is soft deleted', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        delFlag: DelFlagEnum.DELETED,
      });

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        userName: 'newuser',
        nickName: '新用户',
        password: 'hashedpassword',
        deptId: 100,
      };

      (prisma.sysUser.create as jest.Mock).mockResolvedValue({ ...mockUser, ...createData });

      const result = await repository.create(createData as any);

      expect(result.userName).toBe('newuser');
      expect(prisma.sysUser.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData = { nickName: '更新后的昵称' };

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({ ...mockUser, ...updateData });

      const result = await repository.update(1, updateData);

      expect(result.nickName).toBe('更新后的昵称');
    });
  });
});
