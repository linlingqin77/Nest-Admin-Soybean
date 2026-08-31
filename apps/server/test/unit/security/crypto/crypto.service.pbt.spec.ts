import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from '@/core/crypto/crypto.service';
import { AppConfigService } from '@/config/app-platform/config.service';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * Property-Based Tests for CryptoService
 *
 * Feature: enterprise-app-optimization
 * Property: 加密算法正确性
 * Validates: Requirements 3.3.6
 *
 * Tests the RSA+AES hybrid encryption scheme:
 * - RSA for encrypting/decrypting AES keys
 * - AES for encrypting/decrypting actual data
 */
describe('CryptoService Property-Based Tests', () => {
  let service: CryptoService;

  const redisServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn().mockResolvedValue(false),
  };

  // Initialize once for all tests to avoid repeated key generation
  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: AppConfigService,
          useValue: {
            crypto: {
              enabled: true,
              rsaPublicKey: '',
              rsaPrivateKey: '',
              nonceTtl: 5 * 60 * 1000,
              timestampTolerance: 5 * 60 * 1000,
            },
          },
        },
        { provide: RedisService, useValue: redisServiceMock },
      ],
    }).compile();

    service = modules.get<CryptoService>(CryptoService);
    // Trigger key generation once
    service.onModuleInit();
  });

  /**
   * Property 1: AES Encryption Roundtrip
   *
   * For any plaintext and valid AES key, encrypting then decrypting
   * should return the original plaintext.
   *
   * **Validates: Requirements 3.3.6**
   */
  describe('Property 1: AES Encryption Roundtrip', () => {
    it('For any plaintext, AES encrypt then decrypt should return original', () => {
      fc.assert(
        fc.property(
          // Generate random plaintext strings
          fc.string({ minLength: 1, maxLength: 1000 }),
          // Generate random AES keys (16 characters)
          fc.string({ minLength: 16, maxLength: 16 }),
          (plaintext, aesKey) => {
            const encrypted = service.aesEncrypt(plaintext, aesKey);
            const decrypted = service.aesDecrypt(encrypted, aesKey);
            return decrypted === plaintext;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For any JSON object, AES encrypt then decrypt should preserve data', () => {
      fc.assert(
        fc.property(
          // Generate random JSON-serializable objects
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            active: fc.boolean(),
            score: fc.double({ min: 0, max: 100 }),
          }),
          fc.string({ minLength: 16, maxLength: 16 }),
          (data, aesKey) => {
            const jsonStr = JSON.stringify(data);
            const encrypted = service.aesEncrypt(jsonStr, aesKey);
            const decrypted = service.aesDecrypt(encrypted, aesKey);
            const parsed = JSON.parse(decrypted);
            return JSON.stringify(parsed) === JSON.stringify(data);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For any plaintext, encrypted output should be different from plaintext', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 16, maxLength: 16 }),
          (plaintext, aesKey) => {
            const encrypted = service.aesEncrypt(plaintext, aesKey);
            // Encrypted data should be Base64 and different from plaintext
            return encrypted !== plaintext && /^[A-Za-z0-9+/=]+$/.test(encrypted);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: RSA Encryption Roundtrip
   *
   * For any short plaintext (within RSA key size limits), encrypting
   * then decrypting should return the original plaintext.
   *
   * **Validates: Requirements 3.3.6**
   */
  describe('Property 2: RSA Encryption Roundtrip', () => {
    it('For any short plaintext, RSA encrypt then decrypt should return original', () => {
      fc.assert(
        fc.property(
          // RSA with 2048-bit key can encrypt up to ~245 bytes with PKCS1 v1.5
          fc.string({ minLength: 1, maxLength: 50 }),
          (plaintext) => {
            const encrypted = service.rsaEncrypt(plaintext);
            const decrypted = service.rsaDecrypt(encrypted);
            return decrypted === plaintext;
          },
        ),
        { numRuns: 50 },
      );
    });

    it('For any AES key, RSA encrypt then decrypt should preserve key', () => {
      fc.assert(
        fc.property(
          // Generate AES keys (16 characters)
          fc.string({ minLength: 16, maxLength: 16 }),
          (aesKey) => {
            const encrypted = service.rsaEncrypt(aesKey);
            const decrypted = service.rsaDecrypt(encrypted);
            return decrypted === aesKey;
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 3: AES Key Generation
   *
   * Generated AES keys should have consistent length and format.
   *
   * **Validates: Requirements 3.3.6**
   */
  describe('Property 3: AES Key Generation', () => {
    it('Generated AES keys should have length 16', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const key = service.generateAesKey();
          return key.length === 16;
        }),
        { numRuns: 100 },
      );
    });

    it('Generated AES keys should be unique', () => {
      const keys = new Set<string>();
      fc.assert(
        fc.property(fc.constant(null), () => {
          const key = service.generateAesKey();
          if (keys.has(key)) {
            return false; // Duplicate key found
          }
          keys.add(key);
          return true;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Encryption Determinism
   *
   * AES encryption with same key should produce different ciphertexts
   * due to random IV (semantic core).
   *
   * **Validates: Requirements 3.3.6**
   */
  describe('Property 4: Encryption Non-Determinism (Semantic Security)', () => {
    it('Same plaintext encrypted twice should produce different ciphertexts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 16, maxLength: 16 }),
          (plaintext, aesKey) => {
            const encrypted1 = service.aesEncrypt(plaintext, aesKey);
            const encrypted2 = service.aesEncrypt(plaintext, aesKey);
            // Due to random IV, ciphertexts should be different
            return encrypted1 !== encrypted2;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('Different ciphertexts of same plaintext should decrypt to same value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 16, maxLength: 16 }),
          (plaintext, aesKey) => {
            const encrypted1 = service.aesEncrypt(plaintext, aesKey);
            const encrypted2 = service.aesEncrypt(plaintext, aesKey);
            const decrypted1 = service.aesDecrypt(encrypted1, aesKey);
            const decrypted2 = service.aesDecrypt(encrypted2, aesKey);
            return decrypted1 === decrypted2 && decrypted1 === plaintext;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Key Sensitivity
   *
   * Decryption with wrong key should fail or produce garbage.
   *
   * **Validates: Requirements 3.3.6**
   */
  describe('Property 5: Key Sensitivity', () => {
    it('Decryption with different key should fail or produce different result', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 16, maxLength: 16 }),
          fc.string({ minLength: 16, maxLength: 16 }),
          (plaintext, key1, key2) => {
            // Skip if keys are the same
            if (key1 === key2) return true;

            const encrypted = service.aesEncrypt(plaintext, key1);

            try {
              const decrypted = service.aesDecrypt(encrypted, key2);
              // If decryption succeeds, result should be different from original
              return decrypted !== plaintext;
            } catch {
              // Decryption failure is expected with wrong key
              return true;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: Hybrid Encryption Roundtrip
   *
   * The full encrypt/decrypt request flow should preserve data.
   * Note: This tests the AES encryption/decryption with a known key,
   * as the full hybrid flow has specific encoding requirements.
   *
   * **Validates: Requirements 3.3.6**
   */
  describe('Property 6: Hybrid Encryption Roundtrip', () => {
    it('AES encrypt with generated key then decrypt should preserve data', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.integer({ min: 1, max: 10000 }),
            userName: fc.string({ minLength: 1, maxLength: 20 }),
            roles: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
          }),
          (data) => {
            // Generate a key
            const aesKey = service.generateAesKey();

            // Encrypt data
            const jsonData = JSON.stringify(data);
            const encryptedData = service.aesEncrypt(jsonData, aesKey);

            // Decrypt data
            const decryptedJson = service.aesDecrypt(encryptedData, aesKey);
            const decrypted = JSON.parse(decryptedJson);

            return JSON.stringify(decrypted) === JSON.stringify(data);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('RSA encrypt AES key then decrypt should preserve key for hybrid flow', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Generate AES key
          const aesKey = service.generateAesKey();

          // RSA encrypt the key
          const encryptedKey = service.rsaEncrypt(aesKey);

          // RSA decrypt the key
          const decryptedKey = service.rsaDecrypt(encryptedKey);

          return decryptedKey === aesKey;
        }),
        { numRuns: 50 },
      );
    });
  });
});
