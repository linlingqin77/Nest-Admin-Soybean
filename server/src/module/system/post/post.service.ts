import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/common/response';
import { DelFlagEnum } from 'src/common/enum/index';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { Response } from 'express';
import { CreatePostDto, UpdatePostDto, ListPostDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeptService } from '../dept/dept.service';
import { PostRepository } from './post.repository';
import { Transactional } from 'src/common/decorators/transactional.decorator';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => DeptService))
    private readonly deptService: DeptService,
    private readonly postRepo: PostRepository,
  ) {}
  async create(createPostDto: CreatePostDto) {
    await this.postRepo.create({
      deptId: createPostDto.deptId,
      postCode: createPostDto.postCode,
      postCategory: createPostDto.postCategory,
      postName: createPostDto.postName,
      postSort: createPostDto.postSort ?? 0,
      status: createPostDto.status ?? '0',
      remark: createPostDto.remark ?? '',
      delFlag: DelFlagEnum.NORMAL,
      ...createPostDto,
    });
    return Result.ok();
  }

  async findAll(query: ListPostDto) {
    const where: Prisma.SysPostWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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

    return Result.page(FormatDateFields(list), total);
  }

  async findOne(postId: number) {
    const res = await this.postRepo.findById(postId);
    return Result.ok(res);
  }

  async update(updatePostDto: UpdatePostDto) {
    const res = await this.postRepo.update(updatePostDto.postId, updatePostDto);
    return Result.ok(res);
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
    return Result.ok(list);
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
  async export(res: Response, body: ListPostDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '岗位数据',
      data: list.data.rows,
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
