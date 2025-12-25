import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { TaskService } from './task.service';
import { JobLogService } from './job-log.service';
import { JobLogController } from './job-log.controller';
import { JobRepository } from './job.repository';
import { BackupService } from 'src/module/backup/backup.service';
import { NoticeModule } from 'src/module/system/notice/notice.module';

@Module({
  imports: [NestScheduleModule.forRoot(), NoticeModule],
  controllers: [JobController, JobLogController],
  providers: [JobService, TaskService, JobLogService, JobRepository, BackupService],
  exports: [JobService, TaskService],
})
export class JobModule {}
