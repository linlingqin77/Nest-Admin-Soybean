# Console Usage Report

Generated: 2025-12-26
Updated: 2025-12-26 (After Replacement)

## Summary

Total console calls found: 27
Total console calls replaced: 21
Total console calls with eslint-disable (justified): 6

### Status After Replacement

✅ **Services**: All console calls replaced with AppLogger (21 occurrences in config-example.service.ts)
✅ **Controllers**: No console calls found
✅ **Middleware/Interceptors**: No console calls found
⚠️ **Decorators**: 3 console calls remain with eslint-disable (justified - no DI available)
⚠️ **Utilities**: 2 console calls remain with eslint-disable (justified - no DI available)
✅ **Main Bootstrap**: Already using Logger

### Remaining Console Calls (Justified)

All remaining console calls have been marked with `eslint-disable-next-line no-console` and include justification comments explaining why they cannot use AppLogger:

1. **system-cache.decorator.ts** (3 occurrences)
   - Decorators cannot use dependency injection
   - Non-critical cache errors that should not block execution
   - Lines: 65, 77, 131

2. **utils/index.ts** (1 occurrence)
   - Utility function without DI context
   - Data integrity warning for debugging
   - Line: 55

3. **utils/export.ts** (1 occurrence)
   - Utility function without DI context
   - Critical error preventing file export
   - Line: 123

4. **config-example.service.ts** (1 occurrence)
   - Deprecated decorator function
   - Cannot access instance logger in decorator context
   - Line: 178

### Breakdown by Type
- `console.warn`: 5 occurrences
- `console.error`: 1 occurrence
- `console.log`: 21 occurrences

### Breakdown by Location

#### 1. Decorators (3 occurrences)
**File**: `server/src/common/decorators/system-cache.decorator.ts`
- Line 65: `console.warn` - Cache read error
- Line 77: `console.warn` - Cache write error
- Line 131: `console.warn` - Cache clear error

#### 2. Utilities (2 occurrences)
**File**: `server/src/common/utils/index.ts`
- Line 55: `console.warn` - Parent menuId not found warning

**File**: `server/src/common/utils/export.ts`
- Line 123: `console.error` - Headers already sent error

#### 3. Config Example Service (21 occurrences)
**File**: `server/src/config/config-example.service.ts`
- Line 22: `console.log` - Application environment info
- Line 31: `console.log` - Database connection info
- Line 34: `console.log` - Full database config
- Line 56: `console.log` - Production environment message
- Line 58: `console.log` - Development environment message
- Line 60: `console.log` - Test environment message
- Line 70: `console.log` - JWT configuration
- Line 71: `console.log` - JWT secret key length
- Line 81: `console.log` - Multi-tenant enabled message
- Line 83: `console.log` - Multi-tenant disabled message
- Line 96: `console.log` - Local storage info
- Line 98: `console.log` - Cloud storage info
- Line 101: `console.log` - Max file size
- Line 102: `console.log` - Thumbnail status
- Line 111: `console.log` - Logger configuration
- Line 127: `console.log` - Router whitelist header
- Line 129: `console.log` - Router whitelist items (in loop)
- Line 141: `console.log` - Full configuration
- Line 178: `console.warn` - Deprecated method warning

#### 4. Main Bootstrap (1 occurrence - Already Fixed)
**File**: `server/src/main.ts`
- Line 191: Comment indicates this was already replaced with Logger

## Replacement Strategy

### Priority 1: Error Handling (4 occurrences)
Replace console.warn/error in decorators and utilities with AppLogger

### Priority 2: Config Example Service (21 occurrences)
This is an example/demo service - consider if it should use Logger or remain as-is for demonstration purposes

### Priority 3: Test Files
The eslint-config.spec.ts file contains console in a comment/string - no action needed

## Next Steps

1. Replace console calls in decorators (system-cache.decorator.ts)
2. Replace console calls in utilities (index.ts, export.ts)
3. Evaluate config-example.service.ts - determine if it should be updated or excluded
