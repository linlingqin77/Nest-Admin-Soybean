import { MainService } from './main.service';
import { Result } from 'src/common/response';

describe('MainService', () => {
  let service: MainService;
  const userService = { login: jest.fn(), register: jest.fn() };
  const loginlogService = { create: jest.fn() };
  const axiosService = { getIpAddress: jest.fn() };
  const menuService = { getMenuListByUserId: jest.fn() };
  const clientInfo = {
    ipaddr: '127.0.0.1',
    browser: 'chrome',
    os: 'macOS',
    loginLocation: 'unknown',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axiosService.getIpAddress.mockResolvedValue('Guangzhou');
    service = new MainService(userService as any, loginlogService as any, axiosService as any, menuService as any);
  });

  it('should record successful login attempts', async () => {
    const loginDto = { userName: 'admin', password: 'admin123' };
    const loginResult = Result.ok({ token: 'jwt-token' }, '登录成功');
    userService.login.mockResolvedValue(loginResult);

    const res = await service.login(loginDto as any, clientInfo as any);

    expect(res).toEqual(loginResult);
    expect(axiosService.getIpAddress).toHaveBeenCalledWith('127.0.0.1');
    expect(loginlogService.create).toHaveBeenCalledWith(expect.objectContaining({ status: '0', msg: '登录成功' }));
  });

  it('should record failed login attempts', async () => {
    const loginDto = { userName: 'admin', password: 'bad' };
    const loginResult = Result.fail(500, '帐号或密码错误');
    userService.login.mockResolvedValue(loginResult);

    await service.login(loginDto as any, clientInfo as any);

    expect(loginlogService.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: '1', msg: '帐号或密码错误' }),
    );
  });

  it('should log logout operation', async () => {
    const res = await service.logout(clientInfo as any);
    expect(res.code).toBe(200);
    expect(loginlogService.create).toHaveBeenCalledWith(expect.objectContaining({ msg: '退出成功' }));
  });

  it('should return routers from menu service', async () => {
    menuService.getMenuListByUserId.mockResolvedValue([{ path: '/' }]);
    const res = await service.getRouters(1);
    expect(res.data).toEqual([{ path: '/' }]);
    expect(menuService.getMenuListByUserId).toHaveBeenCalledWith(1);
  });
});
