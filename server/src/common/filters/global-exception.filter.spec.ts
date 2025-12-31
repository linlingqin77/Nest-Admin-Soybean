import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { GlobalExceptionFilter } from './global-exception.filter';
import {
  BusinessException,
  AuthenticationException,
  AuthorizationException,
  ValidationException,
} from '../exceptions/business.exception';
import { ResponseCode } from '../response/response.interface';
import { Controller, Get, Module, BadRequestException, HttpException } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ClsService, ClsModule } from 'nestjs-cls';

// 测试用控制器
@Controller('test')
class TestController {
  @Get('business')
  throwBusiness() {
    throw new BusinessException(ResponseCode.USER_NOT_FOUND);
  }

  @Get('auth')
  throwAuth() {
    throw new AuthenticationException(ResponseCode.TOKEN_EXPIRED);
  }

  @Get('authz')
  throwAuthz() {
    throw new AuthorizationException(ResponseCode.PERMISSION_DENIED);
  }

  @Get('validation')
  throwValidation() {
    throw new ValidationException(['用户名不能为空', '密码不能为空']);
  }

  @Get('bad-request')
  throwBadRequest() {
    throw new BadRequestException('请求参数错误');
  }

  @Get('http')
  throwHttp() {
    throw new HttpException('服务不可用', HttpStatus.SERVICE_UNAVAILABLE);
  }

  @Get('error')
  throwError() {
    throw new Error('未知错误');
  }

  @Get('success')
  success() {
    return { message: 'ok' };
  }
}

@Module({
  imports: [ClsModule.forRoot({ global: true })],
  controllers: [TestController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
class TestModule {}

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle BusinessException with 200 status', () => {
    return request(app.getHttpServer())
      .get('/test/business')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.code).toBe(ResponseCode.USER_NOT_FOUND);
        expect(res.body.msg).toBe('用户不存在');
        expect(res.body.data).toBeNull();
        // 验证统一响应格式包含 requestId 和 timestamp
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should handle AuthenticationException with 401 status', () => {
    return request(app.getHttpServer())
      .get('/test/auth')
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body.code).toBe(ResponseCode.TOKEN_EXPIRED);
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should handle AuthorizationException with 403 status', () => {
    return request(app.getHttpServer())
      .get('/test/authz')
      .expect(HttpStatus.FORBIDDEN)
      .expect((res) => {
        expect(res.body.code).toBe(ResponseCode.PERMISSION_DENIED);
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should handle ValidationException with 400 status', () => {
    return request(app.getHttpServer())
      .get('/test/validation')
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.code).toBe(ResponseCode.PARAM_INVALID);
        expect(res.body.msg).toBe('用户名不能为空');
        expect(res.body.data).toEqual({ errors: ['用户名不能为空', '密码不能为空'] });
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should handle BadRequestException with 400 status', () => {
    return request(app.getHttpServer())
      .get('/test/bad-request')
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.code).toBe(ResponseCode.PARAM_INVALID);
        expect(res.body.msg).toBe('请求参数错误');
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should handle HttpException with corresponding status', () => {
    return request(app.getHttpServer())
      .get('/test/http')
      .expect(HttpStatus.SERVICE_UNAVAILABLE)
      .expect((res) => {
        expect(res.body.code).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(res.body.msg).toBe('服务不可用');
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should handle unknown Error with 500 status', () => {
    return request(app.getHttpServer())
      .get('/test/error')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect((res) => {
        expect(res.body.code).toBe(ResponseCode.INTERNAL_SERVER_ERROR);
        expect(res.body.requestId).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('should pass through successful responses', () => {
    return request(app.getHttpServer())
      .get('/test/success')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.message).toBe('ok');
      });
  });

  it('should include valid ISO timestamp in error responses', () => {
    return request(app.getHttpServer())
      .get('/test/business')
      .expect(HttpStatus.OK)
      .expect((res) => {
        const timestamp = res.body.timestamp;
        expect(timestamp).toBeDefined();
        // 验证是有效的 ISO 8601 格式
        const date = new Date(timestamp);
        expect(date.toISOString()).toBe(timestamp);
      });
  });
});
