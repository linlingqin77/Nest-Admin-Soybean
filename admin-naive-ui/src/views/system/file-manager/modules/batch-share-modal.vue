<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NButton,
  NSpace,
  NList,
  NListItem,
  useMessage,
} from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';
import { fetchCreateShare } from '@/service/api';
import { $t } from '@/locales';

const message = useMessage();
const themeStore = useThemeStore();
const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const loading = ref(false);
const uploadIds = ref<string[]>([]);
const shareResults = ref<any[]>([]);
const formRef = ref();

const formModel = reactive({
  expireHours: 24,
  maxDownload: -1,
  needPassword: false,
  password: '',
});

async function openModal(fileIds: string[]) {
  uploadIds.value = fileIds;
  visible.value = true;
  shareResults.value = [];

  Object.assign(formModel, {
    expireHours: 24,
    maxDownload: -1,
    needPassword: false,
    password: '',
  });
}

async function handleCreateShares() {
  loading.value = true;
  try {
    const params: any = {};

    if (formModel.needPassword) {
      params.password = formModel.password;
    }

    if (formModel.expireHours > 0) {
      const expireTime = new Date();
      expireTime.setHours(expireTime.getHours() + formModel.expireHours);
      params.expireTime = expireTime.toISOString();
    }

    if (formModel.maxDownload > 0) {
      params.maxDownload = formModel.maxDownload;
    }

    // 批量创建分享
    const promises = uploadIds.value.map((uploadId) => fetchCreateShare({ ...params, uploadId }));

    const results = await Promise.allSettled(promises);

    shareResults.value = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          success: true,
          uploadId: uploadIds.value[index],
          data: result.value.data,
        };
      } else {
        return {
          success: false,
          uploadId: uploadIds.value[index],
          error: result.reason,
        };
      }
    });

    const successCount = shareResults.value.filter((r) => r.success).length;
    message.success($t('page.fileManager.batchShareSuccess', { count: successCount }));

    if (successCount < uploadIds.value.length) {
      message.warning($t('page.fileManager.batchSharePartialFailed', { count: uploadIds.value.length - successCount }));
    }
  } catch (error) {
    message.error($t('page.fileManager.batchShareFailed'));
  } finally {
    loading.value = false;
  }
}

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

function handleClose() {
  visible.value = false;
  shareResults.value = [];
  formRef.value?.restoreValidation();
}

defineExpose({
  openModal,
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="批量分享" class="w-700px" @after-leave="handleClose">
    <div v-if="shareResults.length === 0">
      <NForm ref="formRef" :model="formModel" label-placement="left" label-width="120px">
        <NFormItem label="有效期（小时）" path="expireHours">
          <NInputNumber v-model:value="formModel.expireHours" placeholder="-1 表示永久有效" class="w-full" :min="-1" />
        </NFormItem>

        <NFormItem label="最大下载次数" path="maxDownload">
          <NInputNumber v-model:value="formModel.maxDownload" placeholder="-1 表示不限制" class="w-full" :min="-1" />
        </NFormItem>

        <NFormItem label="需要密码" path="needPassword">
          <NSwitch v-model:value="formModel.needPassword" />
        </NFormItem>

        <NFormItem v-if="formModel.needPassword" label="分享密码" path="password">
          <NInput v-model:value="formModel.password" placeholder="请输入4位分享密码" maxlength="4" />
        </NFormItem>
      </NForm>

      <div class="text-14px text-gray mb-4">将为 {{ uploadIds.length }} 个文件创建分享链接</div>

      <NSpace justify="end" class="mt-4">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleCreateShares"> 批量创建分享 </NButton>
      </NSpace>
    </div>

    <div v-else class="share-results">
      <NList bordered>
        <NListItem v-for="(result, index) in shareResults" :key="index">
          <template v-if="result.success">
            <div class="w-full">
              <div class="font-bold mb-2">文件 {{ index + 1 }}</div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-14px text-gray">链接：</span>
                <NInput
                  :value="`${window.location.origin}/share/${result.data.shareId}`"
                  readonly
                  :size="themeStore.componentSize"
                />
                <NButton
                  :size="themeStore.componentSize"
                  @click="copyToClipboard(`${window.location.origin}/share/${result.data.shareId}`)"
                >
                  复制
                </NButton>
              </div>
              <div v-if="result.data.shareCode" class="flex items-center gap-2">
                <span class="text-14px text-gray">提取码：</span>
                <NInput :value="result.data.shareCode" readonly :size="themeStore.componentSize" class="w-100px" />
                <NButton :size="themeStore.componentSize" @click="copyToClipboard(result.data.shareCode)">
                  复制
                </NButton>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="text-error">文件 {{ index + 1 }} 分享失败</div>
          </template>
        </NListItem>
      </NList>

      <NButton type="primary" block @click="handleClose" class="mt-4"> 完成 </NButton>
    </div>
  </NModal>
</template>

<style scoped>
.share-results {
  max-height: 500px;
  overflow-y: auto;
}
</style>
