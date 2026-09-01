/**
 * Prisma Seed Data
 *
 * 种子数据 — 系统初始化所需的最小集合
 *
 * 运行方式: pnpm prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import { menuData } from './seeds/menus.data';

const prisma = new PrismaClient();

async function main() {
  console.log('开始导入种子数据...');

  // sys_tenant_package
  await prisma.sysTenantPackage.createMany({
    data: [
      {
        packageId: 1,
        packageName: '基础套餐',
        menuIds: '1,2,3,100,101,102,103,104,105,106,107,118,119,120,108,109,110,112,113,114,115,116,117,500,501,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1078',
        menuCheckStrictly: true,
        status: '0',
        remark: '基础套餐，包含所有菜单权限',
      },
    ],
    skipDuplicates: true,
  });

  // sys_tenant
  await prisma.sysTenant.createMany({
    data: [
      {
        id: 1,
        tenantId: '000000',
        contactUserName: 'admin',
        contactPhone: '15888888888',
        companyName: '管理组',
        licenseNumber: null,
        address: null,
        intro: '系统默认租户，不可删除',
        domain: null,
        packageId: null,
        expireTime: null,
        accountCount: -1,
        storageQuota: 10240,
        storageUsed: 0,
        status: '0',
        remark: '超级管理员租户',
      },
    ],
    skipDuplicates: true,
  });

  // sys_client
  await prisma.sysClient.createMany({
    data: [
      {
        id: 1,
        clientId: 'e5cd7e4891bf95d1d19206ce24a7b32e',
        clientKey: 'pc',
        clientSecret: process.env.SEED_CLIENT_SECRET_PC ?? '__SET_VIA_ENV__',
        grantTypeList: 'password,social',
        deviceType: 'pc',
        activeTimeout: 1800,
        timeout: 86400,
        status: '0',
      },
      {
        id: 2,
        clientId: '428a8310a3c9c5eb0a7c4c9d4b3d0c37',
        clientKey: 'app',
        clientSecret: process.env.SEED_CLIENT_SECRET_APP ?? '__SET_VIA_ENV__',
        grantTypeList: 'password,social',
        deviceType: 'app',
        activeTimeout: 1800,
        timeout: 86400,
        status: '0',
      },
    ],
    skipDuplicates: true,
  });

  // sys_dict_type
  await prisma.sysDictType.createMany({
    data: [
      {
        dictId: 1,
        tenantId: '000000',
        dictName: '用户性别',
        dictType: 'sys_user_sex',
        status: '0',
        remark: '用户性别列表',
      },
      {
        dictId: 2,
        tenantId: '000000',
        dictName: '菜单状态',
        dictType: 'sys_show_hide',
        status: '0',
        remark: '菜单状态列表',
      },
      {
        dictId: 3,
        tenantId: '000000',
        dictName: '系统开关',
        dictType: 'sys_normal_disable',
        status: '0',
        remark: '系统开关列表',
      },
      {
        dictId: 4,
        tenantId: '000000',
        dictName: '任务状态',
        dictType: 'sys_job_status',
        status: '0',
        remark: '任务状态列表',
      },
      {
        dictId: 5,
        tenantId: '000000',
        dictName: '任务分组',
        dictType: 'sys_job_group',
        status: '0',
        remark: '任务分组列表',
      },
      {
        dictId: 6,
        tenantId: '000000',
        dictName: '系统是否',
        dictType: 'sys_yes_no',
        status: '0',
        remark: '系统是否列表',
      },
      {
        dictId: 7,
        tenantId: '000000',
        dictName: '通知类型',
        dictType: 'sys_notice_type',
        status: '0',
        remark: '通知类型列表',
      },
      {
        dictId: 8,
        tenantId: '000000',
        dictName: '通知状态',
        dictType: 'sys_notice_status',
        status: '0',
        remark: '通知状态列表',
      },
      {
        dictId: 9,
        tenantId: '000000',
        dictName: '操作类型',
        dictType: 'sys_oper_type',
        status: '0',
        remark: '操作类型列表',
      },
      {
        dictId: 10,
        tenantId: '000000',
        dictName: '系统状态',
        dictType: 'sys_common_status',
        status: '0',
        remark: '登录状态列表',
      },
    ],
    skipDuplicates: true,
  });

  // sys_dict_data
  await prisma.sysDictData.createMany({
    data: [
      {
        dictCode: 1,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '男',
        dictValue: '0',
        dictType: 'sys_user_sex',
        cssClass: '',
        listClass: '',
        isDefault: 'Y',
        status: '0',
        remark: '性别男',
      },
      {
        dictCode: 2,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '女',
        dictValue: '1',
        dictType: 'sys_user_sex',
        cssClass: '',
        listClass: '',
        isDefault: 'N',
        status: '0',
        remark: '性别女',
      },
      {
        dictCode: 3,
        tenantId: '000000',
        dictSort: 3,
        dictLabel: '未知',
        dictValue: '2',
        dictType: 'sys_user_sex',
        cssClass: '',
        listClass: '',
        isDefault: 'N',
        status: '0',
        remark: '性别未知',
      },
      {
        dictCode: 4,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '显示',
        dictValue: '0',
        dictType: 'sys_show_hide',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'Y',
        status: '0',
        remark: '显示菜单',
      },
      {
        dictCode: 5,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '隐藏',
        dictValue: '1',
        dictType: 'sys_show_hide',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '隐藏菜单',
      },
      {
        dictCode: 6,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '正常',
        dictValue: '0',
        dictType: 'sys_normal_disable',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'Y',
        status: '0',
        remark: '正常状态',
      },
      {
        dictCode: 7,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '停用',
        dictValue: '1',
        dictType: 'sys_normal_disable',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '停用状态',
      },
      {
        dictCode: 8,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '正常',
        dictValue: '0',
        dictType: 'sys_job_status',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'Y',
        status: '0',
        remark: '正常状态',
      },
      {
        dictCode: 9,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '暂停',
        dictValue: '1',
        dictType: 'sys_job_status',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '停用状态',
      },
      {
        dictCode: 10,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '默认',
        dictValue: 'DEFAULT',
        dictType: 'sys_job_group',
        cssClass: '',
        listClass: '',
        isDefault: 'Y',
        status: '0',
        remark: '默认分组',
      },
      {
        dictCode: 11,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '系统',
        dictValue: 'SYSTEM',
        dictType: 'sys_job_group',
        cssClass: '',
        listClass: '',
        isDefault: 'N',
        status: '0',
        remark: '系统分组',
      },
      {
        dictCode: 12,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '是',
        dictValue: 'Y',
        dictType: 'sys_yes_no',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'Y',
        status: '0',
        remark: '系统默认是',
      },
      {
        dictCode: 13,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '否',
        dictValue: 'N',
        dictType: 'sys_yes_no',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '系统默认否',
      },
      {
        dictCode: 14,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '通知',
        dictValue: '1',
        dictType: 'sys_notice_type',
        cssClass: '',
        listClass: 'warning',
        isDefault: 'Y',
        status: '0',
        remark: '通知',
      },
      {
        dictCode: 15,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '公告',
        dictValue: '2',
        dictType: 'sys_notice_type',
        cssClass: '',
        listClass: 'success',
        isDefault: 'N',
        status: '0',
        remark: '公告',
      },
      {
        dictCode: 16,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '正常',
        dictValue: '0',
        dictType: 'sys_notice_status',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'Y',
        status: '0',
        remark: '正常状态',
      },
      {
        dictCode: 17,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '关闭',
        dictValue: '1',
        dictType: 'sys_notice_status',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '关闭状态',
      },
      {
        dictCode: 18,
        tenantId: '000000',
        dictSort: 99,
        dictLabel: '其他',
        dictValue: '0',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'info',
        isDefault: 'N',
        status: '0',
        remark: '其他操作',
      },
      {
        dictCode: 19,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '新增',
        dictValue: '1',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'info',
        isDefault: 'N',
        status: '0',
        remark: '新增操作',
      },
      {
        dictCode: 20,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '修改',
        dictValue: '2',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'info',
        isDefault: 'N',
        status: '0',
        remark: '修改操作',
      },
      {
        dictCode: 21,
        tenantId: '000000',
        dictSort: 3,
        dictLabel: '删除',
        dictValue: '3',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '删除操作',
      },
      {
        dictCode: 22,
        tenantId: '000000',
        dictSort: 4,
        dictLabel: '授权',
        dictValue: '4',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'N',
        status: '0',
        remark: '授权操作',
      },
      {
        dictCode: 23,
        tenantId: '000000',
        dictSort: 5,
        dictLabel: '导出',
        dictValue: '5',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'warning',
        isDefault: 'N',
        status: '0',
        remark: '导出操作',
      },
      {
        dictCode: 24,
        tenantId: '000000',
        dictSort: 6,
        dictLabel: '导入',
        dictValue: '6',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'warning',
        isDefault: 'N',
        status: '0',
        remark: '导入操作',
      },
      {
        dictCode: 25,
        tenantId: '000000',
        dictSort: 7,
        dictLabel: '强退',
        dictValue: '7',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '强退操作',
      },
      {
        dictCode: 26,
        tenantId: '000000',
        dictSort: 8,
        dictLabel: '生成代码',
        dictValue: '8',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'warning',
        isDefault: 'N',
        status: '0',
        remark: '生成操作',
      },
      {
        dictCode: 27,
        tenantId: '000000',
        dictSort: 9,
        dictLabel: '清空数据',
        dictValue: '9',
        dictType: 'sys_oper_type',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '清空操作',
      },
      {
        dictCode: 28,
        tenantId: '000000',
        dictSort: 1,
        dictLabel: '成功',
        dictValue: '0',
        dictType: 'sys_common_status',
        cssClass: '',
        listClass: 'primary',
        isDefault: 'N',
        status: '0',
        remark: '正常状态',
      },
      {
        dictCode: 29,
        tenantId: '000000',
        dictSort: 2,
        dictLabel: '失败',
        dictValue: '1',
        dictType: 'sys_common_status',
        cssClass: '',
        listClass: 'danger',
        isDefault: 'N',
        status: '0',
        remark: '停用状态',
      },
    ],
    skipDuplicates: true,
  });

  // sys_config
  await prisma.sysConfig.createMany({
    data: [
      {
        configId: 1,
        tenantId: '000000',
        configName: '主框架页-默认皮肤样式名称',
        configKey: 'sys.index.skinName',
        configValue: 'skin-blue',
        configType: 'Y',
        remark: '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow',
        status: '0',
      },
      {
        configId: 2,
        tenantId: '000000',
        configName: '用户管理-账号初始密码',
        configKey: 'sys.user.initPassword',
        configValue: '123456',
        configType: 'Y',
        remark: '初始化密码 123456',
        status: '0',
      },
      {
        configId: 3,
        tenantId: '000000',
        configName: '主框架页-侧边栏主题',
        configKey: 'sys.index.sideTheme',
        configValue: 'theme-dark',
        configType: 'Y',
        remark: '深色主题theme-dark，浅色主题theme-light',
        status: '0',
      },
      {
        configId: 4,
        tenantId: '000000',
        configName: '账号自助-验证码开关',
        configKey: 'sys.account.captchaEnabled',
        configValue: 'true',
        configType: 'Y',
        remark: '是否开启验证码功能（true开启，false关闭）',
        status: '0',
      },
      {
        configId: 5,
        tenantId: '000000',
        configName: '账号自助-是否开启用户注册功能',
        configKey: 'sys.account.registerUser',
        configValue: 'false',
        configType: 'Y',
        remark: '是否开启注册用户功能（true开启，false关闭）',
        status: '0',
      },
      {
        configId: 6,
        tenantId: '000000',
        configName: '用户登录-黑名单列表',
        configKey: 'sys.login.blackIPList',
        configValue: '',
        configType: 'Y',
        remark: '设置登录IP黑名单限制，多个匹配项以;分隔，支持匹配（*通配、网段）',
        status: '0',
      },
    ],
    skipDuplicates: true,
  });

  // sys_dept
  await prisma.sysDept.createMany({
    data: [
      {
        deptId: 100,
        tenantId: '000000',
        parentId: 0,
        ancestors: '0',
        deptName: '项目根组织',
        orderNum: 0,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 101,
        tenantId: '000000',
        parentId: 100,
        ancestors: '0,100',
        deptName: '深圳总公司',
        orderNum: 1,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 102,
        tenantId: '000000',
        parentId: 100,
        ancestors: '0,100',
        deptName: '长沙分公司',
        orderNum: 2,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 103,
        tenantId: '000000',
        parentId: 101,
        ancestors: '0,100,101',
        deptName: '研发部门',
        orderNum: 1,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 104,
        tenantId: '000000',
        parentId: 101,
        ancestors: '0,100,101',
        deptName: '市场部门',
        orderNum: 2,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 105,
        tenantId: '000000',
        parentId: 101,
        ancestors: '0,100,101',
        deptName: '测试部门',
        orderNum: 3,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 106,
        tenantId: '000000',
        parentId: 101,
        ancestors: '0,100,101',
        deptName: '财务部门',
        orderNum: 4,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 107,
        tenantId: '000000',
        parentId: 101,
        ancestors: '0,100,101',
        deptName: '运维部门',
        orderNum: 5,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 108,
        tenantId: '000000',
        parentId: 102,
        ancestors: '0,100,102',
        deptName: '市场部门',
        orderNum: 1,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
      {
        deptId: 109,
        tenantId: '000000',
        parentId: 102,
        ancestors: '0,100,102',
        deptName: '财务部门',
        orderNum: 2,
        leader: 'admin',
        phone: '15888888888',
        email: 'demo@nestadmin.com',
        status: '0',
        remark: null,
      },
    ],
    skipDuplicates: true,
  });

  // sys_post
  await prisma.sysPost.createMany({
    data: [
      {
        postId: 1,
        tenantId: '000000',
        deptId: null,
        postCode: 'ceo',
        postCategory: null,
        postName: '董事长',
        postSort: 1,
        status: '0',
        remark: '',
      },
      {
        postId: 2,
        tenantId: '000000',
        deptId: null,
        postCode: 'se',
        postCategory: null,
        postName: '项目经理',
        postSort: 2,
        status: '0',
        remark: '',
      },
      {
        postId: 3,
        tenantId: '000000',
        deptId: null,
        postCode: 'hr',
        postCategory: null,
        postName: '人力资源',
        postSort: 3,
        status: '0',
        remark: '',
      },
      {
        postId: 4,
        tenantId: '000000',
        deptId: null,
        postCode: 'user',
        postCategory: null,
        postName: '普通员工',
        postSort: 4,
        status: '0',
        remark: '',
      },
    ],
    skipDuplicates: true,
  });

  // sys_role
  await prisma.sysRole.createMany({
    data: [
      {
        roleId: 1,
        tenantId: '000000',
        roleName: '超级管理员',
        roleKey: 'admin',
        roleSort: 1,
        dataScope: '1',
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        status: '0',
        remark: '超级管理员',
      },
      {
        roleId: 2,
        tenantId: '000000',
        roleName: '普通角色',
        roleKey: 'common',
        roleSort: 2,
        dataScope: '2',
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        status: '0',
        remark: '普通角色',
      },
      {
        roleId: 3,
        tenantId: '000000',
        roleName: '演示角色',
        roleKey: 'demo',
        roleSort: 10,
        dataScope: '5',
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        status: '0',
        remark: '演示账户角色，仅拥有查看权限',
      },
    ],
    skipDuplicates: true,
  });

  // sys_menu
  await prisma.sysMenu.createMany({
    data: menuData,
    skipDuplicates: true,
  });

  // sys_user
  await prisma.sysUser.createMany({
    data: [
      {
        userId: 1,
        tenantId: '000000',
        deptId: 103,
        userName: 'admin',
        nickName: 'Nest Admin',
        userType: '00',
        email: 'admin@nestadmin.com',
        phonenumber: '15888888888',
        sex: '1',
        avatar: '',
        password: '$2b$10$UrJrjy0kxyrTO1UvhRVsvex35mB1s1jzAraIA9xtzPmlLmRtZXEXS',
        status: '0',
        loginIp: '127.0.0.1',
        loginDate: null,
        remark: '管理员',
      },
      {
        userId: 2,
        tenantId: '000000',
        deptId: 105,
        userName: 'test',
        nickName: 'Nest Admin Test',
        userType: '00',
        email: 'test@nestadmin.com',
        phonenumber: '15666666666',
        sex: '1',
        avatar: '',
        password: '$2b$10$UrJrjy0kxyrTO1UvhRVsvex35mB1s1jzAraIA9xtzPmlLmRtZXEXS',
        status: '0',
        loginIp: '127.0.0.1',
        loginDate: null,
        remark: '测试账号',
      },
      {
        userId: 3,
        tenantId: '000000',
        deptId: 103,
        userName: 'demo',
        nickName: '演示账号',
        userType: '00',
        email: 'demo@example.com',
        phonenumber: '13800138000',
        sex: '0',
        avatar: '',
        password: '$2b$10$g3kM8fAzWz4LAb9bgBJAruofmfFL13xUw1QqOTdrLvouZCLbY7sVa',
        status: '0',
        loginIp: '::1',
        remark: '演示账号（仅开发环境使用）',
      },
    ],
    skipDuplicates: true,
  });

  // sys_notice
  await prisma.sysNotice.createMany({
    data: [
      {
        noticeId: 1,
        tenantId: '000000',
        noticeTitle: '温馨提醒：2025-01-01 Nest-Admin-Soybean新版本发布啦',
        noticeType: '2',
        noticeContent: '新版本内容',
        status: '0',
        remark: null,
      },
      {
        noticeId: 2,
        tenantId: '000000',
        noticeTitle: '维护通知：2025-01-01 Nest-Admin-Soybean系统凌晨维护',
        noticeType: '1',
        noticeContent: '维护内容',
        status: '0',
        remark: null,
      },
    ],
    skipDuplicates: true,
  });

  // sys_job
  await prisma.sysJob.createMany({
    data: [
      {
        jobId: 1,
        tenantId: '000000',
        jobName: '系统默认（无参）',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.systemHeartbeat',
        cronExpression: '0/10 * * * * ?',
        misfirePolicy: '3',
        concurrent: '1',
        status: '1',
        remark: '',
      },
      {
        jobId: 2,
        tenantId: '000000',
        jobName: '系统默认（有参）',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.params(\'admin\')',
        cronExpression: '0/15 * * * * ?',
        misfirePolicy: '3',
        concurrent: '1',
        status: '1',
        remark: '',
      },
      {
        jobId: 3,
        tenantId: '000000',
        jobName: '系统默认（多参）',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.multipleParams(\'admin\', true, 2000, 316.5, 100)',
        cronExpression: '0/20 * * * * ?',
        misfirePolicy: '3',
        concurrent: '1',
        status: '1',
        remark: '',
      },
    ],
    skipDuplicates: true,
  });

  // sys_logininfor
  await prisma.sysLogininfor.createMany({
    data: [
      {
        infoId: 1,
        tenantId: '000000',
        userName: '',
        ipaddr: '::1',
        loginLocation: '',
        browser: 'Chrome 143.0.0',
        os: 'Mac OS X',
        deviceType: '0',
        status: '0',
        msg: '登录成功',
      },
    ],
    skipDuplicates: true,
  });

  // sys_role_dept
  await prisma.sysRoleDept.createMany({
    data: [
      {
        roleId: 2,
        deptId: 100,
      },
      {
        roleId: 2,
        deptId: 101,
      },
      {
        roleId: 2,
        deptId: 105,
      },
    ],
    skipDuplicates: true,
  });

  // sys_role_menu
  await prisma.sysRoleMenu.createMany({
    data: [
      {
        roleId: 2,
        menuId: 1,
      },
      {
        roleId: 2,
        menuId: 2,
      },
      {
        roleId: 2,
        menuId: 3,
      },
      {
        roleId: 2,
        menuId: 4,
      },
      {
        roleId: 2,
        menuId: 100,
      },
      {
        roleId: 2,
        menuId: 101,
      },
      {
        roleId: 2,
        menuId: 102,
      },
      {
        roleId: 2,
        menuId: 103,
      },
      {
        roleId: 2,
        menuId: 104,
      },
      {
        roleId: 2,
        menuId: 105,
      },
      {
        roleId: 2,
        menuId: 106,
      },
      {
        roleId: 2,
        menuId: 107,
      },
      {
        roleId: 2,
        menuId: 108,
      },
      {
        roleId: 2,
        menuId: 109,
      },
      {
        roleId: 2,
        menuId: 110,
      },
      {
        roleId: 2,
        menuId: 111,
      },
      {
        roleId: 2,
        menuId: 112,
      },
      {
        roleId: 2,
        menuId: 113,
      },
      {
        roleId: 2,
        menuId: 114,
      },
      {
        roleId: 2,
        menuId: 115,
      },
      {
        roleId: 2,
        menuId: 116,
      },
      {
        roleId: 2,
        menuId: 117,
      },
      {
        roleId: 2,
        menuId: 500,
      },
      {
        roleId: 2,
        menuId: 501,
      },
      {
        roleId: 2,
        menuId: 1000,
      },
      {
        roleId: 2,
        menuId: 1001,
      },
      {
        roleId: 2,
        menuId: 1002,
      },
      {
        roleId: 2,
        menuId: 1003,
      },
      {
        roleId: 2,
        menuId: 1004,
      },
      {
        roleId: 2,
        menuId: 1005,
      },
      {
        roleId: 2,
        menuId: 1006,
      },
      {
        roleId: 2,
        menuId: 1007,
      },
      {
        roleId: 2,
        menuId: 1008,
      },
      {
        roleId: 2,
        menuId: 1009,
      },
      {
        roleId: 2,
        menuId: 1010,
      },
      {
        roleId: 2,
        menuId: 1011,
      },
      {
        roleId: 2,
        menuId: 1012,
      },
      {
        roleId: 2,
        menuId: 1013,
      },
      {
        roleId: 2,
        menuId: 1014,
      },
      {
        roleId: 2,
        menuId: 1015,
      },
      {
        roleId: 2,
        menuId: 1016,
      },
      {
        roleId: 2,
        menuId: 1017,
      },
      {
        roleId: 2,
        menuId: 1018,
      },
      {
        roleId: 2,
        menuId: 1019,
      },
      {
        roleId: 2,
        menuId: 1020,
      },
      {
        roleId: 2,
        menuId: 1021,
      },
      {
        roleId: 2,
        menuId: 1022,
      },
      {
        roleId: 2,
        menuId: 1023,
      },
      {
        roleId: 2,
        menuId: 1024,
      },
      {
        roleId: 2,
        menuId: 1025,
      },
      {
        roleId: 2,
        menuId: 1026,
      },
      {
        roleId: 2,
        menuId: 1027,
      },
      {
        roleId: 2,
        menuId: 1028,
      },
      {
        roleId: 2,
        menuId: 1029,
      },
      {
        roleId: 2,
        menuId: 1030,
      },
      {
        roleId: 2,
        menuId: 1031,
      },
      {
        roleId: 2,
        menuId: 1032,
      },
      {
        roleId: 2,
        menuId: 1033,
      },
      {
        roleId: 2,
        menuId: 1034,
      },
      {
        roleId: 2,
        menuId: 1035,
      },
      {
        roleId: 2,
        menuId: 1036,
      },
      {
        roleId: 2,
        menuId: 1037,
      },
      {
        roleId: 2,
        menuId: 1038,
      },
      {
        roleId: 2,
        menuId: 1039,
      },
      {
        roleId: 2,
        menuId: 1040,
      },
      {
        roleId: 2,
        menuId: 1041,
      },
      {
        roleId: 2,
        menuId: 1042,
      },
      {
        roleId: 2,
        menuId: 1043,
      },
      {
        roleId: 2,
        menuId: 1044,
      },
      {
        roleId: 2,
        menuId: 1045,
      },
      {
        roleId: 2,
        menuId: 1046,
      },
      {
        roleId: 2,
        menuId: 1047,
      },
      {
        roleId: 2,
        menuId: 1048,
      },
      {
        roleId: 2,
        menuId: 1049,
      },
      {
        roleId: 2,
        menuId: 1050,
      },
      {
        roleId: 2,
        menuId: 1051,
      },
      {
        roleId: 2,
        menuId: 1052,
      },
      {
        roleId: 2,
        menuId: 1053,
      },
      {
        roleId: 2,
        menuId: 1054,
      },
      {
        roleId: 2,
        menuId: 1055,
      },
      {
        roleId: 2,
        menuId: 1056,
      },
      {
        roleId: 2,
        menuId: 1057,
      },
      {
        roleId: 2,
        menuId: 1058,
      },
      {
        roleId: 2,
        menuId: 1059,
      },
      {
        roleId: 2,
        menuId: 1060,
      },
      {
        roleId: 2,
        menuId: 118,
      },
      {
        roleId: 2,
        menuId: 119,
      },
      {
        roleId: 2,
        menuId: 1061,
      },
      {
        roleId: 2,
        menuId: 1062,
      },
      {
        roleId: 2,
        menuId: 1063,
      },
      {
        roleId: 2,
        menuId: 1064,
      },
      {
        roleId: 2,
        menuId: 1065,
      },
      {
        roleId: 2,
        menuId: 1066,
      },
      {
        roleId: 2,
        menuId: 1067,
      },
      {
        roleId: 2,
        menuId: 1068,
      },
      {
        roleId: 2,
        menuId: 1069,
      },
      {
        roleId: 2,
        menuId: 1070,
      },
      {
        roleId: 2,
        menuId: 120,
      },
      {
        roleId: 2,
        menuId: 1071,
      },
      {
        roleId: 2,
        menuId: 1072,
      },
      {
        roleId: 2,
        menuId: 1073,
      },
      {
        roleId: 2,
        menuId: 1074,
      },
      {
        roleId: 2,
        menuId: 1075,
      },
      {
        roleId: 2,
        menuId: 1076,
      },
      {
        roleId: 2,
        menuId: 1077,
      },
      {
        roleId: 2,
        menuId: 1078,
      },
      {
        roleId: 3,
        menuId: 1,
      },
      {
        roleId: 3,
        menuId: 2,
      },
      {
        roleId: 3,
        menuId: 3,
      },
      {
        roleId: 3,
        menuId: 4,
      },
      {
        roleId: 3,
        menuId: 108,
      },
      {
        roleId: 3,
        menuId: 100,
      },
      {
        roleId: 3,
        menuId: 101,
      },
      {
        roleId: 3,
        menuId: 102,
      },
      {
        roleId: 3,
        menuId: 103,
      },
      {
        roleId: 3,
        menuId: 104,
      },
      {
        roleId: 3,
        menuId: 105,
      },
      {
        roleId: 3,
        menuId: 106,
      },
      {
        roleId: 3,
        menuId: 107,
      },
      {
        roleId: 3,
        menuId: 118,
      },
      {
        roleId: 3,
        menuId: 119,
      },
      {
        roleId: 3,
        menuId: 120,
      },
      {
        roleId: 3,
        menuId: 109,
      },
      {
        roleId: 3,
        menuId: 110,
      },
      {
        roleId: 3,
        menuId: 112,
      },
      {
        roleId: 3,
        menuId: 113,
      },
      {
        roleId: 3,
        menuId: 114,
      },
      {
        roleId: 3,
        menuId: 115,
      },
      {
        roleId: 3,
        menuId: 116,
      },
      {
        roleId: 3,
        menuId: 117,
      },
      {
        roleId: 3,
        menuId: 500,
      },
      {
        roleId: 3,
        menuId: 501,
      },
      {
        roleId: 3,
        menuId: 1000,
      },
      {
        roleId: 3,
        menuId: 1004,
      },
      {
        roleId: 3,
        menuId: 1007,
      },
      {
        roleId: 3,
        menuId: 1011,
      },
      {
        roleId: 3,
        menuId: 1012,
      },
      {
        roleId: 3,
        menuId: 1016,
      },
      {
        roleId: 3,
        menuId: 1020,
      },
      {
        roleId: 3,
        menuId: 1024,
      },
      {
        roleId: 3,
        menuId: 1025,
      },
      {
        roleId: 3,
        menuId: 1029,
      },
      {
        roleId: 3,
        menuId: 1030,
      },
      {
        roleId: 3,
        menuId: 1034,
      },
      {
        roleId: 3,
        menuId: 1035,
      },
      {
        roleId: 3,
        menuId: 1039,
      },
      {
        roleId: 3,
        menuId: 1041,
      },
      {
        roleId: 3,
        menuId: 1042,
      },
      {
        roleId: 3,
        menuId: 1044,
      },
      {
        roleId: 3,
        menuId: 1046,
      },
      {
        roleId: 3,
        menuId: 1049,
      },
      {
        roleId: 3,
        menuId: 1054,
      },
      {
        roleId: 3,
        menuId: 1055,
      },
      {
        roleId: 3,
        menuId: 1059,
      },
      {
        roleId: 3,
        menuId: 1061,
      },
      {
        roleId: 3,
        menuId: 1065,
      },
      {
        roleId: 3,
        menuId: 1066,
      },
      {
        roleId: 3,
        menuId: 1070,
      },
      {
        roleId: 3,
        menuId: 1071,
      },
      {
        roleId: 3,
        menuId: 1076,
      },
    ],
    skipDuplicates: true,
  });

  // sys_user_post
  await prisma.sysUserPost.createMany({
    data: [
      {
        userId: 1,
        postId: 1,
      },
      {
        userId: 2,
        postId: 2,
      },
      {
        userId: 3,
        postId: 1,
      },
    ],
    skipDuplicates: true,
  });

  // sys_user_role
  await prisma.sysUserRole.createMany({
    data: [
      {
        userId: 1,
        roleId: 1,
      },
      {
        userId: 2,
        roleId: 2,
      },
      {
        userId: 3,
        roleId: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log('种子数据导入完成!');
}

main()
  .catch((e) => {
    console.error('种子数据导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
