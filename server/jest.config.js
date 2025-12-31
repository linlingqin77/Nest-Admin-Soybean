/**
 * Jest 配置文件
 *
 * @description
 * 企业级测试配置，包含覆盖率阈值和测试环境设置
 */
module.exports = {
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json', 'ts'],

  // 根目录
  rootDir: 'src',

  // 测试文件匹配模式
  testRegex: '.*\\.spec\\.ts$',

  // 转换器配置
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  // 模块路径映射
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },

  // 覆盖率收集配置
  collectCoverageFrom: [
    '**/*.ts',
    // 排除入口文件
    '!main.ts',
    // 排除模块定义文件
    '!**/*.module.ts',
    // 排除 DTO 和类型定义
    '!**/dto/**',
    '!**/types/**',
    '!**/*.d.ts',
    // 排除测试工具
    '!**/test-utils/**',
    // 排除配置文件
    '!config/index.ts',
    '!config/types/**',
  ],

  // 覆盖率输出目录
  coverageDirectory: '../coverage',

  // 测试环境
  testEnvironment: 'node',

  // 覆盖率阈值配置
  // 目标：核心业务代码 100% 覆盖率
  coverageThreshold: {
    // 全局阈值
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // 核心业务 Service 100% 覆盖率
    './module/system/user/*.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './module/system/role/*.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './module/system/tenant/*.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './module/system/dept/*.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './module/system/menu/*.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './module/system/config/*.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // Guard 100% 覆盖率
    './common/guards/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // Interceptor 100% 覆盖率
    './common/interceptor/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './common/interceptors/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // Repository 100% 覆盖率
    './common/repository/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],

  // 测试超时时间（毫秒）
  testTimeout: 30000,

  // 详细输出
  verbose: true,

  // 清除 Mock
  clearMocks: true,

  // 恢复 Mock
  restoreMocks: true,

  // 测试前执行的设置文件
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],

  // 忽略的路径
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // 模块路径
  modulePaths: ['<rootDir>'],
};
