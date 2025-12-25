import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface PasswordValidationConfig {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  forbiddenPatterns?: RegExp[];
}

const DEFAULT_PASSWORD_CONFIG: Required<PasswordValidationConfig> = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  forbiddenPatterns: [],
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export class PasswordValidator {
  static validate(password: string, config: PasswordValidationConfig = {}): PasswordValidationResult {
    const cfg = Object.assign({}, DEFAULT_PASSWORD_CONFIG, config);
    const errors: string[] = [];

    if (!password) {
      errors.push('密码不能为空');
      return { valid: false, errors };
    }

    if (password.length < cfg.minLength) errors.push(`密码长度至少${cfg.minLength}位`);
    if (password.length > cfg.maxLength) errors.push(`密码长度最多${cfg.maxLength}位`);
    if (cfg.requireUppercase && !/[A-Z]/.test(password)) errors.push('密码必须包含大写字母');
    if (cfg.requireLowercase && !/[a-z]/.test(password)) errors.push('密码必须包含小写字母');
    if (cfg.requireNumber && !/\d/.test(password)) errors.push('密码必须包含数字');
    if (cfg.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/\?]/.test(password))
      errors.push('密码必须包含特殊字符');

    for (const p of cfg.forbiddenPatterns) {
      if (p.test(password)) {
        errors.push('密码包含不允许的模式');
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static calculateStrength(password: string): number {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/\?]/.test(password)) score++;
    return Math.min(score, 4);
  }
}

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const cfg = args.constraints[0] as PasswordValidationConfig | undefined;
    const res = PasswordValidator.validate(value, cfg);
    return res.valid;
  }

  defaultMessage(args: ValidationArguments) {
    const cfg = args.constraints[0] as PasswordValidationConfig | undefined;
    const res = PasswordValidator.validate(args.value, cfg);
    return res.errors.join('; ');
  }
}

export function IsStrongPassword(config?: PasswordValidationConfig, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [config],
      validator: IsStrongPasswordConstraint,
    });
  };
}
