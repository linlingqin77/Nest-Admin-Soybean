import { Injectable } from '@nestjs/common';
import { Result } from 'src/common/response';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';
import { FormatDateFields, Paginate } from 'src/common/utils/index';

@Injectable()
export class OnlineService {
  constructor(private readonly redisService: RedisService) {}
  /**
   * 日志列表-分页
   * @param query
   * @returns
   */
  async findAll(query) {
    const keys = await this.redisService.keys(`${CacheEnum.LOGIN_TOKEN_KEY}*`);

    // 如果没有在线用户，返回空数据
    if (!keys || keys.length === 0) {
      return Result.page([], 0);
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
        pageSize: query.pageSize,
        pageNum: query.pageNum,
      },
      query,
    );

    // 格式化时间字段
    const formattedList = FormatDateFields(list, ['loginTime']);

    return Result.page(formattedList, allUsers.length);
  }

  async delete(token: string) {
    await this.redisService.del(`${CacheEnum.LOGIN_TOKEN_KEY}${token}`);
    return Result.ok();
  }
}
