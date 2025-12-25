import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Configuration } from './types';

/**
 * 类型安全的配置转换器
 * 将原始配置对象转换为强类型配置实例并验证
 */
export class ConfigTransformer {
  /**
   * 转换并验证配置
   * @param rawConfig 原始配置对象
   * @returns 验证后的配置实例
   * @throws Error 如果验证失败
   */
  static transform(rawConfig: Record<string, any>): Configuration {
    // 使用 class-transformer 转换为类实例
    const config = plainToInstance(Configuration, rawConfig, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    // 使用 class-validator 验证
    const errors = validateSync(config, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          const constraints = error.constraints ? Object.values(error.constraints).join(', ') : '';
          const children = error.children?.length
            ? error.children
                .map((child) =>
                  child.constraints ? `  ${child.property}: ${Object.values(child.constraints).join(', ')}` : '',
                )
                .filter(Boolean)
                .join('\n')
            : '';

          return `${error.property}: ${constraints}${children ? '\n' + children : ''}`;
        })
        .join('\n');

      throw new Error(`配置验证失败:\n${errorMessages}`);
    }

    return config;
  }

  /**
   * 打印配置信息 (生产环境隐藏敏感信息)
   */
  static printSafe(config: Configuration): string {
    const safeConfig = JSON.parse(JSON.stringify(config));

    // 隐藏敏感信息
    if (safeConfig.db?.postgresql?.password) {
      safeConfig.db.postgresql.password = '******';
    }
    if (safeConfig.redis?.password) {
      safeConfig.redis.password = '******';
    }
    if (safeConfig.jwt?.secretkey) {
      safeConfig.jwt.secretkey = '******';
    }
    if (safeConfig.crypto?.rsaPrivateKey) {
      safeConfig.crypto.rsaPrivateKey = '******';
    }
    if (safeConfig.cos?.secretKey) {
      safeConfig.cos.secretKey = '******';
    }

    return JSON.stringify(safeConfig, null, 2);
  }
}
