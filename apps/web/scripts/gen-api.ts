/**
 * Frontend API Client Generator
 *
 * Reads the OpenAPI specification from `packages/contracts/openapi/openapi.json`
 * and generates TypeScript API client files into `apps/web/src/api/`.
 *
 * The generator is dependency-free (no codegen libraries) and uses simple
 * string templates to produce:
 *   - `types.ts`         – shared DTO/VO interfaces derived from `components.schemas`
 *   - `api/<tag>.ts`     – one fetch function per operation, grouped by OpenAPI tag
 *   - `api/index.ts`     – barrel re-export
 *   - `index.ts`         – top-level entry exporting types and APIs
 *
 * The generated fetch helpers rely on the lightweight `request-adapter`
 * shim (`apps/web/src/service/request-adapter.ts`) which delegates to
 * the project's existing `request` instance.
 *
 * Run: pnpm generate:api
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Paths ──────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, '../../../');
const OPENAPI_PATH = join(PROJECT_ROOT, 'packages/contracts/openapi/openapi.json');
const API_OUT_DIR = join(PROJECT_ROOT, 'apps/web/src/api');
const API_SUBDIR = join(API_OUT_DIR, 'api');
const REQUEST_ADAPTER_PATH = join(PROJECT_ROOT, 'apps/web/src/service/request-adapter.ts');

// ── Types for the subset of OpenAPI we read ────────────────────────────────
interface OpenAPIDoc {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: Array<{ url: string }>;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
  };
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenAPISchema }>;
  };
  responses?: Record<string, OpenAPIResponse>;
  deprecated?: boolean;
  security?: unknown[];
}

interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: OpenAPISchema;
}

interface OpenAPIResponse {
  description?: string;
  content?: Record<string, { schema?: OpenAPISchema }>;
}

interface OpenAPISchema {
  type?: string;
  format?: string;
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  additionalProperties?: boolean | OpenAPISchema;
  $ref?: string;
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  allOf?: OpenAPISchema[];
  nullable?: boolean;
}

interface ParsedOperation {
  operationId: string;
  functionName: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  tag: string;
  pathParams: OpenAPIParameter[];
  queryParams: OpenAPIParameter[];
  hasBody: boolean;
  bodyRequired: boolean;
  bodySchemaRef?: string;
  responseRef?: string;
  responseIsArray: boolean;
  responseRefBase?: string;
  deprecated: boolean;
}

// ── Main pipeline ──────────────────────────────────────────────────────────
function main() {
  console.log('🚀 Generating frontend API client from OpenAPI spec...\n');

  if (!existsSync(OPENAPI_PATH)) {
    console.error(`❌ OpenAPI spec not found: ${OPENAPI_PATH}`);
    console.error('   Run "pnpm generate:openapi" first.');
    process.exit(1);
  }

  if (!existsSync(REQUEST_ADAPTER_PATH)) {
    console.error(`❌ Request adapter not found: ${REQUEST_ADAPTER_PATH}`);
    console.error('   Ensure apps/web/src/service/request-adapter.ts exists.');
    process.exit(1);
  }

  const raw = readFileSync(OPENAPI_PATH, 'utf-8');
  const spec = JSON.parse(raw) as OpenAPIDoc;

  // Ensure output dirs
  if (existsSync(API_OUT_DIR)) {
    rmSync(API_OUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(API_SUBDIR, { recursive: true });

  // Parse operations and group by tag
  const operations = parseOperations(spec);
  const grouped = groupByTag(operations);

  // Collect all referenced schema names so we can include them in types.ts
  const referencedSchemas = new Set<string>();
  for (const op of operations) {
    if (op.bodySchemaRef) referencedSchemas.add(op.bodySchemaRef);
    if (op.responseRef) referencedSchemas.add(op.responseRef);
    if (op.responseRefBase) referencedSchemas.add(op.responseRefBase);
  }
  // Always include all schemas so consumers can import any by name
  for (const name of Object.keys(spec.components?.schemas ?? {})) {
    referencedSchemas.add(name);
  }

  // Generate types.ts
  const typesContent = generateTypesFile(spec, referencedSchemas);
  writeFileSync(join(API_OUT_DIR, 'types.ts'), typesContent);
  console.log(`Generated: src/api/types.ts (${referencedSchemas.size} types)`);

  // Generate per-tag API files
  let totalApis = 0;
  const tagFileMap: Array<{ tag: string; fileName: string }> = [];
  for (const [tag, ops] of grouped) {
    const fileName = tagToFileName(tag);
    tagFileMap.push({ tag, fileName });
    const content = generateTagFile(tag, ops);
    writeFileSync(join(API_SUBDIR, `${fileName}.ts`), content);
    totalApis += ops.length;
    console.log(`Generated: src/api/api/${fileName}.ts (${ops.length} endpoints)`);
  }

  // Generate api/index.ts barrel
  const apiIndexContent = generateApiIndex(tagFileMap);
  writeFileSync(join(API_SUBDIR, 'index.ts'), apiIndexContent);
  console.log(`Generated: src/api/api/index.ts`);

  // Generate top-level index.ts
  const topIndexContent = generateTopIndex();
  writeFileSync(join(API_OUT_DIR, 'index.ts'), topIndexContent);
  console.log(`Generated: src/api/index.ts`);

  console.log(`\n✅ Generated ${totalApis} API endpoints across ${grouped.size} tags`);
  console.log(`   Output: ${API_OUT_DIR}`);
}

main();

// ── Parsing ────────────────────────────────────────────────────────────────
function parseOperations(spec: OpenAPIDoc): ParsedOperation[] {
  const ops: ParsedOperation[] = [];
  const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options']);

  for (const [pathUrl, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      const o = op as OpenAPIOperation;
      if (!o.operationId) continue;

      const tag = (o.tags?.[0] ?? 'default').toString();
      const pathParams = (o.parameters ?? []).filter(p => p.in === 'path');
      const queryParams = (o.parameters ?? []).filter(p => p.in === 'query');

      const jsonContent = o.requestBody?.content?.['application/json'];
      const hasBody = Boolean(jsonContent?.schema);
      const bodyRequired = Boolean(o.requestBody?.required) && hasBody;
      const bodySchemaRef = hasBody ? extractRefName(jsonContent!.schema!) : undefined;

      const responseInfo = extractResponseRef(o);

      ops.push({
        operationId: o.operationId,
        functionName: operationIdToFunctionName(o.operationId),
        method: method.toUpperCase(),
        path: pathUrl,
        summary: o.summary ?? '',
        description: o.description ?? '',
        tag,
        pathParams,
        queryParams,
        hasBody,
        bodyRequired,
        bodySchemaRef,
        responseRef: responseInfo.ref,
        responseIsArray: responseInfo.isArray,
        responseRefBase: responseInfo.baseRef,
        deprecated: Boolean(o.deprecated)
      });
    }
  }

  return ops;
}

function extractRefName(schema: OpenAPISchema): string | undefined {
  if (schema.$ref) {
    return schema.$ref.replace('#/components/schemas/', '');
  }
  if (schema.allOf) {
    // Prefer the first named ref inside allOf if available
    for (const sub of schema.allOf) {
      if (sub.$ref) return sub.$ref.replace('#/components/schemas/', '');
    }
  }
  return undefined;
}

function extractResponseRef(op: OpenAPIOperation): {
  ref?: string;
  isArray: boolean;
  baseRef?: string;
} {
  const resp = op.responses?.['200'] ?? op.responses?.default;
  if (!resp) return { isArray: false };

  const jsonSchema = resp.content?.['application/json']?.schema;
  if (!jsonSchema) return { isArray: false };

  // Standard Response wrapper has `data` field; look for $ref in data property
  if (jsonSchema.allOf && Array.isArray(jsonSchema.properties) === false) {
    // No-op
  }
  // Inspect properties.data if present (common wrapper pattern)
  if (jsonSchema.properties?.data) {
    const dataSchema = jsonSchema.properties.data;
    if (dataSchema.$ref) {
      return {
        ref: dataSchema.$ref.replace('#/components/schemas/', ''),
        isArray: false,
        baseRef: dataSchema.$ref.replace('#/components/schemas/', '')
      };
    }
    if (dataSchema.type === 'array' && dataSchema.items?.$ref) {
      const base = dataSchema.items.$ref.replace('#/components/schemas/', '');
      return { ref: `${base}[]`, isArray: true, baseRef: base };
    }
    if (dataSchema.type === 'array') {
      return { ref: 'unknown[]', isArray: true };
    }
  }

  // Direct ref
  if (jsonSchema.$ref) {
    const name = jsonSchema.$ref.replace('#/components/schemas/', '');
    return { ref: name, isArray: false, baseRef: name };
  }
  if (jsonSchema.type === 'array' && jsonSchema.items?.$ref) {
    const base = jsonSchema.items.$ref.replace('#/components/schemas/', '');
    return { ref: `${base}[]`, isArray: true, baseRef: base };
  }

  return { isArray: false };
}

function groupByTag(ops: ParsedOperation[]): Map<string, ParsedOperation[]> {
  const map = new Map<string, ParsedOperation[]>();
  for (const op of ops) {
    const list = map.get(op.tag) ?? [];
    list.push(op);
    map.set(op.tag, list);
  }
  // Sort entries: alphabetical tag, operations inside by path then method
  return new Map(
    Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, list]) => [
        tag,
        list.sort((x, y) => x.path.localeCompare(y.path) || x.method.localeCompare(y.method))
      ])
  );
}

// ── Naming helpers ─────────────────────────────────────────────────────────
function operationIdToFunctionName(operationId: string): string {
  // Convert Snake_case_operationId into fetchSnakeCaseOperationId
  // Strip redundant Controller suffix and version suffix.
  const cleaned = operationId
    .replace(/Controller/g, '')
    .replace(/_v\d+$/i, '')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleaned) return 'fetchApiCall';

  const parts = cleaned.split('_').filter(Boolean);
  const camel = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return `fetch${camel}`;
}

function tagToFileName(tag: string): string {
  // For ASCII-only tags, use a clean slug
  const asciiTag = tag
    .toLowerCase()
    .replace(/[\s\/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (asciiTag) return asciiTag;

  // For non-ASCII (e.g. Chinese) tags, use a hash-based safe name
  const hash = createHash('md5').update(tag).digest('hex').slice(0, 8);
  // Take first 12 chars of URL-encoded tag for readability
  const short = encodeURIComponent(tag).replace(/%/g, '').slice(0, 12);
  return `${short}-${hash}`;
}

// ── Code generation ────────────────────────────────────────────────────────
function generateTypesFile(spec: OpenAPIDoc, referenced: Set<string>): string {
  const schemas = spec.components?.schemas ?? {};
  const lines: string[] = [
    '/**',
    ' * @generated',
    ' * Auto-generated from OpenAPI spec. Do not edit manually.',
    ` * Generated at: ${new Date().toISOString()}`,
    ' */',
    '',
    '/* eslint-disable */',
    ''
  ];

  for (const name of Array.from(referenced).sort()) {
    const schema = schemas[name];
    if (!schema) continue;
    lines.push(generateTypeDefinition(name, schema));
    lines.push('');
  }

  return lines.join('\n');
}

function generateTypeDefinition(name: string, schema: OpenAPISchema): string {
  const lines: string[] = [];
  if (schema.description) {
    lines.push(`/** ${escapeJsDoc(schema.description)} */`);
  }

  if (schema.enum) {
    const values = schema.enum.map(v => (typeof v === 'string' ? `'${escapeString(v)}'` : String(v))).join(' | ');
    lines.push(`export type ${name} = ${values};`);
    return lines.join('\n');
  }

  if (schema.type === 'object' || schema.properties) {
    lines.push(`export interface ${name} {`);
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.has(propName);
      const optional = isRequired ? '' : '?';
      const type = schemaToType(propSchema);
      if (propSchema.description) {
        lines.push(`  /** ${escapeJsDoc(propSchema.description)} */`);
      }
      lines.push(`  ${propName}${optional}: ${type};`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  // Fallback alias type
  lines.push(`export type ${name} = ${schemaToType(schema)};`);
  return lines.join('\n');
}

function schemaToType(schema: OpenAPISchema): string {
  if (schema.$ref) {
    return schema.$ref.replace('#/components/schemas/', '');
  }
  if (schema.allOf) {
    const types = schema.allOf.map(s => schemaToType(s));
    return types.filter(t => t !== 'unknown').join(' & ') || 'unknown';
  }
  if (schema.oneOf) {
    return schema.oneOf.map(s => schemaToType(s)).join(' | ');
  }
  if (schema.anyOf) {
    return schema.anyOf.map(s => schemaToType(s)).join(' | ');
  }

  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(v => `'${escapeString(String(v))}'`).join(' | ');
      }
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array': {
      if (!schema.items) return 'unknown[]';
      return `${schemaToType(schema.items)}[]`;
    }
    case 'object':
      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        return `Record<string, ${schemaToType(schema.additionalProperties)}>`;
      }
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

function generateTagFile(tag: string, ops: ParsedOperation[]): string {
  const lines: string[] = [
    '/**',
    ' * @generated',
    ` * Tag: ${tag}`,
    ` * Generated at: ${new Date().toISOString()}`,
    ' */',
    '',
    '/* eslint-disable */',
    "import { apiRequest, buildUrl } from '@/service/request-adapter';",
    "import type * as Types from '../types';",
    '',
    `// ── Tag: ${tag} ────────────────────────────────────────────────`,
    ''
  ];

  // Track which types are referenced so we can add a TS `import type` reminder
  const usedTypes = new Set<string>();
  for (const op of ops) {
    if (op.bodySchemaRef) usedTypes.add(op.bodySchemaRef);
    if (op.responseRefBase) usedTypes.add(op.responseRefBase);
  }

  if (usedTypes.size > 0) {
    lines.push(`// Referenced types: ${Array.from(usedTypes).sort().join(', ')}`);
    lines.push('');
  }

  for (const op of ops) {
    lines.push(generateApiFunction(op));
    lines.push('');
  }

  return lines.join('\n');
}

function generateApiFunction(op: ParsedOperation): string {
  const lines: string[] = [];

  // JSDoc
  const docParts: string[] = [];
  if (op.summary) docParts.push(op.summary);
  if (op.description && op.description !== op.summary) docParts.push(`@description ${op.description}`);
  if (op.deprecated) docParts.push('@deprecated');
  if (docParts.length) {
    lines.push('/**');
    for (const part of docParts) {
      lines.push(` * ${part}`);
    }
    lines.push(' */');
  }

  // Build parameters
  const params: string[] = [];
  for (const p of op.pathParams) {
    params.push(`${p.name}: ${inferParamType(p.schema)}`);
  }
  for (const p of op.queryParams) {
    const optional = p.required ? '' : '?';
    params.push(`${p.name}${optional}: ${inferParamType(p.schema)}`);
  }
  if (op.hasBody) {
    const optional = op.bodyRequired ? '' : '?';
    params.push(`body${optional}: ${op.bodySchemaRef ?? 'unknown'}`);
  }

  const returnType = op.responseRef ?? 'unknown';

  lines.push(`export function ${op.functionName}(${params.join(', ')}): Promise<${returnType}> {`);
  lines.push(`  return apiRequest<${returnType}>({`);
  lines.push(`    method: '${op.method}',`);
  lines.push(`    url: ${buildUrlExpr(op)},`);
  if (op.hasBody) {
    lines.push('    data: body,');
  }
  if (op.queryParams.length > 0) {
    lines.push('    params: {');
    lines.push(op.queryParams.map(p => `      ${p.name}: ${p.name}${p.required ? '' : ' ?? undefined'}`).join(',\n'));
    lines.push('    },');
  }
  lines.push(`    operationId: '${op.operationId}',`);
  lines.push('  });');
  lines.push('}');

  return lines.join('\n');
}

function buildUrlExpr(op: ParsedOperation): string {
  if (op.pathParams.length === 0) {
    return `'${op.path}'`;
  }
  const entries = op.pathParams.map(p => `${p.name}: ${p.name}`).join(', ');
  return `buildUrl('${op.path}', { ${entries} })`;
}

function inferParamType(schema?: OpenAPISchema): string {
  if (!schema) return 'string | number';
  return schemaToType(schema);
}

function generateApiIndex(tagFileMap: Array<{ tag: string; fileName: string }>): string {
  const lines: string[] = [
    '/**',
    ' * @generated',
    ' * Barrel export for generated API modules.',
    ` * Generated at: ${new Date().toISOString()}`,
    ' */',
    '',
    '/* eslint-disable */',
    ''
  ];
  for (const { fileName } of tagFileMap) {
    lines.push(`export * from './${fileName}';`);
  }
  return lines.join('\n');
}

function generateTopIndex(): string {
  const lines: string[] = [
    '/**',
    ' * @generated',
    ' * Top-level entry for the generated API client.',
    ` * Generated at: ${new Date().toISOString()}`,
    ' */',
    '',
    '/* eslint-disable */',
    "export * as Api from './api';",
    "export * as Types from './types';",
    ''
  ];
  return lines.join('\n');
}

// ── Escaping helpers ───────────────────────────────────────────────────────
function escapeString(value: string): string {
  return value.replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function escapeJsDoc(text: string): string {
  return text.replace(/\*\//g, '* /').replace(/\n+/g, ' ');
}
