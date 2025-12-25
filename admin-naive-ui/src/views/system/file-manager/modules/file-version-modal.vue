<template>
  <n-modal v-model:show="modalVisible" preset="card" :title="title" class="w-800px" :segmented="{ content: true }">
    <n-spin :show="loading">
      <n-empty v-if="!loading && versions.length === 0" description="暂无历史版本" />

      <n-timeline v-else>
        <n-timeline-item
          v-for="version in versions"
          :key="version.uploadId"
          :type="version.isLatest ? 'success' : 'default'"
          :title="`版本 ${version.version}`"
        >
          <template #icon>
            <icon-carbon-version v-if="version.isLatest" />
            <icon-carbon-document v-else />
          </template>

          <n-space vertical :size="8">
            <n-text>
              <n-tag v-if="version.isLatest" type="success" size="small">当前版本</n-tag>
              {{ version.fileName }}
            </n-text>
            <n-text depth="3" class="text-sm">
              大小: {{ formatFileSize(version.size) }} | 创建时间: {{ formatDateTime(version.createTime) }} | 创建人:
              {{ version.createBy }}
            </n-text>

            <n-space>
              <n-button
                v-if="!version.isLatest"
                :size="themeStore.componentSize"
                type="primary"
                @click="handleRestore(version)"
              >
                恢复此版本
              </n-button>
              <n-button :size="themeStore.componentSize" @click="handleDownload(version)"> 下载 </n-button>
            </n-space>
          </n-space>
        </n-timeline-item>
      </n-timeline>
    </n-spin>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';
import { fetchGetFileVersions, fetchRestoreVersion, fetchGetFileAccessToken, downloadFile } from '@/service/api';
import { formatFileSize, formatDateTime } from '@/utils/common';
import { $t } from '@/locales';

interface Props {
  /** 文件ID */
  fileId?: string;
  /** 文件名 */
  fileName?: string;
}

interface Emits {
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();
const dialog = useDialog();
const themeStore = useThemeStore();

const modalVisible = ref(false);
const loading = ref(false);
const title = ref('版本历史');
const versions = ref<Api.System.FileManager.FileVersion[]>([]);
const currentVersion = ref(0);

/** 打开弹窗 */
async function open(fileId: string, fileName: string) {
  modalVisible.value = true;
  title.value = `${fileName} - 版本历史`;
  loading.value = true;

  try {
    const { data } = await fetchGetFileVersions(fileId);
    if (data) {
      versions.value = data.versions;
      currentVersion.value = data.currentVersion;
    }
  } catch (error) {
    message.error($t('page.fileManager.getVersionsFailed'));
  } finally {
    loading.value = false;
  }
}

/** 恢复版本 */
function handleRestore(version: Api.System.FileManager.FileVersion) {
  dialog.warning({
    title: $t('page.fileManager.restoreVersion'),
    content: $t('page.fileManager.restoreVersionConfirm', { version: version.version }),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        const { data } = await fetchRestoreVersion({
          fileId: props.fileId!,
          targetVersionId: version.uploadId,
        });

        if (data) {
          message.success(
            $t('page.fileManager.restoreVersionSuccess', { version: version.version, newVersion: data.newVersion }),
          );
          emit('success');
          modalVisible.value = false;
        }
      } catch (error: any) {
        if (error.message?.includes('已被修改')) {
          message.error($t('page.fileManager.fileModified'));
        } else {
          message.error($t('page.fileManager.restoreVersionFailed'));
        }
      }
    },
  });
}

/** 下载版本 */
async function handleDownload(version: Api.System.FileManager.FileVersion) {
  try {
    const { data } = await fetchGetFileAccessToken(version.uploadId);
    if (data) {
      downloadFile(version.uploadId, data.token);
      message.success($t('page.fileManager.downloadStarted'));
    }
  } catch (error) {
    message.error($t('page.fileManager.getDownloadLinkFailed'));
  }
}

defineExpose({
  open,
});
</script>
