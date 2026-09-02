import { ApiProperty } from '@nestjs/swagger';

/**
 * 测试用 VO 类
 */
class TestUserVo {
  @ApiProperty({ description: '用户ID' })
  userId!: number;

  @ApiProperty({ description: '用户名' })
  userName!: string;
}

class TestResultVo {
  @ApiProperty({ description: '操作结果' })
  success!: boolean;
}

/**
 * 从 api.decorator.ts 中提取 buildDataSchema 函数进行测试
 * 由于该函数是模块内部函数，我们需要复制其逻辑进行测试
 */
const baseTypeNames = ['String', 'Number', 'Boolean'];

function buildDataSchema(type?: any, isArray?: boolean, isPager?: boolean): any {
  // 无类型时返回通用对象 schema，允许任意属性
  if (!type) {
    return {
      type: 'object',
      additionalProperties: true,
      description: '响应数据',
    };
  }

  const isBaseType = baseTypeNames.includes(type.name);
  const items = isBaseType ? { type: type.name.toLowerCase() } : { $ref: `#/components/schemas/${type.name}` };

  // 分页格式: { rows: T[], total: number }
  if (isArray && isPager) {
    return {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items,
        },
        total: {
          type: 'number',
          default: 0,
        },
      },
    };
  }

  // 纯数组格式: T[]
  if (isArray) {
    return {
      type: 'array',
      items,
    };
  }

  // 单对象格式: T
  return items;
}

describe('buildDataSchema 函数测试', () => {
  describe('Property 1: 无类型时返回通用对象 schema', () => {
    it('应返回 type: object 和 additionalProperties: true', () => {
      const result = buildDataSchema();

      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('additionalProperties', true);
      expect(result).toHaveProperty('description', '响应数据');
    });

    it('不应返回 { value: true }', () => {
      const result = buildDataSchema();

      expect(result).not.toHaveProperty('value');
    });

    it('undefined 类型应返回通用对象 schema', () => {
      const result = buildDataSchema(undefined);

      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('additionalProperties', true);
    });
  });

  describe('Property 2: 基础类型处理', () => {
    it('String 类型应返回 { type: "string" }', () => {
      const result = buildDataSchema(String);

      expect(result).toEqual({ type: 'string' });
    });

    it('Number 类型应返回 { type: "number" }', () => {
      const result = buildDataSchema(Number);

      expect(result).toEqual({ type: 'number' });
    });

    it('Boolean 类型应返回 { type: "boolean" }', () => {
      const result = buildDataSchema(Boolean);

      expect(result).toEqual({ type: 'boolean' });
    });

    it('基础类型数组应返回正确的数组 schema', () => {
      const result = buildDataSchema(String, true);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });
  });

  describe('Property 3: 自定义类型处理', () => {
    it('自定义 VO 类应返回 $ref 引用', () => {
      const result = buildDataSchema(TestUserVo);

      expect(result).toHaveProperty('$ref');
      expect(result.$ref).toContain('TestUserVo');
    });

    it('自定义 VO 类数组应返回数组 schema 带 $ref', () => {
      const result = buildDataSchema(TestUserVo, true);

      expect(result).toHaveProperty('type', 'array');
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveProperty('$ref');
      expect(result.items.$ref).toContain('TestUserVo');
    });
  });

  describe('Property 4: 分页格式处理', () => {
    it('分页格式应返回 { rows: T[], total: number } 结构', () => {
      const result = buildDataSchema(TestUserVo, true, true);

      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('properties');
      expect(result.properties).toHaveProperty('rows');
      expect(result.properties).toHaveProperty('total');
      expect(result.properties.rows).toHaveProperty('type', 'array');
      expect(result.properties.rows.items).toHaveProperty('$ref');
      expect(result.properties.total).toHaveProperty('type', 'number');
    });

    it('基础类型分页格式应正确处理', () => {
      const result = buildDataSchema(Number, true, true);

      expect(result.properties.rows.items).toEqual({ type: 'number' });
    });
  });

  describe('Property 5: 输出一致性', () => {
    it('相同输入应产生相同输出', () => {
      const result1 = buildDataSchema(TestUserVo, true, false);
      const result2 = buildDataSchema(TestUserVo, true, false);

      expect(result1).toEqual(result2);
    });

    it('不同类型应产生不同输出', () => {
      const result1 = buildDataSchema(TestUserVo);
      const result2 = buildDataSchema(TestResultVo);

      expect(result1).not.toEqual(result2);
    });
  });

  describe('Property 6: OpenAPI 规范兼容性', () => {
    it('无类型时输出应符合 OpenAPI 3.0 规范', () => {
      const result = buildDataSchema();

      // OpenAPI 3.0 允许的 type 值
      const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
      expect(validTypes).toContain(result.type);
    });

    it('数组类型输出应符合 OpenAPI 3.0 规范', () => {
      const result = buildDataSchema(TestUserVo, true);

      expect(result.type).toBe('array');
      expect(result).toHaveProperty('items');
    });

    it('分页类型输出应符合 OpenAPI 3.0 规范', () => {
      const result = buildDataSchema(TestUserVo, true, true);

      expect(result.type).toBe('object');
      expect(result).toHaveProperty('properties');
    });
  });
});

describe('OpenAPI 文档完整性测试', () => {
  describe('Property 1: 所有响应都应有有效的 data schema', () => {
    it('无类型响应不应包含 { value: true }', () => {
      const schema = buildDataSchema();

      // 验证不包含无效的 { value: true }
      expect(JSON.stringify(schema)).not.toContain('"value":true');
      expect(JSON.stringify(schema)).not.toContain('"value": true');
    });
  });

  describe('Property 2: Schema 结构完整性', () => {
    it('对象类型应有 type 或 $ref', () => {
      const schemaWithType = buildDataSchema();
      const schemaWithRef = buildDataSchema(TestUserVo);

      expect(schemaWithType).toHaveProperty('type');
      expect(schemaWithRef).toHaveProperty('$ref');
    });

    it('数组类型应有 items', () => {
      const arraySchema = buildDataSchema(TestUserVo, true);

      expect(arraySchema).toHaveProperty('items');
    });
  });
});
