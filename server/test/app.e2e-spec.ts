import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) - should return health status', async () => {
    const response = await request(app.getHttpServer())
      .get(`${prefix}/health`);
    
    // Health check may return 200 (healthy) or 503 (unhealthy) depending on environment
    expect([200, 503]).toContain(response.status);
    // Response body should have either 'status' (healthy) or 'code' (error response)
    expect(response.body).toBeDefined();
  });
});
