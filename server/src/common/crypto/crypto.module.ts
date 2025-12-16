import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { DecryptInterceptor } from './crypto.interceptor';

@Global()
@Module({
  providers: [CryptoService, DecryptInterceptor],
  exports: [CryptoService, DecryptInterceptor],
})
export class CryptoModule {}
