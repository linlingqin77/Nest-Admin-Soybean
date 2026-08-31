import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';
import { UserType } from 'src/modules/users/dto/user';

export const User = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  // 如果指定了属性名，返回该属性（支持嵌套属性如 'user.userName'）
  if (data) {
    const keys = data.split('.');
    return keys.reduce((obj, key) => obj?.[key], user);
  }

  return user;
});

export type UserDto = UserType;

export const NotRequireAuth = () => SetMetadata(METADATA_KEYS.NOT_REQUIRE_AUTH, true);

export const UserTool = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  const userName = request.user?.user?.userName;

  const injectCreate = <T>(data: T): T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = data as any;
    if (!obj.createBy) {
      obj.createBy = userName;
    }
    if (!obj.updateBy) {
      obj.updateBy = userName;
    }
    return data;
  };

  const injectUpdate = <T>(data: T): T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = data as any;
    if (!obj.updateBy) {
      obj.updateBy = userName;
    }
    return data;
  };

  return { injectCreate, injectUpdate };
});

export type UserToolType = {
  injectCreate: <T>(data: T) => T;
  injectUpdate: <T>(data: T) => T;
};
