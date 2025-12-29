import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UploadService } from 'src/module/upload/upload.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import { UserDto } from './user.decorator';
import { plainToInstance } from 'class-transformer';
import { ListUserDto } from './dto/list-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let uploadService: jest.Mocked<UploadService>;

  const mockUser: UserDto = {
    userId: 1,
    userName: 'testuser',
    deptId: 100,
    token: 'test-token',
    browser: 'Chrome',
    ipaddr: '127.0.0.1',
    loginLocation: '内网IP',
    loginTime: new Date(),
    os: 'Windows 10',
    deviceType: 'PC',
    roles: ['admin'],
    permissions: ['system:user:list'],
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
      password: 'hashed_password',
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
      dept: null,
      roles: [],
      posts: [],
    } as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            updateProfile: jest.fn(),
            updatePwd: jest.fn(),
            resetPwd: jest.fn(),
            changeStatus: jest.fn(),
            deptTree: jest.fn(),
            findPostAndRoleAll: jest.fn(),
            authRole: jest.fn(),
            updateAuthRole: jest.fn(),
            optionselect: jest.fn(),
            findByDeptId: jest.fn(),
            export: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            singleFileUpload: jest.fn(),
          },
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    uploadService = module.get(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInfo', () => {
    it('should return current user info', () => {
      const result = controller.getInfo(mockUser);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('roles');
      expect(result.data).toHaveProperty('permissions');
      expect(result.data.user).not.toHaveProperty('password');
    });
  });

  describe('profile', () => {
    it('should return user profile', () => {
      const result = controller.profile(mockUser);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUser.user);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { nickName: '新昵称', email: 'new@example.com', phonenumber: '13800138001', sex: 'MALE' as any };
      userService.updateProfile.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.updateProfile(mockUser, updateDto);

      expect(result.code).toBe(200);
      expect(userService.updateProfile).toHaveBeenCalledWith(mockUser, updateDto);
    });
  });

  describe('avatar', () => {
    it('should upload user avatar', async () => {
      const mockFile = {
        fieldname: 'avatarfile',
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      uploadService.singleFileUpload.mockResolvedValue({ fileName: 'avatar.jpg' } as any);

      const result = await controller.avatar(mockFile, mockUser);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('imgUrl', 'avatar.jpg');
      expect(uploadService.singleFileUpload).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('updatePwd', () => {
    it('should update user password', async () => {
      const updatePwdDto = { oldPassword: 'old123', newPassword: 'new123' };
      userService.updatePwd.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.updatePwd(mockUser, updatePwdDto);

      expect(result.code).toBe(200);
      expect(userService.updatePwd).toHaveBeenCalledWith(mockUser, updatePwdDto);
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const createDto = {
        userName: 'newuser',
        nickName: '新用户',
        password: 'password123',
        email: 'newuser@example.com',
        deptId: 100,
        roleIds: [2],
        postIds: [1],
      };
      const userTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) } as any;
      userService.create.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.create(createDto, userTool);

      expect(result.code).toBe(200);
      expect(userService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return user list', async () => {
      const query = plainToInstance(ListUserDto, { pageNum: 1, pageSize: 10 });
      const mockResult = {
        code: 200,
        data: { rows: [mockUser.user], total: 1 },
      };
      userService.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll(query, mockUser);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(userService.findAll).toHaveBeenCalledWith(query, mockUser.user);
    });
  });

  describe('deptTree', () => {
    it('should return department tree', async () => {
      const mockTree = {
        code: 200,
        data: [{ id: 100, label: '测试部门', children: [] }],
      };
      userService.deptTree.mockResolvedValue(mockTree as any);

      const result = await controller.deptTree();

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findPostAndRoleAll', () => {
    it('should return posts and roles', async () => {
      const mockResult = {
        code: 200,
        data: { posts: [], roles: [] },
      };
      userService.findPostAndRoleAll.mockResolvedValue(mockResult as any);

      const result = await controller.findPostAndRoleAll();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('posts');
      expect(result.data).toHaveProperty('roles');
    });
  });

  describe('authRole', () => {
    it('should return user role authorization info', async () => {
      const mockResult = {
        code: 200,
        data: { roles: [], user: mockUser.user },
      };
      userService.authRole.mockResolvedValue(mockResult as any);

      const result = await controller.authRole('1');

      expect(result.code).toBe(200);
      expect(userService.authRole).toHaveBeenCalledWith(1);
    });
  });

  describe('updateAuthRole', () => {
    it('should update user role authorization', async () => {
      const query = { userId: 1, roleIds: '2,3' };
      userService.updateAuthRole.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.updateAuthRole(query);

      expect(result.code).toBe(200);
      expect(userService.updateAuthRole).toHaveBeenCalledWith(query);
    });
  });

  describe('optionselect', () => {
    it('should return user option list', async () => {
      const mockResult = {
        code: 200,
        data: [{ userId: 1, userName: 'testuser' }],
      };
      userService.optionselect.mockResolvedValue(mockResult as any);

      const result = await controller.optionselect();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('findByDeptId', () => {
    it('should return users by department', async () => {
      const mockResult = {
        code: 200,
        data: [mockUser.user],
      };
      userService.findByDeptId.mockResolvedValue(mockResult as any);

      const result = await controller.findByDeptId('100');

      expect(result.code).toBe(200);
      expect(userService.findByDeptId).toHaveBeenCalledWith(100);
    });
  });

  describe('findOne', () => {
    it('should return user detail', async () => {
      const mockResult = {
        code: 200,
        data: mockUser.user,
      };
      userService.findOne.mockResolvedValue(mockResult as any);

      const result = await controller.findOne('1');

      expect(result.code).toBe(200);
      expect(userService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('changeStatus', () => {
    it('should change user status', async () => {
      const changeStatusDto = { userId: 1, status: StatusEnum.DISABLED };
      userService.changeStatus.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.changeStatus(changeStatusDto);

      expect(result.code).toBe(200);
      expect(userService.changeStatus).toHaveBeenCalledWith(changeStatusDto);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateDto = {
        userId: 1,
        nickName: '新昵称',
        email: 'new@example.com',
      };
      userService.update.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.update(updateDto, mockUser);

      expect(result.code).toBe(200);
      expect(userService.update).toHaveBeenCalledWith(updateDto, mockUser.userId);
    });
  });

  describe('resetPwd', () => {
    it('should reset user password', async () => {
      const resetPwdDto = { userId: 2, password: 'newpassword' };
      userService.resetPwd.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.resetPwd(resetPwdDto);

      expect(result.code).toBe(200);
      expect(userService.resetPwd).toHaveBeenCalledWith(resetPwdDto);
    });
  });

  describe('remove', () => {
    it('should delete users', async () => {
      userService.remove.mockResolvedValue({ code: 200, msg: '操作成功' } as any);

      const result = await controller.remove('1,2,3');

      expect(result.code).toBe(200);
      expect(userService.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('export', () => {
    it('should export users to Excel', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      const query = plainToInstance(ListUserDto, { pageNum: 1, pageSize: 10 });
      userService.export.mockResolvedValue(undefined);

      await controller.export(mockResponse, query, mockUser);

      expect(userService.export).toHaveBeenCalledWith(mockResponse, query, mockUser.user);
    });
  });
});
