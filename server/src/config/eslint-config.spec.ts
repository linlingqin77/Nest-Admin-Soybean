import * as fc from 'fast-check';
import * as path from 'path';

/**
 * Feature: type-safety-refactor
 *
 * This test suite validates that the ESLint configuration contains
 * the required rules to enforce type safety and code standards.
 *
 * Property 1: ESLint 配置包含禁止 any 规则
 * Property 2: ESLint 配置包含禁止 console 规则
 * Validates: Requirements 1.6, 2.4, 7.1, 7.2
 */
describe('Feature: type-safety-refactor - ESLint Configuration Validation', () => {
  let eslintConfig: any;
  let eslintConfigPath: string;

  beforeAll(() => {
    // Read the ESLint configuration file
    eslintConfigPath = path.join(__dirname, '../../.eslintrc.js');

    // Delete require cache to ensure fresh load
    delete require.cache[require.resolve(eslintConfigPath)];

    // Load the ESLint configuration
    eslintConfig = require(eslintConfigPath);
  });

  describe('Property 1: ESLint 配置包含禁止 any 规则', () => {
    it('should have @typescript-eslint/no-explicit-any rule defined', () => {
      /**
       * Validates: Requirements 1.6, 7.1
       *
       * The ESLint configuration must contain the @typescript-eslint/no-explicit-any
       * rule to prevent the use of 'any' type in the codebase.
       */
      expect(eslintConfig.rules).toBeDefined();
      expect(eslintConfig.rules['@typescript-eslint/no-explicit-any']).toBeDefined();
    });

    it('should set @typescript-eslint/no-explicit-any to error level', () => {
      /**
       * Validates: Requirements 1.6, 7.1
       *
       * The @typescript-eslint/no-explicit-any rule must be set to 'error' level
       * to enforce strict type checking.
       */
      const rule = eslintConfig.rules['@typescript-eslint/no-explicit-any'];

      // Rule can be 'error', 2, or an array starting with 'error' or 2
      const isError = rule === 'error' || rule === 2 || (Array.isArray(rule) && (rule[0] === 'error' || rule[0] === 2));

      expect(isError).toBe(true);
    });

    it('Property 1: For any ESLint config file, it should contain no-explicit-any rule at error level', () => {
      /**
       * Feature: type-safety-refactor, Property 1: ESLint 配置包含禁止 any 规则
       * Validates: Requirements 1.6, 7.1
       *
       * For any ESLint configuration file, the @typescript-eslint/no-explicit-any
       * rule should be present and set to error level.
       */
      fc.assert(
        fc.property(fc.constantFrom(eslintConfig), (config) => {
          // Verify the rule exists
          expect(config.rules).toBeDefined();
          expect(config.rules['@typescript-eslint/no-explicit-any']).toBeDefined();

          // Verify it's set to error level
          const rule = config.rules['@typescript-eslint/no-explicit-any'];
          const isError =
            rule === 'error' || rule === 2 || (Array.isArray(rule) && (rule[0] === 'error' || rule[0] === 2));

          expect(isError).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2: ESLint 配置包含禁止 console 规则', () => {
    it('should have no-console rule defined', () => {
      /**
       * Validates: Requirements 2.4, 7.2
       *
       * The ESLint configuration must contain the no-console rule
       * to prevent the use of console.log/error/warn in the codebase.
       */
      expect(eslintConfig.rules).toBeDefined();
      expect(eslintConfig.rules['no-console']).toBeDefined();
    });

    it('should set no-console to error level', () => {
      /**
       * Validates: Requirements 2.4, 7.2
       *
       * The no-console rule must be set to 'error' level to enforce
       * the use of proper logging mechanisms.
       */
      const rule = eslintConfig.rules['no-console'];

      // Rule can be 'error', 2, or an array starting with 'error' or 2
      const isError = rule === 'error' || rule === 2 || (Array.isArray(rule) && (rule[0] === 'error' || rule[0] === 2));

      expect(isError).toBe(true);
    });

    it('Property 2: For any ESLint config file, it should contain no-console rule at error level', () => {
      /**
       * Feature: type-safety-refactor, Property 2: ESLint 配置包含禁止 console 规则
       * Validates: Requirements 2.4, 7.2
       *
       * For any ESLint configuration file, the no-console rule should be
       * present and set to error level.
       */
      fc.assert(
        fc.property(fc.constantFrom(eslintConfig), (config) => {
          // Verify the rule exists
          expect(config.rules).toBeDefined();
          expect(config.rules['no-console']).toBeDefined();

          // Verify it's set to error level
          const rule = config.rules['no-console'];
          const isError =
            rule === 'error' || rule === 2 || (Array.isArray(rule) && (rule[0] === 'error' || rule[0] === 2));

          expect(isError).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Additional ESLint configuration validation', () => {
    it('should have TypeScript parser configured', () => {
      /**
       * Validates: Requirements 7.1, 7.2
       *
       * The ESLint configuration should use @typescript-eslint/parser
       * to properly parse TypeScript code.
       */
      expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
    });

    it('should have TypeScript ESLint plugin configured', () => {
      /**
       * Validates: Requirements 7.1, 7.2
       *
       * The ESLint configuration should include @typescript-eslint/eslint-plugin
       * to enable TypeScript-specific linting rules.
       */
      expect(eslintConfig.plugins).toBeDefined();
      expect(eslintConfig.plugins).toContain('@typescript-eslint/eslint-plugin');
    });

    it('should extend recommended TypeScript ESLint configurations', () => {
      /**
       * Validates: Requirements 7.1, 7.2
       *
       * The ESLint configuration should extend recommended TypeScript
       * configurations for comprehensive type checking.
       */
      expect(eslintConfig.extends).toBeDefined();
      expect(Array.isArray(eslintConfig.extends)).toBe(true);

      const hasRecommended = eslintConfig.extends.some((ext: string) => ext.includes('@typescript-eslint/recommended'));

      expect(hasRecommended).toBe(true);
    });

    it('should have explicit function return type rule configured', () => {
      /**
       * Validates: Requirements 1.5, 7.1
       *
       * The ESLint configuration should enforce explicit function return types
       * to improve type safety.
       */
      expect(eslintConfig.rules['@typescript-eslint/explicit-function-return-type']).toBeDefined();
    });

    it('should have naming convention rules configured', () => {
      /**
       * Validates: Requirements 7.3
       *
       * The ESLint configuration should enforce naming conventions
       * for consistent code style.
       */
      expect(eslintConfig.rules['@typescript-eslint/naming-convention']).toBeDefined();
    });

    it('should have no-unused-vars rule configured', () => {
      /**
       * Validates: Requirements 7.1
       *
       * The ESLint configuration should detect and prevent unused variables
       * to maintain clean code.
       */
      expect(eslintConfig.rules['@typescript-eslint/no-unused-vars']).toBeDefined();
    });
  });

  describe('Configuration file integrity', () => {
    it('should be a valid JavaScript module', () => {
      /**
       * Validates: Requirements 7.1, 7.2
       *
       * The ESLint configuration file should be a valid JavaScript module
       * that can be loaded by ESLint.
       */
      expect(eslintConfig).toBeDefined();
      expect(typeof eslintConfig).toBe('object');
    });

    it('should have rules object defined', () => {
      /**
       * Validates: Requirements 7.1, 7.2
       *
       * The ESLint configuration must have a rules object to define
       * linting rules.
       */
      expect(eslintConfig.rules).toBeDefined();
      expect(typeof eslintConfig.rules).toBe('object');
    });

    it('should have parser options configured for TypeScript', () => {
      /**
       * Validates: Requirements 7.1, 7.2
       *
       * The ESLint configuration should have proper parser options
       * for TypeScript project.
       */
      expect(eslintConfig.parserOptions).toBeDefined();
      expect(eslintConfig.parserOptions.project).toBeDefined();
      expect(eslintConfig.parserOptions.sourceType).toBe('module');
    });
  });
});
