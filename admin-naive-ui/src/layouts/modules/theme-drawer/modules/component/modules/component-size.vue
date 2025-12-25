<script setup lang="ts">
import { themeComponentSizeOptions } from '@/constants/app';
import { useThemeStore } from '@/store/modules/theme';
import { translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'ComponentSize',
});

const themeStore = useThemeStore();
</script>

<template>
  <SettingItem :label="$t('theme.component.size.title')">
    <NSelect
      v-model:value="themeStore.componentSize"
      :options="translateOptions(themeComponentSizeOptions)"
      size="small"
      class="w-120px"
    />
  </SettingItem>
</template>

<style scoped></style>
