import { Global, Module } from '@nestjs/common';
import { UserLoader } from './user.loader';
import { DeptLoader } from './dept.loader';
import { RoleLoader } from './role.loader';
import { MenuLoader } from './menu.loader';
import { PostLoader } from './post.loader';
import { DictDataLoader, DictTypeLoader } from './dict.loader';
import { PrismaModule } from 'src/platform/prisma';

/**
 * DataLoader 模块
 *
 * @description 提供批量数据加载能力，解决 N+1 查询问题
 * 使用 DataLoader 模式批量加载关联数据，减少数据库查询次数
 *
 * @example
 * ```typescript
 * // 在 Service 中使用
 * const users = await this.userLoader.loadMany([1, 2, 3]);
 * const depts = await this.deptLoader.loadMany([10, 20, 30]);
 * const menus = await this.menuLoader.loadMany([100, 200, 300]);
 * const posts = await this.postLoader.loadMany([1, 2, 3]);
 * const dictData = await this.dictDataLoader.loadByDictTypes(['sys_user_sex', 'sys_normal_disable']);
 * ```
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [UserLoader, DeptLoader, RoleLoader, MenuLoader, PostLoader, DictTypeLoader, DictDataLoader],
  exports: [UserLoader, DeptLoader, RoleLoader, MenuLoader, PostLoader, DictTypeLoader, DictDataLoader],
})
export class DataLoaderModule {}
