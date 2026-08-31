import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CacheService } from './cache.service';
import { Api } from 'src/core/http/decorators/api.decorator';
import {
  CacheInfoResponseDto,
  CacheKeyResponseDto,
  CacheNamesResponseDto,
  CacheKeysResponseDto,
  ClearCacheResultResponseDto,
} from 'src/modules/monitors/dto/responses';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

@ApiTags('缓存管理')
@Controller('monitor/cache')
@ApiBearerAuth('Authorization')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Api({
    summary: '缓存监控信息',
    description: '获取Redis缓存监控信息',
    type: CacheInfoResponseDto,
  })
  @Get()
  getInfo() {
    return this.cacheService.getInfo();
  }

  @Api({
    summary: '缓存名称列表',
    description: '获取所有缓存分类名称',
    type: CacheNamesResponseDto,
  })
  @Get('/getNames')
  getNames() {
    return this.cacheService.getNames();
  }

  @Api({
    summary: '缓存键名列表',
    description: '根据缓存名称获取所有键名',
    params: [{ name: 'id', description: '缓存名称' }],
    type: CacheKeysResponseDto,
  })
  @Get('/getKeys/:id')
  getKeys(@Param('id') id: string) {
    return this.cacheService.getKeys(id);
  }

  @Api({
    summary: '缓存内容',
    description: '获取指定缓存的内容',
    type: CacheKeyResponseDto,
    params: [
      { name: 'cacheName', description: '缓存名称' },
      { name: 'cacheKey', description: '缓存键名' },
    ],
  })
  @Get('/getValue/:cacheName/:cacheKey')
  getValue(@Param() params: string[]) {
    return this.cacheService.getValue(params);
  }

  @Api({
    summary: '清理缓存名称',
    description: '清除指定分类下的所有缓存',
    params: [{ name: 'cacheName', description: '缓存名称' }],
    type: ClearCacheResultResponseDto,
  })
  @Operlog({ businessType: BusinessType.CLEAN })
  @Delete('/clearCacheName/:cacheName')
  clearCacheName(@Param('cacheName') cacheName: string) {
    return this.cacheService.clearCacheName(cacheName);
  }

  @Api({
    summary: '清理缓存键名',
    description: '清除指定的缓存键',
    params: [{ name: 'cacheKey', description: '缓存键名' }],
    type: ClearCacheResultResponseDto,
  })
  @Operlog({ businessType: BusinessType.CLEAN })
  @Delete('/clearCacheKey/:cacheKey')
  clearCacheKey(@Param('cacheKey') cacheKey: string) {
    return this.cacheService.clearCacheKey(cacheKey);
  }

  @Api({
    summary: '清理全部缓存',
    description: '清除所有缓存数据',
    type: ClearCacheResultResponseDto,
  })
  @Operlog({ businessType: BusinessType.CLEAN })
  @Delete('/clearCacheAll')
  clearCacheAll() {
    return this.cacheService.clearCacheAll();
  }
}
