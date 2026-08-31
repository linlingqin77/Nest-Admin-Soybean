import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/platform/redis/redis.service';
import { PrismaService } from 'src/platform/prisma';
import { BusinessException } from 'src/shared/exceptions';
import { ResponseCode } from 'src/shared/response';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';

/**
 * MFA 类型
 */
export enum MfaType {
  TOTP = 'totp',
  SMS = 'sms',
}

/**
 * MFA 配置信息
 */
export interface MfaSetupInfo {
  /** TOTP 密钥 */
  secret: string;
  /** OTPAuth URI（用于导入到 Authenticator 应用） */
  otpauthUrl: string;
  /** QR Code 图片（Base64 Data URL） */
  qrCode: string;
}

/**
 * MFA Redis 缓存前缀
 */
const MFA_CACHE_PREFIX = {
  /** TOTP 密钥存储 */
  SECRET: 'mfa:totp:secret:',
  /** TOTP 临时设置密钥（验证前） */
  SETUP: 'mfa:totp:setup:',
  /** SMS 验证码 */
  SMS_CODE: 'mfa:sms:code:',
  /** MFA 验证通过临时 token */
  VERIFIED: 'mfa:verified:',
};

/**
 * 多因素认证（MFA）服务
 *
 * 支持两种 MFA 方式：
 * 1. TOTP (Time-based One-Time Password) - Google Authenticator / Microsoft Authenticator
 * 2. SMS 短信验证码
 *
 * 工作流程：
 * 1. 用户首次登录成功后，检查是否启用了 MFA
 * 2. 如果启用了 TOTP，返回需要验证 TOTP 的标识
 * 3. 前端调用 verifyTotp 接口验证 TOTP 码
 * 4. 验证通过后颁发完整的登录 token
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  /** TOTP 发行者名称 */
  private readonly ISSUER = 'NestAdmin';
  /** TOTP 密钥长度（字节） */
  private readonly SECRET_SIZE = 20;
  /** SMS 验证码有效期（秒） */
  private readonly SMS_CODE_TTL = 300; // 5 分钟
  /** MFA 临时设置有效期（秒） */
  private readonly SETUP_TTL = 600; // 10 分钟
  /** MFA 验证通过有效期（秒） */
  private readonly VERIFIED_TTL = 300; // 5 分钟

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 生成 TOTP 设置信息（绑定 Authenticator 应用时调用）
   *
   * @param userId 用户ID
   * @param userName 用户名
   * @returns MFA 设置信息（包含 QR Code）
   */
  async generateTotpSetup(userId: number, userName: string): Promise<MfaSetupInfo> {
    // 生成随机密钥
    const secret = new OTPAuth.Secret({ size: this.SECRET_SIZE });

    // 创建 TOTP 实例
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      label: userName,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const otpauthUrl = totp.toString();

    // 生成 QR Code
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // 临时保存密钥（验证后才正式绑定）
    await this.redisService.set(
      `${MFA_CACHE_PREFIX.SETUP}${userId}`,
      secret.base32,
      this.SETUP_TTL * 1000,
    );

    this.logger.log(`TOTP setup generated for userId=${userId}`);

    return {
      secret: secret.base32,
      otpauthUrl,
      qrCode,
    };
  }

  /**
   * 确认绑定 TOTP（用户输入第一个验证码确认绑定）
   *
   * @param userId 用户ID
   * @param totpCode 用户输入的 TOTP 验证码
   */
  async confirmTotpBinding(userId: number, totpCode: string): Promise<void> {
    // 获取临时密钥
    const secret = await this.redisService.get(`${MFA_CACHE_PREFIX.SETUP}${userId}`);
    if (!secret) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, 'TOTP 设置已过期，请重新生成');
    }

    // 验证 TOTP 码
    const isValid = this.verifyTotpCode(secret as string, totpCode);
    if (!isValid) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, 'TOTP 验证码错误');
    }

    // 正式保存密钥到 Redis（持久化）
    await this.redisService.set(
      `${MFA_CACHE_PREFIX.SECRET}${userId}`,
      secret,
      0, // 不过期
    );

    // 清除临时密钥
    await this.redisService.del(`${MFA_CACHE_PREFIX.SETUP}${userId}`);

    this.logger.log(`TOTP binding confirmed for userId=${userId}`);
  }

  /**
   * 验证 TOTP 码（登录时调用）
   *
   * @param userId 用户ID
   * @param totpCode 用户输入的 TOTP 验证码
   * @returns 是否验证通过
   */
  async verifyTotp(userId: number, totpCode: string): Promise<boolean> {
    const secret = await this.redisService.get(`${MFA_CACHE_PREFIX.SECRET}${userId}`);
    if (!secret) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '未绑定 TOTP，请先进行绑定');
    }

    const isValid = this.verifyTotpCode(secret as string, totpCode);
    if (isValid) {
      // 设置验证通过标记
      await this.setMfaVerified(userId);
    }
    return isValid;
  }

  /**
   * 生成并发送短信验证码
   *
   * @param userId 用户ID
   * @param phone 手机号
   * @returns 验证码（仅开发环境返回，生产环境返回空）
   */
  async sendSmsCode(userId: number, phone: string): Promise<string | null> {
    // 生成 6 位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存到 Redis
    await this.redisService.set(
      `${MFA_CACHE_PREFIX.SMS_CODE}${userId}`,
      code,
      this.SMS_CODE_TTL * 1000,
    );

    this.logger.log(`SMS MFA code generated for userId=${userId}, phone=${phone}`);

    // 注意：实际短信发送应通过 SmsSendService
    // 这里仅保存验证码，调用方负责发送
    if (process.env.NODE_ENV === 'development') {
      return code; // 开发环境返回验证码方便调试
    }
    return null;
  }

  /**
   * 验证短信验证码
   *
   * @param userId 用户ID
   * @param code 用户输入的验证码
   * @returns 是否验证通过
   */
  async verifySmsCode(userId: number, code: string): Promise<boolean> {
    const savedCode = await this.redisService.get(`${MFA_CACHE_PREFIX.SMS_CODE}${userId}`);
    if (!savedCode) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '验证码已过期，请重新发送');
    }

    const isValid = savedCode === code;
    if (isValid) {
      // 清除验证码
      await this.redisService.del(`${MFA_CACHE_PREFIX.SMS_CODE}${userId}`);
      // 设置验证通过标记
      await this.setMfaVerified(userId);
    }
    return isValid;
  }

  /**
   * 检查用户是否已启用 MFA
   *
   * @param userId 用户ID
   * @returns MFA 类型列表（为空表示未启用）
   */
  async getEnabledMfaTypes(userId: number): Promise<MfaType[]> {
    const types: MfaType[] = [];

    // 检查是否绑定了 TOTP
    const totpSecret = await this.redisService.get(`${MFA_CACHE_PREFIX.SECRET}${userId}`);
    if (totpSecret) {
      types.push(MfaType.TOTP);
    }

    return types;
  }

  /**
   * 检查用户是否已通过 MFA 验证
   *
   * @param userId 用户ID
   * @returns 是否已通过 MFA
   */
  async isMfaVerified(userId: number): Promise<boolean> {
    const verified = await this.redisService.get(`${MFA_CACHE_PREFIX.VERIFIED}${userId}`);
    return verified === 'true';
  }

  /**
   * 设置 MFA 验证通过
   */
  private async setMfaVerified(userId: number): Promise<void> {
    await this.redisService.set(
      `${MFA_CACHE_PREFIX.VERIFIED}${userId}`,
      'true',
      this.VERIFIED_TTL * 1000,
    );
  }

  /**
   * 清除 MFA 验证状态（登出时调用）
   */
  async clearMfaVerified(userId: number): Promise<void> {
    await this.redisService.del(`${MFA_CACHE_PREFIX.VERIFIED}${userId}`);
  }

  /**
   * 解除 TOTP 绑定
   *
   * @param userId 用户ID
   */
  async unbindTotp(userId: number): Promise<void> {
    await this.redisService.del(`${MFA_CACHE_PREFIX.SECRET}${userId}`);
    this.logger.log(`TOTP unbound for userId=${userId}`);
  }

  /**
   * 验证 TOTP 码的内部方法
   */
  private verifyTotpCode(base32Secret: string, code: string): boolean {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: this.ISSUER,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(base32Secret),
      });

      // 验证时允许前后各 1 个时间窗口的偏差（共 3 个窗口，±30秒）
      const delta = totp.validate({ token: code, window: 1 });
      return delta !== null;
    } catch (error) {
      this.logger.warn(`TOTP verification error: ${error.message}`);
      return false;
    }
  }
}
