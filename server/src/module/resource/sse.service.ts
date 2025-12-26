import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import type { SseMessage } from '../../common/types/sse';

// Re-export for backward compatibility
export type { SseMessage } from '../../common/types/sse';

interface ClientConnection {
  userId: number;
  subject: Subject<SseMessage>;
}

@Injectable()
export class SseService {
  private clients: Map<string, ClientConnection> = new Map();

  /**
   * 添加客户端连接
   * @param clientId 客户端唯一标识
   * @param userId 用户ID
   * @returns Observable 用于发送消息
   */
  addClient(clientId: string, userId: number): Observable<MessageEvent> {
    const subject = new Subject<SseMessage>();
    this.clients.set(clientId, { userId, subject });

    return subject.asObservable().pipe(
      map((data) => {
        return {
          data: data.message,
        } as MessageEvent;
      }),
    );
  }

  /**
   * 移除客户端连接
   * @param clientId 客户端唯一标识
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subject.complete();
      this.clients.delete(clientId);
    }
  }

  /**
   * 向指定用户发送消息
   * @param userId 用户ID
   * @param message 消息内容
   */
  sendToUser(userId: number, message: string): void {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        client.subject.next({ userId, message });
      }
    });
  }

  /**
   * 向所有用户广播消息
   * @param message 消息内容
   */
  broadcast(message: string): void {
    this.clients.forEach((client) => {
      client.subject.next({ message });
    });
  }

  /**
   * 获取在线客户端数量
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 获取指定用户的在线连接数
   * @param userId 用户ID
   */
  getUserConnectionCount(userId: number): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        count++;
      }
    });
    return count;
  }
}
