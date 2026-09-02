import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/shared/response';
import { DelFlagEnum } from 'src/shared/enums/index';
import { toDtoList } from 'src/shared/utils/index';
import { CreateMailAccountDto, ListMailAccountDto, MailAccountResponseDto, UpdateMailAccountDto } from './dto/index';
import { MailAccountRepository } from './mail-account.repository';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';
import * as crypto from 'crypto';

// 简单的密码加密密钥（生产环境应从配置中读取）
const ENCRYPTION_KEY = process.env.MAIL_PASSWORD_KEY || 'mail-password-encryption-key-32b';
const ENCRYPTION_IV_LENGTH = 16;

@Injectable()
export class MailAccountService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly mailAccountRepo: MailAccountRepository,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 加密密码
   */
  private encryptPassword(password: string): string {
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密密码
   */
  private decryptPassword(encryptedPassword: string): string {
    try {
      const parts = encryptedPassword.split(':');
      if (parts.length !== 2) {
        return encryptedPassword; // 未加密的密码直接返回
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedPassword; // 解密失败返回原值
    }
  }

  /**
   * 创建邮箱账号
   */
  async create(createDto: CreateMailAccountDto) {
    // 检查邮箱地址是否已存在
    const exists = await this.mailAccountRepo.existsByMail(createDto.mail);
    if (exists) {
      throw new BadRequestException('邮箱地址已存在');
    }

    // 加密密码
    const encryptedPassword = this.encryptPassword(createDto.password);

    await this.mailAccountRepo.create({
      ...createDto,
      password: encryptedPassword,
    });
    return Result.ok();
  }

  /**
   * 分页查询邮箱账号列表
   */
  async findAll(query: ListMailAccountDto) {
    const where: Prisma.SysMailAccountWhereInput = {
      delFlag: '0',
    };

    if (query.mail) {
      where.mail = {
        contains: query.mail,
      };
    }

    if (query.username) {
      where.username = {
        contains: query.username,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.mailAccountRepo.findPageWithFilter(where, query.skip, query.take);

    // 隐藏密码
    const safeList = list.map((item) => ({
      ...item,
      password: '******',
    }));

    return Result.ok({
      rows: toDtoList(MailAccountResponseDto, safeList),
      total,
    });
  }

  /**
   * 根据ID查询邮箱账号详情
   */
  async findOne(id: number) {
    const data = await this.mailAccountRepo.findById(id);
    if (!data) {
      throw new BadRequestException('邮箱账号不存在');
    }

    // 隐藏密码
    const safeData = {
      ...data,
      password: '******',
    };

    return Result.ok(safeData);
  }

  /**
   * 更新邮箱账号
   */
  async update(updateDto: UpdateMailAccountDto) {
    const { id, ...data } = updateDto;

    // 检查账号是否存在
    const account = await this.mailAccountRepo.findById(id);
    if (!account) {
      throw new BadRequestException('邮箱账号不存在');
    }

    // 如果修改了邮箱地址，检查新地址是否已存在
    if (data.mail && data.mail !== account.mail) {
      const exists = await this.mailAccountRepo.existsByMail(data.mail, id);
      if (exists) {
        throw new BadRequestException('邮箱地址已存在');
      }
    }

    // 如果密码是******，则不更新
    if (data.password === '******') {
      delete data.password;
    } else if (data.password) {
      // 加密新密码
      data.password = this.encryptPassword(data.password);
    }

    await this.mailAccountRepo.update(id, data);
    return Result.ok();
  }

  /**
   * 删除邮箱账号
   */
  @Transactional()
  async remove(ids: number[]) {
    const data = await this.mailAccountRepo.softDeleteBatch(ids);
    return Result.ok(data);
  }

  /**
   * 获取所有启用的账号（用于下拉选择）
   */
  async getEnabledAccounts() {
    const list = await this.mailAccountRepo.findAllEnabled();
    return Result.ok(
      list.map((item) => ({
        id: item.id,
        mail: item.mail,
        username: item.username,
      })),
    );
  }

  /**
   * 根据ID获取账号（内部使用，包含解密后的密码）
   */
  async getAccountById(id: number) {
    const account = await this.mailAccountRepo.findEnabledById(id);
    if (!account) {
      return null;
    }
    return {
      ...account,
      password: this.decryptPassword(account.password),
    };
  }
}
