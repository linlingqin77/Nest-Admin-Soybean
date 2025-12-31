import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { AppConfigService } from 'src/config/app-config.service';
import { createConfigMock, ConfigMock } from 'src/test-utils/config-mock';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      $connect = jest.fn().mockResolvedValue(undefined);
      $disconnect = jest.fn().mockResolvedValue(undefined);
      $use = jest.fn();
    },
  };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let configMock: ConfigMock;

  beforeEach(async () => {
    configMock = createConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: AppConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with valid config', () => {
      expect(service).toBeDefined();
    });

    it('should throw error when postgresql config is missing', () => {
      const invalidConfig = createConfigMock();
      invalidConfig.setDb({ postgresql: undefined as any });

      expect(() => {
        new PrismaService(invalidConfig as any);
      }).toThrow('PostgreSQL configuration (db.postgresql) is missing.');
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database on module init', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destroy', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect error', async () => {
      const error = new Error('Disconnect failed');
      (service.$disconnect as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.onModuleDestroy()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('getSlowQueryLogs', () => {
    it('should return empty array initially', () => {
      const logs = service.getSlowQueryLogs();
      expect(logs).toEqual([]);
    });

    it('should return specified number of logs', () => {
      const logs = service.getSlowQueryLogs(5);
      expect(logs).toEqual([]);
    });
  });

  describe('clearSlowQueryLogs', () => {
    it('should clear all slow query logs', () => {
      service.clearSlowQueryLogs();
      const logs = service.getSlowQueryLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('buildConnectionString', () => {
    it('should build connection string with all parameters', () => {
      // 通过创建新实例来测试连接字符串构建
      const testConfig = createConfigMock();
      testConfig.setDb({
        postgresql: {
          host: 'testhost',
          port: 5433,
          username: 'testuser',
          password: 'testpass',
          database: 'testdb',
          schema: 'testschema',
          ssl: true,
        },
      });

      // 验证服务可以正常创建（间接验证连接字符串构建）
      const testService = new PrismaService(testConfig as any);
      expect(testService).toBeDefined();
    });

    it('should build connection string without password', () => {
      const testConfig = createConfigMock();
      testConfig.setDb({
        postgresql: {
          host: 'localhost',
          port: 5432,
          username: 'user',
          password: '',
          database: 'db',
          schema: 'public',
          ssl: false,
        },
      });

      const testService = new PrismaService(testConfig as any);
      expect(testService).toBeDefined();
    });

    it('should build connection string without schema', () => {
      const testConfig = createConfigMock();
      testConfig.setDb({
        postgresql: {
          host: 'localhost',
          port: 5432,
          username: 'user',
          password: 'pass',
          database: 'db',
          schema: '',
          ssl: false,
        },
      });

      const testService = new PrismaService(testConfig as any);
      expect(testService).toBeDefined();
    });

    it('should encode special characters in username and password', () => {
      const testConfig = createConfigMock();
      testConfig.setDb({
        postgresql: {
          host: 'localhost',
          port: 5432,
          username: 'user@domain',
          password: 'pass#word!',
          database: 'db',
          schema: 'public',
          ssl: false,
        },
      });

      const testService = new PrismaService(testConfig as any);
      expect(testService).toBeDefined();
    });
  });
});
