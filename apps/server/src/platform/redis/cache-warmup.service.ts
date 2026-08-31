import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MultiLevelCacheService } from './multi-level-cache.service';
import { PrismaService } from 'src/platform/prisma';
import { CacheEnum } from 'src/shared/enums';
import { BusinessException } from 'src/shared/exceptions';
import { ResponseCode } from 'src/shared/response';

/**
 * 缓存预热任务配置
 */
export interface WarmupTask {
  /** 任务名称 */
  name: string;
  /** 缓存键或键生成函数 */
  key: string | (() => string);
  /** 数据加载函数 */
  loader: () => Promise<unknown>;
  /** TTL（秒） */
  ttl?: number;
  /** 是否在启动时执行 */
  runOnStartup?: boolean;
  /** 定时刷新间隔（毫秒），0 表示不刷新 */
  refreshInterval?: number;
}

/**
 * 缓存预热服务
 *
 * 在应用启动时预加载常用数据到缓存，减少冷启动时的数据库压力。
 * 支持定时刷新缓存，确保热点数据始终可用。
 *
 * @example
 * ```typescript
 * // 在模块初始化时注册预热任务
 * this.warmupService.registerTask({
 *   name: 'system-config',
 *   key: 'sys:config:all',
 *   loader: () => this.configService.findAll(),
 *   ttl: 3600,
 *   runOnStartup: true,
 *   refreshInterval: 600000, // 10 分钟刷新一次
 * });
 * ```
 */
@Injectable()
export class CacheWarmupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheWarmupService.name);
  private readonly tasks: Map<string, WarmupTask> = new Map();
  private readonly refreshIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly cacheService: MultiLevelCacheService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // 注册默认预热任务
    this.registerDefaultTasks();

    // 执行启动时的预热任务
    await this.warmupOnStartup();
  }

  /**
   * 模块销毁时清理所有定时刷新任务，防止内存泄漏
   */
  onModuleDestroy() {
    this.logger.log('Cleaning up cache warmup refresh intervals...');
    this.refreshIntervals.forEach((interval, name) => {
      clearInterval(interval);
      this.logger.debug(`Cleared refresh interval for task: ${name}`);
    });
    this.refreshIntervals.clear();
    this.tasks.clear();
    this.logger.log('Cache warmup service cleaned up successfully.');
  }

  /**
   * 注册默认的预热任务
   */
  private registerDefaultTasks(): void {
    // 系统配置缓存预热
    this.registerTask({
      name: 'system-config',
      key: CacheEnum.SYS_CONFIG_KEY,
      loader: async () => {
        const configs = await this.prisma.sysConfig.findMany({
          where: { delFlag: '0' },
          select: { configKey: true, configValue: true },
        });
        return configs.reduce(
          (acc, config) => {
            acc[config.configKey] = config.configValue;
            return acc;
          },
          {} as Record<string, string>,
        );
      },
      ttl: 3600,
      runOnStartup: true,
      refreshInterval: 600000, // 10 分钟刷新
    });

    // 字典数据缓存预热
    this.registerTask({
      name: 'dict-data',
      key: CacheEnum.SYS_DICT_KEY,
      loader: async () => {
        // 获取所有启用的字典类型
        const dictTypes = await this.prisma.sysDictType.findMany({
          where: { delFlag: '0', status: '0' },
          select: { dictType: true },
        });

        // 获取所有字典数据
        const dictDatas = await this.prisma.sysDictData.findMany({
          where: { delFlag: '0', status: '0' },
          orderBy: { dictSort: 'asc' },
          select: {
            dictCode: true,
            dictSort: true,
            dictLabel: true,
            dictValue: true,
            dictType: true,
            cssClass: true,
            listClass: true,
            isDefault: true,
            status: true,
          },
        });

        // 按字典类型分组
        return dictTypes.reduce(
          (acc, type) => {
            acc[type.dictType] = dictDatas.filter((data) => data.dictType === type.dictType);
            return acc;
          },
          {} as Record<string, unknown[]>,
        );
      },
      ttl: 3600,
      runOnStartup: true,
      refreshInterval: 600000,
    });
  }

  /**
   * 注册预热任务
   */
  registerTask(task: WarmupTask): void {
    this.tasks.set(task.name, task);
    this.logger.log(`Registered warmup task: ${task.name}`);

    // 如果有刷新间隔，设置定时刷新
    if (task.refreshInterval && task.refreshInterval > 0) {
      this.setupRefreshInterval(task);
    }
  }

  /**
   * 移除预热任务
   */
  unregisterTask(name: string): void {
    this.tasks.delete(name);

    // 清除定时刷新
    const interval = this.refreshIntervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(name);
    }

    this.logger.log(`Unregistered warmup task: ${name}`);
  }

  /**
   * 执行启动时的预热
   */
  private async warmupOnStartup(): Promise<void> {
    const startupTasks = Array.from(this.tasks.values()).filter((task) => task.runOnStartup);

    if (startupTasks.length === 0) {
      this.logger.log('No startup warmup tasks to execute');
      return;
    }

    this.logger.log(`Executing ${startupTasks.length} startup warmup tasks...`);

    const results = await Promise.allSettled(startupTasks.map((task) => this.executeTask(task)));

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(`Startup warmup completed: ${succeeded} succeeded, ${failed} failed`);
  }

  /**
   * 执行单个预热任务
   */
  async executeTask(task: WarmupTask): Promise<void> {
    const key = typeof task.key === 'function' ? task.key() : task.key;

    try {
      const startTime = Date.now();
      const data = await task.loader();
      const duration = Date.now() - startTime;

      await this.cacheService.set(key, data, task.ttl);

      this.logger.log(`Warmup task "${task.name}" completed in ${duration}ms, cached to key: ${key}`);
    } catch (error) {
      this.logger.error(`Warmup task "${task.name}" failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 手动执行指定任务
   */
  async warmup(taskName: string): Promise<void> {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, `Warmup task "${taskName}" not found`);
    }
    await this.executeTask(task);
  }

  /**
   * 手动执行所有任务
   */
  async warmupAll(): Promise<{ succeeded: number; failed: number }> {
    const tasks = Array.from(this.tasks.values());
    const results = await Promise.allSettled(tasks.map((task) => this.executeTask(task)));

    return {
      succeeded: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }

  /**
   * 设置定时刷新
   */
  private setupRefreshInterval(task: WarmupTask): void {
    if (!task.refreshInterval) return;

    // 清除已存在的定时器
    const existingInterval = this.refreshIntervals.get(task.name);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      try {
        await this.executeTask(task);
        this.logger.debug(`Refreshed warmup task: ${task.name}`);
      } catch (error) {
        this.logger.error(`Failed to refresh warmup task "${task.name}": ${error.message}`);
      }
    }, task.refreshInterval);

    this.refreshIntervals.set(task.name, interval);
    this.logger.log(`Set up refresh interval for task "${task.name}": ${task.refreshInterval}ms`);
  }

  /**
   * 获取所有已注册的任务
   */
  getTasks(): WarmupTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(): { name: string; hasRefreshInterval: boolean }[] {
    return Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      hasRefreshInterval: !!task.refreshInterval && task.refreshInterval > 0,
    }));
  }
}
