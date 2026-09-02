import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Result } from 'src/shared/response';
import { SendSmsDto, BatchSendSmsDto } from './dto/index';
import { SmsTemplateService } from '../templates/sms-template.service';
import { SmsClientFactory } from './sms-client.factory';
import { SmsLogRepository } from '../logs/sms-log.repository';
import { SmsSendResult } from './sms-client.interface';
import { Idempotent } from 'src/core/http/decorators/idempotent.decorator';
import { CircuitBreaker } from 'src/core/http/decorators/circuit-breaker.decorator';
import { CircuitBreakerService } from 'src/platform/resilience/circuit-breaker/circuit-breaker.service';

/**
 * 短信发送状态枚举
 */
export enum SmsSendStatus {
  SENDING = 0, // 发送中
  SUCCESS = 1, // 成功
  FAILED = 2, // 失败
}

/**
 * 短信接收状态枚举
 */
export enum SmsReceiveStatus {
  NOT_RECEIVED = 0, // 未接收
  RECEIVED = 1, // 已接收
}

@Injectable()
export class SmsSendService {
  private readonly logger = new Logger(SmsSendService.name);

  constructor(
    private readonly smsTemplateService: SmsTemplateService,
    private readonly smsClientFactory: SmsClientFactory,
    private readonly smsLogRepo: SmsLogRepository,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  /**
   * 发送短信
   */
  @Idempotent({
    timeout: 10,
    keyResolver: '{body.mobile}:{body.templateCode}',
    message: '短信正在发送中，请勿重复提交',
  })
  @CircuitBreaker({
    name: 'sms-send',
    threshold: 3,
    cooldownMs: 30000,
  })
  async send(dto: SendSmsDto) {
    const { mobile, templateCode, params = {} } = dto;

    // 1. 获取模板信息（包含渠道信息）
    const template = await this.smsTemplateService.getTemplateByCode(templateCode);
    if (!template) {
      throw new BadRequestException('短信模板不存在或未启用');
    }

    // 2. 验证模板参数
    const missingParams = this.smsTemplateService.validateTemplateParams(template.content, params);
    if (missingParams.length > 0) {
      throw new BadRequestException(`缺少模板参数: ${missingParams.join(', ')}`);
    }

    // 3. 解析模板内容
    const content = this.smsTemplateService.parseTemplateContent(template.content, params);

    // 4. 创建发送日志（状态为发送中）
    const log = await this.smsLogRepo.create({
      channelId: template.channelId,
      channelCode: template.channel.code,
      templateId: template.id,
      templateCode: template.code,
      mobile,
      content,
      params: JSON.stringify(params),
      sendStatus: SmsSendStatus.SENDING,
    });

    // 5. 获取短信客户端并发送
    const client = this.smsClientFactory.getClient(template.channel.code, {
      apiKey: template.channel.apiKey,
      apiSecret: template.channel.apiSecret,
      signature: template.channel.signature,
    });

    let sendResult: SmsSendResult;
    try {
      sendResult = await client.send({
        mobile,
        signature: template.channel.signature,
        apiTemplateId: template.apiTemplateId,
        params,
      });
    } catch (error: any) {
      this.logger.error(`SMS send error: ${error.message}`);
      sendResult = {
        success: false,
        errorMsg: error.message || '短信发送异常',
      };
    }

    // 6. 更新发送日志
    await this.smsLogRepo.update(log.id, {
      sendStatus: sendResult.success ? SmsSendStatus.SUCCESS : SmsSendStatus.FAILED,
      apiSendCode: sendResult.apiSendCode,
      errorMsg: sendResult.errorMsg,
    });

    // 7. 返回结果
    if (!sendResult.success) {
      throw new BadRequestException(sendResult.errorMsg || '短信发送失败');
    }

    return Result.ok({
      logId: log.id,
      apiSendCode: sendResult.apiSendCode,
    });
  }

  /**
   * 批量发送短信
   */
  async batchSend(dto: BatchSendSmsDto) {
    const { mobiles, templateCode, params = {} } = dto;

    // 验证手机号数量
    if (mobiles.length === 0) {
      throw new BadRequestException('手机号列表不能为空');
    }
    if (mobiles.length > 100) {
      throw new BadRequestException('单次批量发送不能超过100个手机号');
    }

    // 去重
    const uniqueMobiles = [...new Set(mobiles)];

    // 逐个发送
    const results: { mobile: string; success: boolean; logId?: number; error?: string }[] = [];

    for (const mobile of uniqueMobiles) {
      try {
        const result = await this.send({ mobile, templateCode, params });
        results.push({
          mobile,
          success: true,
          logId: result.data?.logId,
        });
      } catch (error: any) {
        results.push({
          mobile,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return Result.ok({
      total: uniqueMobiles.length,
      successCount,
      failCount,
      results,
    });
  }

  /**
   * 重发短信
   */
  async resend(logId: number) {
    const log = await this.smsLogRepo.findById(Number(logId));
    if (!log) {
      throw new BadRequestException('短信日志不存在');
    }

    // 只有失败的短信才能重发
    if (log.sendStatus !== SmsSendStatus.FAILED) {
      throw new BadRequestException('只有发送失败的短信才能重发');
    }

    // 解析原始参数
    const params = log.params ? JSON.parse(log.params) : {};

    // 重新发送
    return this.send({
      mobile: log.mobile,
      templateCode: log.templateCode,
      params,
    });
  }

  /**
   * 处理短信回调（更新接收状态）
   */
  async handleCallback(apiSendCode: string, receiveStatus: SmsReceiveStatus, apiReceiveCode?: string) {
    const log = await this.smsLogRepo.findByApiSendCode(apiSendCode);
    if (!log) {
      this.logger.warn(`SMS callback: log not found for apiSendCode ${apiSendCode}`);
      return;
    }

    await this.smsLogRepo.update(log.id, {
      receiveStatus,
      receiveTime: new Date(),
      apiReceiveCode,
    });

    this.logger.log(`SMS callback processed: ${apiSendCode}, status: ${receiveStatus}`);
  }
}
