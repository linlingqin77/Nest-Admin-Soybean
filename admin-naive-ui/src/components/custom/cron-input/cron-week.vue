<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'CronWeek',
});

interface Props {
  value: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'change', value: string): void;
}

const emit = defineEmits<Emits>();

type CronType = 'every' | 'notSpecify' | 'range' | 'loop' | 'specify' | 'lastWeek' | 'nthWeek';

const cronType = ref<CronType>('notSpecify');
const rangeStart = ref(1);
const rangeEnd = ref(7);
const loopStart = ref(1);
const loopStep = ref(1);
const specifyList = ref<number[]>([]);
const lastWeekDay = ref(1);
const nthWeekWeek = ref(1);
const nthWeekDay = ref(1);

const weekOptions = [
  { label: '周一', value: 2 },
  { label: '周二', value: 3 },
  { label: '周三', value: 4 },
  { label: '周四', value: 5 },
  { label: '周五', value: 6 },
  { label: '周六', value: 7 },
  { label: '周日', value: 1 },
];

const cronValue = computed(() => {
  switch (cronType.value) {
    case 'every':
      return '*';
    case 'notSpecify':
      return '?';
    case 'range':
      return `${rangeStart.value}-${rangeEnd.value}`;
    case 'loop':
      return `${loopStart.value}/${loopStep.value}`;
    case 'specify':
      return specifyList.value.length > 0 ? specifyList.value.sort((a, b) => a - b).join(',') : '?';
    case 'lastWeek':
      return `${lastWeekDay.value}L`;
    case 'nthWeek':
      return `${nthWeekDay.value}#${nthWeekWeek.value}`;
    default:
      return '?';
  }
});

function parseValue(val: string) {
  if (!val || val === '?') {
    cronType.value = 'notSpecify';
    return;
  }

  if (val === '*') {
    cronType.value = 'every';
    return;
  }

  if (val.endsWith('L')) {
    cronType.value = 'lastWeek';
    lastWeekDay.value = Number.parseInt(val.replace('L', ''), 10) || 1;
    return;
  }

  if (val.includes('#')) {
    cronType.value = 'nthWeek';
    const [day, week] = val.split('#').map(Number);
    nthWeekDay.value = day;
    nthWeekWeek.value = week;
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
        <NRadio value="every">每周</NRadio>
        <NRadio value="notSpecify">不指定</NRadio>
        <NRadio value="range">
          <span class="flex items-center gap-8px">
            周期 从 周
            <NInputNumber v-model:value="rangeStart" :min="1" :max="7" size="small" class="w-80px" />
            到 周
            <NInputNumber v-model:value="rangeEnd" :min="1" :max="7" size="small" class="w-80px" />
          </span>
        </NRadio>
        <NRadio value="loop">
          <span class="flex items-center gap-8px">
            从 周
            <NInputNumber v-model:value="loopStart" :min="1" :max="7" size="small" class="w-80px" />
            开始，每
            <NInputNumber v-model:value="loopStep" :min="1" :max="7" size="small" class="w-80px" />
            周执行一次
          </span>
        </NRadio>
        <NRadio value="lastWeek">
          <span class="flex items-center gap-8px">
            本月最后一个 周
            <NInputNumber v-model:value="lastWeekDay" :min="1" :max="7" size="small" class="w-80px" />
          </span>
        </NRadio>
        <NRadio value="nthWeek">
          <span class="flex items-center gap-8px">
            第
            <NInputNumber v-model:value="nthWeekWeek" :min="1" :max="5" size="small" class="w-80px" />
            周的 周
            <NInputNumber v-model:value="nthWeekDay" :min="1" :max="7" size="small" class="w-80px" />
          </span>
        </NRadio>
        <NRadio value="specify">指定</NRadio>
      </NSpace>
    </NRadioGroup>

    <NCheckboxGroup v-if="cronType === 'specify'" v-model:value="specifyList" class="mt-8px">
      <NGrid :x-gap="8" :y-gap="8" :cols="7">
        <NGridItem v-for="opt in weekOptions" :key="opt.value">
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
