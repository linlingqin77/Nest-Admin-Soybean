<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NCard, NUpload, NButton, NSpace, useMessage } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { fetchUploadFile } from '@/service/api';
import { $t } from '@/locales';

const message = useMessage();
const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const uploading = ref(false);
const fileList = ref<UploadFileInfo[]>([]);
const currentFolderId = ref(0);

function openModal(folderId: number = 0) {
  currentFolderId.value = folderId;
  visible.value = true;
  fileList.value = [];
}

async function handleUpload() {
  if (fileList.value.length === 0) {
    message.warning($t('page.fileManager.selectFilesFirst'));
    return;
  }

  uploading.value = true;

  try {
    for (const file of fileList.value) {
      if (file.file) {
        await fetchUploadFile(file.file, currentFolderId.value);
      }
    }

    message.success($t('page.fileManager.uploadSuccess'));
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error($t('page.fileManager.uploadFailed'));
  } finally {
    uploading.value = false;
  }
}

function handleClose() {
  visible.value = false;
  fileList.value = [];
}

defineExpose({
  openModal,
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="上传文件" class="w-600px" @after-leave="handleClose">
    <NUpload v-model:file-list="fileList" multiple :max="10" directory-dnd>
      <div class="n-upload-dragger">
        <div class="mb-3">
          <icon-material-symbols-cloud-upload class="text-48px text-primary" />
        </div>
        <div class="text-16px">点击或拖拽文件到此区域上传</div>
        <div class="text-12px text-gray mt-2">支持单个或批量上传，最多10个文件</div>
      </div>
    </NUpload>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="uploading" :disabled="fileList.length === 0" @click="handleUpload">
          开始上传
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.n-upload-dragger {
  padding: 40px;
  text-align: center;
}
</style>
