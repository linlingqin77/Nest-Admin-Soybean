import { Global, Module } from '@nestjs/common';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';
import { DictDataRepository, DictTypeRepository } from './dict.repository';

@Global()
@Module({
  controllers: [DictController],
  providers: [DictService, DictTypeRepository, DictDataRepository],
  exports: [DictService],
})
export class DictModule {}
