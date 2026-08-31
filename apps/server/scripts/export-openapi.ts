/**
 * Export OpenAPI Specification
 *
 * Bootstraps the NestJS application, generates the OpenAPI document,
 * and writes it to packages/contracts/openapi/openapi.json.
 *
 * Run: npx tsx scripts/export-openapi.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/platform/config/app-config.service';

const OUTPUT_PATH = join(
  __dirname,
  '../../packages/contracts/openapi/openapi.json',
);

async function bootstrap() {
  console.log('🚀 Booting NestJS application for OpenAPI export...');

  const app = await NestFactory.create(AppModule, { logger: false });

  const config = app.get(AppConfigService);
  const prefix = config.app.prefix || 'api';

  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Nest-Admin API')
    .setDescription('Nest-Admin 后台管理系统 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'Authorization',
    )
    .addServer(config.app.file.domain)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions);

  // Ensure directory exists
  mkdirSync(join(__dirname, '../../packages/contracts/openapi'), { recursive: true });

  // Write to file
  writeFileSync(OUTPUT_PATH, JSON.stringify(document, null, 2), 'utf-8');

  console.log(`✅ OpenAPI spec exported to: ${OUTPUT_PATH}`);

  // Log stats
  const pathCount = Object.keys(document.paths || {}).length;
  const schemaCount = Object.keys(document.components?.schemas || {}).length;
  console.log(`   - Paths: ${pathCount}`);
  console.log(`   - Schemas: ${schemaCount}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to export OpenAPI:', err);
  process.exit(1);
});
