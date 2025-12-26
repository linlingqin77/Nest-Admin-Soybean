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
  let sourceFiles: string[];

  beforeAll(() => {
    // Scan all TypeScript source files in the src directory
    const srcDir = path.join(__dirname, '../../');
    sourceFiles = scanTypeScriptFiles(srcDir);
  });

  describe('Property 5: 文件名符合 kebab-case 规范', () => {
    it('should have TypeScript source files to validate', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Ensure we have TypeScript files to validate.
       */
      expect(sourceFiles.length).toBeGreaterThan(0);
    });

    it('should follow kebab-case naming convention for all source files', () => {
      /**
       * Validates: Requirements 3.6
       *
       * All TypeScript source files (excluding configuration files)
       * should follow kebab-case naming convention.
       */
      const violations: string[] = [];

      sourceFiles.forEach((filePath) => {
        const fileName = path.basename(filePath, '.ts');

        // Skip configuration files and special files
        if (isConfigurationFile(fileName)) {
          return;
        }

        // Check if the file name follows kebab-case
        if (!isKebabCase(fileName)) {
          violations.push(filePath);
        }
      });

      if (violations.length > 0) {
        console.error('Files not following kebab-case convention:');
        violations.forEach((file) => console.error(`  - ${file}`));
      }

      expect(violations).toEqual([]);
    });

    it('Property 5: For any TypeScript source file, filename should follow kebab-case', () => {
      /**
       * Feature: type-safety-refactor, Property 5: 文件名符合 kebab-case 规范
       * Validates: Requirements 3.6
       *
       * For any TypeScript source file (excluding configuration files),
       * the filename should follow kebab-case naming convention
       * (lowercase letters, numbers, and hyphens only).
       */
      fc.assert(
        fc.property(fc.constantFrom(...sourceFiles), (filePath) => {
          const fileName = path.basename(filePath, '.ts');

          // Skip configuration files
          if (isConfigurationFile(fileName)) {
            return;
          }

          // Verify the file name follows kebab-case
          const followsKebabCase = isKebabCase(fileName);

          if (!followsKebabCase) {
            console.error(`File does not follow kebab-case: ${filePath}`);
            console.error(`  Expected: ${toKebabCase(fileName)}`);
          }

          expect(followsKebabCase).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Kebab-case validation rules', () => {
    it('should accept valid kebab-case filenames', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Test that the kebab-case validator correctly accepts valid filenames.
       */
      const validNames = [
        'user-service',
        'auth-controller',
        'user-auth-service',
        'app-config',
        'prisma-service',
        'file-upload',
        'user-export-service',
        'system-config',
        'base-repository',
      ];

      validNames.forEach((name) => {
        expect(isKebabCase(name)).toBe(true);
      });
    });

    it('should reject invalid kebab-case filenames', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Test that the kebab-case validator correctly rejects invalid filenames.
       */
      const invalidNames = [
        'UserService', // PascalCase
        'userService', // camelCase
        'user_service', // snake_case
        'User-Service', // Mixed case
        'user.service', // Contains dot (excluding extension)
        'user service', // Contains space
        'user@service', // Contains special character
      ];

      invalidNames.forEach((name) => {
        expect(isKebabCase(name)).toBe(false);
      });
    });

    it('should handle edge cases correctly', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Test edge cases in kebab-case validation.
       */
      // Single word lowercase is valid kebab-case
      expect(isKebabCase('user')).toBe(true);
      expect(isKebabCase('auth')).toBe(true);

      // Numbers are allowed
      expect(isKebabCase('user-v2')).toBe(true);
      expect(isKebabCase('config-2024')).toBe(true);

      // Multiple consecutive hyphens are not valid
      expect(isKebabCase('user--service')).toBe(false);

      // Starting or ending with hyphen is not valid
      expect(isKebabCase('-user-service')).toBe(false);
      expect(isKebabCase('user-service-')).toBe(false);
    });
  });

  describe('Configuration file exclusions', () => {
    it('should exclude common configuration files from validation', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Configuration files and special files should be excluded
       * from kebab-case validation.
       */
      const configFiles = [
        'tsconfig',
        'jest.config',
        'eslintrc',
        'prettierrc',
        'package',
        'package-lock',
        'pnpm-lock',
        'nest-cli',
      ];

      configFiles.forEach((name) => {
        expect(isConfigurationFile(name)).toBe(true);
      });
    });

    it('should not exclude regular source files', () => {
      /**
       * Validates: Requirements 3.6
       *
       * Regular source files should not be excluded from validation.
       */
      const sourceFileNames = ['user-service', 'auth-controller', 'app-module', 'main'];

      sourceFileNames.forEach((name) => {
        expect(isConfigurationFile(name)).toBe(false);
      });
    });
  });
});

/**
 * Recursively scan directory for TypeScript files
 */
function scanTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(currentDir: string): void {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip node_modules, dist, and other build directories
        if (entry.isDirectory()) {
          if (!shouldSkipDirectory(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          // Skip test files and declaration files
          if (!entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors or missing directories
      console.warn(`Warning: Could not scan directory ${currentDir}:`, error);
    }
  }

  scan(dir);
  return files;
}

/**
 * Check if a directory should be skipped during scanning
 */
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = ['node_modules', 'dist', 'build', 'coverage', '.git', '.vscode', '.idea'];
  return skipDirs.includes(dirName);
}

/**
 * Check if a filename is a configuration file that should be excluded
 */
function isConfigurationFile(fileName: string): boolean {
  const configPatterns = [
    'tsconfig',
    'jest.config',
    'eslintrc',
    'prettierrc',
    'package',
    'package-lock',
    'pnpm-lock',
    'nest-cli',
    'vite.config',
    'vitest.config',
    'webpack.config',
    'rollup.config',
  ];

  return configPatterns.some((pattern) => fileName.includes(pattern));
}

/**
 * Check if a string follows kebab-case convention
 * Kebab-case: lowercase letters, numbers, and hyphens only
 * Must not start or end with hyphen
 * Must not have consecutive hyphens
 */
function isKebabCase(str: string): boolean {
  // Kebab-case pattern: lowercase letters and numbers, separated by single hyphens
  const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return kebabCasePattern.test(str);
}

/**
 * Convert a string to kebab-case (for suggestion purposes)
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .replace(/[\s_]+/g, '-') // spaces and underscores to hyphens
    .replace(/[^a-z0-9-]/gi, '') // remove invalid characters
    .toLowerCase()
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // remove leading/trailing hyphens
}
