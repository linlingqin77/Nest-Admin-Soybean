import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from 'src/platform/logger/structured-logger.service';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { toDto, toDtoList } from 'src/shared/utils/index';
import { DelFlagEnum } from 'src/shared/enums/index';
import { ClientRepository } from './client.repository';
import { CreateClientDto, UpdateClientDto, ChangeClientStatusDto, ListClientDto, ClientResponseDto } from './dto/index';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class ClientService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly clientRepo: ClientRepository,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(ClientService.name);
  }

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 创建客户端
   */
  @Transactional()
  async create(createClientDto: CreateClientDto) {
    // 检查客户端key是否已存在
    const exists = await this.clientRepo.existsByClientKey(createClientDto.clientKey);
    BusinessException.throwIf(exists, '客户端key已存在', ResponseCode.DATA_ALREADY_EXISTS);

    // 生成唯一的clientId
    const clientId = uuidv4().replace(/-/g, '');

    // 处理授权类型列表
    const grantTypeList = createClientDto.grantTypeList?.join(',') || '';

    await this.clientRepo.create({
      clientId,
      clientKey: createClientDto.clientKey,
      clientSecret: createClientDto.clientSecret,
      grantTypeList,
      deviceType: createClientDto.deviceType || 'pc',
      activeTimeout: createClientDto.activeTimeout || 1800,
      timeout: createClientDto.timeout || 86400,
      status: createClientDto.status || '0',
    });

    return Result.ok(null, '创建成功');
  }

  /**
   * 查询客户端列表
   */
  async findAll(query: ListClientDto) {
    const where: Prisma.SysClientWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.clientKey) {
      where.clientKey = {
        contains: query.clientKey,
      };
    }

    if (query.clientSecret) {
      where.clientSecret = {
        contains: query.clientSecret,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const { list, total } = await this.clientRepo.findPageWithFilter(where, query.skip, query.take);

    // 转换响应数据，添加 grantTypeArray
    const rows = list.map((item) => ({
      ...item,
      grantTypeArray: item.grantTypeList ? item.grantTypeList.split(',') : [],
    }));

    return Result.page(toDtoList(ClientResponseDto, rows), total, query.pageNum, query.pageSize);
  }

  /**
   * 根据ID查询客户端详情
   */
  async findOne(id: number) {
    const data = await this.clientRepo.findById(id);
    BusinessException.throwIfNull(data, '客户端不存在', ResponseCode.DATA_NOT_FOUND);

    // 添加 grantTypeArray
    const result = {
      ...data,
      grantTypeArray: data.grantTypeList ? data.grantTypeList.split(',') : [],
    };

    return Result.ok(toDto(ClientResponseDto, result));
  }

  /**
   * 更新客户端
   */
  @Transactional()
  async update(updateClientDto: UpdateClientDto) {
    const client = await this.clientRepo.findById(updateClientDto.id);
    BusinessException.throwIfNull(client, '客户端不存在', ResponseCode.DATA_NOT_FOUND);

    // 如果修改了clientKey，检查是否重复
    if (updateClientDto.clientKey && updateClientDto.clientKey !== client.clientKey) {
      const exists = await this.clientRepo.existsByClientKey(updateClientDto.clientKey, updateClientDto.id);
      BusinessException.throwIf(exists, '客户端key已存在', ResponseCode.DATA_ALREADY_EXISTS);
    }

    // 处理授权类型列表
    const updateData: Prisma.SysClientUpdateInput = {};

    if (updateClientDto.clientKey !== undefined) {
      updateData.clientKey = updateClientDto.clientKey;
    }
    if (updateClientDto.clientSecret !== undefined) {
      updateData.clientSecret = updateClientDto.clientSecret;
    }
    if (updateClientDto.grantTypeList !== undefined) {
      updateData.grantTypeList = updateClientDto.grantTypeList.join(',');
    }
    if (updateClientDto.deviceType !== undefined) {
      updateData.deviceType = updateClientDto.deviceType;
    }
    if (updateClientDto.activeTimeout !== undefined) {
      updateData.activeTimeout = updateClientDto.activeTimeout;
    }
    if (updateClientDto.timeout !== undefined) {
      updateData.timeout = updateClientDto.timeout;
    }
    if (updateClientDto.status !== undefined) {
      updateData.status = updateClientDto.status;
    }

    await this.clientRepo.update(updateClientDto.id, updateData);

    return Result.ok(null, '更新成功');
  }

  /**
   * 修改客户端状态
   */
  @Transactional()
  async changeStatus(dto: ChangeClientStatusDto) {
    const client = await this.clientRepo.findById(dto.id);
    BusinessException.throwIfNull(client, '客户端不存在', ResponseCode.DATA_NOT_FOUND);

    await this.clientRepo.update(dto.id, { status: dto.status });

    return Result.ok(null, '状态修改成功');
  }

  /**
   * 批量删除客户端
   */
  @Transactional()
  async remove(ids: number[]) {
    await this.clientRepo.softDeleteBatch(ids);
    return Result.ok(null, '删除成功');
  }
}
