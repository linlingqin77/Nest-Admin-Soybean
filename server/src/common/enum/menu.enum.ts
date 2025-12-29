/**
 * 菜单类型枚举
 * - DIRECTORY: 目录
 * - MENU: 菜单
 * - BUTTON: 按钮
 * 
 * 注意：这些值必须与 Prisma schema 中的 MenuType 枚举名称一致
 */
export enum MenuTypeEnum {
  /** 目录 */
  DIRECTORY = 'DIRECTORY',
  /** 菜单 */
  MENU = 'MENU',
  /** 按钮 */
  BUTTON = 'BUTTON',
}

/** MenuTypeEnum Swagger Schema */
export const MenuTypeEnumSchema = {
  description: `菜单类型枚举
- DIRECTORY: 目录
- MENU: 菜单
- BUTTON: 按钮`,
};
