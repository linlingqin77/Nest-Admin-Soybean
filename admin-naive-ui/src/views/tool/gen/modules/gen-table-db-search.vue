<script setup lang="ts">
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'GenTableDbSearch',
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Tool.GenTableDbSearchParams>('model', { required: true });

async function reset() {
  await restoreValidation();
  emit('reset');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <NForm ref="formRef" :model="model" label-placement="left" :label-width="80" class="mb-16px">
    <NGrid responsive="screen" item-responsive>
      <NFormItemGi span="24 s:8" label="表名称" path="tableName" class="pr-24px">
        <NInput v-model:value="model.tableName" placeholder="请输入表名称" clearable />
      </NFormItemGi>
      <NFormItemGi span="24 s:8" label="表描述" path="tableComment" class="pr-24px">
        <NInput v-model:value="model.tableComment" placeholder="请输入表描述" clearable />
      </NFormItemGi>
      <NFormItemGi :show-feedback="false" span="24 s:8" class="pb-6px pr-24px">
        <NSpace class="w-full" justify="end">
          <NButton @click="reset">
            <template #icon>
              <icon-ic-round-refresh class="text-icon" />
            </template>
            {{ $t('common.reset') }}
          </NButton>
          <NButton type="primary" ghost @click="search">
            <template #icon>
              <icon-ic-round-search class="text-icon" />
            </template>
            {{ $t('common.search') }}
          </NButton>
        </NSpace>
      </NFormItemGi>
    </NGrid>
  </NForm>
</template>

<style scoped></style>
