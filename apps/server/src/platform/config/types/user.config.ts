import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 用户配置
 */
export class UserConfig {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  initialPassword: string;
}
