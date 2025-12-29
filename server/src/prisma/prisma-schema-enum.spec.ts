import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: type-safety-refactor
 *
 * This test suite validates that the Prisma schema uses enum types
 * for status and delFlag fields instead of String types.
 *
 * Property 6: Prisma Schema 状态字段使用枚举
 * Property 7: Prisma Schema delFlag 字段使用枚举
 * Validates: Requirements 4.1, 4.2, 4.3
 */
describe('Feature: type-safety-refactor - Prisma Schema Enum Validation', () => {
  let schemaContent: string;

  beforeAll(() => {
    // Read the Prisma schema file
    const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
    schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  });

  describe('Property 6: Prisma Schema 状态字段使用枚举', () => {
    it('should define Status enum in schema', () => {
      // Validates: Requirements 4.1, 4.3

      // Check that Status enum is defined
      const statusEnumRegex = /enum\s+Status\s*\{[^}]*NORMAL[^}]*DISABLED[^}]*\}/s;
      expect(schemaContent).toMatch(statusEnumRegex);

      // Check that Status enum has @map directives
      expect(schemaContent).toMatch(/NORMAL\s+@map\("0"\)/);
      expect(schemaContent).toMatch(/DISABLED\s+@map\("1"\)/);
    });

    it('should use Status enum type for all status fields in models', () => {
      // Validates: Requirements 4.1, 4.3

      // Extract all model definitions
      const modelRegex = /model\s+\w+\s*\{[^}]*\}/gs;
      const models = schemaContent.match(modelRegex) || [];

      // For each model that has a status field, verify it uses Status enum
      const modelsWithStatus = models.filter((model) => /\bstatus\s+/i.test(model));

      expect(modelsWithStatus.length).toBeGreaterThan(0);

      modelsWithStatus.forEach((model) => {
        // Extract model name for better error messages
        const modelNameMatch = model.match(/model\s+(\w+)/);
        const modelName = modelNameMatch ? modelNameMatch[1] : 'Unknown';

        // Check that status field uses Status enum type, not String
        const statusFieldRegex = /\bstatus\s+(Status)(?:\s+|\?)/;
        const stringStatusRegex = /\bstatus\s+(String)(?:\s+|\?)/;

        expect(model).toMatch(statusFieldRegex);
        expect(model).not.toMatch(stringStatusRegex);
      });
    });

    it('Property 6: For any model with status field, it should use Status enum type', () => {
      /**
       * Feature: type-safety-refactor, Property 6: Prisma Schema 状态字段使用枚举
       * Validates: Requirements 4.1, 4.3
       *
       * For any Prisma Schema model with a status field,
       * the field should use Status enum type rather than String type.
       */
      fc.assert(
        fc.property(fc.constantFrom(...extractModelsWithField(schemaContent, 'status')), (modelContent) => {
          // Verify the status field uses Status enum, not String
          const hasStatusEnum = /\bstatus\s+Status(?:\s+|\?|@)/.test(modelContent);
          const hasStatusString = /\bstatus\s+String(?:\s+|\?|@)/.test(modelContent);

          expect(hasStatusEnum).toBe(true);
          expect(hasStatusString).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 7: Prisma Schema delFlag 字段使用枚举', () => {
    it('should define DelFlag enum in schema', () => {
      // Validates: Requirements 4.1, 4.2

      // Check that DelFlag enum is defined
      const delFlagEnumRegex = /enum\s+DelFlag\s*\{[^}]*NORMAL[^}]*DELETED[^}]*\}/s;
      expect(schemaContent).toMatch(delFlagEnumRegex);

      // Check that DelFlag enum has @map directives
      expect(schemaContent).toMatch(/NORMAL\s+@map\("0"\)/);
      expect(schemaContent).toMatch(/DELETED\s+@map\("1"\)/);
    });

    it('should use DelFlag enum type for all delFlag fields in models', () => {
      // Validates: Requirements 4.1, 4.2

      // Extract all model definitions
      const modelRegex = /model\s+\w+\s*\{[^}]*\}/gs;
      const models = schemaContent.match(modelRegex) || [];

      // For each model that has a delFlag field, verify it uses DelFlag enum
      const modelsWithDelFlag = models.filter((model) => /\bdel_?[Ff]lag\s+/i.test(model));

      expect(modelsWithDelFlag.length).toBeGreaterThan(0);

      modelsWithDelFlag.forEach((model) => {
        // Extract model name for better error messages
        const modelNameMatch = model.match(/model\s+(\w+)/);
        const modelName = modelNameMatch ? modelNameMatch[1] : 'Unknown';

        // Check that delFlag field uses DelFlag enum type, not String
        const delFlagFieldRegex = /\bdelFlag\s+(DelFlag)(?:\s+|\?)/;
        const stringDelFlagRegex = /\bdelFlag\s+(String)(?:\s+|\?)/;

        expect(model).toMatch(delFlagFieldRegex);
        expect(model).not.toMatch(stringDelFlagRegex);
      });
    });

    it('Property 7: For any model with delFlag field, it should use DelFlag enum type', () => {
      /**
       * Feature: type-safety-refactor, Property 7: Prisma Schema delFlag 字段使用枚举
       * Validates: Requirements 4.1, 4.2
       *
       * For any Prisma Schema model with a delFlag field,
       * the field should use DelFlag enum type rather than String type.
       */
      fc.assert(
        fc.property(fc.constantFrom(...extractModelsWithField(schemaContent, 'delFlag')), (modelContent) => {
          // Verify the delFlag field uses DelFlag enum, not String
          const hasDelFlagEnum = /\bdelFlag\s+DelFlag(?:\s+|\?|@)/.test(modelContent);
          const hasDelFlagString = /\bdelFlag\s+String(?:\s+|\?|@)/.test(modelContent);

          expect(hasDelFlagEnum).toBe(true);
          expect(hasDelFlagString).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Enum mapping validation', () => {
    it('should map Status.NORMAL to "0" and Status.DISABLED to "1"', () => {
      // Validates: Requirements 4.3

      // Verify the enum values map to the correct database values
      const statusEnumMatch = schemaContent.match(/enum\s+Status\s*\{([^}]*)\}/s);
      expect(statusEnumMatch).toBeTruthy();

      const statusEnumContent = statusEnumMatch![1];
      expect(statusEnumContent).toMatch(/NORMAL\s+@map\("0"\)/);
      expect(statusEnumContent).toMatch(/DISABLED\s+@map\("1"\)/);
    });

    it('should map DelFlag.NORMAL to "0" and DelFlag.DELETED to "1"', () => {
      // Validates: Requirements 4.2

      // Verify the enum values map to the correct database values
      const delFlagEnumMatch = schemaContent.match(/enum\s+DelFlag\s*\{([^}]*)\}/s);
      expect(delFlagEnumMatch).toBeTruthy();

      const delFlagEnumContent = delFlagEnumMatch![1];
      expect(delFlagEnumContent).toMatch(/NORMAL\s+@map\("0"\)/);
      expect(delFlagEnumContent).toMatch(/DELETED\s+@map\("1"\)/);
    });
  });
});

/**
 * Helper function to extract all models that contain a specific field
 */
function extractModelsWithField(schemaContent: string, fieldName: string): string[] {
  const modelRegex = /model\s+\w+\s*\{[^}]*\}/gs;
  const models = schemaContent.match(modelRegex) || [];

  // Filter models that have the specified field
  const modelsWithField = models.filter((model) => {
    const fieldRegex = new RegExp(`\\b${fieldName}\\s+`, 'i');
    return fieldRegex.test(model);
  });

  // Ensure we have at least one model to test
  if (modelsWithField.length === 0) {
    throw new Error(`No models found with field: ${fieldName}`);
  }

  return modelsWithField;
}
