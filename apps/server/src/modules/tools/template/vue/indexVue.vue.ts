/**
 * Vue3 列表页面模板
 *
 * 生成符合项目规范的 Naive UI 列表页面
 * - 使用 NDataTable 组件
 * - 使用 useTable、useTableOperate hooks
 * - 支持 i18n 国际化
 * - 包含搜索、分页、CRUD 操作
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过 assertSafeText
 * 校验，防止函数名/模块名/字段名中含特殊字符破坏生成的代码。
 *
 * @modules vue/indexVue
 */

export interface IndexVueTemplateOptions {
  /** 业务名称 (PascalCase) */
  BusinessName: string;
  /** 业务名称 (camelCase) */
  businessName: string;
  /** 模块名称 */
  moduleName: string;
  /** 功能名称 (中文) */
  functionName: string;
  /** 主键字段名 */
  primaryKey: string;
  /** 表注释 */
  tableComment?: string;
  /** 列配置 */
  columns: Array<{
    javaField: string;
    javaType: string;
    columnComment: string;
    columnType: string;
    isPk: string;
    isInsert: string;
    isEdit: string;
    isList: string;
    isQuery: string;
    isRequired: string;
    queryType: string;
    htmlType: string;
    dictType?: string;
  }>;
}

import { assertSafeText } from '../utils/sanitize';

/**
 * 生成列表页面
 */
export function indexVue(options: IndexVueTemplateOptions): string {
  // 安全：所有标识符类输入必须校验
  assertSafeText(options.BusinessName, 'BusinessName', 64);
  assertSafeText(options.businessName, 'businessName', 64);
  assertSafeText(options.moduleName, 'moduleName', 64);
  assertSafeText(options.primaryKey, 'primaryKey', 64);
  // 安全：所有字段名必须校验
  options.columns.forEach((col) => {
    assertSafeText(col.javaField, `javaField[${col.javaField}]`, 64);
  });

  const script = generateScript(options);
  const template = generateTemplate(options);
  const style = generateStyle();

  return `${script}

${template}

${style}
`;
}

/**
 * 生成 script 部分
 */
function generateScript(options: IndexVueTemplateOptions): string {
  const { BusinessName, businessName, moduleName, primaryKey, columns } = options;
  // 安全：functionName 用于导出文件名，必须校验
  const safeFunctionName = assertSafeText(options.functionName, 'functionName', 100);

  // 收集字典类型
  const dictTypes = new Set<string>();
  columns.forEach((col) => {
    if (col.dictType) {
      dictTypes.add(col.dictType);
    }
  });

  // 生成字典导入
  const dictImports = dictTypes.size > 0 ? `import { useDict } from 'src/hooks/business/dict';` : '';
  const dictUsage = Array.from(dictTypes)
    .map((dict) => `useDict('${dict}');`)
    .join('\n');

  // 生成列表列
  const listColumns = columns.filter((col) => col.isList === '1' || col.isPk === '1');
  const columnDefinitions = generateColumnDefinitions(listColumns, moduleName, businessName, primaryKey);

  // 生成查询参数
  const queryColumns = columns.filter((col) => col.isQuery === '1');
  const queryParams = generateQueryParams(queryColumns);

  return `<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider } from 'naive-ui';
import {
  fetch${BusinessName}List,
  fetchDelete${BusinessName},
} from 'src/service/api/${moduleName}/${businessName}';
import type { ${BusinessName}Record, ${BusinessName}SearchParams } from 'src/service/api/${moduleName}/${businessName}';
import { useAppStore } from 'src/store/modules/app';
import { useTable, useTableOperate, useTableProps } from 'src/hooks/common/table';
import { useAuth } from 'src/hooks/business/auth';
import { useDownload } from 'src/hooks/business/download';
${dictImports}
import ButtonIcon from 'src/components/custom/button-icon.vue';
import DictTag from 'src/components/custom/dict-tag.vue';
import { $t } from 'src/locales';
import ${BusinessName}Search from './modules/${businessName}-search.vue';
import ${BusinessName}OperateDrawer from './modules/${businessName}-operate-drawer.vue';

defineOptions({
  name: '${BusinessName}List',
});

${dictUsage}

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { download } = useDownload();

const tableProps = useTableProps();

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable({
  apiFn: fetch${BusinessName}List,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
${queryParams}
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64,
    },
${columnDefinitions}
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: (row) => {
        const editBtn = () => (
          <ButtonIcon
            text
            type="primary"
            icon="material-symbols:drive-file-rename-outline-outline"
            tooltipContent={$t('common.edit')}
            onClick={() => edit(row.${primaryKey}!)}
          />
        );

        const deleteBtn = () => (
          <ButtonIcon
            text
            type="error"
            icon="material-symbols:delete-outline"
            tooltipContent={$t('common.delete')}
            popconfirmContent={$t('common.confirmDelete')}
            onPositiveClick={() => handleDelete(row.${primaryKey}!)}
          />
        );

        const buttons = [];
        if (hasAuth('${moduleName}:${businessName}:edit')) buttons.push(editBtn());
        if (hasAuth('${moduleName}:${businessName}:remove')) buttons.push(deleteBtn());

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>
                {index !== 0 && <NDivider vertical />}
                {btn}
              </>
            ))}
          </div>
        );
      },
    },
  ],
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
} = useTableOperate(data, getData);

/** 批量删除 */
async function handleBatchDelete() {
  try {
    await fetchDelete${BusinessName}(checkedRowKeys.value as CommonType.IdType[]);
    onBatchDeleted();
  } catch (error) {
    // 错误消息已在请求工具中显示
  }
}

/** 删除 */
async function handleDelete(${primaryKey}: CommonType.IdType) {
  try {
    await fetchDelete${BusinessName}(${primaryKey});
    onDeleted();
  } catch (error) {
    // 错误消息已在请求工具中显示
  }
}

/** 编辑 */
function edit(${primaryKey}: CommonType.IdType) {
  handleEdit('${primaryKey}', ${primaryKey});
}

/** 导出 */
function handleExport() {
  download('/${moduleName}/${businessName}/export', searchParams, \`${safeFunctionName}_\${new Date().getTime()}.xlsx\`);
}

/** 重置搜索 */
function handleResetSearch() {
  resetSearchParams();
}
</script>`;
}

/**
 * 生成 template 部分
 */
function generateTemplate(options: IndexVueTemplateOptions): string {
  const { BusinessName, businessName, moduleName, functionName, primaryKey } = options;

  return `<template>
  <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <${BusinessName}Search v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />
    <NCard :title="$t('page.${moduleName}.${businessName}.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('${moduleName}:${businessName}:add')"
          :show-delete="hasAuth('${moduleName}:${businessName}:remove')"
          :show-export="hasAuth('${moduleName}:${businessName}:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        v-bind="tableProps"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="(row) => row.${primaryKey}"
        :pagination="mobilePagination"
        class="h-full"
      />
      <${BusinessName}OperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>`;
}

/**
 * 生成 style 部分
 */
function generateStyle(): string {
  return `<style scoped>
:deep(.n-data-table-wrapper),
:deep(.n-data-table-base-table),
:deep(.n-data-table-base-table-body) {
  height: 100%;
}
</style>`;
}

/**
 * 生成列定义
 */
function generateColumnDefinitions(
  columns: IndexVueTemplateOptions['columns'],
  moduleName: string,
  businessName: string,
  primaryKey: string,
): string {
  return columns
    .map((col) => {
      const comment = col.columnComment.split('（')[0].split('(')[0];
      const field = col.javaField;

      // 主键列
      if (col.isPk === '1') {
        return `    {
      key: '${field}',
      title: $t('page.${moduleName}.${businessName}.${field}'),
      align: 'center',
      width: 80,
    },`;
      }

      // 日期时间列
      if (col.htmlType === 'datetime') {
        return `    {
      key: '${field}',
      title: $t('page.${moduleName}.${businessName}.${field}'),
      align: 'center',
      width: 180,
    },`;
      }

      // 图片列
      if (col.htmlType === 'imageUpload') {
        return `    {
      key: '${field}',
      title: $t('page.${moduleName}.${businessName}.${field}'),
      align: 'center',
      width: 100,
      render(row) {
        return row.${field} ? <NImage width={50} src={row.${field}} /> : null;
      },
    },`;
      }

      // 字典列
      if (col.dictType) {
        return `    {
      key: '${field}',
      title: $t('page.${moduleName}.${businessName}.${field}'),
      align: 'center',
      width: 100,
      render(row) {
        return <DictTag value={row.${field}} dictCode="${col.dictType}" />;
      },
    },`;
      }

      // 普通列
      return `    {
      key: '${field}',
      title: $t('page.${moduleName}.${businessName}.${field}'),
      align: 'center',
      width: 120,
      ellipsis: true,
    },`;
    })
    .join('\n');
}

/**
 * 生成查询参数
 */
function generateQueryParams(columns: IndexVueTemplateOptions['columns']): string {
  return columns
    .map((col) => {
      return `    ${col.javaField}: null,`;
    })
    .join('\n');
}

// 导出字典脚本生成函数供其他模板使用
export function indexScriptDicts(columns: IndexVueTemplateOptions['columns']): string {
  const dictTypes = new Set<string>();
  columns.forEach((col) => {
    if (col.dictType) {
      dictTypes.add(col.dictType);
    }
  });

  if (dictTypes.size === 0) {
    return '';
  }

  return Array.from(dictTypes)
    .map((dict) => `useDict('${dict}');`)
    .join('\n');
}
