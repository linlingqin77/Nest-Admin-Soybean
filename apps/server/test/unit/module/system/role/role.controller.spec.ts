/** @file role.controller.spec.ts @description Migrated from src/modules/roles/role.controller.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '@/modules/roles/role.controller';
import { RoleService } from '@/modules/roles/role.service';
import { UserService } from '@/modules/users/user.service';
import { Result } from '@/shared/response';

// Mock decorators
jest.mock('@/core/audit/decorators/operlog.decorator', () => ({
  Operlog: () => () => {},
}));
jest.mock('@/core/http/decorators/require-premission.decorator', () => ({
  RequirePermission: () => () => {},
}));

describe('RoleController', () => {
  let controller: RoleController;
  let roleServiceMock: any;
  let userServiceMock: any;

  const mockUser = {
    userId: 1,
    user: { userId: 1, userName: 'admin' },
    roles: ['admin'],
    permissions: ['*:*:*'],
  };

  beforeEach(async () => {
    roleServiceMock = {
      create: jest.fn().mockResolvedValue(Result.ok()),
      findAll: jest.fn().mockResolvedValue(Result.ok({ rows: [], total: 0 })),
      findOne: jest.fn().mockResolvedValue(Result.ok({ roleId: 1 })),
      update: jest.fn().mockResolvedValue(Result.ok()),
      remove: jest.fn().mockResolvedValue(Result.ok()),
      changeStatus: jest.fn().mockResolvedValue(Result.ok()),
      dataScope: jest.fn().mockResolvedValue(Result.ok()),
      optionselect: jest.fn().mockResolvedValue(Result.ok([])),
      deptTree: jest.fn().mockResolvedValue(Result.ok({ checkedKeys: [], depts: [] })),
      export: jest.fn().mockResolvedValue(undefined),
    };

    userServiceMock = {
      allocatedList: jest.fn().mockResolvedValue(Result.ok({ rows: [], total: 0 })),
      unallocatedList: jest.fn().mockResolvedValue(Result.ok({ rows: [], total: 0 })),
      authUserCancel: jest.fn().mockResolvedValue(Result.ok()),
      authUserCancelAll: jest.fn().mockResolvedValue(Result.ok()),
      authUserSelectAll: jest.fn().mockResolvedValue(Result.ok()),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: RoleService, useValue: roleServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compile();

    controller = modules.get<RoleController>(RoleController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create role', async () => {
      const createDto = { roleName: 'Test Role', roleKey: 'test' };
      const userTool = { injectCreate: (dto: any) => ({ ...dto, createBy: 'admin' }) };

      const result = await controller.create(createDto as any, userTool as any);

      expect(result.code).toBe(200);
      expect(roleServiceMock.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return role list', async () => {
      const query = { pageNum: 1, pageSize: 10 };

      const result = await controller.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
      expect(roleServiceMock.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('optionselect', () => {
    it('should return role options', async () => {
      const result = await controller.optionselect();

      expect(result.code).toBe(200);
      expect(roleServiceMock.optionselect).toHaveBeenCalledWith(undefined);
    });

    it('should return role options with ids', async () => {
      const result = await controller.optionselect('1,2,3');

      expect(result.code).toBe(200);
      expect(roleServiceMock.optionselect).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('deptTree', () => {
    it('should return dept tree for role', async () => {
      const result = await controller.deptTree('1');

      expect(result.code).toBe(200);
      expect(roleServiceMock.deptTree).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return role detail', async () => {
      const result = await controller.findOne('1');

      expect(result.code).toBe(200);
      expect(roleServiceMock.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      const updateDto = { roleId: 1, roleName: 'Updated' };

      const result = await controller.update(updateDto as any);

      expect(result.code).toBe(200);
      expect(roleServiceMock.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('dataScope', () => {
    it('should update data scope', async () => {
      const updateDto = { roleId: 1, dataScope: '1' };

      const result = await controller.dataScope(updateDto as any);

      expect(result.code).toBe(200);
      expect(roleServiceMock.dataScope).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('changeStatus', () => {
    it('should change role status', async () => {
      const dto = { roleId: 1, status: '1' };

      const result = await controller.changeStatus(dto);

      expect(result.code).toBe(200);
      expect(roleServiceMock.changeStatus).toHaveBeenCalledWith(dto);
    });
  });

  describe('remove', () => {
    it('should remove roles', async () => {
      const result = await controller.remove('1,2,3');

      expect(result.code).toBe(200);
      expect(roleServiceMock.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('authUserAllocatedList', () => {
    it('should return allocated users', async () => {
      const query = { roleId: '1', pageNum: 1, pageSize: 10 };

      const result = await controller.authUserAllocatedList(query as any);

      expect(result.code).toBe(200);
      expect(userServiceMock.allocatedList).toHaveBeenCalledWith(query);
    });
  });

  describe('authUserUnAllocatedList', () => {
    it('should return unallocated users', async () => {
      const query = { roleId: '1', pageNum: 1, pageSize: 10 };

      const result = await controller.authUserUnAllocatedList(query as any);

      expect(result.code).toBe(200);
      expect(userServiceMock.unallocatedList).toHaveBeenCalledWith(query);
    });
  });

  describe('authUserCancel', () => {
    it('should cancel user auth', async () => {
      const dto = { userId: 1, roleId: 2 };

      const result = await controller.authUserCancel(dto);

      expect(result.code).toBe(200);
      expect(userServiceMock.authUserCancel).toHaveBeenCalledWith(dto);
    });
  });

  describe('authUserCancelAll', () => {
    it('should cancel all user auth', async () => {
      const dto = { userIds: '1,2,3', roleId: 2 };

      const result = await controller.authUserCancelAll(dto);

      expect(result.code).toBe(200);
      expect(userServiceMock.authUserCancelAll).toHaveBeenCalledWith(dto);
    });
  });

  describe('authUserSelectAll', () => {
    it('should select all user auth', async () => {
      const dto = { userIds: '1,2,3', roleId: 2 };

      const result = await controller.authUserSelectAll(dto);

      expect(result.code).toBe(200);
      expect(userServiceMock.authUserSelectAll).toHaveBeenCalledWith(dto);
    });
  });
});
