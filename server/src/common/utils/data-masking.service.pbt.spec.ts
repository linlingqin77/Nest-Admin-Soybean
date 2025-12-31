import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { DataMaskingService } from './data-masking.service';

/**
 * Property-Based Tests for DataMaskingService
 * Feature: enterprise-app-optimization
 * Property 7: 数据脱敏正确性
 * Validates: Requirements 4.6
 */
describe('DataMaskingService Property-Based Tests', () => {
  let service: DataMaskingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataMaskingService],
    }).compile();

    service = module.get<DataMaskingService>(DataMaskingService);
  });

  // Generator for valid Chinese phone numbers (11 digits starting with 1[3-9])
  const phoneArb = fc.integer({ min: 13000000000, max: 19999999999 }).map(String);

  // Generator for valid email addresses
  const emailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z0-9]{3,20}$/),
      fc.stringMatching(/^[a-z]{2,10}$/),
      fc.constantFrom('com', 'org', 'net', 'io', 'cn'),
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  // Generator for short email local parts
  const shortEmailArb = fc
    .tuple(fc.stringMatching(/^[a-z]{1,2}$/), fc.stringMatching(/^[a-z]{2,10}$/))
    .map(([local, domain]) => `${local}@${domain}.com`);

  // Generator for 18-digit ID card numbers
  const idCardArb = fc
    .tuple(fc.stringMatching(/^[0-9]{17}$/), fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'))
    .map(([digits, checkDigit]) => digits + checkDigit);

  // Generator for bank card numbers (16-19 digits)
  const bankCardArb = fc.stringMatching(/^[0-9]{16,19}$/);

  // Generator for short phone numbers (less than 7 digits)
  const shortPhoneArb = fc.stringMatching(/^[0-9]{1,6}$/);

  /**
   * Property 7.1: Phone masking format correctness
   * For any valid phone number, the masked result should:
   * - Show first 3 digits
   * - Show 4 asterisks in the middle
   * - Show last 4 digits
   * - Format: 138****8888
   */
  describe('Property 7.1: Phone masking format', () => {
    it('should mask phone numbers to format XXX****XXXX', () => {
      fc.assert(
        fc.property(phoneArb, (phone) => {
          const masked = service.maskPhone(phone);

          // Should have format: XXX****XXXX (3 + 4 + 4 = 11 chars)
          expect(masked.length).toBe(11);
          expect(masked.slice(0, 3)).toBe(phone.slice(0, 3));
          expect(masked.slice(3, 7)).toBe('****');
          expect(masked.slice(7)).toBe(phone.slice(-4));
        }),
        { numRuns: 100 },
      );
    });

    it('should preserve original phone for short numbers', () => {
      fc.assert(
        fc.property(shortPhoneArb, (shortPhone) => {
          const masked = service.maskPhone(shortPhone);
          expect(masked).toBe(shortPhone);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.2: Email masking format correctness
   * For any valid email, the masked result should:
   * - Show first character of local part
   * - Show ** in the middle
   * - Show last character of local part (if length > 2)
   * - Preserve the domain part completely
   * - Format: a**b@domain.com or **@domain.com
   */
  describe('Property 7.2: Email masking format', () => {
    it('should mask emails preserving domain and partial local part', () => {
      fc.assert(
        fc.property(emailArb, (email) => {
          const masked = service.maskEmail(email);
          const [local, domain] = email.split('@');

          // Domain should be preserved
          expect(masked.endsWith(`@${domain}`)).toBe(true);

          // Local part should be masked
          const maskedLocal = masked.split('@')[0];
          if (local.length > 2) {
            expect(maskedLocal).toBe(`${local[0]}**${local.slice(-1)}`);
          } else {
            expect(maskedLocal).toBe('**');
          }
        }),
        { numRuns: 100 },
      );
    });

    it('should handle short local parts', () => {
      fc.assert(
        fc.property(shortEmailArb, (email) => {
          const masked = service.maskEmail(email);
          const maskedLocal = masked.split('@')[0];
          expect(maskedLocal).toBe('**');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.3: ID card masking format correctness
   * For any valid ID card, the masked result should:
   * - Show first 3 digits
   * - Show asterisks in the middle
   * - Show last 4 digits
   * - Format: 110***********1234
   */
  describe('Property 7.3: ID card masking format', () => {
    it('should mask ID cards to format XXX***...***XXXX', () => {
      fc.assert(
        fc.property(idCardArb, (idCard) => {
          const masked = service.maskIdCard(idCard);

          // Should preserve length
          expect(masked.length).toBe(idCard.length);
          // First 3 digits preserved
          expect(masked.slice(0, 3)).toBe(idCard.slice(0, 3));
          // Last 4 digits preserved
          expect(masked.slice(-4)).toBe(idCard.slice(-4));
          // Middle should be asterisks
          const middlePart = masked.slice(3, -4);
          expect(middlePart).toMatch(/^\*+$/);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.4: Bank card masking format correctness
   * For any valid bank card, the masked result should:
   * - Show first 4 digits
   * - Show asterisks in the middle
   * - Show last 4 digits
   * - Format: 6222****1234
   */
  describe('Property 7.4: Bank card masking format', () => {
    it('should mask bank cards to format XXXX***...***XXXX', () => {
      fc.assert(
        fc.property(bankCardArb, (bankCard) => {
          const masked = service.maskBankCard(bankCard);

          // Should preserve length
          expect(masked.length).toBe(bankCard.length);
          // First 4 digits preserved
          expect(masked.slice(0, 4)).toBe(bankCard.slice(0, 4));
          // Last 4 digits preserved
          expect(masked.slice(-4)).toBe(bankCard.slice(-4));
          // Middle should be asterisks
          const middlePart = masked.slice(4, -4);
          expect(middlePart).toMatch(/^\*+$/);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.5: Password masking always returns fixed length
   * For any password, the masked result should always be '******'
   */
  describe('Property 7.5: Password masking', () => {
    it('should always mask passwords to fixed length asterisks', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (password) => {
          const masked = service.maskPassword(password);
          expect(masked).toBe('******');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.6: Masking preserves non-sensitive data
   * For any object with mixed sensitive and non-sensitive fields,
   * only sensitive fields should be masked
   */
  describe('Property 7.6: Selective masking', () => {
    it('should only mask specified sensitive fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            phone: phoneArb,
            email: emailArb,
            name: fc.string({ minLength: 1, maxLength: 20 }),
            age: fc.integer({ min: 1, max: 100 }),
          }),
          (obj) => {
            const masked = service.maskObject(obj, ['phone', 'email']);

            // Phone should be masked
            expect(masked.phone).not.toBe(obj.phone);
            expect(masked.phone).toContain('****');

            // Email should be masked
            expect(masked.email).not.toBe(obj.email);
            expect(masked.email).toContain('**');

            // Non-sensitive fields should be preserved
            expect(masked.name).toBe(obj.name);
            expect(masked.age).toBe(obj.age);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.7: Masking is idempotent for already masked data
   * Masking an already masked value should not change it further
   * (except for passwords which always return ******)
   */
  describe('Property 7.7: Masking idempotence', () => {
    it('should be idempotent for phone masking', () => {
      fc.assert(
        fc.property(phoneArb, (phone) => {
          const masked1 = service.maskPhone(phone);
          const masked2 = service.maskPhone(masked1);
          // Second masking should return original (short number)
          // or the same masked value
          expect(masked2).toBe(masked1);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.8: Auto-detection correctly identifies sensitive data types
   * For any value that matches a known pattern, autoMask should apply
   * the correct masking strategy
   */
  describe('Property 7.8: Auto-detection accuracy', () => {
    it('should auto-detect and mask phone numbers', () => {
      fc.assert(
        fc.property(phoneArb, (phone) => {
          const masked = service.autoMask(phone, 'unknownField');
          expect(masked).toContain('****');
          expect(masked.slice(0, 3)).toBe(phone.slice(0, 3));
        }),
        { numRuns: 100 },
      );
    });

    it('should auto-detect and mask emails', () => {
      fc.assert(
        fc.property(emailArb, (email) => {
          const masked = service.autoMask(email, 'unknownField');
          expect(masked).toContain('**');
          expect(masked).toContain('@');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7.9: Deep object masking handles nested structures
   * For any nested object structure, all sensitive fields at any depth
   * should be properly masked
   */
  describe('Property 7.9: Deep object masking', () => {
    it('should mask sensitive fields at any nesting level', () => {
      fc.assert(
        fc.property(
          fc.record({
            phone: phoneArb,
            nested: fc.record({
              email: emailArb,
              deep: fc.record({
                password: fc.string({ minLength: 8, maxLength: 20 }),
              }),
            }),
          }),
          (obj) => {
            const masked = service.maskObjectDeep(obj);

            // Top-level phone should be masked
            expect(masked.phone).toContain('****');

            // Nested email should be masked
            expect(masked.nested.email).toContain('**');
            expect(masked.nested.email).toContain('@');

            // Deeply nested password should be masked
            expect(masked.nested.deep.password).toBe('******');
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
