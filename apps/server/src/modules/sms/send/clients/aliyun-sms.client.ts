import { Logger } from '@nestjs/common';
import { ISmsClient, SmsSendParams, SmsSendResult, SmsChannelConfig } from '../sms-client.interface';

/**
 * 阿里云短信客户端
 *
 * 注意：这是一个模拟实现，实际使用时需要安装 @alicloud/dysmsapi20170525 包
 * 并使用真实的阿里云 SDK
 */
export class AliyunSmsClient implements ISmsClient {
  private readonly logger = new Logger(AliyunSmsClient.name);
  private readonly config: SmsChannelConfig;

  constructor(config: SmsChannelConfig) {
    this.config = config;
  }

  async send(params: SmsSendParams): Promise<SmsSendResult> {
    try {
      this.logger.log(`[Aliyun SMS] Sending to ${params.mobile}, template: ${params.apiTemplateId}`);

      // 模拟发送逻辑
      // 实际实现应该使用阿里云 SDK:
      // import Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
      // const client = new Dysmsapi20170525({
      //   accessKeyId: this.config.apiKey,
      //   accessKeySecret: this.config.apiSecret,
      //   endpoint: 'dysmsapi.aliyuncs.com',
      // });
      // const result = await client.sendSms({
      //   phoneNumbers: params.mobile,
      //   signName: params.signature,
      //   templateCode: params.apiTemplateId,
      //   templateParam: JSON.stringify(params.params),
      // });

      // 模拟成功响应
      const mockBizId = `ALIYUN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.logger.log(`[Aliyun SMS] Send success, bizId: ${mockBizId}`);

      return {
        success: true,
        apiSendCode: mockBizId,
      };
    } catch (error: any) {
      this.logger.error(`[Aliyun SMS] Send failed: ${error.message}`);
      return {
        success: false,
        errorMsg: error.message || '阿里云短信发送失败',
      };
    }
  }
}
