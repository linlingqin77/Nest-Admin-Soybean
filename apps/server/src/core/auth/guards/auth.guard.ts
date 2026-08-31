import { Reflector } from '@nestjs/core';
import { AppConfigService } from 'src/platform/config/app-config.service';
import { AuthGuard } from '@nestjs/passport';
import { pathToRegexp } from 'path-to-regexp';
import { ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { UserService } from 'src/modules/users/user.service';
import { TokenBlacklistService } from 'src/core/auth/token-blacklist.service';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private globalWhiteList = [];

  constructor(
    private readonly reflector: Reflector,
    @Inject(UserService)
    private readonly userService: UserService,
    private readonly config: AppConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super();
    this.globalWhiteList = [].concat(this.config.perm.router.whitelist || []);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const notRequireAuth = this.reflector.getAllAndOverride(METADATA_KEYS.NOT_REQUIRE_AUTH, [ctx.getClass(), ctx.getHandler()]);

    if (notRequireAuth) {
      await this.jumpActivate(ctx);
      return true;
    }

    const isInWhiteList = this.checkWhiteList(ctx);
    if (isInWhiteList) {
      await this.jumpActivate(ctx);
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const accessToken = req.get('Authorization');

    if (!accessToken) throw new UnauthorizedException('请重新登录');
    const tokenPayload = await this.userService.parseToken(accessToken);
    if (!tokenPayload) throw new UnauthorizedException('当前登录已过期，请重新登录');

    // 需求 4.8: 检查 Token 是否在黑名单中
    if (tokenPayload.uuid) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(tokenPayload.uuid);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token 已失效，请重新登录');
      }
    }

    // 需求 4.9: 检查 Token 版本是否有效
    if (tokenPayload.userId && tokenPayload.tokenVersion !== undefined) {
      const isVersionValid = await this.tokenBlacklistService.isTokenVersionValid(
        tokenPayload.userId,
        tokenPayload.tokenVersion,
      );
      if (!isVersionValid) {
        throw new UnauthorizedException('密码已修改，请重新登录');
      }
    }

    return await this.activate(ctx);
  }

  async activate(ctx: ExecutionContext) {
    return super.canActivate(ctx) as boolean;
  }

  /**
   * 跳过验证
   * @param ctx
   * @returns
   */
  async jumpActivate(ctx: ExecutionContext) {
    try {
      await this.activate(ctx);
    } catch (e) {
      // 未登录不做任何处理，直接返回 true（用于可选认证的接口）
      this.logger.debug('Optional auth skipped: user not authenticated');
    }

    return true;
  }

  /**
   * 检查接口是否在白名单内
   * @param ctx
   * @returns
   */
  checkWhiteList(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const i = this.globalWhiteList.findIndex((route) => {
      // 请求方法类型相同
      if (!route.method || req.method.toUpperCase() === route.method.toUpperCase()) {
        // 对比 url
        return !!pathToRegexp(route.path).exec(req.route.path);
      }
      return false;
    });
    // 在白名单内 则 进行下一步， i === -1 ，则不在白名单，需要 比对是否有当前接口权限
    return i > -1;
  }
}
