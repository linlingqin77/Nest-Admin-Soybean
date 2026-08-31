/**
 * @generated
 * Tag: 菜单管理
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 菜单管理 ────────────────────────────────────────────────

// Referenced types: CreateMenuRequestDto, UpdateMenuRequestDto

/**
 * 菜单管理-创建
 * @description 创建新菜单，支持目录、菜单、按钮三种类型
 */
export function fetchMenuCreate(body: CreateMenuRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/menu',
    data: body,
    operationId: 'MenuController_create_v1',
  });
}

/**
 * 菜单管理-修改
 * @description 修改菜单信息
 */
export function fetchMenuUpdate(body: UpdateMenuRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/menu',
    data: body,
    operationId: 'MenuController_update_v1',
  });
}

/**
 * 菜单管理-删除
 * @description 删除菜单，会同时删除子菜单
 */
export function fetchMenuRemove(menuId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/menu/{menuId}', { menuId: menuId }),
    operationId: 'MenuController_remove_v1',
  });
}

/**
 * 菜单管理-详情
 * @description 根据菜单ID获取菜单详细信息
 */
export function fetchMenuFindOne(menuId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/menu/{menuId}', { menuId: menuId }),
    operationId: 'MenuController_findOne_v1',
  });
}

/**
 * 菜单管理-级联删除
 * @description 级联删除菜单，多个ID用逗号分隔
 */
export function fetchMenuCascadeRemove(menuIds: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/menu/cascade/{menuIds}', { menuIds: menuIds }),
    operationId: 'MenuController_cascadeRemove_v1',
  });
}

/**
 * 菜单管理-获取路由
 * @description 获取当前用户的路由菜单
 */
export function fetchMenuGetRouters(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/menu/getRouters',
    operationId: 'MenuController_getRouters_v1',
  });
}

/**
 * 菜单管理-列表
 * @description 获取菜单列表，支持按名称和状态筛选
 */
export function fetchMenuFindAll(menuName?: string, status?: string, parentId?: number, menuType?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/menu/list',
    params: {
      menuName: menuName ?? undefined,
      status: status ?? undefined,
      parentId: parentId ?? undefined,
      menuType: menuType ?? undefined
    },
    operationId: 'MenuController_findAll_v1',
  });
}

/**
 * 菜单管理-角色菜单树
 * @description 获取角色已分配的菜单树结构
 */
export function fetchMenuRoleMenuTreeselect(roleId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/menu/roleMenuTreeselect/{roleId}', { roleId: roleId }),
    operationId: 'MenuController_roleMenuTreeselect_v1',
  });
}

/**
 * 菜单管理-租户套餐菜单树
 * @description 获取租户套餐已分配的菜单树结构
 */
export function fetchMenuTenantPackageMenuTreeselect(packageId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/menu/tenantPackageMenuTreeselect/{packageId}', { packageId: packageId }),
    operationId: 'MenuController_tenantPackageMenuTreeselect_v1',
  });
}

/**
 * 菜单管理-树形选择
 * @description 获取菜单树形结构，用于下拉选择
 */
export function fetchMenuTreeSelect(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/menu/treeselect',
    operationId: 'MenuController_treeSelect_v1',
  });
}
