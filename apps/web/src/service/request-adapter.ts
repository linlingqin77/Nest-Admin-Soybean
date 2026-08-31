/**
 * Request Adapter for Generated API Clients
 *
 * Provides `apiRequest` and `buildUrl` helpers used by code generated
 * from the OpenAPI specification. The generated API functions rely on
 * this adapter to perform HTTP requests through the project's existing
 * `request` instance (which already handles auth, encryption, error
 * handling, and retries).
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { request } from './request';
import type { RequestInstanceState } from './request/type';

/** OpenAPI HTTP methods */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  operationId?: string;
  responseType?: 'json' | 'blob' | 'arraybuffer';
}

/**
 * Perform an HTTP request using the project's `request` instance.
 *
 * The generated API files call this helper so they automatically
 * benefit from authentication, encryption, retry logic, and error
 * handling configured in `@/service/request`.
 *
 * Note: the generic type T represents the DATA returned by the backend
 * (e.g. Api.System.User), NOT the axios response wrapper. This function
 * automatically extracts the `data` field from the standard backend
 * response wrapper before returning.
 */
export async function apiRequest<T = unknown>(config: ApiRequestConfig): Promise<T> {
  const axiosConfig: InternalAxiosRequestConfig & { operationId?: string } = {
    url: config.url,
    method: config.method.toLowerCase() as InternalAxiosRequestConfig['method'],
    headers: config.headers as InternalAxiosRequestConfig['headers']
  };

  if (config.data !== undefined) {
    axiosConfig.data = config.data;
  }
  if (config.params !== undefined) {
    axiosConfig.params = config.params;
  }
  if (config.responseType) {
    axiosConfig.responseType = config.responseType;
  }
  if (config.operationId) {
    axiosConfig.operationId = config.operationId;
  }

  // Pass T as the inner data type - the wrapped request already extracts
  // response.data.data through transformBackendResponse
  const { error, data } = await request<T, RequestInstanceState>(axiosConfig);
  if (error) {
    throw error;
  }
  return data as T;
}

/**
 * Replace `{paramName}` placeholders in a path template with actual
 * values from the supplied record. Returns the rendered URL string.
 */
export function buildUrl(pathTemplate: string, params: Record<string, string | number | boolean>): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

// Suppress unused export warnings for AxiosResponse when only used in JSDoc
type _Unused = AxiosResponse;