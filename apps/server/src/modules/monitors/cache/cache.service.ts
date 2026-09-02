import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/platform/redis/redis.service';
import { DeepClone } from 'src/shared/utils/index';
import { ResponseCode, Result } from 'src/shared/response';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  private readonly caches = [
    {
      cacheName: 'login_tokens:',
      cacheKey: '',
      cacheValue: '',
      remark: '用户信息',
    },
    {
      cacheName: 'sys_config:',
      cacheKey: '',
      cacheValue: '',
      remark: '配置信息',
    },
    {
      cacheName: 'sys_dict:',
      cacheKey: '',
      cacheValue: '',
      remark: '数据字典',
    },
    {
      cacheName: 'captcha_codes:',
      cacheKey: '',
      cacheValue: '',
      remark: '验证码',
    },
    {
      cacheName: 'repeat_submit:',
      cacheKey: '',
      cacheValue: '',
      remark: '防重提交',
    },
    {
      cacheName: 'rate_limit:',
      cacheKey: '',
      cacheValue: '',
      remark: '限流处理',
    },
    {
      cacheName: 'pwd_err_cnt:',
      cacheKey: '',
      cacheValue: '',
      remark: '密码错误次数',
    },
  ];

  async getNames() {
    return Result.ok(this.caches);
  }

  /**
   * 使用 SCAN 游标迭代获取匹配前缀的 key 列表，
   * 避免在 keyspace 较大时 KEYS 命令阻塞 Redis 主线程。
   */
  async getKeys(id: string) {
    const data = await this.redisService.scanAll(id + '*');
    return Result.ok(data);
  }

  async clearCacheKey(id: string) {
    const data = await this.redisService.del(id);
    return Result.ok(data);
  }

  /**
   * 使用 SCAN 游标迭代匹配并删除 key，避免阻塞 Redis。
   */
  async clearCacheName(id: string) {
    const data = await this.redisService.scanDelete(id + '*');
    return Result.ok(data);
  }

  async clearCacheAll() {
    const data = await this.redisService.reset();
    return Result.ok(data);
  }

  async getValue(params: { cacheName: string; cacheKey: string }) {
    const list = DeepClone(this.caches);
    const data = list.find((item) => item.cacheName === params.cacheName);
    if (!data) {
      return Result.fail(ResponseCode.DATA_NOT_FOUND, '缓存名称不存在');
    }
    const cacheValue = await this.redisService.get(params.cacheKey);
    data.cacheValue = JSON.stringify(cacheValue);
    data.cacheKey = params.cacheKey;
    return Result.ok(data);
  }

  /**
   * 缓存监控
   *
   * getInfo / getDbSize / commandStats 三个命令相互独立，并发执行可显著降低响应延迟。
   * @returns
   */
  async getInfo() {
    const [info, dbSize, commandStats] = await Promise.all([
      this.redisService.getInfo(),
      this.redisService.getDbSize(),
      this.redisService.commandStats(),
    ]);
    return Result.ok({
      dbSize: dbSize,
      info: info,
      commandStats: commandStats,
    });
  }
}
