<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'SwaggerPage',
});

// 获取 Swagger UI 地址
const swaggerUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_SERVICE_BASE_URL || '';
  // NestJS 默认 Swagger 路径为 /api-docs
  return `${baseUrl}/api-docs`;
});
</script>

<template>
  <div class="h-full">
    <iframe id="swagger-frame" class="size-full border-none" :src="swaggerUrl" title="Swagger API Documentation" />
  </div>
</template>

<style scoped>
.h-full {
  height: 100%;
}

.size-full {
  width: 100%;
  height: 100%;
}

.border-none {
  border: none;
}
</style>
