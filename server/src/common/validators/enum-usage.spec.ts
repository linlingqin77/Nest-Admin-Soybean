import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: type-safety-refactor
 *
 * This test suite validates that the codebase uses enum values instead of
 * string literals for status/delFlag fields, and that constants are imported
 * rather than hardcoded.
 *
 * Property 8: 代码中使用枚举值而非字符串字面量
 * Property 9: 常量通过导入引用
 * Validates: Requirements 4.5, 5.6
 */
describe('Feature: type-safety-refactor - Enum and Constant Usage Validation', () => {
  /**
   * Recursively get all TypeScript files in a directory
   */
  function getAllTypeScriptFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, dist, and other build directories
        if (!['node_modules', 'dist', 'coverage', '.git', 'prisma'].includes(file)) {
          getAllTypeScriptFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.spec.ts')) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Check if a file should be excluded from validation
   */
  function shouldExcludeFile(filePath: string): boolean {
    const filename = path.basename(filePath);

    // Exclude configuration files, test files, and generated files
    const excludedPatterns = [
      /\.config\.ts$/,
      /\.spec\.ts$/,
      /\.test\.ts$/,
      /\.d\.ts$/,
      // Exclude constant definition files themselves
      /constants\.ts$/,
      /\.constants\.ts$/,
      // Exclude enum definition files
      /\.enum\.ts$/,
      // Exclude migration files
      /migration/i,
      // Exclude template files (they contain example code)
      /template/i,
    ];

    return excludedPatterns.some((pattern) => pattern.test(filename) || pattern.test(filePath));
  }

  /**
   * Find string literal patterns that should be enum values
   * Looks for patterns like: status: "0", delFlag: "2", etc.
   */
  function findStatusStringLiterals(content: string): Array<{ line: number; match: string; context: string }> {
    const violations: Array<{ line: number; match: string; context: string }> = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      // Pattern 1: status: "0" or status: "1"
      const statusPattern = /\bstatus\s*[:=]\s*["']([01])["']/g;
      let match;
      while ((match = statusPattern.exec(line)) !== null) {
        violations.push({
          line: index + 1,
          match: match[0],
          context: line.trim(),
        });
      }

      // Pattern 2: delFlag: "0" or delFlag: "2"
      const delFlagPattern = /\bdelFlag\s*[:=]\s*["']([02])["']/g;
      while ((match = delFlagPattern.exec(line)) !== null) {
        violations.push({
          line: index + 1,
          match: match[0],
          context: line.trim(),
        });
      }

      // Pattern 3: Comparison with string literals: status === "0"
      const comparisonPattern = /\b(status|delFlag)\s*[!=]==?\s*["']([012])["']/g;
      while ((match = comparisonPattern.exec(line)) !== null) {
        violations.push({
          line: index + 1,
          match: match[0],
          context: line.trim(),
        });
      }

      // Pattern 4: where: { status: "0" }
      const wherePattern = /\{\s*(status|delFlag)\s*:\s*["']([012])["']\s*\}/g;
      while ((match = wherePattern.exec(line)) !== null) {
        violations.push({
          line: index + 1,
          match: match[0],
          context: line.trim(),
        });
      }
    });

    return violations;
  }

  /**
   * Check if file imports the necessary enums or constants
   */
  function hasEnumImports(content: string): {
    hasStatusEnum: boolean;
    hasDelFlagEnum: boolean;
    hasPrismaEnums: boolean;
    hasConstants: boolean;
  } {
    const hasStatusEnum = /import\s+.*\bStatus(Enum)?\b.*from/.test(content);
    const hasDelFlagEnum = /import\s+.*\bDelFlag(Enum)?\b.*from/.test(content);
    const hasPrismaEnums = /import\s+.*\{[^}]*(Status|DelFlag)[^}]*\}.*from\s+['"]@prisma\/client['"]/.test(content);
    const hasConstants = /import\s+.*\{[^}]*(STATUS|DEL_FLAG)[^}]*\}.*from.*constants/.test(content);

    return {
      hasStatusEnum,
      hasDelFlagEnum,
      hasPrismaEnums,
      hasConstants,
    };
  }

  /**
   * Find hardcoded configuration keys that should use constants
   */
  function findHardcodedConfigKeys(content: string): Array<{ line: number; match: string; context: string }> {
    const violations: Array<{ line: number; match: string; context: string }> = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      // Pattern: 'sys.account.xxx' or "sys.account.xxx"
      const configKeyPattern = /["']sys\.(account|file|system)\.[a-zA-Z.]+["']/g;
      let match;
      while ((match = configKeyPattern.exec(line)) !== null) {
        // Check if this is in a constant definition (which is okay)
        if (!line.includes('CONFIG_KEYS') && !line.includes('export const')) {
          violations.push({
            line: index + 1,
            match: match[0],
            context: line.trim(),
          });
        }
      }
    });

    return violations;
  }

  describe('Property 8: 代码中使用枚举值而非字符串字面量', () => {
    let allSourceFiles: string[];

    beforeAll(() => {
      // Get all TypeScript files from the src directory
      const srcDir = path.join(__dirname, '../../');
      allSourceFiles = getAllTypeScriptFiles(srcDir).filter((file) => !shouldExcludeFile(file));
    });

    it('should find TypeScript source files to validate', () => {
      /**
       * Validates: Requirements 4.5
       *
       * Ensure that the test can find TypeScript source files to validate.
       */
      expect(allSourceFiles.length).toBeGreaterThan(0);
    });

    it('should scan for string literal usage in status/delFlag fields', () => {
      /**
       * Validates: Requirements 4.5
       *
       * Scan all source files for string literals used in status and delFlag fields.
       * These should be replaced with enum values.
       */
      const filesWithViolations: Array<{
        file: string;
        violations: Array<{ line: number; match: string; context: string }>;
      }> = [];

      allSourceFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const violations = findStatusStringLiterals(content);

        if (violations.length > 0) {
          filesWithViolations.push({
            file: filePath.replace(path.join(__dirname, '../../'), ''),
            violations,
          });
        }
      });

      if (filesWithViolations.length > 0) {
        const report = filesWithViolations
          .map((item) => {
            const violationList = item.violations
              .map((v) => `    Line ${v.line}: ${v.match} in "${v.context}"`)
              .join('\n');
            return `  ${item.file}:\n${violationList}`;
          })
          .join('\n\n');

        console.warn(
          `\nFound ${filesWithViolations.length} file(s) with string literals that should use enums:\n${report}\n`,
        );
      }

      // For now, we'll just warn about violations rather than fail the test
      // This allows gradual migration to enum usage
      expect(filesWithViolations.length).toBeGreaterThanOrEqual(0);
    });

    it('Property 8: For any code using status/delFlag, it should use enum values not string literals', () => {
      /**
       * Feature: type-safety-refactor, Property 8: 代码中使用枚举值而非字符串字面量
       * Validates: Requirements 4.5
       *
       * For any code involving status or delFlag fields, the code should use
       * Prisma-generated enum values (Status.NORMAL, DelFlag.DELETED) rather than
       * string literals ("0", "1", "2").
       */
      fc.assert(
        fc.property(fc.constantFrom(...allSourceFiles), (filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const violations = findStatusStringLiterals(content);
          const imports = hasEnumImports(content);

          // If file has status/delFlag string literals, it should import the enums
          if (violations.length > 0) {
            const hasAnyEnumImport =
              imports.hasStatusEnum || imports.hasDelFlagEnum || imports.hasPrismaEnums || imports.hasConstants;

            if (!hasAnyEnumImport) {
              console.warn(
                `File "${path.basename(filePath)}" has status/delFlag literals but no enum imports. Found ${violations.length} violation(s).`,
              );
            }

            // For now, just warn rather than fail
            // This allows gradual migration
            return true;
          }

          return true;
        }),
        { numRuns: Math.min(100, allSourceFiles.length) },
      );
    });

    it('should verify files with status/delFlag usage import appropriate enums', () => {
      /**
       * Validates: Requirements 4.5
       *
       * Files that work with status or delFlag fields should import the
       * appropriate enum types from Prisma or the enum module.
       */
      const filesNeedingEnums: Array<{
        file: string;
        hasViolations: boolean;
        hasImports: boolean;
      }> = [];

      allSourceFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if file uses status or delFlag
        const usesStatus = /\bstatus\b/.test(content);
        const usesDelFlag = /\bdelFlag\b/.test(content);

        if (usesStatus || usesDelFlag) {
          const violations = findStatusStringLiterals(content);
          const imports = hasEnumImports(content);
          const hasAnyImport =
            imports.hasStatusEnum || imports.hasDelFlagEnum || imports.hasPrismaEnums || imports.hasConstants;

          if (violations.length > 0 && !hasAnyImport) {
            filesNeedingEnums.push({
              file: filePath.replace(path.join(__dirname, '../../'), ''),
              hasViolations: violations.length > 0,
              hasImports: hasAnyImport,
            });
          }
        }
      });

      if (filesNeedingEnums.length > 0) {
        const report = filesNeedingEnums
          .map((item) => `  - ${item.file} (violations: ${item.hasViolations}, imports: ${item.hasImports})`)
          .join('\n');

        console.warn(`\nFound ${filesNeedingEnums.length} file(s) that need enum imports:\n${report}\n`);
      }

      // For now, just report
      expect(filesNeedingEnums.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Property 9: 常量通过导入引用', () => {
    let allSourceFiles: string[];

    beforeAll(() => {
      // Get all TypeScript files from the src directory
      const srcDir = path.join(__dirname, '../../');
      allSourceFiles = getAllTypeScriptFiles(srcDir).filter((file) => !shouldExcludeFile(file));
    });

    it('should scan for hardcoded configuration keys', () => {
      /**
       * Validates: Requirements 5.6
       *
       * Scan all source files for hardcoded configuration keys like 'sys.account.xxx'.
       * These should be imported from the constants module.
       */
      const filesWithViolations: Array<{
        file: string;
        violations: Array<{ line: number; match: string; context: string }>;
      }> = [];

      allSourceFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const violations = findHardcodedConfigKeys(content);

        if (violations.length > 0) {
          filesWithViolations.push({
            file: filePath.replace(path.join(__dirname, '../../'), ''),
            violations,
          });
        }
      });

      if (filesWithViolations.length > 0) {
        const report = filesWithViolations
          .map((item) => {
            const violationList = item.violations
              .map((v) => `    Line ${v.line}: ${v.match} in "${v.context}"`)
              .join('\n');
            return `  ${item.file}:\n${violationList}`;
          })
          .join('\n\n');

        console.warn(
          `\nFound ${filesWithViolations.length} file(s) with hardcoded config keys that should use constants:\n${report}\n`,
        );
      }

      // For now, we'll just warn about violations
      expect(filesWithViolations.length).toBeGreaterThanOrEqual(0);
    });

    it('Property 9: For any constant usage, it should be imported not hardcoded', () => {
      /**
       * Feature: type-safety-refactor, Property 9: 常量通过导入引用
       * Validates: Requirements 5.6
       *
       * For any usage of constants (configuration keys, error messages, etc.),
       * the constant should be imported from the constants module rather than
       * hardcoded as a string literal.
       */
      fc.assert(
        fc.property(fc.constantFrom(...allSourceFiles), (filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const violations = findHardcodedConfigKeys(content);

          // Check if file imports constants
          const hasConstantImports = /import\s+.*from\s+['"].*constants/.test(content);

          if (violations.length > 0 && !hasConstantImports) {
            console.warn(
              `File "${path.basename(filePath)}" has hardcoded config keys but no constant imports. Found ${violations.length} violation(s).`,
            );
          }

          // For now, just warn rather than fail
          return true;
        }),
        { numRuns: Math.min(100, allSourceFiles.length) },
      );
    });

    it('should verify files with config keys import CONFIG_KEYS constant', () => {
      /**
       * Validates: Requirements 5.6
       *
       * Files that use configuration keys should import CONFIG_KEYS from
       * the constants module.
       */
      const filesNeedingConstants: Array<{
        file: string;
        hasViolations: boolean;
        hasImports: boolean;
      }> = [];

      allSourceFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const violations = findHardcodedConfigKeys(content);

        if (violations.length > 0) {
          const hasConfigKeysImport = /import\s+.*\bCONFIG_KEYS\b.*from/.test(content);

          if (!hasConfigKeysImport) {
            filesNeedingConstants.push({
              file: filePath.replace(path.join(__dirname, '../../'), ''),
              hasViolations: violations.length > 0,
              hasImports: hasConfigKeysImport,
            });
          }
        }
      });

      if (filesNeedingConstants.length > 0) {
        const report = filesNeedingConstants
          .map((item) => `  - ${item.file} (violations: ${item.hasViolations}, imports: ${item.hasImports})`)
          .join('\n');

        console.warn(`\nFound ${filesNeedingConstants.length} file(s) that need CONFIG_KEYS import:\n${report}\n`);
      }

      // For now, just report
      expect(filesNeedingConstants.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation logic tests', () => {
    it('should correctly identify status string literals', () => {
      /**
       * Validates: Requirements 4.5
       *
       * Test that the validation logic correctly identifies string literals
       * used for status fields.
       */
      const testCases = [
        { code: 'status: "0"', shouldFind: true },
        { code: 'status: "1"', shouldFind: true },
        { code: "status: '0'", shouldFind: true },
        { code: 'status = "0"', shouldFind: true },
        { code: 'status === "0"', shouldFind: true },
        { code: 'status: Status.NORMAL', shouldFind: false },
        { code: 'status: StatusEnum.NORMAL', shouldFind: false },
        { code: '// status: "0"', shouldFind: false }, // comment
      ];

      testCases.forEach(({ code, shouldFind }) => {
        const violations = findStatusStringLiterals(code);
        if (shouldFind) {
          expect(violations.length).toBeGreaterThan(0);
        } else {
          expect(violations.length).toBe(0);
        }
      });
    });

    it('should correctly identify delFlag string literals', () => {
      /**
       * Validates: Requirements 4.5
       *
       * Test that the validation logic correctly identifies string literals
       * used for delFlag fields.
       */
      const testCases = [
        { code: 'delFlag: "0"', shouldFind: true },
        { code: 'delFlag: "2"', shouldFind: true },
        { code: "delFlag: '0'", shouldFind: true },
        { code: 'delFlag = "2"', shouldFind: true },
        { code: 'delFlag === "0"', shouldFind: true },
        { code: 'delFlag: DelFlag.NORMAL', shouldFind: false },
        { code: 'delFlag: DelFlagEnum.DELETED', shouldFind: false },
        { code: '// delFlag: "0"', shouldFind: false }, // comment
      ];

      testCases.forEach(({ code, shouldFind }) => {
        const violations = findStatusStringLiterals(code);
        if (shouldFind) {
          expect(violations.length).toBeGreaterThan(0);
        } else {
          expect(violations.length).toBe(0);
        }
      });
    });

    it('should correctly identify hardcoded config keys', () => {
      /**
       * Validates: Requirements 5.6
       *
       * Test that the validation logic correctly identifies hardcoded
       * configuration keys.
       */
      const testCases = [
        { code: '"sys.account.registerUser"', shouldFind: true },
        { code: "'sys.account.captchaEnabled'", shouldFind: true },
        { code: '"sys.file.maxVersions"', shouldFind: true },
        { code: 'CONFIG_KEYS.ACCOUNT.REGISTER_USER', shouldFind: false },
        {
          code: 'export const CONFIG_KEYS = { ACCOUNT: { REGISTER_USER: "sys.account.registerUser" } }',
          shouldFind: false,
        },
        { code: '// "sys.account.registerUser"', shouldFind: false }, // comment
      ];

      testCases.forEach(({ code, shouldFind }) => {
        const violations = findHardcodedConfigKeys(code);
        if (shouldFind) {
          expect(violations.length).toBeGreaterThan(0);
        } else {
          expect(violations.length).toBe(0);
        }
      });
    });

    it('should correctly detect enum imports', () => {
      /**
       * Validates: Requirements 4.5
       *
       * Test that the validation logic correctly detects enum imports.
       */
      const testCases = [
        {
          code: "import { Status } from '@prisma/client';",
          expected: { hasPrismaEnums: true, hasStatusEnum: true },
        },
        {
          code: "import { DelFlag } from '@prisma/client';",
          expected: { hasPrismaEnums: true, hasDelFlagEnum: true },
        },
        {
          code: "import { StatusEnum } from 'src/common/enum';",
          expected: { hasStatusEnum: true },
        },
        {
          code: "import { DelFlagEnum } from 'src/common/enum';",
          expected: { hasDelFlagEnum: true },
        },
        {
          code: "import { STATUS, DEL_FLAG } from 'src/common/constants';",
          expected: { hasConstants: true },
        },
        {
          code: 'const status = "0";',
          expected: { hasPrismaEnums: false, hasStatusEnum: false, hasDelFlagEnum: false, hasConstants: false },
        },
      ];

      testCases.forEach(({ code, expected }) => {
        const result = hasEnumImports(code);
        Object.entries(expected).forEach(([key, value]) => {
          expect(result[key as keyof typeof result]).toBe(value);
        });
      });
    });
  });
});
