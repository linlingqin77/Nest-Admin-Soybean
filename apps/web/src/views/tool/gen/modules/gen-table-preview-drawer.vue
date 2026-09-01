<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useClipboard } from '@vueuse/core';
import { NDescriptions, NDescriptionsItem, NEmpty, NTag, NTooltip, NTree } from 'naive-ui';
import type { TreeOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchToolPreview } from '@/service/api';
import MonacoEditor from '@/components/common/monaco-editor.vue';

defineOptions({
  name: 'GenTablePreviewDrawer'
});

interface Props {
  /** the edit row data */
  rowData?: Api.Tool.GenTable | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const selectedKey = ref<string>('');
const previewData = ref<Api.Tool.GenTablePreview | Record<string, any>>({});
const { loading, startLoading, endLoading } = useLoading();

// 文件信息计算
interface FileInfo {
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lineCount: number;
  extension: string;
}

// 文件映射表
const genMap: Record<string, string> = {
  'vm/java/domain.java.vm': 'domain.java',
  'vm/java/vo.java.vm': 'vo.java',
  'vm/java/bo.java.vm': 'bo.java',
  'vm/java/mapper.java.vm': 'mapper.java',
  'vm/java/service.java.vm': 'service.java',
  'vm/java/serviceImpl.java.vm': 'serviceImpl.java',
  'vm/java/controller.java.vm': 'controller.java',
  'vm/xml/mapper.xml.vm': 'mapper.xml',
  'vm/sql/sql.vm': 'sql',
  'vm/soy/api/api.ts.vm': 'api.ts',
  'vm/soy/typings/api.d.ts.vm': 'type.d.ts',
  'vm/soy/index.vue.vm': 'index.vue',
  'vm/soy/index-tree.vue.vm': 'index-tree.vue',
  'vm/soy/modules/search.vue.vm': 'search.vue',
  'vm/soy/modules/operate-drawer.vue.vm': 'operate-drawer.vue'
};

// 获取文件语言
function getLanguage(name: string): string {
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.xml')) return 'xml';
  if (name.endsWith('sql')) return 'sql';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.vue')) return 'html';
  return 'plaintext';
}

// 获取文件扩展名
function getExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

// 计算文件大小（字节）
function getFileSize(content: string): number {
  return new Blob([content]).size;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 计算行数
function getLineCount(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

// 文件信息列表
const fileInfoList = computed<FileInfo[]>(() => {
  return Object.keys(previewData.value).map(key => {
    const content = previewData.value[key] || '';
    const name = genMap[key] || key;
    return {
      name,
      path: key,
      content,
      language: getLanguage(name),
      size: getFileSize(content),
      lineCount: getLineCount(content),
      extension: getExtension(name)
    };
  });
});

// 当前选中的文件信息
const currentFile = computed<FileInfo | null>(() => {
  return fileInfoList.value.find(f => f.path === selectedKey.value) || null;
});

// 获取文件图标类名
function getFileIconClass(extension: string): string {
  switch (extension) {
    case 'java':
      return 'i-logos:java';
    case 'xml':
      return 'i-vscode-icons:file-type-xml';
    case 'sql':
      return 'i-vscode-icons:file-type-sql';
    case 'ts':
      return 'i-logos:typescript-icon';
    case 'vue':
      return 'i-logos:vue';
    default:
      return 'i-material-symbols:description';
  }
}

// 构建文件树结构
const fileTree = computed<TreeOption[]>(() => {
  const tree: TreeOption[] = [];

  // 按文件夹分组
  const javaFiles: TreeOption[] = [];
  const xmlFiles: TreeOption[] = [];
  const sqlFiles: TreeOption[] = [];
  const vueFiles: TreeOption[] = [];
  const tsFiles: TreeOption[] = [];

  fileInfoList.value.forEach(file => {
    const option: TreeOption = {
      key: file.path,
      label: file.name,
      isLeaf: true,
      prefix: () => h('span', { class: `${getFileIconClass(file.extension)} text-16px` }),
      suffix: () => h(NTag, { size: 'tiny', type: 'info', class: 'ml-8px' }, () => formatFileSize(file.size))
    };

    if (file.path.includes('java')) {
      javaFiles.push(option);
    } else if (file.path.includes('xml')) {
      xmlFiles.push(option);
    } else if (file.path.includes('sql')) {
      sqlFiles.push(option);
    } else if (file.name.endsWith('.vue')) {
      vueFiles.push(option);
    } else if (file.name.endsWith('.ts')) {
      tsFiles.push(option);
    }
  });

  // 构建文件夹结构
  if (javaFiles.length > 0) {
    tree.push({
      key: 'folder-java',
      label: 'Java',
      children: javaFiles,
      prefix: () => h('span', { class: 'i-material-symbols:folder text-amber-500 text-16px' })
    });
  }

  if (xmlFiles.length > 0) {
    tree.push({
      key: 'folder-xml',
      label: 'XML',
      children: xmlFiles,
      prefix: () => h('span', { class: 'i-material-symbols:folder text-amber-500 text-16px' })
    });
  }

  if (sqlFiles.length > 0) {
    tree.push({
      key: 'folder-sql',
      label: 'SQL',
      children: sqlFiles,
      prefix: () => h('span', { class: 'i-material-symbols:folder text-amber-500 text-16px' })
    });
  }

  if (vueFiles.length > 0 || tsFiles.length > 0) {
    tree.push({
      key: 'folder-frontend',
      label: 'Frontend',
      children: [...tsFiles, ...vueFiles],
      prefix: () => h('span', { class: 'i-material-symbols:folder text-amber-500 text-16px' })
    });
  }

  return tree;
});

// 默认展开的文件夹
const expandedKeys = ref<string[]>(['folder-java', 'folder-xml', 'folder-sql', 'folder-frontend']);

async function getGenPreview() {
  if (!props.rowData?.tableId) return;
  startLoading();
  try {
    const { data } = (await fetchToolPreview(props.rowData?.tableId as number)) as unknown as {
      data: Api.Tool.GenTablePreview;
    };
    previewData.value = data || {};
    // 默认选中第一个文件
    const keys = Object.keys(previewData.value);
    if (keys.length > 0) {
      selectedKey.value = keys[0];
    }
  } catch {
    closeDrawer();
  } finally {
    endLoading();
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  closeDrawer();
  emit('submitted');
}

const { copy, isSupported } = useClipboard();

async function handleCopyCode() {
  if (!isSupported) {
    window.$message?.error('您的浏览器不支持Clipboard API');
    return;
  }

  if (!currentFile.value?.content) {
    window.$message?.warning('没有可复制的内容');
    return;
  }

  await copy(currentFile.value.content);
  window.$message?.success('代码复制成功');
}

// 复制所有代码
async function handleCopyAllCode() {
  if (!isSupported) {
    window.$message?.error('您的浏览器不支持Clipboard API');
    return;
  }

  const allContent = fileInfoList.value
    .map(file => `// ========== ${file.name} ==========\n${file.content}`)
    .join('\n\n');

  await copy(allContent);
  window.$message?.success('所有代码复制成功');
}

// 处理树节点选择
function handleTreeSelect(keys: string[]) {
  const key = keys[0];
  if (key && !key.startsWith('folder-')) {
    selectedKey.value = key;
  }
}

// 统计信息
const statistics = computed(() => {
  const totalFiles = fileInfoList.value.length;
  const totalSize = fileInfoList.value.reduce((sum, f) => sum + f.size, 0);
  const totalLines = fileInfoList.value.reduce((sum, f) => sum + f.lineCount, 0);
  return {
    totalFiles,
    totalSize: formatFileSize(totalSize),
    totalLines
  };
});

watch(visible, () => {
  if (visible.value) {
    previewData.value = {};
    selectedKey.value = '';
    getGenPreview();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" width="100%">
    <NDrawerContent title="代码预览" :native-scrollbar="false" closable>
      <NSpin :show="loading" class="h-full" content-class="h-full">
        <div class="h-full flex flex-col">
          <!-- 统计信息栏 -->
          <div class="mb-12px flex items-center justify-between">
            <NDescriptions :column="4" label-placement="left" size="small">
              <NDescriptionsItem label="表名">
                <NTag type="primary" size="small">{{ rowData?.tableName }}</NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="文件数">
                <NTag type="info" size="small">{{ statistics.totalFiles }} 个</NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="总大小">
                <NTag type="success" size="small">{{ statistics.totalSize }}</NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="总行数">
                <NTag type="warning" size="small">{{ statistics.totalLines }} 行</NTag>
              </NDescriptionsItem>
            </NDescriptions>
            <NSpace>
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton text :focusable="false" @click="handleCopyAllCode">
                    <template #icon>
                      <span class="i-material-symbols:content-copy-outline text-16px" />
                    </template>
                    复制全部
                  </NButton>
                </template>
                复制所有生成的代码
              </NTooltip>
            </NSpace>
          </div>

          <!-- 主内容区域 -->
          <div class="flex flex-1 gap-12px overflow-hidden">
            <!-- 文件树 -->
            <NCard size="small" class="w-250px flex-shrink-0" content-style="padding: 8px;">
              <template #header>
                <div class="flex items-center gap-8px">
                  <span class="i-material-symbols:folder-open text-amber-500" />
                  <span>文件列表</span>
                </div>
              </template>
              <NTree
                v-if="fileTree.length > 0"
                :data="fileTree"
                :selected-keys="[selectedKey]"
                :expanded-keys="expandedKeys"
                block-line
                selectable
                @update:selected-keys="handleTreeSelect"
                @update:expanded-keys="(keys: string[]) => (expandedKeys = keys)"
              />
              <NEmpty v-else description="暂无文件" />
            </NCard>

            <!-- 代码预览区域 -->
            <NCard size="small" class="flex-1 overflow-hidden" content-style="padding: 0; height: 100%;">
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-8px">
                    <span v-if="currentFile" class="text-16px" :class="[getFileIconClass(currentFile.extension)]" />
                    <span>{{ currentFile?.name || '请选择文件' }}</span>
                    <NTag v-if="currentFile" type="info" size="tiny">{{ currentFile.lineCount }} 行</NTag>
                    <NTag v-if="currentFile" type="success" size="tiny">
                      {{ formatFileSize(currentFile.size) }}
                    </NTag>
                  </div>
                  <NButton v-if="currentFile" text :focusable="false" @click="handleCopyCode">
                    <template #icon>
                      <span class="i-ep:copy-document text-14px" />
                    </template>
                    复制
                  </NButton>
                </div>
              </template>
              <div v-if="currentFile" class="h-full">
                <MonacoEditor
                  :value="currentFile.content"
                  read-only
                  :language="currentFile.language"
                  height="calc(100vh - 280px)"
                />
              </div>
              <div v-else class="h-full flex-center">
                <NEmpty description="请从左侧选择要预览的文件" />
              </div>
            </NCard>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton :disabled="loading" type="primary" @click="handleSubmit">生成代码</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  height: 100%;
}

:deep(.n-card__content) {
  height: calc(100% - 50px);
  overflow: auto;
}

:deep(.n-tree) {
  --n-node-text-color: var(--n-text-color);
}

:deep(.n-tree-node-content) {
  padding: 4px 8px;
}

:deep(.n-tree-node--selected .n-tree-node-content) {
  background-color: var(--n-node-color-active);
}
</style>
