import { Prisma, PrismaClient } from '@prisma/client';

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

export interface PaginationParams {
  pageNum?: number | string;
  pageSize?: number | string;
}

export interface PaginationQuery {
  skip: number;
  take: number;
  pageNum: number;
  pageSize: number;
}

export class PaginationHelper {
  static getPagination(params: PaginationParams = {}): PaginationQuery {
    const pageSize = Number(params.pageSize ?? 10);
    const pageNum = Number(params.pageNum ?? 1);
    const take = pageSize > 0 ? pageSize : 10;
    const skip = take * (pageNum > 0 ? pageNum - 1 : 0);
    return { skip, take, pageNum: pageNum > 0 ? pageNum : 1, pageSize: take };
  }

  static async paginate<T>(findMany: () => Promise<T[]>, count: () => Promise<number>): Promise<PaginatedResult<T>> {
    const [rows, total] = await Promise.all([findMany(), count()]);
    return { rows, total };
  }

  static async paginateWithTransaction<T>(
    prisma: PrismaClient,
    model: string,
    findManyArgs: Prisma.Args<any, 'findMany'>,
    countArgs?: Prisma.Args<any, 'count'>,
  ): Promise<PaginatedResult<T>> {
    const [rows, total] = await prisma.$transaction([
      prisma[model].findMany(findManyArgs),
      prisma[model].count(countArgs || { where: findManyArgs?.where }),
    ]);
    return { rows, total };
  }

  static buildDateRange(params?: { beginTime?: string; endTime?: string }): Prisma.DateTimeFilter | undefined {
    if (!params?.beginTime && !params?.endTime) return undefined;
    const filter: Prisma.DateTimeFilter = {} as any;
    if (params.beginTime) filter.gte = new Date(params.beginTime);
    if (params.endTime) filter.lte = new Date(params.endTime);
    return filter;
  }

  static buildStringFilter(value?: string): Prisma.StringFilter | undefined {
    if (!value) return undefined;
    return { contains: value } as Prisma.StringFilter;
  }

  static buildInFilter<T>(values?: T[]): { in: T[] } | undefined {
    if (!values || values.length === 0) return undefined;
    return { in: values };
  }
}
