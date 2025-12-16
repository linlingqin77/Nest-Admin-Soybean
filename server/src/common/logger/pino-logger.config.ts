import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';
import { TenantContext } from '../tenant';

export function createPinoConfig(
    logDir: string,
    level: string,
    prettyPrint: boolean,
    excludePaths: string[],
    sensitiveFields: string[],
): Params {
    const env = process.env.NODE_ENV || 'development';

    // 脱敏路径
    const redactPaths = sensitiveFields.flatMap((field) => [
        `req.body.${field}`,
        `req.query.${field}`,
        `req.headers.${field}`,
        `*.${field}`,
        `**.${field}`,
    ]);

    return {
        pinoHttp: {
            level,
            redact: {
                paths: redactPaths,
                censor: '***REDACTED***',
            },
            transport: prettyPrint
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                        ignore: 'pid,hostname',
                        singleLine: false,
                    },
                }
                : undefined,

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

            // 自定义序列化器
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
                            'user-agent': req.headers['user-agent'],
                            referer: req.headers.referer,
                        },
                    };
                },
                res(res) {
                    return {
                        statusCode: res.statusCode,
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
