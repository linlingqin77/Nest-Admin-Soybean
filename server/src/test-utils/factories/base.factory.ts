/**
 * 测试夹具接口
 * 
 * @description
 * 定义测试数据工厂的标准接口
 * 所有实体工厂都应该实现此接口
 * 
 * @template T 实体类型
 */
export interface TestFixture<T> {
  /**
   * 创建单个实体
   * 
   * @param overrides 可选的字段覆盖值
   * @returns 创建的实体对象
   * 
   * @example
   * ```typescript
   * const user = UserFactory.create({ userName: 'custom-user' });
   * ```
   */
  create(overrides?: Partial<T>): T;

  /**
   * 批量创建多个实体
   * 
   * @param count 创建数量
   * @param overrides 可选的字段覆盖值（应用到所有实体）
   * @returns 创建的实体数组
   * 
   * @example
   * ```typescript
   * const users = UserFactory.createMany(5, { status: 'NORMAL' });
   * ```
   */
  createMany(count: number, overrides?: Partial<T>): T[];

  /**
   * 创建带关联关系的实体
   * 
   * @param relations 关联对象的配置
   * @returns 创建的实体对象（包含关联数据）
   * 
   * @example
   * ```typescript
   * const user = UserFactory.createWithRelations({
   *   dept: { deptName: 'IT部门' },
   *   roles: [{ roleName: '管理员' }]
   * });
   * ```
   */
  createWithRelations(relations: Record<string, any>): T;
}

/**
 * 测试数据工厂基类
 * 
 * @description
 * 提供测试数据工厂的通用实现
 * 子类可以继承此类并实现具体的实体创建逻辑
 * 
 * @template T 实体类型
 * 
 * @example
 * ```typescript
 * export class UserFactory extends BaseFactory<SysUser> {
 *   protected getDefaults(): SysUser {
 *     return {
 *       userId: 1,
 *       userName: 'testuser',
 *       // ... other fields
 *     };
 *   }
 * }
 * ```
 */
export abstract class BaseFactory<T> implements TestFixture<T> {
  /**
   * 获取实体的默认值
   * 
   * @description
   * 子类必须实现此方法，返回实体的默认字段值
   * 
   * @returns 实体的默认值对象
   */
  protected abstract getDefaults(): T;

  /**
   * 创建单个实体
   * 
   * @param overrides 可选的字段覆盖值
   * @returns 创建的实体对象
   */
  create(overrides?: Partial<T>): T {
    const defaults = this.getDefaults();
    return {
      ...defaults,
      ...overrides,
    } as T;
  }

  /**
   * 批量创建多个实体
   * 
   * @param count 创建数量
   * @param overrides 可选的字段覆盖值（应用到所有实体）
   * @returns 创建的实体数组
   */
  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, (_, index) => {
      return this.create({
        ...overrides,
        ...this.getSequentialOverrides(index),
      });
    });
  }

  /**
   * 创建带关联关系的实体
   * 
   * @param relations 关联对象的配置
   * @returns 创建的实体对象（包含关联数据）
   */
  createWithRelations(relations: Record<string, any>): T {
    const entity = this.create();
    return {
      ...entity,
      ...relations,
    } as T;
  }

  /**
   * 获取序列化覆盖值
   * 
   * @description
   * 在批量创建时，为每个实体生成唯一的字段值
   * 子类可以重写此方法以自定义序列化逻辑
   * 
   * @param index 当前索引（从 0 开始）
   * @returns 序列化的字段覆盖值
   */
  protected getSequentialOverrides(index: number): Partial<T> {
    return {} as Partial<T>;
  }

  /**
   * 生成随机字符串
   * 
   * @param length 字符串长度
   * @returns 随机字符串
   */
  protected randomString(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成随机数字
   * 
   * @param min 最小值（包含）
   * @param max 最大值（包含）
   * @returns 随机数字
   */
  protected randomNumber(min: number = 1, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成随机日期
   * 
   * @param start 起始日期
   * @param end 结束日期
   * @returns 随机日期
   */
  protected randomDate(start: Date = new Date(2020, 0, 1), end: Date = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  /**
   * 从数组中随机选择一个元素
   * 
   * @param array 源数组
   * @returns 随机选择的元素
   */
  protected randomChoice<U>(array: U[]): U {
    return array[Math.floor(Math.random() * array.length)];
  }
}
