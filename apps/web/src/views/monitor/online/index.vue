<script setup lang="tsx">
import dayjs from 'dayjs';
import { fetchOnlineDelete, fetchOnlineFindAll } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useTable } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { getBrowserIcon, getOsIcon } from '@/utils/icon-tag-format';
import ButtonIcon from '@/components/custom/button-icon.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { $t } from '@/locales';
import OnlineSearch from './modules/online-search.vue';

defineOptions({
  name: 'OnlineList'
});

/** 搜索参数接口 */
interface SearchParams {
  pageNum: number;
  pageSize: number;
  userName: string | null;
  ipaddr: string | null;
}

const appStore = useAppStore();
const { hasAuth } = useAuth();

useDict('sys_common_status');
useDict('sys_device_type');

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchOnlineFindAll as any,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    // if you want to use the searchParams in Form, you need to define the following properties, and the value is null
    // the value can not be undefined, otherwise the property in Form will not be reactive
    userName: null,
    ipaddr: null
  },
  columns: () => [
    {
      key: 'userName',
      title: '用户账号',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'deviceType',
      title: '设备类型',
      align: 'center',
      minWidth: 120,
      render: row => {
        return (
          <DictTag
            size="small"
            value={(row as unknown as Api.Monitor.OnlineUser).deviceType}
            dict-code="sys_device_type"
          />
        );
      }
    },
    {
      key: 'ipaddr',
      title: '登录IP地址',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'loginLocation',
      title: '登录地点',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'browser',
      title: '浏览器类型',
      align: 'center',
      minWidth: 120,
      render: row => {
        const typedRow = row as unknown as Api.Monitor.OnlineUser;
        return (
          <div class="flex items-center justify-center gap-2">
            <SvgIcon icon={getBrowserIcon(typedRow.browser)} />
            {typedRow.browser}
          </div>
        );
      }
    },
    {
      key: 'os',
      title: '操作系统',
      align: 'center',
      ellipsis: {
        tooltip: true
      },
      minWidth: 120,
      render: row => {
        const typedRow = row as unknown as Api.Monitor.OnlineUser;
        const osName = typedRow.os?.split(' or ')[0] ?? '';
        return (
          <div class="flex items-center justify-center gap-2">
            <SvgIcon icon={getOsIcon(osName)} />
            {osName}
          </div>
        );
      }
    },
    {
      key: 'loginTime',
      title: '登录时间',
      align: 'center',
      ellipsis: {
        tooltip: true
      },
      minWidth: 120,
      render: row => {
        return dayjs((row as unknown as Api.Monitor.OnlineUser).loginTime).format('YYYY-MM-DD HH:mm:ss');
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: row => {
        const typedRow = row as unknown as Api.Monitor.OnlineUser;
        const forceLogoutBtn = () => {
          if (!hasAuth('monitor:online:forceLogout')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              class="text-20px"
              tooltipContent="强制下线"
              popconfirmContent="确认强制下线吗？"
              onPositiveClick={() => handleForceLogout(typedRow.tokenId)}
            />
          );
        };
        return <div>{forceLogoutBtn()}</div>;
      }
    }
  ]
});

async function handleForceLogout(tokenId: string) {
  // request
  try {
    await fetchOnlineDelete(tokenId);
    getData();
  } catch {
    // error handled by request interceptor
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <OnlineSearch
      :model="(searchParams as any)"
      @update:model="(v: any) => { searchParams = v; }"
      @reset="resetSearchParams"
      @search="getData"
    />
    <NCard title="在线用户列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="false"
          :show-delete="false"
          :show-export="false"
          @refresh="getData"
        />
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="(row: Api.Monitor.OnlineUser) => row.tokenId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
