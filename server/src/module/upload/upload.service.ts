import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ResponseCode } from 'src/common/response';
import { StatusEnum } from 'src/common/enum/index';
import { ChunkFileDto, ChunkMergeFileDto } from './dto/index';
import { GenerateUUID } from 'src/common/utils/index';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import COS from 'cos-nodejs-sdk-v5';
import Mime from 'mime-types';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantContext } from 'src/common/tenant/tenant.context';

@Injectable()
export class UploadService {
  private thunkDir: string;
  private cos = new COS({
    // 必选参数
    SecretId: this.config.get('cos.secretId'),
    SecretKey: this.config.get('cos.secretKey'),
    //可选参数
    FileParallelLimit: 3, // 控制文件上传并发数
    ChunkParallelLimit: 8, // 控制单个文件下分片上传并发数，在同园区上传可以设置较大的并发数
    ChunkSize: 1024 * 1024 * 8, // 控制分片大小，单位 B，在同园区上传可以设置较大的分片大小
  });
  private isLocal: boolean;
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ConfigService)
    private config: ConfigService,
  ) {
    this.thunkDir = 'thunk';
    this.isLocal = this.config.get('app.file.isLocal');
  }

  /**
   * 单文件上传
   * @param file 上传的文件
   * @param folderId 文件夹ID（可选）
   * @returns
   */
  async singleFileUpload(file: Express.Multer.File, folderId?: number) {
    const fileSizeMB = file.size / 1024 / 1024;
    const maxSize = this.config.get('app.file.maxSize');
    if (fileSizeMB > maxSize) {
      throw new Error(`文件大小不能超过${maxSize}MB`);
    }
    let res;
    const storageType = this.isLocal ? 'local' : 'cos';
    if (this.isLocal) {
      res = await this.saveFileLocal(file);
    } else {
      const targetDir = this.config.get('cos.location');
      res = await this.saveFileCos(targetDir, file);
    }
    const uploadId = GenerateUUID();
    const mimeType = Mime.lookup(file.originalname) || 'application/octet-stream';

    // 获取扩展名（去掉点号并转小写）
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();

    // 生成格式化的文件名用于前端显示：日期_时间_随机数.扩展名
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const random = String(now.getTime()).slice(-4);
    const displayFileName = `${dateStr}_${timeStr}_${random}${ext ? '.' + ext : ''}`;

    // 创建上传记录
    await this.prisma.sysUpload.create({
      data: {
        uploadId,
        fileName: displayFileName, // 前端显示用的格式化文件名
        newFileName: res.newFileName, // 服务器实际存储的文件名
        url: res.url,
        folderId: folderId || 0,
        ext,
        size: file.size, // 字节数
        mimeType,
        storageType,
        fileMd5: null,
        thumbnail: null,
      }
    });

    return res;
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
    const baseDirPath = path.posix.join(rootPath, this.config.get('app.file.location'));
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
    const baseDirPath = path.posix.join(rootPath, this.config.get('app.file.location'));
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
    const baseDirPath = path.posix.join(rootPath, this.config.get('app.file.location'));
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
    const fileServePath = path.posix.join(this.config.get('app.file.serveRoot'), relativeFilePath);
    // 使用字符串拼接生成URL
    let domain = this.config.get('app.file.domain');
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
      let cosDomain = this.config.get('cos.domain');
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
    const baseDirPath = path.posix.join(rootPath, this.config.get('app.file.location'));

    //对文件名转码
    const originalname = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
    const ext = Mime.extension(file.mimetype);
    //重新生成文件名加上时间戳
    const newFileName = this.getNewFileName(originalname) + '.' + ext;
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
    const fileName = path.posix.join(this.config.get('app.file.serveRoot'), relativeFilePath);
    // 使用字符串拼接生成URL，避免path.posix.join破坏http://协议
    let domain = this.config.get('app.file.domain');
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
   * 生成新的文件名
   * @param originalname
   * @returns
   */
  getNewFileName(originalname: string): string {
    if (!originalname) {
      return originalname;
    }
    const newFileNameArr = originalname.split('.');
    newFileNameArr[newFileNameArr.length - 1] = `${newFileNameArr[newFileNameArr.length - 1]}_${new Date().getTime()}`;
    return newFileNameArr.join('.');
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
    const baseDirPath = path.posix.join(rootPath, this.config.get('app.file.location'));
    const localTempFile = path.posix.join(baseDirPath, 'temp', newFileName);
    const tempDir = path.dirname(localTempFile);
    if (!fs.existsSync(tempDir)) {
      this.mkdirsSync(tempDir);
    }
    fs.writeFileSync(localTempFile, file.buffer);

    // 上传到COS
    await this.uploadCos(targetFile, file.buffer);
    // 使用字符串拼接生成URL
    let cosDomain = this.config.get('cos.domain');
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
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
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
        msg: data.status === '0' ? '上传成功' : '上传中',
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
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
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
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
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
      SecretId: this.config.get('cos.secretId'),
      SecretKey: this.config.get('cos.secretKey'),
      Method: 'post',
      Key: Key,
      Expires: 60,
    });
    return Result.ok({
      sign: authorization,
    });
  }
}
