<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NDivider } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import { fetchCleanJobLog, fetchDeleteJobLog, fetchGetJobLogList } from '@/service/api/monitor/job-log';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import ButtonIcon from '@/components/custom/button-icon.vue';
import { $t } from '@/locales';
import DictTag from '@/components/custom/dict-tag.vue';
import JobLogSearch from './modules/job-log-search.vue';
import JobLogDetailDrawer from './modules/job-log-detail-drawer.vue';

defineOptions({
  name: 'JobLogList',
});

useDict('sys_job_group');
useDict('sys_common_status');

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { download } = useDownload();
const route = useRoute();
const router = useRouter();

const tableProps = useTableProps();

const { bool: detailVisible, setTrue: openDetailDrawer } = useBoolean();
const detailData = ref<Api.Monitor.JobLog | null>(null);

// 从路由参数获取初始搜索条件
const initialJobName = (route.query.jobName as string) || null;
const initialJobGroup = (route.query.jobGroup as string) || null;

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
  apiFn: fetchGetJobLogList,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    jobName: initialJobName,
    jobGroup: initialJobGroup,
    status: null,
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
      key: 'jobName',
      title: '任务名称',
      align: 'center',
      minWidth: 120,
      ellipsis: { tooltip: true },
    },
    {
      key: 'jobGroup',
      title: '任务组名',
      align: 'center',
      width: 100,
      render(row) {
        return <DictTag value={row.jobGroup} dictCode="sys_job_group" />;
      },
    },
    {
      key: 'invokeTarget',
      title: '调用目标字符串',
      align: 'center',
      minWidth: 200,
      ellipsis: { tooltip: true },
    },
    {
      key: 'jobMessage',
      title: '日志信息',
      align: 'center',
      minWidth: 150,
      ellipsis: { tooltip: true },
    },
    {
      key: 'status',
      title: '执行状态',
      align: 'center',
      width: 100,
      render(row) {
        return <DictTag value={row.status} dictCode="sys_common_status" />;
      },
    },
    {
      key: 'createTime',
      title: '执行时间',
      align: 'center',
      width: 160,
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 100,
      render: (row) => {
        const viewBtn = () => (
          <ButtonIcon
            text
            type="primary"
            icon="material-symbols:visibility-outline"
            tooltipContent="详情"
            onClick={() => handleView(row)}
          />
        );

        const deleteBtn = () => (
          <ButtonIcon
            text
            type="error"
            icon="material-symbols:delete-outline"
            tooltipContent={$t('common.delete')}
            popconfirmContent={$t('common.confirmDelete')}
            onPositiveClick={() => handleDelete(row.jobLogId!)}
          />
        );

        const buttons = [];
        if (hasAuth('monitor:job:query')) buttons.push(viewBtn());
        if (hasAuth('monitor:job:remove')) buttons.push(deleteBtn());

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

const { checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(data, getData);

async function handleBatchDelete() {
  try {
    await fetchDeleteJobLog(checkedRowKeys.value);
    onBatchDeleted();
  } catch {
    // 错误消息已在请求工具中显示
  }
}

async function handleDelete(jobLogId: CommonType.IdType) {
  try {
    await fetchDeleteJobLog(jobLogId);
    onDeleted();
  } catch {
    // 错误消息已在请求工具中显示
  }
}

async function handleClean() {
  window.$dialog?.warning({
    title: '提示',
    content: '确认要清空所有调度日志吗?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await fetchCleanJobLog();
        window.$message?.success('清空成功');
        getData();
      } catch {
        // 错误消息已在请求工具中显示
      }
    },
  });
}

function handleView(row: Api.Monitor.JobLog) {
  detailData.value = jsonClone(row);
  openDetailDrawer();
}

function handleExport() {
  download('/monitor/jobLog/export', searchParams, `调度日志_${new Date().getTime()}.xlsx`);
}

function handleClose() {
  router.back();
}

onMounted(() => {
  // 如果有初始参数，触发搜索
  if (initialJobName || initialJobGroup) {
    getDataByPage();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <JobLogSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard title="调度日志" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="false"
          :show-delete="hasAuth('monitor:job:remove')"
          :show-export="hasAuth('monitor:job:export')"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        >
          <template #after>
            <NButton v-if="hasAuth('monitor:job:remove')" size="small" type="error" ghost @click="handleClean">
              <template #icon>
                <icon-material-symbols:delete-sweep-outline class="text-icon" />
              </template>
              清空
            </NButton>
            <NButton size="small" ghost @click="handleClose">
              <template #icon>
                <icon-material-symbols:close class="text-icon" />
              </template>
              关闭
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
        :scroll-x="1000"
        :loading="loading"
        remote
        :row-key="(row) => row.jobLogId"
        :pagination="mobilePagination"
        class="h-full"
      />
      <JobLogDetailDrawer v-model:visible="detailVisible" :row-data="detailData" />
    </NCard>
  </div>
</template>

<style scoped></style>
