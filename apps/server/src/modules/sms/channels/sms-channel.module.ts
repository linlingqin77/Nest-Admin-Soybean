import { Module } from '@nestjs/common';
import { SmsChannelService } from './sms-channel.service';
import { SmsChannelController } from './sms-channel.controller';
import { SmsChannelRepository } from './sms-channel.repository';

@Module({
  controllers: [SmsChannelController],
  providers: [SmsChannelService, SmsChannelRepository],
  exports: [SmsChannelService, SmsChannelRepository],
})
export class SmsChannelModule {}
