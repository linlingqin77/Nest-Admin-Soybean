<script setup lang="ts">
import { computed } from 'vue';
import { isSafeIframeUrl } from '@/utils/sanitize';

interface Props {
  url: string;
}

const props = defineProps<Props>();

// C7：仅允许 http/https 协议 iframe，防止 javascript:/data:text/html 注入
const safeUrl = computed(() => (isSafeIframeUrl(props.url) ? props.url : 'about:blank'));
</script>

<template>
  <div class="h-full">
    <iframe id="iframePage" class="size-full" :src="safeUrl" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
  </div>
</template>

<style scoped></style>
