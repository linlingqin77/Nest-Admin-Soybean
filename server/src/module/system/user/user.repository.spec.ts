import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { DelFlagEnum } from 'src/common/enum/index';
import { SysUser } from '@prisma/client';

// Test data factory functions
const createUser = (overrides: Partial<SysUser> = {}): SysUser => ({
  userId: 1,
  tenantId: '000000',
  deptId: 100,
  userName: 'testuser',
  nickName: '测试用户',
  userType: '00',
  email: 'test@example.com',
  phonenumber: '13800138000',
  sex: '0',
  avatar: '',
  password: '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2',
  status: '0',
  delFlag: '0',
  loginIp: '127.0.0.1',
  loginDate: new Date(),
  createBy: 'admin',
  createTime: new Date(),
  updateBy: 'admin',
  updateTime: new Date(),
  remark: null,
  ...overrides,
});

const createUsers = (count: number): SysUser[] => {
  return Array.from({ length: count }, (_, index) =>
    createUser({
      userId: index + 1,
      userName: `testuser${index + 1}`,
      email: `test${index + 1}@example.com`,
    }),
  );
};

const createDeletedUser = (overrides: Partial<SysUser> = {}): SysUser =>
  createUser({ delFlag: '2', ...overrides });

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: PrismaMock;

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

  describe('CRUD Operations', () => {
    describe('findById', () => {
      it('should find user by id', async () => {
        const mockUser = createUser({ userId: 1 });
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.findById(1);

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
          where: { userId: 1, delFlag: '0' },
        });
      });

      it('should return null for non-existent user', async () => {
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await repository.findById(999);

        expect(result).toBeNull();
      });

      it('should pass options to findFirst', async () => {
        const mockUser = createUser({ userId: 1 });
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.findById(1, { include: { dept: true } });

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
          where: { userId: 1, delFlag: '0' },
          include: { dept: true },
        });
      });
    });

    describe('findOne', () => {
      it('should find user by condition with soft delete filter', async () => {
        const mockUser = createUser({ userName: 'testuser' });
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.findOne({ userName: 'testuser' });

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
          where: { userName: 'testuser', delFlag: '0' },
        });
      });

      it('should return null when no user matches', async () => {
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await repository.findOne({ userName: 'nonexistent' });

        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new user', async () => {
        const userData = {
          userName: 'newuser',
          nickName: 'New User',
          password: 'hashedpassword',
          tenantId: '000000',
        };
        const createdUser = createUser({ ...userData, userId: 10 });
        (prisma.sysUser.create as jest.Mock).mockResolvedValue(createdUser);

        const result = await repository.create(userData);

        expect(result).toEqual(createdUser);
        expect(prisma.sysUser.create).toHaveBeenCalledWith({
          data: userData,
        });
      });
    });

    describe('update', () => {
      it('should update user by id', async () => {
        const updateData = { nickName: 'Updated Name' };
        const updatedUser = createUser({ userId: 1, nickName: 'Updated Name' });
        (prisma.sysUser.update as jest.Mock).mockResolvedValue(updatedUser);

        const result = await repository.update(1, updateData);

        expect(result).toEqual(updatedUser);
        expect(prisma.sysUser.update).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: updateData,
        });
      });
    });

    describe('delete', () => {
      it('should hard delete user by id', async () => {
        const mockUser = createUser({ userId: 1 });
        (prisma.sysUser.delete as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.delete(1);

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.delete).toHaveBeenCalledWith({
          where: { userId: 1 },
        });
      });
    });

    describe('findAll', () => {
      it('should find all users with soft delete filter', async () => {
        const mockUsers = createUsers(3);
        (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

        const result = await repository.findAll({});

        expect(result).toEqual(mockUsers);
        expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
          where: { delFlag: '0' },
          include: undefined,
          select: undefined,
          orderBy: undefined,
        });
      });

      it('should merge where clause with default soft delete filter', async () => {
        const mockUsers = createUsers(2);
        (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

        const result = await repository.findAll({ where: { status: '0' } });

        expect(result).toEqual(mockUsers);
        expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
          where: { delFlag: '0', status: '0' },
          include: undefined,
          select: undefined,
          orderBy: undefined,
        });
      });
    });

    describe('count', () => {
      it('should count users with soft delete filter', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(5);

        const result = await repository.count({});

        expect(result).toBe(5);
        expect(prisma.sysUser.count).toHaveBeenCalledWith({
          where: { delFlag: '0' },
        });
      });
    });

    describe('exists', () => {
      it('should return true when user exists', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

        const result = await repository.exists({ userName: 'testuser' });

        expect(result).toBe(true);
        expect(prisma.sysUser.count).toHaveBeenCalledWith({
          where: { userName: 'testuser', delFlag: '0' },
        });
      });

      it('should return false when user does not exist', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

        const result = await repository.exists({ userName: 'nonexistent' });

        expect(result).toBe(false);
      });
    });
  });

  describe('Soft Delete Operations', () => {
    describe('softDelete', () => {
      it('should soft delete user by setting delFlag to 1', async () => {
        const softDeletedUser = createUser({ userId: 1, delFlag: '1' });
        (prisma.sysUser.update as jest.Mock).mockResolvedValue(softDeletedUser);

        const result = await repository.softDelete(1);

        expect(result).toEqual(softDeletedUser);
        expect(prisma.sysUser.update).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: { delFlag: '1' },
        });
      });
    });

    describe('softDeleteBatch', () => {
      it('should soft delete multiple users', async () => {
        (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

        const result = await repository.softDeleteBatch([1, 2, 3]);

        expect(result).toBe(3);
        expect(prisma.sysUser.updateMany).toHaveBeenCalledWith({
          where: {
            userId: { in: [1, 2, 3] },
            delFlag: DelFlagEnum.NORMAL,
          },
          data: { delFlag: '2' },
        });
      });

      it('should return 0 when no users to delete', async () => {
        (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

        const result = await repository.softDeleteBatch([]);

        expect(result).toBe(0);
      });
    });
  });

  describe('Custom Query Methods', () => {
    describe('findByUserName', () => {
      it('should find user by username', async () => {
        const mockUser = createUser({ userName: 'admin' });
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.findByUserName('admin');

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
          where: { userName: 'admin', delFlag: DelFlagEnum.NORMAL },
        });
      });

      it('should return null for non-existent username', async () => {
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await repository.findByUserName('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('findByPhoneNumber', () => {
      it('should find user by phone number', async () => {
        const mockUser = createUser({ phonenumber: '13800138000' });
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.findByPhoneNumber('13800138000');

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
          where: { phonenumber: '13800138000', delFlag: DelFlagEnum.NORMAL },
        });
      });
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const mockUser = createUser({ email: 'test@example.com' });
        (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await repository.findByEmail('test@example.com');

        expect(result).toEqual(mockUser);
        expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
          where: { email: 'test@example.com', delFlag: DelFlagEnum.NORMAL },
        });
      });
    });

    describe('existsByUserName', () => {
      it('should return true when username exists', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

        const result = await repository.existsByUserName('admin');

        expect(result).toBe(true);
        expect(prisma.sysUser.count).toHaveBeenCalledWith({
          where: { userName: 'admin', delFlag: DelFlagEnum.NORMAL },
        });
      });

      it('should exclude specific user when checking', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

        const result = await repository.existsByUserName('admin', 1);

        expect(result).toBe(false);
        expect(prisma.sysUser.count).toHaveBeenCalledWith({
          where: { userName: 'admin', delFlag: DelFlagEnum.NORMAL, userId: { not: 1 } },
        });
      });
    });

    describe('existsByPhoneNumber', () => {
      it('should return true when phone number exists', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

        const result = await repository.existsByPhoneNumber('13800138000');

        expect(result).toBe(true);
      });

      it('should exclude specific user when checking', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

        const result = await repository.existsByPhoneNumber('13800138000', 1);

        expect(result).toBe(false);
        expect(prisma.sysUser.count).toHaveBeenCalledWith({
          where: { phonenumber: '13800138000', delFlag: DelFlagEnum.NORMAL, userId: { not: 1 } },
        });
      });
    });

    describe('existsByEmail', () => {
      it('should return true when email exists', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

        const result = await repository.existsByEmail('test@example.com');

        expect(result).toBe(true);
      });

      it('should exclude specific user when checking', async () => {
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

        const result = await repository.existsByEmail('test@example.com', 1);

        expect(result).toBe(false);
        expect(prisma.sysUser.count).toHaveBeenCalledWith({
          where: { email: 'test@example.com', delFlag: DelFlagEnum.NORMAL, userId: { not: 1 } },
        });
      });
    });

    describe('findPageWithDept', () => {
      it('should find users with pagination and department info', async () => {
        const mockUsers = createUsers(2);
        const mockDepts = [{ deptId: 100, deptName: 'Test Dept' }];

        (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(10);
        (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

        const result = await repository.findPageWithDept({ delFlag: '0' }, 0, 10);

        expect(result.list).toHaveLength(2);
        expect(result.total).toBe(10);
      });

      it('should use custom orderBy when provided', async () => {
        (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

        await repository.findPageWithDept({ delFlag: '0' }, 0, 10, { userName: 'asc' });

        expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { userName: 'asc' },
          }),
        );
      });
    });

    describe('updateLoginTime', () => {
      it('should update user login time', async () => {
        (prisma.sysUser.update as jest.Mock).mockResolvedValue({});

        await repository.updateLoginTime(1);

        expect(prisma.sysUser.update).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: { loginDate: expect.any(Date) },
        });
      });
    });

    describe('resetPassword', () => {
      it('should reset user password', async () => {
        (prisma.sysUser.update as jest.Mock).mockResolvedValue({});

        await repository.resetPassword(1, 'newhashedpassword');

        expect(prisma.sysUser.update).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: { password: 'newhashedpassword' },
        });
      });
    });
  });
});
