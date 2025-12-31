import { Module, Global } from '@nestjs/common';
import { LoginSecurityService } from './login-security.service';
import { TokenBlacklistService } from './token-blacklist.service';

/**
 * 登录安全模块
 *
 * @description 提供登录失败计数、账户锁定和 Token 管理功能
 * 需求 4.3: 登录失败 5 次后锁定账户 15 分钟
 * 需求 4.8: 登出后 Token 立即失效
 * 需求 4.9: 密码修改后使所有 Token 失效
 */
@Global()
@Module({
  providers: [LoginSecurityService, TokenBlacklistService],
  exports: [LoginSecurityService, TokenBlacklistService],
})
export class LoginSecurityModule {}
