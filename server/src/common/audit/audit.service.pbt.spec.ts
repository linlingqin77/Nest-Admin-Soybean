import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditLogData, AuditLogRecord } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

/**
 * Property-Based Tests for AuditService
 *
 * Feature: enterprise-app-optimization
 * Property 6: 审计日志完整性
 * Validates: Requirements 4.4, 4.5
 *
 * For any operation marked for auditing, the audit log should contain:
 * operator, tenant, timestamp, IP, request parameters, and response status.
 */
describe('AuditService Property-Based Tests', () => {
  let service: AuditService;
  let mockPrismaService: any;
  let mockClsService: any;

  // Storage for captured audit logs
  let capturedLogs: AuditLogRecord[];
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

  /**
   * Property 6a: Audit Log Contains Required Fields
   *
   * For any audit log operation, the log record should contain all required fields:
   * action, module, status, tenantId, ip.
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6a: For any audit log, all required fields should be present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('CREATE', 'UPDATE', 'DELETE', 'QUERY', 'LOGIN', 'LOGOUT'),
        fc.constantFrom('system', 'monitor', 'upload', 'resource', 'auth'),
        fc.constantFrom('0', '1') as fc.Arbitrary<'0' | '1'>,
        fc.stringMatching(/^[0-9]{6}$/),
        fc.ipV4(),
        async (action, module, status, tenantId, ip) => {
          clsStore.set('user', { tenantId, userId: 1, userName: 'testuser' });
          clsStore.set('request', { ip, headers: { 'user-agent': 'test-agent' } });
          clsStore.set('requestId', 'test-request-id');

          const auditData: AuditLogData = { action, module, status };
          await service.logSync(auditData);

          if (capturedLogs.length === 0) return false;
          const log = capturedLogs[capturedLogs.length - 1];

          return (
            log.action === action &&
            log.module === module &&
            log.status === status &&
            log.tenantId === tenantId &&
            log.ip === ip
          );
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6b: Audit Log Preserves Target Information
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6b: For any audit log with target info, target should be preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('User', 'Role', 'Menu', 'Dept', 'Config', 'Tenant'),
        fc.integer({ min: 1, max: 100000 }).map(String),
        async (targetType, targetId) => {
          clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
          clsStore.set('request', { ip: '127.0.0.1', headers: {} });
          clsStore.set('requestId', 'test-request-id');

          const auditData: AuditLogData = {
            action: 'UPDATE',
            module: 'system',
            targetType,
            targetId,
            status: '0',
          };

          await service.logSync(auditData);
          const log = capturedLogs[capturedLogs.length - 1];

          return log.targetType === targetType && log.targetId === targetId;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6c: Audit Log Preserves Value Changes
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6c: For any audit log with value changes, values should be preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (oldValue, newValue) => {
          clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
          clsStore.set('request', { ip: '127.0.0.1', headers: {} });
          clsStore.set('requestId', 'test-request-id');

          const oldValueStr = JSON.stringify(oldValue);
          const newValueStr = JSON.stringify(newValue);

          const auditData: AuditLogData = {
            action: 'UPDATE',
            module: 'system',
            oldValue: oldValueStr,
            newValue: newValueStr,
            status: '0',
          };

          await service.logSync(auditData);
          const log = capturedLogs[capturedLogs.length - 1];

          return log.oldValue === oldValueStr && log.newValue === newValueStr;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6d: Audit Log Error Information
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6d: For any failed operation, error message should be preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        async (errorMsg) => {
          clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
          clsStore.set('request', { ip: '127.0.0.1', headers: {} });
          clsStore.set('requestId', 'test-request-id');

          const auditData: AuditLogData = {
            action: 'DELETE',
            module: 'system',
            status: '1',
            errorMsg,
          };

          await service.logSync(auditData);
          const log = capturedLogs[capturedLogs.length - 1];

          return log.status === '1' && log.errorMsg === errorMsg;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6e: Audit Log Duration Tracking
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6e: For any audit log with duration, duration should be non-negative', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 10000 }), async (duration) => {
        clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
        clsStore.set('request', { ip: '127.0.0.1', headers: {} });
        clsStore.set('requestId', 'test-request-id');

        const auditData: AuditLogData = {
          action: 'QUERY',
          module: 'system',
          status: '0',
          duration,
        };

        await service.logSync(auditData);
        const log = capturedLogs[capturedLogs.length - 1];

        return log.duration === duration && log.duration >= 0;
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6f: Audit Log Request ID Tracking
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6f: For any audit log, request ID should be included', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (requestId) => {
        clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
        clsStore.set('request', { ip: '127.0.0.1', headers: {} });
        clsStore.set('requestId', requestId);

        const auditData: AuditLogData = {
          action: 'CREATE',
          module: 'system',
          status: '0',
        };

        await service.logSync(auditData);
        const log = capturedLogs[capturedLogs.length - 1];

        return log.requestId === requestId;
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Property 6g: Audit Log User Agent Tracking
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it('Property 6g: For any audit log with user agent, it should be preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'PostmanRuntime/7.29.0',
          'curl/7.79.1',
        ),
        async (userAgent) => {
          clsStore.set('user', { tenantId: '000000', userId: 1, userName: 'admin' });
          clsStore.set('request', { ip: '127.0.0.1', headers: { 'user-agent': userAgent } });
          clsStore.set('requestId', 'test-request-id');

          const auditData: AuditLogData = {
            action: 'LOGIN',
            module: 'auth',
            status: '0',
          };

          await service.logSync(auditData);
          const log = capturedLogs[capturedLogs.length - 1];

          return log.userAgent === userAgent;
        },
      ),
      { numRuns: 50 },
    );
  });
});
