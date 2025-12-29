import { Test, TestingModule } from '@nestjs/testing';
import { UserExportService, UserExportData } from './user-export.service';
import { Response } from 'express';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import * as ExportUtils from 'src/common/utils/export';

// Mock the ExportTable function
jest.mock('src/common/utils/export', () => ({
  ExportTable: jest.fn(),
}));

describe('UserExportService', () => {
  let service: UserExportService;

  const mockUserData: UserExportData[] = [
    {
      userId: 1,
      tenantId: '000000',
      deptId: 100,
      userName: 'testuser1',
      nickName: '测试用户1',
      userType: 'NORMAL' as any,
      email: 'test1@example.com',
      phonenumber: '13800138001',
      sex: 'MALE' as any,
      avatar: '',
      password: 'hashed_password',
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      loginIp: '127.0.0.1',
      loginDate: new Date('2024-01-01'),
      createBy: 'admin',
      createTime: new Date('2024-01-01'),
      updateBy: 'admin',
      updateTime: new Date('2024-01-01'),
      remark: null,
      deptName: '测试部门',
      dept: {
        leader: '张三',
      },
    },
    {
      userId: 2,
      tenantId: '000000',
      deptId: 101,
      userName: 'testuser2',
      nickName: '测试用户2',
      userType: 'NORMAL' as any,
      email: 'test2@example.com',
      phonenumber: '13800138002',
      sex: 'FEMALE' as any,
      avatar: '',
      password: 'hashed_password',
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      loginIp: '127.0.0.2',
      loginDate: new Date('2024-01-02'),
      createBy: 'admin',
      createTime: new Date('2024-01-02'),
      updateBy: 'admin',
      updateTime: new Date('2024-01-02'),
      remark: null,
      deptName: '开发部门',
      dept: {
        leader: '李四',
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserExportService],
    }).compile();

    service = module.get<UserExportService>(UserExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('export', () => {
    it('should export user data to Excel', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const data = {
        rows: mockUserData,
        total: 2,
      };

      (ExportUtils.ExportTable as jest.Mock).mockResolvedValue(undefined);

      await service.export(mockResponse, data);

      expect(ExportUtils.ExportTable).toHaveBeenCalledWith(
        expect.objectContaining({
          sheetName: '用户数据',
          data: mockUserData,
          header: expect.arrayContaining([
            expect.objectContaining({ title: '用户序号', dataIndex: 'userId' }),
            expect.objectContaining({ title: '登录名称', dataIndex: 'userName' }),
            expect.objectContaining({ title: '用户昵称', dataIndex: 'nickName' }),
            expect.objectContaining({ title: '用户邮箱', dataIndex: 'email' }),
            expect.objectContaining({ title: '手机号码', dataIndex: 'phonenumber' }),
            expect.objectContaining({ title: '用户性别', dataIndex: 'sex' }),
            expect.objectContaining({ title: '账号状态', dataIndex: 'status' }),
            expect.objectContaining({ title: '最后登录IP', dataIndex: 'loginIp' }),
            expect.objectContaining({ title: '最后登录时间', dataIndex: 'loginDate' }),
            expect.objectContaining({ title: '部门', dataIndex: 'deptName' }),
            expect.objectContaining({ title: '部门负责人', dataIndex: 'dept.leader' }),
            expect.objectContaining({ title: '创建时间', dataIndex: 'createTime' }),
          ]),
        }),
        mockResponse,
      );
    });

    it('should export empty user data', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const data = {
        rows: [],
        total: 0,
      };

      (ExportUtils.ExportTable as jest.Mock).mockResolvedValue(undefined);

      await service.export(mockResponse, data);

      expect(ExportUtils.ExportTable).toHaveBeenCalledWith(
        expect.objectContaining({
          sheetName: '用户数据',
          data: [],
        }),
        mockResponse,
      );
    });

    it('should include all required columns in export', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const data = {
        rows: mockUserData,
        total: 2,
      };

      (ExportUtils.ExportTable as jest.Mock).mockResolvedValue(undefined);

      await service.export(mockResponse, data);

      const callArgs = (ExportUtils.ExportTable as jest.Mock).mock.calls[0][0];
      const headers = callArgs.header;

      expect(headers).toHaveLength(12);
      expect(headers.map((h: any) => h.dataIndex)).toEqual([
        'userId',
        'userName',
        'nickName',
        'email',
        'phonenumber',
        'sex',
        'status',
        'loginIp',
        'loginDate',
        'deptName',
        'dept.leader',
        'createTime',
      ]);
    });

    it('should set correct column widths for date fields', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const data = {
        rows: mockUserData,
        total: 2,
      };

      (ExportUtils.ExportTable as jest.Mock).mockResolvedValue(undefined);

      await service.export(mockResponse, data);

      const callArgs = (ExportUtils.ExportTable as jest.Mock).mock.calls[0][0];
      const headers = callArgs.header;

      const loginDateHeader = headers.find((h: any) => h.dataIndex === 'loginDate');
      const createTimeHeader = headers.find((h: any) => h.dataIndex === 'createTime');

      expect(loginDateHeader.width).toBe(20);
      expect(createTimeHeader.width).toBe(20);
    });
  });
});
