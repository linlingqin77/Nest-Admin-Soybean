import { Test, TestingModule } from '@nestjs/testing';
import { DataMaskingService, SensitiveFieldType } from './data-masking.service';

describe('DataMaskingService', () => {
  let service: DataMaskingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataMaskingService],
    }).compile();

    service = module.get<DataMaskingService>(DataMaskingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('maskPhone', () => {
    it('should mask phone number correctly', () => {
      expect(service.maskPhone('13812345678')).toBe('138****5678');
    });

    it('should handle phone with spaces', () => {
      expect(service.maskPhone('138 1234 5678')).toBe('138****5678');
    });

    it('should handle phone with dashes', () => {
      expect(service.maskPhone('138-1234-5678')).toBe('138****5678');
    });

    it('should handle international phone format', () => {
      // +8613812345678 -> +8 is treated as country code, 613812345678 as number
      expect(service.maskPhone('+8613812345678')).toBe('+8613****5678');
    });

    it('should handle international phone with space separator', () => {
      // When there's a space, it's clearer: +86 13812345678
      expect(service.maskPhone('+86 13812345678')).toBe('+8613****5678');
    });

    it('should return original for short phone', () => {
      expect(service.maskPhone('123456')).toBe('123456');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskPhone(null as any)).toBe(null);
      expect(service.maskPhone(undefined as any)).toBe(undefined);
    });

    it('should return original for non-string', () => {
      expect(service.maskPhone(12345678901 as any)).toBe(12345678901);
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      expect(service.maskEmail('test@example.com')).toBe('t**t@example.com');
    });

    it('should handle short local part', () => {
      expect(service.maskEmail('ab@example.com')).toBe('**@example.com');
    });

    it('should handle single char local part', () => {
      expect(service.maskEmail('a@example.com')).toBe('**@example.com');
    });

    it('should return original for invalid email', () => {
      expect(service.maskEmail('notanemail')).toBe('notanemail');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskEmail(null as any)).toBe(null);
      expect(service.maskEmail(undefined as any)).toBe(undefined);
    });
  });

  describe('maskIdCard', () => {
    it('should mask 18-digit ID card correctly', () => {
      expect(service.maskIdCard('110101199001011234')).toBe('110***********1234');
    });

    it('should mask 15-digit ID card correctly', () => {
      expect(service.maskIdCard('110101900101123')).toBe('110********1123');
    });

    it('should handle ID card with spaces', () => {
      expect(service.maskIdCard('110101 1990 0101 1234')).toBe('110***********1234');
    });

    it('should return original for short ID card', () => {
      expect(service.maskIdCard('123456789')).toBe('123456789');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskIdCard(null as any)).toBe(null);
      expect(service.maskIdCard(undefined as any)).toBe(undefined);
    });
  });

  describe('maskBankCard', () => {
    it('should mask bank card correctly', () => {
      expect(service.maskBankCard('6222021234567890123')).toBe('6222***********0123');
    });

    it('should handle bank card with spaces', () => {
      expect(service.maskBankCard('6222 0212 3456 7890 123')).toBe('6222***********0123');
    });

    it('should handle bank card with dashes', () => {
      expect(service.maskBankCard('6222-0212-3456-7890')).toBe('6222********7890');
    });

    it('should return original for short bank card', () => {
      expect(service.maskBankCard('1234567')).toBe('1234567');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskBankCard(null as any)).toBe(null);
      expect(service.maskBankCard(undefined as any)).toBe(undefined);
    });
  });

  describe('maskName', () => {
    it('should mask 2-char name correctly', () => {
      expect(service.maskName('张三')).toBe('张*');
    });

    it('should mask 3-char name correctly', () => {
      expect(service.maskName('张三丰')).toBe('张*丰');
    });

    it('should mask longer name correctly', () => {
      expect(service.maskName('欧阳修文')).toBe('欧**文');
    });

    it('should return original for single char name', () => {
      expect(service.maskName('张')).toBe('张');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskName(null as any)).toBe(null);
      expect(service.maskName(undefined as any)).toBe(undefined);
    });
  });

  describe('maskAddress', () => {
    it('should mask address correctly', () => {
      const address = '北京市朝阳区建国路100号';
      const masked = service.maskAddress(address);
      expect(masked.startsWith('北京市朝阳区')).toBe(true);
      expect(masked.includes('*')).toBe(true);
    });

    it('should return original for short address', () => {
      expect(service.maskAddress('北京市')).toBe('北京市');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskAddress(null as any)).toBe(null);
      expect(service.maskAddress(undefined as any)).toBe(undefined);
    });
  });

  describe('maskPassword', () => {
    it('should mask password to fixed length', () => {
      expect(service.maskPassword('mypassword123')).toBe('******');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskPassword(null as any)).toBe(null);
      expect(service.maskPassword(undefined as any)).toBe(undefined);
    });
  });

  describe('autoMask', () => {
    it('should auto mask phone field', () => {
      expect(service.autoMask('13812345678', 'phone')).toBe('138****5678');
      expect(service.autoMask('13812345678', 'phoneNumber')).toBe('138****5678');
      expect(service.autoMask('13812345678', 'mobile')).toBe('138****5678');
    });

    it('should auto mask email field', () => {
      expect(service.autoMask('test@example.com', 'email')).toBe('t**t@example.com');
      expect(service.autoMask('test@example.com', 'mail')).toBe('t**t@example.com');
    });

    it('should auto mask idCard field', () => {
      expect(service.autoMask('110101199001011234', 'idCard')).toBe('110***********1234');
      expect(service.autoMask('110101199001011234', 'id_card')).toBe('110***********1234');
    });

    it('should auto mask password field', () => {
      expect(service.autoMask('secret123', 'password')).toBe('******');
      expect(service.autoMask('secret123', 'pwd')).toBe('******');
    });

    it('should auto detect email format', () => {
      expect(service.autoMask('user@domain.com', 'unknownField')).toBe('u**r@domain.com');
    });

    it('should auto detect phone format', () => {
      expect(service.autoMask('13912345678', 'unknownField')).toBe('139****5678');
    });

    it('should auto detect ID card format', () => {
      expect(service.autoMask('110101199001011234', 'unknownField')).toBe('110***********1234');
    });
  });

  describe('maskByType', () => {
    it('should mask by phone type', () => {
      expect(service.maskByType('13812345678', SensitiveFieldType.PHONE)).toBe('138****5678');
    });

    it('should mask by email type', () => {
      expect(service.maskByType('test@example.com', SensitiveFieldType.EMAIL)).toBe('t**t@example.com');
    });

    it('should mask by idCard type', () => {
      expect(service.maskByType('110101199001011234', SensitiveFieldType.ID_CARD)).toBe('110***********1234');
    });

    it('should mask by bankCard type', () => {
      expect(service.maskByType('6222021234567890123', SensitiveFieldType.BANK_CARD)).toBe('6222***********0123');
    });

    it('should mask by name type', () => {
      expect(service.maskByType('张三', SensitiveFieldType.NAME)).toBe('张*');
    });

    it('should mask by address type', () => {
      const address = '北京市朝阳区建国路100号';
      const masked = service.maskByType(address, SensitiveFieldType.ADDRESS);
      expect(masked.startsWith('北京市朝阳区')).toBe(true);
      expect(masked.includes('*')).toBe(true);
    });

    it('should mask by password type', () => {
      expect(service.maskByType('secret123', SensitiveFieldType.PASSWORD)).toBe('******');
    });
  });

  describe('maskObject', () => {
    it('should mask specified fields in object', () => {
      const obj = {
        name: '张三',
        phone: '13812345678',
        email: 'test@example.com',
        age: 25,
      };
      const masked = service.maskObject(obj, ['phone', 'email']);
      expect(masked.phone).toBe('138****5678');
      expect(masked.email).toBe('t**t@example.com');
      expect(masked.name).toBe('张三');
      expect(masked.age).toBe(25);
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          phone: '13812345678',
        },
      };
      const masked = service.maskObject(obj, ['phone']);
      // Note: maskObject only masks top-level fields, not nested ones
      expect(masked.user.phone).toBe('13812345678');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskObject(null as any, ['phone'])).toBe(null);
      expect(service.maskObject(undefined as any, ['phone'])).toBe(undefined);
    });
  });

  describe('maskObjectDeep', () => {
    it('should recursively mask sensitive fields', () => {
      const obj = {
        phone: '13812345678',
        user: {
          email: 'test@example.com',
          profile: {
            idCard: '110101199001011234',
          },
        },
      };
      const masked = service.maskObjectDeep(obj);
      expect(masked.phone).toBe('138****5678');
      expect(masked.user.email).toBe('t**t@example.com');
      expect(masked.user.profile.idCard).toBe('110***********1234');
    });

    it('should handle arrays', () => {
      const obj = {
        users: [
          { phone: '13812345678' },
          { phone: '13987654321' },
        ],
      };
      const masked = service.maskObjectDeep(obj);
      expect(masked.users[0].phone).toBe('138****5678');
      expect(masked.users[1].phone).toBe('139****4321');
    });

    it('should return original for null/undefined', () => {
      expect(service.maskObjectDeep(null as any)).toBe(null);
      expect(service.maskObjectDeep(undefined as any)).toBe(undefined);
    });
  });
});
