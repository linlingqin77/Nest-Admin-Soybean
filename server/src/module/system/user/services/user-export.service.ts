import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ExportTable } from 'src/common/utils/export';
import { ListUserDto } from '../dto/index';
import { UserType } from '../dto/user';

/**
 * 用户导出服务
 * 
 * @description 处理用户数据的导出功能
 */
@Injectable()
export class UserExportService {
    constructor() { }

    /**
     * 导出用户数据到Excel
     */
    async export(res: Response, data: { rows: any[]; total: number }) {
        const options = {
            sheetName: '用户数据',
            data: data.rows,
            header: [
                { title: '用户序号', dataIndex: 'userId' },
                { title: '登录名称', dataIndex: 'userName' },
                { title: '用户昵称', dataIndex: 'nickName' },
                { title: '用户邮箱', dataIndex: 'email' },
                { title: '手机号码', dataIndex: 'phonenumber' },
                { title: '用户性别', dataIndex: 'sex' },
                { title: '账号状态', dataIndex: 'status' },
                { title: '最后登录IP', dataIndex: 'loginIp' },
                { title: '最后登录时间', dataIndex: 'loginDate', width: 20 },
                { title: '部门', dataIndex: 'deptName' },
                { title: '部门负责人', dataIndex: 'dept.leader' },
                { title: '创建时间', dataIndex: 'createTime', width: 20 },
            ],
        };
        return await ExportTable(options, res);
    }
}
