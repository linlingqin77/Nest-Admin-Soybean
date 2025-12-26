#!/usr/bin/env ts-node
/**
 * DTO Type Safety Audit Script
 * 
 * This script scans all DTO files and identifies:
 * - Fields missing class-validator decorators
 * - Optional fields missing @IsOptional()
 * - Enum fields missing @IsEnum()
 * - Nested objects missing @ValidateNested()
 * - Array fields missing @IsArray()
 * - Fields with unclear type annotations
 */

import * as fs from 'fs';
import * as path from 'path';

interface DtoIssue {
  file: string;
  className: string;
  fieldName: string;
  issue: string;
  line?: number;
}

const issues: DtoIssue[] = [];

// Patterns to detect
const DECORATOR_PATTERNS = {
  isString: /@IsString\(\)/,
  isNumber: /@IsNumber\(\)/,
  isInt: /@IsInt\(\)/,
  isBoolean: /@IsBoolean\(\)/,
  isEnum: /@IsEnum\(/,
  isArray: /@IsArray\(\)/,
  isOptional: /@IsOptional\(\)/,
  validateNested: /@ValidateNested\(\)/,
  type: /@Type\(/,
};

function analyzeDto(filePath: string, content: string): void {
  const lines = content.split('\n');
  let currentClass: string | null = null;
  let currentField: string | null = null;
  let currentDecorators: string[] = [];
  let currentFieldType: string | null = null;
  let isOptionalField = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Detect class declaration
    const classMatch = line.match(/export\s+class\s+(\w+Dto)/);
    if (classMatch) {
      currentClass = classMatch[1];
      continue;
    }

    // Skip if not in a DTO class
    if (!currentClass) continue;

    // Detect decorator
    if (line.startsWith('@')) {
      currentDecorators.push(line);
      continue;
    }

    // Detect field declaration
    const fieldMatch = line.match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
    if (fieldMatch && currentClass) {
      currentField = fieldMatch[1];
      isOptionalField = !!fieldMatch[2];
      currentFieldType = fieldMatch[3].replace(/;$/, '').trim();

      // Analyze the field
      analyzeField(
        filePath,
        currentClass,
        currentField,
        currentFieldType,
        isOptionalField,
        currentDecorators,
        lineNum
      );

      // Reset for next field
      currentDecorators = [];
      currentField = null;
      currentFieldType = null;
      isOptionalField = false;
    }
  }
}

function analyzeField(
  file: string,
  className: string,
  fieldName: string,
  fieldType: string,
  isOptional: boolean,
  decorators: string[],
  line: number
): void {
  const decoratorStr = decorators.join(' ');

  // Check for any type
  if (fieldType === 'any') {
    issues.push({
      file,
      className,
      fieldName,
      issue: 'Field uses "any" type - needs explicit type annotation',
      line,
    });
  }

  // Check optional fields
  if (isOptional && !DECORATOR_PATTERNS.isOptional.test(decoratorStr)) {
    issues.push({
      file,
      className,
      fieldName,
      issue: 'Optional field missing @IsOptional() decorator',
      line,
    });
  }

  // Check string fields
  if (fieldType === 'string' && !DECORATOR_PATTERNS.isString.test(decoratorStr)) {
    // Check if it's an enum field (has @IsEnum)
    if (!DECORATOR_PATTERNS.isEnum.test(decoratorStr)) {
      issues.push({
        file,
        className,
        fieldName,
        issue: 'String field missing @IsString() decorator',
        line,
      });
    }
  }

  // Check number fields
  if (fieldType === 'number' && 
      !DECORATOR_PATTERNS.isNumber.test(decoratorStr) && 
      !DECORATOR_PATTERNS.isInt.test(decoratorStr)) {
    issues.push({
      file,
      className,
      fieldName,
      issue: 'Number field missing @IsNumber() or @IsInt() decorator',
      line,
    });
  }

  // Check boolean fields
  if (fieldType === 'boolean' && !DECORATOR_PATTERNS.isBoolean.test(decoratorStr)) {
    issues.push({
      file,
      className,
      fieldName,
      issue: 'Boolean field missing @IsBoolean() decorator',
      line,
    });
  }

  // Check array fields
  if (fieldType.includes('[]') || fieldType.startsWith('Array<')) {
    if (!DECORATOR_PATTERNS.isArray.test(decoratorStr)) {
      issues.push({
        file,
        className,
        fieldName,
        issue: 'Array field missing @IsArray() decorator',
        line,
      });
    }
  }

  // Check enum fields (basic heuristic)
  if (fieldType.match(/^[A-Z]\w+$/) && !fieldType.match(/^(String|Number|Boolean|Date|Array)$/)) {
    if (!DECORATOR_PATTERNS.isEnum.test(decoratorStr)) {
      issues.push({
        file,
        className,
        fieldName,
        issue: `Possible enum field (${fieldType}) missing @IsEnum() decorator`,
        line,
      });
    }
  }

  // Check nested object fields
  if (fieldType.match(/^[A-Z]\w+Dto$/) || fieldType.includes('Dto')) {
    if (!DECORATOR_PATTERNS.validateNested.test(decoratorStr)) {
      issues.push({
        file,
        className,
        fieldName,
        issue: `Nested DTO field missing @ValidateNested() decorator`,
        line,
      });
    }
    if (!DECORATOR_PATTERNS.type.test(decoratorStr)) {
      issues.push({
        file,
        className,
        fieldName,
        issue: `Nested DTO field missing @Type() decorator`,
        line,
      });
    }
  }
}

function findDtoFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        findDtoFiles(filePath, fileList);
      }
    } else if (file.endsWith('.dto.ts')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function main(): Promise<void> {
  console.log('🔍 Scanning DTO files for type safety issues...\n');

  // Find all DTO files
  const srcDir = path.join(__dirname, '..', 'src');
  const dtoFiles = findDtoFiles(srcDir);

  console.log(`Found ${dtoFiles.length} DTO files\n`);

  // Analyze each file
  for (const file of dtoFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    analyzeDto(file, content);
  }

  // Generate report
  console.log('📊 DTO Type Safety Audit Report');
  console.log('='.repeat(80));
  console.log();

  if (issues.length === 0) {
    console.log('✅ No issues found! All DTOs have proper type safety.');
    return;
  }

  // Group issues by type
  const issuesByType = new Map<string, DtoIssue[]>();
  for (const issue of issues) {
    const type = issue.issue.split(' - ')[0];
    if (!issuesByType.has(type)) {
      issuesByType.set(type, []);
    }
    issuesByType.get(type)!.push(issue);
  }

  // Print summary
  console.log(`Found ${issues.length} issues across ${new Set(issues.map(i => i.file)).size} files\n`);
  
  for (const [type, typeIssues] of issuesByType) {
    console.log(`\n${type} (${typeIssues.length} issues)`);
    console.log('-'.repeat(80));
    
    for (const issue of typeIssues) {
      const relativePath = path.relative(path.join(__dirname, '..'), issue.file);
      console.log(`  ${relativePath}:${issue.line || '?'}`);
      console.log(`    Class: ${issue.className}`);
      console.log(`    Field: ${issue.fieldName}`);
      console.log(`    Issue: ${issue.issue}`);
      console.log();
    }
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'dto-type-safety-audit.md');
  const report = generateMarkdownReport(issues);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📝 Detailed report saved to: ${reportPath}`);
}

function generateMarkdownReport(issues: DtoIssue[]): string {
  let report = '# DTO Type Safety Audit Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total Issues: ${issues.length}\n\n`;

  // Group by file
  const issuesByFile = new Map<string, DtoIssue[]>();
  for (const issue of issues) {
    if (!issuesByFile.has(issue.file)) {
      issuesByFile.set(issue.file, []);
    }
    issuesByFile.get(issue.file)!.push(issue);
  }

  report += '## Issues by File\n\n';
  
  for (const [file, fileIssues] of issuesByFile) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    report += `### ${relativePath}\n\n`;
    report += `Issues: ${fileIssues.length}\n\n`;
    
    for (const issue of fileIssues) {
      report += `- **${issue.className}.${issue.fieldName}** (line ${issue.line || '?'})\n`;
      report += `  - ${issue.issue}\n\n`;
    }
  }

  // Summary by issue type
  const issuesByType = new Map<string, number>();
  for (const issue of issues) {
    const type = issue.issue;
    issuesByType.set(type, (issuesByType.get(type) || 0) + 1);
  }

  report += '## Summary by Issue Type\n\n';
  for (const [type, count] of Array.from(issuesByType.entries()).sort((a, b) => b[1] - a[1])) {
    report += `- ${type}: ${count}\n`;
  }

  return report;
}

main().catch(console.error);
