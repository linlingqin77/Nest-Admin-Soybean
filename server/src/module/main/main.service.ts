import { Injectable } from '@nestjs/common';
import { Result } from 'src/common/response';
import { SUCCESS_CODE } from 'src/common/response';
import { UserService } from '../system/user/user.service';
import { LoginlogService } from '../monitor/loginlog/loginlog.service';
import { AxiosService } from 'src/module/common/axios/axios.service';
import { RegisterDto, LoginDto } from './dto/index';
import { MenuService } from '../system/menu/menu.service';
import { ClientInfoDto } from 'src/common/decorators/common.decorator';
import { StatusEnum } from 'src/common/enum/index';
@Injectable()
export class MainService {
  constructor(
    private readonly userService: UserService,
    private readonly loginlogService: LoginlogService,
    private readonly axiosService: AxiosService,
    private readonly menuService: MenuService,
  ) {}

  /**
   * 登陆
   * @param user
   * @returns
   */
  async login(user: LoginDto, clientInfo: ClientInfoDto) {
    const loginLog = {
      ...clientInfo,
      status: StatusEnum.NORMAL,
      msg: '',
    };

    // 异步获取登录位置，不阻塞登录流程
    this.axiosService
      .getIpAddress(clientInfo.ipaddr)
      .then((loginLocation) => {
        loginLog.loginLocation = loginLocation;
      })
      .catch(() => {
        loginLog.loginLocation = '未知';
      });

    const loginRes = await this.userService.login(user, loginLog);
    loginLog.status = loginRes.code === SUCCESS_CODE ? StatusEnum.NORMAL : StatusEnum.STOP;
    loginLog.msg = loginRes.msg;
    this.loginlogService.create(loginLog);
    return loginRes;
  }
  /**
   * 退出登陆
   * @param clientInfo
   */
  async logout(clientInfo: ClientInfoDto) {
    const loginLog = {
      ...clientInfo,
      status: StatusEnum.NORMAL,
      msg: '退出成功',
    };

    // 异步获取登录位置，不阻塞退出流程
    this.axiosService
      .getIpAddress(clientInfo.ipaddr)
      .then((loginLocation) => {
        loginLog.loginLocation = loginLocation;
      })
      .catch(() => {
        loginLog.loginLocation = '未知';
      });

    this.loginlogService.create(loginLog);
    return Result.ok();
  }
  /**
   * 注册
   * @param user
   * @returns
   */
  async register(user: RegisterDto) {
    return await this.userService.register(user);
  }

  /**
   * 登陆记录
   */
  loginRecord() {}

  /**
   * 获取路由菜单
   */
  async getRouters(userId: number) {
    const menus = await this.menuService.getMenuListByUserId(userId);
    return Result.ok(menus);
  }
}
