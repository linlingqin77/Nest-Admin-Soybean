import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from 'src/platform/config/app-config.service';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserAuthService } from './services/user-auth.service';
import { UserProfileService } from './services/user-profile.service';
import { UserRoleService } from './services/user-role.service';
import { UserExportService } from './services/user-export.service';
import { UserCrudService } from './services/user-crud.service';
import { UserBatchService } from './services/user-batch.service';
import { UserQueryService } from './services/user-query.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (config: AppConfigService) => ({
        secret: config.jwt.secretkey,
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserAuthService,
    UserProfileService,
    UserRoleService,
    UserExportService,
    UserCrudService,
    UserBatchService,
    UserQueryService,
  ],
  exports: [
    UserService,
    UserAuthService,
    UserProfileService,
    UserRoleService,
    UserCrudService,
    UserBatchService,
    UserQueryService,
  ],
})
export class UserModule {}
