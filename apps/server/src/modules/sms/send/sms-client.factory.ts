import { Injectable, BadRequestException } from '@nestjs/common';
import { ISmsClient, ISmsClientFactory, SmsChannelConfig } from './sms-client.interface';
import { AliyunSmsClient, TencentSmsClient, HuaweiSmsClient } from './clients';

/**
 * 短信客户端工厂
 * 根据渠道编码创建对应的短信客户端
 */
@Injectable()
export class SmsClientFactory implements ISmsClientFactory {
  private readonly clientCache = new Map<string, ISmsClient>();

  /**
   * 获取短信客户端
   * @param channelCode 渠道编码
   * @param config 渠道配置
   */
  getClient(channelCode: string, config: SmsChannelConfig): ISmsClient {
    // 使用渠道编码和配置生成缓存key
    const cacheKey = `${channelCode}_${config.apiKey}`;

    // 检查缓存
    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey)!;
    }

    // 创建新客户端
    const client = this.createClient(channelCode, config);
    this.clientCache.set(cacheKey, client);

    return client;
  }

  /**
   * 创建短信客户端
   */
  private createClient(channelCode: string, config: SmsChannelConfig): ISmsClient {
    switch (channelCode.toLowerCase()) {
      case 'aliyun':
        return new AliyunSmsClient(config);
      case 'tencent':
        return new TencentSmsClient(config);
      case 'huawei':
        return new HuaweiSmsClient(config);
      default:
        throw new BadRequestException(`不支持的短信渠道: ${channelCode}`);
    }
  }

  /**
   * 清除客户端缓存
   */
  clearCache(): void {
    this.clientCache.clear();
  }
}
