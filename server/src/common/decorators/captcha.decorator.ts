import { Inject } from '@nestjs/common';
import { CacheEnum } from 'src/common/enum';
import { paramsKeyGetObj } from 'src/common/utils/decorator';
import { Result } from 'src/common/response';
import { ConfigService } from '../../module/system/config/config.service';
import { RedisService } from '../../module/common/redis/redis.service';
import { Logger } from '@nestjs/common';

export function Captcha(CACHE_KEY: string) {
  const injectRedis = Inject(RedisService);
  const injectConfig = Inject(ConfigService);
  const logger = new Logger('Captcha');

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');
    injectConfig(target, 'configService');

    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 使用 getSystemConfigValue 而非 getConfigValue
      // 因为登录时租户上下文可能尚未建立，需要使用不依赖租户的配置方法
      const enable = await this.configService.getSystemConfigValue('sys.account.captchaEnabled');
      const captchaEnabled: boolean = enable === 'true';

      logger.log(`验证码开关状态: ${captchaEnabled}, 原始值: ${enable}`);

      // 生产环境启用验证码验证
      if (captchaEnabled) {
        const user = paramsKeyGetObj(originMethod, CACHE_KEY, args);

        logger.log(`提取的用户数据:`, JSON.stringify(user, null, 2));
        logger.log(`验证码 UUID: ${user?.uuid}, 用户输入的验证码: ${user?.code}`);

        const redisKey = CacheEnum.CAPTCHA_CODE_KEY + user.uuid;
        logger.log(`Redis 查询 Key: ${redisKey}`);

        const code = await this.redisService.get(redisKey);

        logger.log(`Redis 中存储的验证码: ${code}`);

        if (!user.code) {
          logger.error('用户未输入验证码');
          return Result.fail(500, `请输入验证码`);
        }
        if (!code) {
          logger.error(`验证码已过期，Redis Key: ${redisKey}`);
          return Result.fail(500, `验证码已过期`);
        }
        // 验证码比较时忽略大小写，并统一转为字符串比较（Redis可能返回数字类型）
        const userCodeLower = String(user.code).toLowerCase();
        const redisCode = String(code).toLowerCase();
        logger.log(`验证码对比: Redis=${redisCode}, 用户输入=${userCodeLower}, 匹配=${redisCode === userCodeLower}`);

        if (redisCode !== userCodeLower) {
          logger.error(`验证码错误: 期望 ${redisCode}, 实际 ${userCodeLower}`);
          return Result.fail(500, `验证码错误`);
        }

        logger.log('验证码验证成功');
      }

      const result = await originMethod.apply(this, args);

      return result;
    };
  };
}
