<script setup lang="ts">
/**
 * 企业级功能配置组件
 * 配置数据权限、导入导出、多租户、审计日志等企业级功能
 */
import { computed, watch } from 'vue';
import {
  NForm,
  NFormItem,
  NSwitch,
  NSelect,
  NInput,
  NInputNumber,
  NGrid,
  NGi,
  NDivider,
  NAlert
} from 'naive-ui';

defineOptions({
  name: 'EnterpriseInfo'
});

interface Props {
  options: Api.Tool.GenOptions;
  columns: Api.Tool.GenTableColumn[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:options', options: Api.Tool.GenOptions): void;
}

const emit = defineEmits<Emits>();

// 本地 options 副本
const localOptions = computed({
  get: () => props.options || {},
  set: (val) => emit('update:options', val)
});

// 数据权限类型选项
const dataScopeTypeOptions = [
  { label: '全部数据权限', value: 'ALL' },
  { label: '自定义数据权限', value: 'CUSTOM' },
  { label: '本部门数据权限', value: 'DEPT' },
  { label: '本部门及以下数据权限', value: 'DEPT_AND_CHILD' },
  { label: '仅本人数据权限', value: 'SELF' }
];

// 列选项（用于选择数据权限关联字段）
const columnOptions = computed(() =>
  props.columns.map(col => ({
    label: `${col.columnComment || col.columnName} (${col.columnName})`,
    value: col.columnName
  }))
);

// 更新选项
function updateOption<K extends keyof Api.Tool.GenOptions>(key: K, value: Api.Tool.GenOptions[K]) {
  emit('update:options', {
    ...localOptions.value,
    [key]: value
  });
}
</script>

<template>
  <NForm label-placement="left" label-width="140px">
    <!-- 数据权限配置 -->
    <NDivider title-placement="left">数据权限配置</NDivider>
    <NAlert type="info" class="mb-4">
      启用数据权限后，生成的代码将自动集成 @DataScope 装饰器，实现按部门、按用户的数据过滤
    </NAlert>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="12">
        <NFormItem label="启用数据权限">
          <NSwitch
            :value="localOptions.enableDataScope"
            @update:value="val => updateOption('enableDataScope', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="12">
        <NFormItem label="数据权限类型">
          <NSelect
            :value="localOptions.dataScopeType"
            :options="dataScopeTypeOptions"
            :disabled="!localOptions.enableDataScope"
            placeholder="请选择数据权限类型"
            @update:value="val => updateOption('dataScopeType', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="12">
        <NFormItem label="关联字段">
          <NSelect
            :value="localOptions.dataScopeColumn"
            :options="columnOptions"
            :disabled="!localOptions.enableDataScope"
            placeholder="请选择关联字段（如 deptId）"
            @update:value="val => updateOption('dataScopeColumn', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- 导入导出配置 -->
    <NDivider title-placement="left">导入导出配置</NDivider>
    <NAlert type="info" class="mb-4">
      启用导入导出后，生成的代码将包含 Excel 导入导出功能，支持模板下载和数据校验
    </NAlert>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="8">
        <NFormItem label="启用导出">
          <NSwitch
            :value="localOptions.enableExport"
            @update:value="val => updateOption('enableExport', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="8">
        <NFormItem label="启用导入">
          <NSwitch
            :value="localOptions.enableImport"
            @update:value="val => updateOption('enableImport', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="8">
        <NFormItem label="导出文件名">
          <NInput
            :value="localOptions.exportFileName"
            :disabled="!localOptions.enableExport"
            placeholder="默认使用业务名"
            @update:value="val => updateOption('exportFileName', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- 多租户配置 -->
    <NDivider title-placement="left">多租户配置</NDivider>
    <NAlert type="info" class="mb-4">
      启用多租户后，生成的代码将自动注入租户 ID，实现数据隔离
    </NAlert>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="12">
        <NFormItem label="启用多租户">
          <NSwitch
            :value="localOptions.enableTenant"
            @update:value="val => updateOption('enableTenant', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="12">
        <NFormItem label="租户字段">
          <NInput
            :value="localOptions.tenantColumn"
            :disabled="!localOptions.enableTenant"
            placeholder="默认 tenantId"
            @update:value="val => updateOption('tenantColumn', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- 审计日志配置 -->
    <NDivider title-placement="left">审计日志配置</NDivider>
    <NAlert type="info" class="mb-4">
      启用审计日志后，生成的代码将自动记录新增、修改、删除等操作日志
    </NAlert>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="12">
        <NFormItem label="启用操作日志">
          <NSwitch
            :value="localOptions.enableOperlog"
            @update:value="val => updateOption('enableOperlog', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="12">
        <NFormItem label="日志标题">
          <NInput
            :value="localOptions.operlogTitle"
            :disabled="!localOptions.enableOperlog"
            placeholder="默认使用功能名称"
            @update:value="val => updateOption('operlogTitle', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- 高级查询配置 -->
    <NDivider title-placement="left">高级查询配置</NDivider>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="8">
        <NFormItem label="高级搜索">
          <NSwitch
            :value="localOptions.enableAdvancedSearch"
            @update:value="val => updateOption('enableAdvancedSearch', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="8">
        <NFormItem label="默认排序字段">
          <NSelect
            :value="localOptions.defaultSortField"
            :options="columnOptions"
            placeholder="请选择排序字段"
            clearable
            @update:value="val => updateOption('defaultSortField', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="8">
        <NFormItem label="排序方向">
          <NSelect
            :value="localOptions.defaultSortOrder"
            :options="[
              { label: '升序', value: 'asc' },
              { label: '降序', value: 'desc' }
            ]"
            placeholder="请选择排序方向"
            @update:value="val => updateOption('defaultSortOrder', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- 前端增强配置 -->
    <NDivider title-placement="left">前端增强配置</NDivider>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="6">
        <NFormItem label="列宽调整">
          <NSwitch
            :value="localOptions.enableColumnResize"
            @update:value="val => updateOption('enableColumnResize', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="6">
        <NFormItem label="列显示切换">
          <NSwitch
            :value="localOptions.enableColumnToggle"
            @update:value="val => updateOption('enableColumnToggle', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="6">
        <NFormItem label="行内编辑">
          <NSwitch
            :value="localOptions.enableInlineEdit"
            @update:value="val => updateOption('enableInlineEdit', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="6">
        <NFormItem label="批量编辑">
          <NSwitch
            :value="localOptions.enableBatchEdit"
            @update:value="val => updateOption('enableBatchEdit', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="12">
        <NFormItem label="表格高度">
          <NInputNumber
            :value="localOptions.tableHeight"
            placeholder="固定表格高度（px）"
            :min="200"
            :max="1000"
            @update:value="val => updateOption('tableHeight', val ?? undefined)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- 代码质量配置 -->
    <NDivider title-placement="left">代码质量配置</NDivider>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="8">
        <NFormItem label="生成单元测试">
          <NSwitch
            :value="localOptions.enableUnitTest"
            @update:value="val => updateOption('enableUnitTest', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="8">
        <NFormItem label="生成 E2E 测试">
          <NSwitch
            :value="localOptions.enableE2ETest"
            @update:value="val => updateOption('enableE2ETest', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>

    <!-- API 文档配置 -->
    <NDivider title-placement="left">API 文档配置</NDivider>
    <NGrid :cols="24" :x-gap="16">
      <NGi :span="12">
        <NFormItem label="API 分组">
          <NInput
            :value="localOptions.apiGroup"
            placeholder="Swagger API 分组名称"
            @update:value="val => updateOption('apiGroup', val)"
          />
        </NFormItem>
      </NGi>
      <NGi :span="12">
        <NFormItem label="API 描述">
          <NInput
            :value="localOptions.apiDescription"
            placeholder="API 描述信息"
            @update:value="val => updateOption('apiDescription', val)"
          />
        </NFormItem>
      </NGi>
    </NGrid>
  </NForm>
</template>
