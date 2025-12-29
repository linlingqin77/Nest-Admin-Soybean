<script setup lang="tsx">
import { NButton, NDivider } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import {
  fetchBatchDeleteGenTable,
  fetchGenCode,
  fetchGetGenTableList,
  fetchSynchGenDbList,
} from '@/service/api/tool';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { useDownload } from '@/hooks/business/download';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import GenTableSearch from './modules/gen-table-search.vue';
import GenTableImportDrawer from './modules/gen-table-import-drawer.vue';
import GenTableOperateDrawer from './modules/gen-table-operate-drawer.vue';
import GenTablePreviewDrawer from './modules/gen-table-preview-drawer.vue';
import GenTemplateModal from './modules/gen-template-modal.vue';

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { zip } = useDownload();
const { bool: importVisible, setTrue: openImportVisible } = useBoolean();
const { bool: previewVisible, setTrue: openPreviewVisible } = useBoolean();
const { bool: templateVisible, setTrue: openTemplateVisible } = useBoolean();

const tableProps = useTableProps();

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable({
  apiFn: fetchGetGenTableList,
  showTotal: true,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    tableName: null,
    tableComment: null,
    params: {},
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
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
      key: 'className',
      title: '实体类名',
      align: 'center',
      minWidth: 120,
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 150,
    },
    {
      key: 'updateTime',
      title: '更新时间',
      align: 'center',
      minWidth: 150,
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 300,
      render: (row) => {
        const previewBtn = () => {
          return (
            <ButtonIcon
              type="primary"
              text
              icon="material-symbols:visibility-outline"
              tooltipContent="预览"
              onClick={() => handlePreview(row.tableId!)}
            />
          );
        };

        const editBtn = () => {
          return (
            <ButtonIcon
              type="primary"
              text
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => edit(row.tableId!)}
            />
          );
        };

        const refreshBtn = () => {
          return (
            <ButtonIcon
              type="primary"
              text
              icon="material-symbols:sync-outline"
              tooltipContent="同步"
              onClick={() => refresh(row.tableId!)}
            />
          );
        };

        const genCodeBtn = () => {
          return (
            <ButtonIcon
              type="primary"
              text
              icon="material-symbols:download-rounded"
              tooltipContent="生成代码"
              onClick={() => handleGenCode(row)}
            />
          );
        };

        const deleteBtn = () => {
          return (
            <ButtonIcon
              type="error"
              text
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(row.tableId!)}
            />
          );
        };

        const buttons = [];
        if (hasAuth('tool:gen:preview')) buttons.push(previewBtn());
        if (hasAuth('tool:gen:edit')) buttons.push(editBtn());
        if (hasAuth('tool:gen:edit')) buttons.push(refreshBtn());
        if (hasAuth('tool:gen:code')) buttons.push(genCodeBtn());
        if (hasAuth('tool:gen:remove')) buttons.push(deleteBtn());

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>
                {index !== 0 && <NDivider vertical />}
                {btn}
              </>
            ))}
          </div>
        );
      },
    },
  ],
});

const {
  drawerVisible,
  editingData,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  try {
    await fetchBatchDeleteGenTable(checkedRowKeys.value);
    onBatchDeleted();
  } catch {
    // error handled by request interceptor
  }
}

async function handleDelete(id: CommonType.IdType) {
  try {
    await fetchBatchDeleteGenTable([id]);
    onDeleted();
  } catch {
    // error handled by request interceptor
  }
}

function edit(id: CommonType.IdType) {
  handleEdit('tableId', id);
}

async function refresh(id: CommonType.IdType) {
  try {
    await fetchSynchGenDbList(id);
    window.$message?.success('同步成功');
    getData();
  } catch {
    // error handled by request interceptor
  }
}

function handleImport() {
  openImportVisible();
}

function handlePreview(id: CommonType.IdType) {
  const findItem = data.value.find((item) => item.tableId === id) || null;
  editingData.value = jsonClone(findItem);
  openPreviewVisible();
}

async function handleGenCode(row?: Api.Tool.GenTable) {
  const tableNames = row?.tableName || checkedRowKeys.value.map(id => {
    const item = data.value.find(d => d.tableId === id);
    return item?.tableName;
  }).filter(Boolean).join(',');
  
  if (!tableNames || tableNames === '') {
    window.$message?.error('请选择要生成的数据');
    return;
  }

  if (row?.genType === 'PATH') {
    try {
      await fetchGenCode(row.tableName);
      window.$message?.success('生成成功');
    } catch {
      // error handled by request interceptor
    }
  } else {
    zip(`/tool/gen/batchGenCode?tables=${tableNames}`, `code-${row?.tableName ? row.className : Date.now()}.zip`);
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <GenTableSearch
      v-model:model="searchParams"
      @reset="resetSearchParams"
      @search="getDataByPage"
    />
    <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />
    <NCard title="代码生成" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="false"
          @delete="handleBatchDelete"
          @refresh="getData"
        >
          <template #prefix>
            <NButton
              v-if="hasAuth('tool:gen:code')"
              :disabled="checkedRowKeys.length === 0"
              size="small"
              ghost
              type="primary"
              @click="() => handleGenCode()"
            >
              <template #icon>
                <icon-material-symbols:download-rounded class="text-icon" />
              </template>
              生成代码
            </NButton>
            <NButton v-if="hasAuth('tool:gen:import')" size="small" ghost type="primary" @click="handleImport">
              <template #icon>
                <icon-material-symbols:upload-rounded class="text-icon" />
              </template>
              导入
            </NButton>
            <NButton size="small" ghost type="info" @click="openTemplateVisible">
              <template #icon>
                <icon-material-symbols:code class="text-icon" />
              </template>
              模板管理
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        v-bind="tableProps"
        :flex-height="!appStore.isMobile"
        :scroll-x="1200"
        :loading="loading"
        remote
        :row-key="(row) => row.tableId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <GenTableImportDrawer v-model:visible="importVisible" @submitted="getData" />
      <GenTableOperateDrawer v-model:visible="drawerVisible" :row-data="editingData" @submitted="getData" />
      <GenTablePreviewDrawer
        v-model:visible="previewVisible"
        :row-data="editingData"
        @submitted="() => handleGenCode(editingData!)"
      />
      <GenTemplateModal v-model:visible="templateVisible" />
    </NCard>
  </div>
</template>

<style scoped></style>
