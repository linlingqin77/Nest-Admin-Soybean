import { BaseRepository, PrismaDelegate } from './base.repository';
import { SoftDeleteRepository } from './soft-delete.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';

// Test entity type
interface TestEntity {
  id: number;
  name: string;
  status: string;
  delFlag: string;
  createdAt: Date;
}

// Concrete implementation for testing BaseRepository
class TestRepository extends BaseRepository<TestEntity, PrismaDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser' as any);
  }

  protected getPrimaryKeyName(): string {
    return 'id';
  }
}

// Concrete implementation for testing SoftDeleteRepository
class TestSoftDeleteRepository extends SoftDeleteRepository<TestEntity, PrismaDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser' as any);
  }

  protected getPrimaryKeyName(): string {
    return 'id';
  }
}

// Test data factory
const createTestEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  id: 1,
  name: 'Test Entity',
  status: '0',
  delFlag: '0',
  createdAt: new Date(),
  ...overrides,
});

const createTestEntities = (count: number): TestEntity[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestEntity({
      id: index + 1,
      name: `Test Entity ${index + 1}`,
    }),
  );
};

describe('BaseRepository', () => {
  let repository: TestRepository;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new TestRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find entity by id using findUnique', async () => {
      const mockEntity = createTestEntity();
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockEntity);

      const result = await repository.findById(1);

      expect(result).toEqual(mockEntity);
      expect(prisma.sysUser.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when entity not found', async () => {
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should pass include option', async () => {
      const mockEntity = createTestEntity();
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockEntity);

      await repository.findById(1, { include: { relation: true } });

      expect(prisma.sysUser.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { relation: true },
      });
    });

    it('should pass select option', async () => {
      const mockEntity = createTestEntity();
      (prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockEntity);

      await repository.findById(1, { select: { id: true, name: true } });

      expect(prisma.sysUser.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, name: true },
      });
    });
  });

  describe('findOne', () => {
    it('should find entity by condition using findFirst', async () => {
      const mockEntity = createTestEntity({ name: 'Specific' });
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockEntity);

      const result = await repository.findOne({ name: 'Specific' });

      expect(result).toEqual(mockEntity);
      expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
        where: { name: 'Specific' },
      });
    });

    it('should return null when no match', async () => {
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findOne({ name: 'NonExistent' });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all entities', async () => {
      const mockEntities = createTestEntities(3);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(result).toEqual(mockEntities);
      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: undefined,
        select: undefined,
        orderBy: undefined,
      });
    });

    it('should apply where condition', async () => {
      const mockEntities = createTestEntities(2);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities);

      await repository.findAll({ where: { status: '0' } });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: { status: '0' },
        include: undefined,
        select: undefined,
        orderBy: undefined,
      });
    });

    it('should apply orderBy', async () => {
      const mockEntities = createTestEntities(2);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities);

      await repository.findAll({ orderBy: 'name', order: 'desc' });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: undefined,
        select: undefined,
        orderBy: { name: 'desc' },
      });
    });
  });

  describe('findPage', () => {
    it('should return paginated results', async () => {
      const mockEntities = createTestEntities(10);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities.slice(0, 5));
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(10);

      const result = await repository.findPage({ pageNum: 1, pageSize: 5 });

      expect(result.rows).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.pageNum).toBe(1);
      expect(result.pageSize).toBe(5);
      expect(result.pages).toBe(2);
    });

    it('should use default pagination values', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      await repository.findPage({});

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should calculate skip correctly for page 2', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      await repository.findPage({ pageNum: 2, pageSize: 10 });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('create', () => {
    it('should create entity', async () => {
      const newEntity = createTestEntity();
      (prisma.sysUser.create as jest.Mock).mockResolvedValue(newEntity);

      const result = await repository.create({ name: 'New Entity' });

      expect(result).toEqual(newEntity);
      expect(prisma.sysUser.create).toHaveBeenCalledWith({
        data: { name: 'New Entity' },
      });
    });
  });

  describe('createMany', () => {
    it('should create multiple entities', async () => {
      (prisma.sysUser.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.createMany([{ name: 'Entity 1' }, { name: 'Entity 2' }, { name: 'Entity 3' }]);

      expect(result.count).toBe(3);
      expect(prisma.sysUser.createMany).toHaveBeenCalledWith({
        data: [{ name: 'Entity 1' }, { name: 'Entity 2' }, { name: 'Entity 3' }],
        skipDuplicates: true,
      });
    });
  });

  describe('update', () => {
    it('should update entity by id', async () => {
      const updatedEntity = createTestEntity({ name: 'Updated' });
      (prisma.sysUser.update as jest.Mock).mockResolvedValue(updatedEntity);

      const result = await repository.update(1, { name: 'Updated' });

      expect(result).toEqual(updatedEntity);
      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
      });
    });
  });

  describe('updateMany', () => {
    it('should update multiple entities', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await repository.updateMany({ status: '0' }, { status: '1' });

      expect(result.count).toBe(5);
      expect(prisma.sysUser.updateMany).toHaveBeenCalledWith({
        where: { status: '0' },
        data: { status: '1' },
      });
    });
  });

  describe('delete', () => {
    it('should delete entity by id', async () => {
      const deletedEntity = createTestEntity();
      (prisma.sysUser.delete as jest.Mock).mockResolvedValue(deletedEntity);

      const result = await repository.delete(1);

      expect(result).toEqual(deletedEntity);
      expect(prisma.sysUser.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple entities', async () => {
      (prisma.sysUser.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.deleteMany({ status: '1' });

      expect(result.count).toBe(3);
      expect(prisma.sysUser.deleteMany).toHaveBeenCalledWith({
        where: { status: '1' },
      });
    });
  });

  describe('deleteByIds', () => {
    it('should delete entities by ids', async () => {
      (prisma.sysUser.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.deleteByIds([1, 2, 3]);

      expect(result.count).toBe(3);
      expect(prisma.sysUser.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
      });
    });
  });

  describe('count', () => {
    it('should count entities', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
    });

    it('should count with where condition', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(5);

      const result = await repository.count({ status: '0' });

      expect(result).toBe(5);
      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: { status: '0' },
      });
    });
  });

  describe('exists', () => {
    it('should return true when entity exists', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.exists({ name: 'Test' });

      expect(result).toBe(true);
    });

    it('should return false when entity does not exist', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.exists({ name: 'NonExistent' });

      expect(result).toBe(false);
    });
  });

  describe('existsById', () => {
    it('should return true when entity exists by id', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsById(1);

      expect(result).toBe(true);
      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete by setting delFlag', async () => {
      const softDeletedEntity = createTestEntity({ delFlag: '1' });
      (prisma.sysUser.update as jest.Mock).mockResolvedValue(softDeletedEntity);

      const result = await repository.softDelete(1);

      expect(result).toEqual(softDeletedEntity);
      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { delFlag: '1' },
      });
    });
  });

  describe('softDeleteMany', () => {
    it('should soft delete multiple entities', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.softDeleteMany([1, 2, 3]);

      expect(result.count).toBe(3);
      expect(prisma.sysUser.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        data: { delFlag: '1' },
      });
    });
  });
});

describe('SoftDeleteRepository', () => {
  let repository: TestSoftDeleteRepository;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new TestSoftDeleteRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne with soft delete filter', () => {
    it('should automatically add delFlag filter', async () => {
      const mockEntity = createTestEntity();
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockEntity);

      await repository.findOne({ name: 'Test' });

      expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
        where: { delFlag: '0', name: 'Test' },
      });
    });

    it('should merge with existing where conditions', async () => {
      const mockEntity = createTestEntity();
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockEntity);

      await repository.findOne({ name: 'Test', status: '0' });

      expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
        where: { delFlag: '0', name: 'Test', status: '0' },
      });
    });
  });

  describe('findMany with soft delete filter', () => {
    it('should automatically add delFlag filter', async () => {
      const mockEntities = createTestEntities(3);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities);

      await repository.findMany();

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: { delFlag: '0' },
      });
    });

    it('should merge where conditions with delFlag', async () => {
      const mockEntities = createTestEntities(2);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities);

      await repository.findMany({ where: { status: '0' } });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: { delFlag: '0', status: '0' },
      });
    });

    it('should not override explicit delFlag in where', async () => {
      const mockEntities = createTestEntities(1);
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockEntities);

      await repository.findMany({ where: { delFlag: '1' } });

      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: { delFlag: '1' },
      });
    });
  });

  describe('findById with soft delete filter', () => {
    it('should use findOne which adds delFlag filter', async () => {
      const mockEntity = createTestEntity();
      (prisma.sysUser.findFirst as jest.Mock).mockResolvedValue(mockEntity);

      await repository.findById(1);

      // findById uses findOne internally which adds delFlag filter
      expect(prisma.sysUser.findFirst).toHaveBeenCalledWith({
        where: { delFlag: '0', userId: 1 },
      });
    });
  });

  describe('exists with soft delete filter', () => {
    it('should automatically add delFlag filter', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);

      await repository.exists({ name: 'Test' });

      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: { delFlag: '0', name: 'Test' },
      });
    });

    it('should not override explicit delFlag', async () => {
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(0);

      await repository.exists({ name: 'Test', delFlag: '1' });

      expect(prisma.sysUser.count).toHaveBeenCalledWith({
        where: { name: 'Test', delFlag: '1' },
      });
    });
  });

  describe('softDelete', () => {
    it('should set delFlag to 1', async () => {
      const softDeletedEntity = createTestEntity({ delFlag: '1' });
      (prisma.sysUser.update as jest.Mock).mockResolvedValue(softDeletedEntity);

      const result = await repository.softDelete(1);

      expect(result).toEqual(softDeletedEntity);
      expect(prisma.sysUser.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { delFlag: '1' },
      });
    });
  });

  describe('softDeleteBatch', () => {
    it('should soft delete multiple entities', async () => {
      (prisma.sysUser.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.softDeleteBatch([1, 2, 3]);

      expect(result).toBe(3);
      expect(prisma.sysUser.updateMany).toHaveBeenCalledWith({
        where: { userId: { in: [1, 2, 3] } },
        data: { delFlag: '1' },
      });
    });
  });
});
