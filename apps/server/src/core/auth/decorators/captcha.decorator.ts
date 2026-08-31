import { Inject, Logger } from '@nestjs/common';
import { CacheEnum } from '../../../shared/enums';
import { ResponseCode } from '../../../shared/response';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { ConfigService } from '../../../modules/configs/config.service';
import { RedisService } from '../../../platform/redis/redis.service';

/**
 * 验证码校验装饰器
 *
 * 在方法执行前校验验证码。被装饰方法的第一个参数必须包含 `uuid` 和 `code` 属性。
 *
 * @param paramIndex - 包含验证码信息的参数索引（默认 0，即第一个参数）
 *
 * @example
 * ```typescript
 * @Captcha()
 * async login(user: LoginRequestDto, clientInfo: ClientInfoDto) {
 *   // user.uuid 和 user.code 会被自动校验
 * }
 * ```
 */
export function Captcha(paramIndex: number = 0) {
  const injectRedis = Inject(RedisService);
  const injectConfig = Inject(ConfigService);
  const logger = new Logger('Captcha');

  return function <T extends object>(target: T, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');
    injectConfig(target, 'configService');

    const originMethod = descriptor.value;

    descriptor.value = async function (
      this: T & { redisService: RedisService; configService: ConfigService },
      ...args: unknown[]
    ) {
      // 使用 getSystemConfigValue 而非 getConfigValue
      // 因为登录时租户上下文可能尚未建立，需要使用不依赖租户的配置方法
      const enable = await this.configService.getSystemConfigValue('sys.account.captchaEnabled');
      const captchaEnabled: boolean = enable === 'true';

      if (captchaEnabled) {
        const param = args[paramIndex] as Record<string, unknown> | undefined;

        if (!param || typeof param !== 'object') {
          logger.warn(`Captcha validation skipped: param at index ${paramIndex} is not an object`);
          throw new BusinessException(ResponseCode.CAPTCHA_ERROR, '验证码参数缺失');
        }

        const uuid = param.uuid as string | undefined;
        const code = param.code as string | undefined;

        if (!code) {
          throw new BusinessException(ResponseCode.CAPTCHA_ERROR, '请输入验证码');
        }

        const redisKey = CacheEnum.CAPTCHA_CODE_KEY + uuid;
        const storedCode = await this.redisService.get(redisKey);

        if (!storedCode) {
          throw new BusinessException(ResponseCode.CAPTCHA_ERROR, '验证码已过期');
        }

        const userCodeLower = String(code).toLowerCase();
        const redisCode = String(storedCode).toLowerCase();

        if (redisCode !== userCodeLower) {
          throw new BusinessException(ResponseCode.CAPTCHA_ERROR, '验证码错误');
        }

        logger.debug('Captcha verification passed');
      }

      return await originMethod.apply(this, args);
    };
  };
}
