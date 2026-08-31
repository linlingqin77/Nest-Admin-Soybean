import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 应用信息响应接口
 */
export interface AppInfo {
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 应用描述 */
  description: string;
  /** 启动时间 (ISO 格式) */
  startTime: string;
  /** 运行时长 (秒) */
  uptime: number;
  /** 运行时长 (人类可读格式) */
  uptimeFormatted: string;
  /** Node.js 版本 */
  nodeVersion: string;
  /** 运行环境 */
  environment: string;
  /** 系统信息 */
  system: {
    /** 操作系统平台 */
    platform: string;
    /** 操作系统架构 */
    arch: string;
    /** 主机名 */
    hostname: string;
    /** CPU 核心数 */
    cpuCount: number;
    /** 总内存 (MB) */
    totalMemory: number;
    /** 可用内存 (MB) */
    freeMemory: number;
  };
  /** 进程信息 */
  process: {
    /** 进程 ID */
    pid: number;
    /** 内存使用 (MB) */
    memoryUsage: number;
    /** 堆内存使用 (MB) */
    heapUsed: number;
    /** 堆内存总量 (MB) */
    heapTotal: number;
  };
}

/**
 * 应用信息服务
 * 提供应用版本、启动时间、Node.js 版本等信息
 */
@Injectable()
export class InfoService {
  private readonly startTime: Date;
  private readonly packageInfo: { name: string; version: string; description: string };

  constructor() {
    this.startTime = new Date();
    this.packageInfo = this.loadPackageInfo();
  }

  /**
   * 加载 package.json 信息
   */
  private loadPackageInfo(): { name: string; version: string; description: string } {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0',
        description: packageJson.description || '',
      };
    } catch {
      return {
        name: 'nest-admin-soybean-server',
        version: '2.0.0',
        description: 'Nest-Admin-Soybean 后端服务',
      };
    }
  }

  /**
   * 格式化运行时长
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

    return parts.join(' ');
  }

  /**
   * 获取应用信息
   */
  getInfo(): AppInfo {
    const memoryUsage = process.memoryUsage();
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    return {
      name: this.packageInfo.name,
      version: this.packageInfo.version,
      description: this.packageInfo.description,
      startTime: this.startTime.toISOString(),
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpuCount: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
        freeMemory: Math.round(os.freemem() / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        memoryUsage: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    };
  }
}
