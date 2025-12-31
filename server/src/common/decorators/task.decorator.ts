import { SetMetadata } from '@nestjs/common';

export const TASK_METADATA = 'task_metadata';

export interface TaskMetadata {
  name: string;
  description?: string;
}

/**
 * 任务注册信息接口
 */
interface TaskRegistration {
  classOrigin: new (...args: unknown[]) => unknown;
  methodName: string;
  metadata: TaskMetadata;
}

// 全局任务注册表
export class TaskRegistry {
  private static instance: TaskRegistry;
  private tasks = new Map<string, TaskRegistration>();

  private constructor() {}

  static getInstance(): TaskRegistry {
    if (!TaskRegistry.instance) {
      TaskRegistry.instance = new TaskRegistry();
    }
    return TaskRegistry.instance;
  }

  register(target: object, methodName: string, metadata: TaskMetadata): void {
    // 获取类名
    const classOrigin = target.constructor as new (...args: unknown[]) => unknown;
    this.tasks.set(metadata.name, { classOrigin, methodName, metadata });
  }

  getTasks(): TaskRegistration[] {
    return Array.from(this.tasks.values());
  }

  getTask(name: string): TaskRegistration | undefined {
    return this.tasks.get(name);
  }
}

/**
 * 任务装饰器
 * @param metadata 任务元数据
 */
export const Task = (metadata: TaskMetadata): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // 注册到元数据
    SetMetadata(TASK_METADATA, metadata)(target, propertyKey, descriptor);

    // 注册到全局注册表
    TaskRegistry.getInstance().register(target, propertyKey.toString(), metadata);

    return descriptor;
  };
};
