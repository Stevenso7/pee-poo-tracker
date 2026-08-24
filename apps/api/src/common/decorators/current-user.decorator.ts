import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserInfo {
  userId: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserInfo;
  },
);
