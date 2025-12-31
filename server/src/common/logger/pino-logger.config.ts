import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';
import { TenantContext } from '../tenant';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 敏感字段类型映射
 */
const SENSITIVE_FIELD_PATTERNS: Record<string, 'phone' | 'email' | 'idCard' | 'password' | 'bankCard'> = {
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  tel: 'phone',
  telephone: 'phone',
  email: 'email',
  mail: 'email',
  idcard: 'idCard',
  idcardno: 'idCard',
  identitycard: 'idCard',
  bankcard: 'bankCard',
  bankcardno: 'bankCard',
  cardno: 'bankCard',
  password: 'password',
  pwd: 'password',
  secret: 'password',
  token: 'password',
  accesstoken: 'password',
  refreshtoken: 'password',
};

/**
 * 手机号脱敏
 * 格式: 138****8888
 */
function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length < 7) return phone;
  if (cleaned.startsWith('+')) {
    let countryCodeLen = 0;
    for (let i = 2; i <= 4 && i < cleaned.length; i++) {
      const remaining = cleaned.length - i;
      if (remaining >= 7) {
        countryCodeLen = i;
        break;
      }
    }
    if (countryCodeLen > 0) {
      const countryCode = cleaned.slice(0, countryCodeLen);
      const number = cleaned.slice(countryCodeLen);
      return `${countryCode}${number.slice(0, 3)}****${number.slice(-4)}`;
    }
    return phone;
  }
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-4)}`;
}

/**
 * 邮箱脱敏
 * 格式: a**b@domain.com
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  let maskedLocal: string;
  if (local.length <= 2) {
    maskedLocal = '**';
  } else {
    maskedLocal = `${local[0]}**${local.slice(-1)}`;
  }
  return `${maskedLocal}@${domain}`;
}

/**
 * 身份证号脱敏
 * 格式: 110***********1234
 */
function maskIdCard(idCard: string): string {
  if (!idCard || typeof idCard !== 'string') return idCard;
  const cleaned = idCard.replace(/\s/g, '');
  if (cleaned.length < 10) return idCard;
  return `${cleaned.slice(0, 3)}${'*'.repeat(cleaned.length - 7)}${cleaned.slice(-4)}`;
}

/**
 * 银行卡号脱敏
 * 格式: 6222****1234
 */
function maskBankCard(bankCard: string): string {
  if (!bankCard || typeof bankCard !== 'string') return bankCard;
  const cleaned = bankCard.replace(/[\s-]/g, '');
  if (cleaned.length < 8) return bankCard;
  return `${cleaned.slice(0, 4)}${'*'.repeat(cleaned.length - 8)}${cleaned.slice(-4)}`;
}

/**
 * 密码脱敏
 * 全部替换为固定长度的*
 */
function maskPassword(): string {
  return '******';
}

/**
 * 根据字段名获取脱敏类型
 */
function getSensitiveType(fieldName: string): 'phone' | 'email' | 'idCard' | 'password' | 'bankCard' | null {
  const normalizedFieldName = fieldName.toLowerCase().replace(/[_-]/g, '');
  return SENSITIVE_FIELD_PATTERNS[normalizedFieldName] || null;
}

/**
 * 根据类型脱敏值
 */
function maskByType(value: string, type: 'phone' | 'email' | 'idCard' | 'password' | 'bankCard'): string {
  switch (type) {
    case 'phone':
      return maskPhone(value);
    case 'email':
      return maskEmail(value);
    case 'idCard':
      return maskIdCard(value);
    case 'bankCard':
      return maskBankCard(value);
    case 'password':
      return maskPassword();
    default:
      return '***REDACTED***';
  }
}

/**
 * 自动检测并脱敏值
 */
function autoDetectAndMask(value: string): string {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return maskEmail(value);
  }
  if (/^1[3-9]\d{9}$/.test(value)) {
    return maskPhone(value);
  }
  if (/^\d{17}[\dXx]$/.test(value)) {
    return maskIdCard(value);
  }
  if (/^\d{16,19}$/.test(value)) {
    return maskBankCard(value);
  }
  return value;
}

/**
 * 智能脱敏函数
 * 根据字段名自动选择脱敏策略
 */
export function smartMask(value: unknown, fieldPath: string): string {
  if (value === null || value === undefined) return value as string;
  if (typeof value !== 'string') return String(value);

  // 从路径中提取字段名
  const fieldName = fieldPath.split('.').pop() || fieldPath;
  const sensitiveType = getSensitiveType(fieldName);

  if (sensitiveType) {
    return maskByType(value, sensitiveType);
  }

  // 尝试自动检测
  return autoDetectAndMask(value);
}

/**
 * 深度脱敏对象
 * 递归遍历对象，自动识别并脱敏敏感字段
 */
export function maskObjectDeep(obj: unknown, sensitiveFields: string[]): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObjectDeep(item, sensitiveFields));
  }

  const masked = { ...obj };
  for (const key of Object.keys(masked)) {
    const value = masked[key];
    if (value === null || value === undefined) continue;

    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
    const isSensitive = sensitiveFields.some((field) => {
      const normalizedField = field.toLowerCase().replace(/[_-]/g, '');
      return normalizedKey === normalizedField || normalizedKey.includes(normalizedField);
    });

    if (typeof value === 'string') {
      if (isSensitive) {
        masked[key] = smartMask(value, key);
      }
    } else if (typeof value === 'object') {
      masked[key] = maskObjectDeep(value, sensitiveFields);
    }
  }
  return masked;
}

/**
 * 从请求对象中获取 Request ID
 * 优先级: req.requestId > req.id > req.headers['x-request-id']
 */
export function getRequestId(req: Request): string {
  return req['requestId'] || req['id'] || (req.headers['x-request-id'] as string) || 'unknown';
}

/**
 * 创建 Pino 日志配置
 * 支持 Request ID 追踪、多租户上下文、敏感数据脱敏
 */
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

  // 脱敏路径 - 使用智能脱敏函数
  const redactPaths = sensitiveFields.flatMap((field) => [
    `req.body.${field}`,
    `req.query.${field}`,
    `req.headers.${field}`,
    `*.${field}`,
    `**.${field}`,
  ]);

  // 自定义脱敏函数 - 根据字段类型智能脱敏
  const redactCensor = (value: unknown, path: string[]): string => {
    const fieldName = path[path.length - 1] || '';
    return smartMask(value, fieldName);
  };

  // 配置日志传输 - 同时支持控制台和文件输出
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // 在美化输出中显示 requestId
            messageFormat: '{requestId} - {msg}',
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
        // 在美化输出中显示 requestId
        messageFormat: '{requestId} - {msg}',
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
        censor: redactCensor,
      },
      transport,

      // 使用请求中的 Request ID 作为日志 ID
      genReqId: (req: Request) => getRequestId(req),

      // JSON 格式日志文件 (生产环境)
      ...(!prettyPrint && {
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }),

      // 自定义请求日志格式 - 包含 Request ID 用于追踪
      customProps: (req: Request, _res: Response) => {
        const user = req['user'];
        const requestId = getRequestId(req);
        return {
          requestId,
          tenantId: TenantContext.getTenantId() || 'unknown',
          userId: user?.user?.userId || user?.userId,
          username: user?.user?.userName || user?.userName || 'anonymous',
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        };
      },

      // 自定义序列化器 - 增强调试信息并应用智能脱敏
      serializers: {
        req(req) {
          // 对请求体应用智能脱敏
          const maskedBody = req.raw?.body ? maskObjectDeep(req.raw.body, sensitiveFields) : undefined;

          return {
            id: req.id,
            method: req.method,
            url: req.url,
            query: maskObjectDeep(req.query, sensitiveFields),
            params: req.params,
            body: maskedBody,
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
      customLogLevel: function (_req, res, err) {
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
      customErrorMessage: function (req, _res, err) {
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
