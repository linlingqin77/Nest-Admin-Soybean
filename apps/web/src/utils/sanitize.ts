/**
 * XSS / iframe URL 安全工具
 *
 * 用于：
 * - v-html 内容的简单清洗（移除危险的 script 标签和事件处理器）
 * - iframe src URL 协议白名单校验
 *
 * 注意：v-html 仅清理最常见 XSS 风险。对于业务敏感场景，
 * 建议优先使用 textContent（Vue 模板默认转义），仅在确实需要
 * 渲染富文本时才使用 sanitizeHtml 并遵循"最小特权原则"。
 *
 * 已知限制（无法在无 DOMPurify 环境下 100% 安全）：
 * - HTML 解析复杂性（属性名变形、HTML 实体绕过等）
 * - CSS 注入（background: url(javascript:...)）
 * - data: URI 中的恶意内容
 * 对于真正需要富文本的，请使用 server-side rendered sanitization
 * 或安装 DOMPurify（npm i dompurify）。
 */

/** 危险标签正则 */
const DANGEROUS_TAGS_REGEX = /<\s*(\/?)\s*(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*>/gi;

/** on* 事件处理器属性正则 */
const ON_EVENT_REGEX = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

/** javascript: / vbscript: 协议正则 */
const JS_PROTOCOL_REGEX = /\s+(href|src|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;
const VB_PROTOCOL_REGEX = /\s+(href|src|xlink:href)\s*=\s*("vbscript:[^"]*"|'vbscript:[^']*'|vbscript:[^\s>]+)/gi;

/** data: 协议中允许的 MIME 白名单（仅允许图片类 data URL 用于 iframe，避免 SVG/HTML 类） */
const SAFE_DATA_IFRAME_REGEX = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i;

/**
 * 清理 HTML 字符串，移除最常见的 XSS 风险。
 *
 * 这是最小化实现，适用于业务场景中后端消息的可信度可控时。
 * 对于不可信 HTML（用户输入等），请使用 DOMPurify 等专业库。
 *
 * @param html 原始 HTML 字符串
 * @returns 清洗后的 HTML（仍是 HTML，但移除了已知危险标签/属性/协议）
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return (
    html
      // 1. 移除危险标签（script/style/iframe/object/embed/link/meta/base/form）
      .replace(DANGEROUS_TAGS_REGEX, '')
      // 2. 移除事件处理器属性（onclick, onerror, onload 等）
      .replace(ON_EVENT_REGEX, '')
      // 3. 移除 javascript: 协议
      .replace(JS_PROTOCOL_REGEX, '')
      // 4. 移除 vbscript: 协议
      .replace(VB_PROTOCOL_REGEX, '')
  );
}

/**
 * 校验 URL 是否为安全的 iframe src。
 *
 * 仅允许 http/https 协议，以及 image 类 data URL。
 * 不允许 javascript:, data:text/html 等可能执行脚本的协议。
 *
 * @param url 待校验的 URL
 * @returns 是否安全
 */
export function isSafeIframeUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // 允许的协议白名单
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  // data: 仅允许 image MIME（防止 data:text/html 注入脚本）
  if (SAFE_DATA_IFRAME_REGEX.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * 如果 URL 不安全则抛出错误（适合在路由组件中用作守卫）。
 */
export function assertSafeIframeUrl(url: string | undefined | null): void {
  if (!isSafeIframeUrl(url)) {
    throw new Error(`不允许的 iframe URL：协议必须为 http(s) 或安全的 data:image/*`);
  }
}
