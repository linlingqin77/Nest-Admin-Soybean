<script setup lang="ts">
/**
 * 模板管理弹窗组件
 * 展示代码生成模板列表和变量说明
 */
import { ref, computed } from 'vue';
import {
  NModal,
  NTabs,
  NTabPane,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NCollapse,
  NCollapseItem,
  NCode,
  NTag,
  NSpace,
  NButton,
  NAlert
} from 'naive-ui';

defineOptions({
  name: 'GenTemplateModal'
});

const visible = defineModel<boolean>('visible', {
  default: false
});

// 模板分类
const templateCategories = [
  {
    name: 'backend',
    label: '后端模板',
    templates: [
      { name: 'module.ejs', description: 'NestJS 模块文件', path: 'backend/module.ejs' },
      { name: 'controller.ejs', description: '控制器文件', path: 'backend/controller.ejs' },
      { name: 'service.ejs', description: '服务文件', path: 'backend/service.ejs' },
      { name: 'dto.ejs', description: 'DTO 数据传输对象', path: 'backend/dto.ejs' },
      { name: 'entity.ejs', description: '实体文件', path: 'backend/entity.ejs' }
    ]
  },
  {
    name: 'frontend',
    label: '前端模板',
    templates: [
      { name: 'index.vue.ejs', description: '主页面模板', path: 'frontend/index.vue.ejs' },
      { name: 'search.vue.ejs', description: '搜索组件模板', path: 'frontend/modules/search.vue.ejs' },
      { name: 'drawer.vue.ejs', description: '编辑抽屉模板', path: 'frontend/modules/drawer.vue.ejs' },
      { name: 'api.ts.ejs', description: 'API 服务模板', path: 'frontend/api.ts.ejs' },
      { name: 'types.ts.ejs', description: '类型定义模板', path: 'frontend/types.ts.ejs' }
    ]
  },
  {
    name: 'tree',
    label: '树表模板',
    templates: [
      { name: 'tree/service.ejs', description: '树表服务模板', path: 'backend/tree/service.ejs' },
      { name: 'tree/index.vue.ejs', description: '树表前端模板', path: 'frontend/tree/index.vue.ejs' }
    ]
  },
  {
    name: 'sub',
    label: '主子表模板',
    templates: [
      { name: 'sub/service.ejs', description: '主子表服务模板', path: 'backend/sub/service.ejs' },
      { name: 'sub/index.vue.ejs', description: '主子表前端模板', path: 'frontend/sub/index.vue.ejs' },
      { name: 'sub/sub-table.vue.ejs', description: '子表组件模板', path: 'frontend/sub/sub-table.vue.ejs' }
    ]
  },
  {
    name: 'test',
    label: '测试模板',
    templates: [
      { name: 'service.spec.ejs', description: '服务单元测试模板', path: 'backend/test/service.spec.ejs' },
      { name: 'controller.spec.ejs', description: '控制器单元测试模板', path: 'backend/test/controller.spec.ejs' },
      { name: 'factory.ejs', description: '测试数据工厂模板', path: 'backend/test/factory.ejs' },
      { name: 'e2e.spec.ejs', description: 'E2E 测试模板', path: 'backend/test/e2e.spec.ejs' }
    ]
  },
  {
    name: 'sql',
    label: 'SQL 模板',
    templates: [{ name: 'menu.sql.ejs', description: '菜单 SQL 模板', path: 'sql/menu.sql.ejs' }]
  }
];

// 模板变量说明
const templateVariables = [
  {
    category: '表信息',
    variables: [
      { name: 'tableName', type: 'string', description: '表名称，如 sys_user' },
      { name: 'tableComment', type: 'string', description: '表描述/注释' },
      { name: 'className', type: 'string', description: '实体类名称（PascalCase），如 SysUser' },
      { name: 'classNameLower', type: 'string', description: '实体类名称（camelCase），如 sysUser' }
    ]
  },
  {
    category: '模块信息',
    variables: [
      { name: 'moduleName', type: 'string', description: '模块名称，如 system' },
      { name: 'businessName', type: 'string', description: '业务名称，如 user' },
      { name: 'BusinessName', type: 'string', description: '业务名称（首字母大写），如 User' },
      { name: 'functionName', type: 'string', description: '功能名称，如 用户管理' },
      { name: 'functionAuthor', type: 'string', description: '作者名称' }
    ]
  },
  {
    category: '路径信息',
    variables: [
      { name: 'packageName', type: 'string', description: '包路径，如 src/module/system' },
      { name: 'apiPath', type: 'string', description: 'API 路径，如 /system/user' }
    ]
  },
  {
    category: '字段信息',
    variables: [
      { name: 'columns', type: 'GenTableColumn[]', description: '所有字段列表' },
      { name: 'pkColumn', type: 'GenTableColumn', description: '主键字段' },
      { name: 'primaryKey', type: 'string', description: '主键字段名' },
      { name: 'listColumns', type: 'GenTableColumn[]', description: '列表显示字段' },
      { name: 'formColumns', type: 'GenTableColumn[]', description: '表单字段' },
      { name: 'queryColumns', type: 'GenTableColumn[]', description: '查询字段' },
      { name: 'insertColumns', type: 'GenTableColumn[]', description: '新增字段' },
      { name: 'editColumns', type: 'GenTableColumn[]', description: '编辑字段' }
    ]
  },
  {
    category: '辅助信息',
    variables: [
      { name: 'datetime', type: 'string', description: '生成时间，如 2024-01-01' },
      { name: 'hasDict', type: 'boolean', description: '是否有字典字段' },
      { name: 'dictTypes', type: 'string[]', description: '使用的字典类型列表' }
    ]
  },
  {
    category: '企业级功能',
    variables: [
      { name: 'options.enableDataScope', type: 'boolean', description: '是否启用数据权限' },
      { name: 'options.enableExport', type: 'boolean', description: '是否启用导出' },
      { name: 'options.enableImport', type: 'boolean', description: '是否启用导入' },
      { name: 'options.enableTenant', type: 'boolean', description: '是否启用多租户' },
      { name: 'options.enableOperlog', type: 'boolean', description: '是否启用操作日志' },
      { name: 'options.enableUnitTest', type: 'boolean', description: '是否生成单元测试' },
      { name: 'options.enableE2ETest', type: 'boolean', description: '是否生成 E2E 测试' }
    ]
  }
];

// 字段属性说明
const columnProperties = [
  { name: 'columnName', type: 'string', description: '列名称' },
  { name: 'columnComment', type: 'string', description: '列描述' },
  { name: 'columnType', type: 'string', description: '列类型（数据库类型）' },
  { name: 'tsType', type: 'string', description: 'TypeScript 类型' },
  { name: 'tsField', type: 'string', description: 'TypeScript 属性名（camelCase）' },
  { name: 'isPk', type: "'YES'|'NO'", description: '是否主键' },
  { name: 'isIncrement', type: "'YES'|'NO'", description: '是否自增' },
  { name: 'isRequired', type: "'YES'|'NO'", description: '是否必填' },
  { name: 'isInsert', type: "'YES'|'NO'", description: '是否插入字段' },
  { name: 'isEdit', type: "'YES'|'NO'", description: '是否编辑字段' },
  { name: 'isList', type: "'YES'|'NO'", description: '是否列表字段' },
  { name: 'isQuery', type: "'YES'|'NO'", description: '是否查询字段' },
  { name: 'queryType', type: 'QueryType', description: '查询方式（EQ, LIKE, BETWEEN 等）' },
  { name: 'htmlType', type: 'HtmlType', description: '显示类型（input, select, datetime 等）' },
  { name: 'dictType', type: 'string', description: '字典类型' }
];

// 辅助函数说明
const helperFunctions = [
  { name: 'capitalize(str)', description: '首字母大写' },
  { name: 'camelCase(str)', description: '转换为驼峰命名' },
  { name: 'kebabCase(str)', description: '转换为短横线命名' },
  { name: 'snakeCase(str)', description: '转换为下划线命名' },
  { name: 'getTsType(column)', description: '获取字段的 TypeScript 类型' },
  { name: 'getFormComponent(column)', description: '获取字段对应的表单组件' },
  { name: 'isStringType(column)', description: '判断是否为字符串类型' },
  { name: 'isNumberType(column)', description: '判断是否为数字类型' },
  { name: 'isDateType(column)', description: '判断是否为日期类型' }
];

function closeModal() {
  visible.value = false;
}

// 示例代码
const exampleCode = `// 遍历字段生成表单项
<% columns.forEach(function(col) { %>
  <% if (col.isInsert === 'YES') { %>
    <NFormItem label="<%= col.columnComment %>" path="<%= col.tsField %>">
      <% if (col.htmlType === 'input') { %>
        <NInput v-model:value="formData.<%= col.tsField %>" />
      <% } else if (col.htmlType === 'select') { %>
        <NSelect v-model:value="formData.<%= col.tsField %>" />
      <% } %>
    </NFormItem>
  <% } %>
<% }); %>`;
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="模板管理"
    :style="{ width: '900px', maxHeight: '80vh' }"
    :mask-closable="false"
    :segmented="{ content: true }"
  >
    <NTabs type="line" animated>
      <NTabPane name="templates" tab="模板列表">
        <NAlert type="info" class="mb-4">
          代码生成器使用 EJS 模板引擎，模板文件位于 server/src/module/system/tool/gen/templates/ 目录下
        </NAlert>
        <NCollapse>
          <NCollapseItem v-for="category in templateCategories" :key="category.name" :title="category.label">
            <div class="grid grid-cols-1 gap-2">
              <NCard v-for="template in category.templates" :key="template.name" size="small">
                <div class="flex items-center justify-between">
                  <div>
                    <NTag type="primary" size="small">{{ template.name }}</NTag>
                    <span class="ml-2 text-gray-500">{{ template.description }}</span>
                  </div>
                  <span class="text-xs text-gray-400">{{ template.path }}</span>
                </div>
              </NCard>
            </div>
          </NCollapseItem>
        </NCollapse>
      </NTabPane>

      <NTabPane name="variables" tab="模板变量">
        <NAlert type="info" class="mb-4">
          以下变量可在模板中使用，通过 EJS 语法 &lt;%= variableName %&gt; 访问
        </NAlert>
        <NCollapse>
          <NCollapseItem v-for="group in templateVariables" :key="group.category" :title="group.category">
            <NDescriptions :column="1" bordered size="small">
              <NDescriptionsItem v-for="v in group.variables" :key="v.name" :label="v.name">
                <div class="flex items-center gap-2">
                  <NTag size="small" type="info">{{ v.type }}</NTag>
                  <span>{{ v.description }}</span>
                </div>
              </NDescriptionsItem>
            </NDescriptions>
          </NCollapseItem>
        </NCollapse>
      </NTabPane>

      <NTabPane name="column" tab="字段属性">
        <NAlert type="info" class="mb-4">
          GenTableColumn 对象的属性，可通过 columns 数组遍历访问
        </NAlert>
        <NDescriptions :column="1" bordered size="small">
          <NDescriptionsItem v-for="prop in columnProperties" :key="prop.name" :label="prop.name">
            <div class="flex items-center gap-2">
              <NTag size="small" type="info">{{ prop.type }}</NTag>
              <span>{{ prop.description }}</span>
            </div>
          </NDescriptionsItem>
        </NDescriptions>
      </NTabPane>

      <NTabPane name="helpers" tab="辅助函数">
        <NAlert type="info" class="mb-4">
          模板中可用的辅助函数，用于字符串处理和类型判断
        </NAlert>
        <NDescriptions :column="1" bordered size="small">
          <NDescriptionsItem v-for="fn in helperFunctions" :key="fn.name" :label="fn.name">
            {{ fn.description }}
          </NDescriptionsItem>
        </NDescriptions>

        <NDivider>使用示例</NDivider>
        <NCode
          :code="exampleCode"
          language="html"
        />
      </NTabPane>
    </NTabs>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeModal">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
