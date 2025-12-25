<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'CronMonth',
});

interface Props {
  value: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'change', value: string): void;
}

const emit = defineEmits<Emits>();

type CronType = 'every' | 'range' | 'loop' | 'specify';

const cronType = ref<CronType>('every');
const rangeStart = ref(1);
const rangeEnd = ref(12);
const loopStart = ref(1);
const loopStep = ref(1);
const specifyList = ref<number[]>([]);

const monthOptions = [
  { label: '一月', value: 1 },
  { label: '二月', value: 2 },
  { label: '三月', value: 3 },
  { label: '四月', value: 4 },
  { label: '五月', value: 5 },
  { label: '六月', value: 6 },
  { label: '七月', value: 7 },
  { label: '八月', value: 8 },
  { label: '九月', value: 9 },
  { label: '十月', value: 10 },
  { label: '十一月', value: 11 },
  { label: '十二月', value: 12 },
];

const cronValue = computed(() => {
  switch (cronType.value) {
    case 'every':
      return '*';
    case 'range':
      return `${rangeStart.value}-${rangeEnd.value}`;
    case 'loop':
      return `${loopStart.value}/${loopStep.value}`;
    case 'specify':
      return specifyList.value.length > 0 ? specifyList.value.sort((a, b) => a - b).join(',') : '*';
    default:
      return '*';
  }
});

function parseValue(val: string) {
  if (!val || val === '*') {
    cronType.value = 'every';
    return;
  }

  if (val.includes('-')) {
    cronType.value = 'range';
    const [start, end] = val.split('-').map(Number);
    rangeStart.value = start;
    rangeEnd.value = end;
    return;
  }

  if (val.includes('/')) {
    cronType.value = 'loop';
    const [start, step] = val.split('/').map(Number);
    loopStart.value = start;
    loopStep.value = step;
    return;
  }

  if (val.includes(',')) {
    cronType.value = 'specify';
    specifyList.value = val.split(',').map(Number);
    return;
  }

  const num = Number(val);
  if (!Number.isNaN(num)) {
    cronType.value = 'specify';
    specifyList.value = [num];
  }
}

watch(cronValue, (val) => {
  emit('change', val);
});

watch(
  () => props.value,
  (val) => {
    parseValue(val);
  },
  { immediate: true },
);
</script>

<template>
  <div class="cron-panel">
    <NRadioGroup v-model:value="cronType" class="mb-16px">
      <NSpace vertical>
        <NRadio value="every">每月</NRadio>
        <NRadio value="range">
          <span class="flex items-center gap-8px">
            周期 从
            <NInputNumber v-model:value="rangeStart" :min="1" :max="12" size="small" class="w-80px" />
            到
            <NInputNumber v-model:value="rangeEnd" :min="1" :max="12" size="small" class="w-80px" />
            月
          </span>
        </NRadio>
        <NRadio value="loop">
          <span class="flex items-center gap-8px">
            从
            <NInputNumber v-model:value="loopStart" :min="1" :max="12" size="small" class="w-80px" />
            月开始，每
            <NInputNumber v-model:value="loopStep" :min="1" :max="12" size="small" class="w-80px" />
            月执行一次
          </span>
        </NRadio>
        <NRadio value="specify">指定</NRadio>
      </NSpace>
    </NRadioGroup>

    <NCheckboxGroup v-if="cronType === 'specify'" v-model:value="specifyList" class="mt-8px">
      <NGrid :x-gap="8" :y-gap="8" :cols="6">
        <NGridItem v-for="opt in monthOptions" :key="opt.value">
          <NCheckbox :value="opt.value" :label="opt.label" />
        </NGridItem>
      </NGrid>
    </NCheckboxGroup>
  </div>
</template>

<style scoped>
.cron-panel {
  padding: 12px;
}
</style>
