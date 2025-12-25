/**
 * 文件拖拽 Composable
 * 实现高性能文件拖拽功能
 */

import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { MAX_DRAG_FILES, DRAG_PREVIEW_MAX_ITEMS } from '../constants';

export interface DragItem {
  id: string | number;
  name: string;
  type: 'file' | 'folder';
  thumbnail?: string;
}

export interface UseDragOptions {
  /** 最大可拖拽文件数，默认 100 */
  maxFiles?: number;
  /** 是否启用拖拽预览，默认 true */
  enablePreview?: boolean;
  /** 预览最多显示文件数，默认 5 */
  previewMaxItems?: number;
}

export interface DragHandlers {
  onDragStart: (event: DragEvent) => void;
  onDragEnd: (event: DragEvent) => void;
}

/**
 * 使用文件拖拽功能
 */
export function useFileDrag(selectedItems: Ref<DragItem[]>, options: UseDragOptions = {}) {
  const { maxFiles = MAX_DRAG_FILES, enablePreview = true, previewMaxItems = DRAG_PREVIEW_MAX_ITEMS } = options;

  const isDragging = ref(false);
  const dragPreviewElement = ref<HTMLElement | null>(null);

  // 限制拖拽文件数量
  const dragItems = computed(() => {
    return selectedItems.value.slice(0, maxFiles);
  });

  // 创建拖拽预览元素
  function createDragPreview(): HTMLElement {
    const preview = document.createElement('div');
    preview.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: none;
      z-index: 9999;
      min-width: 200px;
      max-width: 300px;
    `;

    const items = dragItems.value.slice(0, previewMaxItems);
    const remaining = dragItems.value.length - items.length;

    // 添加文件项
    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px;
        ${index > 0 ? 'margin-top: 4px;' : ''}
      `;

      // 图标或缩略图
      if (item.thumbnail) {
        const img = document.createElement('img');
        img.src = item.thumbnail;
        img.style.cssText = 'width: 32px; height: 32px; object-fit: cover; border-radius: 4px;';
        itemDiv.appendChild(img);
      } else {
        const icon = document.createElement('div');
        icon.className = item.type === 'folder' ? 'i-carbon-folder' : 'i-carbon-document';
        icon.style.cssText = 'font-size: 24px; color: #666;';
        itemDiv.appendChild(icon);
      }

      // 文件名
      const name = document.createElement('span');
      name.textContent = item.name;
      name.style.cssText = `
        flex: 1;
        font-size: 14px;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      itemDiv.appendChild(name);

      preview.appendChild(itemDiv);
    });

    // 如果有更多文件
    if (remaining > 0) {
      const badge = document.createElement('div');
      badge.textContent = `+${remaining} 个文件`;
      badge.style.cssText = `
        margin-top: 8px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        font-size: 12px;
        color: #666;
        text-align: center;
      `;
      preview.appendChild(badge);
    }

    return preview;
  }

  // 拖拽开始
  function onDragStart(event: DragEvent) {
    if (dragItems.value.length === 0) {
      event.preventDefault();
      return;
    }

    isDragging.value = true;

    // 设置拖拽数据
    const data = {
      type: 'file-manager-items',
      items: dragItems.value.map((item) => ({
        id: item.id,
        type: item.type,
      })),
    };
    event.dataTransfer!.setData('application/json', JSON.stringify(data));
    event.dataTransfer!.effectAllowed = 'move';

    // 创建拖拽预览
    if (enablePreview) {
      const preview = createDragPreview();
      document.body.appendChild(preview);
      dragPreviewElement.value = preview;

      // 设置拖拽图片（使用预览元素）
      event.dataTransfer!.setDragImage(preview, 0, 0);
    }
  }

  // 拖拽结束
  function onDragEnd(event: DragEvent) {
    isDragging.value = false;

    // 清理预览元素
    if (dragPreviewElement.value) {
      document.body.removeChild(dragPreviewElement.value);
      dragPreviewElement.value = null;
    }
  }

  const dragHandlers: DragHandlers = {
    onDragStart,
    onDragEnd,
  };

  return {
    isDragging,
    dragItems,
    dragHandlers,
  };
}

/**
 * 拖放目标 Composable
 */
export interface DropHandlers {
  onDragEnter: (event: DragEvent) => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

export function useDropTarget(onDrop: (items: DragItem[]) => void | Promise<void>) {
  const isDraggingOver = ref(false);
  const dragEnterTarget = ref<EventTarget | null>(null);

  function onDragEnter(event: DragEvent) {
    event.preventDefault();
    dragEnterTarget.value = event.target;
    isDraggingOver.value = true;
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  function onDragLeave(event: DragEvent) {
    // 只有真正离开元素时才设置为 false
    if (event.target === dragEnterTarget.value) {
      isDraggingOver.value = false;
    }
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDraggingOver.value = false;

    try {
      const jsonData = event.dataTransfer!.getData('application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.type === 'file-manager-items') {
          await onDrop(data.items);
        }
      }
    } catch (error) {
      console.error('Drop failed:', error);
    }
  }

  const dropHandlers: DropHandlers = {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop: handleDrop,
  };

  return {
    isDraggingOver,
    dropHandlers,
  };
}
