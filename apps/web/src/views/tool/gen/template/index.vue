<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NCollapse, NCollapseItem, NDivider, NEmpty, NSpace, NTag } from 'naive-ui';
import {
  fetchTemplateDeleteGroup,
  fetchTemplateDeleteTemplate,
  fetchTemplateExportGroup,
  fetchTemplateListGroups
} from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import TemplateGroupSearch from './modules/template-group-search.vue';
import TemplateGroupOperateDrawer from './modules/template-group-operate-drawer.vue';
import TemplateEditorDrawer from './modules/template-editor-drawer.vue';
import TemplateImportDrawer from './modules/template-import-drawer.vue';

defineOptions({
  name: 'TemplateManagement'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

const tableProps = useTableProps();

// 语言映射
const languageMap: Record<'typescript' | 'vue' | 'sql', { label: string; color: string }> = {
  typescript: { label: 'TypeScript', color: '#3178c6' },
  vue: { label: 'Vue', color: '#42b883' },
  sql: { label: 'SQL', color: '#e38c00' }
};

// 状态映射
const statusMap: Record<string, { label: string; type: 'success' | 'error' }> = {
  '0': { label: '正常', type: 'success' },
  '1': { label: '停用', type: 'error' }
};

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchTemplateListGroups as any,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    status: null
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64
    },
    {
      key: 'name',
      title: '模板组名称',
      align: 'center',
      minWidth: 150
    },
    {
      key: 'description',
      title: '描述',
      align: 'center',
      minWidth: 200,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'isDefault',
      title: '默认',
      align: 'center',
      width: 80,
      render: row => {
        const dataRow = row as unknown as Api.Tool.TemplateGroup;
        return dataRow.isDefault ? (
          <NTag size="small" type="success">
            是
          </NTag>
        ) : (
          <NTag size="small">否</NTag>
        );
      }
    },
    {
      key: 'tenantId',
      title: '类型',
      align: 'center',
      width: 100,
      render: row => {
        const dataRow = row as unknown as Api.Tool.TemplateGroup;
        return dataRow.tenantId === null ? (
          <NTag size="small" type="warning">
            系统级
          </NTag>
        ) : (
          <NTag size="small" type="info">
            租户级
          </NTag>
        );
      }
    },
    {
      key: 'templateCount',
      title: '模板数量',
      align: 'center',
      width: 100,
      render: row => {
        const dataRow = row as unknown as Api.Tool.TemplateGroup;
        return dataRow.templates?.length || 0;
      }
    },
    {
      key: 'status',
      title: '状态',
      align: 'center',
      width: 80,
      render: row => {
        const dataRow = row as unknown as Api.Tool.TemplateGroup;
        const statusInfo = statusMap[dataRow.status as keyof typeof statusMap] || {
          label: '未知',
          type: 'error' as const
        };
        return (
          <NTag size="small" type={statusInfo.type}>
            {statusInfo.label}
          </NTag>
        );
      }
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 160
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
      render: row => {
        const dataRow = row as unknown as Api.Tool.TemplateGroup;
        const isSystem = dataRow.tenantId === null;

        const viewBtn = () => {
          return (
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:visibility-outline"
              tooltipContent="查看模板"
              onClick={() => handleViewTemplates(dataRow)}
            />
          );
        };

        const exportBtn = () => {
          if (!hasAuth('tool:gen:template:export')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="success"
              icon="material-symbols:download"
              tooltipContent="导出"
              onClick={() => handleExport(dataRow.id as number)}
            />
          );
        };

        const editBtn = () => {
          if (!hasAuth('tool:gen:template:edit') || isSystem) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => edit(dataRow.id as number)}
            />
          );
        };

        const deleteBtn = () => {
          if (!hasAuth('tool:gen:template:remove') || isSystem) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(dataRow.id as number)}
            />
          );
        };

        const buttons = [viewBtn(), exportBtn(), editBtn(), deleteBtn()].filter(Boolean);

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
      }
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data as any, getData);

// 模板编辑器状态
const templateEditorVisible = ref(false);
const templateOperateType = ref<NaiveUI.TableOperateType>('add');
const editingTemplate = ref<Api.Tool.Template | null>(null);
const currentGroupId = ref<number>(0);

// 导入抽屉状态
const importDrawerVisible = ref(false);

// 模板详情展示状态
const templateDetailVisible = ref(false);
const currentGroup = ref<Api.Tool.TemplateGroup | null>(null);

async function handleBatchDelete() {
  try {
    // 并行删除所有选中的模板组
    await Promise.all(checkedRowKeys.value.map(id => fetchTemplateDeleteGroup(Number(id))));
    onBatchDeleted();
  } catch {
    // error handled by request interceptor
  }
}

async function handleDelete(id: number) {
  try {
    await fetchTemplateDeleteGroup(id);
    onDeleted();
  } catch {
    // error handled by request interceptor
  }
}

function edit(id: number) {
  handleEdit('id' as any, id);
}

async function handleExport(id: number) {
  try {
    const { data: exportData } = await fetchTemplateExportGroup(id);
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-group-${(exportData as any).name || 'group'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.$message?.success('导出成功');
  } catch {
    // error handled by request interceptor
  }
}

function handleImport() {
  importDrawerVisible.value = true;
}

function handleViewTemplates(group: Api.Tool.TemplateGroup) {
  currentGroup.value = group;
  templateDetailVisible.value = true;
}

function handleAddTemplate(groupId: number) {
  currentGroupId.value = groupId;
  templateOperateType.value = 'add';
  editingTemplate.value = null;
  templateEditorVisible.value = true;
}

function handleEditTemplate(template: Api.Tool.Template) {
  currentGroupId.value = template.groupId as number;
  templateOperateType.value = 'edit';
  editingTemplate.value = template;
  templateEditorVisible.value = true;
}

async function handleDeleteTemplate(id: number) {
  try {
    await fetchTemplateDeleteTemplate(id);
    window.$message?.success('删除成功');
    // 刷新当前组的模板列表
    getData();
  } catch {
    // error handled by request interceptor
  }
}

function handleTemplateSubmitted() {
  getData();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <TemplateGroupSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard title="模板管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NButton v-if="hasAuth('tool:gen:template:import')" secondary @click="handleImport">
            <template #icon>
              <SvgIcon icon="material-symbols:upload-file" />
            </template>
            导入
          </NButton>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="hasAuth('tool:gen:template:add')"
            :show-delete="hasAuth('tool:gen:template:remove')"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
        </NSpace>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        v-bind="tableProps"
        :flex-height="!appStore.isMobile"
        :scroll-x="1200"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <TemplateGroupOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="(editingData as unknown as Api.Tool.TemplateGroup)"
        @submitted="getData"
      />
      <TemplateEditorDrawer
        v-model:visible="templateEditorVisible"
        :operate-type="templateOperateType"
        :row-data="editingTemplate"
        :group-id="currentGroupId"
        @submitted="handleTemplateSubmitted"
      />
      <TemplateImportDrawer v-model:visible="importDrawerVisible" @submitted="getData" />
    </NCard>

    <!-- 模板详情抽屉 -->
    <NDrawer v-model:show="templateDetailVisible" :width="700" class="max-w-90%">
      <NDrawerContent :title="`模板组: ${currentGroup?.name || ''}`" :native-scrollbar="false" closable>
        <template v-if="currentGroup">
          <NSpace vertical :size="16" class="w-full">
            <NCard size="small" title="基本信息">
              <NDescriptions :column="2" label-placement="left">
                <NDescriptionsItem label="名称">{{ currentGroup.name }}</NDescriptionsItem>
                <NDescriptionsItem label="类型">
                  <NTag v-if="currentGroup.tenantId === null" size="small" type="warning">系统级</NTag>
                  <NTag v-else size="small" type="info">租户级</NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="描述" :span="2">{{ currentGroup.description || '-' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard size="small">
              <template #header>
                <div class="flex items-center justify-between">
                  <span>模板列表 ({{ currentGroup.templates?.length || 0 }})</span>
                  <NButton
                    v-if="hasAuth('tool:gen:template:add') && currentGroup.tenantId !== null"
                    size="small"
                    type="primary"
                    @click="handleAddTemplate(currentGroup.id as number)"
                  >
                    <template #icon>
                      <SvgIcon icon="material-symbols:add" />
                    </template>
                    新增模板
                  </NButton>
                </div>
              </template>

              <NEmpty v-if="!currentGroup.templates?.length" description="暂无模板" />

              <NCollapse v-else>
                <NCollapseItem
                  v-for="template in currentGroup.templates"
                  :key="template.id as number"
                  :name="String(template.id)"
                >
                  <template #header>
                    <div class="flex items-center gap-8px">
                      <span>{{ template.name }}</span>
                      <NTag
                        size="small"
                        :style="{ backgroundColor: (languageMap as any)[template.language as string]?.color || '#666', color: '#fff' }"
                      >
                        {{ (languageMap as any)[template.language as string]?.label || template.language }}
                      </NTag>
                    </div>
                  </template>
                  <template #header-extra>
                    <NSpace v-if="currentGroup.tenantId !== null" @click.stop>
                      <NButton
                        v-if="hasAuth('tool:gen:template:edit')"
                        size="tiny"
                        secondary
                        @click="handleEditTemplate(template)"
                      >
                        编辑
                      </NButton>
                      <NPopconfirm @positive-click="handleDeleteTemplate(template.id as number)">
                        <template #trigger>
                          <NButton v-if="hasAuth('tool:gen:template:remove')" size="tiny" secondary type="error">
                            删除
                          </NButton>
                        </template>
                        确定要删除该模板吗？
                      </NPopconfirm>
                    </NSpace>
                  </template>
                  <NDescriptions :column="1" label-placement="left" size="small">
                    <NDescriptionsItem label="输出文件名">
                      <code class="rounded bg-gray-100 px-4px py-2px dark:bg-gray-700">{{ template.fileName }}</code>
                    </NDescriptionsItem>
                    <NDescriptionsItem label="输出路径">
                      <code class="rounded bg-gray-100 px-4px py-2px dark:bg-gray-700">{{ template.filePath }}</code>
                    </NDescriptionsItem>
                    <NDescriptionsItem label="排序号">{{ template.sort }}</NDescriptionsItem>
                    <NDescriptionsItem label="状态">
                      <NTag :type="template.status === '0' ? 'success' : 'error'" size="small">
                        {{ template.status === '0' ? '正常' : '停用' }}
                      </NTag>
                    </NDescriptionsItem>
                  </NDescriptions>
                  <NDivider style="margin: 12px 0" />
                  <div class="text-12px text-gray-500">模板内容预览:</div>
                  <NScrollbar style="max-height: 200px">
                    <pre class="m-0 rounded bg-gray-100 p-8px text-12px dark:bg-gray-800">{{ template.content }}</pre>
                  </NScrollbar>
                </NCollapseItem>
              </NCollapse>
            </NCard>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped></style>
