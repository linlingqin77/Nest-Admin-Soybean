<script setup lang="tsx">
import { NDivider, NTag } from 'naive-ui';
import { fetchDataSourceDelete, fetchDataSourceList, fetchDataSourceTestConnectionById } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import DataSourceSearch from './modules/datasource-search.vue';
import DataSourceOperateDrawer from './modules/datasource-operate-drawer.vue';

defineOptions({
  name: 'DataSourceList'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

const tableProps = useTableProps();

// 数据库类型映射
const dbTypeMap: Record<string, { label: string; color: string }> = {
  postgresql: { label: 'PostgreSQL', color: '#336791' },
  mysql: { label: 'MySQL', color: '#4479A1' },
  sqlite: { label: 'SQLite', color: '#003B57' }
};

// 状态映射
const statusMap: Record<string, { label: string; type: 'success' | 'error' }> = {
  '0': { label: '正常', type: 'success' },
  '1': { label: '停用', type: 'error' }
};

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchDataSourceList as any,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    type: null,
    status: null
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64
    },
    {
      key: 'name',
      title: '数据源名称',
      align: 'center',
      minWidth: 150
    },
    {
      key: 'type',
      title: '数据库类型',
      align: 'center',
      width: 120,
      render: row => {
        const dataRow = row as unknown as Api.Tool.DataSource;
        const typeInfo = dbTypeMap[dataRow.type] || { label: dataRow.type, color: '#666' };
        return (
          <NTag size="small" style={{ backgroundColor: typeInfo.color, color: '#fff' }}>
            {typeInfo.label}
          </NTag>
        );
      }
    },
    {
      key: 'host',
      title: '主机地址',
      align: 'center',
      minWidth: 150,
      render: row => {
        const dataRow = row as unknown as Api.Tool.DataSource;
        return `${dataRow.host}:${dataRow.port}`;
      }
    },
    {
      key: 'database',
      title: '数据库名',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'username',
      title: '用户名',
      align: 'center',
      minWidth: 100
    },
    {
      key: 'status',
      title: '状态',
      align: 'center',
      width: 80,
      render: row => {
        const dataRow = row as unknown as Api.Tool.DataSource;
        const statusInfo = statusMap[dataRow.status] || { label: '未知', type: 'error' as const };
        return (
          <NTag size="small" type={statusInfo.type}>
            {statusInfo.label}
          </NTag>
        );
      }
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 160
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
      render: row => {
        const dataRow = row as unknown as Api.Tool.DataSource;
        const testBtn = () => {
          if (!hasAuth('tool:gen:datasource:test')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:link"
              tooltipContent="测试连接"
              onClick={() => handleTestConnection(dataRow.id as number)}
            />
          );
        };

        const editBtn = () => {
          if (!hasAuth('tool:gen:datasource:edit')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => edit(dataRow.id as number)}
            />
          );
        };

        const deleteBtn = () => {
          if (!hasAuth('tool:gen:datasource:remove')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(dataRow.id as number)}
            />
          );
        };

        const buttons = [testBtn(), editBtn(), deleteBtn()].filter(Boolean);

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
      }
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data as any, getData);

async function handleBatchDelete() {
  try {
    // 并行删除所有选中的数据源
    await Promise.all(checkedRowKeys.value.map(id => fetchDataSourceDelete(Number(id))));
    onBatchDeleted();
  } catch {
    // error handled by request interceptor
  }
}

async function handleDelete(id: number) {
  try {
    await fetchDataSourceDelete(id);
    onDeleted();
  } catch {
    // error handled by request interceptor
  }
}

function edit(id: number) {
  handleEdit('id' as any, id);
}

async function handleTestConnection(id: number) {
  try {
    const { data: result } = await fetchDataSourceTestConnectionById(id);
    if (result) {
      window.$message?.success('连接成功');
    } else {
      window.$message?.error('连接失败');
    }
  } catch {
    // error handled by request interceptor
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <DataSourceSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard title="数据源管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('tool:gen:datasource:add')"
          :show-delete="hasAuth('tool:gen:datasource:remove')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        v-bind="tableProps"
        :flex-height="!appStore.isMobile"
        :scroll-x="1100"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <DataSourceOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="(editingData as unknown as Api.Tool.DataSource)"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
