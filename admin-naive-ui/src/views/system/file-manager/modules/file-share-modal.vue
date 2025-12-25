<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { NModal, NCard, NForm, NFormItem, NInput, NInputNumber, NSwitch, NButton, NSpace, useMessage } from 'naive-ui';
import { fetchCreateShare } from '@/service/api';
import { $t } from '@/locales';

const message = useMessage();

const visible = ref(false);
const loading = ref(false);
const fileData = ref<any>(null);
const shareResult = ref<any>(null);

const formRef = ref();
const formModel = reactive({
  uploadId: '',
  shareCode: '',
  expireHours: 24,
  maxDownload: -1,
  needPassword: false,
});

const shareUrl = computed(() => {
  if (!shareResult.value) return '';
  return `${window.location.origin}${shareResult.value.shareUrl}`;
});

function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message.success($t('common.copySuccess'));
    })
    .catch(() => {
      message.error($t('common.copyFailed'));
    });
}

function openModal(data: any) {
  fileData.value = data;
  visible.value = true;
  shareResult.value = null;

  Object.assign(formModel, {
    uploadId: data.uploadId,
    shareCode: '',
    expireHours: 24,
    maxDownload: -1,
    needPassword: false,
  });
}

async function handleCreate() {
  loading.value = true;

  try {
    const params: any = {
      uploadId: formModel.uploadId,
    };

    if (formModel.needPassword && formModel.shareCode) {
      params.shareCode = formModel.shareCode;
    }

    if (formModel.expireHours !== -1) {
      params.expireHours = formModel.expireHours;
    }

    if (formModel.maxDownload !== -1) {
      params.maxDownload = formModel.maxDownload;
    }

    const { data } = await fetchCreateShare(params);

    shareResult.value = data;
    message.success($t('page.fileManager.createShareSuccess'));
  } catch (error: any) {
    const errorMsg = error?.response?.data?.msg || error?.message || '创建分享失败';
    message.error(errorMsg);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visible.value = false;
  formRef.value?.restoreValidation();
}

defineExpose({
  openModal,
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="分享文件" class="w-600px" @after-leave="handleClose">
    <div v-if="!shareResult">
      <NForm ref="formRef" :model="formModel" label-placement="left" label-width="120px">
        <NFormItem label="文件名">
          <div>{{ fileData?.fileName }}</div>
        </NFormItem>

        <NFormItem label="有效期（小时）" path="expireHours">
          <NInputNumber v-model:value="formModel.expireHours" placeholder="-1 表示永久有效" class="w-full" :min="-1" />
        </NFormItem>

        <NFormItem label="最大下载次数" path="maxDownload">
          <NInputNumber v-model:value="formModel.maxDownload" placeholder="-1 表示不限制" class="w-full" :min="-1" />
        </NFormItem>

        <NFormItem label="需要密码" path="needPassword">
          <NSwitch v-model:value="formModel.needPassword" />
        </NFormItem>

        <NFormItem v-if="formModel.needPassword" label="分享密码" path="shareCode">
          <NInput v-model:value="formModel.shareCode" placeholder="请输入4位分享密码" maxlength="4" />
        </NFormItem>
      </NForm>

      <NSpace justify="end" class="mt-4">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleCreate"> 创建分享 </NButton>
      </NSpace>
    </div>

    <div v-else class="share-result">
      <div class="mb-4">
        <div class="text-14px text-gray mb-2">分享链接：</div>
        <div class="flex items-center gap-2">
          <NInput :value="shareUrl" readonly />
          <NButton @click="copyToClipboard(shareUrl)">复制</NButton>
        </div>
      </div>

      <div v-if="shareResult.shareCode" class="mb-4">
        <div class="text-14px text-gray mb-2">提取码：</div>
        <div class="flex items-center gap-2">
          <NInput :value="shareResult.shareCode" readonly />
          <NButton @click="copyToClipboard(shareResult.shareCode)">复制</NButton>
        </div>
      </div>

      <div v-if="shareResult.expireTime" class="mb-4">
        <div class="text-14px text-gray">有效期至：{{ shareResult.expireTime }}</div>
      </div>

      <NButton type="primary" block @click="handleClose" class="mt-4"> 完成 </NButton>
    </div>
  </NModal>
</template>

<style scoped>
.share-result {
  padding: 20px;
  background: var(--n-color-target);
  border-radius: 8px;
}
</style>
