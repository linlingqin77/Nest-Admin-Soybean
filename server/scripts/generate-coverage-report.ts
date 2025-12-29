/**
 * Coverage Report Generator
 *
 * This script parses Jest coverage JSON data and generates a detailed
 * coverage report grouped by module with uncovered lines highlighted.
 *
 * Usage: ts-node scripts/generate-coverage-report.ts
 *
 * Requirements: 7.3, 7.4
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileCoverage {
  path: string;
  statementMap: Record<string, { start: { line: number }; end: { line: number } }>;
  fnMap: Record<string, { name: string; decl: { start: { line: number }; end: { line: number } } }>;
  branchMap: Record<
    string,
    { type: string; locations: Array<{ start: { line: number }; end: { line: number } }> }
  >;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

interface CoverageData {
  [filePath: string]: FileCoverage;
}

interface ModuleCoverage {
  name: string;
  files: FileCoverageReport[];
  summary: CoverageSummary;
}

interface FileCoverageReport {
  path: string;
  relativePath: string;
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  uncoveredLines: number[];
}

interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

interface CoverageSummary {
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

interface ReportOutput {
  generatedAt: string;
  summary: CoverageSummary;
  modules: ModuleCoverage[];
  uncoveredFiles: string[];
}

const COVERAGE_JSON_PATH = path.join(__dirname, '../coverage/coverage-final.json');
const REPORT_OUTPUT_PATH = path.join(__dirname, '../coverage/coverage-report.json');
const REPORT_MD_PATH = path.join(__dirname, '../coverage/COVERAGE_REPORT.md');

function loadCoverageData(): CoverageData | null {
  if (!fs.existsSync(COVERAGE_JSON_PATH)) {
    console.error(`Coverage file not found: ${COVERAGE_JSON_PATH}`);
    console.error('Please run "npm run test:cov" first to generate coverage data.');
    return null;
  }

  const rawData = fs.readFileSync(COVERAGE_JSON_PATH, 'utf-8');
  return JSON.parse(rawData) as CoverageData;
}

function calculateMetric(covered: number, total: number): CoverageMetric {
  return {
    total,
    covered,
    percentage: total === 0 ? 100 : Math.round((covered / total) * 10000) / 100,
  };
}

function getUncoveredLines(fileCoverage: FileCoverage): number[] {
  const uncoveredLines = new Set<number>();

  // Check statement coverage
  for (const [key, count] of Object.entries(fileCoverage.s)) {
    if (count === 0) {
      const statement = fileCoverage.statementMap[key];
      if (statement) {
        for (let line = statement.start.line; line <= statement.end.line; line++) {
          uncoveredLines.add(line);
        }
      }
    }
  }

  // Check function coverage
  for (const [key, count] of Object.entries(fileCoverage.f)) {
    if (count === 0) {
      const fn = fileCoverage.fnMap[key];
      if (fn) {
        for (let line = fn.decl.start.line; line <= fn.decl.end.line; line++) {
          uncoveredLines.add(line);
        }
      }
    }
  }

  // Check branch coverage
  for (const [key, counts] of Object.entries(fileCoverage.b)) {
    const branch = fileCoverage.branchMap[key];
    if (branch) {
      counts.forEach((count, index) => {
        if (count === 0 && branch.locations[index]) {
          const loc = branch.locations[index];
          for (let line = loc.start.line; line <= loc.end.line; line++) {
            uncoveredLines.add(line);
          }
        }
      });
    }
  }

  return Array.from(uncoveredLines).sort((a, b) => a - b);
}

function analyzeFileCoverage(filePath: string, fileCoverage: FileCoverage): FileCoverageReport {
  const srcIndex = filePath.indexOf('/src/');
  const relativePath = srcIndex !== -1 ? filePath.substring(srcIndex + 1) : filePath;

  // Calculate statement coverage
  const statementTotal = Object.keys(fileCoverage.s).length;
  const statementCovered = Object.values(fileCoverage.s).filter((v) => v > 0).length;

  // Calculate function coverage
  const functionTotal = Object.keys(fileCoverage.f).length;
  const functionCovered = Object.values(fileCoverage.f).filter((v) => v > 0).length;

  // Calculate branch coverage
  const branchTotal = Object.values(fileCoverage.b).reduce((sum, arr) => sum + arr.length, 0);
  const branchCovered = Object.values(fileCoverage.b).reduce(
    (sum, arr) => sum + arr.filter((v) => v > 0).length,
    0,
  );

  // Calculate line coverage (using statement map as proxy)
  const lines = new Set<number>();
  const coveredLines = new Set<number>();

  for (const [key, statement] of Object.entries(fileCoverage.statementMap)) {
    for (let line = statement.start.line; line <= statement.end.line; line++) {
      lines.add(line);
      if (fileCoverage.s[key] > 0) {
        coveredLines.add(line);
      }
    }
  }

  return {
    path: filePath,
    relativePath,
    statements: calculateMetric(statementCovered, statementTotal),
    branches: calculateMetric(branchCovered, branchTotal),
    functions: calculateMetric(functionCovered, functionTotal),
    lines: calculateMetric(coveredLines.size, lines.size),
    uncoveredLines: getUncoveredLines(fileCoverage),
  };
}

function getModuleName(filePath: string): string {
  const srcIndex = filePath.indexOf('/src/');
  if (srcIndex === -1) return 'other';

  const relativePath = filePath.substring(srcIndex + 5); // Skip '/src/'
  const parts = relativePath.split('/');

  if (parts[0] === 'module' && parts.length > 1) {
    return `module/${parts[1]}`;
  }
  if (parts[0] === 'common' && parts.length > 1) {
    return `common/${parts[1]}`;
  }
  if (parts[0] === 'config') {
    return 'config';
  }
  if (parts[0] === 'prisma') {
    return 'prisma';
  }

  return parts[0] || 'other';
}

function groupByModule(fileReports: FileCoverageReport[]): Map<string, FileCoverageReport[]> {
  const modules = new Map<string, FileCoverageReport[]>();

  for (const report of fileReports) {
    const moduleName = getModuleName(report.path);
    if (!modules.has(moduleName)) {
      modules.set(moduleName, []);
    }
    modules.get(moduleName)!.push(report);
  }

  return modules;
}

function calculateModuleSummary(files: FileCoverageReport[]): CoverageSummary {
  const totals = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 },
  };

  for (const file of files) {
    totals.statements.total += file.statements.total;
    totals.statements.covered += file.statements.covered;
    totals.branches.total += file.branches.total;
    totals.branches.covered += file.branches.covered;
    totals.functions.total += file.functions.total;
    totals.functions.covered += file.functions.covered;
    totals.lines.total += file.lines.total;
    totals.lines.covered += file.lines.covered;
  }

  return {
    statements: calculateMetric(totals.statements.covered, totals.statements.total),
    branches: calculateMetric(totals.branches.covered, totals.branches.total),
    functions: calculateMetric(totals.functions.covered, totals.functions.total),
    lines: calculateMetric(totals.lines.covered, totals.lines.total),
  };
}

function generateMarkdownReport(report: ReportOutput): string {
  const lines: string[] = [];

  lines.push('# Test Coverage Report');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');

  // Overall Summary
  lines.push('## Overall Summary');
  lines.push('');
  lines.push('| Metric | Covered | Total | Percentage |');
  lines.push('|--------|---------|-------|------------|');
  lines.push(
    `| Statements | ${report.summary.statements.covered} | ${report.summary.statements.total} | ${report.summary.statements.percentage}% |`,
  );
  lines.push(
    `| Branches | ${report.summary.branches.covered} | ${report.summary.branches.total} | ${report.summary.branches.percentage}% |`,
  );
  lines.push(
    `| Functions | ${report.summary.functions.covered} | ${report.summary.functions.total} | ${report.summary.functions.percentage}% |`,
  );
  lines.push(
    `| Lines | ${report.summary.lines.covered} | ${report.summary.lines.total} | ${report.summary.lines.percentage}% |`,
  );
  lines.push('');

  // Module Coverage
  lines.push('## Coverage by Module');
  lines.push('');

  for (const module of report.modules.sort((a, b) => a.name.localeCompare(b.name))) {
    const statusIcon =
      module.summary.statements.percentage >= 80
        ? '✅'
        : module.summary.statements.percentage >= 50
          ? '⚠️'
          : '❌';

    lines.push(`### ${statusIcon} ${module.name}`);
    lines.push('');
    lines.push(
      `**Summary**: Statements: ${module.summary.statements.percentage}% | Branches: ${module.summary.branches.percentage}% | Functions: ${module.summary.functions.percentage}% | Lines: ${module.summary.lines.percentage}%`,
    );
    lines.push('');

    if (module.files.length > 0) {
      lines.push('| File | Statements | Branches | Functions | Lines | Uncovered Lines |');
      lines.push('|------|------------|----------|-----------|-------|-----------------|');

      for (const file of module.files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
        const uncoveredStr =
          file.uncoveredLines.length > 10
            ? `${file.uncoveredLines.slice(0, 10).join(', ')}... (+${file.uncoveredLines.length - 10} more)`
            : file.uncoveredLines.join(', ') || '-';

        lines.push(
          `| ${file.relativePath} | ${file.statements.percentage}% | ${file.branches.percentage}% | ${file.functions.percentage}% | ${file.lines.percentage}% | ${uncoveredStr} |`,
        );
      }
      lines.push('');
    }
  }

  // Uncovered Files
  if (report.uncoveredFiles.length > 0) {
    lines.push('## Files Without Coverage');
    lines.push('');
    lines.push('The following files have no test coverage:');
    lines.push('');
    for (const file of report.uncoveredFiles) {
      lines.push(`- ${file}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main(): void {
  console.log('📊 Generating Coverage Report...\n');

  const coverageData = loadCoverageData();
  if (!coverageData) {
    process.exit(1);
  }

  // Analyze each file
  const fileReports: FileCoverageReport[] = [];
  for (const [filePath, fileCoverage] of Object.entries(coverageData)) {
    fileReports.push(analyzeFileCoverage(filePath, fileCoverage));
  }

  // Group by module
  const moduleGroups = groupByModule(fileReports);

  // Build module reports
  const modules: ModuleCoverage[] = [];
  for (const [moduleName, files] of moduleGroups) {
    modules.push({
      name: moduleName,
      files,
      summary: calculateModuleSummary(files),
    });
  }

  // Calculate overall summary
  const overallSummary = calculateModuleSummary(fileReports);

  // Find files with 0% coverage
  const uncoveredFiles = fileReports
    .filter((f) => f.statements.percentage === 0)
    .map((f) => f.relativePath);

  // Build report
  const report: ReportOutput = {
    generatedAt: new Date().toISOString(),
    summary: overallSummary,
    modules,
    uncoveredFiles,
  };

  // Write JSON report
  fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report written to: ${REPORT_OUTPUT_PATH}`);

  // Write Markdown report
  const markdownReport = generateMarkdownReport(report);
  fs.writeFileSync(REPORT_MD_PATH, markdownReport);
  console.log(`✅ Markdown report written to: ${REPORT_MD_PATH}`);

  // Print summary to console
  console.log('\n📈 Coverage Summary:');
  console.log('─'.repeat(50));
  console.log(`  Statements: ${overallSummary.statements.percentage}%`);
  console.log(`  Branches:   ${overallSummary.branches.percentage}%`);
  console.log(`  Functions:  ${overallSummary.functions.percentage}%`);
  console.log(`  Lines:      ${overallSummary.lines.percentage}%`);
  console.log('─'.repeat(50));

  // Print module summary
  console.log('\n📦 Coverage by Module:');
  for (const module of modules.sort((a, b) => a.name.localeCompare(b.name))) {
    const icon =
      module.summary.statements.percentage >= 80
        ? '✅'
        : module.summary.statements.percentage >= 50
          ? '⚠️'
          : '❌';
    console.log(`  ${icon} ${module.name}: ${module.summary.statements.percentage}%`);
  }

  // Warn about uncovered files
  if (uncoveredFiles.length > 0) {
    console.log(`\n⚠️  ${uncoveredFiles.length} files have no test coverage.`);
  }

  console.log('\n✨ Coverage report generation complete!');
}

main();
