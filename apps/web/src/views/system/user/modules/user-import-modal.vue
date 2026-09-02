<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { getToken } from '@/store/modules/auth/shared';
import { useDownload } from '@/hooks/business/download';
import { getServiceBaseURL } from '@/utils/service';
import type FileUpload from '@/components/custom/file-upload.vue';
import { $t } from '@/locales';
import { sanitizeHtml } from '@/utils/sanitize';

defineOptions({
  name: 'UserImportModal'
});

interface Emits {
  (e: 'submitted'): void;
}

const { download } = useDownload();

const { baseURL } = getServiceBaseURL(import.meta.env);

const headers: Record<string, string> = {
  Authorization: `Bearer ${getToken()}`,
  clientid: import.meta.env.VITE_APP_CLIENT_ID!
};

const emit = defineEmits<Emits>();

const uploadRef = ref<typeof FileUpload>();
const rawMessage = ref<string>(''); // C7：保存原始消息，使用 computed 派生安全版本
const message = computed(() => sanitizeHtml(rawMessage.value));
const success = ref<boolean>(false);

const visible = defineModel<boolean>('visible', {
  default: false
});

const data = ref<Record<string, any>>({
  updateSupport: false
});

const fileList = ref<UploadFileInfo[]>([]);

function closeDrawer() {
  visible.value = false;
  if (success.value) {
    emit('submitted');
  }
}

async function handleSubmit() {
  fileList.value.forEach(item => {
    item.status = 'pending';
  });
  uploadRef.value?.submit();
}

function isErrorState(xhr: XMLHttpRequest) {
  const responseText = xhr?.responseText;
  const response = JSON.parse(responseText);
  return response.code !== 200;
}

function handleFinish(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  const { file, event } = options;
  // @ts-expect-error Ignore type errors
  const responseText = event?.target?.responseText;
  const response = JSON.parse(responseText);
  rawMessage.value = response.msg;
  window.$message?.success($t('common.importSuccess'));
  success.value = true;
  return file;
}

function handleError(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  const { event } = options;
  // @ts-expect-error Ignore type errors
  const responseText = event?.target?.responseText;
  const msg = JSON.parse(responseText).msg;
  rawMessage.value = msg;
  // C7：toast 中的 innerHTML 也要清理，防止服务器返回的恶意消息脚本注入
  const safeMsg = sanitizeHtml(msg || $t('common.importFail'));
  window.$message?.error(() => h('div', { innerHTML: safeMsg }));
  success.value = false;
}

function handleDownloadTemplate() {
  download(
    '/system/user/importTemplate',
    {},
    `${$t('page.system.user.title')}_${$t('common.importTemplate')}_${new Date().getTime()}.xlsx`
  );
}

watch(visible, () => {
  if (visible.value) {
    data.value.updateSupport = false;
    fileList.value = [];
    success.value = false;
    rawMessage.value = '';
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    :title="$t('common.import')"
    preset="card"
    :bordered="false"
    display-directive="show"
    class="max-w-90% w-600px"
    @close="closeDrawer"
  >
    <NUpload
      ref="uploadRef"
      v-model:file-list="fileList"
      :action="`${baseURL}/system/user/importData`"
      :headers="headers"
      :data="data"
      :max="1"
      :file-size="50"
      accept=".xls,.xlsx"
      :multiple="false"
      directory-dnd
      :default-upload="false"
      list-type="text"
      :is-error-state="isErrorState"
      @finish="handleFinish"
      @error="handleError"
    >
      <NUploadDragger>
        <div class="mb-12px flex-center">
          <SvgIcon icon="material-symbols:unarchive-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
        </div>
        <NText class="text-16px">{{ $t('common.importTip') }}</NText>
        <NP depth="3" class="mt-8px text-center">
          {{ $t('common.importSize') }}
          <b class="text-red-500">50MB</b>
          {{ $t('common.importFormat') }}
          <b class="text-red-500">xls/xlsx</b>
          {{ $t('common.importEnd') }}
        </NP>
      </NUploadDragger>
    </NUpload>
    <div class="flex-center">
      <NCheckbox v-model:checked="data.updateSupport">{{ $t('common.updateExisting') }}</NCheckbox>
    </div>

    <NAlert v-if="message" :title="$t('common.importResult')" :type="success ? 'success' : 'error'" :bordered="false">
      <NScrollbar class="max-h-200px">
        <!-- C7：message 经 sanitizeHtml 清洗，但仍需注意后端消息的可信度 -->
        <span v-html="message" />
      </NScrollbar>
    </NAlert>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="handleDownloadTemplate">{{ $t('common.downloadTemplate') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.import') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
