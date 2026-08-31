import { SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

export const RequirePermission = (permission: string) => SetMetadata(METADATA_KEYS.PERMISSION, permission);
