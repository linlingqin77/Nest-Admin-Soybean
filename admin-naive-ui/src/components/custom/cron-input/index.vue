<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CronSecond from './cron-second.vue';
import CronMinute from './cron-minute.vue';
import CronHour from './cron-hour.vue';
import CronDay from './cron-day.vue';
import CronMonth from './cron-month.vue';
import CronWeek from './cron-week.vue';
import CronYear from './cron-year.vue';
import CronResult from './cron-result.vue';

defineOptions({
  name: 'CronInput',
});

interface Props {
  expression?: string;
}

const props = withDefaults(defineProps<Props>(), {
  expression: '',
});

interface Emits {
  (e: 'change', value: string): void;
}

const emit = defineEmits<Emits>();

const cronValue = ref({
  second: '*',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
  year: '',
});

const cronExpression = computed(() => {
  const { second, minute, hour, day, month, week, year } = cronValue.value;
  return `${second} ${minute} ${hour} ${day} ${month} ${week}${year ? ` ${year}` : ''}`;
});

const tabValue = ref('second');

const tabs = [
  { name: 'second', tab: '秒' },
  { name: 'minute', tab: '分钟' },
  { name: 'hour', tab: '小时' },
  { name: 'day', tab: '日' },
  { name: 'month', tab: '月' },
  { name: 'week', tab: '周' },
  { name: 'year', tab: '年' },
];

function updateCronValue(type: string, value: string) {
  (cronValue.value as Record<string, string>)[type] = value;
  emit('change', cronExpression.value);
}

function parseExpression(exp: string) {
  if (!exp) {
    resetCron();
    return;
  }

  const parts = exp.split(/\s+/);
  if (parts.length >= 6) {
    cronValue.value = {
      second: parts[0] || '*',
      minute: parts[1] || '*',
      hour: parts[2] || '*',
      day: parts[3] || '*',
      month: parts[4] || '*',
      week: parts[5] || '?',
      year: parts[6] || '',
    };
  }
}

function resetCron() {
  cronValue.value = {
    second: '*',
    minute: '*',
    hour: '*',
    day: '*',
    month: '*',
    week: '?',
    year: '',
  };
  emit('change', cronExpression.value);
}

watch(
  () => props.expression,
  (val) => {
    parseExpression(val);
  },
  { immediate: true },
);

defineExpose({
  getCronExpression: () => cronExpression.value,
  resetCron,
});
</script>

<template>
  <div class="cron-input">
    <NTabs v-model:value="tabValue" type="card" size="small">
      <NTabPane v-for="tab in tabs" :key="tab.name" :name="tab.name" :tab="tab.tab">
        <CronSecond
          v-if="tab.name === 'second'"
          :value="cronValue.second"
          @change="(val: string) => updateCronValue('second', val)"
        />
        <CronMinute
          v-else-if="tab.name === 'minute'"
          :value="cronValue.minute"
          @change="(val: string) => updateCronValue('minute', val)"
        />
        <CronHour
          v-else-if="tab.name === 'hour'"
          :value="cronValue.hour"
          @change="(val: string) => updateCronValue('hour', val)"
        />
        <CronDay
          v-else-if="tab.name === 'day'"
          :value="cronValue.day"
          @change="(val: string) => updateCronValue('day', val)"
        />
        <CronMonth
          v-else-if="tab.name === 'month'"
          :value="cronValue.month"
          @change="(val: string) => updateCronValue('month', val)"
        />
        <CronWeek
          v-else-if="tab.name === 'week'"
          :value="cronValue.week"
          @change="(val: string) => updateCronValue('week', val)"
        />
        <CronYear
          v-else-if="tab.name === 'year'"
          :value="cronValue.year"
          @change="(val: string) => updateCronValue('year', val)"
        />
      </NTabPane>
    </NTabs>

    <!-- 表达式预览 -->
    <NCard size="small" class="mt-16px">
      <div class="flex items-center gap-16px">
        <span class="font-bold">Cron 表达式:</span>
        <NTag type="primary" size="large">{{ cronExpression }}</NTag>
      </div>
    </NCard>

    <!-- 执行时间预览 -->
    <CronResult :expression="cronExpression" class="mt-16px" />
  </div>
</template>

<style scoped>
.cron-input {
  width: 100%;
}
</style>
