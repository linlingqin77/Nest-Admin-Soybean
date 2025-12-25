<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'CronDay',
});

interface Props {
  value: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'change', value: string): void;
}

const emit = defineEmits<Emits>();

type CronType = 'every' | 'notSpecify' | 'range' | 'loop' | 'specify' | 'lastDay' | 'workDay';

const cronType = ref<CronType>('every');
const rangeStart = ref(1);
const rangeEnd = ref(31);
const loopStart = ref(1);
const loopStep = ref(1);
const specifyList = ref<number[]>([]);
const workDay = ref(1);

const dayOptions = Array.from({ length: 31 }, (_, i) => ({
  label: (i + 1).toString(),
  value: i + 1,
}));

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
      return specifyList.value.length > 0 ? specifyList.value.sort((a, b) => a - b).join(',') : '*';
    case 'lastDay':
      return 'L';
    case 'workDay':
      return `${workDay.value}W`;
    default:
      return '*';
  }
});

function parseValue(val: string) {
  if (!val || val === '*') {
    cronType.value = 'every';
    return;
  }

  if (val === '?') {
    cronType.value = 'notSpecify';
    return;
  }

  if (val === 'L') {
    cronType.value = 'lastDay';
    return;
  }

  if (val.endsWith('W')) {
    cronType.value = 'workDay';
    workDay.value = Number.parseInt(val.replace('W', ''), 10) || 1;
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
        <NRadio value="every">每天</NRadio>
        <NRadio value="notSpecify">不指定</NRadio>
        <NRadio value="range">
          <span class="flex items-center gap-8px">
            周期 从
            <NInputNumber v-model:value="rangeStart" :min="1" :max="31" size="small" class="w-80px" />
            到
            <NInputNumber v-model:value="rangeEnd" :min="1" :max="31" size="small" class="w-80px" />
            日
          </span>
        </NRadio>
        <NRadio value="loop">
          <span class="flex items-center gap-8px">
            从
            <NInputNumber v-model:value="loopStart" :min="1" :max="31" size="small" class="w-80px" />
            日开始，每
            <NInputNumber v-model:value="loopStep" :min="1" :max="31" size="small" class="w-80px" />
            天执行一次
          </span>
        </NRadio>
        <NRadio value="lastDay">每月最后一天</NRadio>
        <NRadio value="workDay">
          <span class="flex items-center gap-8px">
            每月
            <NInputNumber v-model:value="workDay" :min="1" :max="31" size="small" class="w-80px" />
            号最近的工作日
          </span>
        </NRadio>
        <NRadio value="specify">指定</NRadio>
      </NSpace>
    </NRadioGroup>

    <NCheckboxGroup v-if="cronType === 'specify'" v-model:value="specifyList" class="mt-8px">
      <NGrid :x-gap="8" :y-gap="8" :cols="10">
        <NGridItem v-for="opt in dayOptions" :key="opt.value">
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
