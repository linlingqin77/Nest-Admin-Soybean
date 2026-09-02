import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/shared/dto';

/**
 * 数据库类型枚举
 */
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
}

/**
 * 创建数据源 DTO
 *
 * @description 用于创建新的数据源连接配置
 * Requirements: 1.1, 1.2, 15.4, 15.5
 */
export class CreateDataSourceDto {
  @ApiProperty({
    description: '数据源名称',
    example: '开发环境数据库',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '数据源名称不能为空' })
  @MinLength(1, { message: '数据源名称至少1个字符' })
  @MaxLength(100, { message: '数据源名称最多100个字符' })
  name!: string;

  @ApiProperty({
    description: '数据库类型',
    enum: DatabaseType,
    example: DatabaseType.POSTGRESQL,
  })
  @IsEnum(DatabaseType, { message: '数据库类型必须是 postgresql、mysql 或 sqlite' })
  type!: DatabaseType;

  @ApiProperty({
    description: '主机地址',
    example: 'localhost',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: '主机地址不能为空' })
  @MaxLength(255, { message: '主机地址最多255个字符' })
  host!: string;

  @ApiProperty({
    description: '端口号',
    example: 5432,
    minimum: 1,
    maximum: 65535,
  })
  @Type(() => Number)
  @IsInt({ message: '端口必须是整数' })
  @Min(1, { message: '端口号最小为1' })
  @Max(65535, { message: '端口号最大为65535' })
  port!: number;

  @ApiProperty({
    description: '数据库名称',
    example: 'nest_admin',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '数据库名称不能为空' })
  @MaxLength(100, { message: '数据库名称最多100个字符' })
  database!: string;

  @ApiProperty({
    description: '用户名',
    example: 'postgres',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(100, { message: '用户名最多100个字符' })
  username!: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string;

  @ApiPropertyOptional({
    description: '备注',
    example: '开发环境使用的数据库',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注最多500个字符' })
  remark?: string;
}

/**
 * 更新数据源 DTO
 *
 * @description 用于更新数据源连接配置，所有字段可选
 * Requirements: 1.1, 1.2, 15.4, 15.5
 */
export class UpdateDataSourceDto {
  @ApiPropertyOptional({
    description: '数据源名称',
    example: '开发环境数据库',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '数据源名称至少1个字符' })
  @MaxLength(100, { message: '数据源名称最多100个字符' })
  name?: string;

  @ApiPropertyOptional({
    description: '数据库类型',
    enum: DatabaseType,
    example: DatabaseType.POSTGRESQL,
  })
  @IsOptional()
  @IsEnum(DatabaseType, { message: '数据库类型必须是 postgresql、mysql 或 sqlite' })
  type?: DatabaseType;

  @ApiPropertyOptional({
    description: '主机地址',
    example: 'localhost',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '主机地址最多255个字符' })
  host?: string;

  @ApiPropertyOptional({
    description: '端口号',
    example: 5432,
    minimum: 1,
    maximum: 65535,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '端口必须是整数' })
  @Min(1, { message: '端口号最小为1' })
  @Max(65535, { message: '端口号最大为65535' })
  port?: number;

  @ApiPropertyOptional({
    description: '数据库名称',
    example: 'nest_admin',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '数据库名称最多100个字符' })
  database?: string;

  @ApiPropertyOptional({
    description: '用户名',
    example: 'postgres',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '用户名最多100个字符' })
  username?: string;

  @ApiPropertyOptional({
    description: '密码（留空则不更新）',
    example: 'newpassword123',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: '状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['0', '1'], { message: '状态值必须是 0 或 1' })
  status?: string;

  @ApiPropertyOptional({
    description: '备注',
    example: '开发环境使用的数据库',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注最多500个字符' })
  remark?: string;
}

/**
 * 查询数据源列表 DTO
 *
 * @description 用于分页查询数据源列表
 * Requirements: 1.1, 15.4, 15.5
 */
export class ListDataSourceRequestDto extends PageQueryDto {
  @ApiPropertyOptional({
    description: '数据源名称（模糊查询）',
    example: '开发',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '数据库类型',
    enum: DatabaseType,
    example: DatabaseType.POSTGRESQL,
  })
  @IsOptional()
  @IsEnum(DatabaseType, { message: '数据库类型必须是 postgresql、mysql 或 sqlite' })
  type?: DatabaseType;

  @ApiPropertyOptional({
    description: '状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['0', '1'], { message: '状态值必须是 0 或 1' })
  status?: string;
}

/**
 * 测试数据源连接 DTO
 *
 * @description 用于测试数据源连接是否可用
 * Requirements: 1.2, 1.5
 */
export class TestConnectionDto {
  @ApiProperty({
    description: '数据库类型',
    enum: DatabaseType,
    example: DatabaseType.POSTGRESQL,
  })
  @IsEnum(DatabaseType, { message: '数据库类型必须是 postgresql、mysql 或 sqlite' })
  type!: DatabaseType;

  @ApiProperty({
    description: '主机地址',
    example: 'localhost',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: '主机地址不能为空' })
  @MaxLength(255, { message: '主机地址最多255个字符' })
  host!: string;

  @ApiProperty({
    description: '端口号',
    example: 5432,
    minimum: 1,
    maximum: 65535,
  })
  @Type(() => Number)
  @IsInt({ message: '端口必须是整数' })
  @Min(1, { message: '端口号最小为1' })
  @Max(65535, { message: '端口号最大为65535' })
  port!: number;

  @ApiProperty({
    description: '数据库名称',
    example: 'nest_admin',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '数据库名称不能为空' })
  @MaxLength(100, { message: '数据库名称最多100个字符' })
  database!: string;

  @ApiProperty({
    description: '用户名',
    example: 'postgres',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(100, { message: '用户名最多100个字符' })
  username!: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string;
}

/**
 * 数据源响应 DTO
 *
 * @description 数据源信息响应格式
 * Requirements: 15.4, 15.5
 */
export class DataSourceResponseDto {
  @ApiProperty({ description: '数据源ID', example: 1 })
  id!: number;

  @ApiProperty({ description: '租户ID', example: '000000' })
  tenantId!: string;

  @ApiProperty({ description: '数据源名称', example: '开发环境数据库' })
  name!: string;

  @ApiProperty({ description: '数据库类型', enum: DatabaseType, example: DatabaseType.POSTGRESQL })
  type!: string;

  @ApiProperty({ description: '主机地址', example: 'localhost' })
  host!: string;

  @ApiProperty({ description: '端口号', example: 5432 })
  port!: number;

  @ApiProperty({ description: '数据库名称', example: 'nest_admin' })
  database!: string;

  @ApiProperty({ description: '用户名', example: 'postgres' })
  username!: string;

  @ApiProperty({ description: '状态（0正常 1停用）', example: '0' })
  status!: string;

  @ApiPropertyOptional({ description: '备注', example: '开发环境使用的数据库' })
  remark?: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createTime!: Date;

  @ApiPropertyOptional({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' })
  updateTime?: Date;
}

/**
 * 数据库表信息 DTO
 *
 * @description 数据库表元数据
 * Requirements: 1.3
 */
export class DbTableDto {
  @ApiProperty({ description: '表名', example: 'sys_user' })
  tableName!: string;

  @ApiProperty({ description: '表注释', example: '用户表' })
  tableComment!: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: Date;

  @ApiPropertyOptional({ description: '更新时间' })
  updateTime?: Date;
}

/**
 * 数据库列信息 DTO
 *
 * @description 数据库列元数据
 * Requirements: 1.3
 */
export class DbColumnDto {
  @ApiProperty({ description: '列名', example: 'user_id' })
  columnName!: string;

  @ApiProperty({ description: '列注释', example: '用户ID' })
  columnComment!: string;

  @ApiProperty({ description: '列类型', example: 'int' })
  columnType!: string;

  @ApiProperty({ description: '是否主键', example: true })
  isPrimaryKey!: boolean;

  @ApiProperty({ description: '是否自增', example: true })
  isAutoIncrement!: boolean;

  @ApiProperty({ description: '是否可空', example: false })
  isNullable!: boolean;

  @ApiPropertyOptional({ description: '默认值', example: '0' })
  defaultValue?: string;

  @ApiPropertyOptional({ description: '字符最大长度', example: 255 })
  maxLength?: number;
}
