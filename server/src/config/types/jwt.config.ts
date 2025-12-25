import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * JWT 配置
 */
export class JwtConfig {
  @IsString()
  @IsNotEmpty()
  secretkey: string;

  @IsString()
  @Matches(/^\d+[smhd]$/, {
    message: 'expiresin must be a valid time string (e.g., 1h, 30m, 7d)',
  })
  expiresin: string;

  @IsString()
  @Matches(/^\d+[smhd]$/, {
    message: 'refreshExpiresIn must be a valid time string (e.g., 2h, 1d)',
  })
  refreshExpiresIn: string;
}
