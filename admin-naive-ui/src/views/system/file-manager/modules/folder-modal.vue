<script setup lang="ts">
import { ref, reactive } from 'vue';
import { NModal, NCard, NForm, NFormItem, NInput, NInputNumber, NButton, NSpace, useMessage } from 'naive-ui';
import { fetchCreateFolder, fetchUpdateFolder } from '@/service/api';
import { $t } from '@/locales';

const message = useMessage();
const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const loading = ref(false);
const modalType = ref<'add' | 'edit'>('add');

const formRef = ref();
const formModel = reactive({
  folderId: 0,
  parentId: 0,
  folderName: '',
  orderNum: 0,
  remark: '',
});

const rules = {
  folderName: [{ required: true, message: '请输入文件夹名称', trigger: 'blur' }],
};

function openModal(typeOrParentId: 'add' | 'edit' | number, data?: any) {
  // 支持直接传入 parentId (number) 或传统的 type + data 参数
  if (typeof typeOrParentId === 'number') {
    modalType.value = 'add';
    visible.value = true;
    Object.assign(formModel, {
      folderId: 0,
      parentId: typeOrParentId,
      folderName: '',
      orderNum: 0,
      remark: '',
    });
  } else {
    modalType.value = typeOrParentId;
    visible.value = true;

    if (typeOrParentId === 'add') {
      Object.assign(formModel, {
        folderId: 0,
        parentId: data?.parentId || 0,
        folderName: '',
        orderNum: 0,
        remark: '',
      });
    } else if (typeOrParentId === 'edit' && data) {
      Object.assign(formModel, data);
    }
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;

  try {
    if (modalType.value === 'add') {
      // 创建时不发送 folderId
      const { folderId, ...createData } = formModel;
      await fetchCreateFolder(createData);
      message.success($t('common.addSuccess'));
    } else {
      await fetchUpdateFolder(formModel);
      message.success($t('common.updateSuccess'));
    }

    visible.value = false;
    emit('success');
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
  <NModal
    v-model:show="visible"
    preset="card"
    :title="modalType === 'add' ? '新建文件夹' : '编辑文件夹'"
    class="w-600px"
    @after-leave="handleClose"
  >
    <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left" label-width="100px">
      <NFormItem label="文件夹名称" path="folderName">
        <NInput v-model:value="formModel.folderName" placeholder="请输入文件夹名称" />
      </NFormItem>

      <NFormItem label="排序" path="orderNum">
        <NInputNumber v-model:value="formModel.orderNum" placeholder="请输入排序" class="w-full" />
      </NFormItem>

      <NFormItem label="备注" path="remark">
        <NInput v-model:value="formModel.remark" type="textarea" placeholder="请输入备注" :rows="3" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit"> 确定 </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
