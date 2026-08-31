/**
 * 事务装饰器 — 基于 @nestjs-cls/transactional 官方实现
 *
 * 使用 CLS (Continuation-Local Storage) 在异步操作中自动传递事务上下文。
 * 配合 TransactionHost 注入使用，在 @Transactional 方法中通过 txHost.tx 获取事务客户端。
 *
 * @example
 * ```typescript
 * import { Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';
 *
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly txHost: PrismaTransactionHost) {}
 *
 *   // 兼容层：所有现有 this.prisma.xxx 调用自动适配事务
 *   private get prisma() { return this.txHost.tx; }
 *
 *   @Transactional()
 *   async createUserWithRoles(data: CreateUserDto) {
 *     const user = await this.prisma.sysUser.create({ data });
 *     await this.prisma.sysUserRole.createMany({ ... });
 *     return user;
 *   }
 * }
 * ```
 */

import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaService } from 'src/platform/prisma';

// 从 @nestjs-cls/transactional 重新导出
export { InjectTransactionHost, Transactional, Propagation, TransactionHost } from '@nestjs-cls/transactional';

/**
 * PrismaTransactionHost 类型别名
 * 提供便捷的类型引用，避免每个服务都需要导入适配器类型
 *
 * - 在 @Transactional() 方法中: txHost.tx 返回事务客户端
 * - 在非事务方法中: txHost.tx 返回原始 PrismaService
 */
export type PrismaTransactionHost = TransactionHost<TransactionalAdapterPrisma<PrismaService>>;
