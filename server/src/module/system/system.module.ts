import { Module, Global } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DeptModule } from './dept/dept.module';
import { SysConfigModule } from './config/config.module';
import { DictModule } from './dict/dict.module';
import { MenuModule } from './menu/menu.module';
import { NoticeModule } from './notice/notice.module';
import { PostModule } from './post/post.module';
import { RoleModule } from './role/role.module';
import { ToolModule } from './tool/tool.module';
import { UserModule } from './user/user.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantPackageModule } from './tenant-package/tenant-package.module';
import { FileManagerModule } from './file-manager/file-manager.module';

@Global()
@Module({
  imports: [
    AuthModule,
    SysConfigModule, // 系统配置
    DeptModule,
    DictModule,
    MenuModule,
    NoticeModule,
    PostModule,
    RoleModule,
    TenantModule, // 租户管理
    TenantPackageModule, // 租户套餐管理
    ToolModule,
    UserModule,
    FileManagerModule, // 文件管理
  ],
})
export class SystemModule {}
