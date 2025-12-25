<script setup lang="ts">
import { ref, reactive } from 'vue';
import { NModal, NCard, NForm, NFormItem, NTree, NButton, NSpace, useMessage } from 'naive-ui';
import type { TreeOption } from 'naive-ui';
import { fetchGetFolderTree, fetchMoveFiles } from '@/service/api';
import { $t } from '@/locales';

const message = useMessage();
const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const loading = ref(false);
const uploadIds = ref<string[]>([]);
const selectedFolderId = ref<number | null>(null);
const treeData = ref<TreeOption[]>([]);

const formRef = ref();

function buildTreeData(folders: any[]): TreeOption[] {
  const rootFolders = folders.filter((f) => f.parentId === 0);

  function buildChildren(parentId: number): TreeOption[] {
    const children = folders.filter((f) => f.parentId === parentId);
    return children.map((folder) => ({
      key: folder.folderId,
      label: folder.folderName,
      children: buildChildren(folder.folderId),
    }));
  }

  return [
    {
      key: 0,
      label: '全部文件',
      children: rootFolders.map((folder) => ({
        key: folder.folderId,
        label: folder.folderName,
        children: buildChildren(folder.folderId),
      })),
    },
  ];
}

async function openModal(fileIds: string[]) {
  uploadIds.value = fileIds;
  visible.value = true;
  selectedFolderId.value = null;

  // 加载文件夹树
  try {
    const { data } = await fetchGetFolderTree();
    treeData.value = buildTreeData(data || []);
  } catch (error) {
    message.error($t('page.fileManager.loadFoldersFailed'));
  }
}

async function handleMove() {
  if (selectedFolderId.value === null) {
    message.warning($t('page.fileManager.selectTargetFolder'));
    return;
  }

  loading.value = true;
  try {
    await fetchMoveFiles({
      uploadIds: uploadIds.value,
      targetFolderId: selectedFolderId.value,
    });

    message.success($t('page.fileManager.moveSuccess'));
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error($t('page.fileManager.moveFailed'));
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visible.value = false;
  selectedFolderId.value = null;
  formRef.value?.restoreValidation();
}

function handleUpdateSelectedKeys(keys: Array<string | number>) {
  if (keys.length > 0) {
    selectedFolderId.value = keys[0] as number;
  }
}

defineExpose({
  openModal,
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="移动文件" class="w-600px" @after-leave="handleClose">
    <NForm ref="formRef" label-placement="top">
      <NFormItem label="选择目标文件夹">
        <NTree
          :data="treeData"
          block-line
          selectable
          :selected-keys="selectedFolderId !== null ? [selectedFolderId] : []"
          @update:selected-keys="handleUpdateSelectedKeys"
          class="file-tree"
        />
      </NFormItem>

      <div class="text-14px text-gray mb-4">将移动 {{ uploadIds.length }} 个文件</div>
    </NForm>

    <NSpace justify="end" class="mt-4">
      <NButton @click="handleClose">取消</NButton>
      <NButton type="primary" :loading="loading" @click="handleMove"> 确定移动 </NButton>
    </NSpace>
  </NModal>
</template>

<style scoped>
.file-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  padding: 8px;
}
</style>
