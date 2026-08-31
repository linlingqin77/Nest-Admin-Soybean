import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

/**
 * 代码生成器配置
 */
export class GeneratorConfig {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  packageName: string;

  @IsString()
  @IsNotEmpty()
  moduleName: string;

  @IsBoolean()
  autoRemovePre: boolean;

  @IsArray()
  @IsString({ each: true })
  tablePrefix: string[];
}
