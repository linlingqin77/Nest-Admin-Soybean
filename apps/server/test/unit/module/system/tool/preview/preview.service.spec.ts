/**
 * 预览服务单元测试
 *
 * @description 测试 PreviewService 的所有方法
 * Requirements: 11.1, 15.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PreviewService } from '@/modules/tools/preview/preview.service';

describe('PreviewService', () => {
  let service: PreviewService;

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [PreviewService],
    }).compile();

    service = modules.get<PreviewService>(PreviewService);
  });

  describe('getLanguageFromPath - 根据文件路径获取编程语言', () => {
    it('应该识别 TypeScript 文件', () => {
      expect(service.getLanguageFromPath('src/user.controller.ts')).toBe('typescript');
    });

    it('应该识别 JavaScript 文件', () => {
      expect(service.getLanguageFromPath('src/utils.js')).toBe('javascript');
    });

    it('应该识别 Vue 文件', () => {
      expect(service.getLanguageFromPath('src/views/user/index.vue')).toBe('vue');
    });

    it('应该识别 SQL 文件', () => {
      expect(service.getLanguageFromPath('sql/menu.sql')).toBe('sql');
    });

    it('应该识别 JSON 文件', () => {
      expect(service.getLanguageFromPath('package.json')).toBe('json');
    });

    it('应该识别 HTML 文件', () => {
      expect(service.getLanguageFromPath('index.html')).toBe('html');
    });

    it('应该识别 CSS 文件', () => {
      expect(service.getLanguageFromPath('styles.css')).toBe('css');
    });

    it('应该识别 SCSS 文件', () => {
      expect(service.getLanguageFromPath('styles.scss')).toBe('scss');
    });

    it('应该识别 Markdown 文件', () => {
      expect(service.getLanguageFromPath('README.md')).toBe('markdown');
    });

    it('应该对未知扩展名返回 plaintext', () => {
      expect(service.getLanguageFromPath('file.unknown')).toBe('plaintext');
      expect(service.getLanguageFromPath('file.xyz')).toBe('plaintext');
    });
  });

  describe('calculateFileSize - 计算文件大小', () => {
    it('应该正确计算 ASCII 字符串大小', () => {
      const content = 'Hello, World!';
      expect(service.calculateFileSize(content)).toBe(13);
    });

    it('应该正确计算空字符串大小', () => {
      expect(service.calculateFileSize('')).toBe(0);
    });

    it('应该正确计算包含中文的字符串大小', () => {
      const content = '你好';
      // UTF-8 中每个中文字符占 3 字节
      expect(service.calculateFileSize(content)).toBe(6);
    });

    it('应该正确计算包含换行符的字符串大小', () => {
      const content = 'line1\nline2\nline3';
      expect(service.calculateFileSize(content)).toBe(17);
    });

    it('应该正确计算包含特殊字符的字符串大小', () => {
      const content = '!@#$%^&*()';
      expect(service.calculateFileSize(content)).toBe(10);
    });
  });

  describe('calculateLineCount - 计算代码行数', () => {
    it('应该正确计算单行代码', () => {
      expect(service.calculateLineCount('single line')).toBe(1);
    });

    it('应该正确计算多行代码', () => {
      const content = 'line1\nline2\nline3';
      expect(service.calculateLineCount(content)).toBe(3);
    });

    it('应该对空字符串返回 0', () => {
      expect(service.calculateLineCount('')).toBe(0);
    });

    it('应该对 null/undefined 返回 0', () => {
      expect(service.calculateLineCount(null as any)).toBe(0);
      expect(service.calculateLineCount(undefined as any)).toBe(0);
    });

    it('应该正确处理末尾有换行符的情况', () => {
      const content = 'line1\nline2\n';
      expect(service.calculateLineCount(content)).toBe(3);
    });

    it('应该正确处理只有换行符的情况', () => {
      expect(service.calculateLineCount('\n')).toBe(2);
      expect(service.calculateLineCount('\n\n')).toBe(3);
    });
  });

  describe('getFileName - 从文件路径获取文件名', () => {
    it('应该从完整路径获取文件名', () => {
      expect(service.getFileName('src/controller/user.controller.ts')).toBe('user.controller.ts');
    });

    it('应该处理只有文件名的情况', () => {
      expect(service.getFileName('user.controller.ts')).toBe('user.controller.ts');
    });

    it('应该处理深层嵌套路径', () => {
      expect(service.getFileName('a/b/c/d/e/file.ts')).toBe('file.ts');
    });
  });

  describe('convertToPreviewFiles - 将模板输出转换为预览文件列表', () => {
    it('应该正确转换 NestJS 模板输出', () => {
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': 'export class UserController {}',
        'tool/template/nestjs/service.ts.vm': 'export class UserService {}',
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files).toHaveLength(2);
      expect(files[0].path).toContain('user.controller.ts');
      expect(files[0].language).toBe('typescript');
      expect(files[1].path).toContain('user.service.ts');
    });

    it('应该正确转换 Vue 模板输出', () => {
      const templateOutput = {
        'tool/template/vue/api.ts.vm': 'export function getUser() {}',
        'tool/template/vue/index.vue.vm': '<template><div>User</div></template>',
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files).toHaveLength(2);
      expect(files.some((f) => f.language === 'typescript')).toBe(true);
      expect(files.some((f) => f.language === 'vue')).toBe(true);
    });

    it('应该正确转换 SQL 模板输出', () => {
      const templateOutput = {
        'tool/template/sql/menu.sql.vm': 'INSERT INTO sys_menu ...',
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files).toHaveLength(1);
      expect(files[0].language).toBe('sql');
      expect(files[0].path).toContain('user_menu.sql');
    });

    it('应该跳过空内容', () => {
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': '',
        'tool/template/nestjs/service.ts.vm': 'export class UserService {}',
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files).toHaveLength(1);
    });

    it('应该跳过错误内容', () => {
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': '// Error: Template not found',
        'tool/template/nestjs/service.ts.vm': 'export class UserService {}',
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files).toHaveLength(1);
    });

    it('应该跳过未知模板路径', () => {
      const templateOutput = {
        'unknown/template/path.vm': 'some content',
        'tool/template/nestjs/service.ts.vm': 'export class UserService {}',
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files).toHaveLength(1);
    });

    it('应该正确计算文件大小和行数', () => {
      const content = 'line1\nline2\nline3';
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': content,
      };

      const files = service.convertToPreviewFiles(templateOutput, 'User');

      expect(files[0].lineCount).toBe(3);
      expect(files[0].size).toBe(Buffer.byteLength(content, 'utf-8'));
    });
  });

  describe('buildFileTreeV2 - 构建文件树结构', () => {
    it('应该正确构建单层文件树', () => {
      const files = [
        { name: 'file1.ts', path: 'file1.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
        { name: 'file2.ts', path: 'file2.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
      ];

      const tree = service.buildFileTreeV2(files);

      expect(tree).toHaveLength(2);
      expect(tree[0].isDirectory).toBe(false);
      expect(tree[1].isDirectory).toBe(false);
    });

    it('应该正确构建嵌套文件树', () => {
      const files = [
        { name: 'controller.ts', path: 'src/controller/user.controller.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
        { name: 'service.ts', path: 'src/service/user.service.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
      ];

      const tree = service.buildFileTreeV2(files);

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('src');
      expect(tree[0].isDirectory).toBe(true);
      expect(tree[0].children).toHaveLength(2);
    });

    it('应该将目录排在文件前面', () => {
      const files = [
        { name: 'file.ts', path: 'file.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
        { name: 'index.ts', path: 'src/index.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
      ];

      const tree = service.buildFileTreeV2(files);

      expect(tree[0].isDirectory).toBe(true);
      expect(tree[0].name).toBe('src');
      expect(tree[1].isDirectory).toBe(false);
      expect(tree[1].name).toBe('file.ts');
    });

    it('应该按名称排序同类型节点', () => {
      const files = [
        { name: 'z.ts', path: 'z.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
        { name: 'a.ts', path: 'a.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
        { name: 'm.ts', path: 'm.ts', content: '', language: 'typescript', size: 0, lineCount: 0 },
      ];

      const tree = service.buildFileTreeV2(files);

      expect(tree[0].name).toBe('a.ts');
      expect(tree[1].name).toBe('m.ts');
      expect(tree[2].name).toBe('z.ts');
    });

    it('应该处理空文件列表', () => {
      const tree = service.buildFileTreeV2([]);

      expect(tree).toHaveLength(0);
    });

    it('应该正确关联文件节点', () => {
      const file = { name: 'user.ts', path: 'src/user.ts', content: 'content', language: 'typescript', size: 7, lineCount: 1 };
      const files = [file];

      const tree = service.buildFileTreeV2(files);

      expect(tree[0].children![0].file).toEqual(file);
    });
  });

  describe('createPreviewResponse - 创建完整的预览响应', () => {
    it('应该创建完整的预览响应', () => {
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': 'export class UserController {}',
        'tool/template/nestjs/service.ts.vm': 'export class UserService {}',
      };

      const response = service.createPreviewResponse(templateOutput, 'User');

      expect(response.files).toHaveLength(2);
      expect(response.fileTree).toBeDefined();
      expect(response.totalFiles).toBe(2);
      expect(response.totalLines).toBeGreaterThan(0);
      expect(response.totalSize).toBeGreaterThan(0);
    });

    it('应该正确计算总行数', () => {
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': 'line1\nline2\nline3',
        'tool/template/nestjs/service.ts.vm': 'line1\nline2',
      };

      const response = service.createPreviewResponse(templateOutput, 'User');

      expect(response.totalLines).toBe(5);
    });

    it('应该正确计算总大小', () => {
      const content1 = 'Hello';
      const content2 = 'World';
      const templateOutput = {
        'tool/template/nestjs/controller.ts.vm': content1,
        'tool/template/nestjs/service.ts.vm': content2,
      };

      const response = service.createPreviewResponse(templateOutput, 'User');

      expect(response.totalSize).toBe(
        Buffer.byteLength(content1, 'utf-8') + Buffer.byteLength(content2, 'utf-8'),
      );
    });

    it('应该处理空模板输出', () => {
      const response = service.createPreviewResponse({}, 'User');

      expect(response.files).toHaveLength(0);
      expect(response.fileTree).toHaveLength(0);
      expect(response.totalFiles).toBe(0);
      expect(response.totalLines).toBe(0);
      expect(response.totalSize).toBe(0);
    });
  });
});
