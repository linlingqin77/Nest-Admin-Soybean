/**
 * 数据源服务属性测试
 *
 * Property 1: 数据源密码加密往返
 * **Validates: Requirements 1.6**
 */
import * as fc from 'fast-check';
import { DataSourceService } from '@/modules/tools/datasource/datasource.service';
import { PrismaService } from '@/platform/prisma';
import { Test, TestingModule } from '@nestjs/testing';

describe('DataSourceService - Property Tests', () => {
  let service: DataSourceService;

  beforeEach(async () => {
    // 创建一个最小化的 mock PrismaService
    const mockPrismaService = {
      genDataSource: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      genTable: {
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        DataSourceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<DataSourceService>(DataSourceService);
  });

  describe('Property 1: 数据源密码加密往返', () => {
    /**
     * **Validates: Requirements 1.6**
     *
     * *For any* valid password string, encrypting then decrypting
     * should produce the original password.
     */
    it('should encrypt and decrypt password correctly (round-trip)', () => {
      fc.assert(
        fc.property(
          // 生成随机密码字符串，长度 1-100，包含各种字符
          fc.string({ minLength: 1, maxLength: 100 }),
          (password) => {
            // 加密密码
            const encrypted = service.encryptPassword(password);

            // 验证加密后的格式（IV:密文）
            expect(encrypted).toContain(':');
            expect(encrypted).not.toBe(password);

            // 解密密码
            const decrypted = service.decryptPassword(encrypted);

            // 验证往返一致性
            return decrypted === password;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.6**
     *
     * *For any* password containing special characters,
     * the encryption/decryption should handle them correctly.
     */
    it('should handle special characters in passwords', () => {
      fc.assert(
        fc.property(
          // 生成包含特殊字符的密码
          fc.string({ minLength: 1, maxLength: 50 }).map((s) => {
            // 添加一些特殊字符
            const specialChars = '!@#$%^&*()-_=+[]{}|\\:;"\'<>,.?/`~';
            const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
            return s + randomSpecial;
          }),
          (password) => {
            const encrypted = service.encryptPassword(password);
            const decrypted = service.decryptPassword(encrypted);
            return decrypted === password;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.6**
     *
     * *For any* password containing Unicode characters,
     * the encryption/decryption should handle them correctly.
     */
    it('should handle Unicode characters in passwords', () => {
      fc.assert(
        fc.property(
          // 生成包含 Unicode 字符的密码（中文、日文、韩文等）
          fc.string({ minLength: 1, maxLength: 50 }),
          (password) => {
            const encrypted = service.encryptPassword(password);
            const decrypted = service.decryptPassword(encrypted);
            return decrypted === password;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.6**
     *
     * *For any* two different passwords, their encrypted forms should be different
     * (due to random IV).
     */
    it('should produce different ciphertexts for same password (random IV)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (password) => {
          const encrypted1 = service.encryptPassword(password);
          const encrypted2 = service.encryptPassword(password);

          // 由于使用随机 IV，相同密码的两次加密结果应该不同
          return encrypted1 !== encrypted2;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.6**
     *
     * *For any* encrypted password, the format should be IV:ciphertext.
     */
    it('should produce encrypted format with IV prefix', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (password) => {
          const encrypted = service.encryptPassword(password);

          // 验证格式：IV(32 hex chars):ciphertext
          const parts = encrypted.split(':');
          if (parts.length !== 2) return false;

          const [iv, ciphertext] = parts;
          // IV 应该是 32 个十六进制字符（16 字节）
          if (iv.length !== 32) return false;
          // IV 应该只包含十六进制字符
          if (!/^[0-9a-f]+$/i.test(iv)) return false;
          // 密文应该是非空的十六进制字符串
          if (ciphertext.length === 0) return false;
          if (!/^[0-9a-f]+$/i.test(ciphertext)) return false;

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.6**
     *
     * *For any* non-encrypted string (without colon separator),
     * decryption should return the original string.
     */
    it('should return original string for non-encrypted input', () => {
      fc.assert(
        fc.property(
          // 生成不包含冒号的字符串（模拟未加密的密码）
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes(':')),
          (plainPassword) => {
            const result = service.decryptPassword(plainPassword);
            return result === plainPassword;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
