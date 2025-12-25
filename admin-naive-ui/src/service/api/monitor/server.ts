import { request } from '@/service/request';

/** 获取服务器监控信息 */
export function fetchGetServerInfo() {
  return request<Api.Monitor.ServerInfo>({
    url: '/monitor/server',
    method: 'get',
  });
}
