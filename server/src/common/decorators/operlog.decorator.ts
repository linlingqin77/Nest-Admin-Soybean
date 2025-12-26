import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { OperlogInterceptor } from '../interceptors/operlog.interceptor';

// Re-export for backward compatibility
export type { OperlogConfig } from '../types/decorator';

export const Operlog = (logConfig?: import('../types/decorator').OperlogConfig) => {
  return applyDecorators(SetMetadata('operlog', logConfig), UseInterceptors(OperlogInterceptor));
};
