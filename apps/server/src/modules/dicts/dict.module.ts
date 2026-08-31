import { Global, Module } from '@nestjs/common';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';
import { DictTypeRepository, DictDataRepository } from './dict.repository';

@Global()
@Module({
  controllers: [DictController],
  providers: [DictService, DictTypeRepository, DictDataRepository],
  exports: [DictService],
})
export class DictModule {}
