import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  handleAll,
  circuitBreaker,
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  CircuitState,
  BrokenCircuitError,
  IsolatedCircuitError,
} from 'cockatiel';

/**
 * 熔断器配置选项
 */
export interface CircuitBreakerOptions {
  /** 失败阈值，连续失败多少次后触发熔断，默认 5 次 */
  threshold?: number;
  /** 冷却时间（毫秒），熔断后多久进入半开状态，默认 30000ms */
  cooldownMs?: number;
  /** 熔断器名称，用于日志和监控 */
  name?: string;
}

/**
 * 熔断器状态
 */
export enum BreakerState {
  /** 关闭状态，正常处理请求 */
  CLOSED = 'CLOSED',
  /** 打开状态，拒绝所有请求 */
  OPEN = 'OPEN',
  /** 半开状态，允许部分请求通过以测试服务是否恢复 */
  HALF_OPEN = 'HALF_OPEN',
  /** 隔离状态，手动隔离 */
  ISOLATED = 'ISOLATED',
}

/**
 * 熔断器信息
 */
export interface BreakerInfo {
  name: string;
  state: BreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

/**
 * 熔断器服务
 *
 * @description 提供熔断器的创建、管理和执行功能
 * 实现需求 3.1 和 3.2
 *
 * 熔断器状态转换：
 * - CLOSED -> OPEN: 连续失败次数达到阈值
 * - OPEN -> HALF_OPEN: 冷却时间过后
 * - HALF_OPEN -> CLOSED: 请求成功
 * - HALF_OPEN -> OPEN: 请求失败
 */
@Injectable()
export class CircuitBreakerService implements OnModuleDestroy {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers: Map<string, CircuitBreakerPolicy> = new Map();
  private readonly breakerStats: Map<
    string,
    {
      failureCount: number;
      successCount: number;
      lastFailureTime?: Date;
      lastSuccessTime?: Date;
    }
  > = new Map();

  /**
   * 创建熔断器
   *
   * @param name 熔断器名称
   * @param options 熔断器配置
   * @returns 熔断器策略
   */
  createBreaker(name: string, options: CircuitBreakerOptions = {}): CircuitBreakerPolicy {
    if (this.breakers.has(name)) {
      this.logger.warn(`Circuit breaker "${name}" already exists, returning existing instance`);
      return this.breakers.get(name)!;
    }

    const threshold = options.threshold ?? 5;
    const cooldownMs = options.cooldownMs ?? 30000;

    const breaker = circuitBreaker(handleAll, {
      halfOpenAfter: cooldownMs,
      breaker: new ConsecutiveBreaker(threshold),
    });

    // 初始化统计信息
    this.breakerStats.set(name, {
      failureCount: 0,
      successCount: 0,
    });

    // 监听状态变化
    breaker.onStateChange((state) => {
      const stateStr = this.mapCockatielState(state);
      this.logger.log(`Circuit breaker "${name}" state changed to: ${stateStr}`);
    });

    // 监听失败
    breaker.onFailure(() => {
      const stats = this.breakerStats.get(name);
      if (stats) {
        stats.failureCount++;
        stats.lastFailureTime = new Date();
      }
      this.logger.warn(`Circuit breaker "${name}" recorded a failure`);
    });

    // 监听成功
    breaker.onSuccess(() => {
      const stats = this.breakerStats.get(name);
      if (stats) {
        stats.successCount++;
        stats.lastSuccessTime = new Date();
      }
    });

    // 监听熔断打开
    breaker.onBreak(() => {
      this.logger.error(`Circuit breaker "${name}" is now OPEN - requests will be rejected`);
    });

    // 监听熔断重置
    breaker.onReset(() => {
      this.logger.log(`Circuit breaker "${name}" has been reset to CLOSED state`);
    });

    // 监听半开状态
    breaker.onHalfOpen(() => {
      this.logger.log(`Circuit breaker "${name}" is now HALF_OPEN - testing if service recovered`);
    });

    this.breakers.set(name, breaker);
    this.logger.log(`Circuit breaker "${name}" created with threshold=${threshold}, cooldown=${cooldownMs}ms`);

    return breaker;
  }

  /**
   * 获取熔断器
   *
   * @param name 熔断器名称
   * @returns 熔断器策略，如果不存在则返回 undefined
   */
  getBreaker(name: string): CircuitBreakerPolicy | undefined {
    return this.breakers.get(name);
  }

  /**
   * 获取或创建熔断器
   *
   * @param name 熔断器名称
   * @param options 熔断器配置（仅在创建时使用）
   * @returns 熔断器策略
   */
  getOrCreateBreaker(name: string, options: CircuitBreakerOptions = {}): CircuitBreakerPolicy {
    const existing = this.breakers.get(name);
    if (existing) {
      return existing;
    }
    return this.createBreaker(name, options);
  }

  /**
   * 执行受熔断器保护的操作
   *
   * @param name 熔断器名称
   * @param fn 要执行的异步函数
   * @returns 函数执行结果
   * @throws Error 如果熔断器不存在
   * @throws BrokenCircuitError 如果熔断器处于打开状态
   */
  async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker "${name}" not found. Please create it first using createBreaker().`);
    }

    try {
      return await breaker.execute(fn);
    } catch (error) {
      // Check IsolatedCircuitError first since it extends BrokenCircuitError
      if (error instanceof IsolatedCircuitError) {
        this.logger.warn(`Circuit breaker "${name}" is ISOLATED - request rejected`);
        throw new CircuitBreakerIsolatedError(name);
      }
      if (error instanceof BrokenCircuitError) {
        this.logger.warn(`Circuit breaker "${name}" is OPEN - request rejected`);
        throw new CircuitBreakerOpenError(name);
      }
      throw error;
    }
  }

  /**
   * 获取熔断器状态
   *
   * @param name 熔断器名称
   * @returns 熔断器状态
   */
  getState(name: string): BreakerState | undefined {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return undefined;
    }
    return this.mapCockatielState(breaker.state);
  }

  /**
   * 获取熔断器详细信息
   *
   * @param name 熔断器名称
   * @returns 熔断器信息
   */
  getBreakerInfo(name: string): BreakerInfo | undefined {
    const breaker = this.breakers.get(name);
    const stats = this.breakerStats.get(name);

    if (!breaker || !stats) {
      return undefined;
    }

    return {
      name,
      state: this.mapCockatielState(breaker.state),
      failureCount: stats.failureCount,
      successCount: stats.successCount,
      lastFailureTime: stats.lastFailureTime,
      lastSuccessTime: stats.lastSuccessTime,
    };
  }

  /**
   * 获取所有熔断器信息
   *
   * @returns 所有熔断器信息列表
   */
  getAllBreakersInfo(): BreakerInfo[] {
    const infos: BreakerInfo[] = [];
    for (const name of this.breakers.keys()) {
      const info = this.getBreakerInfo(name);
      if (info) {
        infos.push(info);
      }
    }
    return infos;
  }

  /**
   * 手动隔离熔断器
   *
   * @param name 熔断器名称
   */
  isolate(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.isolate();
      this.logger.warn(`Circuit breaker "${name}" has been manually isolated`);
    }
  }

  /**
   * 删除熔断器
   *
   * @param name 熔断器名称
   * @returns 是否成功删除
   */
  removeBreaker(name: string): boolean {
    const deleted = this.breakers.delete(name);
    this.breakerStats.delete(name);
    if (deleted) {
      this.logger.log(`Circuit breaker "${name}" has been removed`);
    }
    return deleted;
  }

  /**
   * 清除所有熔断器
   */
  clearAll(): void {
    this.breakers.clear();
    this.breakerStats.clear();
    this.logger.log('All circuit breakers have been cleared');
  }

  /**
   * 检查熔断器是否存在
   *
   * @param name 熔断器名称
   * @returns 是否存在
   */
  hasBreaker(name: string): boolean {
    return this.breakers.has(name);
  }

  /**
   * 获取所有熔断器名称
   *
   * @returns 熔断器名称列表
   */
  getBreakerNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * 模块销毁时清理资源
   */
  onModuleDestroy(): void {
    this.clearAll();
  }

  /**
   * 将 cockatiel 状态映射到自定义状态枚举
   */
  private mapCockatielState(state: CircuitState): BreakerState {
    switch (state) {
      case CircuitState.Closed:
        return BreakerState.CLOSED;
      case CircuitState.Open:
        return BreakerState.OPEN;
      case CircuitState.HalfOpen:
        return BreakerState.HALF_OPEN;
      case CircuitState.Isolated:
        return BreakerState.ISOLATED;
      default:
        return BreakerState.CLOSED;
    }
  }
}

/**
 * 熔断器打开错误
 */
export class CircuitBreakerOpenError extends Error {
  constructor(breakerName: string) {
    super(`Circuit breaker "${breakerName}" is open - service is unavailable`);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * 熔断器隔离错误
 */
export class CircuitBreakerIsolatedError extends Error {
  constructor(breakerName: string) {
    super(`Circuit breaker "${breakerName}" is isolated - service has been manually disabled`);
    this.name = 'CircuitBreakerIsolatedError';
  }
}
