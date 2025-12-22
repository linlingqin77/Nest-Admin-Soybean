<script setup lang="tsx">
import { useAttrs } from 'vue';
import type { TreeSelectProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchGetDeptTree } from '@/service/api/system';

defineOptions({ name: 'DeptTreeSelect' });

interface Props {
  [key: string]: any;
}

defineProps<Props>();

const value = defineModel<CommonType.IdType | null>('value', { required: false });
const options = defineModel<Api.Common.CommonTreeRecord>('options', { required: false, default: [] });
const expandedKeys = defineModel<CommonType.IdType[]>('expandedKeys', { required: false, default: [] });

const attrs: TreeSelectProps = useAttrs();
const { loading, startLoading, endLoading } = useLoading();

async function getDeptList() {
  startLoading();
  try {
    const { data } = await fetchGetDeptTree();
    options.value = data;
    // 设置默认展开的节点
    if (data?.length && !expandedKeys.value.length) {
      expandedKeys.value = [data[0].id];
    }
  } catch {
    // error handled by request interceptor
  }
  endLoading();
}

getDeptList();
</script>

<template>
  <NTreeSelect
    v-model:value="value"
    v-model:expanded-keys="expandedKeys"
    filterable
    class="h-full"
    :loading="loading"
    key-field="id"
    label-field="label"
    :options="options as []"
    v-bind="attrs"
  />
</template>

<style scoped></style>
