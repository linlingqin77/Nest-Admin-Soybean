<script setup lang="tsx">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns, FormInst, SelectOption } from 'naive-ui';
import { NButton, NCheckbox, NInput, NSelect, NTabs, NTag, NTooltip } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import {
  genHtmlTypeOptions,
  genJavaTypeOptions,
  genQueryTypeOptions,
  genTplCategoryOptions,
  genTypeOptions
} from '@/constants/business';
import { type GenTableUpdate, fetchDictFindOptionselect, fetchToolGen, fetchToolGenUpdate } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useFormRules } from '@/hooks/common/form';
import { useTableProps } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'GenTableOperateDrawer'
});

interface Props {
  /** the edit row data */
  rowData?: Api.Tool.GenTable | null | undefined;
}

const props = defineProps<Props>();

const tableProps = useTableProps();

const visible = defineModel<boolean>('visible', {
  default: false
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const appStore = useAppStore();
const { defaultRequiredRule } = useFormRules();
const { loading, startLoading, endLoading } = useLoading();
const genTableInfo = ref<Api.Tool.GenTableInfo | undefined>();

const tab = ref<'basic' | 'dragTable' | 'genInfo'>('basic');
const basicFormRef = ref<FormInst | null>(null);
type BasicRuleKey = Extract<keyof Api.Tool.GenTable, 'tableName' | 'tableComment' | 'className' | 'functionAuthor'>;

const basicRules: Record<BasicRuleKey, App.Global.FormRule> = {
  tableName: defaultRequiredRule,
  tableComment: defaultRequiredRule,
  className: defaultRequiredRule,
  functionAuthor: defaultRequiredRule
};

const infoFormRef = ref<FormInst | null>(null);
type InfoRuleKey = Extract<
  keyof Api.Tool.GenTable,
  | 'tplCategory'
  | 'packageName'
  | 'moduleName'
  | 'businessName'
  | 'functionName'
  | 'parentMenuId'
  | 'genType'
  | 'genPath'
  | 'treeCode'
  | 'treeParentCode'
  | 'treeName'
>;

const infoRules: Record<InfoRuleKey, App.Global.FormRule> = {
  tplCategory: defaultRequiredRule,
  packageName: defaultRequiredRule,
  moduleName: defaultRequiredRule,
  businessName: defaultRequiredRule,
  functionName: defaultRequiredRule,
  parentMenuId: defaultRequiredRule,
  genType: defaultRequiredRule,
  genPath: defaultRequiredRule,
  treeCode: defaultRequiredRule,
  treeParentCode: defaultRequiredRule,
  treeName: defaultRequiredRule
};

// 验证状态
const validationErrors = ref<Record<string, string[]>>({
  basic: [],
  genInfo: []
});

// 实时验证基本信息
async function validateBasicForm() {
  if (!basicFormRef.value) return true;
  try {
    await basicFormRef.value.validate();
    validationErrors.value.basic = [];
    return true;
  } catch (errors: any) {
    const errorMessages: string[] = [];
    if (Array.isArray(errors)) {
      errors.forEach((err: any) => {
        if (err?.[0]?.message) {
          errorMessages.push(err[0].message);
        }
      });
    }
    validationErrors.value.basic = errorMessages;
    return false;
  }
}

// 实时验证生成信息
async function validateInfoForm() {
  if (!infoFormRef.value) return true;
  try {
    await infoFormRef.value.validate();
    validationErrors.value.genInfo = [];
    return true;
  } catch (errors: any) {
    const errorMessages: string[] = [];
    if (Array.isArray(errors)) {
      errors.forEach((err: any) => {
        if (err?.[0]?.message) {
          errorMessages.push(err[0].message);
        }
      });
    }
    validationErrors.value.genInfo = errorMessages;
    return false;
  }
}

// Tab 标签显示验证状态
const tabLabels = computed(() => ({
  basic:
    validationErrors.value.basic.length > 0
      ? h('span', { class: 'flex items-center gap-4px' }, [
          '基本信息',
          h(NTag, { type: 'error', size: 'small', round: true }, () => validationErrors.value.basic.length)
        ])
      : '基本信息',
  dragTable: '字段信息',
  genInfo:
    validationErrors.value.genInfo.length > 0
      ? h('span', { class: 'flex items-center gap-4px' }, [
          '生成信息',
          h(NTag, { type: 'error', size: 'small', round: true }, () => validationErrors.value.genInfo.length)
        ])
      : '生成信息'
}));

async function getGenTableInfo() {
  if (!props.rowData?.tableId) return;
  startLoading();
  try {
    const { data } = (await fetchToolGen([props.rowData.tableId as number])) as unknown as {
      data: Api.Tool.GenTableInfo;
    };
    genTableInfo.value = data ?? undefined;
    // 确保字段有排序值
    if (genTableInfo.value?.rows) {
      genTableInfo.value.rows = genTableInfo.value.rows.map((row, index) => ({
        ...row,
        sort: row.sort ?? index + 1
      }));
    }
  } catch {
    // error handled by request interceptor
  } finally {
    endLoading();
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  const basicValid = await validateBasicForm();
  if (!basicValid) {
    tab.value = 'basic';
    window.$message?.error('基本信息校验未通过，请检查表单');
    return;
  }

  const infoValid = await validateInfoForm();
  if (!infoValid) {
    tab.value = 'genInfo';
    window.$message?.error('生成信息校验未通过，请检查表单');
    return;
  }

  const info = genTableInfo.value!.info;
  const genTable: Api.Tool.GenTable = jsonClone(info);
  genTable.params = {
    treeCode: info?.treeCode,
    treeName: info?.treeName,
    treeParentCode: info?.treeParentCode,
    parentMenuId: info?.parentMenuId
  };
  genTable.columns = genTableInfo.value?.rows;

  try {
    const { tableId, ...restGenTable } = genTable;
    const updateData: GenTableUpdate & Record<string, unknown> = {
      ...restGenTable,
      tableId: Number(tableId!)
    };
    await fetchToolGenUpdate(updateData as GenTableUpdate);
    window.$message?.success('修改成功');
    closeDrawer();
    emit('submitted');
  } catch {
    // error handled by request interceptor
  }
}

// 拖拽排序相关
const dragIndex = ref<number | null>(null);
const dropIndex = ref<number | null>(null);

function handleDragStart(index: number) {
  dragIndex.value = index;
}

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault();
  dropIndex.value = index;
}

function handleDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null;
    dropIndex.value = null;
    return;
  }

  const rows = genTableInfo.value?.rows;
  if (!rows) return;

  const dragItem = rows[dragIndex.value];
  rows.splice(dragIndex.value, 1);
  rows.splice(index, 0, dragItem);

  // 更新排序值
  rows.forEach((row, i) => {
    row.sort = i + 1;
  });

  dragIndex.value = null;
  dropIndex.value = null;
}

function handleDragEnd() {
  dragIndex.value = null;
  dropIndex.value = null;
}

// 移动字段位置
function moveField(index: number, direction: 'up' | 'down') {
  const rows = genTableInfo.value?.rows;
  if (!rows) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) return;

  const temp = rows[index];
  rows[index] = rows[targetIndex];
  rows[targetIndex] = temp;

  // 更新排序值
  rows.forEach((row, i) => {
    row.sort = i + 1;
  });
}

watch(visible, () => {
  if (visible.value) {
    genTableInfo.value = undefined;
    tab.value = 'basic';
    validationErrors.value = { basic: [], genInfo: [] };
    getDictOptions();
    getGenTableInfo();
  }
});

// 监听表单变化进行实时验证
watch(
  () => genTableInfo.value?.info,
  () => {
    if (genTableInfo.value?.info) {
      // 延迟验证，避免频繁触发
      setTimeout(() => {
        if (tab.value === 'basic') {
          validateBasicForm();
        } else if (tab.value === 'genInfo') {
          validateInfoForm();
        }
      }, 300);
    }
  },
  { deep: true }
);

const dictOptions = ref<SelectOption[]>([]);
const { loading: dictLoading, startLoading: startDictLoading, endLoading: endDictLoading } = useLoading();

async function getDictOptions() {
  startDictLoading();
  try {
    const { data } = await fetchDictFindOptionselect();
    if (!data) {
      return;
    }
    dictOptions.value = data.map(dict => ({
      value: dict.dictType!,
      class: 'gen-dict-select',
      label: dict.dictName
    }));
  } catch {
    // error handled by request interceptor
  } finally {
    endDictLoading();
  }
}

const columns: DataTableColumns<Api.Tool.GenTableColumn> = [
  {
    key: 'drag',
    title: '',
    align: 'center',
    width: 50,
    render: (_row, index) => (
      <div
        class="flex-center cursor-move"
        draggable
        onDragstart={() => handleDragStart(index)}
        onDragover={e => handleDragOver(e, index)}
        onDrop={() => handleDrop(index)}
        onDragend={handleDragEnd}
      >
        <SvgIcon icon="material-symbols:drag-indicator" class="text-18px text-gray-400" />
      </div>
    )
  },
  {
    key: 'sort',
    title: '序号',
    align: 'center',
    width: 70,
    render: (_row, index) => (
      <div class="flex-center gap-4px">
        <span>{index + 1}</span>
        <div class="flex flex-col">
          <NButton text size="tiny" disabled={index === 0} onClick={() => moveField(index, 'up')}>
            <SvgIcon icon="material-symbols:keyboard-arrow-up" class="text-14px" />
          </NButton>
          <NButton
            text
            size="tiny"
            disabled={index === (genTableInfo.value?.rows?.length || 0) - 1}
            onClick={() => moveField(index, 'down')}
          >
            <SvgIcon icon="material-symbols:keyboard-arrow-down" class="text-14px" />
          </NButton>
        </div>
      </div>
    )
  },
  {
    key: 'columnName',
    title: '字段列名',
    align: 'left',
    minWidth: 120,
    render: row => (
      <NTooltip trigger="hover">
        {{
          trigger: () => <span class="cursor-help">{row.columnName}</span>,
          default: () => `类型: ${row.columnType}`
        }}
      </NTooltip>
    )
  },
  {
    key: 'columnComment',
    title: '字段描述',
    align: 'left',
    minWidth: 120,
    render: row => <NInput v-model:value={row.columnComment} placeholder="请输入字段描述" />
  },
  {
    key: 'columnType',
    title: '物理类型',
    align: 'left',
    width: 120
  },
  {
    key: 'javaType',
    title: 'Java 类型',
    align: 'left',
    width: 136,
    render: row => <NSelect v-model:value={row.javaType} placeholder="请选择 Java 类型" options={genJavaTypeOptions} />
  },
  {
    key: 'javaField',
    title: 'Java 属性',
    align: 'left',
    minWidth: 120,
    render: row => <NInput v-model:value={row.javaField} placeholder="请输入 Java 属性" />
  },
  {
    key: 'isInsert',
    title: '插入',
    align: 'center',
    width: 64,
    render: row => <NCheckbox checked-value="1" unchecked-value="0" v-model:checked={row.isInsert} />
  },
  {
    key: 'isEdit',
    title: '编辑',
    align: 'center',
    width: 64,
    render: row => <NCheckbox checked-value="1" unchecked-value="0" v-model:checked={row.isEdit} />
  },
  {
    key: 'isList',
    title: '列表',
    align: 'center',
    width: 64,
    render: row => <NCheckbox checked-value="1" unchecked-value="0" v-model:checked={row.isList} />
  },
  {
    key: 'isQuery',
    title: '查询',
    align: 'center',
    width: 64,
    render: row => <NCheckbox checked-value="1" unchecked-value="0" v-model:checked={row.isQuery} />
  },
  {
    key: 'queryType',
    title: '查询方式',
    align: 'left',
    width: 130,
    render: row => <NSelect v-model:value={row.queryType} placeholder="请选择查询方式" options={genQueryTypeOptions} />
  },
  {
    key: 'isRequired',
    title: '必填',
    align: 'center',
    width: 64,
    render: row => <NCheckbox checked-value="1" unchecked-value="0" v-model:checked={row.isRequired} />
  },
  {
    key: 'htmlType',
    title: '显示类型',
    align: 'left',
    width: 130,
    render: row => <NSelect v-model:value={row.htmlType} placeholder="请选择显示类型" options={genHtmlTypeOptions} />
  },
  {
    key: 'dictType',
    title: '字典类型',
    align: 'left',
    width: 150,
    render: row => {
      if (row.dictType === '') {
        row.dictType = undefined;
      }

      const renderLabel = (option: CommonType.Option) => (
        <div class="w-full flex justify-between gap-12px">
          <span>{option.label}</span>
          <span class="flex-1 text-end text-13px text-#8492a6">{option.value}</span>
        </div>
      );

      const renderTag = ({ option }: { option: CommonType.Option }) => <>{option.label}</>;

      return (
        <NSelect
          v-model:value={row.dictType}
          loading={dictLoading.value}
          options={dictOptions.value}
          clear-filter-after-select={false}
          consistent-menu-width={false}
          render-label={renderLabel}
          render-tag={renderTag}
          clearable
        />
      );
    }
  }
];
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" width="100%">
    <NDrawerContent title="编辑表" :native-scrollbar="false" closable>
      <NSpin :show="loading" class="h-full" content-class="h-full">
        <NTabs v-model:value="tab" type="segment" animated class="h-full" pane-class="h-full">
          <NTabPane name="basic" :tab="tabLabels.basic" display-directive="show">
            <NForm
              v-if="genTableInfo?.info"
              ref="basicFormRef"
              class="mx-auto max-w-800px"
              :model="genTableInfo.info"
              :rules="basicRules"
            >
              <!-- 验证错误提示 -->
              <NAlert
                v-if="validationErrors.basic.length > 0"
                type="error"
                class="mb-16px"
                title="表单验证错误"
                closable
              >
                <ul class="list-disc pl-16px">
                  <li v-for="(error, index) in validationErrors.basic" :key="index">{{ error }}</li>
                </ul>
              </NAlert>

              <NGrid :x-gap="16" responsive="screen" item-responsive>
                <NFormItemGi span="24 s:12" label="表名称" path="tableName">
                  <NInput v-model:value="genTableInfo.info.tableName" placeholder="请输入表名称" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="表描述" path="tableComment">
                  <NInput v-model:value="genTableInfo.info.tableComment" placeholder="请输入表描述" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="实体类名称" path="className">
                  <NInput v-model:value="genTableInfo.info.className" placeholder="请输入实体类名称（PascalCase）" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="作者" path="functionAuthor">
                  <NInput v-model:value="genTableInfo.info.functionAuthor" placeholder="请输入作者" />
                </NFormItemGi>
                <NFormItemGi span="24" label="备注" path="remark">
                  <NInput v-model:value="genTableInfo.info.remark" type="textarea" placeholder="请输入备注" />
                </NFormItemGi>
              </NGrid>
            </NForm>
          </NTabPane>

          <NTabPane name="dragTable" :tab="tabLabels.dragTable" display-directive="show">
            <div class="h-full flex-col">
              <NAlert type="info" class="mb-12px" :show-icon="true">
                <template #icon>
                  <SvgIcon icon="material-symbols:info-outline" />
                </template>
                拖拽左侧图标或使用上下箭头可调整字段顺序
              </NAlert>
              <NDataTable
                :columns="columns"
                :data="genTableInfo?.rows"
                v-bind="tableProps"
                :flex-height="!appStore.isMobile"
                :scroll-x="1900"
                remote
                class="flex-1"
                :row-class-name="(row, index) => (dropIndex === index ? 'drop-target' : '')"
              />
            </div>
          </NTabPane>

          <NTabPane name="genInfo" :tab="tabLabels.genInfo" display-directive="show">
            <NForm
              v-if="genTableInfo?.info"
              ref="infoFormRef"
              class="mx-auto max-w-800px"
              :model="genTableInfo.info"
              :rules="infoRules"
            >
              <!-- 验证错误提示 -->
              <NAlert
                v-if="validationErrors.genInfo.length > 0"
                type="error"
                class="mb-16px"
                title="表单验证错误"
                closable
              >
                <ul class="list-disc pl-16px">
                  <li v-for="(error, index) in validationErrors.genInfo" :key="index">{{ error }}</li>
                </ul>
              </NAlert>

              <NGrid :x-gap="16" responsive="screen" item-responsive>
                <NFormItemGi span="24 s:12" label="生成模板" path="tplCategory">
                  <NSelect
                    v-model:value="genTableInfo.info.tplCategory"
                    :options="genTplCategoryOptions"
                    placeholder="请选择生成模板"
                  />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" path="packageName">
                  <template #label>
                    <div class="flex-center">
                      <FormTip content="生成在哪个java包下，例如 com.ruoyi.system" />
                      <span class="pl-3px">生成包路径</span>
                    </div>
                  </template>
                  <NInput v-model:value="genTableInfo.info.packageName" placeholder="请输入生成包路径" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" path="moduleName">
                  <template #label>
                    <div class="flex-center">
                      <FormTip content="可理解为子系统名，例如 system，flow-instance。避免驼峰命名" />
                      <span class="pl-3px">生成模块名</span>
                    </div>
                  </template>
                  <NInput v-model:value="genTableInfo.info.moduleName" placeholder="请输入生成模块名（kebab-case）" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="生成业务名" path="businessName">
                  <template #label>
                    <div class="flex-center">
                      <FormTip content="可理解为功能英文名，例如 user" />
                      <span class="pl-3px">生成业务名</span>
                    </div>
                  </template>
                  <NInput v-model:value="genTableInfo.info.businessName" placeholder="请输入生成业务名（kebab-case）" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="生成功能名" path="functionName">
                  <template #label>
                    <div class="flex-center">
                      <FormTip content="用作类描述，例如 用户" />
                      <span class="pl-3px">生成功能名</span>
                    </div>
                  </template>
                  <NInput v-model:value="genTableInfo.info.functionName" placeholder="请输入生成功能名" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="上级菜单" path="parentMenuId">
                  <template #label>
                    <div class="flex-center">
                      <FormTip content="分配到指定菜单下，例如 系统管理" />
                      <span class="pl-3px">上级菜单</span>
                    </div>
                  </template>
                  <MenuTreeSelect v-model:value="genTableInfo.info.parentMenuId" :data-name="rowData?.dataName" />
                </NFormItemGi>
                <NFormItemGi span="24 s:12" label="生成代码方式" path="genType">
                  <template #label>
                    <div class="flex-center">
                      <FormTip content="默认为zip压缩包下载，也可以自定义生成路径" />
                      <span class="pl-3px">生成代码方式</span>
                    </div>
                  </template>
                  <NRadioGroup v-model:value="genTableInfo.info.genType">
                    <NSpace :span="16">
                      <NRadio
                        v-for="option in genTypeOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </NSpace>
                  </NRadioGroup>
                </NFormItemGi>
                <NFormItemGi v-if="genTableInfo.info.genType === '1'" span="24 s:12" label="自定义路径" path="genPath">
                  <NInput v-model:value="genTableInfo.info.genPath" placeholder="请输入自定义路径" />
                </NFormItemGi>
              </NGrid>

              <template v-if="genTableInfo.info.tplCategory === 'tree'">
                <NDivider>树表配置</NDivider>

                <NGrid :x-gap="16" responsive="screen" item-responsive>
                  <NFormItemGi span="24 s:12" path="treeCode">
                    <template #label>
                      <div class="flex-center">
                        <FormTip content="树显示的编码字段名， 如：dept_id" />
                        <span>树编码字段</span>
                      </div>
                    </template>
                    <NSelect
                      v-model:value="genTableInfo.info.treeCode"
                      placeholder="请选择树编码字段"
                      :options="
                        genTableInfo.rows.map(column => ({
                          value: column.columnName,
                          label: column.columnName + '：' + column.columnComment
                        }))
                      "
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 s:12" path="treeParentCode">
                    <template #label>
                      <div class="flex-center">
                        <FormTip content="树显示的父编码字段名， 如：parent_Id" />
                        <span>树父编码字段</span>
                      </div>
                    </template>
                    <NSelect
                      v-model:value="genTableInfo.info.treeParentCode"
                      placeholder="请选择树父编码字段"
                      :options="
                        genTableInfo.rows.map(column => ({
                          value: column.columnName,
                          label: column.columnName + '：' + column.columnComment
                        }))
                      "
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 s:12" path="treeName">
                    <template #label>
                      <div class="flex-center">
                        <FormTip content="树节点的显示名称字段名， 如：dept_name" />
                        <span>树名称字段</span>
                      </div>
                    </template>
                    <NSelect
                      v-model:value="genTableInfo.info.treeName"
                      placeholder="请选择树名称字段"
                      :options="
                        genTableInfo.rows.map(column => ({
                          value: column.columnName,
                          label: column.columnName + '：' + column.columnComment
                        }))
                      "
                    />
                  </NFormItemGi>
                </NGrid>
              </template>
            </NForm>
          </NTabPane>
        </NTabs>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton :disabled="loading" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
:deep(.n-drawer-body-content-wrapper) {
  height: 100%;
}

:deep(.n-tabs-pane-wrapper) {
  height: 100%;
}

:deep(.drop-target) {
  background-color: var(--n-color-hover);
}

.cursor-move {
  cursor: move;
}
</style>

<style>
.gen-dict-select {
  width: 100%;

  .n-base-select-option__content {
    width: 100%;
  }
}
</style>
