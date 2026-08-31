import { SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

/**
 * 免认证装饰器
 *
 * 标记 Controller 或方法不需要 JWT 认证即可访问。
 * 替代散落各处的 SetMetadata('notRequireAuth', true)。
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * async healthCheck() {}
 * ```
 */
export const Public = () => SetMetadata(METADATA_KEYS.NOT_REQUIRE_AUTH, true);
