import { Injectable, Logger } from '@nestjs/common';
import { Task } from 'src/common/decorators/task.decorator';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  @Task({
    name: 'dailyBackup',
    description: '每日备份任务',
  })
  async performBackup(params: string) {
    this.logger.log('performBackup', params);
    // 实现备份逻辑
  }
}
