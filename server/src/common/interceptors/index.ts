/**
 * 拦截器统一导出
 *
 * @description 合并 interceptor 和 interceptors 目录下的拦截器
 * 建议新增拦截器放在 interceptors 目录下
 */

// 操作日志拦截器
export * from './operlog.interceptor';

// 事务拦截器
export * from './transactional.interceptor';
