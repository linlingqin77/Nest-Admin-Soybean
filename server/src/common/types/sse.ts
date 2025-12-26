/**
 * Server-Sent Events Type Definitions
 * SSE 相关类型定义
 */

/**
 * SSE message
 * SSE 消息
 */
export type SseMessage = {
  userId?: number;
  message: string;
  type?: string;
  data?: unknown;
};
