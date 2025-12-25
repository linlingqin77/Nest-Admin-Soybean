import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { CryptoService } from './crypto.service';
import { SKIP_DECRYPT_KEY } from './crypto.decorator';
import { Request } from 'express';

/**
 * 请求解密拦截器
 * 解密前端发送的加密请求体
 *
 * 加密请求格式:
 * - 请求头: x-encrypted: 'true'
 * - 请求体: { encryptedKey: string, encryptedData: string }
 *   - encryptedKey: RSA 加密的 AES 密钥 (Base64)
 *   - encryptedData: AES-CBC 加密的数据 (IV + 密文, Base64)
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
    const skipDecrypt = this.reflector.getAllAndOverride<boolean>(SKIP_DECRYPT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

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

        this.logger.log(`Request body decrypted successfully: ${JSON.stringify(decryptedBody)}`);
      }
    } catch (error) {
      this.logger.error('Failed to decrypt request body:', error.message);
      this.logger.error('Error stack:', error.stack);
      // 解密失败时，保持原始请求体，让后续处理决定如何响应
    }

    return next.handle();
  }
}
