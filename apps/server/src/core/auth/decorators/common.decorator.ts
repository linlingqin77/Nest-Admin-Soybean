import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as Useragent from 'useragent';
import { GetNowDate } from 'src/shared/utils';

export const ClientInfo = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const agent = Useragent.parse(request.headers['user-agent']);
  const os = agent.os.toJSON().family;
  const browser = agent.toAgent();

  // 判断设备类型
  let deviceType = '0'; // 默认为 PC
  const device = agent.device.toJSON();
  if (device.family && device.family !== 'Other') {
    // 如果设备信息不是 Other，通常是移动设备
    deviceType = '1'; // Mobile
  } else if (os.toLowerCase().includes('android') || os.toLowerCase().includes('ios')) {
    deviceType = '1'; // Mobile
  }

  const clientInfo = {
    ipaddr: request.ip,
    browser: browser,
    os: os,
    loginLocation: '',
    userName: request.user?.user?.userName,
    deviceType: deviceType,
  };

  return clientInfo;
});

export type ClientInfoDto = {
  ipaddr: string;
  browser: string;
  os: string;
  loginLocation: string;
  userName?: string;
  deviceType: string;
};
