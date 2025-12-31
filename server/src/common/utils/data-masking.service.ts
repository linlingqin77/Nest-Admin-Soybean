import { Injectable } from '@nestjs/common';

/**
 * 敏感字段类型
 */
export enum SensitiveFieldType {
  PHONE = 'phone',
  EMAIL = 'email',
  ID_CARD = 'idCard',
  BANK_CARD = 'bankCard',
  NAME = 'name',
  ADDRESS = 'address',
  PASSWORD = 'password',
}

/**
 * 字段名到敏感类型的映射
 */
const FIELD_TYPE_MAP: Record<string, SensitiveFieldType> = {
  phone: SensitiveFieldType.PHONE,
  phonenumber: SensitiveFieldType.PHONE,
  mobile: SensitiveFieldType.PHONE,
  tel: SensitiveFieldType.PHONE,
  telephone: SensitiveFieldType.PHONE,
  email: SensitiveFieldType.EMAIL,
  mail: SensitiveFieldType.EMAIL,
  idcard: SensitiveFieldType.ID_CARD,
  idcardno: SensitiveFieldType.ID_CARD,
  identitycard: SensitiveFieldType.ID_CARD,
  bankcard: SensitiveFieldType.BANK_CARD,
  bankcardno: SensitiveFieldType.BANK_CARD,
  cardno: SensitiveFieldType.BANK_CARD,
  name: SensitiveFieldType.NAME,
  realname: SensitiveFieldType.NAME,
  truename: SensitiveFieldType.NAME,
  address: SensitiveFieldType.ADDRESS,
  addr: SensitiveFieldType.ADDRESS,
  password: SensitiveFieldType.PASSWORD,
  pwd: SensitiveFieldType.PASSWORD,
  secret: SensitiveFieldType.PASSWORD,
};

/**
 * 数据脱敏服务
 * 提供对敏感数据的脱敏处理，包括手机号、邮箱、身份证等
 */
@Injectable()
export class DataMaskingService {
  /**
   * 手机号脱敏
   * 格式: 138****8888
   * @param phone 手机号
   * @returns 脱敏后的手机号
   */
  maskPhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return phone;
    // 去除空格和横线
    const cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.length < 7) return phone;
    // 支持国际号码格式 +86 138****8888
    if (cleaned.startsWith('+')) {
      // 常见国家代码长度: +1 (美国), +86 (中国), +852 (香港), +81 (日本)
      // 假设国家代码后面的手机号至少有7位，优先选择较短的国家代码
      let countryCodeLen = 0;
      for (let i = 2; i <= 4 && i < cleaned.length; i++) {
        const remaining = cleaned.length - i;
        if (remaining >= 7) {
          countryCodeLen = i;
          break; // 找到第一个有效的就停止，优先短国家代码
        }
      }
      if (countryCodeLen > 0) {
        const countryCode = cleaned.slice(0, countryCodeLen);
        const number = cleaned.slice(countryCodeLen);
        return `${countryCode}${number.slice(0, 3)}****${number.slice(-4)}`;
      }
      return phone;
    }
    return `${cleaned.slice(0, 3)}****${cleaned.slice(-4)}`;
  }

  /**
   * 邮箱脱敏
   * 格式: a**b@domain.com 或 **@domain.com (短邮箱)
   * @param email 邮箱地址
   * @returns 脱敏后的邮箱
   */
  maskEmail(email: string): string {
    if (!email || typeof email !== 'string' || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    
    let maskedLocal: string;
    if (local.length <= 2) {
      maskedLocal = '**';
    } else {
      maskedLocal = `${local[0]}**${local.slice(-1)}`;
    }
    return `${maskedLocal}@${domain}`;
  }

  /**
   * 身份证号脱敏
   * 格式: 110***********1234
   * @param idCard 身份证号
   * @returns 脱敏后的身份证号
   */
  maskIdCard(idCard: string): string {
    if (!idCard || typeof idCard !== 'string') return idCard;
    // 去除空格
    const cleaned = idCard.replace(/\s/g, '');
    if (cleaned.length < 10) return idCard;
    // 保留前3位和后4位
    return `${cleaned.slice(0, 3)}${'*'.repeat(cleaned.length - 7)}${cleaned.slice(-4)}`;
  }

  /**
   * 银行卡号脱敏
   * 格式: 6222****1234
   * @param bankCard 银行卡号
   * @returns 脱敏后的银行卡号
   */
  maskBankCard(bankCard: string): string {
    if (!bankCard || typeof bankCard !== 'string') return bankCard;
    // 去除空格和横线
    const cleaned = bankCard.replace(/[\s-]/g, '');
    if (cleaned.length < 8) return bankCard;
    // 保留前4位和后4位
    return `${cleaned.slice(0, 4)}${'*'.repeat(cleaned.length - 8)}${cleaned.slice(-4)}`;
  }

  /**
   * 姓名脱敏
   * 格式: 张* 或 张*明
   * @param name 姓名
   * @returns 脱敏后的姓名
   */
  maskName(name: string): string {
    if (!name || typeof name !== 'string') return name;
    if (name.length <= 1) return name;
    if (name.length === 2) {
      return `${name[0]}*`;
    }
    return `${name[0]}${'*'.repeat(name.length - 2)}${name.slice(-1)}`;
  }

  /**
   * 地址脱敏
   * 保留前6个字符，其余用*替代
   * @param address 地址
   * @returns 脱敏后的地址
   */
  maskAddress(address: string): string {
    if (!address || typeof address !== 'string') return address;
    if (address.length <= 6) return address;
    return `${address.slice(0, 6)}${'*'.repeat(Math.min(address.length - 6, 10))}`;
  }

  /**
   * 密码脱敏
   * 全部替换为固定长度的*
   * @param password 密码
   * @returns 脱敏后的密码
   */
  maskPassword(password: string): string {
    if (!password || typeof password !== 'string') return password;
    return '******';
  }

  /**
   * 自动识别字段类型并脱敏
   * @param value 值
   * @param fieldName 字段名
   * @returns 脱敏后的值
   */
  autoMask(value: string, fieldName: string): string {
    if (!value || typeof value !== 'string') return value;
    
    const normalizedFieldName = fieldName.toLowerCase().replace(/[_-]/g, '');
    const fieldType = FIELD_TYPE_MAP[normalizedFieldName];
    
    if (fieldType) {
      return this.maskByType(value, fieldType);
    }
    
    // 尝试根据值的格式自动识别
    return this.autoDetectAndMask(value);
  }

  /**
   * 根据类型脱敏
   * @param value 值
   * @param type 敏感字段类型
   * @returns 脱敏后的值
   */
  maskByType(value: string, type: SensitiveFieldType): string {
    switch (type) {
      case SensitiveFieldType.PHONE:
        return this.maskPhone(value);
      case SensitiveFieldType.EMAIL:
        return this.maskEmail(value);
      case SensitiveFieldType.ID_CARD:
        return this.maskIdCard(value);
      case SensitiveFieldType.BANK_CARD:
        return this.maskBankCard(value);
      case SensitiveFieldType.NAME:
        return this.maskName(value);
      case SensitiveFieldType.ADDRESS:
        return this.maskAddress(value);
      case SensitiveFieldType.PASSWORD:
        return this.maskPassword(value);
      default:
        return value;
    }
  }

  /**
   * 自动检测值的类型并脱敏
   * @param value 值
   * @returns 脱敏后的值
   */
  private autoDetectAndMask(value: string): string {
    // 检测邮箱格式
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return this.maskEmail(value);
    }
    
    // 检测手机号格式 (中国大陆)
    if (/^1[3-9]\d{9}$/.test(value)) {
      return this.maskPhone(value);
    }
    
    // 检测身份证格式 (18位)
    if (/^\d{17}[\dXx]$/.test(value)) {
      return this.maskIdCard(value);
    }
    
    // 检测银行卡格式 (16-19位数字)
    if (/^\d{16,19}$/.test(value)) {
      return this.maskBankCard(value);
    }
    
    return value;
  }

  /**
   * 对象脱敏
   * @param obj 对象
   * @param fields 需要脱敏的字段列表
   * @returns 脱敏后的对象
   */
  maskObject<T extends Record<string, any>>(obj: T, fields: string[]): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    const masked: Record<string, any> = { ...obj };
    for (const field of fields) {
      if (field in masked && masked[field] !== null && masked[field] !== undefined) {
        const value = masked[field];
        if (typeof value === 'string') {
          masked[field] = this.autoMask(value, field);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          masked[field] = this.maskObject(value, fields);
        }
      }
    }
    return masked as T;
  }

  /**
   * 深度对象脱敏
   * 递归遍历对象，自动识别并脱敏敏感字段
   * @param obj 对象
   * @returns 脱敏后的对象
   */
  maskObjectDeep<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskObjectDeep(item)) as unknown as T;
    }
    
    const masked: Record<string, any> = { ...obj };
    for (const key of Object.keys(masked)) {
      const value = masked[key];
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'string') {
        masked[key] = this.autoMask(value, key);
      } else if (typeof value === 'object') {
        masked[key] = this.maskObjectDeep(value);
      }
    }
    return masked as T;
  }
}
