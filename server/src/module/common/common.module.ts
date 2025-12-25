import { Module, Global } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { AxiosModule } from './axios/axios.module';
import { AppConfigService } from 'src/config/app-config.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync(
      {
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => {
          return {
            closeClient: true,
            readyLog: true,
            errorLog: true,
            config: {
              host: config.redis.host,
              port: config.redis.port,
              password: config.redis.password,
              db: config.redis.db,
              keyPrefix: config.redis.keyPrefix,
            },
          };
        },
      },
      true,
    ),

    AxiosModule,
  ],
})
export class CommonModule {}
