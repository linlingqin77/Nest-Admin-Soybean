/**
 * 短信发送结果
 */
export interface SmsSendResult {
  success: boolean;
  apiSendCode?: string;
  errorMsg?: string;
}

/**
 * 短信发送参数
 */
export interface SmsSendParams {
  mobile: string;
  signature: string;
  apiTemplateId: string;
  params: Record<string, string>;
}

/**
 * 短信渠道配置
 */
export interface SmsChannelConfig {
  apiKey: string;
  apiSecret: string;
  signature: string;
}

/**
 * 短信客户端接口
 */
export interface ISmsClient {
  /**
   * 发送短信
   */
  send(params: SmsSendParams): Promise<SmsSendResult>;
}

/**
 * 短信客户端工厂接口
 */
export interface ISmsClientFactory {
  /**
   * 根据渠道编码获取短信客户端
   */
  getClient(channelCode: string, config: SmsChannelConfig): ISmsClient;
}
