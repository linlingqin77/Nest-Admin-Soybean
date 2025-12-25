<script setup lang="ts">
defineOptions({
  name: 'FormBuildPage',
});
</script>

<template>
  <div class="h-full flex-col-stretch">
    <NCard class="flex-1" :bordered="false" size="small">
      <NResult status="info" title="表单构建" description="表单设计器功能开发中...">
        <template #footer>
          <NSpace vertical align="center">
            <NText depth="3">推荐使用以下 Vue3 表单设计器：</NText>
            <NSpace>
              <NButton tag="a" href="https://github.com/vform666/variant-form3-vite" target="_blank" secondary>
                variant-form3-vite
              </NButton>
              <NButton tag="a" href="https://github.com/xaboy/form-create-designer" target="_blank" secondary>
                form-create-designer
              </NButton>
              <NButton tag="a" href="https://formilyjs.org/" target="_blank" secondary>Formily</NButton>
            </NSpace>
            <NText depth="3" class="mt-16px">安装 variant-form3-vite 后，可在此页面集成 VFormDesigner 组件</NText>
          </NSpace>
        </template>
      </NResult>
    </NCard>
  </div>
</template>

<style scoped></style>
