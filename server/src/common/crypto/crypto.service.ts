import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from 'src/config/app-config.service';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

/**
 * 加解密服务
 *
 * 实现 RSA + AES 混合加密方案:
 * - RSA 用于加密/解密 AES 密钥
 * - AES 用于加密/解密实际数据
 *
 * 与 Soybean 前端的 crypto.ts 保持一致
 */
@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);

  // RSA 密钥对
  private publicKey: string;
  private privateKey: string;

  // 是否启用加密
  private enabled: boolean = false;

  constructor(private config: AppConfigService) {}

  onModuleInit() {
    this.enabled = this.config.crypto.enabled;

    if (this.enabled) {
      // 从配置加载或生成 RSA 密钥对
      const publicKeyConfig = this.config.crypto.rsaPublicKey || '';
      const privateKeyConfig = this.config.crypto.rsaPrivateKey || '';

      if (!publicKeyConfig || !privateKeyConfig) {
        this.logger.warn('RSA keys not configured, generating new key pair...');
        this.generateRsaKeyPair();
      } else {
        // 处理公钥格式：如果不是 PEM 格式，则转换
        this.publicKey = this.normalizePemKey(publicKeyConfig, 'PUBLIC KEY');
        // 处理私钥格式：如果不是 PEM 格式，则转换
        this.privateKey = this.normalizePemKey(privateKeyConfig, 'PRIVATE KEY');
      }

      this.logger.log('Crypto service initialized with RSA+AES encryption');
    } else {
      this.logger.log('Crypto service disabled');
    }
  }

  /**
   * 将 Base64 密钥转换为 PEM 格式
   * 如果已经是 PEM 格式则直接返回
   */
  private normalizePemKey(key: string, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
    const trimmedKey = key.trim();

    // 已经是 PEM 格式
    if (trimmedKey.startsWith('-----BEGIN')) {
      return trimmedKey;
    }

    // 将 Base64 格式转换为 PEM 格式
    // 每 64 个字符换行
    const base64Lines = trimmedKey.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${base64Lines.join('\n')}\n-----END ${type}-----`;
  }

  /**
   * 检查加密是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取 RSA 公钥 (返回给前端用于加密)
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * 生成 RSA 密钥对
   */
  private generateRsaKeyPair(): void {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.publicKey = publicKey;
    this.privateKey = privateKey;

    // 输出公钥供配置使用
    this.logger.debug('Generated RSA Public Key:');
    this.logger.debug(this.publicKey);
  }

  /**
   * RSA 解密 (使用私钥解密前端发送的 AES 密钥)
   * 使用 node-forge 库以支持 PKCS1 v1.5 填充 (与前端 JSEncrypt 兼容)
   */
  rsaDecrypt(encryptedData: string): string {
    try {
      // 将 PEM 格式私钥转换为 forge 私钥对象
      const privateKeyObj = forge.pki.privateKeyFromPem(this.privateKey);

      // Base64 解码
      const encryptedBytes = forge.util.decode64(encryptedData);

      // 使用 PKCS1 v1.5 填充解密
      const decrypted = privateKeyObj.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');

      return decrypted;
    } catch (error) {
      this.logger.error('RSA decrypt error:', error.message);
      throw new Error('RSA decrypt failed');
    }
  }

  /**
   * RSA 加密 (使用公钥加密 AES 密钥返回给前端)
   * 使用 node-forge 库以支持 PKCS1 v1.5 填充 (与前端 JSEncrypt 兼容)
   */
  rsaEncrypt(data: string): string {
    try {
      // 将 PEM 格式公钥转换为 forge 公钥对象
      const publicKeyObj = forge.pki.publicKeyFromPem(this.publicKey);

      // 使用 PKCS1 v1.5 填充加密
      const encrypted = publicKeyObj.encrypt(data, 'RSAES-PKCS1-V1_5');

      // Base64 编码
      return forge.util.encode64(encrypted);
    } catch (error) {
      this.logger.error('RSA encrypt error:', error.message);
      throw new Error('RSA encrypt failed');
    }
  }

  /**
   * AES 解密 (CBC 模式，PKCS7 填充)
   * 密文格式: IV(16字节) + 加密数据，整体 Base64 编码
   * 与前端 crypto.ts 保持一致
   */
  aesDecrypt(encryptedData: string, aesKey: string): string {
    try {
      // 确保 AES key 是 32 字节 (256位) - 与前端 CryptoJS 保持一致
      const key = this.normalizeAesKey(aesKey, 32);

      // Base64 解码
      const ivAndCiphertext = Buffer.from(encryptedData, 'base64');

      // 提取 IV (前16字节)
      const iv = ivAndCiphertext.subarray(0, 16);

      // 提取密文 (剩余部分)
      const ciphertext = ivAndCiphertext.subarray(16);

      // 使用 CBC 模式解密 (AES-256)
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decipher.setAutoPadding(true); // PKCS7 padding

      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('AES decrypt error:', error.message);
      throw new Error('AES decrypt failed');
    }
  }

  /**
   * AES 加密 (CBC 模式，PKCS7 填充)
   * 返回格式: IV(16字节) + 加密数据，整体 Base64 编码
   * 与前端 crypto.ts 保持一致
   */
  aesEncrypt(data: string, aesKey: string): string {
    try {
      // 确保 AES key 是 32 字节 (256位) - 与前端 CryptoJS 保持一致
      const key = this.normalizeAesKey(aesKey, 32);

      // 生成随机 IV
      const iv = crypto.randomBytes(16);

      // 使用 CBC 模式加密 (AES-256)
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      cipher.setAutoPadding(true); // PKCS7 padding

      let encrypted = cipher.update(data, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // 拼接 IV + 密文
      const ivAndCiphertext = Buffer.concat([iv, encrypted]);

      return ivAndCiphertext.toString('base64');
    } catch (error) {
      this.logger.error('AES encrypt error:', error.message);
      throw new Error('AES encrypt failed');
    }
  }

  /**
   * 规范化 AES 密钥到指定字节数
   * @param key 原始密钥字符串
   * @param length 目标字节数，默认 32 (AES-256)
   */
  private normalizeAesKey(key: string, length: number = 32): Buffer {
    const keyBuffer = Buffer.from(key, 'utf8');
    if (keyBuffer.length === length) {
      return keyBuffer;
    }
    // 如果不是指定字节数，进行填充或截断
    const normalizedKey = Buffer.alloc(length);
    keyBuffer.copy(normalizedKey, 0, 0, Math.min(keyBuffer.length, length));
    return normalizedKey;
  }

  /**
   * 生成随机 AES 密钥
   */
  generateAesKey(): string {
    return crypto.randomBytes(16).toString('hex').substring(0, 16);
  }

  /**
   * 解密请求数据
   * 前端发送格式: { encryptedKey: string, encryptedData: string }
   *
   * 流程:
   * 1. RSA 解密 encryptedKey 得到 Base64 编码的 AES 密钥
   * 2. Base64 解码得到原始 AES 密钥
   * 3. 使用 AES 密钥解密数据
   */
  decryptRequest(encryptedKey: string, encryptedData: string): any {
    // 1. 使用 RSA 私钥解密 AES 密钥 (得到 Base64 编码的密钥)
    const aesKeyBase64 = this.rsaDecrypt(encryptedKey);

    // 2. Base64 解码得到原始 AES 密钥
    const aesKey = Buffer.from(aesKeyBase64, 'base64').toString('utf8');

    this.logger.debug(`Decrypted AES key length: ${aesKey.length}`);

    // 3. 使用 AES 密钥解密数据
    const decryptedJson = this.aesDecrypt(encryptedData, aesKey);

    // 4. 解析 JSON
    return JSON.parse(decryptedJson);
  }

  /**
   * 加密响应数据
   * 返回格式: { encryptedKey: string, encryptedData: string }
   */
  encryptResponse(data: any, clientAesKey?: string): { encryptedKey: string; encryptedData: string } {
    // 如果客户端提供了 AES 密钥，使用它；否则生成新的
    const aesKey = clientAesKey || this.generateAesKey();

    // 1. 使用 AES 加密数据
    const jsonData = JSON.stringify(data);
    const encryptedData = this.aesEncrypt(jsonData, aesKey);

    // 2. 使用 RSA 公钥加密 AES 密钥 (如果需要发送新密钥)
    const encryptedKey = clientAesKey ? '' : this.rsaEncrypt(aesKey);

    return { encryptedKey, encryptedData };
  }
}
