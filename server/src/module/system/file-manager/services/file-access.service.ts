import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/app-config.service';

interface FileAccessPayload {
  type: 'file-access';
  fileId: string;
  tenantId: string;
  exp: number;
}

@Injectable()
export class FileAccessService {
  private readonly tokenExpiresIn = 30 * 60; // 30分钟

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * 生成文件访问令牌
   */
  generateAccessToken(fileId: string, tenantId: string): string {
    const payload: FileAccessPayload = {
      type: 'file-access',
      fileId,
      tenantId,
      exp: Math.floor(Date.now() / 1000) + this.tokenExpiresIn,
    };

    return this.jwtService.sign(payload, {
      secret: this.config.jwt.secretkey,
    });
  }

  /**
   * 验证文件访问令牌
   */
  verifyAccessToken(token: string): { fileId: string; tenantId: string } {
    try {
      const payload = this.jwtService.verify<FileAccessPayload>(token, {
        secret: this.config.jwt.secretkey,
      });

      if (payload.type !== 'file-access') {
        throw new UnauthorizedException('无效的令牌类型');
      }

      // 检查是否过期
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('令牌已过期');
      }

      return {
        fileId: payload.fileId,
        tenantId: payload.tenantId,
      };
    } catch (error) {
      throw new UnauthorizedException('令牌验证失败: ' + error.message);
    }
  }

  /**
   * 生成预览令牌（有效期更短，5分钟）
   */
  generatePreviewToken(fileId: string, tenantId: string): string {
    const payload: FileAccessPayload = {
      type: 'file-access',
      fileId,
      tenantId,
      exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5分钟
    };

    return this.jwtService.sign(payload, {
      secret: this.config.jwt.secretkey,
    });
  }
}
