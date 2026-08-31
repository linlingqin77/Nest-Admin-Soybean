import { Injectable } from '@nestjs/common';
import { Result } from 'src/shared/response';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/index';
import { Paginate, toDtoList } from 'src/shared/utils/index';
import { OnlineUserResponseDto, OnlineListDto } from './dto/index';

@Injectable()
export class OnlineService {
  constructor(private readonly redisService: RedisService) {}
  /**
   * 日志列表-分页
   * @param query
   * @returns
   */
  async findAll(query: OnlineListDto) {
    const keys = await this.redisService.keys(`${CacheEnum.LOGIN_TOKEN_KEY}*`);

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
