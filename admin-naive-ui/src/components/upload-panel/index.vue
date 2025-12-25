<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="show && uploadTasks.length > 0" class="upload-panel" :style="panelStyle">
        <!-- 头部 -->
        <div class="panel-header">
          <span class="header-title"> 上传任务 ({{ completedCount }}/{{ uploadTasks.length }}) </span>
          <div class="header-actions">
            <n-button text @click="handleMinimize">
              <template #icon>
                <div class="i-carbon-minimize" />
              </template>
            </n-button>
            <n-button text @click="handleClose">
              <template #icon>
                <div class="i-carbon-close" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- 任务列表 -->
        <n-scrollbar v-if="uploadTasks.length <= 20" :style="{ height: contentHeight }">
          <div class="task-list">
            <div v-for="task in uploadTasks" :key="task.id" class="task-item">
              <UploadTaskItem
                :task="task"
                @pause="handlePause(task.id)"
                @resume="handleResume(task.id)"
                @cancel="handleCancel(task.id)"
                @retry="handleRetry(task.id)"
              />
            </div>
          </div>
        </n-scrollbar>

        <!-- 虚拟列表（任务数 > 20 时） -->
        <n-virtual-list v-else :item-size="UPLOAD_ITEM_HEIGHT" :items="uploadTasks" :style="{ height: contentHeight }">
          <template #default="{ item: task }">
            <UploadTaskItem
              :task="task"
              @pause="handlePause(task.id)"
              @resume="handleResume(task.id)"
              @cancel="handleCancel(task.id)"
              @retry="handleRetry(task.id)"
            />
          </template>
        </n-virtual-list>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NScrollbar, NVirtualList, useThemeVars } from 'naive-ui';
import UploadTaskItem from './upload-task-item.vue';
import {
  UPLOAD_PANEL_WIDTH,
  UPLOAD_PANEL_HEIGHT,
  UPLOAD_PANEL_HEADER_HEIGHT,
  UPLOAD_ITEM_HEIGHT,
} from '@/views/system/file-manager/constants';

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  status: 'uploading' | 'paused' | 'success' | 'error';
  speed?: number; // bytes/s
  uploaded?: number; // bytes
  error?: string;
}

interface Props {
  show?: boolean;
  uploadTasks?: UploadTask[];
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'pause', taskId: string): void;
  (e: 'resume', taskId: string): void;
  (e: 'cancel', taskId: string): void;
  (e: 'retry', taskId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  uploadTasks: () => [],
});

const emit = defineEmits<Emits>();

const themeVars = useThemeVars();

// 面板样式
const panelStyle = computed(() => ({
  width: `${UPLOAD_PANEL_WIDTH}px`,
  height: `${UPLOAD_PANEL_HEIGHT}px`,
  borderRadius: '12px',
}));

// 内容区域高度
const contentHeight = computed(() => {
  return `${UPLOAD_PANEL_HEIGHT - UPLOAD_PANEL_HEADER_HEIGHT}px`;
});

// 已完成任务数
const completedCount = computed(() => {
  return props.uploadTasks.filter((t) => t.status === 'success').length;
});

// 最小化
function handleMinimize() {
  emit('update:show', false);
}

// 关闭
function handleClose() {
  emit('update:show', false);
}

// 暂停
function handlePause(taskId: string) {
  emit('pause', taskId);
}

// 继续
function handleResume(taskId: string) {
  emit('resume', taskId);
}

// 取消
function handleCancel(taskId: string) {
  emit('cancel', taskId);
}

// 重试
function handleRetry(taskId: string) {
  emit('retry', taskId);
}
</script>

<style scoped lang="scss">
.upload-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  background: v-bind('themeVars.cardColor');
  box-shadow:
    0 0 1px rgba(28, 28, 32, 0.05),
    0 8px 24px rgba(28, 28, 32, 0.12);
  overflow: hidden;

  .panel-header {
    height: v-bind('UPLOAD_PANEL_HEADER_HEIGHT + "px"');
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid v-bind('themeVars.dividerColor');

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: v-bind('themeVars.textColor1');
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }
  }

  .task-list {
    .task-item {
      border-bottom: 1px solid v-bind('themeVars.dividerColor');

      &:last-child {
        border-bottom: none;
      }
    }
  }
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
