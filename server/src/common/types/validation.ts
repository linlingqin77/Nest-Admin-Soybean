/**
 * Validation Type Definitions
 * 验证相关类型定义
 */

/**
 * Password validation configuration
 * 密码验证配置
 */
export type PasswordValidationConfig = {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireNumber?: boolean;
  requireSpecialChars?: boolean;
  requireSpecial?: boolean;
  specialChars?: string;
  forbiddenPatterns?: RegExp[];
};

/**
 * Password validation result
 * 密码验证结果
 */
export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validation error detail
 * 验证错误详情
 */
export type ValidationError = {
  field: string;
  message: string;
  value?: unknown;
};

/**
 * Validation result
 * 验证结果
 */
export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};
