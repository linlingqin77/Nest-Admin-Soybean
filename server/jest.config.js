/**
 * Jest 配置文件
 *
 * @description
 * 企业级测试配置，包含覆盖率阈值和测试环境设置
 * 支持单元测试、集成测试和E2E测试
 */
module.exports = {
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json', 'ts'],

  // 根目录
  rootDir: '.',

  // 测试文件匹配模式 - 支持单元测试和属性基测试
  testRegex: 'src/.*\\.(spec|pbt\\.spec)\\.ts$',

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
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },

  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.ts',
    // 排除入口文件
    '!src/main.ts',
    // 排除模块定义文件
    '!src/**/*.module.ts',
    // 排除 DTO 和类型定义
    '!src/**/dto/**',
    '!src/**/types/**',
    '!src/**/*.d.ts',
    // 排除测试工具
    '!src/test-utils/**',
    // 排除配置文件
    '!src/config/index.ts',
    '!src/config/types/**',
    // 排除测试文件
    '!src/**/*.spec.ts',
    '!src/**/*.pbt.spec.ts',
  ],

  // 覆盖率输出目录
  coverageDirectory: './coverage',

  // 测试环境
  testEnvironment: 'node',

  // 覆盖率阈值配置
  // 基于当前测试覆盖率设置合理阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 68,
      statements: 68,
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
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // 忽略的路径
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // 模块路径
  modulePaths: ['<rootDir>'],
};
