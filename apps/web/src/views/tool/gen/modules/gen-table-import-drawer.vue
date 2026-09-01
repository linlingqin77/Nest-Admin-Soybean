<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { NAlert, NButton, NDescriptions, NDescriptionsItem, NEmpty, NSpin } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import {
  fetchDataSourceGetColumns,
  fetchDataSourceList,
  fetchToolGenDbList,
  fetchToolGenImportTable,
  fetchToolGetDataNames
} from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import GenTableDbSearch from './gen-table-db-search.vue';

defineOptions({
  name: 'GenTableImportDrawer'
});

const visible = defineModel<boolean>('visible', {
  default: false
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const appStore = useAppStore();

// 数据源相关
const dataSources = ref<Api.Tool.DataSource[]>([]);
const selectedDataSourceId = ref<number | null>(null);
const {
  loading: dataSourceLoading,
  startLoading: startDataSourceLoading,
  endLoading: endDataSourceLoading
} = useLoading();

// 表预览相关
const previewVisible = ref(false);
const previewTableName = ref('');
const previewColumns = ref<Api.Tool.DbColumn[]>([]);
const { loading: previewLoading, startLoading: startPreviewLoading, endLoading: endPreviewLoading } = useLoading();

const previewApi = {
  Tool: {
    TableName: ref('')
  }
};

const { columns, data, getData, getDataByPage, loading, mobilePagination, searchParams } = useTable({
  apiFn: fetchToolGenDbList as any,
  immediate: false,
  showTotal: true,
  apiParams: {
    pageNum: 1,
    pageSize: 15,
    dataName: null,
    tableName: null,
    tableComment: null
  } as any,
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 52
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64
    },
    {
      key: 'tableName',
      title: '表名称',
      align: 'center',
      minWidth: 120,
      render: (row: any) => (
        <NButton text type="primary" onClick={() => handlePreviewTable(row.tableName)}>
          {row.tableName}
        </NButton>
      )
    },
    {
      key: 'tableComment',
      title: '表描述',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'operate',
      title: '操作',
      align: 'center',
      width: 100,
      render: (row: any) => (
        <NButton text type="primary" onClick={() => handlePreviewTable(row.tableName)}>
          <SvgIcon icon="material-symbols:visibility-outline" class="mr-4px" />
          预览
        </NButton>
      )
    }
  ]
});

const { checkedRowKeys } = useTableOperate(data, getData);

// 数据源选项
const dataSourceOptions = computed(() => {
  return dataSources.value.map(ds => ({
    label: `${ds.name} (${ds.type})`,
    value: ds.id
  }));
});

// 数据源名称选项（用于搜索）
const dataNameOptions = ref<CommonType.Option[]>([]);

// 获取数据源列表
async function getDataSources() {
  startDataSourceLoading();
  try {
    const { data: result } = (await fetchDataSourceList({ pageSize: 100 })) as {
      data: { rows: Api.Tool.DataSource[] };
    };
    dataSources.value = result?.rows || [];

    // 同时获取数据源名称列表
    const { data: dataNames } = (await fetchToolGetDataNames()) as { data: string[] };
    dataNameOptions.value = dataNames?.map(item => ({ label: item, value: item })) || [];
  } catch {
    // error handled by request interceptor
  } finally {
    endDataSourceLoading();
  }
}

// 处理数据源选择变化
async function handleDataSourceChange(value: number | null) {
  selectedDataSourceId.value = value;
  if (value) {
    // 找到对应的数据源名称
    const ds = dataSources.value.find(d => d.id === value);
    if (ds) {
      (searchParams as any).dataName = ds.name;
      await getDataByPage();
    }
  } else {
    data.value = [];
    checkedRowKeys.value = [];
  }
}

// 预览表结构
async function handlePreviewTable(tableName: string) {
  if (!selectedDataSourceId.value) {
    window.$message?.warning('请先选择数据源');
    return;
  }

  previewApi.Tool.TableName.value = tableName;
  previewVisible.value = true;
  startPreviewLoading();

  try {
    const { data: cols } = (await fetchDataSourceGetColumns(selectedDataSourceId.value as number, tableName)) as {
      data: Api.Tool.DbColumn[];
    };
    previewColumns.value = cols || [];
  } catch {
    previewColumns.value = [];
  } finally {
    endPreviewLoading();
  }
}

function closeDrawer() {
  visible.value = false;
}

function closePreview() {
  previewVisible.value = false;
  previewApi.Tool.TableName.value = '';
  previewColumns.value = [];
}

async function handleSubmit() {
  if (checkedRowKeys.value.length > 0) {
    try {
      const tableData: { tables: string; dataName?: string } = {
        tables: checkedRowKeys.value.join(',')
      };
      await fetchToolGenImportTable(tableData as any);
      window.$message?.success('导入成功');
      emit('submitted');
    } catch {
      // error handled by request interceptor
    }
  }
  closeDrawer();
}

async function handleResetSearchParams() {
  if (dataNameOptions.value.length > 0) {
    (searchParams as any).dataName = dataNameOptions.value[0].value;
    // 同步选择对应的数据源
    const ds = dataSources.value.find(d => d.name === dataNameOptions.value[0].value);
    selectedDataSourceId.value = (ds?.id as number) || null;
  } else {
    (searchParams as any).dataName = null;
    selectedDataSourceId.value = null;
  }
  (searchParams as any).tableName = null;
  (searchParams as any).tableComment = null;
  data.value = [];
  checkedRowKeys.value = [];
  await getDataByPage();
}

watch(visible, async () => {
  if (visible.value) {
    await getDataSources();
    await handleResetSearchParams();
  }
});

// 预览列的表格列定义
const previewTableColumns = [
  {
    key: 'columnName',
    title: '列名',
    align: 'left' as const,
    minWidth: 120
  },
  {
    key: 'columnType',
    title: '类型',
    align: 'center' as const,
    width: 120
  },
  {
    key: 'columnComment',
    title: '注释',
    align: 'left' as const,
    minWidth: 150
  },
  {
    key: 'isPrimaryKey',
    title: '主键',
    align: 'center' as const,
    width: 80,
    render: (row: Api.Tool.DbColumn) => (row.isPrimaryKey ? '是' : '否')
  },
  {
    key: 'isNullable',
    title: '可空',
    align: 'center' as const,
    width: 80,
    render: (row: Api.Tool.DbColumn) => (row.isNullable ? '是' : '否')
  },
  {
    key: 'defaultValue',
    title: '默认值',
    align: 'center' as const,
    width: 100,
    render: (row: Api.Tool.DbColumn) => row.defaultValue || '-'
  }
];
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="900" class="max-w-90%">
    <NDrawerContent title="导入表" :native-scrollbar="false" closable>
      <div class="h-full flex-col">
        <!-- 数据源选择区域 -->
        <NCard size="small" class="mb-16px">
          <NGrid :x-gap="16" :cols="24">
            <NGi :span="12">
              <NFormItem label="数据源" label-placement="left" :show-feedback="false">
                <NSelect
                  v-model:value="selectedDataSourceId"
                  :options="dataSourceOptions"
                  :loading="dataSourceLoading"
                  placeholder="请选择数据源"
                  clearable
                  @update:value="handleDataSourceChange"
                />
              </NFormItem>
            </NGi>
            <NGi :span="12">
              <NAlert v-if="selectedDataSourceId" type="info" :show-icon="false">
                已选择数据源，点击表名可预览表结构
              </NAlert>
            </NGi>
          </NGrid>
        </NCard>

        <!-- 搜索区域 -->
        <GenTableDbSearch
          v-model:model="searchParams"
          :options="dataNameOptions"
          @reset="handleResetSearchParams"
          @search="getDataByPage"
        />

        <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" class="mb-16px" />

        <!-- 表列表 -->
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          size="small"
          :flex-height="!appStore.isMobile"
          :scroll-x="750"
          :loading="loading"
          remote
          :row-key="row => row.tableName"
          :pagination="mobilePagination"
          class="flex-1"
        />
      </div>

      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :disabled="checkedRowKeys.length === 0" @click="handleSubmit">
            {{ $t('common.confirm') }} ({{ checkedRowKeys.length }})
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>

  <!-- 表结构预览弹窗 -->
  <NModal
    v-model:show="previewVisible"
    preset="card"
    :title="`表结构预览 - ${previewApi.Tool.TableName}`"
    :style="{ width: '800px', maxWidth: '90%' }"
    :mask-closable="true"
    @close="closePreview"
  >
    <NSpin :show="previewLoading">
      <template v-if="previewColumns.length > 0">
        <NDescriptions :column="2" label-placement="left" bordered class="mb-16px">
          <NDescriptionsItem label="表名">{{ previewApi.Tool.TableName }}</NDescriptionsItem>
          <NDescriptionsItem label="字段数">{{ previewColumns.length }}</NDescriptionsItem>
        </NDescriptions>

        <NDataTable
          :columns="previewTableColumns"
          :data="previewColumns"
          size="small"
          :max-height="400"
          :scroll-x="600"
        />
      </template>
      <NEmpty v-else description="暂无字段信息" />
    </NSpin>

    <template #footer>
      <NButton @click="closePreview">关闭</NButton>
    </template>
  </NModal>
</template>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  height: 100%;
}
</style>
