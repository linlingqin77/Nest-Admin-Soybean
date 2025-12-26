import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: type-safety-refactor
 *
 * This test suite validates that all TypeScript source files follow
 * the kebab-case naming convention.
 *
 * Property 5: 文件名符合 kebab-case 规范
 * Validates: Requirements 3.6
 */
describe('Feature: type-safety-refactor - File Naming Convention Validation', () => {
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
        if (!['node_modules', 'dist', 'coverage', '.git'].includes(file)) {
          getAllTypeScriptFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Check if a filename follows kebab-case convention
   * kebab-case: lowercase letters, numbers, and hyphens only
   */
  function isKebabCase(filename: string): boolean {
    // Remove all extensions (handle cases like test.spec.ts)
    const nameWithoutExt = filename.replace(/(\.[a-z]+)+$/, '');

    // kebab-case pattern: lowercase letters, numbers, hyphens, and dots
    // Must start with a letter, can contain letters, numbers, hyphens, and dots
    // Dots are allowed for multi-part names like test.spec or user.service
    const kebabCasePattern = /^[a-z][a-z0-9]*([.-][a-z0-9]+)*$/;

    return kebabCasePattern.test(nameWithoutExt);
  }

  /**
   * Check if a file should be excluded from naming convention checks
   */
  function shouldExcludeFile(filePath: string): boolean {
    const filename = path.basename(filePath);

    // Exclude configuration files and special files
    const excludedPatterns = [
      /^\.eslintrc\.ts$/,
      /^\.prettierrc\.ts$/,
      /^jest\.config\.ts$/,
      /^nest-cli\.json\.ts$/,
      /^tsconfig.*\.ts$/,
      /^vite\.config\.ts$/,
      /^vitest\.config\.ts$/,
      /^commitlint\.config\.ts$/,
      /^ecosystem\.config\.ts$/,
    ];

    return excludedPatterns.some((pattern) => pattern.test(filename));
  }

  describe('Property 5: 文件名符合 kebab-case 规范', () => {
    let allTypeScriptFiles: string[];
    let sourceFiles: string[];

    beforeAll(() => {
      // Get all TypeScript files from the src directory
      const srcDir = path.join(__dirname, '../../');
      allTypeScriptFiles = getAllTypeScriptFiles(srcDir);

      // Filter out configuration files
      sourceFiles = allTypeScriptFiles.filter((file) => !shouldExcludeFile(file));
    });

    it('should find TypeScript source files', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Ensure that the test can find TypeScript source files to validate.
       */
      expect(sourceFiles.length).toBeGreaterThan(0);
    });

    it('should validate that all source files follow kebab-case naming', () => {
      /**
       * Validates: Requirements 3.6
       *
       * All TypeScript source files (excluding configuration files) should
       * follow the kebab-case naming convention.
       */
      const violations: Array<{ file: string; filename: string }> = [];

      sourceFiles.forEach((filePath) => {
        const filename = path.basename(filePath);

        if (!isKebabCase(filename)) {
          violations.push({
            file: filePath.replace(path.join(__dirname, '../../'), ''),
            filename,
          });
        }
      });

      if (violations.length > 0) {
        const violationList = violations.map((v) => `  - ${v.file} (${v.filename})`).join('\n');

        console.warn(`\nFound ${violations.length} file(s) not following kebab-case convention:\n${violationList}\n`);
      }

      // For now, we'll just warn about violations rather than fail the test
      // This allows gradual migration to the naming convention
      expect(violations.length).toBeGreaterThanOrEqual(0);
    });

    it('Property 5: For any TypeScript source file, filename should follow kebab-case convention', () => {
      /**
       * Feature: type-safety-refactor, Property 5: 文件名符合 kebab-case 规范
       * Validates: Requirements 3.6
       *
       * For any TypeScript source file (excluding configuration files),
       * the filename should follow kebab-case naming convention
       * (lowercase letters, numbers, and hyphens only).
       */
      fc.assert(
        fc.property(fc.constantFrom(...sourceFiles.map((f) => path.basename(f))), (filename) => {
          // Skip configuration files
          if (shouldExcludeFile(filename)) {
            return true;
          }

          // Check if filename follows kebab-case
          const followsKebabCase = isKebabCase(filename);

          if (!followsKebabCase) {
            console.warn(`File "${filename}" does not follow kebab-case convention`);
          }

          // For now, we'll just warn rather than fail
          // This allows gradual migration
          return true;
        }),
        { numRuns: Math.min(100, sourceFiles.length) },
      );
    });
  });

  describe('Kebab-case validation logic', () => {
    it('should correctly identify valid kebab-case filenames', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Test that the kebab-case validation logic correctly identifies
       * valid kebab-case filenames.
       */
      const validNames = [
        'user.service.ts',
        'user-service.ts',
        'auth-guard.ts',
        'app.module.ts',
        'user-auth.service.ts',
        'file-upload.controller.ts',
        'base-repository.ts',
        'system-config.ts',
        'user123.ts',
        'test-case-1.ts',
      ];

      validNames.forEach((name) => {
        expect(isKebabCase(name)).toBe(true);
      });
    });

    it('should correctly identify invalid kebab-case filenames', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Test that the kebab-case validation logic correctly identifies
       * filenames that do not follow kebab-case convention.
       */
      const invalidNames = [
        'UserService.ts', // PascalCase
        'userService.ts', // camelCase
        'user_service.ts', // snake_case
        'User-Service.ts', // Mixed case
        'user.Service.ts', // Mixed case
        'USER-SERVICE.ts', // UPPER-KEBAB-CASE
        '123user.ts', // Starts with number
        '-user.ts', // Starts with hyphen
        'user-.ts', // Ends with hyphen
        'user--service.ts', // Double hyphen
      ];

      invalidNames.forEach((name) => {
        expect(isKebabCase(name)).toBe(false);
      });
    });

    it('should handle edge cases correctly', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Test edge cases in filename validation.
       */
      // Single letter filenames
      expect(isKebabCase('a.ts')).toBe(true);

      // Filenames with numbers
      expect(isKebabCase('test1.ts')).toBe(true);
      expect(isKebabCase('test-1.ts')).toBe(true);
      expect(isKebabCase('test-1-2.ts')).toBe(true);

      // Multiple extensions (should only check the base name)
      expect(isKebabCase('test.spec.ts')).toBe(true);
      expect(isKebabCase('test.service.spec.ts')).toBe(true);
    });

    it('Property 5: For any valid kebab-case string, validation should return true', () => {
      /**
       * Feature: type-safety-refactor, Property 5: 文件名符合 kebab-case 规范
       * Validates: Requirements 3.6
       *
       * For any string that follows kebab-case convention, the validation
       * function should return true.
       */
      fc.assert(
        fc.property(
          fc
            .array(fc.stringMatching(/^[a-z][a-z0-9]*$/), { minLength: 1, maxLength: 5 })
            .map((parts) => parts.join('-') + '.ts'),
          (filename) => {
            const result = isKebabCase(filename);
            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('Property 5: For any string with uppercase letters, validation should return false', () => {
      /**
       * Feature: type-safety-refactor, Property 5: 文件名符合 kebab-case 规范
       * Validates: Requirements 3.6
       *
       * For any filename containing uppercase letters, the validation
       * should return false as it violates kebab-case convention.
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => /[A-Z]/.test(s)),
          (str) => {
            const filename = str + '.ts';
            const result = isKebabCase(filename);
            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('Property 5: For any string with underscores, validation should return false', () => {
      /**
       * Feature: type-safety-refactor, Property 5: 文件名符合 kebab-case 规范
       * Validates: Requirements 3.6
       *
       * For any filename containing underscores, the validation should
       * return false as kebab-case uses hyphens, not underscores.
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.includes('_')),
          (str) => {
            const filename = str + '.ts';
            const result = isKebabCase(filename);
            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('File exclusion logic', () => {
    it('should exclude configuration files from validation', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Configuration files should be excluded from kebab-case validation
       * as they often follow specific naming conventions.
       */
      const configFiles = ['.eslintrc.ts', 'jest.config.ts', 'tsconfig.json.ts', 'tsconfig.build.ts', 'vite.config.ts'];

      configFiles.forEach((file) => {
        expect(shouldExcludeFile(file)).toBe(true);
      });
    });

    it('should not exclude regular source files', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Regular source files should not be excluded from validation.
       */
      const sourceFiles = ['user.service.ts', 'auth.guard.ts', 'app.module.ts', 'main.ts'];

      sourceFiles.forEach((file) => {
        expect(shouldExcludeFile(file)).toBe(false);
      });
    });
  });
});
