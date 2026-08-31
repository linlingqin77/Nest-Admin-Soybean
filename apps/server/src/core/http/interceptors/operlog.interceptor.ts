import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

import { OperlogConfig } from 'src/core/audit/decorators/operlog.decorator';
import { OperlogService } from 'src/modules/oper-logs/operlog.service';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

@Injectable()
export class OperlogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logService: OperlogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 安全获取 Swagger 元数据，避免解构 undefined 导致 TypeError
    const apiOperation = this.reflector.getAllAndOverride<{ summary?: string } | undefined>(
      'swagger/apiOperation',
      [context.getHandler()],
    );
    const summary = apiOperation?.summary;

    const logConfig: OperlogConfig = this.reflector.get(METADATA_KEYS.OPERLOG, context.getHandler());

    const handlerName = context.getHandler().name;
    // 如果没有 Swagger summary，使用方法名作为 fallback
    const title = summary ?? handlerName;

    const now = Date.now();

    return next
      .handle()
      .pipe(
        map((resultData) => {
          const costTime = Date.now() - now;
          // 对于导出等特殊操作,可能没有标准的Result格式
          if (!resultData || typeof resultData !== 'object' || !('code' in resultData)) {
            // 文件下载等操作,记录为成功
            this.logService.logAction({
              costTime,
              resultData: { code: 200 },
              handlerName,
              title,
              businessType: logConfig?.businessType,
            });
            return resultData;
          }

          if (resultData.code === 200) {
            this.logService.logAction({
              costTime,
              resultData,
              handlerName,
              title,
              businessType: logConfig?.businessType,
            });
          } else {
            //业务错误
            this.logService.logAction({
              costTime,
              errorMsg: resultData.msg,
              handlerName,
              title,
              businessType: logConfig?.businessType,
            });
          }
          return resultData;
        }),
      )
      .pipe(
        catchError((err) => {
          const costTime = Date.now() - now;
          this.logService.logAction({
            costTime,
            errorMsg: err.response,
            handlerName,
            title,
            businessType: logConfig?.businessType,
          });
          return throwError(() => err);
        }),
      );
  }
}
