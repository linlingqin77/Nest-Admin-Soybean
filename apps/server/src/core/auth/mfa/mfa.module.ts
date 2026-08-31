import { Module, Global } from '@nestjs/common';
import { MfaService } from './mfa.service';

/**
 * 多因素认证模块
 *
 * 提供 TOTP（Google Authenticator）和 SMS 短信验证码两种 MFA 方式
 */
@Global()
@Module({
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
