import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { AppConfigService } from 'src/config/app-config.service';
import * as crypto from 'crypto';

describe('CryptoService', () => {
  let service: CryptoService;
  let configService: jest.Mocked<AppConfigService>;

  // 生成测试用的 RSA 密钥对
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const mockConfigService = {
    crypto: {
      enabled: true,
      rsaPublicKey: publicKey,
      rsaPrivateKey: privateKey,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
    configService = module.get(AppConfigService);
    
    // 手动调用 onModuleInit
    service.onModuleInit();
  });

  describe('onModuleInit', () => {
    it('should initialize with configured RSA keys', () => {
      expect(service.isEnabled()).toBe(true);
      expect(service.getPublicKey()).toBeDefined();
    });

    it('should be disabled when crypto is disabled', async () => {
      const disabledModule: TestingModule = await Test.createTestingModule({
        providers: [
          CryptoService,
          {
            provide: AppConfigService,
            useValue: {
              crypto: {
                enabled: false,
                rsaPublicKey: '',
                rsaPrivateKey: '',
              },
            },
          },
        ],
      }).compile();

      const disabledService = disabledModule.get<CryptoService>(CryptoService);
      disabledService.onModuleInit();

      expect(disabledService.isEnabled()).toBe(false);
    });

    it('should generate new keys when not configured', async () => {
      const noKeysModule: TestingModule = await Test.createTestingModule({
        providers: [
          CryptoService,
          {
            provide: AppConfigService,
            useValue: {
              crypto: {
                enabled: true,
                rsaPublicKey: '',
                rsaPrivateKey: '',
              },
            },
          },
        ],
      }).compile();

      const noKeysService = noKeysModule.get<CryptoService>(CryptoService);
      noKeysService.onModuleInit();

      expect(noKeysService.isEnabled()).toBe(true);
      expect(noKeysService.getPublicKey()).toContain('-----BEGIN PUBLIC KEY-----');
    });

    it('should handle Base64 encoded keys', async () => {
      // 将 PEM 密钥转换为 Base64（去掉头尾和换行）
      const base64PublicKey = publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, '');
      const base64PrivateKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\n/g, '');

      const base64Module: TestingModule = await Test.createTestingModule({
        providers: [
          CryptoService,
          {
            provide: AppConfigService,
            useValue: {
              crypto: {
                enabled: true,
                rsaPublicKey: base64PublicKey,
                rsaPrivateKey: base64PrivateKey,
              },
            },
          },
        ],
      }).compile();

      const base64Service = base64Module.get<CryptoService>(CryptoService);
      base64Service.onModuleInit();

      expect(base64Service.isEnabled()).toBe(true);
      expect(base64Service.getPublicKey()).toContain('-----BEGIN PUBLIC KEY-----');
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('getPublicKey', () => {
    it('should return the public key', () => {
      const key = service.getPublicKey();
      expect(key).toContain('-----BEGIN PUBLIC KEY-----');
      expect(key).toContain('-----END PUBLIC KEY-----');
    });
  });

  describe('generateAesKey', () => {
    it('should generate a 16 character AES key', () => {
      const key = service.generateAesKey();
      expect(key).toHaveLength(16);
    });

    it('should generate unique keys', () => {
      const key1 = service.generateAesKey();
      const key2 = service.generateAesKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('AES encryption/decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const aesKey = service.generateAesKey();
      const originalData = 'Hello, World!';

      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);

      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt JSON data', () => {
      const aesKey = service.generateAesKey();
      const originalData = JSON.stringify({ username: 'test', password: 'secret' });

      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);

      expect(decrypted).toBe(originalData);
      expect(JSON.parse(decrypted)).toEqual({ username: 'test', password: 'secret' });
    });

    it('should handle Chinese characters', () => {
      const aesKey = service.generateAesKey();
      const originalData = '你好，世界！';

      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);

      expect(decrypted).toBe(originalData);
    });

    it('should handle long data', () => {
      const aesKey = service.generateAesKey();
      const originalData = 'A'.repeat(10000);

      const encrypted = service.aesEncrypt(originalData, aesKey);
      const decrypted = service.aesDecrypt(encrypted, aesKey);

      expect(decrypted).toBe(originalData);
    });

    it('should handle short AES key by padding', () => {
      const shortKey = 'short';
      const originalData = 'Test data';

      const encrypted = service.aesEncrypt(originalData, shortKey);
      const decrypted = service.aesDecrypt(encrypted, shortKey);

      expect(decrypted).toBe(originalData);
    });

    it('should handle long AES key by truncating', () => {
      const longKey = 'A'.repeat(64);
      const originalData = 'Test data';

      const encrypted = service.aesEncrypt(originalData, longKey);
      const decrypted = service.aesDecrypt(encrypted, longKey);

      expect(decrypted).toBe(originalData);
    });

    it('should throw error for invalid encrypted data', () => {
      const aesKey = service.generateAesKey();

      expect(() => {
        service.aesDecrypt('invalid-base64-data!!!', aesKey);
      }).toThrow('AES decrypt failed');
    });
  });

  describe('RSA encryption/decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'Hello, RSA!';

      const encrypted = service.rsaEncrypt(originalData);
      const decrypted = service.rsaDecrypt(encrypted);

      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt AES key', () => {
      const aesKey = service.generateAesKey();

      const encrypted = service.rsaEncrypt(aesKey);
      const decrypted = service.rsaDecrypt(encrypted);

      expect(decrypted).toBe(aesKey);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => {
        service.rsaDecrypt('invalid-data');
      }).toThrow('RSA decrypt failed');
    });
  });

  describe('decryptRequest', () => {
    it('should decrypt request with encrypted key and data', () => {
      const originalData = { username: 'admin', password: 'secret123' };
      const aesKey = service.generateAesKey();

      // 模拟前端加密流程
      const aesKeyBase64 = Buffer.from(aesKey).toString('base64');
      const encryptedKey = service.rsaEncrypt(aesKeyBase64);
      const encryptedData = service.aesEncrypt(JSON.stringify(originalData), aesKey);

      const decrypted = service.decryptRequest(encryptedKey, encryptedData);

      expect(decrypted).toEqual(originalData);
    });

    it('should handle complex nested objects', () => {
      const originalData = {
        user: {
          name: 'Test User',
          roles: ['admin', 'user'],
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };
      const aesKey = service.generateAesKey();

      const aesKeyBase64 = Buffer.from(aesKey).toString('base64');
      const encryptedKey = service.rsaEncrypt(aesKeyBase64);
      const encryptedData = service.aesEncrypt(JSON.stringify(originalData), aesKey);

      const decrypted = service.decryptRequest(encryptedKey, encryptedData);

      expect(decrypted).toEqual(originalData);
    });
  });

  describe('encryptResponse', () => {
    it('should encrypt response data', () => {
      const originalData = { success: true, message: 'OK' };

      const { encryptedKey, encryptedData } = service.encryptResponse(originalData);

      expect(encryptedKey).toBeDefined();
      expect(encryptedData).toBeDefined();
      expect(encryptedKey.length).toBeGreaterThan(0);
      expect(encryptedData.length).toBeGreaterThan(0);
    });

    it('should use provided AES key when available', () => {
      const originalData = { success: true };
      const clientAesKey = service.generateAesKey();

      const { encryptedKey, encryptedData } = service.encryptResponse(originalData, clientAesKey);

      // 当提供客户端 AES 密钥时，encryptedKey 应为空
      expect(encryptedKey).toBe('');
      expect(encryptedData).toBeDefined();

      // 验证可以用相同的密钥解密
      const decrypted = service.aesDecrypt(encryptedData, clientAesKey);
      expect(JSON.parse(decrypted)).toEqual(originalData);
    });

    it('should generate new AES key when not provided', () => {
      const originalData = { data: 'test' };

      const { encryptedKey, encryptedData } = service.encryptResponse(originalData);

      // 应该生成新的加密密钥
      expect(encryptedKey.length).toBeGreaterThan(0);
      expect(encryptedData.length).toBeGreaterThan(0);
    });
  });
});
