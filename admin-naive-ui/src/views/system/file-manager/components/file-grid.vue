<template>
  <div ref="containerRef" class="file-grid-view">
    <n-virtual-list
      v-if="rows.length > 0"
      :item-size="CARD_HEIGHT + CARD_GAP"
      :items="rows"
      :style="{ height: `${containerHeight}px` }"
    >
      <template #default="{ item: row, index }">
        <div class="grid-row" :style="{ marginBottom: `${CARD_GAP}px` }">
          <div v-for="(file, fileIndex) in row" :key="file.id" class="file-card-wrapper" :style="cardWrapperStyle">
            <n-tooltip :delay="500" placement="bottom">
              <template #trigger>
                <n-card
                  :class="[
                    'file-card',
                    {
                      selected: checkedKeys.includes(file.id),
                      'drag-over': file.type === 'folder' && dragOverId === file.id,
                    },
                  ]"
                  :hoverable="true"
                  :style="cardStyle(checkedKeys.includes(file.id))"
                  :draggable="file.type === 'file'"
                  @click="handleCardClick(file, $event)"
                  @dblclick="handleCardDblClick(file)"
                  @contextmenu.prevent="handleContextMenu($event, file)"
                  @dragstart="handleDragStart(file, $event)"
                  @dragover="file.type === 'folder' ? handleDragOver(file, $event) : undefined"
                  @dragleave="file.type === 'folder' ? handleDragLeave() : undefined"
                  @drop="file.type === 'folder' ? handleDrop(file, $event) : undefined"
                >
                  <!-- 选中复选框 -->
                  <n-checkbox
                    :checked="checkedKeys.includes(file.id)"
                    class="card-checkbox"
                    @click.stop
                    @update:checked="(checked) => handleCheckChange(file.id, checked)"
                  />

                  <!-- 缩略图区域 -->
                  <div class="thumbnail-area">
                    <n-image
                      v-if="file.thumbnail"
                      :src="file.thumbnail"
                      :width="THUMBNAIL_WIDTH"
                      :height="THUMBNAIL_HEIGHT"
                      :lazy="true"
                      :fallback-src="placeholderImage"
                      object-fit="cover"
                      :preview-disabled="true"
                    />
                    <div v-else class="file-icon-placeholder">
                      <SvgIcon
                        :icon="file.type === 'folder' ? 'material-symbols:folder' : getIconForFile(file.ext)"
                        class="text-48px"
                        :style="{ color: file.type === 'folder' ? '#ffc107' : getIconColor(file.ext) }"
                      />
                    </div>
                  </div>

                  <!-- 文件信息 -->
                  <div class="file-info">
                    <div class="file-name">
                      {{ file.name }}
                    </div>
                    <div class="file-meta">
                      <span v-if="file.type === 'file'">{{ formatFileSize(file.size) }}</span>
                      <span>{{ formatDate(file.updateTime || file.createTime) }}</span>
                    </div>
                  </div>
                </n-card>
              </template>
              <!-- Tooltip内容：文件详细信息 -->
              <div class="file-tooltip">
                <p><strong>名称:</strong> {{ file.name }}</p>
                <p v-if="file.type === 'file'"><strong>大小:</strong> {{ formatFileSize(file.size) }}</p>
                <p v-if="file.ext"><strong>类型:</strong> {{ file.ext.toUpperCase() }} 文件</p>
                <p><strong>创建时间:</strong> {{ formatDate(file.createTime) }}</p>
                <p v-if="file.updateTime"><strong>修改时间:</strong> {{ formatDate(file.updateTime) }}</p>
              </div>
            </n-tooltip>
          </div>
        </div>
      </template>
    </n-virtual-list>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="i-carbon-folder-off empty-icon" />
      <p>暂无文件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NCard, NImage, NEllipsis, NCheckbox, NVirtualList, NTooltip, useThemeVars } from 'naive-ui';
import { useElementSize } from '@vueuse/core';
import SvgIcon from '@/components/custom/svg-icon.vue';
import type { FileItem } from './file-list.vue';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_GAP,
  CARD_BORDER_RADIUS,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  calculateGridCols,
  formatFileSize,
  formatDate,
  getFileIcon,
} from '../constants';

interface Props {
  fileList: FileItem[];
  loading?: boolean;
  checkedKeys?: (string | number)[];
}

interface Emits {
  (e: 'update:checkedKeys', keys: (string | number)[]): void;
  (e: 'itemClick', item: FileItem): void;
  (e: 'itemDblClick', item: FileItem): void;
  (e: 'contextMenu', event: MouseEvent, item: FileItem): void;
  (e: 'fileDrop', fileId: string | number, targetFolderId: string | number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  checkedKeys: () => [],
});

const emit = defineEmits<Emits>();

const themeVars = useThemeVars();
const containerRef = ref<HTMLElement>();
const { width: containerWidth } = useElementSize(containerRef);
const dragOverId = ref<string | number | null>(null);

// 双击检测
let clickTimer: ReturnType<typeof setTimeout> | null = null;
let lastClickId: string | number | null = null;

// 获取文件图标（Iconify格式）
function getIconForFile(ext?: string): string {
  if (!ext) return 'material-symbols:draft-outline';

  const extLower = ext.toLowerCase();

  // 图片
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extLower)) {
    return 'material-symbols:image-outline';
  }
  // 视频
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extLower)) {
    return 'material-symbols:video-file-outline';
  }
  // 音频
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extLower)) {
    return 'material-symbols:audio-file-outline';
  }
  // 文档
  if (['doc', 'docx'].includes(extLower)) {
    return 'mdi:file-word-outline';
  }
  if (['xls', 'xlsx'].includes(extLower)) {
    return 'mdi:file-excel-outline';
  }
  if (['ppt', 'pptx'].includes(extLower)) {
    return 'mdi:file-powerpoint-outline';
  }
  if (['pdf'].includes(extLower)) {
    return 'mdi:file-pdf-outline';
  }
  if (['txt', 'md'].includes(extLower)) {
    return 'material-symbols:description-outline';
  }
  // 压缩包
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extLower)) {
    return 'material-symbols:folder-zip-outline';
  }
  // 代码
  if (['js', 'ts', 'jsx', 'tsx', 'vue', 'json', 'html', 'css', 'scss', 'less'].includes(extLower)) {
    return 'material-symbols:code';
  }

  return 'material-symbols:draft-outline';
}

// 获取文件图标颜色
function getIconColor(ext?: string): string {
  if (!ext) return '#666';

  const extLower = ext.toLowerCase();

  // 图片 - 绿色
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extLower)) {
    return '#4caf50';
  }
  // 视频 - 紫色
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extLower)) {
    return '#9c27b0';
  }
  // 音频 - 橙色
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extLower)) {
    return '#ff9800';
  }
  // Word - 蓝色
  if (['doc', 'docx'].includes(extLower)) {
    return '#2196f3';
  }
  // Excel - 绿色
  if (['xls', 'xlsx'].includes(extLower)) {
    return '#4caf50';
  }
  // PPT - 橙红色
  if (['ppt', 'pptx'].includes(extLower)) {
    return '#ff5722';
  }
  // PDF - 红色
  if (['pdf'].includes(extLower)) {
    return '#f44336';
  }
  // 文本 - 灰色
  if (['txt', 'md'].includes(extLower)) {
    return '#607d8b';
  }
  // 压缩包 - 棕色
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extLower)) {
    return '#795548';
  }
  // 代码 - 青色
  if (['js', 'ts', 'jsx', 'tsx', 'vue', 'json', 'html', 'css', 'scss', 'less'].includes(extLower)) {
    return '#00bcd4';
  }

  return '#666';
}

// 占位图
const placeholderImage =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veS4rTwvdGV4dD48L3N2Zz4=';

// 容器高度
const containerHeight = ref(600);

// 计算列数
const cols = computed(() => {
  if (!containerWidth.value) return 6;
  return calculateGridCols(containerWidth.value, CARD_WIDTH, CARD_GAP);
});

// 将文件列表分组为行
const rows = computed(() => {
  const result: FileItem[][] = [];
  const colsCount = cols.value;

  for (let i = 0; i < props.fileList.length; i += colsCount) {
    result.push(props.fileList.slice(i, i + colsCount));
  }

  return result;
});

// 卡片包装器样式
const cardWrapperStyle = computed(() => ({
  width: `${CARD_WIDTH}px`,
  marginRight: `${CARD_GAP}px`,
  flexShrink: 0,
}));

// 卡片样式
const cardStyle = computed(() => (isSelected: boolean) => ({
  padding: '12px',
  borderRadius: `${CARD_BORDER_RADIUS}px`,
  border: isSelected ? `2px solid ${themeVars.value.primaryColor}` : 'none',
  transition: 'all 0.3s',
  position: 'relative' as const,
}));

// 处理卡片点击
function handleCardClick(file: FileItem, event: MouseEvent) {
  // 如果点击的是checkbox，不处理（让checkbox自己的事件处理）
  if ((event.target as HTMLElement).closest('.n-checkbox')) {
    return;
  }

  // 检测双击
  if (lastClickId === file.id && clickTimer) {
    // 这是双击的第二次点击，取消单击定时器
    clearTimeout(clickTimer);
    clickTimer = null;
    lastClickId = null;
    // 双击事件会由dblclick处理
    return;
  }

  lastClickId = file.id;

  // Ctrl/Cmd 多选立即处理
  if (event.ctrlKey || event.metaKey) {
    const newKeys = [...props.checkedKeys];
    const index = newKeys.indexOf(file.id);
    if (index > -1) {
      newKeys.splice(index, 1);
    } else {
      newKeys.push(file.id);
    }
    emit('update:checkedKeys', newKeys);
    lastClickId = null;
    return;
  }

  // 普通单击延迟处理，给双击机会取消
  clickTimer = setTimeout(() => {
    // 如果已经选中，切换选中状态
    const isSelected = props.checkedKeys.includes(file.id);
    const newKeys = [...props.checkedKeys];

    if (isSelected) {
      const index = newKeys.indexOf(file.id);
      newKeys.splice(index, 1);
      emit('update:checkedKeys', newKeys);
    } else {
      // 未选中时，执行原有的itemClick逻辑（进入文件夹或预览文件）
      emit('itemClick', file);
    }
    clickTimer = null;
    lastClickId = null;
  }, 200);
}

// 处理卡片双击
function handleCardDblClick(file: FileItem) {
  // 清除单击定时器
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
  }
  lastClickId = null;
  console.log('Double click on:', file.name, file.type);
  emit('itemDblClick', file);
}

// 处理右键菜单
function handleContextMenu(event: MouseEvent, file: FileItem) {
  emit('contextMenu', event, file);
}

// 处理复选框变化
function handleCheckChange(id: string | number, checked: boolean) {
  const newKeys = [...props.checkedKeys];
  const index = newKeys.indexOf(id);

  if (checked && index === -1) {
    newKeys.push(id);
  } else if (!checked && index > -1) {
    newKeys.splice(index, 1);
  }

  emit('update:checkedKeys', newKeys);
}

// 拖拽开始
function handleDragStart(file: FileItem, event: DragEvent) {
  if (file.type === 'folder') return;
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('fileId', String(file.id));
  event.dataTransfer!.setData('fileName', file.name);
}

// 拖拽经过文件夹
function handleDragOver(file: FileItem, event: DragEvent) {
  if (file.type !== 'folder') return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer!.dropEffect = 'move';
  dragOverId.value = file.id;
}

// 拖拽离开文件夹
function handleDragLeave() {
  dragOverId.value = null;
}

// 放置到文件夹
function handleDrop(file: FileItem, event: DragEvent) {
  if (file.type !== 'folder') return;
  event.preventDefault();
  event.stopPropagation();
  dragOverId.value = null;

  const fileId = event.dataTransfer!.getData('fileId');
  if (fileId && fileId !== String(file.id)) {
    emit('fileDrop', fileId, file.id);
  }
}
</script>

<style scoped lang="scss">
.file-grid-view {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .grid-row {
    display: flex;
    flex-wrap: nowrap;
  }

  .file-card-wrapper {
    flex-shrink: 0;
  }

  .file-card {
    width: 100%;
    height: v-bind('CARD_HEIGHT + "px"');
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    &.selected {
      box-shadow: 0 0 0 2px v-bind('themeVars.primaryColor');
    }

    &.drag-over {
      border: 2px dashed v-bind('themeVars.primaryColor');
      background: v-bind('themeVars.primaryColor + "1A"');
      transform: scale(1.02);
    }

    &:hover {
      box-shadow:
        0 0 1px rgba(28, 28, 32, 0.05),
        0 8px 24px rgba(28, 28, 32, 0.12);
    }

    .card-checkbox {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 10;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    .file-card:hover .card-checkbox,
    .file-card.selected .card-checkbox {
      opacity: 1;
    }

    .thumbnail-area {
      width: v-bind('THUMBNAIL_WIDTH + "px"');
      height: v-bind('THUMBNAIL_HEIGHT + "px"');
      margin: 12px auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      overflow: hidden;
      background-color: v-bind('themeVars.cardColor');

      .file-icon-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: v-bind('themeVars.hoverColor');

        .large-icon {
          font-size: 48px;
          color: v-bind('themeVars.textColor3');
        }
      }
    }

    .file-info {
      width: 100%;
      padding: 0 12px;
      text-align: center;

      .file-name {
        display: block;
        width: 100%;
        font-size: 13px;
        color: v-bind('themeVars.textColor1');
        margin-bottom: 6px;
        line-height: 1.4;
        height: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-meta {
        font-size: 12px;
        color: v-bind('themeVars.textColor3');
        display: flex;
        gap: 8px;

        span {
          white-space: nowrap;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: v-bind('themeVars.textColor3');

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      font-size: 14px;
    }
  }
}

.file-tooltip {
  p {
    margin: 4px 0;
    font-size: 12px;

    strong {
      color: inherit;
      margin-right: 4px;
    }
  }
}
</style>
