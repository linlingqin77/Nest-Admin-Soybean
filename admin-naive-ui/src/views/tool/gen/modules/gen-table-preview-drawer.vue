<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useLoading } from '@sa/hooks';
import { fetchGetGenPreview } from '@/service/api/tool';
import MonacoEditor from '@/components/common/monaco-editor.vue';

defineOptions({
  name: 'GenTablePreviewDrawer',
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
  default: false,
});

const tab = ref('');
const previewData = ref<Api.Tool.GenTablePreview>({});
const { loading, startLoading, endLoading } = useLoading();

// 文件名映射
const fileNameMap = computed(() => {
  const map: Record<string, string> = {};
  Object.keys(previewData.value).forEach(key => {
    // 从路径中提取文件名
    const parts = key.split('/');
    const fileName = parts[parts.length - 1];
    map[key] = fileName;
  });
  return map;
});

async function getGenPreview() {
  if (!props.rowData?.tableId) return;
  startLoading();
  try {
    const { data } = await fetchGetGenPreview(props.rowData?.tableId);
    previewData.value = data || {};
    // 设置默认选中第一个 tab
    const keys = Object.keys(previewData.value);
    if (keys.length > 0) {
      tab.value = keys[0];
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

  const code = previewData.value[tab.value];

  if (!code) {
    return;
  }

  await copy(code);
  window.$message?.success('代码复制成功');
}

watch(visible, () => {
  if (visible.value) {
    previewData.value = {};
    tab.value = '';
    getGenPreview();
  }
});

function getGenLanguage(fileName: string) {
  if (fileName.endsWith('.ts')) {
    return 'typescript';
  }

  if (fileName.endsWith('.vue')) {
    return 'html';
  }

  if (fileName.endsWith('.sql')) {
    return 'sql';
  }

  if (fileName.endsWith('.json')) {
    return 'json';
  }

  if (fileName.endsWith('.spec.ts')) {
    return 'typescript';
  }

  return 'plaintext';
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" width="100%">
    <NDrawerContent title="代码预览" :native-scrollbar="false" closable>
      <NSpin :show="loading" class="h-full" content-class="h-full">
        <div class="flex flex-row h-full">
          <NTabs v-model:value="tab" type="line" placement="left" class="h-full" pane-class="h-full">
            <NTab v-for="(gen, index) in Object.keys(previewData)" :key="index" :name="gen" display-directive="show">
              {{ fileNameMap[gen] }}
            </NTab>
          </NTabs>
          <div class="flex-1 relative">
            <MonacoEditor
              v-if="tab && previewData[tab]"
              v-model:value="previewData[tab]"
              class="tab-pane"
              read-only
              :language="getGenLanguage(fileNameMap[tab] || '')"
              height="calc(100vh - 162px)"
            />
            <div class="position-absolute right-12px top-2px">
              <NButton text :focusable="false" class="flex-center" @click="handleCopyCode">
                <template #icon>
                  <icon-ep-copy-document class="text-14px" />
                </template>
                <span>复制</span>
              </NButton>
            </div>
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

:deep(.n-tabs) {
  width: unset !important;
}

:deep(.n-tabs.n-tabs--left .n-tabs-bar) {
  width: 5px !important;
}

.tab-pane {
  transition:
    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding-left: 12px;
}
</style>
