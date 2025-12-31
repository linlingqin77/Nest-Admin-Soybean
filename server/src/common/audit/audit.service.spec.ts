import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditLogData } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

describe('AuditService', () => {
  let service: AuditService;
  let mockPrismaService: any;
  let mockClsService: any;
  let capturedLogs: any[];
  let clsStore: Map<string, unknown>;

  beforeEach(async () => {
    capturedLogs = [];
    clsStore = new Map();

    mockPrismaService = {
      sysAuditLog: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          capturedLogs.push(data);
          return { id: capturedLogs.length, ...data };
        }),
        createMany: jest.fn().mockImplementation(async ({ data }) => {
          capturedLogs.push(...data);
          return { count: data.length };
        }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    mockClsService = {
      get: jest.fn().mockImplementation((key: string) => clsStore.get(key)),
      set: jest.fn().mockImplementation((key: string, value: unknown) => {
        clsStore.set(key, value);
      }),
      getId: jest.fn().mockReturnValue('test-request-id'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    jest.clearAllMocks();
    capturedLogs = [];
    clsStore.clear();
  });

  describe('logSync', () => {
    it('should create audit log with all fields', async () => {
      clsStore.set('user', { tenantId: '000001', userId: 1, userName: 'admin' });
      clsStore.set('request', { ip: '192.168.1.1', headers: { 'user-agent': 'test-agent' } });
      clsStore.set('requestId', 'req-123');

      const auditData: AuditLogData = {
        action: 'CREATE',
        module: 'system',
        targetType: 'User',
        targetId: '100',
        status: '0',
        duration: 150,
      };

      await service.logSync(auditData);

      expect(mockPrismaService.sysAuditLog.create).toHaveBeenCalledTimes(1);
      expect(capturedLogs).toHaveLength(1);
      expect(capturedLogs[0]).toMatchObject({
        action: 'CREATE',
        module: 'system',
        targetType: 'User',
        targetId: '100',
        status: '0',
        duration: 150,
        tenantId: '000001',
        userId: 1,
        userName: 'admin',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        requestId: 'req-123',
      });
    });

    it('should use default values when CLS context is empty', async () => {
      const auditData: AuditLogData = {
        action: 'QUERY',
        module: 'monitor',
        status: '0',
      };

      await service.logSync(auditData);

      expect(capturedLogs[0]).toMatchObject({
        action: 'QUERY',
        module: 'monitor',
        status: '0',
        tenantId: '000000',
        ip: '0.0.0.0',
      });
    });

    it('should preserve error message for failed operations', async () => {
      clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
      clsStore.set('request', { ip: '127.0.0.1', headers: {} });

      const auditData: AuditLogData = {
        action: 'DELETE',
        module: 'system',
        status: '1',
        errorMsg: 'Permission denied',
      };

      await service.logSync(auditData);

      expect(capturedLogs[0]).toMatchObject({
        status: '1',
        errorMsg: 'Permission denied',
      });
    });
  });

  describe('log (async)', () => {
    it('should add log to queue', async () => {
      clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
      clsStore.set('request', { ip: '127.0.0.1', headers: {} });

      const auditData: AuditLogData = {
        action: 'UPDATE',
        module: 'system',
        status: '0',
      };

      await service.log(auditData);

      expect(service.getQueueLength()).toBe(1);
    });
  });

  describe('flush', () => {
    it('should batch write logs from queue', async () => {
      clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
      clsStore.set('request', { ip: '127.0.0.1', headers: {} });

      // Add multiple logs
      await service.log({ action: 'CREATE', module: 'system', status: '0' });
      await service.log({ action: 'UPDATE', module: 'system', status: '0' });
      await service.log({ action: 'DELETE', module: 'system', status: '0' });

      expect(service.getQueueLength()).toBe(3);

      await service.flush();

      expect(mockPrismaService.sysAuditLog.createMany).toHaveBeenCalledTimes(1);
      expect(service.getQueueLength()).toBe(0);
    });

    it('should do nothing when queue is empty', async () => {
      await service.flush();

      expect(mockPrismaService.sysAuditLog.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should query audit logs with filters', async () => {
      mockPrismaService.sysAuditLog.findMany.mockResolvedValue([
        { id: 1, action: 'CREATE', module: 'system' },
      ]);
      mockPrismaService.sysAuditLog.count.mockResolvedValue(1);

      const result = await service.findAll({
        tenantId: '000001',
        action: 'CREATE',
        pageNum: 1,
        pageSize: 10,
      });

      expect(result).toEqual({
        rows: [{ id: 1, action: 'CREATE', module: 'system' }],
        total: 1,
      });
      expect(mockPrismaService.sysAuditLog.findMany).toHaveBeenCalled();
    });

    it('should support date range filtering', async () => {
      mockPrismaService.sysAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.sysAuditLog.count.mockResolvedValue(0);

      const startTime = new Date('2024-01-01');
      const endTime = new Date('2024-12-31');

      await service.findAll({ startTime, endTime });

      expect(mockPrismaService.sysAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createTime: {
              gte: startTime,
              lte: endTime,
            },
          }),
        }),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should flush remaining logs on destroy', async () => {
      clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
      clsStore.set('request', { ip: '127.0.0.1', headers: {} });

      await service.log({ action: 'CREATE', module: 'system', status: '0' });
      await service.log({ action: 'UPDATE', module: 'system', status: '0' });

      expect(service.getQueueLength()).toBe(2);

      await service.onModuleDestroy();

      expect(service.getQueueLength()).toBe(0);
    });
  });

  describe('timer control', () => {
    it('should start and stop timer', () => {
      service.startTimer();
      service.stopTimer();
      // No error should be thrown
    });
  });
});
