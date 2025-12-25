<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="drag-upload-overlay" @drop.prevent="handleDrop" @dragover.prevent>
        <div class="overlay-content">
          <div class="i-carbon-upload upload-icon" />
          <p class="upload-text">拖拽文件到此处上传</p>
          <p class="upload-hint">支持批量上传</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useThemeVars } from 'naive-ui';

interface Emits {
  (e: 'upload', files: File[]): void;
}

const emit = defineEmits<Emits>();

const themeVars = useThemeVars();
const show = ref(false);
const dragCounter = ref(0);

// 处理文件拖入窗口
function handleWindowDragEnter(event: DragEvent) {
  event.preventDefault();

  // 打印 dataTransfer 的详细信息
  console.log('handleWindowDragEnter - dataTransfer.types:', event.dataTransfer?.types);
  console.log('handleWindowDragEnter - dataTransfer.items:', event.dataTransfer?.items);

  // 检查是否包含文件（从外部拖入）
  const hasFiles = event.dataTransfer?.types.includes('Files');
  // 排除内部拖拽（fileId表示是内部文件拖拽）
  const isInternalDrag = event.dataTransfer?.types.includes('fileid');

  console.log('handleWindowDragEnter - hasFiles:', hasFiles, 'isInternalDrag:', isInternalDrag);

  if (hasFiles && !isInternalDrag) {
    dragCounter.value++;
    show.value = true;
  }
}

// 处理拖拽离开窗口
function handleWindowDragLeave(event: DragEvent) {
  event.preventDefault();
  dragCounter.value--;

  if (dragCounter.value <= 0) {
    dragCounter.value = 0;
    show.value = false;
  }
}

// 处理文件释放
function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  const files = Array.from(event.dataTransfer?.files || []);
  console.log('DragUploadOverlay handleDrop - files:', files);
  // 添加文件详细信息日志
  files.forEach((file, index) => {
    console.log(`File ${index}: name=${file.name}, type=${file.type}, size=${file.size}`);
  });

  show.value = false;
  dragCounter.value = 0;

  if (files.length > 0) {
    console.log('Emitting upload event with', files.length, 'files');
    emit('upload', files);
  } else {
    console.warn('No files in drop event');
  }
}

// 处理拖拽结束（兼容性）
function handleWindowDragEnd() {
  show.value = false;
  dragCounter.value = 0;
}

onMounted(() => {
  window.addEventListener('dragenter', handleWindowDragEnter);
  window.addEventListener('dragleave', handleWindowDragLeave);
  window.addEventListener('dragend', handleWindowDragEnd);
});

onUnmounted(() => {
  window.removeEventListener('dragenter', handleWindowDragEnter);
  window.removeEventListener('dragleave', handleWindowDragLeave);
  window.removeEventListener('dragend', handleWindowDragEnd);
});
</script>

<style scoped lang="scss">
.drag-upload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: v-bind('themeVars.primaryColor + "1A"');
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;

  .overlay-content {
    padding: 48px;
    border: 3px dashed v-bind('themeVars.primaryColor');
    border-radius: 12px;
    background: v-bind('themeVars.cardColor + "EE"');
    text-align: center;
    pointer-events: none;

    .upload-icon {
      font-size: 64px;
      color: v-bind('themeVars.primaryColor');
      margin-bottom: 16px;
    }

    .upload-text {
      font-size: 18px;
      font-weight: 600;
      color: v-bind('themeVars.textColor1');
      margin-bottom: 8px;
    }

    .upload-hint {
      font-size: 14px;
      color: v-bind('themeVars.textColor3');
    }
  }
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
