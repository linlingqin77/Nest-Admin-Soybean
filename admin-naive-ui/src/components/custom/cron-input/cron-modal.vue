<script setup lang="ts">
import { ref, watch } from 'vue';
import CronInput from './index.vue';

defineOptions({
  name: 'CronModal',
});

interface Props {
  expression?: string;
}

const props = withDefaults(defineProps<Props>(), {
  expression: '',
});

interface Emits {
  (e: 'confirm', value: string): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const cronRef = ref<InstanceType<typeof CronInput>>();
const currentCron = ref('');

function handleConfirm() {
  emit('confirm', currentCron.value);
  visible.value = false;
}

function handleReset() {
  cronRef.value?.resetCron();
}

function handleCronChange(cron: string) {
  currentCron.value = cron;
}

watch(visible, (val) => {
  if (val) {
    currentCron.value = props.expression || '* * * * * ?';
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="Cron 表达式生成器"
    :style="{ width: '800px', maxWidth: '90vw' }"
    :mask-closable="false"
  >
    <CronInput ref="cronRef" :expression="expression" @change="handleCronChange" />
    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleReset">重置</NButton>
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" @click="handleConfirm">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
