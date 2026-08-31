/**
 * 字段推断服务属性测试
 *
 * Property 3: 字段推断规则一致性
 * Property 4: 主键字段排除
 * Property 5: NOT NULL 约束推断
 * **Validates: Requirements 3.1-3.9**
 */
import * as fc from 'fast-check';
import { FieldInferenceService, IInferredColumn } from '@/modules/tools/inference/field-inference.service';
import { DbColumnDto } from '@/modules/tools/datasource/dto';
import { GenConstants } from '@/shared/constants/gen.constant';
import { Test, TestingModule } from '@nestjs/testing';

describe('FieldInferenceService - Property Tests', () => {
  let service: FieldInferenceService;

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [FieldInferenceService],
    }).compile();

    service = modules.get<FieldInferenceService>(FieldInferenceService);
  });

  /**
   * 生成随机数据库列信息的 Arbitrary
   */
  const dbColumnArbitrary = (overrides: Partial<DbColumnDto> = {}): fc.Arbitrary<DbColumnDto> => {
    return fc
      .record({
        columnName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
        columnComment: fc.string({ minLength: 0, maxLength: 100 }),
        columnType: fc.constantFrom('varchar', 'int', 'bigint', 'text', 'datetime', 'timestamp', 'boolean', 'decimal'),
        isPrimaryKey: fc.boolean(),
        isAutoIncrement: fc.boolean(),
        isNullable: fc.boolean(),
        defaultValue: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
        maxLength: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
      })
      .map((col) => ({ ...col, ...overrides }));
  };

  describe('Property 3: 字段推断规则一致性', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * *For any* column with name containing 'status',
     * the htmlType should be set to 'radio'.
     */
    it('should set htmlType to radio for columns containing "status"', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary().map((col) => ({
            ...col,
            columnName: `${col.columnName}_status`,
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_RADIO;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.2**
     *
     * *For any* column with name containing 'type',
     * the htmlType should be set to 'select'.
     */
    it('should set htmlType to select for columns containing "type"', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary().map((col) => ({
            ...col,
            columnName: `user_type`,
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_SELECT;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.2**
     *
     * *For any* column with name containing 'sex',
     * the htmlType should be set to 'select'.
     */
    it('should set htmlType to select for columns containing "sex"', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary().map((col) => ({
            ...col,
            columnName: `user_sex`,
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_SELECT;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.3**
     *
     * *For any* column with name containing 'time' or 'date',
     * the htmlType should be 'datetime' and javaType should be 'Date'.
     */
    it('should set datetime for columns containing "time" or "date"', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('create_time', 'update_time', 'birth_date', 'start_date'),
          dbColumnArbitrary(),
          (columnName, baseColumn) => {
            const column = { ...baseColumn, columnName };
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_DATETIME && inferred.javaType === GenConstants.TYPE_DATE;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.4**
     *
     * *For any* column with name containing 'image' or 'avatar',
     * the htmlType should be 'imageUpload'.
     */
    it('should set imageUpload for columns containing "image" or "avatar"', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('user_image', 'profile_avatar', 'cover_image', 'avatar_url'),
          dbColumnArbitrary(),
          (columnName, baseColumn) => {
            const column = { ...baseColumn, columnName };
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_IMAGE_UPLOAD;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.5**
     *
     * *For any* column with name containing 'file',
     * the htmlType should be 'fileUpload'.
     */
    it('should set fileUpload for columns containing "file"', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary().map((col) => ({
            ...col,
            columnName: `attachment_file`,
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_FILE_UPLOAD;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.6**
     *
     * *For any* column with name containing 'content',
     * the htmlType should be 'editor'.
     */
    it('should set editor for columns containing "content"', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary().map((col) => ({
            ...col,
            columnName: `article_content`,
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_EDITOR;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.6**
     *
     * *For any* column with name containing 'remark',
     * the htmlType should be 'textarea'.
     */
    it('should set textarea for columns containing "remark"', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary().map((col) => ({
            ...col,
            columnName: `user_remark`,
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.htmlType === GenConstants.HTML_TEXTAREA;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.7**
     *
     * *For any* column with name containing 'name',
     * the queryType should be 'LIKE'.
     */
    it('should set queryType to LIKE for columns containing "name"', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('user_name', 'nick_name', 'product_name', 'company_name'),
          dbColumnArbitrary(),
          (columnName, baseColumn) => {
            const column = { ...baseColumn, columnName };
            const inferred = service.inferColumn(column);
            return inferred.queryType === GenConstants.QUERY_LIKE;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 4: 主键字段排除', () => {
    /**
     * **Validates: Requirements 3.8**
     *
     * *For any* column that is a primary key with auto-increment,
     * the isInsert flag should be '0' (excluded from insert forms).
     */
    it('should exclude auto-increment primary key from insert forms', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary({
            isPrimaryKey: true,
            isAutoIncrement: true,
          }),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.isInsert === GenConstants.NOT_REQUIRE;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.8**
     *
     * *For any* column that is a primary key with auto-increment,
     * the isEdit, isQuery, and isList flags should be '1'.
     */
    it('should include auto-increment primary key in edit, query, and list', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary({
            isPrimaryKey: true,
            isAutoIncrement: true,
          }),
          (column) => {
            const inferred = service.inferColumn(column);
            return (
              inferred.isEdit === GenConstants.REQUIRE &&
              inferred.isQuery === GenConstants.REQUIRE &&
              inferred.isList === GenConstants.REQUIRE
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.8**
     *
     * *For any* column that is NOT a primary key,
     * the isInsert flag should be '1' (included in insert forms).
     */
    it('should include non-primary key columns in insert forms', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary({
            isPrimaryKey: false,
          }).filter((col) => {
            // 排除系统字段
            const systemColumns = ['create_by', 'create_time', 'update_by', 'update_time', 'del_flag'];
            return !systemColumns.some((sys) => col.columnName.toLowerCase().includes(sys.replace('_', '')));
          }),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.isInsert === GenConstants.REQUIRE;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 5: NOT NULL 约束推断', () => {
    /**
     * **Validates: Requirements 3.9**
     *
     * *For any* column with NOT NULL constraint and no default value,
     * the isRequired flag should be '1'.
     */
    it('should set isRequired to 1 for NOT NULL columns without default', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary({
            isNullable: false,
            defaultValue: undefined,
          }),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.isRequired === GenConstants.REQUIRE;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.9**
     *
     * *For any* column that is nullable,
     * the isRequired flag should be '0'.
     */
    it('should set isRequired to 0 for nullable columns', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary({
            isNullable: true,
          }),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.isRequired === GenConstants.NOT_REQUIRE;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 3.9**
     *
     * *For any* column with NOT NULL constraint but has a default value,
     * the isRequired flag should be '0'.
     */
    it('should set isRequired to 0 for NOT NULL columns with default value', () => {
      fc.assert(
        fc.property(
          dbColumnArbitrary({
            isNullable: false,
          }).map((col) => ({
            ...col,
            defaultValue: 'some_default_value',
          })),
          (column) => {
            const inferred = service.inferColumn(column);
            return inferred.isRequired === GenConstants.NOT_REQUIRE;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Additional Properties: 字段名转换', () => {
    /**
     * *For any* column name in snake_case,
     * the javaField should be in camelCase.
     */
    it('should convert snake_case column names to camelCase javaField', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('user_name', 'create_time', 'is_deleted', 'order_status', 'product_category_id'),
          dbColumnArbitrary(),
          (columnName, baseColumn) => {
            const column = { ...baseColumn, columnName };
            const inferred = service.inferColumn(column);

            // 验证 javaField 是驼峰命名
            const expectedCamelCase = columnName
              .toLowerCase()
              .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

            return inferred.javaField === expectedCamelCase;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Additional Properties: 批量推断', () => {
    /**
     * *For any* list of columns,
     * inferColumns should return the same number of inferred columns.
     */
    it('should return same number of inferred columns as input', () => {
      fc.assert(
        fc.property(fc.array(dbColumnArbitrary(), { minLength: 0, maxLength: 20 }), (columns) => {
          const inferred = service.inferColumns(columns);
          return inferred.length === columns.length;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * *For any* list of columns,
     * each inferred column should have all required properties.
     */
    it('should produce complete inferred columns with all required properties', () => {
      fc.assert(
        fc.property(fc.array(dbColumnArbitrary(), { minLength: 1, maxLength: 10 }), (columns) => {
          const inferred = service.inferColumns(columns);

          return inferred.every((col) => {
            return (
              typeof col.columnName === 'string' &&
              typeof col.columnComment === 'string' &&
              typeof col.columnType === 'string' &&
              typeof col.javaField === 'string' &&
              typeof col.javaType === 'string' &&
              typeof col.htmlType === 'string' &&
              typeof col.dictType === 'string' &&
              typeof col.queryType === 'string' &&
              typeof col.isPk === 'string' &&
              typeof col.isIncrement === 'string' &&
              typeof col.isRequired === 'string' &&
              typeof col.isInsert === 'string' &&
              typeof col.isEdit === 'string' &&
              typeof col.isList === 'string' &&
              typeof col.isQuery === 'string'
            );
          });
        }),
        { numRuns: 100 },
      );
    });
  });
});
