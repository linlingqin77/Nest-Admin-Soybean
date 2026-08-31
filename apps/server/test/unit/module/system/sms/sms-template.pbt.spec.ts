import * as fc from 'fast-check';
import { SmsTemplateService } from '@/modules/sms/templates/sms-template.service';

/**
 * Property-Based Tests for SMS Template Variable Parsing
 *
 * Feature: tenant-management-enhancement
 * Property 3: 模板变量解析正确性
 * Validates: Requirements 1.3
 *
 * For any template containing variable placeholders and a variable value mapping,
 * the parsed content should replace all placeholders with corresponding values,
 * and should not contain any unreplaced placeholders.
 */
describe('SmsTemplateService Template Parsing Property-Based Tests', () => {
  let service: SmsTemplateService;

  beforeEach(() => {
    // Create a minimal service instance for testing parsing methods
    // These methods are pure functions that don't need dependencies
    service = new SmsTemplateService(null as any, null as any, null as any);
  });

  /**
   * Property 3: 模板变量解析正确性
   *
   * For any template content with variable placeholders and a complete variable mapping,
   * the parsed result should:
   * 1. Replace all placeholders with their corresponding values
   * 2. Not contain any unreplaced placeholders (${...} patterns)
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 3: For any template with complete params, all placeholders should be replaced', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random variable names (alphanumeric, starting with letter)
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          { minLength: 1, maxLength: 5 },
        ),
        // Generate random variable values
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        // Generate random prefix and suffix text
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        async (varNames, varValues, prefix, suffix) => {
          // Ensure we have matching lengths
          const names = [...new Set(varNames)].slice(0, Math.min(varNames.length, varValues.length));
          const values = varValues.slice(0, names.length);

          if (names.length === 0) {
            return true; // Skip if no valid variable names
          }

          // Build template content with placeholders
          const placeholders = names.map((name) => `\${${name}}`).join(' ');
          const template = `${prefix}${placeholders}${suffix}`;

          // Build params object
          const params: Record<string, string> = {};
          names.forEach((name, index) => {
            params[name] = values[index];
          });

          // Parse the template
          const result = service.parseTemplateContent(template, params);

          // Property 1: Result should not contain any unreplaced placeholders
          const hasUnreplacedPlaceholders = /\$\{[a-zA-Z][a-zA-Z0-9]*\}/.test(result);

          // Property 2: All values should appear in the result
          const allValuesPresent = values.every((value) => result.includes(value));

          // Property 3: Prefix and suffix should be preserved
          const prefixPreserved = prefix === '' || result.startsWith(prefix);
          const suffixPreserved = suffix === '' || result.endsWith(suffix);

          return !hasUnreplacedPlaceholders && allValuesPresent && prefixPreserved && suffixPreserved;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3b: Partial params should only replace provided variables
   *
   * For any template with some variables not provided in params,
   * only the provided variables should be replaced, and unprovided
   * variables should remain as placeholders.
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 3b: For any template with partial params, only provided variables should be replaced', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate variable names for provided params
        fc.array(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          { minLength: 1, maxLength: 3 },
        ),
        // Generate variable names for unprovided params
        fc.array(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          { minLength: 1, maxLength: 3 },
        ),
        // Generate values for provided params
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
        async (providedNames, unprovidedNames, providedValues) => {
          // Ensure unique names and no overlap
          const provided = [...new Set(providedNames)].slice(0, Math.min(providedNames.length, providedValues.length));
          const unprovided = [...new Set(unprovidedNames)].filter((n) => !provided.includes(n));

          if (provided.length === 0 || unprovided.length === 0) {
            return true; // Skip if no valid test case
          }

          const values = providedValues.slice(0, provided.length);

          // Build template with both provided and unprovided variables
          const allPlaceholders = [...provided, ...unprovided].map((name) => `\${${name}}`).join(' ');
          const template = `Template: ${allPlaceholders}`;

          // Build params with only provided variables
          const params: Record<string, string> = {};
          provided.forEach((name, index) => {
            params[name] = values[index];
          });

          // Parse the template
          const result = service.parseTemplateContent(template, params);

          // Property 1: Provided variables should be replaced
          const providedReplaced = values.every((value) => result.includes(value));

          // Property 2: Unprovided variables should remain as placeholders
          const unprovidedRemain = unprovided.every((name) => result.includes(`\${${name}}`));

          return providedReplaced && unprovidedRemain;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3c: Empty params should return original template
   *
   * For any template with empty or null params,
   * the original template should be returned unchanged.
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 3c: For any template with empty params, original template should be returned', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random template content
        fc.string({ minLength: 1, maxLength: 200 }),
        async (template) => {
          // Test with empty object
          const result1 = service.parseTemplateContent(template, {});

          // Test with null/undefined (cast to satisfy type)
          const result2 = service.parseTemplateContent(template, null as any);
          const result3 = service.parseTemplateContent(template, undefined as any);

          // Property: Original template should be returned unchanged
          return result1 === template && result2 === template && result3 === template;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3d: Extract params should find all unique variable names
   *
   * For any template with variable placeholders,
   * extractTemplateParams should return all unique variable names.
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 3d: For any template, extractTemplateParams should find all unique variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random variable names
        fc.array(
          fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          { minLength: 1, maxLength: 10 },
        ),
        // Generate random text between placeholders
        fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
        async (varNames, textParts) => {
          const uniqueNames = [...new Set(varNames)];

          if (uniqueNames.length === 0) {
            return true; // Skip if no valid variable names
          }

          // Build template with placeholders and text
          let template = '';
          uniqueNames.forEach((name, index) => {
            template += (textParts[index] || '') + `\${${name}}`;
          });
          template += textParts[uniqueNames.length] || '';

          // Extract params
          const extractedParams = service.extractTemplateParams(template);

          // Property 1: Should find all unique variable names
          const allFound = uniqueNames.every((name) => extractedParams.includes(name));

          // Property 2: Should not have duplicates
          const noDuplicates = extractedParams.length === new Set(extractedParams).size;

          // Property 3: Count should match unique names
          const countMatches = extractedParams.length === uniqueNames.length;

          return allFound && noDuplicates && countMatches;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3e: Validate params should identify missing variables
   *
   * For any template and partial params,
   * validateTemplateParams should return the missing variable names.
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 3e: For any template with partial params, validateTemplateParams should identify missing variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate all variable names in template
        fc.array(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          { minLength: 2, maxLength: 6 },
        ),
        // Generate which variables to provide (as indices)
        fc.array(fc.boolean(), { minLength: 2, maxLength: 6 }),
        async (allNames, provideFlags) => {
          const uniqueNames = [...new Set(allNames)];

          if (uniqueNames.length < 2) {
            return true; // Need at least 2 variables for meaningful test
          }

          // Determine which variables to provide
          const provided: string[] = [];
          const missing: string[] = [];
          uniqueNames.forEach((name, index) => {
            if (provideFlags[index % provideFlags.length]) {
              provided.push(name);
            } else {
              missing.push(name);
            }
          });

          // Ensure we have both provided and missing
          if (provided.length === 0 || missing.length === 0) {
            return true; // Skip if all provided or all missing
          }

          // Build template
          const template = uniqueNames.map((name) => `\${${name}}`).join(' ');

          // Build params
          const params: Record<string, string> = {};
          provided.forEach((name) => {
            params[name] = 'value';
          });

          // Validate params
          const missingParams = service.validateTemplateParams(template, params);

          // Property 1: Should identify all missing variables
          const allMissingFound = missing.every((name) => missingParams.includes(name));

          // Property 2: Should not include provided variables
          const noProvidedIncluded = provided.every((name) => !missingParams.includes(name));

          // Property 3: Count should match missing count
          const countMatches = missingParams.length === missing.length;

          return allMissingFound && noProvidedIncluded && countMatches;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3f: Round-trip property - extract then provide all params
   *
   * For any template, if we extract all params and provide values for all of them,
   * the parsed result should have no unreplaced placeholders.
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 3f: For any template, extracting and providing all params should result in complete replacement', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random variable names
        fc.array(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          { minLength: 1, maxLength: 5 },
        ),
        // Generate random values
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        // Generate random surrounding text
        fc.string({ minLength: 0, maxLength: 50 }),
        async (varNames, values, surroundingText) => {
          const uniqueNames = [...new Set(varNames)];

          if (uniqueNames.length === 0) {
            return true;
          }

          // Build template
          const template = surroundingText + uniqueNames.map((name) => `\${${name}}`).join(' ') + surroundingText;

          // Extract params
          const extractedParams = service.extractTemplateParams(template);

          // Provide values for all extracted params
          const params: Record<string, string> = {};
          extractedParams.forEach((name, index) => {
            params[name] = values[index % values.length] || 'default';
          });

          // Validate - should have no missing params
          const missingParams = service.validateTemplateParams(template, params);

          // Parse - should have no unreplaced placeholders
          const result = service.parseTemplateContent(template, params);
          const hasUnreplacedPlaceholders = /\$\{[a-zA-Z][a-zA-Z0-9]*\}/.test(result);

          // Property: Complete round-trip should result in no missing params and no unreplaced placeholders
          return missingParams.length === 0 && !hasUnreplacedPlaceholders;
        },
      ),
      { numRuns: 100 },
    );
  });
});
