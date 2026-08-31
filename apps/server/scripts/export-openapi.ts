/**
 * Export OpenAPI Specification
 *
 * Copies the OpenAPI document from the built app's public directory
 * to packages/contracts/openapi/openapi.json.
 *
 * This script should be run AFTER building the server:
 *   pnpm --filter @nest-admin/server build
 *   pnpm generate:openapi
 *
 * Run: pnpm generate:openapi
 */

import { copyFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Source: built server's public/openApi.json
// Target: packages/contracts/openapi/openapi.json
const SOURCE_PATH = join(__dirname, '../public/openApi.json');
const TARGET_DIR = join(__dirname, '../../../packages/contracts/openapi');
const TARGET_PATH = join(TARGET_DIR, 'openapi.json');

function main() {
  console.log('🚀 Exporting OpenAPI specification...\n');

  // Check if source file exists
  if (!existsSync(SOURCE_PATH)) {
    console.error(`❌ Source file not found: ${SOURCE_PATH}`);
    console.error('   Please run "pnpm --filter @nest-admin/server build" first.');
    process.exit(1);
  }

  // Ensure target directory exists
  mkdirSync(TARGET_DIR, { recursive: true });

  // Read and parse to validate
  try {
    const content = readFileSync(SOURCE_PATH, 'utf-8');
    const document = JSON.parse(content);

    // Copy file
    copyFileSync(SOURCE_PATH, TARGET_PATH);

    console.log(`✅ OpenAPI spec exported to: ${TARGET_PATH}`);

    // Log stats
    const pathCount = Object.keys(document.paths || {}).length;
    const schemaCount = Object.keys(document.components?.schemas || {}).length;
    console.log(`   - Paths: ${pathCount}`);
    console.log(`   - Schemas: ${schemaCount}`);

    process.exit(0);
  } catch (err) {
    console.error(`❌ Failed to export OpenAPI: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
