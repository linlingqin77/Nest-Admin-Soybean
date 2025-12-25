import { IsIn, IsNotEmpty, IsString } from 'class-validator';

/**
 * 客户端配置
 */
export class ClientConfig {
  @IsString()
  @IsNotEmpty()
  defaultClientId: string;

  @IsIn(['password', 'authorization_code', 'client_credentials', 'refresh_token'])
  defaultGrantType: string;
}
