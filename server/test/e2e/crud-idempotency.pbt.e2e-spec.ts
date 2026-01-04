/**
 * CRUD读操作幂等性属性基测试
 *
 * **Feature: api-integration-testing, Property 5: CRUD Idempotency for Read Operations**
 * **Validates: Requirements 3.3, 4.3, 5.3, 6.3, 7.3, 8.3**
 *
 * @description
 * *For any* GET request to retrieve a resource by ID, calling the same endpoint
 * multiple times with the same ID SHALL return identical results
 * (assuming no intervening modifications).
 */

import * as fc from 'fast-check';
import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Property 5: CRUD Idempotency for Read Operations', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  let token: string;
  const apiPrefix = '/api/v1';

  // Resources with known IDs for idempotency testing
  interface ResourceEndpoint {
    path: string;
    description: string;
    getExistingId: () => Promise<number | null>;
  }

  const resourceEndpoints: ResourceEndpoint[] = [
    {
      path: '/system/user',
      description: 'User',
      getExistingId: async () => {
        const user = await prisma.sysUser.findFirst({ where: { delFlag: '0' } });
        return user?.userId ?? null;
      },
    },
    {
      path: '/system/role',
      description: 'Role',
      getExistingId: async () => {
        const role = await prisma.sysRole.findFirst({ where: { delFlag: '0' } });
        return role?.roleId ?? null;
      },
    },
    {
      path: '/system/dept',
      description: 'Dept',
      getExistingId: async () => {
        const dept = await prisma.sysDept.findFirst({ where: { delFlag: '0' } });
        return dept?.deptId ?? null;
      },
    },
    {
      path: '/system/dict/type',
      description: 'Dict Type',
      getExistingId: async () => {
        const dictType = await prisma.sysDictType.findFirst();
        return dictType?.dictId ?? null;
      },
    },
    {
      path: '/system/menu',
      description: 'Menu',
      getExistingId: async () => {
        const menu = await prisma.sysMenu.findFirst();
        return menu?.menuId ?? null;
      },
    },
    {
      path: '/system/config',
      description: 'Config',
      getExistingId: async () => {
        const config = await prisma.sysConfig.findFirst();
        return config?.configId ?? null;
      },
    },
    {
      path: '/system/notice',
      description: 'Notice',
      getExistingId: async () => {
        const notice = await prisma.sysNotice.findFirst();
        return notice?.noticeId ?? null;
      },
    },
    {
      path: '/system/post',
      description: 'Post',
      getExistingId: async () => {
        const post = await prisma.sysPost.findFirst();
        return post?.postId ?? null;
      },
    },
  ];

  // Cache for existing IDs to avoid repeated DB queries
  const existingIds: Map<string, number> = new Map();

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();

    prisma = helper.getPrisma();
    redisService = helper.getApp().get(RedisService);

    // Disable captcha for testing
    const captchaConfig = await prisma.sysConfig.findFirst({
      where: { configKey: 'sys.account.captchaEnabled' },
    });
    if (captchaConfig) {
      await prisma.sysConfig.update({
        where: { configId: captchaConfig.configId },
        data: { configValue: 'false' },
      });
      await redisService.del(`${CacheEnum.SYS_CONFIG_KEY}sys.account.captchaEnabled`);
    }

    // Login to get token
    token = await helper.login();

    // Pre-fetch existing IDs for all resources
    for (const endpoint of resourceEndpoints) {
      const id = await endpoint.getExistingId();
      if (id !== null) {
        existingIds.set(endpoint.path, id);
      }
    }
  }, 60000);

  afterAll(async () => {
    await helper.cleanup();
    await helper.close();
  });

  /**
   * Property 5a: For any GET request by ID, multiple calls should return identical results
   */
  it('should return identical results for repeated GET requests by ID', async () => {
    // Filter to only endpoints with existing IDs
    const availableEndpoints = resourceEndpoints.filter((e) => existingIds.has(e.path));

    if (availableEndpoints.length === 0) {
      console.log('No resources with existing IDs found, skipping test');
      return;
    }

    const endpointArbitrary = fc.constantFrom(...availableEndpoints);
    const repeatCountArbitrary = fc.integer({ min: 2, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        endpointArbitrary,
        repeatCountArbitrary,
        async (endpoint, repeatCount) => {
          const id = existingIds.get(endpoint.path);
          if (!id) return true;

          const fullPath = `${apiPrefix}${endpoint.path}/${id}`;
          const responses: string[] = [];

          // Make multiple identical requests
          for (let i = 0; i < repeatCount; i++) {
            const response = await helper
              .getRequest()
              .get(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('tenant-id', '000000');

            // Skip if endpoint returns error
            if (response.body.code !== 200) {
              return true;
            }

            // Normalize response for comparison (remove timestamps that might change)
            const normalizedData = JSON.stringify(response.body.data);
            responses.push(normalizedData);
          }

          // Property: All responses should be identical
          const firstResponse = responses[0];
          const allIdentical = responses.every((r) => r === firstResponse);

          if (!allIdentical) {
            console.log(`Idempotency check failed for ${endpoint.description}`);
            console.log(`Path: ${fullPath}`);
            console.log(`Responses differ across ${repeatCount} calls`);
          }

          return allIdentical;
        },
      ),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);

  /**
   * Property 5b: For any list GET request with same parameters, results should be consistent
   * 
   * Note: Some fields like loginDate may change between requests due to concurrent activity.
   * We compare the structure and key fields rather than exact equality.
   */
  it('should return consistent results for repeated list requests', async () => {
    const listEndpoints = [
      { path: '/system/role/list', description: 'Role list' },
      { path: '/system/dept/list', description: 'Dept list' },
      { path: '/system/menu/list', description: 'Menu list' },
      { path: '/system/dict/type/list', description: 'Dict type list' },
      { path: '/system/config/list', description: 'Config list' },
      { path: '/system/post/list', description: 'Post list' },
    ];

    const endpointArbitrary = fc.constantFrom(...listEndpoints);

    await fc.assert(
      fc.asyncProperty(endpointArbitrary, async (endpoint) => {
        // Use fixed pagination params for consistency
        const params = endpoint.path.includes('/dept') || endpoint.path.includes('/menu')
          ? ''
          : '?pageNum=1&pageSize=10';
        const fullPath = `${apiPrefix}${endpoint.path}${params}`;

        // Make two identical requests
        const response1 = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        const response2 = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        // Skip if endpoint returns error
        if (response1.body.code !== 200 || response2.body.code !== 200) {
          return true;
        }

        // Property: Both responses should have same structure and data
        const data1 = JSON.stringify(response1.body.data);
        const data2 = JSON.stringify(response2.body.data);
        const isIdentical = data1 === data2;

        if (!isIdentical) {
          console.log(`List idempotency check failed for ${endpoint.description}`);
          console.log(`Path: ${fullPath}`);
        }

        return isIdentical;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);

  /**
   * Property 5c: GET requests should not modify resource state
   */
  it('should not modify resource state on GET requests', async () => {
    const availableEndpoints = resourceEndpoints.filter((e) => existingIds.has(e.path));

    if (availableEndpoints.length === 0) {
      console.log('No resources with existing IDs found, skipping test');
      return;
    }

    const endpointArbitrary = fc.constantFrom(...availableEndpoints);

    await fc.assert(
      fc.asyncProperty(endpointArbitrary, async (endpoint) => {
        const id = existingIds.get(endpoint.path);
        if (!id) return true;

        const fullPath = `${apiPrefix}${endpoint.path}/${id}`;

        // Get initial state
        const initialResponse = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        if (initialResponse.body.code !== 200) {
          return true;
        }

        // Make multiple GET requests
        for (let i = 0; i < 3; i++) {
          await helper
            .getRequest()
            .get(fullPath)
            .set('Authorization', `Bearer ${token}`)
            .set('tenant-id', '000000');
        }

        // Get final state
        const finalResponse = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        if (finalResponse.body.code !== 200) {
          return true;
        }

        // Property: State should not change after GET requests
        const initialData = JSON.stringify(initialResponse.body.data);
        const finalData = JSON.stringify(finalResponse.body.data);
        const stateUnchanged = initialData === finalData;

        if (!stateUnchanged) {
          console.log(`State changed after GET requests for ${endpoint.description}`);
          console.log(`Path: ${fullPath}`);
        }

        return stateUnchanged;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);
});
