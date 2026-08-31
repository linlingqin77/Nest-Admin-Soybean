/**
 * @generated
 * Tag: 认证模块
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 认证模块 ────────────────────────────────────────────────

// Referenced types: AuthLoginRequestDto, AuthRegisterRequestDto, SocialLoginRequestDto

/**
 * 获取验证码 - GET /auth/code
对应前端: fetchCaptchaCode()
 * @description 获取登录/注册所需的图形验证码
 */
export function fetchAuthGetCaptchaCode(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/auth/code',
    operationId: 'AuthController_getCaptchaCode_v1',
  });
}

/**
 * 用户登录 - POST /auth/login
对应前端: fetchLogin()

限流配置：每分钟最多 10 次登录尝试，防止暴力破解
 * @description 用户登录接口，支持租户、验证码验证
 */
export function fetchAuthLogin(body: AuthLoginRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/auth/login',
    data: body,
    operationId: 'AuthController_login_v1',
  });
}

/**
 * 退出登录 - POST /auth/logout
对应前端: fetchLogout()
需求 4.8: 登出后 Token 立即失效
 * @description 退出当前登录状态，Token 将被加入黑名单
 */
export function fetchAuthLogout(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/auth/logout',
    operationId: 'AuthController_logout_v1',
  });
}

/**
 * 获取加密公钥 - GET /auth/publicKey
用于前端加密数据
 * @description 获取RSA公钥用于数据加密
 */
export function fetchAuthGetPublicKey(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/auth/publicKey',
    operationId: 'AuthController_getPublicKey_v1',
  });
}

/**
 * 用户注册 - POST /auth/register
对应前端: fetchRegister()

限流配置：每分钟最多 5 次注册尝试，防止恶意注册
 * @description 新用户注册接口
 */
export function fetchAuthRegister(body: AuthRegisterRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/auth/register',
    data: body,
    operationId: 'AuthController_register_v1',
  });
}

/**
 * 社交登录回调 - POST /auth/social/callback
对应前端: fetchSocialLoginCallback()
 * @description 第三方社交平台登录回调处理
 */
export function fetchAuthSocialCallback(body: SocialLoginRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/auth/social/callback',
    data: body,
    operationId: 'AuthController_socialCallback_v1',
  });
}

/**
 * 获取租户列表 - GET /auth/tenant/list
对应前端: fetchTenantList()

限流配置：跳过限流，因为这是公开的高频接口
 * @description 获取系统中所有可用的租户列表，用于登录时选择租户
 */
export function fetchAuthGetTenantList(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/auth/tenant/list',
    operationId: 'AuthController_getTenantList_v1',
  });
}
