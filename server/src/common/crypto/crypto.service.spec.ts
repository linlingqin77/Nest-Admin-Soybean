import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { AppConfigService } from 'src/config/app-config.service';
import { createConfigMock, ConfigMock } from 'src/test-utils/config-mock';
import * as crypto from 'crypto';

describe('CryptoService', () => {
  let service: CryptoService;
  let configMock: ConfigMock;

  // 测试用 RSA 密钥对
  const testKeyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  beforeEach(async () => {
    configMock = createConfigMock();
    configMock.setCrypto({
      enabled: true,
      rsaPublicKey: testKeyPair.publicKey,
      rsaPrivateKey: testKeyPair.privateKey,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        { provide: AppConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize with enabled crypto', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should initialize with disabled crypto', () => {
      configMock.setCrypto({ enabled: false });
      const disabledService = new CryptoService(configMock as any);
      disabledService.onModuleInit();
      expect(disabledService.isEnabled()).toBe(false);
    });

    it('should generate key pair when keys not configured', () => {
      configMock.setCrypto({
        enabled: true,
        rsaPublicKey: '',
        rsaPrivateKey: '',
      });
      const newService = new CryptoService(configMock as any);
      newService.onModuleInit();
      expect(newService.getPublicKey()).toContain('-----BEGIN PUBLIC KEY-----');
    });

    it('should handle Base64 format keys', () => {
      // 将 PEM 密钥转换为 Base64 格式（去掉头尾和换行）
      const base64PublicKey = testKeyPair.publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, '');
      const base64PrivateKey = testKeyPair.privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\n/g, '');

      configMock.setCrypto({
        enabled: true,
        rsaPublicKey: base64PublicKey,
        rsaPrivateKey: base64PrivateKey,
      });

      const newService = new CryptoService(configMock as any);
      newService.onModuleInit();
      expect(newService.isEnabled()).toBe(true);
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', () => {
      const publicKey = service.getPublicKey();
      expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    });
  });

  describe('generateAesKey', () => {
    it('should generate 16 character AES key', () => {
      const key = service.generateAesKey();
      expect(key).toHaveLength(16);
    });

    it('should generate unique keys', () => {
      const key1 = service.generateAesKey();
      const key2 = service.generateAesKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('RSA encryption/decryption', () => {
    it('should encrypt and decrypt data with RSA', () => {
      const originalData = 'test-aes-key-123';
      const encrypted = service.rsaEncrypt(originalData);
      const decrypted = service.rsaDecrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should handle short data', () => {
      const originalData = 'a';
      const encrypted = service.rsaEncrypt(originalData);
      const decrypted = service.rsaDecrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should throw error on invalid encrypted data', () => {
      expect(() => service.rsaDecrypt('invalid-data')).toThrow('RSA decrypt failed');
    });
  });

  describe('AES encryption/decryption', () => {
    it('should encrypt and decrypt data with AES', () => {
      const aesKey = service.generateAesKey();
      const originalData = 'Hello, World!';
      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);
      expect(decrypted).toBe(originalData);
    });

    it('should handle JSON data', () => {
      const aesKey = service.generateAesKey();
      const originalData = JSON.stringify({ name: 'test', value: 123 });
      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);
      expect(decrypted).toBe(originalData);
    });

    it('should handle long data', () => {
      const aesKey = service.generateAesKey();
      const originalData = 'a'.repeat(10000);
      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);
      expect(decrypted).toBe(originalData);
    });

    it('should handle unicode data', () => {
      const aesKey = service.generateAesKey();
      const originalData = '你好世界 🌍 مرحبا';
      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);
      expect(decrypted).toBe(originalData);
    });

    it('should handle keys of different lengths', () => {
      const shortKey = 'short';
      const originalData = 'test data';
      const encrypted = service.aesEncrypt(originalData, shortKey);
      const decrypted = service.aesDecrypt(encrypted, shortKey);
      expect(decrypted).toBe(originalData);
    });

    it('should handle 32-byte key', () => {
      const exactKey = '12345678901234567890123456789012';
      const originalData = 'test data';
      const encrypted = service.aesEncrypt(originalData, exactKey);
      const decrypted = service.aesDecrypt(encrypted, exactKey);
      expect(decrypted).toBe(originalData);
    });

    it('should throw error on invalid encrypted data', () => {
      const aesKey = service.generateAesKey();
      expect(() => service.aesDecrypt('invalid', aesKey)).toThrow('AES decrypt failed');
    });
  });

  describe('decryptRequest', () => {
    it('should decrypt request with encrypted key and data', () => {
      const originalData = { username: 'test', password: 'secret' };
      const aesKey = service.generateAesKey();
      
      // 模拟前端加密流程
      const aesKeyBase64 = Buffer.from(aesKey).toString('base64');
      const encryptedKey = service.rsaEncrypt(aesKeyBase64);
      const encryptedData = service.aesEncrypt(JSON.stringify(originalData), aesKey);

      const decrypted = service.decryptRequest(encryptedKey, encryptedData);
      expect(decrypted).toEqual(originalData);
    });
  });

  describe('encryptResponse', () => {
    it('should encrypt response with new AES key', () => {
      const originalData = { status: 'success', data: [1, 2, 3] };
      const result = service.encryptResponse(originalData);

      expect(result.encryptedKey).toBeTruthy();
      expect(result.encryptedData).toBeTruthy();
    });

    it('should encrypt response with provided AES key', () => {
      const originalData = { status: 'success' };
      const clientAesKey = service.generateAesKey();
      const result = service.encryptResponse(originalData, clientAesKey);

      expect(result.encryptedKey).toBe('');
      expect(result.encryptedData).toBeTruthy();

      // 验证可以解密
      const decrypted = service.aesDecrypt(result.encryptedData, clientAesKey);
      expect(JSON.parse(decrypted)).toEqual(originalData);
    });
  });

  describe('end-to-end encryption flow', () => {
    it('should complete full encryption/decryption cycle', () => {
      // 1. 前端生成 AES 密钥
      const clientAesKey = service.generateAesKey();
      
      // 2. 前端加密请求
      const requestData = { action: 'login', credentials: { user: 'admin' } };
      const aesKeyBase64 = Buffer.from(clientAesKey).toString('base64');
      const encryptedKey = service.rsaEncrypt(aesKeyBase64);
      const encryptedData = service.aesEncrypt(JSON.stringify(requestData), clientAesKey);

      // 3. 后端解密请求
      const decryptedRequest = service.decryptRequest(encryptedKey, encryptedData);
      expect(decryptedRequest).toEqual(requestData);

      // 4. 后端加密响应
      const responseData = { success: true, token: 'jwt-token' };
      const encryptedResponse = service.encryptResponse(responseData, clientAesKey);

      // 5. 前端解密响应
      const decryptedResponse = service.aesDecrypt(encryptedResponse.encryptedData, clientAesKey);
      expect(JSON.parse(decryptedResponse)).toEqual(responseData);
    });
  });
});
