import { Logger } from '@nestjs/common';
import { ISmsClient, SmsSendParams, SmsSendResult, SmsChannelConfig } from '../sms-client.interface';

/**
 * 华为云短信客户端
 *
 * 注意：这是一个模拟实现，实际使用时需要安装 @huaweicloud/huaweicloud-sdk-msgsms 包
 * 并使用真实的华为云 SDK
 */
export class HuaweiSmsClient implements ISmsClient {
  private readonly logger = new Logger(HuaweiSmsClient.name);
  private readonly config: SmsChannelConfig;

  constructor(config: SmsChannelConfig) {
    this.config = config;
  }

  async send(params: SmsSendParams): Promise<SmsSendResult> {
    try {
      this.logger.log(`[Huawei SMS] Sending to ${params.mobile}, template: ${params.apiTemplateId}`);

      // 模拟发送逻辑
      // 实际实现应该使用华为云 SDK:
      // import { MsgsmsClient, ShowSignatureFileRequest } from '@huaweicloud/huaweicloud-sdk-msgsms';
      // const client = MsgsmsClient.newBuilder()
      //   .withCredential(new BasicCredentials()
      //     .withAk(this.config.apiKey)
      //     .withSk(this.config.apiSecret))
      //   .build();

      // 模拟成功响应
      const mockSmsMsgId = `HUAWEI_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.logger.log(`[Huawei SMS] Send success, smsMsgId: ${mockSmsMsgId}`);

      return {
        success: true,
        apiSendCode: mockSmsMsgId,
      };
    } catch (error: any) {
      this.logger.error(`[Huawei SMS] Send failed: ${error.message}`);
      return {
        success: false,
        errorMsg: error.message || '华为云短信发送失败',
      };
    }
  }
}
