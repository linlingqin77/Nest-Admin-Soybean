import { Global, Module } from '@nestjs/common';
import { UserRoleBridgeService } from './user-role-bridge.service';
import { PasswordService } from './password.service';

/**
 * 共享服务模块
 *
 * 提供跨模块使用的桥接服务，用于解决循环依赖问题。
 * 这些服务只依赖于基础设施层（如 PrismaService），不依赖业务模块。
 */
@Global()
@Module({
  providers: [UserRoleBridgeService, PasswordService],
  exports: [UserRoleBridgeService, PasswordService],
})
export class SharedServicesModule {}
