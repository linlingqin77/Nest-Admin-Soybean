<script setup lang="ts">
import { h, ref } from 'vue';
import { NButton, NCard, NDataTable, NForm, NFormItem, NGi, NGrid, NInput, NSpin } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { useTableProps } from '@/hooks/common/table';
import {
  fetchClearCacheAll,
  fetchClearCacheKey,
  fetchClearCacheName,
  fetchGetCacheKeys,
  fetchGetCacheNames,
  fetchGetCacheValue,
} from '@/service/api/monitor/cache';

defineOptions({
  name: 'CacheList',
});

const { loading: namesLoading, startLoading: startNamesLoading, endLoading: endNamesLoading } = useLoading();
const { loading: keysLoading, startLoading: startKeysLoading, endLoading: endKeysLoading } = useLoading();

const tableProps = useTableProps();

// 缓存名称列表
const cacheNames = ref<Api.Monitor.CacheName[]>([]);
// 缓存键名列表
const cacheKeys = ref<{ key: string }[]>([]);
// 当前选中的缓存名称
const currentCacheName = ref('');
// 缓存内容表单
const cacheForm = ref({
  cacheName: '',
  cacheKey: '',
  cacheValue: '',
});

/** 获取缓存名称列表 */
async function getCacheNames() {
  startNamesLoading();
  try {
    const { data } = await fetchGetCacheNames();
    cacheNames.value = data || [];
  } catch {
    // error handled by request interceptor
  } finally {
    endNamesLoading();
  }
}

/** 刷新缓存名称列表 */
async function refreshCacheNames() {
  await getCacheNames();
  window.$message?.success('刷新缓存列表成功');
}

/** 获取缓存键名列表 */
async function getCacheKeys(cacheName: string) {
  if (!cacheName) return;

  currentCacheName.value = cacheName;
  startKeysLoading();
  try {
    const { data } = await fetchGetCacheKeys(cacheName);
    cacheKeys.value = (data || []).map((key) => ({ key }));
  } catch {
    // error handled by request interceptor
  } finally {
    endKeysLoading();
  }
}

/** 刷新缓存键名列表 */
async function refreshCacheKeys() {
  if (currentCacheName.value) {
    await getCacheKeys(currentCacheName.value);
    window.$message?.success('刷新键名列表成功');
  }
}

/** 获取缓存内容 */
async function handleCacheValue(cacheKey: string) {
  if (!currentCacheName.value || !cacheKey) return;

  try {
    const { data } = await fetchGetCacheValue(currentCacheName.value, cacheKey);
    if (data) {
      cacheForm.value = data;
    }
  } catch {
    // error handled by request interceptor
  }
}

/** 清理指定名称缓存 */
async function handleClearCacheName(cacheName: string) {
  try {
    await fetchClearCacheName(cacheName);
    window.$message?.success(`清理缓存名称[${cacheName}]成功`);
    await getCacheKeys(currentCacheName.value);
  } catch {
    // error handled by request interceptor
  }
}

/** 清理指定键名缓存 */
async function handleClearCacheKey(cacheKey: string) {
  try {
    await fetchClearCacheKey(cacheKey);
    window.$message?.success(`清理缓存键名[${cacheKey}]成功`);
    await getCacheKeys(currentCacheName.value);
  } catch {
    // error handled by request interceptor
  }
}

/** 清理全部缓存 */
async function handleClearCacheAll() {
  try {
    await fetchClearCacheAll();
    window.$message?.success('清理全部缓存成功');
    cacheForm.value = {
      cacheName: '',
      cacheKey: '',
      cacheValue: '',
    };
    cacheKeys.value = [];
  } catch {
    // error handled by request interceptor
  }
}

/** 缓存名称列去除冒号 */
function nameFormatter(cacheName: string) {
  return cacheName.replace(':', '');
}

/** 缓存键名去除前缀 */
function keyFormatter(cacheKey: string) {
  return cacheKey.replace(currentCacheName.value, '');
}

// 缓存名称列配置
const nameColumns: DataTableColumns<Api.Monitor.CacheName> = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    render: (_row, index) => index + 1,
  },
  {
    title: '缓存名称',
    key: 'cacheName',
    align: 'center',
    ellipsis: { tooltip: true },
    render: (row) => nameFormatter(row.cacheName),
  },
  {
    title: '备注',
    key: 'remark',
    align: 'center',
    ellipsis: { tooltip: true },
  },
  {
    title: '操作',
    key: 'actions',
    width: 60,
    align: 'center',
    render: (row) =>
      h(
        NButton,
        {
          text: true,
          type: 'error',
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            handleClearCacheName(row.cacheName);
          },
        },
        { default: () => '删除' },
      ),
  },
];

// 缓存键名列配置
const keyColumns: DataTableColumns<{ key: string }> = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    render: (_row, index) => index + 1,
  },
  {
    title: '缓存键名',
    key: 'key',
    align: 'center',
    ellipsis: { tooltip: true },
    render: (row) => keyFormatter(row.key),
  },
  {
    title: '操作',
    key: 'actions',
    width: 60,
    align: 'center',
    render: (row) =>
      h(
        NButton,
        {
          text: true,
          type: 'error',
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            handleClearCacheKey(row.key);
          },
        },
        { default: () => '删除' },
      ),
  },
];

// 处理缓存名称行点击
function handleNameRowClick(row: Api.Monitor.CacheName) {
  getCacheKeys(row.cacheName);
}

// 处理缓存键名行点击
function handleKeyRowClick(row: { key: string }) {
  handleCacheValue(row.key);
}

// 为 NDataTable 提供 row-props
function handleNameRowProps(row: Api.Monitor.CacheName) {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      handleNameRowClick(row);
    },
  };
}

function handleKeyRowProps(row: { key: string }) {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      handleKeyRowClick(row);
    },
  };
}

// 初始化
getCacheNames();
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <NGrid :x-gap="12" :y-gap="12" :cols="24" responsive="screen" item-responsive>
      <!-- 缓存名称列表 -->
      <NGi span="24 m:8">
        <NCard title="缓存列表" :bordered="false" size="small" class="h-full">
          <template #header-extra>
            <NButton text type="primary" @click="refreshCacheNames">
              <template #icon>
                <icon-material-symbols:refresh-rounded />
              </template>
            </NButton>
          </template>
          <NSpin :show="namesLoading">
            <NDataTable
              :columns="nameColumns"
              :data="cacheNames"
              :max-height="500"
              :row-key="(row: Api.Monitor.CacheName) => row.cacheName"
              :row-props="handleNameRowProps"
              v-bind="tableProps"
            />
          </NSpin>
        </NCard>
      </NGi>

      <!-- 键名列表 -->
      <NGi span="24 m:8">
        <NCard title="键名列表" :bordered="false" size="small" class="h-full">
          <template #header-extra>
            <NButton text type="primary" @click="refreshCacheKeys">
              <template #icon>
                <icon-material-symbols:refresh-rounded />
              </template>
            </NButton>
          </template>
          <NSpin :show="keysLoading">
            <NDataTable
              :columns="keyColumns"
              :data="cacheKeys"
              :max-height="500"
              :row-key="(row: { key: string }) => row.key"
              :row-props="handleKeyRowProps"
              v-bind="tableProps"
            />
          </NSpin>
        </NCard>
      </NGi>

      <!-- 缓存内容 -->
      <NGi span="24 m:8">
        <NCard title="缓存内容" :bordered="false" size="small" class="h-full">
          <template #header-extra>
            <NButton text type="error" @click="handleClearCacheAll">
              <template #icon>
                <icon-material-symbols:delete-outline />
              </template>
              清理全部
            </NButton>
          </template>
          <NForm label-placement="left" label-width="80px">
            <NFormItem label="缓存名称">
              <NInput v-model:value="cacheForm.cacheName" readonly placeholder="" />
            </NFormItem>
            <NFormItem label="缓存键名">
              <NInput v-model:value="cacheForm.cacheKey" readonly placeholder="" />
            </NFormItem>
            <NFormItem label="缓存内容">
              <NInput v-model:value="cacheForm.cacheValue" type="textarea" :rows="12" readonly placeholder="" />
            </NFormItem>
          </NForm>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped></style>
