import { Test, TestingModule } from '@nestjs/testing';
import { BaseRepository, SoftDeleteRepository } from './base.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { DelFlagEnum } from 'src/common/enum/index';

// Create a concrete implementation for testing
class TestRepository extends BaseRepository<any, any> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser' as any);
  }

  protected getPrimaryKeyName(): string {
    return 'userId';
  }
}

class TestSoftDeleteRepository extends SoftDeleteRepository<any, any> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser' as any);
  }

  protected getPrimaryKeyName(): string {
    return 'userId';
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockRecord = {
    userId: 1,
    userName: 'test',
    delFlag: DelFlagEnum.NORMAL,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TestRepository,
          useFactory: () => new TestRepository(prisma as any),
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    repository = module.get<TestRepository>(TestRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find record by id', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockRecord);

      const result = await repository.findById(1);

      expect(result).toEqual(mockRecord);
      expect(prisma.sysUser.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should return null when not found', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should pass options to findUnique', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockRecord);

      await repository.findById(1, { include: { dept: true } });

      expect(prisma.sysUser.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { dept: true },
      });
    });
  });

  describe('findOne', () => {
    it('should find one record by condition', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockRecord);

      const result = await repository.findOne({ userName: 'test' });

      expect(result).toEqual(mockRecord);
    });

    it('should return null when not found', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findOne({ userName: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all records', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockRecord]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
    });

    it('should apply where condition', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);

      await repository.findAll({ where: { userName: 'test' } });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userName: 'test' },
        })
      );
    });

    it('should apply orderBy', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);

      await repository.findAll({ orderBy: 'userName', order: 'desc' });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { userName: 'desc' },
        })
      );
    });
  });

  describe('findPage', () => {
    it('should return paginated results', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockRecord]);
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.findPage({ pageNum: 1, pageSize: 10 });

      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pageNum).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.pages).toBe(1);
    });

    it('should calculate skip correctly', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      await repository.findPage({ pageNum: 2, pageSize: 10 });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('create', () => {
    it('should create a record', async () => {
      (prisma.sysUser.create as jest.Mock).mockResolvedValue(mockRecord);

      const result = await repository.create({ userName: 'test' });

      expect(result).toEqual(mockRecord);
    });

    it('should handle Prisma args format', async () => {
      (prisma.sysUser.create as jest.Mock).mockResolvedValue(mockRecord);

      await repository.create({ data: { userName: 'test' } });

      expect(prisma.sysUser.create).toHaveBeenCalledWith({ data: { userName: 'test' } });
    });
  });

  describe('createMany', () => {
    it('should create multiple records', async () => {
      (prisma.sysUser.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.createMany([
        { userName: 'test1' },
        { userName: 'test2' },
      ]);

      expect(result.count).toBe(2);
    });
  });

  describe('update', () => {
    it('should update a record by id', async () => {
      (prisma.sysUser.update as jest.Mock).mockResolvedValue({ ...mockRecord, userName: 'updated' });

      const result = await repository.update(1, { userName: 'updated' });

      expect(result.userName).toBe('updated');
    });

    it('should handle Prisma args format', async () => {
      (prisma.sysUser.update as jest.Mock).mockResolvedValue(mockRecord);

      await repository.update({ where: { userId: 1 }, data: { userName: 'updated' } });

      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { userName: 'updated' },
      });
    });
  });

  describe('updateMany', () => {
    it('should update multiple records', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.updateMany(
        { userName: { contains: 'test' } },
        { status: 'DISABLED' }
      );

      expect(result.count).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      (prisma.sysUser.delete as jest.Mock).mockResolvedValue(mockRecord);

      const result = await repository.delete(1);

      expect(result).toEqual(mockRecord);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple records', async () => {
      (prisma.sysUser.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.deleteMany({ userName: { contains: 'test' } });

      expect(result.count).toBe(2);
    });
  });

  describe('deleteByIds', () => {
    it('should delete records by ids', async () => {
      (prisma.sysUser.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.deleteByIds([1, 2]);

      expect(result.count).toBe(2);
      expect(prisma.sysUser.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: [1, 2] } },
      });
    });
  });

  describe('count', () => {
    it('should count records', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(5);

      const result = await repository.count();

      expect(result).toBe(5);
    });

    it('should count with condition', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.count({ userName: 'test' });

      expect(result).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.exists({ userName: 'test' });

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.exists({ userName: 'nonexistent' });

      expect(result).toBe(false);
    });
  });

  describe('existsById', () => {
    it('should check existence by id', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsById(1);

      expect(result).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a record', async () => {
      (prisma.sysUser.update as jest.Mock).mockResolvedValue({ ...mockRecord, delFlag: DelFlagEnum.DELETED });

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
    });
  });

  describe('softDeleteMany', () => {
    it('should soft delete multiple records', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.softDeleteMany([1, 2]);

      expect(result.count).toBe(2);
    });
  });
});

describe('SoftDeleteRepository', () => {
  let repository: TestSoftDeleteRepository;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockRecord = {
    userId: 1,
    userName: 'test',
    delFlag: DelFlagEnum.NORMAL,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TestSoftDeleteRepository,
          useFactory: () => new TestSoftDeleteRepository(prisma as any),
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    repository = module.get<TestSoftDeleteRepository>(TestSoftDeleteRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return record when not deleted', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockRecord);

      const result = await repository.findById(1);

      expect(result).toEqual(mockRecord);
    });

    it('should return null when record is soft deleted', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        delFlag: DelFlagEnum.DELETED,
      });

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should automatically add delFlag condition', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockRecord);

      await repository.findOne({ userName: 'test' });

      expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
        where: { delFlag: DelFlagEnum.NORMAL, userName: 'test' },
      });
    });
  });

  describe('findAll', () => {
    it('should automatically add delFlag condition', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockRecord]);

      await repository.findAll({ where: { userName: 'test' } });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { delFlag: DelFlagEnum.NORMAL, userName: 'test' },
        })
      );
    });
  });

  describe('findPage', () => {
    it('should automatically add delFlag condition', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockRecord]);
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      await repository.findPage({ pageNum: 1, pageSize: 10, where: { userName: 'test' } });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { delFlag: DelFlagEnum.NORMAL, userName: 'test' },
        })
      );
    });
  });

  describe('count', () => {
    it('should automatically add delFlag condition', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      await repository.count({ userName: 'test' });

      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: { delFlag: DelFlagEnum.NORMAL, userName: 'test' },
      });
    });
  });

  describe('exists', () => {
    it('should automatically add delFlag condition', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      await repository.exists({ userName: 'test' });

      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: { delFlag: DelFlagEnum.NORMAL, userName: 'test' },
      });
    });
  });
});
