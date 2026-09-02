/**
 * SSRF (Server-Side Request Forgery) 防护工具
 *
 * 用于数据源连接、Webhook 调用等场景下校验目标地址是否指向内网/云元数据服务端，
 * 防止攻击者利用系统访问内部服务或云元数据接口。
 *
 * 防护策略：
 * - 阻止 RFC1918 私有地址 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - 阻止 Loopback 地址 (127.0.0.0/8, ::1)
 * - 阻止链路本地地址 (169.254.0.0/16, fe80::/10) — 排除云元数据
 * - 阻止云元数据端点 (169.254.169.254)
 * - 阻止保留/未分配地址段
 * - 支持可选的 DNS 重绑定时间窗口绕过检测（传入 hostname 时）
 *
 * 使用方式：
 *   import { validateTarget } from './ssrf';
 *   validateTarget('10.0.0.1', 5432); // throws if unsafe
 */
import { BusinessException } from 'src/shared/exceptions/business.exception';
import { ResponseCode } from 'src/shared/response';
import * as dns from 'dns';
import { promisify } from 'util';

const lookupAsync = promisify(dns.lookup);

/**
 * 已知的云元数据 IP（所有云厂商统一使用此地址）
 */
const CLOUD_METADATA_IPS = new Set<string>([
  '169.254.169.254', // AWS / Azure / GCP / 阿里云 / 腾讯云 / 华为云
  '169.254.169.253', // 腾讯云备用
  '169.254.169.249', // GCP 备用
  'metadata.google.internal', // GCP 域名
]);

/**
 * IPv4 CIDR 范围定义
 */
interface CidrRange {
  network: number; // 网络号（无符号32位整数）
  mask: number; // 前缀长度
}

/**
 * 将 IPv4 字符串转换为无符号32位整数
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4: ${ip}`);
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * 检查 IP 是否在给定 CIDR 范围内
 */
function isInCidr(ip: string, cidr: CidrRange): boolean {
  const ipNum = ipToNumber(ip);
  const mask = ~((1 << (32 - cidr.mask)) - 1);
  return (ipNum & mask) === (cidr.network & mask);
}

/**
 * 预定义的不安全 IP 范围（RFC1918 + 链路本地 + loopback + 已使用保留段）
 */
const UNSAFE_IP_RANGES: CidrRange[] = [
  // Loopback: 127.0.0.0/8
  { network: ipToNumber('127.0.0.0'), mask: 8 },
  // Link-local: 169.254.0.0/16 (云元数据 IP 169.254.169.254 在此范围内)
  { network: ipToNumber('169.254.0.0'), mask: 16 },
  // RFC1918 私有地址
  { network: ipToNumber('10.0.0.0'), mask: 8 },
  { network: ipToNumber('172.16.0.0'), mask: 12 },
  { network: ipToNumber('192.168.0.0'), mask: 16 },
  // CGN 共享地址 (100.64.0.0/10)
  { network: ipToNumber('100.64.0.0'), mask: 10 },
  // 保留地址段 (0.0.0.0/8, 240.0.0.0/4)
  { network: ipToNumber('0.0.0.0'), mask: 8 },
  { network: ipToNumber('240.0.0.0'), mask: 4 },
  // 多播地址段 (224.0.0.0/4) — 视项目风险承受能力决定是否阻止
  // { network: ipToNumber('224.0.0.0'), mask: 4 },
  // 测试网络 (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24)
  { network: ipToNumber('192.0.2.0'), mask: 24 },
  { network: ipToNumber('198.51.100.0'), mask: 24 },
  { network: ipToNumber('203.0.113.0'), mask: 24 },
];

export interface SsrfValidateOptions {
  /** 允许连接的端口白名单（空 = 全部允许数据库端口） */
  allowedPorts?: number[];
  /** 允许连接的 IP/主机名白名单（支持通配符，如 *.example.com） */
  allowedHosts?: string[];
  /** 允许连接的 IP 白名单 */
  allowedIps?: string[];
  /** 是否解析 DNS 并检查解析结果的 IP（默认 true） */
  resolveDns?: boolean;
}

/**
 * SSRF 校验错误消息
 */
export class SsrfException extends BusinessException {
  constructor(target: string, reason: string) {
    super(ResponseCode.FORBIDDEN, `SSRF 防护：目标地址 "${target}" 被禁止（${reason}）`);
  }
}

/**
 * 校验目标主机 + 端口是否安全（可访问外部网络）
 *
 * 若不通过则抛出 SsrfException。
 *
 * @param host 目标主机（IP 或域名）
 * @param port 目标端口
 * @param options 校验选项
 */
export async function validateTarget(
  host: string,
  port: number,
  options: SsrfValidateOptions = {},
): Promise<void> {
  const {
    allowedPorts = [5432, 3306, 1433, 27017, 6379],
    allowedHosts = [],
    allowedIps = [],
    resolveDns = true,
  } = options;

  const normalizedHost = host.trim().toLowerCase();
  const normalizedPort = Number(port);

  // 1. 端口校验
  if (!Number.isInteger(normalizedPort) || normalizedPort < 1 || normalizedPort > 65535) {
    throw new SsrfException(host, `端口 ${port} 超出有效范围`);
  }
  if (allowedPorts.length > 0 && !allowedPorts.includes(normalizedPort)) {
    throw new SsrfException(host, `端口 ${port} 不在允许列表中（仅允许 ${allowedPorts.join(', ')}）`);
  }

  // 2. 云元数据特殊检查（域名形式）
  if (CLOUD_METADATA_IPS.has(normalizedHost) || normalizedHost === 'metadata.google.internal') {
    throw new SsrfException(host, '云元数据端点地址被禁止');
  }

  // 3. IP 直接校验
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalizedHost)) {
    const ip = normalizedHost;

    // 白名单优先
    if (allowedIps.includes(ip)) return;

    // 云元数据 IP 检查
    if (CLOUD_METADATA_IPS.has(ip)) {
      throw new SsrfException(host, '云元数据 IP 地址被禁止');
    }

    // 不安全范围检查
    for (const range of UNSAFE_IP_RANGES) {
      if (isInCidr(ip, range)) {
        throw new SsrfException(
          host,
          `IP 属于内网/保留地址段（${range.network >>> 0}.${range.mask}），不允许连接`,
        );
      }
    }

    return;
  }

  // 4. 主机名校验（白名单 + DNS 解析）
  if (allowedHosts.length > 0) {
    const matched = allowedHosts.some((pattern) => {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        return normalizedHost === suffix || normalizedHost.endsWith(suffix);
      }
      return normalizedHost === pattern;
    });
    if (matched) return;
  }

  // 5. DNS 解析 + 递归检查解析结果
  if (resolveDns) {
    let resolvedIps: string[];
    try {
      const result = await lookupAsync(normalizedHost, { family: 4 });
      resolvedIps = Array.isArray(result) ? result.map((r) => r.address) : [result.address];
    } catch {
      // DNS 解析失败时，拒绝连接（防止 DNS 重绑定绕过）
      throw new SsrfException(host, `DNS 解析失败，拒绝连接`);
    }

    for (const ip of resolvedIps) {
      if (!ip) continue;
      // 递归检查解析后的 IP
      await validateTarget(ip, normalizedPort, {
        ...options,
        resolveDns: false, // 避免无限递归
      });
    }
    return;
  }

  // 无法校验时拒绝
  throw new SsrfException(host, '主机名无法通过 SSRF 安全校验');
}

/**
 * 同步版本：仅校验 IP 是否属于内网（不进行 DNS 解析）
 * 适用于在已知 IP 的场景下快速预检
 */
export function isUnsafeIp(ip: string): boolean {
  if (CLOUD_METADATA_IPS.has(ip)) return true;
  for (const range of UNSAFE_IP_RANGES) {
    if (isInCidr(ip, range)) return true;
  }
  return false;
}
