<script setup lang="tsx">
import { watch } from 'vue';
import { fetchGetGenDbList, fetchImportGenTable } from '@/service/api/tool';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { $t } from '@/locales';
import GenTableDbSearch from './gen-table-db-search.vue';

defineOptions({
  name: 'GenTableImportDrawer',
});

const visible = defineModel<boolean>('visible', {
  default: false,
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const appStore = useAppStore();

const tableProps = useTableProps();

const { columns, data, getData, getDataByPage, loading, mobilePagination, searchParams } = useTable({
  apiFn: fetchGetGenDbList,
  immediate: false,
  showTotal: true,
  apiParams: {
    pageNum: 1,
    pageSize: 15,
    tableName: null,
    tableComment: null,
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 52,
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64,
    },
    {
      key: 'tableName',
      title: '表名称',
      align: 'center',
      minWidth: 150,
    },
    {
      key: 'tableComment',
      title: '表描述',
      align: 'center',
      minWidth: 150,
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 150,
    },
  ],
});

const { checkedRowKeys } = useTableOperate(data, getData);

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  if (checkedRowKeys.value.length > 0) {
    try {
      await fetchImportGenTable(checkedRowKeys.value as string[]);
      window.$message?.success('导入成功');
      emit('submitted');
    } catch {
      // error handled by request interceptor
    }
  }
  closeDrawer();
}

async function handleResetSearchParams() {
  searchParams.tableName = null;
  searchParams.tableComment = null;
  data.value = [];
  checkedRowKeys.value = [];
  await getDataByPage();
}

watch(visible, async () => {
  if (visible.value) {
    await handleResetSearchParams();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent title="导入表" :native-scrollbar="false" closable>
      <div class="h-full flex-col">
        <GenTableDbSearch
          v-model:model="searchParams"
          @reset="handleResetSearchParams"
          @search="getDataByPage"
        />
        <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" class="mb-16px" />
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          size="small"
          :flex-height="!appStore.isMobile"
          :scroll-x="600"
          :loading="loading"
          remote
          :row-key="(row) => row.tableName"
          :pagination="mobilePagination"
          class="flex-1"
        />
      </div>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  height: 100%;
}
</style>
