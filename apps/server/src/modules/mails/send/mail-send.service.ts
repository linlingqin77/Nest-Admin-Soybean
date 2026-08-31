import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Result } from 'src/shared/response';
import { SendMailDto, BatchSendMailDto, TestMailDto } from './dto/index';
import { MailTemplateService } from '../templates/mail-template.service';
import { MailAccountService } from '../accounts/mail-account.service';
import { MailLogRepository } from '../logs/mail-log.repository';
import { Idempotent } from 'src/core/http/decorators/idempotent.decorator';
import { CircuitBreaker } from 'src/core/http/decorators/circuit-breaker.decorator';
import { CircuitBreakerService } from 'src/platform/resilience/circuit-breaker/circuit-breaker.service';
import * as crypto from 'crypto';

// 简单的密码加密密钥（与 mail-account.service.ts 保持一致）
const ENCRYPTION_KEY = process.env.MAIL_PASSWORD_KEY || 'mail-password-encryption-key-32b';

/**
 * 邮件发送状态枚举
 */
export enum MailSendStatus {
  SENDING = 0, // 发送中
  SUCCESS = 1, // 成功
  FAILED = 2, // 失败
}

@Injectable()
export class MailSendService {
  private readonly logger = new Logger(MailSendService.name);

  constructor(
    private readonly mailTemplateService: MailTemplateService,
    private readonly mailAccountService: MailAccountService,
    private readonly mailLogRepo: MailLogRepository,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  /**
   * 解密密码
   */
  private decryptPassword(encryptedPassword: string): string {
    try {
      const parts = encryptedPassword.split(':');
      if (parts.length !== 2) {
        return encryptedPassword; // 未加密的密码直接返回
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedPassword; // 解密失败返回原值
    }
  }

  /**
   * 创建邮件传输器
   */
  private createTransporter(account: {
    host: string;
    port: number;
    sslEnable: boolean;
    username: string;
    password: string;
  }): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.sslEnable,
      auth: {
        user: account.username,
        pass: this.decryptPassword(account.password),
      },
    });
  }

  /**
   * 发送邮件
   */
  @Idempotent({
    timeout: 10,
    keyResolver: '{body.toMail}:{body.templateCode}',
    message: '邮件正在发送中，请勿重复提交',
  })
  @CircuitBreaker({
    name: 'mail-send',
    threshold: 3,
    cooldownMs: 30000,
  })
  async send(dto: SendMailDto) {
    const { toMail, templateCode, params = {} } = dto;

    // 1. 获取模板信息（包含账号信息）
    const template = await this.mailTemplateService.getTemplateByCode(templateCode);
    if (!template) {
      throw new BadRequestException('邮件模板不存在或未启用');
    }

    // 2. 验证模板参数
    const missingParams = this.mailTemplateService.validateTemplateParams(template.content, params);
    if (missingParams.length > 0) {
      throw new BadRequestException(`缺少模板参数: ${missingParams.join(', ')}`);
    }

    // 3. 解析模板内容和标题
    const content = this.mailTemplateService.parseTemplateContent(template.content, params);
    const title = this.mailTemplateService.parseTemplateTitle(template.title, params);

    // 4. 创建发送日志（状态为发送中）
    const log = await this.mailLogRepo.create({
      toMail,
      accountId: template.accountId,
      fromMail: template.account.mail,
      templateId: template.id,
      templateCode: template.code,
      templateNickname: template.nickname,
      templateTitle: title,
      templateContent: content,
      templateParams: JSON.stringify(params),
      sendStatus: MailSendStatus.SENDING,
    });

    // 5. 创建邮件传输器并发送
    const transporter = this.createTransporter(template.account);

    try {
      await transporter.sendMail({
        from: `"${template.nickname}" <${template.account.mail}>`,
        to: toMail,
        subject: title,
        html: content,
      });

      // 6. 更新发送日志为成功
      await this.mailLogRepo.update(log.id, {
        sendStatus: MailSendStatus.SUCCESS,
      });

      this.logger.log(`Mail sent successfully to ${toMail}`);

      return Result.ok({
        logId: log.id.toString(),
      });
    } catch (error: any) {
      this.logger.error(`Mail send error: ${error.message}`);

      // 更新发送日志为失败
      await this.mailLogRepo.update(log.id, {
        sendStatus: MailSendStatus.FAILED,
        errorMsg: error.message || '邮件发送异常',
      });

      throw new BadRequestException(error.message || '邮件发送失败');
    }
  }

  /**
   * 批量发送邮件
   */
  async batchSend(dto: BatchSendMailDto) {
    const { toMails, templateCode, params = {} } = dto;

    // 验证邮箱数量
    if (toMails.length === 0) {
      throw new BadRequestException('收件人列表不能为空');
    }
    if (toMails.length > 100) {
      throw new BadRequestException('单次批量发送不能超过100个收件人');
    }

    // 去重
    const uniqueMails = [...new Set(toMails)];

    // 逐个发送
    const results: { toMail: string; success: boolean; logId?: string; error?: string }[] = [];

    for (const toMail of uniqueMails) {
      try {
        const result = await this.send({ toMail, templateCode, params });
        results.push({
          toMail,
          success: true,
          logId: result.data?.logId,
        });
      } catch (error: any) {
        results.push({
          toMail,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return Result.ok({
      total: uniqueMails.length,
      successCount,
      failCount,
      results,
    });
  }

  /**
   * 重发邮件
   */
  async resend(logId: string) {
    const log = await this.mailLogRepo.findById(BigInt(logId));
    if (!log) {
      throw new BadRequestException('邮件日志不存在');
    }

    // 只有失败的邮件才能重发
    if (log.sendStatus !== MailSendStatus.FAILED) {
      throw new BadRequestException('只有发送失败的邮件才能重发');
    }

    // 解析原始参数
    const params = log.templateParams ? JSON.parse(log.templateParams) : {};

    // 重新发送
    return this.send({
      toMail: log.toMail,
      templateCode: log.templateCode,
      params,
    });
  }

  /**
   * 测试邮件发送（直接使用账号发送，不使用模板）
   */
  @CircuitBreaker({
    name: 'mail-test',
    threshold: 5,
    cooldownMs: 30000,
  })
  async testSend(dto: TestMailDto) {
    const { toMail, accountId, title = '测试邮件', content = '<p>这是一封测试邮件</p>' } = dto;

    // 获取账号信息
    const account = await this.mailAccountService.getAccountById(accountId);
    if (!account) {
      throw new BadRequestException('邮箱账号不存在或未启用');
    }

    // 创建邮件传输器并发送
    const transporter = this.createTransporter(account);

    try {
      await transporter.sendMail({
        from: `"测试" <${account.mail}>`,
        to: toMail,
        subject: title,
        html: content,
      });

      this.logger.log(`Test mail sent successfully to ${toMail}`);

      return Result.ok({
        message: '测试邮件发送成功',
      });
    } catch (error: any) {
      this.logger.error(`Test mail send error: ${error.message}`);
      throw new BadRequestException(error.message || '测试邮件发送失败');
    }
  }
}
