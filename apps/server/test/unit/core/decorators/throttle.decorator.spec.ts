import 'reflect-metadata';
import {
  ApiSkipThrottle,
  ApiThrottle,
  MultiThrottle,
  SkipMultiThrottle,
} from '@/core/http/decorators/throttle.decorator';
import { SKIP_THROTTLE_KEY, THROTTLE_KEY } from '@/core/http/guards/multi-throttle.guard';

describe('Throttle Decorators', () => {
  describe('ApiThrottle', () => {
    it('should set throttle metadata on method', () => {
      class TestController {
        @ApiThrottle({ ttl: 60000, limit: 10 })
        testMethod() {}
      }

      const instance = new TestController();
      const metadata = Reflect.getMetadata('THROTTLER:TTLdefault', instance.testMethod);
      const limitMetadata = Reflect.getMetadata('THROTTLER:LIMITdefault', instance.testMethod);

      expect(metadata).toBe(60000);
      expect(limitMetadata).toBe(10);
    });

    it('should set throttle metadata on class', () => {
      @ApiThrottle({ ttl: 30000, limit: 5 })
      class TestController {}

      const metadata = Reflect.getMetadata('THROTTLER:TTLdefault', TestController);
      const limitMetadata = Reflect.getMetadata('THROTTLER:LIMITdefault', TestController);

      expect(metadata).toBe(30000);
      expect(limitMetadata).toBe(5);
    });

    it('should use default values when not specified', () => {
      class TestController {
        @ApiThrottle({})
        testMethod() {}
      }

      const instance = new TestController();
      const ttlMetadata = Reflect.getMetadata('THROTTLER:TTLdefault', instance.testMethod);
      const limitMetadata = Reflect.getMetadata('THROTTLER:LIMITdefault', instance.testMethod);

      expect(ttlMetadata).toBe(60000); // default ttl
      expect(limitMetadata).toBe(100); // default limit
    });

    it('should set blockDuration when specified', () => {
      class TestController {
        @ApiThrottle({ ttl: 60000, limit: 10, blockDuration: 300000 })
        testMethod() {}
      }

      const instance = new TestController();
      const blockDurationMetadata = Reflect.getMetadata('THROTTLER:BLOCK_DURATIONdefault', instance.testMethod);

      expect(blockDurationMetadata).toBe(300000);
    });
  });

  describe('ApiSkipThrottle', () => {
    it('should set skip throttle metadata on method', () => {
      class TestController {
        @ApiSkipThrottle()
        testMethod() {}
      }

      const instance = new TestController();
      const metadata = Reflect.getMetadata('THROTTLER:SKIPdefault', instance.testMethod);

      expect(metadata).toBe(true);
    });

    it('should set skip throttle metadata on class', () => {
      @ApiSkipThrottle()
      class TestController {}

      const metadata = Reflect.getMetadata('THROTTLER:SKIPdefault', TestController);

      expect(metadata).toBe(true);
    });
  });

  describe('MultiThrottle', () => {
    it('should set multi-throttle metadata on method', () => {
      class TestController {
        @MultiThrottle({ ip: { ttl: 60000, limit: 10 } })
        testMethod() {}
      }

      const instance = new TestController();
      const metadata = Reflect.getMetadata(THROTTLE_KEY, instance.testMethod);

      expect(metadata).toEqual({ ip: { ttl: 60000, limit: 10 } });
    });

    it('should set multi-throttle metadata with multiple dimensions', () => {
      class TestController {
        @MultiThrottle({
          ip: { ttl: 60000, limit: 10 },
          user: { ttl: 60000, limit: 50 },
          tenant: { ttl: 60000, limit: 500 },
        })
        testMethod() {}
      }

      const instance = new TestController();
      const metadata = Reflect.getMetadata(THROTTLE_KEY, instance.testMethod);

      expect(metadata).toEqual({
        ip: { ttl: 60000, limit: 10 },
        user: { ttl: 60000, limit: 50 },
        tenant: { ttl: 60000, limit: 500 },
      });
    });
  });

  describe('SkipMultiThrottle', () => {
    it('should set skip multi-throttle metadata on method', () => {
      class TestController {
        @SkipMultiThrottle()
        testMethod() {}
      }

      const instance = new TestController();
      const metadata = Reflect.getMetadata(SKIP_THROTTLE_KEY, instance.testMethod);

      expect(metadata).toBe(true);
    });
  });
});
