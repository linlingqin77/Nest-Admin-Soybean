import { Logger } from '@nestjs/common';
import { ISmsClient, SmsSendParams, SmsSendResult, SmsChannelConfig } from '../sms-client.interface';

/**
 * 腾讯云短信客户端
 *
 * 注意：这是一个模拟实现，实际使用时需要安装 tencentcloud-sdk-nodejs 包
 * 并使用真实的腾讯云 SDK
 */
export class TencentSmsClient implements ISmsClient {
  private readonly logger = new Logger(TencentSmsClient.name);
  private readonly config: SmsChannelConfig;

  constructor(config: SmsChannelConfig) {
    this.config = config;
  }

  async send(params: SmsSendParams): Promise<SmsSendResult> {
    try {
      this.logger.log(`[Tencent SMS] Sending to ${params.mobile}, template: ${params.apiTemplateId}`);

      // 模拟发送逻辑
      // 实际实现应该使用腾讯云 SDK:
      // import * as tencentcloud from 'tencentcloud-sdk-nodejs';
      // const SmsClient = tencentcloud.sms.v20210111.Client;
      // const client = new SmsClient({
      //   credential: {
      //     secretId: this.config.apiKey,
      //     secretKey: this.config.apiSecret,
      //   },
      //   region: 'ap-guangzhou',
      // });
      // const result = await client.SendSms({
      //   PhoneNumberSet: [`+86${params.mobile}`],
      //   SmsSdkAppId: 'your-app-id',
      //   SignName: params.signature,
      //   TemplateId: params.apiTemplateId,
      //   TemplateParamSet: Object.values(params.params),
      // });

      // 模拟成功响应
      const mockSerialNo = `TENCENT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.logger.log(`[Tencent SMS] Send success, serialNo: ${mockSerialNo}`);

      return {
        success: true,
        apiSendCode: mockSerialNo,
      };
    } catch (error: any) {
      this.logger.error(`[Tencent SMS] Send failed: ${error.message}`);
      return {
        success: false,
        errorMsg: error.message || '腾讯云短信发送失败',
      };
    }
  }
}
