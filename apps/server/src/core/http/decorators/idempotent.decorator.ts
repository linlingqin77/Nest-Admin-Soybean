import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { IdempotentInterceptor } from 'src/core/http/interceptors/idempotent.interceptor';

export const IDEMPOTENT_KEY = 'IDEMPOTENT';

/**
 * 幂等性装饰器配置选项
 */
export interface IdempotentOptions {
  /** 过期时间（秒），默认5秒 */
  timeout?: number;
  /** 自定义Key生成策略，支持 {param} 占位符 */
  keyResolver?: string;
  /** 重复请求提示信息 */
  message?: string;
  /** 异常时是否删除Key，默认true */
  deleteOnError?: boolean;
  /** Key前缀 */
  keyPrefix?: string;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<IdempotentOptions> = {
  timeout: 5,
  keyResolver: '',
  message: '请勿重复提交',
  deleteOnError: true,
  keyPrefix: 'idempotent:',
};

/**
 * 幂等性装饰器
 *
 * @description
 * 用于防止重复请求导致的数据问题
 * 在指定时间内，相同参数的请求只会执行一次
 *
 * @example
 * ```typescript
 * // 基本用法
 * @Post('create')
 * @Idempotent()
 * async createOrder(@Body() dto: CreateOrderDto) {}
 *
 * // 自定义配置
 * @Post('submit')
 * @Idempotent({ timeout: 10, message: '订单正在处理中，请勿重复提交' })
 * async submitOrder(@Body() dto: SubmitOrderDto) {}
 *
 * // 自定义Key
 * @Post('pay')
 * @Idempotent({ keyResolver: '{orderId}' })
 * async payOrder(@Body() dto: PayOrderDto) {}
 * ```
 *
 * @param options 幂等性配置
 */
export function Idempotent(options: IdempotentOptions = {}) {
  return applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, { ...DEFAULT_OPTIONS, ...options }),
    UseInterceptors(IdempotentInterceptor),
  );
}

export { IdempotentInterceptor };
