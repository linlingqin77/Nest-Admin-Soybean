/**
 * 代码生成器性能测试
 *
 * Requirements: 16.1, 16.2, 16.3
 * - 单表生成时间 < 2秒
 * - 10 表批量生成时间 < 10秒
 * - 100 列表处理性能
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PreviewService } from '@/modules/tools/preview/preview.service';
import { FieldInferenceService } from '@/modules/tools/inference/field-inference.service';
import { index as templateIndex } from '@/modules/tools/template/index';
import { GenTable, GenTableColumn } from '@prisma/client';

describe('Code Generator Performance Tests', () => {
  let previewService: PreviewService;
  let fieldInferenceService: FieldInferenceService;

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [PreviewService, FieldInferenceService],
    }).compile();

    previewService = modules.get<PreviewService>(PreviewService);
    fieldInferenceService = modules.get<FieldInferenceService>(FieldInferenceService);
  });

  /**
   * 创建模拟的表配置
   */
  function createMockTable(tableName: string, columnCount: number): any {
    const columns: GenTableColumn[] = [];

    // 添加主键列
    columns.push({
      columnId: 1,
      tableId: 1,
      columnName: 'id',
      columnComment: '主键ID',
      columnType: 'bigint',
      javaType: 'Long',
      javaField: 'id',
      isPk: '1',
      isIncrement: '1',
      isRequired: '0',
      isInsert: '0',
      isEdit: '1',
      isList: '1',
      isQuery: '1',
      queryType: 'EQ',
      htmlType: 'input',
      dictType: '',
      columnDefault: null,
      sort: 0,
      status: '0',
      delFlag: '0',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    });

    // 添加其他列
    for (let i = 2; i <= columnCount; i++) {
      const columnTypes = ['varchar', 'int', 'datetime', 'text', 'decimal'];
      const htmlTypes = ['input', 'select', 'datetime', 'textarea', 'radio'];
      const queryTypes = ['EQ', 'LIKE', 'BETWEEN', 'NE', 'GT'];

      columns.push({
        columnId: i,
        tableId: 1,
        columnName: `column_${i}`,
        columnComment: `字段${i}`,
        columnType: columnTypes[(i - 2) % columnTypes.length],
        javaType: 'String',
        javaField: `column${i}`,
        isPk: '0',
        isIncrement: '0',
        isRequired: i % 3 === 0 ? '1' : '0',
        isInsert: '1',
        isEdit: '1',
        isList: i % 2 === 0 ? '1' : '0',
        isQuery: i % 4 === 0 ? '1' : '0',
        queryType: queryTypes[(i - 2) % queryTypes.length],
        htmlType: htmlTypes[(i - 2) % htmlTypes.length],
        dictType: i % 5 === 0 ? 'sys_normal_disable' : '',
        columnDefault: null,
        sort: i,
        status: '0',
        delFlag: '0',
        createBy: 'admin',
        createTime: new Date(),
        updateBy: 'admin',
        updateTime: new Date(),
        remark: null,
      });
    }

    const businessName = tableName.replace(/^sys_/, '').replace(/_/g, '');

    return {
      tableId: 1,
      tableName,
      tableComment: `${tableName} 表`,
      subTableName: null,
      subTableFkName: null,
      className: businessName.charAt(0).toUpperCase() + businessName.slice(1),
      tplCategory: 'crud',
      tplWebType: 'element-plus',
      packageName: 'com.example',
      moduleName: 'system',
      businessName,
      functionName: `${tableName} 管理`,
      functionAuthor: 'admin',
      genType: '0',
      genPath: '/',
      options: '',
      status: '0',
      delFlag: '0',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
      columns,
      BusinessName: businessName.charAt(0).toUpperCase() + businessName.slice(1),
      primaryKey: 'id',
    };
  }

  describe('Requirement 16.1: 单表生成时间 < 2秒', () => {
    it('should generate code for a single table with 20 columns within 2 seconds', () => {
      const table = createMockTable('sys_user', 20);

      const startTime = performance.now();

      // 执行代码生成
      const templateOutput = templateIndex(table);
      const previewResponse = previewService.createPreviewResponse(templateOutput, table.BusinessName);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证生成结果
      expect(previewResponse.files.length).toBeGreaterThan(0);
      expect(previewResponse.totalFiles).toBeGreaterThan(0);

      // 验证性能要求：< 2000ms
      expect(duration).toBeLessThan(2000);

      console.log(`单表生成时间 (20列): ${duration.toFixed(2)}ms`);
    });

    it('should generate code for a single table with 50 columns within 2 seconds', () => {
      const table = createMockTable('sys_complex_table', 50);

      const startTime = performance.now();

      const templateOutput = templateIndex(table);
      const previewResponse = previewService.createPreviewResponse(templateOutput, table.BusinessName);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(previewResponse.files.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2000);

      console.log(`单表生成时间 (50列): ${duration.toFixed(2)}ms`);
    });
  });

  describe('Requirement 16.2: 10 表批量生成时间 < 10秒', () => {
    it('should generate code for 10 tables within 10 seconds', () => {
      const tables = Array.from({ length: 10 }, (_, i) => createMockTable(`sys_table_${i + 1}`, 15));

      const startTime = performance.now();

      // 批量生成代码
      const results = tables.map((table) => {
        const templateOutput = templateIndex(table);
        return previewService.createPreviewResponse(templateOutput, table.BusinessName);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证所有表都生成成功
      expect(results.length).toBe(10);
      results.forEach((result) => {
        expect(result.files.length).toBeGreaterThan(0);
      });

      // 验证性能要求：< 10000ms
      expect(duration).toBeLessThan(10000);

      console.log(`10表批量生成时间: ${duration.toFixed(2)}ms`);
      console.log(`平均每表生成时间: ${(duration / 10).toFixed(2)}ms`);
    });

    it('should generate code for 10 tables with varying column counts within 10 seconds', () => {
      const tables = Array.from(
        { length: 10 },
        (_, i) => createMockTable(`sys_varied_table_${i + 1}`, 10 + i * 5), // 10, 15, 20, ..., 55 列
      );

      const startTime = performance.now();

      const results = tables.map((table) => {
        const templateOutput = templateIndex(table);
        return previewService.createPreviewResponse(templateOutput, table.BusinessName);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBe(10);
      expect(duration).toBeLessThan(10000);

      console.log(`10表批量生成时间 (变化列数): ${duration.toFixed(2)}ms`);
    });
  });

  describe('Requirement 16.3: 100 列表处理性能', () => {
    it('should handle a table with 100 columns without performance degradation', () => {
      const table = createMockTable('sys_large_table', 100);

      const startTime = performance.now();

      const templateOutput = templateIndex(table);
      const previewResponse = previewService.createPreviewResponse(templateOutput, table.BusinessName);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证生成结果
      expect(previewResponse.files.length).toBeGreaterThan(0);
      expect(previewResponse.totalFiles).toBeGreaterThan(0);

      // 100列的表生成时间应该在合理范围内（< 3秒）
      expect(duration).toBeLessThan(3000);

      console.log(`100列表生成时间: ${duration.toFixed(2)}ms`);
      console.log(`生成文件数: ${previewResponse.totalFiles}`);
      console.log(`总行数: ${previewResponse.totalLines}`);
      console.log(`总大小: ${previewResponse.totalSize} bytes`);
    });

    it('should infer fields for 100 columns efficiently', () => {
      // 创建100个模拟的数据库列
      const dbColumns = Array.from({ length: 100 }, (_, i) => ({
        columnName: `column_${i + 1}`,
        columnType: ['varchar', 'int', 'datetime', 'text', 'decimal'][i % 5],
        columnComment: `字段${i + 1}`,
        isPk: i === 0 ? '1' : '0',
        isIncrement: i === 0 ? '1' : '0',
        isRequired: i % 3 === 0 ? '1' : '0',
        columnDefault: null,
      }));

      const startTime = performance.now();

      // 执行字段推断
      const inferredColumns = dbColumns.map((col) => fieldInferenceService.inferColumn(col as any));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证推断结果
      expect(inferredColumns.length).toBe(100);
      inferredColumns.forEach((col) => {
        expect(col.htmlType).toBeDefined();
        expect(col.javaType).toBeDefined();
      });

      // 字段推断应该非常快（< 100ms）
      expect(duration).toBeLessThan(100);

      console.log(`100列字段推断时间: ${duration.toFixed(2)}ms`);
    });

    it('should build file tree for many files efficiently', () => {
      // 创建大量文件用于测试文件树构建
      const files = Array.from({ length: 100 }, (_, i) => ({
        name: `file_${i + 1}.ts`,
        path: `src/modules/table_${Math.floor(i / 10)}/file_${i + 1}.ts`,
        content: `// File ${i + 1}\nexport const value = ${i};`,
        language: 'typescript',
        size: 50,
        lineCount: 2,
      }));

      const startTime = performance.now();

      const fileTree = previewService.buildFileTreeV2(files);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证文件树
      expect(fileTree.length).toBeGreaterThan(0);

      // 文件树构建应该很快（< 50ms）
      expect(duration).toBeLessThan(50);

      console.log(`100文件树构建时间: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory issues when generating code for multiple large tables', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 生成20个大表的代码
      const tables = Array.from({ length: 20 }, (_, i) => createMockTable(`sys_memory_test_${i + 1}`, 50));

      const results = tables.map((table) => {
        const templateOutput = templateIndex(table);
        return previewService.createPreviewResponse(templateOutput, table.BusinessName);
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(results.length).toBe(20);

      // 内存增长应该在合理范围内（< 100MB）
      expect(memoryIncrease).toBeLessThan(100);

      console.log(`内存增长: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('Concurrent Generation Performance', () => {
    it('should handle concurrent code generation requests', async () => {
      const tables = Array.from({ length: 5 }, (_, i) => createMockTable(`sys_concurrent_${i + 1}`, 20));

      const startTime = performance.now();

      // 并发生成代码
      const promises = tables.map(
        (table) =>
          new Promise<{ files: any[]; totalFiles: number }>((resolve) => {
            const templateOutput = templateIndex(table);
            const result = previewService.createPreviewResponse(templateOutput, table.BusinessName);
            resolve(result);
          }),
      );

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证所有结果
      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(result.files.length).toBeGreaterThan(0);
      });

      // 并发生成应该比串行更快或相当
      expect(duration).toBeLessThan(5000);

      console.log(`5表并发生成时间: ${duration.toFixed(2)}ms`);
    });
  });
});
