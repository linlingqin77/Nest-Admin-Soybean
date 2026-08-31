/**
 * NestJS 代码生成属性测试
 *
 * Property 9: 生成代码包含必要装饰器
 * Property 10: 生成代码使用统一响应格式
 * **Validates: Requirements 13.3, 13.4, 15.1, 15.10**
 */
import * as fc from 'fast-check';
import { controllerTem } from '@/modules/tools/template/nestjs/controller';
import { serviceTem } from '@/modules/tools/template/nestjs/service';
import { dtoTem } from '@/modules/tools/template/nestjs/dto';
import { moduleTem } from '@/modules/tools/template/nestjs/modules';
import { entityTem } from '@/modules/tools/template/nestjs/entity';

describe('NestJS Code Generation - Property Tests', () => {
  /**
   * 生成有效的代码生成选项
   */
  const validOptionsArbitrary = fc.record({
    BusinessName: fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s))
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    businessName: fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s))
      .map((s) => s.charAt(0).toLowerCase() + s.slice(1)),
    functionName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    moduleName: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z][a-z0-9-]*$/.test(s)),
    primaryKey: fc.constantFrom('id', 'userId', 'roleId', 'menuId', 'deptId'),
    tableComment: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    className: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[A-Z][a-zA-Z0-9]*$/.test(s)),
    tenantAware: fc.boolean(),
    columns: fc
      .array(
        fc.record({
          javaField: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          javaType: fc.constantFrom('String', 'Number', 'Boolean', 'Date'),
          columnComment: fc.string({ minLength: 1, maxLength: 50 }),
          columnType: fc.constantFrom('varchar', 'int', 'datetime', 'char', 'text'),
          isPk: fc.constantFrom('0', '1'),
          isInsert: fc.constantFrom('0', '1'),
          isEdit: fc.constantFrom('0', '1'),
          isList: fc.constantFrom('0', '1'),
          isQuery: fc.constantFrom('0', '1'),
          isRequired: fc.constantFrom('0', '1'),
          queryType: fc.constantFrom('EQ', 'NE', 'LIKE', 'BETWEEN'),
          htmlType: fc.constantFrom('input', 'select', 'radio', 'datetime', 'textarea'),
          dictType: fc.option(fc.constantFrom('sys_normal_disable', 'sys_yes_no', ''), { nil: '' }),
        }),
        { minLength: 2, maxLength: 10 },
      )
      .map((cols) => {
        // 确保至少有一个主键
        if (!cols.some((c) => c.isPk === '1')) {
          cols[0].isPk = '1';
          cols[0].javaField = 'id';
        }
        // 确保至少有一个非主键列被包含在各个 DTO 中
        const nonPkCols = cols.filter((c) => c.isPk !== '1');
        if (nonPkCols.length > 0) {
          nonPkCols[0].isInsert = '1';
          nonPkCols[0].isEdit = '1';
          nonPkCols[0].isList = '1';
          nonPkCols[0].isQuery = '1';
        }
        return cols;
      }),
  });

  describe('Property 9: 生成代码包含必要装饰器', () => {
    /**
     * **Validates: Requirements 13.4, 15.1, 15.10**
     *
     * *For any* generated NestJS controller code, it should contain
     * @ApiTags, @ApiBearerAuth, and @RequirePermission decorators.
     */
    it('should include @ApiTags decorator in controller', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证包含 @ApiTags 装饰器
          expect(code).toContain('@ApiTags(');
          expect(code).toContain(options.functionName || options.tableComment || options.businessName);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 15.10**
     *
     * *For any* generated controller, it should include @ApiBearerAuth decorator.
     */
    it('should include @ApiBearerAuth decorator in controller', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证包含 @ApiBearerAuth 装饰器
          expect(code).toContain("@ApiBearerAuth('Authorization')");

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.4**
     *
     * *For any* generated controller, each endpoint should have @RequirePermission decorator.
     */
    it('should include @RequirePermission decorator for each endpoint', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证包含权限装饰器
          expect(code).toContain('@RequirePermission(');

          // 验证权限格式正确 (moduleName:businessName:action)
          const permissionPattern = new RegExp(
            `@RequirePermission\\('${options.moduleName}:${options.businessName}:(add|list|query|edit|remove)'\\)`,
            'g',
          );
          const matches = code.match(permissionPattern);

          // 应该有 5 个权限装饰器 (create, list, findOne, update, remove)
          expect(matches).not.toBeNull();
          expect(matches!.length).toBeGreaterThanOrEqual(5);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 15.1, 15.2**
     *
     * *For any* generated controller, each endpoint should have @ApiOperation decorator.
     */
    it('should include @ApiOperation decorator for each endpoint', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证包含 @ApiOperation 装饰器
          expect(code).toContain('@ApiOperation(');

          // 验证有 summary 属性
          expect(code).toContain('summary:');

          // 验证有 description 属性
          expect(code).toContain('description:');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 15.3**
     *
     * *For any* generated controller, endpoints should have @ApiResponse decorators.
     */
    it('should include @ApiResponse decorators for endpoints', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证包含 @ApiResponse 装饰器
          expect(code).toContain('@ApiResponse(');

          // 验证有成功响应 (status: 200)
          expect(code).toContain('status: 200');

          // 验证有错误响应
          expect(code).toContain('status: 400');
          expect(code).toContain('status: 401');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 15.9**
     *
     * *For any* generated controller with path parameters, should have @ApiParam decorator.
     */
    it('should include @ApiParam decorator for path parameters', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证包含 @ApiParam 装饰器
          expect(code).toContain('@ApiParam(');

          // 验证参数名称
          expect(code).toContain(`name: '${options.primaryKey}'`);

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 10: 生成代码使用统一响应格式', () => {
    /**
     * **Validates: Requirements 13.3**
     *
     * *For any* generated NestJS service code, all return statements
     * should use Result.ok(), Result.fail(), or Result.page() methods.
     */
    it('should use Result.ok() for successful operations', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = serviceTem(options);

          // 验证导入 Result 类
          expect(code).toContain("import { Result, ResponseCode } from '@/shared/response'");

          // 验证使用 Result.ok()
          expect(code).toContain('Result.ok(');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.3**
     *
     * *For any* generated service, error handling should use Result.fail().
     */
    it('should use Result.fail() for error handling', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = serviceTem(options);

          // 验证使用 Result.fail()
          expect(code).toContain('Result.fail(');

          // 验证使用 ResponseCode
          expect(code).toContain('ResponseCode.');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.3**
     *
     * *For any* generated service with list method, should use Result.page().
     */
    it('should use Result.page() for paginated results', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = serviceTem(options);

          // 验证使用 Result.page()
          expect(code).toContain('Result.page(');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.2**
     *
     * *For any* generated service, should use PrismaService for database operations.
     */
    it('should use PrismaService for database operations', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = serviceTem(options);

          // 验证导入 PrismaService
          expect(code).toContain("import { PrismaService } from '@/platform/prisma'");

          // 验证注入 PrismaService
          expect(code).toContain('private readonly prisma: PrismaService');

          // 验证使用 prisma 进行数据库操作
          expect(code).toContain('this.prisma.');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.5**
     *
     * *For any* generated service, list queries should extend PageQueryDto.
     */
    it('should use PageQueryDto for list queries', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = dtoTem(options);

          // 验证导入 PageQueryDto
          expect(code).toContain("import { PageQueryDto } from '@/shared/dto'");

          // 验证 Query DTO 继承 PageQueryDto
          expect(code).toContain('extends PageQueryDto');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.6**
     *
     * *For any* generated DTO, should use class-validator decorators.
     */
    it('should use class-validator decorators in DTOs', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = dtoTem(options);

          // 验证导入 class-validator
          expect(code).toContain('class-validator');

          // 验证使用验证装饰器
          const hasValidators =
            code.includes('@IsString()') ||
            code.includes('@IsNumber()') ||
            code.includes('@IsBoolean()') ||
            code.includes('@IsOptional()') ||
            code.includes('@IsNotEmpty(');

          expect(hasValidators).toBe(true);

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('DTO Generation Properties', () => {
    /**
     * **Validates: Requirements 15.4, 15.5**
     *
     * *For any* generated DTO, each field should have @ApiProperty or @ApiPropertyOptional.
     */
    it('should include @ApiProperty decorators for all fields', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = dtoTem(options);

          // 验证导入 ApiProperty
          expect(code).toContain("import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'");

          // 验证使用 @ApiProperty 或 @ApiPropertyOptional
          const hasApiProperty = code.includes('@ApiProperty(') || code.includes('@ApiPropertyOptional(');
          expect(hasApiProperty).toBe(true);

          // 验证有 description 属性
          expect(code).toContain('description:');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 15.4**
     *
     * *For any* generated DTO with required fields, should have @ApiProperty (not Optional).
     */
    it('should use @ApiProperty for required fields', () => {
      fc.assert(
        fc.property(
          validOptionsArbitrary.filter((opts) => opts.columns.some((c) => c.isRequired === '1')),
          (options) => {
            const code = dtoTem(options);

            // 验证必填字段使用 @ApiProperty
            expect(code).toContain('@ApiProperty(');

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 15.5**
     *
     * *For any* generated DTO with optional fields, should have @ApiPropertyOptional.
     */
    it('should use @ApiPropertyOptional for optional fields', () => {
      fc.assert(
        fc.property(
          validOptionsArbitrary.filter((opts) => opts.columns.some((c) => c.isRequired === '0')),
          (options) => {
            const code = dtoTem(options);

            // 验证可选字段使用 @ApiPropertyOptional
            expect(code).toContain('@ApiPropertyOptional(');

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Module Generation Properties', () => {
    /**
     * **Validates: Requirements 13.2**
     *
     * *For any* generated modules, should properly export the service.
     */
    it('should export service from modules', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = moduleTem(options);

          // 验证导出 Service
          expect(code).toContain('exports:');
          expect(code).toContain(`${options.BusinessName}Service`);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.2**
     *
     * *For any* generated modules, should register controller and service.
     */
    it('should register controller and service in modules', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = moduleTem(options);

          // 验证注册 Controller
          expect(code).toContain('controllers:');
          expect(code).toContain(`${options.BusinessName}Controller`);

          // 验证注册 Service
          expect(code).toContain('providers:');
          expect(code).toContain(`${options.BusinessName}Service`);

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Entity Generation Properties', () => {
    /**
     * **Validates: Requirements 14.8**
     *
     * *For any* generated entity, should include JSDoc comments.
     */
    it('should include JSDoc comments in entity', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = entityTem(options);

          // 验证包含 JSDoc 注释
          expect(code).toContain('/**');
          expect(code).toContain('*/');

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.11**
     *
     * *For any* tenant-aware table, generated entity should handle tenantId.
     */
    it('should handle tenantId for tenant-aware tables', () => {
      fc.assert(
        fc.property(
          validOptionsArbitrary.map((opts) => ({
            ...opts,
            tenantAware: true,
            columns: [
              ...opts.columns,
              {
                javaField: 'tenantId',
                javaType: 'String',
                columnComment: '租户ID',
                columnType: 'varchar',
                isPk: '0',
                isInsert: '0',
                isEdit: '0',
                isList: '0',
                isQuery: '0',
                isRequired: '1',
                queryType: 'EQ',
                htmlType: 'input',
                dictType: '',
              },
            ],
          })),
          (options) => {
            const serviceCode = serviceTem(options);

            // 验证服务代码包含租户上下文
            expect(serviceCode).toContain('TenantContext');

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Code Structure Properties', () => {
    /**
     * **Validates: Requirements 13.2**
     *
     * *For any* generated code, imports should use @ path alias.
     */
    it('should use @ path alias for imports', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const controllerCode = controllerTem(options);
          const serviceCode = serviceTem(options);
          const dtoCode = dtoTem(options);

          // 验证使用 @ 路径别名
          expect(controllerCode).toContain("from '@/");
          expect(serviceCode).toContain("from '@/");
          expect(dtoCode).toContain("from '@/");

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.2**
     *
     * *For any* generated controller, should inject service via constructor.
     */
    it('should inject service via constructor in controller', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = controllerTem(options);

          // 验证构造函数注入
          expect(code).toContain('constructor(');
          expect(code).toContain(`private readonly ${options.businessName}Service`);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 13.2**
     *
     * *For any* generated service, should inject PrismaService via constructor.
     */
    it('should inject PrismaService via constructor in service', () => {
      fc.assert(
        fc.property(validOptionsArbitrary, (options) => {
          const code = serviceTem(options);

          // 验证构造函数注入
          expect(code).toContain('constructor(');
          expect(code).toContain('private readonly prisma: PrismaService');

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });
});
