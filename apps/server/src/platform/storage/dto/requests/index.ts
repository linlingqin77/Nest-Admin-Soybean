export * from './list-oss.request.dto';
export * from './create-oss-config.request.dto';
export * from './update-oss-config.request.dto';
export * from './list-oss-config.request.dto';
export * from './change-oss-config-status.request.dto';

// Aliases without 'Request' suffix for backward compatibility
export { CreateOssConfigRequestDto as CreateOssConfigDto } from './create-oss-config.request.dto';
export { UpdateOssConfigRequestDto as UpdateOssConfigDto } from './update-oss-config.request.dto';
export { ListOssConfigRequestDto as ListOssConfigDto } from './list-oss-config.request.dto';
export { ChangeOssConfigStatusDto as ChangeOssConfigStatusRequestDto } from './change-oss-config-status.request.dto';
