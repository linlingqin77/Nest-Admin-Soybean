import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { Response } from 'express';
import { CreatePostDto, UpdatePostDto, ListPostDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeptService } from '../dept/dept.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => DeptService))
    private readonly deptService: DeptService,
  ) { }
  async create(createPostDto: CreatePostDto) {
    await this.prisma.sysPost.create({
      data: {
        deptId: createPostDto.deptId,
        postCode: createPostDto.postCode,
        postCategory: createPostDto.postCategory,
        postName: createPostDto.postName,
        postSort: createPostDto.postSort ?? 0,
        status: createPostDto.status ?? '0',
        remark: createPostDto.remark ?? '',
        createBy: '',
        updateBy: '',
        delFlag: '0',
      },
    });
    return ResultData.ok();
  }

  async findAll(query: ListPostDto) {
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

    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysPost.findMany({
        where,
        skip: pageSize * (pageNum - 1),
        take: pageSize,
        orderBy: { postSort: 'asc' },
      }),
      this.prisma.sysPost.count({ where }),
    ]);

    return ResultData.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  async findOne(postId: number) {
    const res = await this.prisma.sysPost.findUnique({
      where: {
        postId,
      },
    });
    return ResultData.ok(res);
  }

  async update(updatePostDto: UpdatePostDto) {
    const res = await this.prisma.sysPost.update({ where: { postId: updatePostDto.postId }, data: updatePostDto });
    return ResultData.ok(res);
  }

  async remove(postIds: string[]) {
    const ids = postIds.map((item) => Number(item));
    const data = await this.prisma.sysPost.updateMany({
      where: {
        postId: {
          in: ids,
        },
      },
      data: {
        delFlag: '1',
      },
    });
    return ResultData.ok(data.count);
  }

  /**
   * 获取岗位选择框列表
   */
  async optionselect(deptId?: number, postIds?: number[]) {
    const where: Prisma.SysPostWhereInput = {
      delFlag: '0',
      status: '0',
    };
    if (postIds && postIds.length > 0) {
      where.postId = { in: postIds };
    }
    const list = await this.prisma.sysPost.findMany({
      where,
      orderBy: { postSort: 'asc' },
    });
    return ResultData.ok(list);
  }

  /**
   * 获取部门树
   */
  async deptTree() {
    const tree = await this.deptService.deptTree();
    return ResultData.ok(tree);
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
