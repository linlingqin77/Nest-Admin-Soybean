import { Gender } from '@prisma/client';

/**
 * 性别枚举
 * 使用 Prisma 生成的枚举，保持类型安全
 * - MALE: 男
 * - FEMALE: 女
 * - UNKNOWN: 未知
 */
export const SexEnum = Gender;
export type SexEnum = Gender;

/** SexEnum Swagger Schema */
export const SexEnumSchema = {
  description: `性别枚举
- MALE: 男
- FEMALE: 女
- UNKNOWN: 未知`,
};
