<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'CronYear',
});

interface Props {
  value: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'change', value: string): void;
}

const emit = defineEmits<Emits>();

type CronType = 'every' | 'notSpecify' | 'range' | 'specify';

const cronType = ref<CronType>('notSpecify');
const currentYear = new Date().getFullYear();
const rangeStart = ref(currentYear);
const rangeEnd = ref(currentYear + 10);
const specifyList = ref<number[]>([]);

// 生成最近 20 年的选项
const yearOptions = Array.from({ length: 20 }, (_, i) => ({
  label: String(currentYear + i),
  value: currentYear + i,
}));

const cronValue = computed(() => {
  switch (cronType.value) {
    case 'every':
      return '*';
    case 'notSpecify':
      return '';
    case 'range':
      return `${rangeStart.value}-${rangeEnd.value}`;
    case 'specify':
      return specifyList.value.length > 0 ? specifyList.value.sort((a, b) => a - b).join(',') : '';
    default:
      return '';
  }
});

function parseValue(val: string) {
  if (!val) {
    cronType.value = 'notSpecify';
    return;
  }

  if (val === '*') {
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
        <NRadio value="notSpecify">不指定（留空）</NRadio>
        <NRadio value="every">每年</NRadio>
        <NRadio value="range">
          <span class="flex items-center gap-8px">
            周期 从
            <NInputNumber
              v-model:value="rangeStart"
              :min="currentYear"
              :max="currentYear + 100"
              size="small"
              class="w-100px"
            />
            到
            <NInputNumber
              v-model:value="rangeEnd"
              :min="currentYear"
              :max="currentYear + 100"
              size="small"
              class="w-100px"
            />
            年
          </span>
        </NRadio>
        <NRadio value="specify">指定</NRadio>
      </NSpace>
    </NRadioGroup>

    <NCheckboxGroup v-if="cronType === 'specify'" v-model:value="specifyList" class="mt-8px">
      <NGrid :x-gap="8" :y-gap="8" :cols="5">
        <NGridItem v-for="opt in yearOptions" :key="opt.value">
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
