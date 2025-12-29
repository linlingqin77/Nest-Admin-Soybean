import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/module/common/redis/redis.service';
import { AppConfigService } from 'src/config/app-config.service';

/**
 * Mock 服务工厂
 * 
 * @description
 * 提供统一的 Mock 服务创建方法，用于单元测试中隔离外部依赖
 * 
 * @example
 * ```typescript
 * const prisma = MockServiceFactory.createPrismaService();
 * const redis = MockServiceFactory.createRedisService();
 * ```
 */
export class MockServiceFactory {
  /**
   * 创建 PrismaService Mock
   * 
   * @description
   * 创建包含所有 Prisma 模型方法的 Mock 对象
   * 每个方法都是 jest.fn()，可以配置返回值和验证调用
   */
  static createPrismaService(): jest.Mocked<PrismaClient> {
    const mockPrismaModel = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      upsert: jest.fn(),
    };

    return {
      // System models
      sysUser: { ...mockPrismaModel },
      sysDept: { ...mockPrismaModel },
      sysRole: { ...mockPrismaModel },
      sysMenu: { ...mockPrismaModel },
      sysPost: { ...mockPrismaModel },
      sysConfig: { ...mockPrismaModel },
      sysDict: { ...mockPrismaModel },
      sysDictData: { ...mockPrismaModel },
      sysNotice: { ...mockPrismaModel },
      sysTenant: { ...mockPrismaModel },
      sysTenantPackage: { ...mockPrismaModel },
      
      // Monitor models
      sysLoginLog: { ...mockPrismaModel },
      sysOperLog: { ...mockPrismaModel },
      sysJob: { ...mockPrismaModel },
      sysJobLog: { ...mockPrismaModel },
      
      // File management models
      sysFile: { ...mockPrismaModel },
      sysFileVersion: { ...mockPrismaModel },
      sysFileShare: { ...mockPrismaModel },
      
      // Tool models
      genTable: { ...mockPrismaModel },
      genTableColumn: { ...mockPrismaModel },
      
      // Transaction support
      $transaction: jest.fn((fn) => {
        if (Array.isArray(fn)) {
          return Promise.all(fn);
        }
        // For callback-style transactions, execute with mock prisma
        return fn(this.createPrismaService());
      }),
      
      // Connection management
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $executeRaw: jest.fn(),
      $executeRawUnsafe: jest.fn(),
      $queryRaw: jest.fn(),
      $queryRawUnsafe: jest.fn(),
      
      // Middleware
      $use: jest.fn(),
      $on: jest.fn(),
      $extends: jest.fn(),
    } as any;
  }

  /**
   * 创建 RedisService Mock
   * 
   * @description
   * 创建包含所有 Redis 操作方法的 Mock 对象
   */
  static createRedisService(): jest.Mocked<RedisService> {
    const mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      info: jest.fn(),
      lrange: jest.fn(),
      dbsize: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      hkeys: jest.fn(),
      hmset: jest.fn(),
      hvals: jest.fn(),
      lpush: jest.fn(),
      rpush: jest.fn(),
      lpushx: jest.fn(),
      rpushx: jest.fn(),
      linsert: jest.fn(),
      llen: jest.fn(),
      lset: jest.fn(),
      lindex: jest.fn(),
      blpop: jest.fn(),
      brpop: jest.fn(),
      ltrim: jest.fn(),
      lrem: jest.fn(),
      brpoplpush: jest.fn(),
      ttl: jest.fn(),
      expire: jest.fn(),
    };

    return {
      getClient: jest.fn(() => mockRedisClient as any),
      getInfo: jest.fn().mockResolvedValue({}),
      skipFind: jest.fn().mockResolvedValue([]),
      getDbSize: jest.fn().mockResolvedValue(0),
      commandStats: jest.fn().mockResolvedValue([]),
      
      // String operations
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      mget: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(0),
      ttl: jest.fn().mockResolvedValue(-1),
      keys: jest.fn().mockResolvedValue([]),
      
      // Hash operations
      hset: jest.fn().mockResolvedValue(1),
      hmset: jest.fn().mockResolvedValue('OK'),
      hget: jest.fn().mockResolvedValue(null),
      hvals: jest.fn().mockResolvedValue([]),
      hGetAll: jest.fn().mockResolvedValue({}),
      hdel: jest.fn().mockResolvedValue(0),
      hdelAll: jest.fn().mockResolvedValue(0),
      
      // List operations
      lLength: jest.fn().mockResolvedValue(0),
      lSet: jest.fn().mockResolvedValue('OK'),
      lIndex: jest.fn().mockResolvedValue(null),
      lRange: jest.fn().mockResolvedValue([]),
      lLeftPush: jest.fn().mockResolvedValue(0),
      lLeftPushIfPresent: jest.fn().mockResolvedValue(0),
      lLeftInsert: jest.fn().mockResolvedValue(0),
      lRightInsert: jest.fn().mockResolvedValue(0),
      lRightPush: jest.fn().mockResolvedValue(0),
      lRightPushIfPresent: jest.fn().mockResolvedValue(0),
      lLeftPop: jest.fn().mockResolvedValue(null),
      lRightPop: jest.fn().mockResolvedValue(null),
      lTrim: jest.fn().mockResolvedValue('OK'),
      lRemove: jest.fn().mockResolvedValue(0),
      lPoplPush: jest.fn().mockResolvedValue(null),
      
      // Utility
      reset: jest.fn().mockResolvedValue(0),
    } as any;
  }

  /**
   * 创建 JwtService Mock
   * 
   * @description
   * 创建包含 JWT 签名和验证方法的 Mock 对象
   */
  static createJwtService(): jest.Mocked<JwtService> {
    return {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
      verify: jest.fn().mockReturnValue({ userId: 1, userName: 'testuser' }),
      verifyAsync: jest.fn().mockResolvedValue({ userId: 1, userName: 'testuser' }),
      decode: jest.fn().mockReturnValue({ userId: 1, userName: 'testuser' }),
    } as any;
  }

  /**
   * 创建 AppConfigService Mock
   * 
   * @description
   * 创建包含所有配置访问方法的 Mock 对象
   */
  static createConfigService(): jest.Mocked<AppConfigService> {
    return {
      all: {} as any,
      app: {
        name: 'test-app',
        port: 3000,
        env: 'test',
        globalPrefix: 'api',
        locale: 'zh-CN',
        logger: {
          level: 'info',
          dir: 'logs',
          maxFileSize: 20971520,
          maxFiles: 14,
          errorLogName: 'error-%DATE%.log',
          appLogName: 'app-%DATE%.log',
        },
      } as any,
      db: {
        postgresql: {
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test_db',
          schema: 'public',
          ssl: false,
        },
      } as any,
      redis: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
      } as any,
      jwt: {
        secret: 'test-secret',
        expiresIn: '7d',
      } as any,
      tenant: {
        enabled: true,
        defaultTenantId: '000000',
        ignoreTables: [],
      } as any,
      crypto: {
        rsaPublicKey: 'test-public-key',
        rsaPrivateKey: 'test-private-key',
      } as any,
      cos: {
        secretId: 'test-secret-id',
        secretKey: 'test-secret-key',
        bucket: 'test-bucket',
        region: 'ap-guangzhou',
      } as any,
      perm: {
        excludeRoutes: [],
      } as any,
      gen: {
        author: 'test-author',
        packageName: 'com.test',
        autoRemovePre: false,
        tablePrefix: '',
      } as any,
      user: {
        initPassword: 'test123456',
      } as any,
      client: {
        allowedOrigins: ['http://localhost:3000'],
      } as any,
      isProduction: false,
      isDevelopment: false,
      isTest: true,
      getValue: jest.fn((path: string, defaultValue?: any) => defaultValue),
    } as any;
  }
}
