import { Injectable } from '@nestjs/common';
import { PreviewFileDto, FileTreeNodeDto, PreviewResponseDto } from '../dto/responses/preview.response.dto';

/**
 * 文件语言映射
 */
const LANGUAGE_MAP: Record<string, string> = {
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

/**
 * 代码预览服务
 *
 * 负责处理代码预览相关的功能，包括：
 * - 计算文件大小和行数
 * - 构建文件树结构
 * - 组织预览响应数据
 */
@Injectable()
export class PreviewService {
  /**
   * 根据文件路径获取编程语言
   */
  getLanguageFromPath(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    return LANGUAGE_MAP[ext] || 'plaintext';
  }

  /**
   * 计算文件大小（字节）
   */
  calculateFileSize(content: string): number {
    return Buffer.byteLength(content, 'utf-8');
  }

  /**
   * 计算代码行数
   */
  calculateLineCount(content: string): number {
    if (!content || content.length === 0) {
      return 0;
    }
    return content.split('\n').length;
  }

  /**
   * 从文件路径获取文件名
   */
  getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  /**
   * 将模板输出转换为预览文件列表
   *
   * @param templateOutput 模板生成的输出 { templatePath: content }
   * @param businessName 业务名称
   * @returns 预览文件列表
   */
  convertToPreviewFiles(templateOutput: Record<string, string>, businessName: string): PreviewFileDto[] {
    const files: PreviewFileDto[] = [];

    // 定义模板路径到输出路径的映射
    const pathMappings: Record<string, (businessName: string) => string> = {
      'tool/template/nestjs/entity.ts.vm': (bn) => `nestjs/${bn}/entities/${bn.toLowerCase()}.entity.ts`,
      'tool/template/nestjs/dto.ts.vm': (bn) => `nestjs/${bn}/dto/${bn.toLowerCase()}.dto.ts`,
      'tool/template/nestjs/controller.ts.vm': (bn) => `nestjs/${bn}/${bn.toLowerCase()}.controller.ts`,
      'tool/template/nestjs/service.ts.vm': (bn) => `nestjs/${bn}/${bn.toLowerCase()}.service.ts`,
      'tool/template/nestjs/modules.ts.vm': (bn) => `nestjs/${bn}/${bn.toLowerCase()}.modules.ts`,
      'tool/template/vue/api.ts.vm': (bn) => `vue/${bn}/api/${bn.toLowerCase()}.ts`,
      'tool/template/vue/api.js.vm': (bn) => `vue/${bn}/api/${bn.toLowerCase()}.ts`,
      'tool/template/vue/index.vue.vm': (bn) => `vue/${bn}/views/${bn.toLowerCase()}/index.vue`,
      'tool/template/vue/indexVue.vue.vm': (bn) => `vue/${bn}/views/${bn.toLowerCase()}/index.vue`,
      'tool/template/vue/dialog.vue.vm': (bn) => `vue/${bn}/views/${bn.toLowerCase()}/components/dialog.vue`,
      'tool/template/vue/dialogVue.vue.vm': (bn) => `vue/${bn}/views/${bn.toLowerCase()}/components/dialog.vue`,
      'tool/template/vue/search.vue.vm': (bn) => `vue/${bn}/views/${bn.toLowerCase()}/components/search.vue`,
      'tool/template/sql/menu.sql.vm': (bn) => `sql/${bn.toLowerCase()}_menu.sql`,
      'tool/template/sql/menu-delete.sql.vm': (bn) => `sql/${bn.toLowerCase()}_menu_delete.sql`,
      'tool/template/sql/permission.sql.vm': (bn) => `sql/${bn.toLowerCase()}_permission.sql`,
      'tool/template/sql/permission-delete.sql.vm': (bn) => `sql/${bn.toLowerCase()}_permission_delete.sql`,
      'tool/template/sql/full-permission.sql.vm': (bn) => `sql/${bn.toLowerCase()}_full_permission.sql`,
    };

    for (const [templatePath, content] of Object.entries(templateOutput)) {
      // 跳过空内容或错误内容
      if (!content || content.startsWith('// Error')) {
        continue;
      }

      const pathMapper = pathMappings[templatePath];
      if (!pathMapper) {
        continue;
      }

      const filePath = pathMapper(businessName);
      const fileName = this.getFileName(filePath);
      const language = this.getLanguageFromPath(filePath);
      const size = this.calculateFileSize(content);
      const lineCount = this.calculateLineCount(content);

      files.push({
        name: fileName,
        path: filePath,
        content,
        language,
        size,
        lineCount,
      });
    }

    return files;
  }

  /**
   * 构建文件树结构
   *
   * @param files 预览文件列表
   * @returns 文件树节点列表
   */
  buildFileTree(files: PreviewFileDto[]): FileTreeNodeDto[] {
    const root: Map<string, FileTreeNodeDto> = new Map();

    for (const file of files) {
      const pathParts = file.path.split('/');
      let currentPath = '';
      let currentLevel = root;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!currentLevel.has(part)) {
          const node: FileTreeNodeDto = {
            name: part,
            path: currentPath,
            isDirectory: !isLast,
            children: isLast ? undefined : [],
            file: isLast ? file : undefined,
          };
          currentLevel.set(part, node);
        }

        if (!isLast) {
          const parentNode = currentLevel.get(part)!;
          if (!parentNode.children) {
            parentNode.children = [];
          }
          // 转换为 Map 以便继续遍历
          const childMap = new Map<string, FileTreeNodeDto>();
          for (const child of parentNode.children) {
            childMap.set(child.name, child);
          }
          currentLevel = childMap;
        }
      }
    }

    // 递归构建树结构
    return this.buildTreeFromMap(root);
  }

  /**
   * 从 Map 构建树结构
   */
  private buildTreeFromMap(nodeMap: Map<string, FileTreeNodeDto>): FileTreeNodeDto[] {
    const result: FileTreeNodeDto[] = [];

    for (const node of nodeMap.values()) {
      if (node.isDirectory && node.children) {
        // 递归处理子节点
        const childMap = new Map<string, FileTreeNodeDto>();
        for (const child of node.children) {
          childMap.set(child.name, child);
        }
        node.children = this.buildTreeFromMap(childMap);
      }
      result.push(node);
    }

    // 排序：目录在前，文件在后，同类型按名称排序
    return result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 重新构建文件树（修复版本）
   */
  buildFileTreeV2(files: PreviewFileDto[]): FileTreeNodeDto[] {
    const rootNodes: FileTreeNodeDto[] = [];
    const nodeCache: Map<string, FileTreeNodeDto> = new Map();

    for (const file of files) {
      const pathParts = file.path.split('/');
      let currentPath = '';

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeCache.has(currentPath)) {
          const node: FileTreeNodeDto = {
            name: part,
            path: currentPath,
            isDirectory: !isLast,
            children: isLast ? undefined : [],
            file: isLast ? file : undefined,
          };
          nodeCache.set(currentPath, node);

          // 添加到父节点或根节点
          if (parentPath) {
            const parentNode = nodeCache.get(parentPath);
            if (parentNode && parentNode.children) {
              parentNode.children.push(node);
            }
          } else {
            rootNodes.push(node);
          }
        }
      }
    }

    // 递归排序
    this.sortTreeNodes(rootNodes);

    return rootNodes;
  }

  /**
   * 递归排序树节点
   */
  private sortTreeNodes(nodes: FileTreeNodeDto[]): void {
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.sortTreeNodes(node.children);
      }
    }
  }

  /**
   * 创建完整的预览响应
   *
   * @param templateOutput 模板生成的输出
   * @param businessName 业务名称
   * @returns 预览响应 DTO
   */
  createPreviewResponse(templateOutput: Record<string, string>, businessName: string): PreviewResponseDto {
    const files = this.convertToPreviewFiles(templateOutput, businessName);
    const fileTree = this.buildFileTreeV2(files);

    const totalFiles = files.length;
    const totalLines = files.reduce((sum, file) => sum + file.lineCount, 0);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      files,
      fileTree,
      totalFiles,
      totalLines,
      totalSize,
    };
  }
}
