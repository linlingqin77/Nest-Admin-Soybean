/**
 * @generated
 * Tag: 根目录
 * Generated at: 2026-08-31T03:40:43.885Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 根目录 ────────────────────────────────────────────────

// Referenced types: LoginRequestDto, RegisterRequestDto

/**
 * 获取验证码图片
 * @description 获取登录/注册所需的图形验证码，返回 Base64 图片和 UUID
 */
export function fetchMainCaptchaImage(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/captchaImage',
    operationId: 'MainController_captchaImage_v1',
  });
}

/**
 * 获取当前用户信息
 * @description 获取当前登录用户的基本信息、角色和权限
 */
export function fetchMainGetInfo(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/getInfo',
    operationId: 'MainController_getInfo_v1',
  });
}

/**
 * 获取路由菜单
 * @description 获取当前用户的前端路由菜单数据
 */
export function fetchMainGetRouters(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/getRouters',
    operationId: 'MainController_getRouters_v1',
  });
}

/**
 * 用户登录
 * @description 用户登录接口，需要用户名、密码和验证码
 */
export function fetchMainLogin(body: LoginRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/login',
    data: body,
    operationId: 'MainController_login_v1',
  });
}

/**
 * 退出登录
 * @description 退出当前登录状态，清除登录令牌
 */
export function fetchMainLogout(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/logout',
    operationId: 'MainController_logout_v1',
  });
}

/**
 * 用户注册
 * @description 新用户注册接口，需要用户名、密码和验证码
 */
export function fetchMainRegister(body: RegisterRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/register',
    data: body,
    operationId: 'MainController_register_v1',
  });
}

/**
 * 是否开启用户注册
 * @description 查询系统是否开启用户自主注册功能
 */
export function fetchMainRegisterUser(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/registerUser',
    operationId: 'MainController_registerUser_v1',
  });
}
