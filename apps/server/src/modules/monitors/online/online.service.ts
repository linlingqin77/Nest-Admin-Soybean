import { Injectable, Logger } from '@nestjs/common';
import { Result } from 'src/shared/response';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/index';
import { Paginate, toDtoList } from 'src/shared/utils/index';
import { OnlineListDto, OnlineUserResponseDto } from './dto/index';

/**
 * 在线用户数量告警阈值。
 *
 * 当前实现在内存中累积所有在线用户再分页，在大量用户场景下存在性能风险。
 * 超过此阈值时仅记录警告日志，不影响当前请求，便于后续迁移到按 SCAN 分页或
 * 独立维护在线用户索引（如 ZSET）的方案。
 */
const ONLINE_USERS_PERF_WARN_THRESHOLD = 1000;

@Injectable()
export class OnlineService {
  private readonly logger = new Logger(OnlineService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * 日志列表-分页
   *
   * 使用 SCAN 游标迭代获取在线用户 key，避免 KEYS 在大 keyspace 时阻塞 Redis。
   * TODO: 当前仍在内存中聚合所有在线用户后分页，>1000 用户时存在性能问题，
   *      需要重写为基于 SCAN 的服务端分页或维护独立的在线用户索引。
   *
   * @param query
   * @returns
   */
  async findAll(query: OnlineListDto) {
    const keys = await this.redisService.scanAll(`${CacheEnum.LOGIN_TOKEN_KEY}*`);

    if (keys.length > ONLINE_USERS_PERF_WARN_THRESHOLD) {
      this.logger.warn(
        `在线用户数量 (${keys.length}) 超过阈值 ${ONLINE_USERS_PERF_WARN_THRESHOLD}，` +
          `当前 in-memory 分页实现可能存在性能问题，建议迁移到 SCAN 分页或独立索引`,
      );
    }

    // 如果没有在线用户，返回空数据
    if (!keys || keys.length === 0) {
      return Result.page([], 0, Number(query.pageNum), Number(query.pageSize));
    }

    const data = await this.redisService.mget(keys);

    // 过滤掉空值并映射为在线用户对象
    const allUsers = data
      .filter((item) => item && item.token)
      .map((item) => ({
        tokenId: item.token,
        deptName: item.user?.deptName || '',
        userName: item.userName,
        ipaddr: item.ipaddr,
        loginLocation: item.loginLocation,
        browser: item.browser,
        os: item.os,
        loginTime: item.loginTime,
        deviceType: item.deviceType || '0',
      }));

    // 分页处理
    const list = Paginate(
      {
        list: allUsers,
        pageSize: Number(query.pageSize),
        pageNum: Number(query.pageNum),
      },
      query,
    );

    // 使用 toDtoList 格式化时间字段
    const formattedList = toDtoList(OnlineUserResponseDto, list);

    return Result.page(formattedList, allUsers.length, Number(query.pageNum), Number(query.pageSize));
  }

  async delete(token: string) {
    await this.redisService.del(`${CacheEnum.LOGIN_TOKEN_KEY}${token}`);
    return Result.ok();
  }
}
