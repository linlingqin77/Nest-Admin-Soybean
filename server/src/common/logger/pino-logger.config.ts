import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';
import { TenantContext } from '../tenant';
import * as path from 'path';
import * as fs from 'fs';

export function createPinoConfig(
  logDir: string,
  level: string,
  prettyPrint: boolean,
  toFile: boolean,
  excludePaths: string[],
  sensitiveFields: string[],
): Params {
  const env = process.env.NODE_ENV || 'development';

  // 创建日志目录
  if (toFile) {
    const absoluteLogDir = path.isAbsolute(logDir) ? logDir : path.resolve(process.cwd(), logDir);

    if (!fs.existsSync(absoluteLogDir)) {
      fs.mkdirSync(absoluteLogDir, { recursive: true });
    }
  }

  // 脱敏路径
  const redactPaths = sensitiveFields.flatMap((field) => [
    `req.body.${field}`,
    `req.query.${field}`,
    `req.headers.${field}`,
    `*.${field}`,
    `**.${field}`,
  ]);

  // 配置日志传输 - 同时支持控制台和文件输出
  let transport: any;

  if (prettyPrint && toFile) {
    // 开发环境:同时输出到控制台(美化)和文件
    const absoluteLogDir = path.isAbsolute(logDir) ? logDir : path.resolve(process.cwd(), logDir);

    transport = {
      targets: [
        {
          target: 'pino-pretty',
          level,
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
        {
          target: 'pino/file',
          level,
          options: {
            destination: path.join(absoluteLogDir, `app-${env}-${new Date().toISOString().split('T')[0]}.log`),
            mkdir: true,
          },
        },
      ],
    };
  } else if (prettyPrint) {
    // 仅美化控制台输出
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    };
  } else if (toFile) {
    // 仅文件输出(JSON格式)
    const absoluteLogDir = path.isAbsolute(logDir) ? logDir : path.resolve(process.cwd(), logDir);

    transport = {
      target: 'pino/file',
      options: {
        destination: path.join(absoluteLogDir, `app-${env}-${new Date().toISOString().split('T')[0]}.log`),
        mkdir: true,
      },
    };
  }

  return {
    pinoHttp: {
      level,
      redact: {
        paths: redactPaths,
        censor: '***REDACTED***',
      },
      transport,

      // JSON 格式日志文件 (生产环境)
      ...(!prettyPrint && {
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }),

      // 自定义请求日志格式
      customProps: (req: Request, res: Response) => {
        const user = req['user'];
        return {
          requestId: req['id'],
          tenantId: TenantContext.getTenantId() || 'unknown',
          userId: user?.user?.userId || user?.userId,
          username: user?.user?.userName || user?.userName || 'anonymous',
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        };
      },

      // 自定义序列化器 - 增强调试信息
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            // body 会被 redact 自动脱敏
            body: req.raw.body,
            headers: {
              host: req.headers.host,
              'content-type': req.headers['content-type'],
              'user-agent': req.headers['user-agent'],
              referer: req.headers.referer,
              'x-tenant-id': req.headers['x-tenant-id'],
              'x-encrypted': req.headers['x-encrypted'],
            },
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
            // 添加响应头信息便于调试
            headers: res.getHeaders
              ? {
                  'content-type': res.getHeader('content-type'),
                  'content-length': res.getHeader('content-length'),
                }
              : {},
          };
        },
        err(err) {
          return {
            type: err.constructor.name,
            message: err.message,
            stack: env === 'development' ? err.stack : undefined,
            code: err.code,
            // 添加额外的错误信息
            ...(err.response && { response: err.response }),
            ...(err.status && { status: err.status }),
          };
        },
      },

      // 自定义日志级别
      customLogLevel: function (req, res, err) {
        if (res.statusCode >= 500 || err) {
          return 'error';
        } else if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },

      // 自定义成功消息
      customSuccessMessage: function (req, res) {
        if (res.statusCode === 404) {
          return 'Resource not found';
        }
        return `${req.method} ${req.url} completed`;
      },

      // 自定义错误消息
      customErrorMessage: function (req, res, err) {
        return `${req.method} ${req.url} failed: ${err.message}`;
      },

      // 自动记录请求
      autoLogging: {
        ignore: (req) => {
          // 排除的路径
          return excludePaths.some((path) => req.url?.startsWith(path));
        },
      },
    },
  };
}
