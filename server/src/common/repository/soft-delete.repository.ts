import { BaseRepository, PrismaDelegate } from './base.repository';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 软删除仓储基类
 * 自动处理软删除逻辑（delFlag = '0' 表示正常，'1' 表示已删除）
 */
export abstract class SoftDeleteRepository<T, D extends PrismaDelegate> extends BaseRepository<T, D> {
  constructor(prisma: PrismaService, modelName: any) {
    super(prisma, modelName);
  }

  /**
   * 软删除单条记录
   */
  async softDelete(id: number): Promise<T> {
    const idField = this.getIdField();
    return await (this.delegate as any).update({
      where: { [idField]: id },
      data: { delFlag: '1' },
    });
  }

  /**
   * 批量软删除
   */
  async softDeleteBatch(ids: number[]): Promise<number> {
    const idField = this.getIdField();
    const result = await (this.delegate as any).updateMany({
      where: {
        [idField]: { in: ids },
      },
      data: { delFlag: '1' },
    });

    return result.count;
  }

  /**
   * 查询所有未删除的记录
   * 重写 findMany 以自动过滤软删除的记录
   */
  async findMany(args?: any): Promise<T[]> {
    const where = args?.where || {};
    // 只有在 where 中没有显式设置 delFlag 时才添加默认过滤
    if (!('delFlag' in where)) {
      where.delFlag = '0';
    }

    return await (this.delegate as any).findMany({
      ...args,
      where,
    });
  }

  /**
   * 查询单条未删除的记录
   */
  async findOne(where: any): Promise<T | null> {
    // 添加软删除过滤
    if (!('delFlag' in where)) {
      where.delFlag = '0';
    }

    return await (this.delegate as any).findFirst({ where });
  }

  /**
   * 根据ID查询（过滤软删除）
   */
  override async findById(id: number): Promise<T | null> {
    const idField = this.getIdField();
    return this.findOne({ [idField]: id });
  }

  /**
   * 检查记录是否存在（过滤软删除）
   */
  async exists(where: any): Promise<boolean> {
    if (!('delFlag' in where)) {
      where.delFlag = '0';
    }

    const count = await (this.delegate as any).count({ where });
    return count > 0;
  }

  /**
   * 获取模型的ID字段名
   */
  private getIdField(): string {
    // 根据模型名推断ID字段名
    const modelNameStr = String(this.modelName).toLowerCase();

    // 特殊映射
    const idFieldMap: Record<string, string> = {
      sysuser: 'userId',
      sysrole: 'roleId',
      sysmenu: 'menuId',
      sysdept: 'deptId',
      sysconfig: 'configId',
      sysdicttype: 'dictId',
      sysdictdata: 'dictCode',
      syspost: 'postId',
      sysnotice: 'noticeId',
      sysjob: 'jobId',
      sysupload: 'uploadId',
    };

    return idFieldMap[modelNameStr] || 'id';
  }
}
