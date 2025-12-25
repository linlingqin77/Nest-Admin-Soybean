<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NCard, NDataTable, NDescriptions, NDescriptionsItem, NGrid, NGridItem, NProgress, NSpin } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { useTableProps } from '@/hooks/common/table';
import { fetchGetServerInfo } from '@/service/api/monitor/server';

defineOptions({
  name: 'ServerMonitor',
});

const { loading, startLoading, endLoading } = useLoading();
const serverInfo = ref<Api.Monitor.ServerInfo>();

const tableProps = useTableProps();

async function getServerInfo() {
  startLoading();
  try {
    const { data } = await fetchGetServerInfo();
    serverInfo.value = data;
  } catch {
    // error handled by request interceptor
  } finally {
    endLoading();
  }
}

// 磁盘表格列配置
const diskColumns = [
  { title: '盘符路径', key: 'dirName', align: 'center' as const },
  { title: '文件系统', key: 'sysTypeName', align: 'center' as const },
  { title: '盘符类型', key: 'typeName', align: 'center' as const },
  { title: '总大小', key: 'total', align: 'center' as const },
  { title: '可用大小', key: 'free', align: 'center' as const },
  { title: '已用大小', key: 'used', align: 'center' as const },
  {
    title: '已用百分比',
    key: 'usage',
    align: 'center' as const,
    render: (row: Api.Monitor.SysFile) => {
      const status = row.usage > 80 ? 'error' : row.usage > 60 ? 'warning' : 'success';
      return h(NProgress, {
        type: 'line',
        percentage: row.usage,
        status,
        indicatorPlacement: 'inside',
        style: { width: '100px' },
      });
    },
  },
];

function getProgressStatus(value: number) {
  if (value > 80) return 'error';
  if (value > 60) return 'warning';
  return 'success';
}

onMounted(() => {
  getServerInfo();
});
</script>

<template>
  <NSpin :show="loading" class="h-full">
    <div class="flex-col-stretch gap-16px p-16px">
      <!-- CPU 和 内存 -->
      <NGrid :x-gap="16" :y-gap="16" :cols="2" responsive="screen" item-responsive>
        <!-- CPU 信息 -->
        <NGridItem span="2 m:1">
          <NCard title="CPU" size="small" :segmented="{ content: true }">
            <template #header-extra>
              <icon-mdi-chip class="text-20px text-primary" />
            </template>
            <NDescriptions label-placement="left" :column="1" bordered>
              <NDescriptionsItem label="核心数">
                {{ serverInfo?.cpu?.cpuNum ?? '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="用户使用率">
                <NProgress
                  type="line"
                  :percentage="serverInfo?.cpu?.used ?? 0"
                  :status="getProgressStatus(serverInfo?.cpu?.used ?? 0)"
                  indicator-placement="inside"
                  style="width: 200px"
                />
              </NDescriptionsItem>
              <NDescriptionsItem label="系统使用率">
                <NProgress
                  type="line"
                  :percentage="serverInfo?.cpu?.sys ?? 0"
                  :status="getProgressStatus(serverInfo?.cpu?.sys ?? 0)"
                  indicator-placement="inside"
                  style="width: 200px"
                />
              </NDescriptionsItem>
              <NDescriptionsItem label="当前空闲率">
                <NProgress
                  type="line"
                  :percentage="serverInfo?.cpu?.free ?? 0"
                  status="success"
                  indicator-placement="inside"
                  style="width: 200px"
                />
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>
        </NGridItem>

        <!-- 内存信息 -->
        <NGridItem span="2 m:1">
          <NCard title="内存" size="small" :segmented="{ content: true }">
            <template #header-extra>
              <icon-mdi-memory class="text-20px text-primary" />
            </template>
            <NDescriptions label-placement="left" :column="1" bordered>
              <NDescriptionsItem label="总内存">{{ serverInfo?.mem?.total ?? '-' }} GB</NDescriptionsItem>
              <NDescriptionsItem label="已用内存">{{ serverInfo?.mem?.used ?? '-' }} GB</NDescriptionsItem>
              <NDescriptionsItem label="剩余内存">{{ serverInfo?.mem?.free ?? '-' }} GB</NDescriptionsItem>
              <NDescriptionsItem label="使用率">
                <NProgress
                  type="line"
                  :percentage="serverInfo?.mem?.usage ?? 0"
                  :status="getProgressStatus(serverInfo?.mem?.usage ?? 0)"
                  indicator-placement="inside"
                  style="width: 200px"
                />
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 服务器信息 -->
      <NCard title="服务器信息" size="small" :segmented="{ content: true }">
        <template #header-extra>
          <icon-mdi-server class="text-20px text-primary" />
        </template>
        <NDescriptions label-placement="left" :column="2" bordered>
          <NDescriptionsItem label="服务器名称">
            {{ serverInfo?.sys?.computerName ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="操作系统">
            {{ serverInfo?.sys?.osName ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="服务器IP">
            {{ serverInfo?.sys?.computerIp ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="系统架构">
            {{ serverInfo?.sys?.osArch ?? '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- Node.js 信息 (可选) -->
      <NCard v-if="serverInfo?.node" title="Node.js 信息" size="small" :segmented="{ content: true }">
        <template #header-extra>
          <icon-mdi-nodejs class="text-20px text-primary" />
        </template>
        <NDescriptions label-placement="left" :column="2" bordered>
          <NDescriptionsItem label="Node名称">
            {{ serverInfo?.node?.name ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Node版本">
            {{ serverInfo?.node?.version ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="启动时间">
            {{ serverInfo?.node?.startTime ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="运行时长">
            {{ serverInfo?.node?.runTime ?? '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="安装路径" :span="2">
            {{ serverInfo?.node?.home ?? '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- 磁盘状态 -->
      <NCard title="磁盘状态" size="small" :segmented="{ content: true }">
        <template #header-extra>
          <icon-mdi-harddisk class="text-20px text-primary" />
        </template>
        <NDataTable
          :columns="diskColumns"
          :data="serverInfo?.sysFiles ?? []"
          v-bind="tableProps"
          :single-line="false"
        />
      </NCard>
    </div>
  </NSpin>
</template>

<style scoped></style>
