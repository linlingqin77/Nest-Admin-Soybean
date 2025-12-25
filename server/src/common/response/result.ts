import { ApiProperty } from '@nestjs/swagger';
import { ResponseCode, ResponseMessage, IResponse, IPaginatedData, getResponseMessage } from './response.interface';

/**
 * 统一响应结果类
 *
 * @description 企业级标准响应封装，支持泛型类型安全
 * @example
 * // 成功响应
 * return Result.ok(data);
 * return Result.ok(data, '创建成功');
 *
 * // 失败响应
 * return Result.fail(ResponseCode.USER_NOT_FOUND);
 * return Result.fail(ResponseCode.PARAM_INVALID, '用户名不能为空');
 *
 * // 分页响应
 * return Result.page(rows, total, pageNum, pageSize);
 */
export class Result<T = any> implements IResponse<T> {
  @ApiProperty({ description: '响应码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '操作成功' })
  msg: string;

  @ApiProperty({ description: '响应数据' })
  data: T | null;

  constructor(code: number, msg: string, data: T | null = null) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  /**
   * 判断是否成功
   */
  isSuccess(): boolean {
    return this.code === ResponseCode.SUCCESS;
  }

  /**
   * 成功响应
   * @param data 响应数据
   * @param msg 响应消息（可选）
   */
  static ok<T = any>(data?: T, msg?: string): Result<T> {
    return new Result<T>(ResponseCode.SUCCESS, msg ?? getResponseMessage(ResponseCode.SUCCESS), data ?? null);
  }

  /**
   * 失败响应
   * @param code 错误码
   * @param msg 错误消息（可选，不传则使用默认消息）
   * @param data 额外数据（可选）
   */
  static fail<T = any>(code: ResponseCode | number = ResponseCode.BUSINESS_ERROR, msg?: string, data?: T): Result<T> {
    return new Result<T>(code, msg ?? (ResponseMessage[code as ResponseCode] || '操作失败'), data ?? null);
  }

  /**
   * 分页响应
   * @param rows 数据列表
   * @param total 总记录数
   * @param pageNum 当前页码（可选）
   * @param pageSize 每页条数（可选）
   */
  static page<T>(rows: T[], total: number, pageNum?: number, pageSize?: number): Result<IPaginatedData<T>> {
    const pages = pageSize ? Math.ceil(total / pageSize) : undefined;
    return Result.ok<IPaginatedData<T>>({
      rows,
      total,
      pageNum,
      pageSize,
      pages,
    });
  }

  /**
   * 条件响应
   * @param condition 条件
   * @param successData 成功时的数据
   * @param failCode 失败时的错误码
   * @param failMsg 失败时的消息
   */
  static when<T>(
    condition: boolean,
    successData: T,
    failCode: ResponseCode = ResponseCode.OPERATION_FAILED,
    failMsg?: string,
  ): Result<T> {
    return condition ? Result.ok(successData) : Result.fail(failCode, failMsg);
  }

  /**
   * 从 Promise 结果创建响应
   * @param promise Promise 对象
   * @param failCode 失败时的错误码
   */
  static async fromPromise<T>(
    promise: Promise<T>,
    failCode: ResponseCode = ResponseCode.OPERATION_FAILED,
  ): Promise<Result<T>> {
    try {
      const data = await promise;
      return Result.ok(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '操作失败';
      return Result.fail(failCode, msg);
    }
  }
}

// 导出常用响应码常量
export const SUCCESS_CODE = ResponseCode.SUCCESS;
