import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { DelFlagEnum } from 'src/shared/enums/index';
import { ExportTable } from 'src/shared/utils/export';
import { Response } from 'express';
import { CreatePostRequestDto, UpdatePostRequestDto, ListPostRequestDto, PostResponseDto } from './dto/index';
import { DeptService } from '../depts/dept.service';
import { PostRepository } from './post.repository';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';

@Injectable()
export class PostService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly deptService: DeptService,
    private readonly postRepo: PostRepository,
  ) {}
  private get prisma() { return this.txHost.tx; }
  async create(createPostDto: CreatePostRequestDto) {
    await this.postRepo.create({
      ...createPostDto,
      postSort: createPostDto.postSort ?? 0,
      status: createPostDto.status ?? '0',
      remark: createPostDto.remark ?? '',
      delFlag: '0',
    });
    return Result.ok();
  }

  async findAll(query: ListPostRequestDto) {
    const where: Prisma.SysPostWhereInput = {
      delFlag: '0',
    };

    if (query.postName) {
      where.postName = {
        contains: query.postName,
      };
    }

    if (query.postCode) {
      where.postCode = {
        contains: query.postCode,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.belongDeptId) {
      // 获取该部门及其所有子部门的ID
      const deptIds = await this.deptService.getChildDeptIds(+query.belongDeptId);
      where.deptId = { in: deptIds };
    }

    const { list, total } = await this.postRepo.findPageWithFilter(where, query.skip, query.take);

    const rows = toDtoList(PostResponseDto, list);
    return Result.page(rows, total, query.pageNum, query.pageSize);
  }

  async findOne(postId: number) {
    const res = await this.postRepo.findById(postId);
    BusinessException.throwIfNull(res, '岗位不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(PostResponseDto, res));
  }

  async update(updatePostDto: UpdatePostRequestDto) {
    const res = await this.postRepo.update(updatePostDto.postId, updatePostDto);
    return Result.ok(toDto(PostResponseDto, res));
  }

  @Transactional()
  async remove(postIds: string[]) {
    const ids = postIds.map((id) => Number(id));
    const data = await this.postRepo.softDeleteBatch(ids);
    return Result.ok(data);
  }

  /**
   * 获取岗位选择框列表
   */
  async optionselect(deptId?: number, postIds?: number[]) {
    const list = await this.postRepo.findForSelect(deptId, postIds);
    return Result.ok(toDtoList(PostResponseDto, list));
  }

  /**
   * 获取部门树
   */
  async deptTree() {
    const tree = await this.deptService.deptTree();
    return Result.ok(tree);
  }

  /**
   * 导出岗位管理数据为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListPostRequestDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '岗位数据',
      data: ((list.data as { rows?: unknown[] })?.rows ?? []) as unknown as Record<string, unknown>[],
      header: [
        { title: '岗位序号', dataIndex: 'postId' },
        { title: '岗位编码', dataIndex: 'postCode' },
        { title: '岗位名称', dataIndex: 'postName' },
        { title: '岗位排序', dataIndex: 'postSort' },
        { title: '状态', dataIndex: 'status' },
      ],
    };
    return await ExportTable(options, res);
  }
}
