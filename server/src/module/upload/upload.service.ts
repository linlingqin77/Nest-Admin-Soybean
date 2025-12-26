import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { AppConfigService } from 'src/config/app-config.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Result, ResponseCode } from 'src/common/response';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';
import { ChunkFileDto, ChunkMergeFileDto } from './dto/index';
import { GenerateUUID } from 'src/common/utils/index';
import fs from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import iconv from 'iconv-lite';
import COS from 'cos-nodejs-sdk-v5';
import Mime from 'mime-types';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantContext } from 'src/common/tenant/tenant.context';
import { VersionService } from './services/version.service';
import type { ThumbnailJobData } from './processors/thumbnail.processor';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private thunkDir: string;
  private cos = new COS({
    // 必选参数
    SecretId: this.config.cos.secretId,
    SecretKey: this.config.cos.secretKey,
    //可选参数
    FileParallelLimit: 3, // 控制文件上传并发数
    ChunkParallelLimit: 8, // 控制单个文件下分片上传并发数，在同园区上传可以设置较大的并发数
    ChunkSize: 1024 * 1024 * 8, // 控制分片大小，单位 B，在同园区上传可以设置较大的分片大小
  });
  private isLocal: boolean;
  constructor(
    private readonly prisma: PrismaService,
    private config: AppConfigService,
    private readonly versionService: VersionService,
    @InjectQueue('thumbnail') private readonly thumbnailQueue: Queue<ThumbnailJobData>,
  ) {
    this.thunkDir = 'thunk';
    this.isLocal = this.config.app.file.isLocal;
  }

  /**
   * 单文件上传（支持MD5秒传、版本控制、配额检查和异步缩略图生成）
   * @param file 上传的文件
   * @param folderId 文件夹ID（可选）
   * @returns
   */
  async singleFileUpload(file: Express.Multer.File, folderId?: number) {
    const tenantId = TenantContext.getTenantId();
    const originalFilename = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');

    // 1. 文件大小检查
    const fileSizeMB = Math.ceil(file.size / 1024 / 1024);
    const maxSize = this.config.app.file.maxSize;
    if (fileSizeMB > maxSize) {
      throw new BadRequestException(`文件大小不能超过${maxSize}MB`);
    }

    // 2. 租户存储配额检查
    await this.checkStorageQuota(tenantId, fileSizeMB);

    // 3. 计算文件MD5
    const fileMd5 = crypto.createHash('md5').update(file.buffer).digest('hex');
    this.logger.log(`文件MD5: ${fileMd5}, 大小: ${fileSizeMB}MB`);

    // 4. 检查MD5秒传
    const existingFile = await this.prisma.sysUpload.findFirst({
      where: {
        fileMd5,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (existingFile) {
      // 秒传：复制已有文件记录
      this.logger.log(`文件秒传: ${fileMd5}`);
      const uploadId = GenerateUUID();
      const newFile = await this.prisma.sysUpload.create({
        data: {
          uploadId,
          tenantId,
          fileName: originalFilename,
          newFileName: existingFile.newFileName,
          url: existingFile.url,
          folderId: folderId || 0,
          ext: existingFile.ext,
          size: existingFile.size,
          mimeType: existingFile.mimeType,
          storageType: existingFile.storageType,
          fileMd5: existingFile.fileMd5,
          thumbnail: existingFile.thumbnail,
          version: 1,
          isLatest: true,
          downloadCount: 0,
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
        },
      });

      // 秒传也要占用配额
      await this.updateTenantStorage(tenantId, fileSizeMB);

      return {
        ...existingFile,
        uploadId: newFile.uploadId,
        fileName: originalFilename,
        instantUpload: true,
      };
    }

    // 5. 上传文件到存储
    let res;
    const storageType = this.isLocal ? 'local' : 'cos';
    if (this.isLocal) {
      res = await this.saveFileLocal(file);
    } else {
      const targetDir = this.config.cos.location;
      res = await this.saveFileCos(targetDir, file);
    }

    const mimeType = Mime.lookup(originalFilename) || 'application/octet-stream';
    const ext = path.extname(originalFilename).replace('.', '').toLowerCase();

    // 6. 处理文件版本控制
    const versionMode = await this.getConfigValue('sys.file.versionMode', 'overwrite');
    let version = 1;
    let parentFileId: string | null = null;
    const isLatest = true;

    if (versionMode === 'version') {
      // 查找同名文件
      const sameNameFiles = await this.prisma.sysUpload.findMany({
        where: {
          fileName: originalFilename,
          folderId: folderId || 0,
          tenantId,
          delFlag: DelFlagEnum.NORMAL,
        },
        orderBy: { version: 'desc' },
      });

      if (sameNameFiles.length > 0) {
        // 存在同名文件，创建新版本
        const latestFile = sameNameFiles[0];
        version = latestFile.version + 1;
        parentFileId = latestFile.parentFileId || latestFile.uploadId;

        // 使用事务更新旧版本的isLatest标志
        await this.prisma.$transaction([
          this.prisma.sysUpload.updateMany({
            where: {
              OR: [{ uploadId: parentFileId }, { parentFileId: parentFileId }],
              isLatest: true,
            },
            data: { isLatest: false },
          }),
        ]);

        this.logger.log(`创建文件新版本: ${originalFilename}, 版本号: ${version}`);
      }
    } else if (versionMode === 'overwrite') {
      // 覆盖模式：软删除旧文件
      await this.prisma.sysUpload.updateMany({
        where: {
          fileName: originalFilename,
          folderId: folderId || 0,
          tenantId,
          delFlag: DelFlagEnum.NORMAL,
        },
        data: {
          delFlag: DelFlagEnum.DELETED,
          updateTime: new Date(),
        },
      });
    }

    // 7. 创建上传记录
    const uploadId = GenerateUUID();
    const newFile = await this.prisma.sysUpload.create({
      data: {
        uploadId,
        tenantId,
        fileName: originalFilename,
        newFileName: res.newFileName,
        url: res.url,
        folderId: folderId || 0,
        ext,
        size: file.size,
        mimeType,
        storageType,
        fileMd5,
        thumbnail: null, // 稍后异步生成
        version,
        parentFileId,
        isLatest,
        downloadCount: 0,
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 8. 更新租户存储使用量
    await this.updateTenantStorage(tenantId, fileSizeMB);

    // 9. 异步生成缩略图
    if (res.filePath || this.isLocal) {
      const filePath = res.filePath || path.join(process.cwd(), this.config.app.file.location, res.newFileName);

      await this.thumbnailQueue.add(
        'generate-thumbnail',
        {
          uploadId,
          filePath,
          storageType,
          ext,
          mimeType,
        },
        {
          priority: 1,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`已加入缩略图生成队列: ${uploadId}`);
    }

    // 10. 检查并清理旧版本（如果启用版本控制）
    if (versionMode === 'version' && parentFileId) {
      await this.versionService.checkAndCleanOldVersions(parentFileId);
    }

    return {
      ...res,
      uploadId: newFile.uploadId,
      fileName: originalFilename,
      fileMd5,
    };
  }

  /**
   * 检查租户存储配额
   */
  private async checkStorageQuota(tenantId: string, requiredMB: number): Promise<void> {
    const tenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId },
      select: { storageQuota: true, storageUsed: true, companyName: true },
    });

    if (!tenant) {
      throw new BadRequestException('租户不存在');
    }

    const { storageQuota, storageUsed, companyName } = tenant;
    const remaining = storageQuota - storageUsed;

    if (storageUsed + requiredMB > storageQuota) {
      throw new BadRequestException(
        `存储空间不足！已使用${storageUsed}MB，配额${storageQuota}MB，剩余${remaining}MB，需要${requiredMB}MB`,
      );
    }

    this.logger.log(
      `租户${companyName}存储检查通过: 使用${storageUsed}MB/配额${storageQuota}MB, 即将使用${requiredMB}MB`,
    );
  }

  /**
   * 更新租户存储使用量
   */
  private async updateTenantStorage(tenantId: string, incrementMB: number): Promise<void> {
    await this.prisma.sysTenant.update({
      where: { tenantId },
      data: {
        storageUsed: {
          increment: incrementMB,
        },
      },
    });

    this.logger.log(`租户${tenantId}存储使用量增加${incrementMB}MB`);
  }

  /**
   * 获取配置值
   */
  private async getConfigValue(key: string, defaultValue: string): Promise<string> {
    try {
      const config = await this.prisma.sysConfig.findFirst({
        where: { configKey: key, delFlag: DelFlagEnum.NORMAL },
      });
      return config?.configValue || defaultValue;
    } catch (error) {
      this.logger.warn(`获取配置失败: ${key}, 使用默认值: ${defaultValue}`);
      return defaultValue;
    }
  }

  /**
   * 获取上传任务Id
   * @returns
   */
  async getChunkUploadId() {
    const uploadId = GenerateUUID();
    return Result.ok({
      uploadId: uploadId,
    });
  }

  /**
   * 文件切片上传
   */
  async chunkFileUpload(file: Express.Multer.File, body: ChunkFileDto) {
    const rootPath = process.cwd();
    const baseDirPath = path.posix.join(rootPath, this.config.app.file.location);
    const chunckDirPath = path.posix.join(baseDirPath, this.thunkDir, body.uploadId);
    if (!fs.existsSync(chunckDirPath)) {
      this.mkdirsSync(chunckDirPath);
    }
    const chunckFilePath = path.posix.join(chunckDirPath, `${body.uploadId}${body.fileName}@${body.index}`);
    if (fs.existsSync(chunckFilePath)) {
      return Result.ok();
    } else {
      fs.writeFileSync(chunckFilePath, file.buffer);
      return Result.ok();
    }
  }

  /**
   * 检查切片是否已上传
   * @param uploadId
   * @param index
   */
  async checkChunkFile(body) {
    const rootPath = process.cwd();
    const baseDirPath = path.posix.join(rootPath, this.config.app.file.location);
    const chunckDirPath = path.posix.join(baseDirPath, this.thunkDir, body.uploadId);
    const chunckFilePath = path.posix.join(chunckDirPath, `${body.uploadId}${body.fileName}@${body.index}`);
    if (!fs.existsSync(chunckFilePath)) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    } else {
      return Result.ok();
    }
  }

  /**
   * 递归创建目录 同步方法
   * @param dirname
   * @returns
   */
  mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }

  /**
   * 文件切片合并
   */
  async chunkMergeFile(body: ChunkMergeFileDto) {
    const { uploadId, fileName } = body;
    const rootPath = process.cwd();
    const baseDirPath = path.posix.join(rootPath, this.config.app.file.location);
    const sourceFilesDir = path.posix.join(baseDirPath, this.thunkDir, uploadId);

    if (!fs.existsSync(sourceFilesDir)) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    //对文件重命名
    const newFileName = this.getNewFileName(fileName);
    const targetFile = path.posix.join(baseDirPath, newFileName);
    await this.thunkStreamMerge(sourceFilesDir, targetFile);
    //文件相对地址
    const relativeFilePath = targetFile.replace(baseDirPath, '');
    const fileServePath = path.posix.join(this.config.app.file.serveRoot, relativeFilePath);
    // 使用字符串拼接生成URL
    let domain = this.config.app.file.domain;
    if (domain.endsWith('/')) {
      domain = domain.slice(0, -1);
    }
    const url = `${domain}${fileServePath}`;
    const key = path.posix.join('test', relativeFilePath);
    const data = {
      fileName: key,
      newFileName: newFileName,
      url: url,
    };
    const stats = fs.statSync(targetFile);
    const ext = path.extname(data.newFileName).replace('.', '').toLowerCase();

    if (!this.isLocal) {
      this.uploadLargeFileCos(targetFile, key);
      // 使用字符串拼接生成COS URL
      let cosDomain = this.config.cos.domain;
      if (cosDomain.endsWith('/')) {
        cosDomain = cosDomain.slice(0, -1);
      }
      // key 不以 / 开头，需要添加
      data.url = key.startsWith('/') ? `${cosDomain}${key}` : `${cosDomain}/${key}`;
      // 写入上传记录
      await this.prisma.sysUpload.create({
        data: {
          uploadId,
          ...data,
          ext,
          size: stats.size,
          thumbnail: null,
          storageType: 'cos',
        },
      });
      return Result.ok(data);
    }
    await this.prisma.sysUpload.create({
      data: {
        uploadId,
        ...data,
        ext,
        size: stats.size,
        thumbnail: null,
        storageType: 'local',
      },
    });
    return Result.ok(data);
  }

  /**
   * 文件合并
   * @param {string} sourceFiles 源文件目录
   * @param {string} targetFile 目标文件路径
   */
  async thunkStreamMerge(sourceFilesDir, targetFile) {
    const fileList = fs
      .readdirSync(sourceFilesDir)
      .filter((file) => fs.lstatSync(path.posix.join(sourceFilesDir, file)).isFile())
      .sort((a, b) => parseInt(a.split('@')[1]) - parseInt(b.split('@')[1]))
      .map((name) => ({
        name,
        filePath: path.posix.join(sourceFilesDir, name),
      }));

    const fileWriteStream = fs.createWriteStream(targetFile);
    let onResolve: (value) => void;
    const callbackPromise = new Promise((resolve) => {
      onResolve = resolve;
    });
    this.thunkStreamMergeProgress(fileList, fileWriteStream, sourceFilesDir, onResolve);
    return callbackPromise;
  }

  /**
   * 合并每一个切片
   * @param {Array} fileList 文件数据列表
   * @param {WritableStream} fileWriteStream 最终的写入结果流
   * @param {string} sourceFilesDir 源文件目录
   */
  thunkStreamMergeProgress(fileList, fileWriteStream, sourceFilesDir, onResolve) {
    if (!fileList.length) {
      // 删除临时目录
      fs.rmdirSync(sourceFilesDir, { recursive: true });
      onResolve();
      return;
    }

    const { filePath: chunkFilePath } = fileList.shift();
    const currentReadStream = fs.createReadStream(chunkFilePath);

    // 把结果往最终的生成文件上进行拼接
    currentReadStream.pipe(fileWriteStream, { end: false });

    currentReadStream.on('end', () => {
      // 拼接完之后进入下一次循环
      this.thunkStreamMergeProgress(fileList, fileWriteStream, sourceFilesDir, onResolve);
    });
  }

  /**
   * 保存文件到本地
   * @param file
   */
  async saveFileLocal(file: Express.Multer.File) {
    const rootPath = process.cwd();
    //文件根目录
    const baseDirPath = path.posix.join(rootPath, this.config.app.file.location);

    //对文件名转码
    const originalname = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
    //重新生成文件名加上时间戳（已包含扩展名）
    const newFileName = this.getNewFileName(originalname);
    //文件路径
    const targetFile = path.posix.join(baseDirPath, newFileName);
    //文件目录
    const sourceFilesDir = path.dirname(targetFile);
    //文件相对地址
    const relativeFilePath = targetFile.replace(baseDirPath, '');

    if (!fs.existsSync(sourceFilesDir)) {
      this.mkdirsSync(sourceFilesDir);
    }
    fs.writeFileSync(targetFile, file.buffer);

    //文件服务完整路径
    const fileName = path.posix.join(this.config.app.file.serveRoot, relativeFilePath);
    // 使用字符串拼接生成URL，避免path.posix.join破坏http://协议
    let domain = this.config.app.file.domain;
    // 移除domain尾部的斜杠（如果有）
    if (domain.endsWith('/')) {
      domain = domain.slice(0, -1);
    }
    const url = `${domain}${fileName}`;
    return {
      fileName: fileName,
      newFileName: newFileName,
      url: url,
      filePath: targetFile, // 实际文件路径，用于缩略图生成
    };
  }
  /**
   * 生成新的文件名（在文件名后添加时间戳，保留扩展名）
   * @param originalname
   * @returns
   */
  getNewFileName(originalname: string): string {
    if (!originalname) {
      return originalname;
    }
    const ext = path.extname(originalname); // 获取扩展名（如 '.mov'）
    const nameWithoutExt = path.basename(originalname, ext); // 获取不含扩展名的文件名
    return `${nameWithoutExt}_${new Date().getTime()}${ext}`;
  }

  /**
   *
   * @param targetFile
   * @param file
   * @returns
   */
  async saveFileCos(targetDir: string, file: Express.Multer.File) {
    //对文件名转码
    const originalname = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
    //重新生成文件名加上时间戳
    const newFileName = this.getNewFileName(originalname);
    const targetFile = path.posix.join(targetDir, newFileName);

    // 先保存到本地临时文件（用于生成缩略图）
    const rootPath = process.cwd();
    const baseDirPath = path.posix.join(rootPath, this.config.app.file.location);
    const localTempFile = path.posix.join(baseDirPath, 'temp', newFileName);
    const tempDir = path.dirname(localTempFile);
    if (!fs.existsSync(tempDir)) {
      this.mkdirsSync(tempDir);
    }
    fs.writeFileSync(localTempFile, file.buffer);

    // 上传到COS
    await this.uploadCos(targetFile, file.buffer);
    // 使用字符串拼接生成URL
    let cosDomain = this.config.cos.domain;
    if (cosDomain.endsWith('/')) {
      cosDomain = cosDomain.slice(0, -1);
    }
    // targetFile 不以 / 开头，需要添加
    const url = targetFile.startsWith('/') ? `${cosDomain}${targetFile}` : `${cosDomain}/${targetFile}`;
    return {
      fileName: targetFile,
      newFileName: newFileName,
      url: url,
      filePath: localTempFile, // 本地临时文件路径，用于缩略图生成
    };
  }

  /**
   * 普通文件上传cos
   * @param targetFile
   * @param uploadBody
   * @returns
   */
  async uploadCos(targetFile: string, buffer: COS.UploadBody) {
    const { statusCode } = await this.cosHeadObject(targetFile);
    if (statusCode !== 200) {
      //不存在
      const data = await this.cos.putObject({
        Bucket: this.config.cos.bucket,
        Region: this.config.cos.region,
        Key: targetFile,
        Body: buffer,
      });
      return path.dirname(data.Location);
    }
    return targetFile;
  }

  /**
   * 获取分片上传结果
   * @param uploadId
   * @returns
   */
  async getChunkUploadResult(uploadId: string) {
    const data = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
      select: { status: true, fileName: true, newFileName: true, url: true },
    });

    if (data) {
      return Result.ok({
        data: data,
        msg: data.status === StatusEnum.NORMAL ? '上传成功' : '上传中',
      });
    } else {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }
  }

  /**
   *  大文件上传cos
   * @param sourceFile
   * @param targetFile
   * @returns
   */
  async uploadLargeFileCos(sourceFile: string, targetFile: string) {
    const { statusCode } = await this.cosHeadObject(targetFile);
    if (statusCode !== 200) {
      //不存在
      await this.cos.uploadFile({
        Bucket: this.config.cos.bucket,
        Region: this.config.cos.region,
        Key: targetFile,
        FilePath: sourceFile,
        SliceSize: 1024 * 1024 * 5 /* 触发分块上传的阈值，超过5MB使用分块上传，非必须 */,
        onProgress: (progressData) => {
          if (progressData.percent === 1) {
            this.prisma.sysUpload.updateMany({ where: { fileName: targetFile }, data: { status: StatusEnum.NORMAL } });
          }
        },
      });
    }
    //删除本地文件
    fs.unlinkSync(sourceFile);
    return targetFile;
  }

  /**
   * 检查cos资源是否存在
   * @param directory
   * @param key
   * @returns
   */
  async cosHeadObject(targetFile: string) {
    try {
      return await this.cos.headObject({
        Bucket: this.config.cos.bucket,
        Region: this.config.cos.region,
        Key: targetFile,
      });
    } catch (error) {
      return error;
    }
  }

  /**
   * 获取cos授权
   * @returns
   */
  async getAuthorization(Key: string) {
    const authorization = COS.getAuthorization({
      SecretId: this.config.cos.secretId,
      SecretKey: this.config.cos.secretKey,
      Method: 'post',
      Key: Key,
      Expires: 60,
    });
    return Result.ok({
      sign: authorization,
    });
  }
}
