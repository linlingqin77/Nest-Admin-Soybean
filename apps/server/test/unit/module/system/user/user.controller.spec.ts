/**
 * @file user.controller.spec.ts
 * @description Migrated from src/modules/users/user.controller.spec.ts
 * Unit tests for UserController
 */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '@/modules/users/user.controller';
import { UserService } from '@/modules/users/user.service';
import { UploadService } from '@/modules/files/upload.service';
import { Result } from '@/shared/response';

// Mock decorators
jest.mock('@/core/audit/decorators/operlog.decorator', () => ({
  Operlog: () => () => {},
}));
jest.mock('@/core/http/decorators/require-premission.decorator', () => ({
  RequirePermission: () => () => {},
}));
jest.mock('@/core/http/decorators/require-role.decorator', () => ({
  RequireRole: () => () => {},
}));

describe('UserController', () => {
  let controller: UserController;
  let userServiceMock: any;
  let uploadServiceMock: any;

  const mockUser = {
    userId: 1,
    user: { userId: 1, userName: 'admin', password: 'hashed' },
    roles: ['admin'],
    permissions: ['*:*:*'],
    token: 'test-token',
  };

  beforeEach(async () => {
    userServiceMock = {
      findAll: jest.fn().mockResolvedValue(Result.ok({ rows: [], total: 0 })),
      findOne: jest.fn().mockResolvedValue(Result.ok({ userId: 1 })),
      create: jest.fn().mockResolvedValue(Result.ok()),
      update: jest.fn().mockResolvedValue(Result.ok()),
      remove: jest.fn().mockResolvedValue(Result.ok()),
      updateProfile: jest.fn().mockResolvedValue(Result.ok()),
      updatePwd: jest.fn().mockResolvedValue(Result.ok()),
      resetPwd: jest.fn().mockResolvedValue(Result.ok()),
      changeStatus: jest.fn().mockResolvedValue(Result.ok()),
      deptTree: jest.fn().mockResolvedValue(Result.ok([])),
      findPostAndRoleAll: jest.fn().mockResolvedValue(Result.ok({ posts: [], roles: [] })),
      authRole: jest.fn().mockResolvedValue(Result.ok({ user: {}, roles: [] })),
      updateAuthRole: jest.fn().mockResolvedValue(Result.ok()),
      optionselect: jest.fn().mockResolvedValue(Result.ok([])),
      findByDeptId: jest.fn().mockResolvedValue(Result.ok([])),
      batchCreate: jest.fn().mockResolvedValue(Result.ok({ success: [], failed: [] })),
      batchDelete: jest.fn().mockResolvedValue(Result.ok({ success: [], failed: [] })),
      export: jest.fn().mockResolvedValue(undefined),
    };

    uploadServiceMock = {
      singleFileUpload: jest.fn().mockResolvedValue({ fileName: 'avatar.jpg' }),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: UploadService, useValue: uploadServiceMock },
      ],
    }).compile();

    controller = modules.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInfo', () => {
    it('should return user info without password', () => {
      const result = controller.getInfo(mockUser as any);

      expect(result.code).toBe(200);
      expect(result.data.user).not.toHaveProperty('password');
      expect(result.data.roles).toEqual(['admin']);
      expect(result.data.permissions).toEqual(['*:*:*']);
    });
  });

  describe('profile', () => {
    it('should return user profile', () => {
      const result = controller.profile(mockUser as any);

      expect(result.code).toBe(200);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { nickName: 'New Name', email: 'test@test.com', phonenumber: '13800138000', sex: '0' };

      const result = await controller.updateProfile(mockUser as any, updateDto);

      expect(result.code).toBe(200);
      expect(userServiceMock.updateProfile).toHaveBeenCalledWith(mockUser, updateDto);
    });
  });

  describe('avatar', () => {
    it('should upload avatar', async () => {
      const file = { originalname: 'avatar.jpg' } as Express.Multer.File;

      const result = await controller.avatar(file, mockUser as any);

      expect(result.code).toBe(200);
      expect(result.data.imgUrl).toBe('avatar.jpg');
    });
  });

  describe('updatePwd', () => {
    it('should update password', async () => {
      const updateDto = { oldPassword: 'old', newPassword: 'new' };

      const result = await controller.updatePwd(mockUser as any, updateDto);

      expect(result.code).toBe(200);
      expect(userServiceMock.updatePwd).toHaveBeenCalledWith(mockUser, updateDto);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const createDto = { userName: 'newuser', password: 'password' };
      const userTool = { injectCreate: (dto: any) => ({ ...dto, createBy: 'admin' }) };

      const result = await controller.create(createDto as any, userTool as any);

      expect(result.code).toBe(200);
    });
  });

  describe('findAll', () => {
    it('should return user list', async () => {
      const query = { pageNum: 1, pageSize: 10 };

      const result = await controller.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
      expect(userServiceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('deptTree', () => {
    it('should return dept tree', async () => {
      const result = await controller.deptTree();

      expect(result.code).toBe(200);
      expect(userServiceMock.deptTree).toHaveBeenCalled();
    });
  });

  describe('findPostAndRoleAll', () => {
    it('should return posts and roles', async () => {
      const result = await controller.findPostAndRoleAll();

      expect(result.code).toBe(200);
      expect(userServiceMock.findPostAndRoleAll).toHaveBeenCalled();
    });
  });

  describe('authRole', () => {
    it('should return auth role info', async () => {
      const result = await controller.authRole('1');

      expect(result.code).toBe(200);
      expect(userServiceMock.authRole).toHaveBeenCalledWith(1);
    });
  });

  describe('updateAuthRole', () => {
    it('should update auth role', async () => {
      const query = { userId: 1, roleIds: '1,2' };

      const result = await controller.updateAuthRole(query);

      expect(result.code).toBe(200);
      expect(userServiceMock.updateAuthRole).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return user detail', async () => {
      const result = await controller.findOne('1');

      expect(result.code).toBe(200);
      expect(userServiceMock.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('changeStatus', () => {
    it('should change user status', async () => {
      const dto = { userId: 1, status: '1' };

      const result = await controller.changeStatus(dto);

      expect(result.code).toBe(200);
      expect(userServiceMock.changeStatus).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateDto = { userId: 1, userName: 'updated' };

      const result = await controller.update(updateDto as any, mockUser as any);

      expect(result.code).toBe(200);
      expect(userServiceMock.update).toHaveBeenCalled();
    });
  });

  describe('resetPwd', () => {
    it('should reset password', async () => {
      const dto = { userId: 2, password: 'newpass' };

      const result = await controller.resetPwd(dto);

      expect(result.code).toBe(200);
      expect(userServiceMock.resetPwd).toHaveBeenCalledWith(dto);
    });
  });

  describe('remove', () => {
    it('should remove users', async () => {
      const result = await controller.remove('1,2,3');

      expect(result.code).toBe(200);
      expect(userServiceMock.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('batchCreate', () => {
    it('should batch create users', async () => {
      const dto = { users: [{ userName: 'user1' }] };

      const result = await controller.batchCreate(dto as any);

      expect(result.code).toBe(200);
      expect(userServiceMock.batchCreate).toHaveBeenCalledWith(dto);
    });
  });

  describe('batchDelete', () => {
    it('should batch delete users', async () => {
      const dto = { userIds: [1, 2] };

      const result = await controller.batchDelete(dto as any);

      expect(result.code).toBe(200);
      expect(userServiceMock.batchDelete).toHaveBeenCalledWith(dto);
    });
  });

  describe('optionselect', () => {
    it('should return user options', async () => {
      const result = await controller.optionselect();

      expect(result.code).toBe(200);
      expect(userServiceMock.optionselect).toHaveBeenCalled();
    });
  });

  describe('findByDeptId', () => {
    it('should return users by dept', async () => {
      const result = await controller.findByDeptId('100');

      expect(result.code).toBe(200);
      expect(userServiceMock.findByDeptId).toHaveBeenCalledWith(100);
    });
  });
});
