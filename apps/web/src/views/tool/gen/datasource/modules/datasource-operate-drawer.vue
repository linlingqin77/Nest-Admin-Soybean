<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { fetchDataSourceCreate, fetchDataSourceTestConnection, fetchDataSourceUpdate } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'DataSourceOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Tool.DataSource | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增数据源',
    edit: '编辑数据源'
  };
  return titles[props.operateType];
});

// 数据库类型选项
const dbTypeOptions = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'SQLite', value: 'sqlite' }
];

// 默认端口映射
const defaultPorts: Record<string, number> = {
  postgresql: 5432,
  mysql: 3306,
  sqlite: 0
};

type Model = {
  id?: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  status: string;
  remark: string;
};

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    status: '0',
    remark: ''
  };
}

type RuleKey = Extract<keyof Model, 'name' | 'type' | 'host' | 'port' | 'database' | 'username' | 'password'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  name: createRequiredRule('请输入数据源名称'),
  type: createRequiredRule('请选择数据库类型'),
  host: createRequiredRule('请输入主机地址'),
  port: createRequiredRule('请输入端口号'),
  database: createRequiredRule('请输入数据库名称'),
  username: createRequiredRule('请输入用户名'),
  password: createRequiredRule('请输入密码')
};

// 编辑模式下密码不是必填
const editRules = computed(() => {
  if (props.operateType === 'edit') {
    const { password: _password, ...rest } = rules;
    return rest;
  }
  return rules;
});

// 测试连接状态
const testLoading = ref(false);
const testResult = ref<'success' | 'error' | null>(null);

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, {
      id: props.rowData.id,
      name: props.rowData.name,
      type: props.rowData.type,
      host: props.rowData.host,
      port: props.rowData.port,
      database: props.rowData.database,
      username: props.rowData.username,
      password: '', // 编辑时不显示密码
      status: props.rowData.status,
      remark: props.rowData.remark || ''
    });
  }
}

// 数据库类型变化时更新默认端口
function handleTypeChange(type: string) {
  model.port = defaultPorts[type] || 5432;
}

function closeDrawer() {
  visible.value = false;
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    type: '数据库类型',
    host: '主机地址',
    port: '端口号',
    database: '数据库名称',
    username: '用户名',
    password: '密码'
  };
  return labels[field] || field;
}

async function handleTestConnection() {
  // 验证必填字段
  const requiredFields = ['type', 'host', 'port', 'database', 'username', 'password'] as const;
  for (const field of requiredFields) {
    if (!model[field]) {
      window.$message?.warning(`请先填写${getFieldLabel(field)}`);
      return;
    }
  }

  testLoading.value = true;
  testResult.value = null;

  try {
    const testData: Api.Tool.DataSourceOperateParams = {
      type: model.type,
      host: model.host,
      port: model.port,
      database: model.database,
      username: model.username,
      password: model.password
    };
    const { data: result } = await fetchDataSourceTestConnection(testData);
    if (result) {
      testResult.value = 'success';
      window.$message?.success('连接成功');
    } else {
      testResult.value = 'error';
      window.$message?.error('连接失败');
    }
  } catch {
    testResult.value = 'error';
    // error handled by request interceptor
  } finally {
    testLoading.value = false;
  }
}

async function handleSubmit() {
  await validate();

  try {
    if (props.operateType === 'add') {
      const createData: Api.Tool.DataSourceOperateParams = {
        name: model.name,
        type: model.type,
        host: model.host,
        port: model.port,
        database: model.database,
        username: model.username,
        password: model.password,
        remark: model.remark || undefined
      };
      await fetchDataSourceCreate(createData);
    } else if (props.operateType === 'edit' && model.id) {
      const updateData: Api.Tool.DataSourceOperateParams = {
        name: model.name,
        type: model.type,
        host: model.host,
        port: model.port,
        database: model.database,
        username: model.username,
        status: model.status as CommonType.EnableStatus,
        remark: model.remark || undefined
      };
      // 只有填写了密码才更新
      if (model.password) {
        updateData.password = model.password;
      }
      await fetchDataSourceUpdate(model.id, updateData);
    }

    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } catch {
    // error handled by request interceptor
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
    testResult.value = null;
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="600" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="editRules" label-placement="left" :label-width="100">
        <NFormItem label="数据源名称" path="name">
          <NInput v-model:value="model.name" placeholder="请输入数据源名称" />
        </NFormItem>
        <NFormItem label="数据库类型" path="type">
          <NSelect
            v-model:value="model.type"
            :options="dbTypeOptions"
            placeholder="请选择数据库类型"
            @update:value="handleTypeChange"
          />
        </NFormItem>
        <NFormItem label="主机地址" path="host">
          <NInput v-model:value="model.host" placeholder="请输入主机地址" />
        </NFormItem>
        <NFormItem label="端口号" path="port">
          <NInputNumber v-model:value="model.port" :min="1" :max="65535" placeholder="请输入端口号" class="w-full" />
        </NFormItem>
        <NFormItem label="数据库名称" path="database">
          <NInput v-model:value="model.database" placeholder="请输入数据库名称" />
        </NFormItem>
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="model.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="密码" path="password">
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            :placeholder="operateType === 'edit' ? '留空则不修改密码' : '请输入密码'"
          />
        </NFormItem>
        <NFormItem v-if="operateType === 'edit'" label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NSpace>
              <NRadio value="0">正常</NRadio>
              <NRadio value="1">停用</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </NFormItem>
        <NFormItem label="连接测试">
          <NSpace align="center">
            <NButton :loading="testLoading" @click="handleTestConnection">
              <template #icon>
                <SvgIcon icon="material-symbols:link" />
              </template>
              测试连接
            </NButton>
            <NTag v-if="testResult === 'success'" type="success" size="small">连接成功</NTag>
            <NTag v-else-if="testResult === 'error'" type="error" size="small">连接失败</NTag>
          </NSpace>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
