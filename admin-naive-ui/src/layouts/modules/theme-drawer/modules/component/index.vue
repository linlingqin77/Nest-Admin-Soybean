<script setup lang="ts">
import { $t } from '@/locales';
import ComponentSize from './modules/component-size.vue';
import TableProps from '../table-props.vue';

defineOptions({
  name: 'ComponentSettings',
});
</script>

<template>
  <div class="flex-col-stretch gap-12px">
    <NDivider>{{ $t('theme.componentPropsTitle') }}</NDivider>
    <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
      <ComponentSize key="component-size" />
    </TransitionGroup>
    <TableProps />
  </div>
</template>

<style scoped></style>
