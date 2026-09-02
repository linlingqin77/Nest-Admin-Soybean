import { applyDecorators, HttpException, HttpStatus, SetMetadata, UseInterceptors } from '@nestjs/common';
import { LockInterceptor } from 'src/core/http/interceptors/lock.interceptor';

export const LOCK_KEY = 'LOCK';

/**
 * 分布式锁配置选项
 */
export interface LockOptions {
  /** 锁Key（支持 {param} 占位符） */
  key: string;
  /** 等待时间（秒），默认0（不等待） */
  waitTime?: number;
  /** 持有时间（秒），默认30 */
  leaseTime?: number;
  /** 获取锁失败提示信息 */
  message?: string;
  /** Key前缀 */
  keyPrefix?: string;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<Omit<LockOptions, 'key'>> & { key: string } = {
  key: '',
  waitTime: 0,
  leaseTime: 30,
  message: '操作正在进行中，请稍后重试',
  keyPrefix: 'lock:',
};

/**
 * 锁获取异常
 */
export class LockAcquireException extends HttpException {
  constructor(message: string = '获取锁失败，请稍后重试') {
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * 分布式锁装饰器
 *
 * @description
 * 用于保证分布式环境下的数据一致性
 * 同一时间只有一个实例可以执行被装饰的方法
 *
 * @example
 * ```typescript
 * // 基本用法
 * @Put(':id')
 * @Lock({ key: 'order:{id}' })
 * async updateOrder(@Param('id') id: number, @Body() dto: UpdateOrderDto) {}
 *
 * // 自定义配置
 * @Post('process')
 * @Lock({ key: 'process:{body.orderId}', leaseTime: 60, waitTime: 5 })
 * async processOrder(@Body() dto: ProcessOrderDto) {}
 * ```
 *
 * @param options 分布式锁配置
 */
export function Lock(options: LockOptions) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return applyDecorators(SetMetadata(LOCK_KEY, mergedOptions), UseInterceptors(LockInterceptor));
}

export { LockInterceptor };
