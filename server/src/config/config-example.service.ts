import { Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/config/app-config.service';

/**
 * 配置使用示例服务
 *
 * 这个文件展示了如何在项目中使用新的类型安全配置系统
 */
@Injectable()
export class ConfigExampleService {
  constructor(private readonly config: AppConfigService) {}

  /**
   * 示例 1: 获取应用配置
   */
  getAppConfig() {
    // ✅ 类型安全，IDE 自动补全
    const port = this.config.app.port; // number
    const prefix = this.config.app.prefix; // string
    const env = this.config.app.env; // 'development' | 'test' | 'production'

    console.log(`应用运行在 ${env} 环境，端口 ${port}，前缀 ${prefix}`);
  }

  /**
   * 示例 2: 获取数据库配置
   */
  getDatabaseConfig() {
    const { host, port, database, username } = this.config.db.postgresql;

    console.log(`数据库连接: ${username}@${host}:${port}/${database}`);

    // 密码会自动脱敏
    console.log('完整配置:', this.config.db);
  }

  /**
   * 示例 3: 获取 Redis 配置
   */
  getRedisConfig() {
    const redis = this.config.redis;

    return {
      host: redis.host,
      port: redis.port,
      db: redis.db,
      keyPrefix: redis.keyPrefix,
    };
  }

  /**
   * 示例 4: 环境判断
   */
  environmentChecks() {
    if (this.config.isProduction) {
      console.log('生产环境: 启用所有安全特性');
    } else if (this.config.isDevelopment) {
      console.log('开发环境: 启用调试日志');
    } else if (this.config.isTest) {
      console.log('测试环境: 使用测试数据库');
    }
  }

  /**
   * 示例 5: JWT 配置
   */
  getJwtConfig() {
    const { secretkey, expiresin, refreshExpiresIn } = this.config.jwt;

    console.log(`JWT 配置: 过期时间 ${expiresin}, 刷新过期时间 ${refreshExpiresIn}`);
    console.log(`密钥长度: ${secretkey.length} 字符`);
  }

  /**
   * 示例 6: 租户配置
   */
  getTenantConfig() {
    const tenant = this.config.tenant;

    if (tenant.enabled) {
      console.log(`多租户已启用，超级租户 ID: ${tenant.superTenantId}`);
    } else {
      console.log('多租户已禁用');
    }

    return tenant;
  }

  /**
   * 示例 7: 文件上传配置
   */
  getFileConfig() {
    const file = this.config.app.file;

    if (file.isLocal) {
      console.log(`本地存储: ${file.location}`);
    } else {
      console.log(`云存储: ${file.domain}`);
    }

    console.log(`最大文件大小: ${file.maxSize}MB`);
    console.log(`缩略图: ${file.thumbnailEnabled ? '启用' : '禁用'}`);
  }

  /**
   * 示例 8: 日志配置
   */
  getLoggerConfig() {
    const logger = this.config.app.logger;

    console.log('日志配置:', {
      level: logger.level,
      dir: logger.dir,
      toFile: logger.toFile,
      prettyPrint: logger.prettyPrint,
    });

    return logger;
  }

  /**
   * 示例 9: 权限配置
   */
  getPermissionConfig() {
    const whitelist = this.config.perm.router.whitelist;

    console.log('路由白名单:');
    whitelist.forEach((route) => {
      console.log(`  ${route.method} ${route.path}`);
    });

    return whitelist;
  }

  /**
   * 示例 10: 获取所有配置 (调试用)
   */
  getAllConfig() {
    // 仅在非生产环境输出完整配置
    if (!this.config.isProduction) {
      console.log('完整配置:', this.config.all);
    }
  }

  /**
   * 示例 11: 动态配置逻辑
   */
  getTimeoutBasedOnEnvironment() {
    // 根据环境返回不同的超时时间
    return this.config.isProduction ? 5000 : 30000;
  }

  /**
   * 示例 12: 组合多个配置
   */
  buildDatabaseUrl() {
    const { host, port, database, username, password } = this.config.db.postgresql;
    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  /**
   * 示例 13: 向后兼容的旧方式 (不推荐)
   */
  @Deprecated('请使用类型安全的 config.app.port')
  getPortOldWay() {
    // ⚠️ 不推荐: 字符串路径，无类型检查
    return this.config.getValue<number>('app.port', 8080);
  }
}

/**
 * 装饰器用于标记废弃方法
 */
function Deprecated(message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.warn(`⚠️  ${propertyKey} is deprecated: ${message}`);
      return original.apply(this, args);
    };
  };
}
