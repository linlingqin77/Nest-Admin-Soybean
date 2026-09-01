<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useClipboard } from '@vueuse/core';
import { NDescriptions, NDescriptionsItem, NEmpty, NTag, NTooltip, NTree } from 'naive-ui';
import type { TreeOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchHistoryFindOne } from '@/service/api';
import MonacoEditor from '@/components/common/monaco-editor.vue';

defineOptions({
  name: 'HistoryDetailDrawer'
});

interface Props {
  /** the history row data */
  rowData?: Api.Tool.GenHistory | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const selectedKey = ref<string>('');
const fileList = ref<Api.Tool.PreviewFile[]>([]);
const { loading, startLoading, endLoading } = useLoading();

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 获取文件扩展名
function getExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

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

// 当前选中的文件信息
const currentFile = computed<Api.Tool.PreviewFile | null>(() => {
  return fileList.value.find(f => f.path === selectedKey.value) || null;
});

// 构建文件树结构
const fileTree = computed<TreeOption[]>(() => {
  const tree: TreeOption[] = [];

  // 按文件夹分组
  const backendFiles: TreeOption[] = [];
  const frontendFiles: TreeOption[] = [];
  const sqlFiles: TreeOption[] = [];

  fileList.value.forEach(file => {
    const ext = getExtension(file.name);
    const option: TreeOption = {
      key: file.path,
      label: file.name,
      isLeaf: true,
      prefix: () => h('span', { class: `${getFileIconClass(ext)} text-16px` }),
      suffix: () => h(NTag, { size: 'tiny', type: 'info', class: 'ml-8px' }, () => formatFileSize(file.size || 0))
    };

    if (file.language === 'sql' || file.name.endsWith('.sql')) {
      sqlFiles.push(option);
    } else if (file.name.endsWith('.vue') || file.name.endsWith('.ts')) {
      frontendFiles.push(option);
    } else {
      backendFiles.push(option);
    }
  });

  // 构建文件夹结构
  if (backendFiles.length > 0) {
    tree.push({
      key: 'folder-backend',
      label: 'Backend',
      children: backendFiles,
      prefix: () => h('span', { class: 'i-material-symbols:folder text-amber-500 text-16px' })
    });
  }

  if (frontendFiles.length > 0) {
    tree.push({
      key: 'folder-frontend',
      label: 'Frontend',
      children: frontendFiles,
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

  return tree;
});

// 默认展开的文件夹
const expandedKeys = ref<string[]>(['folder-backend', 'folder-frontend', 'folder-sql']);

async function getHistoryDetail() {
  if (!props.rowData?.id) return;
  startLoading();
  try {
    const { data } = await fetchHistoryFindOne(props.rowData.id);
    if (data?.snapshotData) {
      const snapshot = JSON.parse(data.snapshotData) as {
        files?: { name: string; path: string; language?: string; size?: number; lineCount?: number }[];
      };
      if (snapshot?.files) {
        fileList.value = snapshot.files as any;
        // 默认选中第一个文件
        if (fileList.value.length > 0) {
          selectedKey.value = fileList.value[0].path;
        }
      }
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

  const allContent = fileList.value.map(file => `// ========== ${file.name} ==========\n${file.content}`).join('\n\n');

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
  const totalFiles = fileList.value.length;
  const totalSize = fileList.value.reduce((sum, f) => sum + (f.size || 0), 0);
  const totalLines = fileList.value.reduce((sum, f) => sum + (f.lineCount || 0), 0);
  return {
    totalFiles,
    totalSize: formatFileSize(totalSize),
    totalLines
  };
});

watch(visible, () => {
  if (visible.value) {
    fileList.value = [];
    selectedKey.value = '';
    getHistoryDetail();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" width="100%">
    <NDrawerContent title="历史版本详情" :native-scrollbar="false" closable>
      <NSpin :show="loading" class="h-full" content-class="h-full">
        <div class="h-full flex flex-col">
          <!-- 统计信息栏 -->
          <div class="mb-12px flex items-center justify-between">
            <NDescriptions :column="5" label-placement="left" size="small">
              <NDescriptionsItem label="表名">
                <NTag type="primary" size="small">{{ rowData?.tableName }}</NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="生成人">
                <NTag type="info" size="small">{{ rowData?.generatedBy }}</NTag>
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
                    <span
                      v-if="currentFile"
                      class="text-16px"
                      :class="[getFileIconClass(getExtension(currentFile.name))]"
                    />
                    <span>{{ currentFile?.name || '请选择文件' }}</span>
                    <NTag v-if="currentFile" type="info" size="tiny">{{ currentFile.lineCount }} 行</NTag>
                    <NTag v-if="currentFile" type="success" size="tiny">
                      {{ formatFileSize(currentFile.size || 0) }}
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
          <NButton @click="closeDrawer">关闭</NButton>
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
