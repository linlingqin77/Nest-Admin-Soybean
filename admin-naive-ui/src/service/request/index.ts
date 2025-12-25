import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BACKEND_ERROR_CODE, REQUEST_CANCELED_CODE, createFlatRequest } from '@sa/axios';
import type { FlatRequestInstance, ResponseType } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { localStg, sessionStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import { encryptBase64, encryptWithAes, generateAesKey } from '@/utils/crypto';
import { encrypt } from '@/utils/jsencrypt';
import { getAuthorization, handleExpiredRequest, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

// 创建基础的 flat request 实例
const flatRequest = createFlatRequest<App.Service.Response, RequestInstanceState>(
  {
    baseURL,
    'axios-retry': {
      retries: 0,
    },
  },
  {
    async onRequest(config) {
      const isToken = config.headers?.isToken === false;
      // set token
      const token = localStg.get('token');
      if (token && !isToken) {
        const Authorization = getAuthorization();
        Object.assign(config.headers, { Authorization });
      }

      // 客户端 ID
      config.headers.Clientid = import.meta.env.VITE_APP_CLIENT_ID;
      // 对应国际化资源文件后缀
      config.headers['Content-Language'] = (localStg.get('lang') || 'zh-CN').replace('-', '_');

      handleRepeatSubmit(config);

      handleEncrypt(config);

      // FormData数据去请求头Content-Type
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "0000"(default), it means the request is success
      // to change this logic by yourself, you can modify the `VITE_SERVICE_SUCCESS_CODE` in `.env` file
      return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
    },
    async onBackendFail(response, instance) {
      const authStore = useAuthStore();
      const responseCode = String(response.data.code);

      function handleLogout() {
        authStore.resetStore();
      }

      function logoutAndCleanup() {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);

        flatRequest.state.errMsgStack = flatRequest.state.errMsgStack.filter((msg) => msg !== response.data.msg);
      }

      const isLogin = Boolean(localStg.get('token'));

      // when the backend response code is in `logoutCodes`, it means the user will be logged out and redirected to login page
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];

      // 合并处理登出代码：如果在登出代码列表中，直接登出并跳转
      const allLogoutCodes = [...logoutCodes, ...modalLogoutCodes].filter((code) => code);
      if (allLogoutCodes.includes(responseCode)) {
        // 如果已经在登录页，直接清理即可
        if (window.location.pathname?.startsWith('/login')) {
          logoutAndCleanup();
          return null;
        }

        // 检查是否已经在处理登出
        const isExist = flatRequest.state.errMsgStack?.includes(response.data.msg);
        if (isExist) {
          return null;
        }

        // 取消所有待处理的请求
        flatRequest.cancelAllRequest();

        // 直接登出并跳转到登录页
        logoutAndCleanup();

        return null;
      }

      // when the backend response code is in `expiredTokenCodes`, it means the token is expired, and refresh token
      // the api `refreshToken` can not return error code in `expiredTokenCodes`, otherwise it will be a dead loop, should return `logoutCodes` or `modalLogoutCodes`
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(responseCode)) {
        const success = await handleExpiredRequest(flatRequest.state);
        if (success) {
          const Authorization = getAuthorization();
          Object.assign(response.config.headers, { Authorization });

          return instance.request(response.config) as Promise<AxiosResponse>;
        }
      }

      return null;
    },
    transformBackendResponse(response) {
      // 二进制数据则直接返回
      if (response.request.responseType === 'blob' || response.request.responseType === 'arraybuffer') {
        return response.data;
      }

      if (response.data.rows) {
        return response.data;
      }

      return response.data.data;
    },
    onError(error) {
      // when the request is fail, you can show error message

      if (error.code === REQUEST_CANCELED_CODE) {
        return;
      }

      let message = error.message;
      let backendErrorCode = '';

      // get backend error message and code
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.msg || message;
        backendErrorCode = String(error.response?.data?.code || '');
      } else if (error.response) {
        // 处理HTTP错误（400, 404, 500等）
        // 优先使用后端返回的错误消息
        const respData = error.response?.data as Record<string, unknown>;
        message = (respData?.msg as string) || (respData?.message as string) || message;
        backendErrorCode = String(error.response?.status || '');
      }

      // 处理登出代码
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      const allLogoutCodes = [...logoutCodes, ...modalLogoutCodes].filter((code) => code);

      if (allLogoutCodes.includes(backendErrorCode)) {
        // HTTP 401 状态码，需要执行登出
        const authStore = useAuthStore();

        // 如果已经在登录页，不需要处理
        if (!window.location.pathname?.startsWith('/login')) {
          // 取消所有待处理的请求
          flatRequest.cancelAllRequest();

          // 执行登出并跳转
          authStore.resetStore();
        }
        return;
      }

      // when the token is expired, refresh token and retry request, so no need to show error message
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(backendErrorCode)) {
        return;
      }

      showErrorMsg(flatRequest.state, message);
    },
  },
);

function handleRepeatSubmit(config: InternalAxiosRequestConfig) {
  // 是否需要防止数据重复提交
  const isRepeatSubmit = config.headers?.repeatSubmit === false;

  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    const requestObj = {
      url: config.url!,
      data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
      time: new Date().getTime(),
    };
    const sessionObj = sessionStg.get('sessionObj');
    if (!sessionObj) {
      sessionStg.set('sessionObj', requestObj);
    } else {
      const s_url = sessionObj.url; // 请求地址
      const s_data = sessionObj.data; // 请求数据
      const s_time = sessionObj.time; // 请求时间
      const interval = 500; // 间隔时间(ms)，小于此时间视为重复提交
      if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
        const message = '数据正在处理，请勿重复提交';
        // eslint-disable-next-line no-console
        console.warn(`[${s_url}]: ${message}`);
        throw new Error(message);
      }
      sessionStg.set('sessionObj', requestObj);
    }
  }
}

function handleEncrypt(config: InternalAxiosRequestConfig) {
  // 是否需要加密
  const isEncrypt = config.headers?.isEncrypt === 'true';

  if (import.meta.env.VITE_APP_ENCRYPT === 'Y') {
    // 当开启参数加密
    if (isEncrypt && (config.method === 'post' || config.method === 'put')) {
      // 生成一个 AES 密钥
      const aesKey = generateAesKey();
      // 使用 RSA 加密 AES 密钥
      const encryptedKey = encrypt(encryptBase64(aesKey));
      // 使用 AES 加密请求数据
      const encryptedData =
        typeof config.data === 'object'
          ? encryptWithAes(JSON.stringify(config.data), aesKey)
          : encryptWithAes(config.data, aesKey);

      // 设置加密标识头
      config.headers['x-encrypted'] = 'true';
      // 请求体改为统一格式
      config.data = {
        encryptedKey,
        encryptedData,
      };
    }
  }
}

/**
 * 包装后的 request 函数
 * - code === 200 时：正常返回 { data, error: null }
 * - code !== 200 时：错误消息已在 onError 中显示，然后抛出异常
 *
 * 使用方式:
 * ```ts
 * // 失败时自动显示错误并抛出异常，后续代码不执行
 * const { data } = await fetchXxx();
 * message.success('操作成功');
 *
 * // 如果需要处理失败后的逻辑，可以用 try-catch
 * try {
 *   const { data } = await fetchXxx();
 *   message.success('操作成功');
 * } catch {
 *   // 错误消息已显示，这里可以做其他处理（如刷新列表等）
 * }
 * ```
 */
async function wrappedRequest<T, R extends ResponseType = 'json'>(config: Parameters<typeof flatRequest<T, R>>[0]) {
  const result = await flatRequest<T, R>(config);
  if (result.error) {
    // 错误消息已在 onError 中显示，直接抛出异常
    throw result.error;
  }
  return result;
}

// 导出包装后的 request，保持与 flatRequest 相同的接口
export const request: FlatRequestInstance<App.Service.Response, RequestInstanceState> = Object.assign(
  wrappedRequest as unknown as FlatRequestInstance<App.Service.Response, RequestInstanceState>,
  {
    cancelRequest: flatRequest.cancelRequest,
    cancelAllRequest: flatRequest.cancelAllRequest,
    state: flatRequest.state,
  },
);
