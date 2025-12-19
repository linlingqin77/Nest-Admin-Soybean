import { BackupService } from './backup.service';
import { Logger } from '@nestjs/common';

describe('BackupService', () => {
  let service: BackupService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new BackupService();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should log when performing backup', async () => {
    await service.performBackup('nightly');
    expect(logSpy).toHaveBeenCalledWith('performBackup', 'nightly');
  });
});
