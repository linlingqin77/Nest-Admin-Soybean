import { Controller, VERSION_NEUTRAL } from '@nestjs/common';
import {
  API_VERSIONS,
  VersionedController,
  VersionedControllerWithTag,
  MultiVersionController,
  VersionNeutralController,
} from '@/core/decorators/version.decorator';

describe('Version Decorators', () => {
  describe('API_VERSIONS', () => {
    it('should define V1 as "1"', () => {
      expect(API_VERSIONS.V1).toBe('1');
    });

    it('should define V2 as "2"', () => {
      expect(API_VERSIONS.V2).toBe('2');
    });
  });

  describe('VersionedController', () => {
    it('should create a controller with default version v1', () => {
      @VersionedController('test')
      class TestController {}

      const metadata = Reflect.getMetadata('path', TestController);
      const version = Reflect.getMetadata('__version__', TestController);

      expect(metadata).toBe('test');
      expect(version).toBe('1');
    });

    it('should create a controller with specified version v2', () => {
      @VersionedController('test', API_VERSIONS.V2)
      class TestV2Controller {}

      const metadata = Reflect.getMetadata('path', TestV2Controller);
      const version = Reflect.getMetadata('__version__', TestV2Controller);

      expect(metadata).toBe('test');
      expect(version).toBe('2');
    });
  });

  describe('VersionedControllerWithTag', () => {
    it('should create a controller with API tag and default version', () => {
      @VersionedControllerWithTag('test', 'Test API')
      class TestController {}

      const metadata = Reflect.getMetadata('path', TestController);
      const version = Reflect.getMetadata('__version__', TestController);
      const tags = Reflect.getMetadata('swagger/apiUseTags', TestController);

      expect(metadata).toBe('test');
      expect(version).toBe('1');
      expect(tags).toContain('Test API (v1)');
    });

    it('should create a controller with API tag and specified version', () => {
      @VersionedControllerWithTag('test', 'Test API', API_VERSIONS.V2)
      class TestV2Controller {}

      const metadata = Reflect.getMetadata('path', TestV2Controller);
      const version = Reflect.getMetadata('__version__', TestV2Controller);
      const tags = Reflect.getMetadata('swagger/apiUseTags', TestV2Controller);

      expect(metadata).toBe('test');
      expect(version).toBe('2');
      expect(tags).toContain('Test API (v2)');
    });
  });

  describe('MultiVersionController', () => {
    it('should create a controller supporting multiple versions', () => {
      @MultiVersionController('test', [API_VERSIONS.V1, API_VERSIONS.V2])
      class TestMultiController {}

      const metadata = Reflect.getMetadata('path', TestMultiController);
      const version = Reflect.getMetadata('__version__', TestMultiController);

      expect(metadata).toBe('test');
      expect(version).toEqual(['1', '2']);
    });
  });

  describe('VersionNeutralController', () => {
    it('should create a version-neutral controller', () => {
      @VersionNeutralController('health')
      class HealthController {}

      const metadata = Reflect.getMetadata('path', HealthController);
      const version = Reflect.getMetadata('__version__', HealthController);

      expect(metadata).toBe('health');
      expect(version).toBe(VERSION_NEUTRAL);
    });
  });
});
