import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { ApiThrottle, ApiSkipThrottle } from '@/core/http/decorators/throttle.decorator';
import { CustomThrottlerGuard } from '@/core/http/guards/throttle.guard';

/**
 * 测试控制器 - 用于验证限流功能
 */
@Controller('test')
class TestController {
  /**
   * 使用全局限流配置
   */
  @Get('global')
  globalThrottle() {
    return { message: 'global throttle' };
  }

  /**
   * 使用接口级别限流配置 - 覆盖全局配置
   * 每分钟只允许 2 次请求
   */
  @Get('custom')
  @ApiThrottle({ ttl: 60000, limit: 2 })
  customThrottle() {
    return { message: 'custom throttle' };
  }

  /**
   * 跳过限流
   */
  @Get('skip')
  @ApiSkipThrottle()
  skipThrottle() {
    return { message: 'skip throttle' };
  }
}

describe('Throttle Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // 全局限流配置：每分钟 5 次
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: CustomThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Global Throttle', () => {
    it('should allow requests within global limit', async () => {
      // 全局限流：每分钟 5 次
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer()).get('/test/global');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('global throttle');
      }
    });

    it('should block requests exceeding global limit', async () => {
      // 第 6 次请求应该被限流
      const response = await request(app.getHttpServer()).get('/test/global');
      expect(response.status).toBe(429);
    });
  });

  describe('Custom Throttle (Method Level Override)', () => {
    it('should use custom limit instead of global limit', async () => {
      // 自定义限流：每分钟 2 次
      for (let i = 0; i < 2; i++) {
        const response = await request(app.getHttpServer()).get('/test/custom');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('custom throttle');
      }
    });

    it('should block requests exceeding custom limit', async () => {
      // 第 3 次请求应该被限流（自定义限制为 2）
      const response = await request(app.getHttpServer()).get('/test/custom');
      expect(response.status).toBe(429);
    });
  });

  describe('Skip Throttle', () => {
    it('should allow unlimited requests when throttle is skipped', async () => {
      // 跳过限流的接口应该允许无限请求
      for (let i = 0; i < 20; i++) {
        const response = await request(app.getHttpServer()).get('/test/skip');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('skip throttle');
      }
    });
  });
});
