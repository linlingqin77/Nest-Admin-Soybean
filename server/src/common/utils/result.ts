import { ApiProperty } from '@nestjs/swagger';

export const SUCCESS_CODE = 200;

/**
 * 响应结构
 * ok 成功
 * fail 失败
 */
export class ResultData {
  constructor(code = SUCCESS_CODE, msg?: string, data?: unknown) {
    this.code = code;
    this.msg = msg || '操作成功';
    this.data = data || null;
  }

  @ApiProperty({ type: Number, default: SUCCESS_CODE })
  code: number;

  @ApiProperty({ type: String, default: '操作成功' })
  msg?: string;

  @ApiProperty()
  data?: unknown;

  static ok(data?: unknown, msg?: string): ResultData {
    return new ResultData(SUCCESS_CODE, msg, data);
  }

  static fail(code: number, msg?: string, data?: unknown): ResultData {
    return new ResultData(code || 500, msg || 'fail', data);
  }
}
