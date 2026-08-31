import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { OperlogInterceptor } from 'src/core/http/interceptors/operlog.interceptor';
import { BusinessType } from 'src/shared/constants/business.constant';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

export type OperlogConfig =
  | Partial<{
      businessType?: (typeof BusinessType)[keyof Omit<typeof BusinessType, 'prototype'>];
    }>
  | undefined;

export const Operlog = (logConfig?: OperlogConfig) => {
  return applyDecorators(SetMetadata(METADATA_KEYS.OPERLOG, logConfig), UseInterceptors(OperlogInterceptor));
};
