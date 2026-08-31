import { Module } from '@nestjs/common';
import { DocsController } from './docs.controller';

/**
 * API 文档模块
 *
 * @description 提供 API 文档相关功能，包括错误码文档
 */
@Module({
  controllers: [DocsController],
})
export class DocsModule {}
