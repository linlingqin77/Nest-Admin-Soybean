/**
 * Jest 测试设置文件
 *
 * @description
 * 在所有测试运行前执行的全局设置
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 全局 Mock 设置
beforeAll(() => {
  // 禁用控制台输出（可选）
  // jest.spyOn(console, 'log').mockImplementation(() => {});
  // jest.spyOn(console, 'warn').mockImplementation(() => {});
  // jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // 恢复控制台输出
  jest.restoreAllMocks();
});

// 每个测试后清理
afterEach(() => {
  jest.clearAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
