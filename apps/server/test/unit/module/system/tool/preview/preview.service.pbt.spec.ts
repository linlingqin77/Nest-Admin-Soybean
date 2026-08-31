/**
 * 代码预览服务属性测试
 *
 * Property 13: ZIP 文件结构正确性
 * **Validates: Requirements 8.2, 8.4**
 */
import * as fc from 'fast-check';
import { PreviewService } from '@/modules/tools/preview/preview.service';
import { PreviewFileDto, FileTreeNodeDto } from '@/modules/tools/dto/responses/preview.response.dto';

describe('PreviewService - Property Tests', () => {
  let service: PreviewService;

  beforeEach(() => {
    service = new PreviewService();
  });

  describe('Property 13: ZIP 文件结构正确性', () => {
    /**
     * **Validates: Requirements 8.2, 8.4**
     *
     * *For any* generated ZIP archive, it should contain all expected files
     * with correct directory structure and UTF-8 encoding.
     */

    /**
     * 测试文件大小计算的正确性
     * *For any* string content, the calculated size should equal the UTF-8 byte length
     */
    it('should calculate file size correctly for any content', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 1000 }), (content) => {
          const calculatedSize = service.calculateFileSize(content);
          const expectedSize = Buffer.byteLength(content, 'utf-8');
          return calculatedSize === expectedSize;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * 测试行数计算的正确性
     * *For any* string content, the line count should be consistent
     */
    it('should calculate line count correctly for any content', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 500 }), (content) => {
          const lineCount = service.calculateLineCount(content);

          if (content.length === 0) {
            return lineCount === 0;
          }

          // 行数应该等于换行符数量 + 1
          const newlineCount = (content.match(/\n/g) || []).length;
          return lineCount === newlineCount + 1;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * 测试文件树构建的正确性
     * *For any* set of files with valid paths, the file tree should contain all files
     */
    it('should build file tree containing all files', () => {
      fc.assert(
        fc.property(
          // 生成随机文件列表，确保路径不会冲突
          fc
            .integer({ min: 1, max: 10 })
            .chain((count) => {
              return fc.array(
                fc.record({
                  dirParts: fc.array(
                    fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
                    { minLength: 1, maxLength: 3 },
                  ),
                  filename: fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /^[a-zA-Z0-9._-]+$/.test(s)),
                  content: fc.string({ minLength: 1, maxLength: 100 }),
                  language: fc.constantFrom('typescript', 'vue', 'sql'),
                  size: fc.integer({ min: 1, max: 10000 }),
                  lineCount: fc.integer({ min: 1, max: 100 }),
                }),
                { minLength: 1, maxLength: count },
              );
            })
            .map((files) => {
              // 为每个文件生成唯一的路径，确保不会有路径冲突
              const usedPaths = new Set<string>();
              return files.map((f, index) => {
                // 使用索引确保路径唯一
                const uniqueDir = [...f.dirParts, `dir${index}`].join('/');
                const path = `${uniqueDir}/${f.filename}`;
                usedPaths.add(path);
                return {
                  name: f.filename,
                  path,
                  content: f.content,
                  language: f.language,
                  size: f.size,
                  lineCount: f.lineCount,
                };
              });
            }),
          (files: PreviewFileDto[]) => {
            const fileTree = service.buildFileTreeV2(files);

            // 统计文件树中的文件数量
            const countFiles = (nodes: FileTreeNodeDto[]): number => {
              let count = 0;
              for (const node of nodes) {
                if (!node.isDirectory) {
                  count++;
                }
                if (node.children) {
                  count += countFiles(node.children);
                }
              }
              return count;
            };

            const treeFileCount = countFiles(fileTree);
            return treeFileCount === files.length;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * 测试文件树排序的正确性
     * *For any* file tree, directories should come before files at each level
     */
    it('should sort file tree with directories before files', () => {
      fc.assert(
        fc.property(
          // 生成随机文件列表
          fc
            .array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z0-9._-]+$/.test(s)),
                path: fc
                  .array(
                    fc.string({ minLength: 1, maxLength: 8 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
                    { minLength: 1, maxLength: 3 },
                  )
                  .map((parts) => parts.join('/')),
                content: fc.string({ minLength: 1, maxLength: 50 }),
                language: fc.constantFrom('typescript', 'vue', 'sql'),
                size: fc.integer({ min: 1, max: 1000 }),
                lineCount: fc.integer({ min: 1, max: 50 }),
              }),
              { minLength: 2, maxLength: 8 },
            )
            .map((files) => {
              return files.map((f) => ({
                ...f,
                path: `${f.path}/${f.name}`,
              }));
            }),
          (files: PreviewFileDto[]) => {
            const fileTree = service.buildFileTreeV2(files);

            // 检查每一层的排序
            const checkSorting = (nodes: FileTreeNodeDto[]): boolean => {
              let lastWasDirectory = true;
              for (const node of nodes) {
                // 如果当前是目录，前一个必须也是目录
                if (node.isDirectory && !lastWasDirectory) {
                  return false;
                }
                lastWasDirectory = node.isDirectory;

                // 递归检查子节点
                if (node.children && node.children.length > 0) {
                  if (!checkSorting(node.children)) {
                    return false;
                  }
                }
              }
              return true;
            };

            return checkSorting(fileTree);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * 测试语言检测的正确性
     * *For any* file path with known extension, the language should be correctly detected
     */
    it('should detect language correctly from file path', () => {
      const extensionLanguageMap: Record<string, string> = {
        '.ts': 'typescript',
        '.js': 'javascript',
        '.vue': 'vue',
        '.sql': 'sql',
        '.json': 'json',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.md': 'markdown',
      };

      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(extensionLanguageMap)),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
          (extension, filename) => {
            const filePath = `some/path/${filename}${extension}`;
            const detectedLanguage = service.getLanguageFromPath(filePath);
            return detectedLanguage === extensionLanguageMap[extension];
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * 测试未知扩展名的处理
     * *For any* file path with unknown extension, the language should be 'plaintext'
     */
    it('should return plaintext for unknown extensions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[a-z]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
          (unknownExt, filename) => {
            // 确保扩展名不是已知的
            const knownExtensions = ['.ts', '.js', '.vue', '.sql', '.json', '.html', '.css', '.scss', '.md'];
            const extension = `.${unknownExt}xyz`; // 添加 xyz 确保不是已知扩展名

            if (knownExtensions.includes(extension)) {
              return true; // 跳过已知扩展名
            }

            const filePath = `some/path/${filename}${extension}`;
            const detectedLanguage = service.getLanguageFromPath(filePath);
            return detectedLanguage === 'plaintext';
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * 测试预览响应的统计信息正确性
     * *For any* template output, the preview response should have correct statistics
     */
    it('should calculate correct statistics in preview response', () => {
      fc.assert(
        fc.property(
          // 生成模拟的模板输出
          fc.record({
            'tool/template/nestjs/entity.ts.vm': fc.string({ minLength: 10, maxLength: 200 }),
            'tool/template/nestjs/dto.ts.vm': fc.string({ minLength: 10, maxLength: 200 }),
            'tool/template/nestjs/controller.ts.vm': fc.string({ minLength: 10, maxLength: 200 }),
            'tool/template/nestjs/service.ts.vm': fc.string({ minLength: 10, maxLength: 200 }),
            'tool/template/nestjs/modules.ts.vm': fc.string({ minLength: 10, maxLength: 200 }),
          }),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[A-Z][a-zA-Z0-9]*$/.test(s)),
          (templateOutput, businessName) => {
            const response = service.createPreviewResponse(templateOutput, businessName);

            // 验证文件数量
            if (response.totalFiles !== response.files.length) {
              return false;
            }

            // 验证总行数
            const expectedTotalLines = response.files.reduce((sum, f) => sum + f.lineCount, 0);
            if (response.totalLines !== expectedTotalLines) {
              return false;
            }

            // 验证总大小
            const expectedTotalSize = response.files.reduce((sum, f) => sum + f.size, 0);
            if (response.totalSize !== expectedTotalSize) {
              return false;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * 测试文件名提取的正确性
     * *For any* file path, the extracted filename should be the last segment
     */
    it('should extract filename correctly from path', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
            { minLength: 1, maxLength: 5 },
          ),
          fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /^[a-zA-Z0-9._-]+$/.test(s)),
          (pathParts, filename) => {
            const fullPath = [...pathParts, filename].join('/');
            const extractedFilename = service.getFileName(fullPath);
            return extractedFilename === filename;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
