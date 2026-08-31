import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

/**
 * 配置服务模块
 *
 * @description
 * 提供全局的类型安全配置服务
 * 在任何模块中都可以注入 AppConfigService
 */
@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
