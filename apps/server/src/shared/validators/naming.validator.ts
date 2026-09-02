import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * PascalCase 命名规范验证器
 *
 * @description 验证字符串是否符合 PascalCase 命名规范
 * 规则：首字母大写，后续可以是字母或数字
 * 示例：UserInfo, SysConfig, GenTable123
 *
 * Requirements: 4.5
 */
@ValidatorConstraint({ name: 'isPascalCase', async: false })
export class IsPascalCaseConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    // PascalCase: 首字母大写，后续可以是字母或数字
    return /^[A-Z][a-zA-Z0-9]*$/.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} 必须符合 PascalCase 命名规范（首字母大写，如 UserInfo）`;
  }
}

/**
 * PascalCase 命名规范装饰器
 *
 * @param validationOptions 验证选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * class CreateGenTableDto {
 *   @IsPascalCase()
 *   className: string;
 * }
 * ```
 */
export function IsPascalCase(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPascalCaseConstraint,
    });
  };
}

/**
 * kebab-case 命名规范验证器
 *
 * @description 验证字符串是否符合 kebab-case 命名规范
 * 规则：小写字母开头，可以包含小写字母、数字和连字符
 * 示例：user-info, sys-config, gen-table-123
 *
 * Requirements: 4.6
 */
@ValidatorConstraint({ name: 'isKebabCase', async: false })
export class IsKebabCaseConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    // kebab-case: 小写字母开头，可以包含小写字母、数字和连字符
    // 不能以连字符开头或结尾，不能有连续的连字符
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} 必须符合 kebab-case 命名规范（小写字母和连字符，如 user-info）`;
  }
}

/**
 * kebab-case 命名规范装饰器
 *
 * @param validationOptions 验证选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * class CreateGenTableDto {
 *   @IsKebabCase()
 *   moduleName: string;
 *
 *   @IsKebabCase()
 *   businessName: string;
 * }
 * ```
 */
export function IsKebabCase(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsKebabCaseConstraint,
    });
  };
}

/**
 * 命名规范工具函数
 */
export const NamingUtils = {
  /**
   * 检查是否为 PascalCase
   */
  isPascalCase(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    return /^[A-Z][a-zA-Z0-9]*$/.test(value);
  },

  /**
   * 检查是否为 kebab-case
   */
  isKebabCase(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
  },

  /**
   * 将字符串转换为 PascalCase
   */
  toPascalCase(value: string): string {
    if (!value) return '';
    return value.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (c) => c.toUpperCase());
  },

  /**
   * 将字符串转换为 kebab-case
   */
  toKebabCase(value: string): string {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },
};
