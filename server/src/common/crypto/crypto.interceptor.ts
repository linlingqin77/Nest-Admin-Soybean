import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CryptoService } from './crypto.service';
import { SKIP_ENCRYPT_KEY, SKIP_DECRYPT_KEY } from './crypto.decorator';
import { Request, Response } from 'express';

/**
 * 请求解密拦截器
 * 解密前端发送的加密请求体
 */
@Injectable()
export class DecryptInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DecryptInterceptor.name);

  constructor(
    private cryptoService: CryptoService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.cryptoService.isEnabled()) {
      return next.handle();
    }

    // 检查是否跳过解密
    const skipDecrypt = this.reflector.getAllAndOverride<boolean>(SKIP_DECRYPT_KEY, [context.getHandler(), context.getClass()]);

    if (skipDecrypt) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    // 检查请求头是否标识为加密请求
    const isEncrypted = request.headers['x-encrypted'] === 'true';

    if (!isEncrypted || !request.body) {
      return next.handle();
    }

    try {
      const { encryptedKey, encryptedData } = request.body;

      if (encryptedKey && encryptedData) {
        // 解密请求体
        const decryptedBody = this.cryptoService.decryptRequest(encryptedKey, encryptedData);
        request.body = decryptedBody;

        // 保存 AES 密钥用于响应加密
        (request as any).__aesKey = this.cryptoService['rsaDecrypt'](encryptedKey);

        this.logger.debug('Request body decrypted successfully');
      }
    } catch (error) {
      this.logger.error('Failed to decrypt request body:', error.message);
      // 解密失败时，保持原始请求体，让后续处理决定如何响应
    }

    return next.handle();
  }
}

/**
 * 响应加密拦截器
 * 加密返回给前端的响应数据
 */
@Injectable()
export class EncryptInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptInterceptor.name);

  constructor(
    private cryptoService: CryptoService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.cryptoService.isEnabled()) {
      return next.handle();
    }

    // 检查是否跳过加密
    const skipEncrypt = this.reflector.getAllAndOverride<boolean>(SKIP_ENCRYPT_KEY, [context.getHandler(), context.getClass()]);

    if (skipEncrypt) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // 检查请求头是否要求加密响应
    const requireEncrypt = request.headers['x-encrypted'] === 'true';

    if (!requireEncrypt) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        try {
          // 使用请求中的 AES 密钥（如果有）
          const aesKey = (request as any).__aesKey;
          const encrypted = this.cryptoService.encryptResponse(data, aesKey);

          // 设置响应头标识
          response.setHeader('X-Encrypted', 'true');

          this.logger.debug('Response body encrypted successfully');

          return encrypted;
        } catch (error) {
          this.logger.error('Failed to encrypt response:', error.message);
          // 加密失败时返回原始数据
          return data;
        }
      }),
    );
  }
}
