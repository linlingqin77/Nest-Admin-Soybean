<script setup lang="tsx">
import { NButton } from 'naive-ui';
import { fetchOperlogClean, fetchOperlogFindAll, fetchOperlogRemove } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import DictTag from '@/components/custom/dict-tag.vue';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import OperLogViewDrawer from './modules/oper-log-view-drawer.vue';
import OperLogSearch from './modules/oper-log-search.vue';

defineOptions({
  name: 'OperLogList'
});

/** 搜索参数接口 */
interface SearchParams {
  pageNum: number;
  pageSize: number;
  title: string | null;
  businessType: number | null;
  operName: string | null;
  operIp: string | null;
  status: string | null;
  params: { beginTime?: string; endTime?: string };
}

useDict('sys_common_status');
useDict('sys_oper_type');

const appStore = useAppStore();
const { download } = useDownload();
const { hasAuth } = useAuth();

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
  resetSearchParams
} = useTable({
  apiFn: fetchOperlogFindAll as any,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    // if you want to use the searchParams in Form, you need to define the following properties, and the value is null
    // the value can not be undefined, otherwise the property in Form will not be reactive
    title: null,
    businessType: null,
    operName: null,
    operIp: null,
    status: null,
    params: {}
  } as SearchParams,
  columns: (() => [
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
      key: 'title',
      title: '系统模块',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'businessType',
      title: '操作类型',
      align: 'center',
      minWidth: 120,
      render: (row: Api.Monitor.OperLog) => {
        return <DictTag size="small" value={row.businessType} dictCode="sys_oper_type" />;
      }
    },
    {
      key: 'operName',
      title: '操作人员',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'operIp',
      title: '操作IP',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'operLocation',
      title: '操作地点',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'status',
      title: '操作状态',
      align: 'center',
      minWidth: 120,
      render: (row: Api.Monitor.OperLog) => {
        return <DictTag size="small" value={row.status} dictCode="sys_common_status" />;
      }
    },
    {
      key: 'operTime',
      title: '操作时间',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'costTime',
      title: '消耗时间',
      align: 'center',
      minWidth: 120,
      render: (row: Api.Monitor.OperLog) => {
        return `${row.costTime} ms`;
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: (row: Api.Monitor.OperLog) => {
        const viewBtn = () => {
          return (
            <ButtonIcon
              type="primary"
              text
              icon="material-symbols:visibility-outline"
              tooltipContent="详情"
              onClick={() => view(row.operId!)}
            />
          );
        };
        return <div class="flex-center gap-8px">{viewBtn()}</div>;
      }
    }
  ]) as any
});

const { drawerVisible, editingData, handleEdit, checkedRowKeys, onBatchDeleted } = useTableOperate(
  data as any,
  getData
);

async function handleBatchDelete() {
  // request
  try {
    await fetchOperlogRemove(checkedRowKeys.value.join(','));
    onBatchDeleted();
  } catch {
    // error handled by request interceptor
  }
}

async function view(operId: CommonType.IdType) {
  handleEdit('operId' as any, operId);
}

async function handleExport() {
  download('/monitor/operlog/export', searchParams, `操作日志_${new Date().getTime()}.xlsx`);
}

async function handleCleanOperLog() {
  window.$dialog?.error({
    title: '提示',
    content: '是否确认清空所有操作日志数据项?',
    positiveText: '确认清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await fetchOperlogClean();
        window.$message?.success('清空成功');
        await getData();
      } catch {
        // error handled by request interceptor
      }
    }
  });
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <OperLogSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard title="操作日志列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="false"
          :show-delete="hasAuth('monitor:operlog:remove')"
          :show-export="hasAuth('monitor:operlog:export')"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        >
          <template #prefix>
            <NButton
              v-if="hasAuth('monitor:operlog:remove')"
              type="error"
              ghost
              size="small"
              @click="handleCleanOperLog"
            >
              <template #icon>
                <icon-material-symbols:warning-outline-rounded />
              </template>
              清空
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
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.operId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <OperLogViewDrawer v-model:visible="drawerVisible" :row-data="editingData as Api.Monitor.OperLog" />
    </NCard>
  </div>
</template>

<style scoped></style>
