import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { AppConfigService } from 'src/config/app-config.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConfigService: any;

  const mockPostgresConfig = {
    username: 'testuser',
    password: 'testpass',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    schema: 'public',
    ssl: false,
  };

  beforeEach(async () => {
    mockConfigService = {
      db: {
        postgresql: mockPostgresConfig,
      },
    };

    // Mock PrismaClient methods
    jest.spyOn(PrismaService.prototype, '$connect').mockResolvedValue(undefined);
    jest.spyOn(PrismaService.prototype, '$disconnect').mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useFactory: () => {
            return new PrismaService(mockConfigService as AppConfigService);
          },
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create PrismaService instance', () => {
      expect(service).toBeDefined();
    });

    it('should throw error when postgresql config is missing', () => {
      const invalidConfig = {
        db: {
          postgresql: null,
        },
      };

      expect(() => {
        new PrismaService(invalidConfig as any);
      }).toThrow('PostgreSQL configuration (db.postgresql) is missing.');
    });
  });

  describe('buildConnectionString', () => {
    it('should build connection string with all parameters', () => {
      const config = {
        username: 'user',
        password: 'pass@123',
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        schema: 'public',
        ssl: true,
      };

      // Access private static method via reflection
      const connectionString = (PrismaService as any).buildConnectionString(config);

      expect(connectionString).toContain('postgresql://');
      expect(connectionString).toContain('user');
      expect(connectionString).toContain('localhost:5432');
      expect(connectionString).toContain('mydb');
      expect(connectionString).toContain('schema=public');
      expect(connectionString).toContain('sslmode=require');
    });

    it('should build connection string without password', () => {
      const config = {
        username: 'user',
        password: null,
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        schema: null,
        ssl: false,
      };

      const connectionString = (PrismaService as any).buildConnectionString(config);

      expect(connectionString).toContain('postgresql://user@localhost:5432/mydb');
      expect(connectionString).not.toContain('sslmode');
    });

    it('should encode special characters in password', () => {
      const config = {
        username: 'user',
        password: 'p@ss:word/test',
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        schema: null,
        ssl: false,
      };

      const connectionString = (PrismaService as any).buildConnectionString(config);

      expect(connectionString).toContain(encodeURIComponent('p@ss:word/test'));
    });

    it('should build connection string without schema', () => {
      const config = {
        username: 'user',
        password: 'pass',
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        schema: null,
        ssl: false,
      };

      const connectionString = (PrismaService as any).buildConnectionString(config);

      expect(connectionString).not.toContain('schema=');
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
  });
});
