import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { DecryptInterceptor } from './crypto.interceptor';

/**
 * 加密模块
 * 
 * 依赖:
 * - RedisModule (Global): 用于存储nonce，防止重放攻击
 * 
 * 功能:
 * - RSA + AES 混合加密
 * - 请求解密拦截器
 * - Nonce机制防重放攻击
 * - 时间戳校验
 */
@Global()
@Module({
  providers: [CryptoService, DecryptInterceptor],
  exports: [CryptoService, DecryptInterceptor],
})
export class CryptoModule {}
