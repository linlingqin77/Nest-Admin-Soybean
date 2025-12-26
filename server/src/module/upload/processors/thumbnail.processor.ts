import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AppConfigService } from 'src/config/app-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

export interface ThumbnailJobData {
  uploadId: string;
  filePath: string;
  storageType: 'local' | 'cos';
  ext: string;
  mimeType?: string;
}

/**
 * 缩略图生成队列处理器
 * 支持图片（使用Sharp）和视频（使用FFmpeg）的缩略图生成
 */
@Processor('thumbnail')
export class ThumbnailProcessor {
  private readonly logger = new Logger(ThumbnailProcessor.name);

  // 图片类型扩展名
  private readonly IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'];
  // 视频类型扩展名
  private readonly VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'];

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('generate-thumbnail')
  async handleThumbnailGeneration(job: Job<ThumbnailJobData>): Promise<void> {
    const { uploadId, filePath, storageType, ext } = job.data;

    this.logger.log(`开始生成缩略图: uploadId=${uploadId}, ext=${ext}`);

    try {
      // 检查缩略图功能是否启用
      const thumbnailEnabled = this.config.app.file.thumbnailEnabled;
      if (!thumbnailEnabled) {
        this.logger.warn('缩略图功能未启用，跳过生成');
        return;
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        this.logger.error(`文件不存在: ${filePath}`);
        return;
      }

      const lowerExt = ext.toLowerCase();
      let thumbnailPath: string;

      // 根据文件类型生成缩略图
      if (this.IMAGE_EXTENSIONS.includes(lowerExt)) {
        thumbnailPath = await this.generateImageThumbnail(filePath, uploadId);
      } else if (this.VIDEO_EXTENSIONS.includes(lowerExt)) {
        thumbnailPath = await this.generateVideoThumbnail(filePath, uploadId);
      } else {
        this.logger.log(`不支持的文件类型: ${ext}`);
        return;
      }

      // 生成缩略图URL
      const domain = this.config.app.file.domain;
      const serveRoot = this.config.app.file.serveRoot;
      const relativePath = thumbnailPath.split('/upload/')[1];
      const thumbnailUrl = `${domain}${serveRoot}/${relativePath}`;

      // 更新数据库记录
      await this.prisma.sysUpload.update({
        where: { uploadId },
        data: { thumbnail: thumbnailUrl },
      });

      this.logger.log(`缩略图生成成功: uploadId=${uploadId}, url=${thumbnailUrl}`);
    } catch (error) {
      this.logger.error(`缩略图生成失败: uploadId=${uploadId}, error=${error.message}`, error.stack);
      // 不重新抛出异常，避免无限重试
    }
  }

  /**
   * 生成图片缩略图（使用Sharp）
   */
  private async generateImageThumbnail(inputPath: string, uploadId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const uploadDir = this.config.app.file.location;
    const thumbnailDir = path.join(uploadDir, 'thumbnails', yearMonth);

    // 确保目录存在
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const thumbnailName = `${uploadId}_thumb.webp`;
    const outputPath = path.join(thumbnailDir, thumbnailName);

    await sharp(inputPath)
      .resize(200, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    this.logger.log(`图片缩略图生成完成: ${outputPath}`);
    return outputPath;
  }

  /**
   * 生成视频缩略图（使用FFmpeg）
   */
  private async generateVideoThumbnail(inputPath: string, uploadId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const uploadDir = this.config.app.file.location;
    const thumbnailDir = path.join(uploadDir, 'thumbnails', yearMonth);

    // 确保目录存在
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const thumbnailName = `${uploadId}_thumb.webp`;
    const outputPath = path.join(thumbnailDir, thumbnailName);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [1], // 截取第1秒的帧
          filename: thumbnailName,
          folder: thumbnailDir,
          size: '200x?', // 宽度200px，高度自适应
        })
        .on('end', () => {
          this.logger.log(`视频缩略图生成完成: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (error) => {
          this.logger.error(`FFmpeg错误: ${error.message}`);
          reject(error);
        });
    });
  }
}
