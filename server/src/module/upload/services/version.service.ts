import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from 'src/config/app-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 文件版本信息类型
 */
interface FileVersion {
    uploadId: string;
    version: number;
    storageType: string;
    url: string;
    newFileName: string;
    thumbnail?: string | null;
    fileName?: string;
}

@Injectable()
export class VersionService {
    private readonly logger = new Logger(VersionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: AppConfigService,
    ) { }

    /**
     * 检查并清理旧版本
     */
    async checkAndCleanOldVersions(parentFileId: string): Promise<void> {
        try {
            // 获取配置
            const maxVersions = parseInt(await this.getConfigValue('sys.file.maxVersions', '5'));

            if (!parentFileId) {
                return;
            }

            // 查询所有版本（包括父文件本身）
            const versions = await this.prisma.sysUpload.findMany({
                where: {
                    OR: [
                        { uploadId: parentFileId },
                        { parentFileId: parentFileId },
                    ],
                    delFlag: '0',
                },
                orderBy: { version: 'desc' },
            });

            // 如果版本数超过限制
            if (versions.length > maxVersions) {
                const versionsToDelete = versions.slice(maxVersions);

                for (const version of versionsToDelete) {
                    await this.deleteVersion(version);
                }

                this.logger.log(
                    `清理了 ${versionsToDelete.length} 个旧版本，文件: ${parentFileId}`
                );
            }
        } catch (error) {
            this.logger.error(`清理旧版本失败: ${error.message}`, error.stack);
        }
    }

    /**
     * 删除单个版本（物理文件和数据库记录）
     */
    private async deleteVersion(version: FileVersion): Promise<void> {
        try {
            // 删除物理文件
            await this.deletePhysicalFile(version);

            // 删除数据库记录
            await this.prisma.sysUpload.delete({
                where: { uploadId: version.uploadId },
            });

            this.logger.log(`已删除版本: ${version.uploadId}, version: ${version.version}`);
        } catch (error) {
            this.logger.error(`删除版本失败: ${error.message}`, error.stack);
        }
    }

    /**
     * 删除物理文件
     */
    async deletePhysicalFile(file: FileVersion): Promise<void> {
        try {
            if (file.storageType === 'local') {
                // 删除本地文件
                const baseDir = path.join(process.cwd(), this.config.app.file.location);

                // 从URL中提取文件路径
                const url = file.url;
                const serveRoot = this.config.app.file.serveRoot;
                const relativePath = url.split(serveRoot)[1];

                if (relativePath) {
                    const filePath = path.join(baseDir, relativePath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        this.logger.log(`已删除本地文件: ${filePath}`);
                    }
                }

                // 删除缩略图
                if (file.thumbnail) {
                    const thumbnailPath = file.thumbnail.split(serveRoot)[1];
                    if (thumbnailPath) {
                        const fullThumbnailPath = path.join(baseDir, thumbnailPath);
                        if (fs.existsSync(fullThumbnailPath)) {
                            fs.unlinkSync(fullThumbnailPath);
                            this.logger.log(`已删除缩略图: ${fullThumbnailPath}`);
                        }
                    }
                }
            } else if (file.storageType === 'cos') {
                // TODO: 实现COS文件删除
                // await this.cosService.deleteFile(file.newFileName);
                this.logger.log(`COS文件删除功能待实现: ${file.newFileName}`);
            }
        } catch (error) {
            this.logger.error(`删除物理文件失败: ${error.message}`, error.stack);
        }
    }

    /**
     * 获取配置值
     */
    private async getConfigValue(key: string, defaultValue: string): Promise<string> {
        try {
            const config = await this.prisma.sysConfig.findFirst({
                where: { configKey: key, delFlag: '0' },
            });
            return config?.configValue || defaultValue;
        } catch (error) {
            this.logger.warn(`获取配置失败: ${key}, 使用默认值: ${defaultValue}`);
            return defaultValue;
        }
    }
}
