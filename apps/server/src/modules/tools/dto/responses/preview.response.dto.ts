import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * 预览文件信息 DTO
 */
export class PreviewFileDto {
  @Expose()
  @ApiProperty({ description: '文件名称', example: 'user.controller.ts' })
  name: string;

  @Expose()
  @ApiProperty({ description: '文件路径', example: 'nestjs/User/user.controller.ts' })
  path: string;

  @Expose()
  @ApiProperty({ description: '文件内容' })
  content: string;

  @Expose()
  @ApiProperty({ description: '编程语言', example: 'typescript' })
  language: string;

  @Expose()
  @ApiProperty({ description: '文件大小（字节）', example: 1024 })
  size: number;

  @Expose()
  @ApiProperty({ description: '代码行数', example: 50 })
  lineCount: number;
}

/**
 * 文件树节点 DTO
 */
export class FileTreeNodeDto {
  @Expose()
  @ApiProperty({ description: '节点名称', example: 'nestjs' })
  name: string;

  @Expose()
  @ApiProperty({ description: '节点路径', example: 'nestjs' })
  path: string;

  @Expose()
  @ApiProperty({ description: '是否为目录', example: true })
  isDirectory: boolean;

  @Expose()
  @ApiPropertyOptional({ description: '子节点', type: [FileTreeNodeDto] })
  @Type(() => FileTreeNodeDto)
  children?: FileTreeNodeDto[];

  @Expose()
  @ApiPropertyOptional({ description: '文件信息（仅文件节点）', type: PreviewFileDto })
  @Type(() => PreviewFileDto)
  file?: PreviewFileDto;
}

/**
 * 代码预览响应 DTO
 */
export class PreviewResponseDto {
  @Expose()
  @ApiProperty({ description: '生成的文件列表', type: [PreviewFileDto] })
  @Type(() => PreviewFileDto)
  files: PreviewFileDto[];

  @Expose()
  @ApiProperty({ description: '文件树结构', type: [FileTreeNodeDto] })
  @Type(() => FileTreeNodeDto)
  fileTree: FileTreeNodeDto[];

  @Expose()
  @ApiProperty({ description: '总文件数', example: 8 })
  totalFiles: number;

  @Expose()
  @ApiProperty({ description: '总代码行数', example: 500 })
  totalLines: number;

  @Expose()
  @ApiProperty({ description: '总文件大小（字节）', example: 10240 })
  totalSize: number;
}
