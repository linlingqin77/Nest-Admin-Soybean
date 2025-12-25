import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Task, TaskRegistry } from 'src/common/decorators/task.decorator';
import { JobLogService } from './job-log.service';
import { BusinessException } from 'src/common/exceptions/index';
import { ResponseCode } from 'src/common/response';
import { PrismaService } from 'src/prisma/prisma.service';
import { IgnoreTenant } from 'src/common/tenant/tenant.decorator';
import { TenantContext } from 'src/common/tenant/tenant.context';
import { NoticeService } from 'src/module/system/notice/notice.service';
import { VersionService } from 'src/module/upload/services/version.service';

@Injectable()
export class TaskService implements OnModuleInit {
  private readonly logger = new Logger(TaskService.name);
  // eslint-disable-next-line @typescript-eslint/ban-types
  private readonly taskMap = new Map<string, Function>();
  private serviceInstances = new Map<string, any>();

  constructor(
    private moduleRef: ModuleRef,
    private jobLogService: JobLogService,
    private prisma: PrismaService,
    private noticeService: NoticeService,
    private versionService: VersionService,
  ) {}

  onModuleInit() {
    this.initializeTasks();
  }

  /**
   * 初始化任务映射
   */
  private async initializeTasks() {
    const tasks = TaskRegistry.getInstance().getTasks();

    // 打印所有模块

    for (const { classOrigin, methodName, metadata } of tasks) {
      try {
        // 获取或创建服务实例
        let serviceInstance = this.serviceInstances.get(classOrigin.name);
        if (!serviceInstance) {
          // 动态获取服务实例
          serviceInstance = await this.moduleRef.get(classOrigin);
          this.serviceInstances.set(classOrigin.name, serviceInstance);
        }

        // 绑定方法到实例
        const method = serviceInstance[methodName].bind(serviceInstance);
        this.taskMap.set(metadata.name, method);
        this.logger.log(`注册任务: ${metadata.name}`);
      } catch (error) {
        this.logger.error(`注册任务失败 ${metadata.name}: ${error.message}`);
      }
    }
  }

  /**
   * 获取所有已注册的任务
   */
  getTasks() {
    return Array.from(this.taskMap.keys());
  }

  /**
   * 执行任务并记录日志
   */
  async executeTask(invokeTarget: string, jobName?: string, jobGroup?: string) {
    const startTime = new Date();
    let status = '0';
    let jobMessage = '执行成功';
    let exceptionInfo = '';

    try {
      // 使用正则表达式解析函数名和参数
      const regex = /^([^(]+)(?:\((.*)\))?$/;
      const match = invokeTarget.match(regex);

      BusinessException.throwIfNull(match, '调用目标格式错误', ResponseCode.PARAM_INVALID);

      const [, methodName, paramsStr] = match;
      const params = paramsStr ? this.parseParams(paramsStr) : [];

      // 获取任务方法
      const taskFn = this.taskMap.get(methodName);
      BusinessException.throwIfNull(taskFn, `任务 ${methodName} 不存在`, ResponseCode.DATA_NOT_FOUND);
      // 执行任务
      await taskFn(...params);
      return true;
    } catch (error) {
      status = '1';
      jobMessage = '执行失败';
      exceptionInfo = error.message;
      this.logger.error(`执行任务失败: ${error.message}`);
      return false;
    } finally {
      // 记录日志
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await this.jobLogService.addJobLog({
        jobName: jobName || '未知任务',
        jobGroup: jobGroup || 'DEFAULT',
        invokeTarget,
        status,
        jobMessage: `${jobMessage}，耗时 ${duration}ms`,
        exceptionInfo,
        createTime: startTime,
      });
    }
  }

  /**
   * 解析参数字符串
   * 支持以下格式:
   * - 字符串: 'text' 或 "text"
   * - 数字: 123 或 123.45
   * - 布尔值: true 或 false
   * - null
   * - undefined
   * - 数组: [1, 'text', true]
   * - 对象: {a: 1, b: 'text'}
   */
  private parseParams(paramsStr: string): any[] {
    if (!paramsStr.trim()) {
      return [];
    }

    try {
      // 将单引号替换为双引号
      const normalizedStr = paramsStr
        .replace(/'/g, '"')
        // 处理未加引号的字符串
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

      // 尝试解析为 JSON
      return Function(`return [${normalizedStr}]`)();
    } catch (error) {
      this.logger.error(`解析参数失败: ${error.message}`);
      return [];
    }
  }

  @Task({
    name: 'task.noParams',
    description: '无参示例任务',
  })
  async ryNoParams() {
    this.logger.log('执行无参示例任务');
  }

  @Task({
    name: 'task.params',
    description: '有参示例任务',
  })
  async ryParams(param1: string, param2: number, param3: boolean) {
    this.logger.log(`执行有参示例任务，参数：${JSON.stringify({ param1, param2, param3 })}`);
  }

  @Task({
    name: 'task.clearTemp',
    description: '清理临时文件',
  })
  async clearTemp() {
    this.logger.log('执行清理临时文件任务');
    // 实现清理临时文件的逻辑
  }

  @Task({
    name: 'task.monitorSystem',
    description: '系统状态监控',
  })
  async monitorSystem() {
    this.logger.log('执行系统状态监控任务');
    // 实现系统监控的逻辑
  }

  @Task({
    name: 'task.backupDatabase',
    description: '数据库备份',
  })
  async backupDatabase() {
    this.logger.log('执行数据库备份任务');
    // 实现数据库备份的逻辑
  }

  /**
   * 存储配额预警任务
   * 检查所有租户的存储使用情况，超过80%发送预警通知
   */
  @Task({
    name: 'storageQuotaAlert',
    description: '存储配额预警',
  })
  @IgnoreTenant()
  async storageQuotaAlert() {
    this.logger.log('开始执行存储配额预警任务');

    try {
      // 查询所有正常状态的租户
      const tenants = await this.prisma.sysTenant.findMany({
        where: {
          status: '0',
          delFlag: '0',
        },
        select: {
          tenantId: true,
          companyName: true,
          storageQuota: true,
          storageUsed: true,
          contactUserName: true,
        },
      });

      let alertCount = 0;

      for (const tenant of tenants) {
        const { tenantId, companyName, storageQuota, storageUsed, contactUserName } = tenant;

        // 计算使用百分比
        const percentage = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;

        // 如果使用超过80%，发送预警通知
        if (percentage >= 80) {
          const remaining = storageQuota - storageUsed;
          const status = percentage >= 95 ? '严重预警' : '预警';

          const noticeContent = `
您好，${contactUserName || '管理员'}！

您的存储空间使用情况需要关注：
- 公司名称：${companyName}
- 已使用：${storageUsed}MB
- 总配额：${storageQuota}MB
- 使用率：${percentage.toFixed(2)}%
- 剩余空间：${remaining}MB

${percentage >= 95 ? '⚠️ 存储空间即将耗尽，请立即清理文件！' : '请及时清理不需要的文件，避免影响业务使用。'}

您可以通过以下方式释放空间：
1. 清理回收站中的文件
2. 删除不需要的文件
3. 联系管理员扩容存储空间
          `.trim();

          // 在对应租户上下文中创建系统通知
          await TenantContext.run({ tenantId }, async () => {
            await this.noticeService.create({
              noticeTitle: `存储空间${status}`,
              noticeType: '1', // 系统通知
              noticeContent,
              status: '0',
            });
          });

          alertCount++;
          this.logger.warn(`租户 ${tenantId}(${companyName}) 存储空间使用率 ${percentage.toFixed(2)}%，已发送预警通知`);
        }
      }

      this.logger.log(`存储配额预警任务执行完成，共发送 ${alertCount} 条预警通知`);
    } catch (error) {
      this.logger.error(`存储配额预警任务执行失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 清理旧文件版本任务
   * 批量扫描并清理超过maxVersions限制的旧版本文件
   */
  @Task({
    name: 'cleanOldFileVersions',
    description: '清理旧文件版本',
  })
  @IgnoreTenant()
  async cleanOldFileVersions() {
    this.logger.log('开始执行清理旧文件版本任务');

    try {
      // 检查自动清理配置是否启用
      const autoCleanConfig = await this.prisma.sysConfig.findFirst({
        where: {
          configKey: 'sys.file.autoCleanVersions',
          delFlag: '0',
        },
      });

      if (autoCleanConfig?.configValue !== 'true') {
        this.logger.log('自动清理旧版本功能未启用');
        return;
      }

      // 获取maxVersions配置
      const maxVersionsConfig = await this.prisma.sysConfig.findFirst({
        where: {
          configKey: 'sys.file.maxVersions',
          delFlag: '0',
        },
      });

      const maxVersions = parseInt(maxVersionsConfig?.configValue || '5');
      this.logger.log(`最大版本数限制: ${maxVersions}`);

      // 查询所有有版本的文件（按parentFileId分组）
      const filesWithVersions = await this.prisma.sysUpload.groupBy({
        by: ['parentFileId'],
        where: {
          parentFileId: { not: null },
          delFlag: '0',
        },
        _count: {
          uploadId: true,
        },
        having: {
          uploadId: {
            _count: {
              gt: 0,
            },
          },
        },
      });

      let totalCleaned = 0;

      for (const group of filesWithVersions) {
        const parentFileId = group.parentFileId;

        // 查询该文件的所有版本
        const versions = await this.prisma.sysUpload.findMany({
          where: {
            OR: [{ uploadId: parentFileId }, { parentFileId: parentFileId }],
            delFlag: '0',
          },
          orderBy: { version: 'desc' },
        });

        // 如果版本数超过限制，清理最旧的版本
        if (versions.length > maxVersions) {
          const versionsToDelete = versions.slice(maxVersions);

          for (const version of versionsToDelete) {
            try {
              // 删除物理文件
              await this.versionService.deletePhysicalFile(version);

              // 删除数据库记录
              await this.prisma.sysUpload.delete({
                where: { uploadId: version.uploadId },
              });

              totalCleaned++;
              this.logger.log(`已清理版本: ${version.uploadId}, 文件: ${version.fileName}, 版本号: ${version.version}`);
            } catch (error) {
              this.logger.error(`清理版本失败: ${version.uploadId}, 错误: ${error.message}`);
            }
          }
        }
      }

      this.logger.log(`清理旧文件版本任务执行完成，共清理 ${totalCleaned} 个旧版本`);
    } catch (error) {
      this.logger.error(`清理旧文件版本任务执行失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
