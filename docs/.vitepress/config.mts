import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nest-Admin-Soybean",
  description: "企业级全栈管理系统 - 开箱即用的解决方案",
  base: '/Nest-Admin-Soybean/',
  ignoreDeadLinks: true,
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: '开发', link: '/development/getting-started' },
      { text: '部署', link: '/deployment/overview' },
      { text: '功能特性', link: '/features/demo-account' },
      { text: '优化文档', link: '/optimization/overview' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '项目介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '目录结构', link: '/guide/directory-structure' },
            { text: '环境要求', link: '/guide/prerequisites' },
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: '多租户架构', link: '/guide/multi-tenant' },
            { text: 'RBAC权限系统', link: '/guide/rbac' },
            { text: '请求加密', link: '/guide/encryption' },
            { text: '日志监控', link: '/guide/logging' },
            { text: '配置管理', link: '/guide/configuration' },
          ]
        },
        {
          text: '其他',
          items: [
            { text: '常见问题', link: '/guide/faq' },
          ]
        }
      ],
      '/development/': [
        {
          text: '开发指南',
          items: [
            { text: '开始开发', link: '/development/getting-started' },
            { text: '配置说明', link: '/development/configuration' },
            { text: '数据库开发', link: '/development/database' },
            { text: 'API开发', link: '/development/api' },
          ]
        },
        {
          text: '前端开发',
          items: [
            { text: '前端架构', link: '/development/frontend-architecture' },
            { text: '路由系统', link: '/development/routing' },
            { text: '组件开发', link: '/development/components' },
            { text: '状态管理', link: '/development/state-management' },
          ]
        },
        {
          text: '后端开发',
          items: [
            { text: '后端架构', link: '/development/backend-architecture' },
            { text: '模块开发', link: '/development/modules' },
            { text: '权限控制', link: '/development/permissions' },
            { text: '错误处理', link: '/development/error-handling' },
          ]
        },
        {
          text: '最佳实践',
          items: [
            { text: '代码规范', link: '/development/code-style' },
            { text: '性能优化', link: '/development/performance' },
            { text: '安全实践', link: '/development/security' },
          ]
        }
      ],
      '/deployment/': [
        {
          text: '部署指南',
          items: [
            { text: '部署概述', link: '/deployment/overview' },
            { text: '环境准备', link: '/deployment/environment' },
            { text: '构建项目', link: '/deployment/build' },
          ]
        },
        {
          text: '线上部署',
          items: [
            { text: '流程简介', link: '/deploy-online/step' },
            { text: 'MySQL部署', link: '/deploy-online/mysql' },
            { text: 'Redis部署', link: '/deploy-online/redis' },
            { text: 'PM2部署', link: '/deploy-online/pm2' },
            { text: 'Nginx部署', link: '/deploy-online/nginx' },
          ]
        },
        {
          text: 'CI/CD',
          items: [
            { text: 'GitHub Actions', link: '/deployment/github-actions' },
            { text: 'Docker部署', link: '/deployment/docker' },
            { text: 'CI/CD最佳实践', link: '/deployment/cicd' },
          ]
        },
        {
          text: '运维',
          items: [
            { text: '监控告警', link: '/deployment/monitoring' },
            { text: '日志管理', link: '/deployment/logs' },
            { text: '备份恢复', link: '/deployment/backup' },
          ]
        }
      ],
      '/features/': [
        {
          text: '功能特性',
          items: [
            { text: '演示账户系统', link: '/features/demo-account' },
            { text: '系统管理', link: '/features/system-management' },
            { text: '租户管理', link: '/features/tenant-management' },
            { text: '监控中心', link: '/features/monitoring' },
            { text: '文件管理', link: '/features/file-management' },
            { text: '定时任务', link: '/features/scheduled-tasks' },
          ]
        }
      ],
      '/optimization/': [
        {
          text: '优化文档',
          items: [
            { text: '优化概述', link: '/optimization/overview' },
            { text: '架构优化', link: '/optimization/architecture' },
            { text: '性能优化', link: '/optimization/performance' },
            { text: '安全优化', link: '/optimization/security' },
            { text: '代码质量优化', link: '/optimization/code-quality' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/linlingqin77/Nest-Admin-Soybean' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Nest-Admin-Soybean'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '目录'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
