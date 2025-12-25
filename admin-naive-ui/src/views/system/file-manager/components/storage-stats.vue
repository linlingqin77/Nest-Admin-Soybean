<template>
  <div class="storage-stats-card">
    <n-spin :show="loading">
      <n-space vertical :size="16">
        <n-space justify="space-between" align="center">
          <n-text strong>存储空间</n-text>
          <n-button text @click="refresh">
            <template #icon>
              <icon-carbon-renew />
            </template>
          </n-button>
        </n-space>

        <n-progress
          type="line"
          :percentage="stats.percentage"
          :status="getProgressStatus(stats.percentage)"
          :show-indicator="false"
        />

        <n-space justify="space-between">
          <n-text depth="3" class="text-sm"> 已用 {{ formatSize(stats.used) }} / {{ formatSize(stats.quota) }} </n-text>
          <n-text depth="3" class="text-sm"> {{ stats.percentage.toFixed(1) }}% </n-text>
        </n-space>

        <n-text v-if="stats.remaining < 1024" type="warning" class="text-sm">
          <icon-carbon-warning class="inline-block mr-1" />
          存储空间即将用尽
        </n-text>
      </n-space>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { fetchGetStorageStats } from '@/service/api';

const message = useMessage();
const loading = ref(false);

const stats = ref<Api.System.FileManager.StorageStats>({
  used: 0,
  quota: 0,
  percentage: 0,
  remaining: 0,
  companyName: '',
});

/** 格式化文件大小 */
function formatSize(mb: number): string {
  if (mb < 1024) {
    return `${mb.toFixed(0)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}

/** 获取进度条状态 */
function getProgressStatus(percentage: number): 'success' | 'warning' | 'error' | 'default' {
  if (percentage >= 95) return 'error';
  if (percentage >= 80) return 'warning';
  return 'success';
}

/** 获取存储统计 */
async function getStats() {
  loading.value = true;
  try {
    const { data } = await fetchGetStorageStats();
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    message.error('获取存储统计失败');
  } finally {
    loading.value = false;
  }
}

/** 刷新 */
function refresh() {
  getStats();
}

onMounted(() => {
  getStats();
});

defineExpose({
  refresh,
});
</script>

<style scoped>
.storage-stats-card {
  padding: 16px;
  background: var(--n-color);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}
</style>
