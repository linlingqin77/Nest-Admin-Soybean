import { PrismaClient, Status, DelFlag } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 文件管理系统配置种子数据
 */
export async function seedFileManagementConfig() {
    console.log('开始插入文件管理系统配置...');

    const configs = [
        {
            configName: '文件版本模式',
            configKey: 'sys.file.versionMode',
            configValue: 'overwrite',
            configType: 'Y',
            remark: '文件版本控制模式：overwrite-覆盖模式，version-版本模式',
        },
        {
            configName: '文件最大版本数',
            configKey: 'sys.file.maxVersions',
            configValue: '5',
            configType: 'Y',
            remark: '保留的最大文件版本数，超过后自动删除最旧版本',
        },
        {
            configName: '缩略图功能开关',
            configKey: 'sys.file.thumbnailEnabled',
            configValue: 'true',
            configType: 'Y',
            remark: '是否启用缩略图自动生成功能',
        },
        {
            configName: '自动清理旧版本',
            configKey: 'sys.file.autoCleanVersions',
            configValue: 'true',
            configType: 'Y',
            remark: '是否启用定时任务自动清理旧版本文件',
        },
    ];

    for (const config of configs) {
        const existing = await prisma.sysConfig.findFirst({
            where: {
                tenantId: '000000',
                configKey: config.configKey,
            },
        });

        if (!existing) {
            await prisma.sysConfig.create({
                data: {
                    ...config,
                    tenantId: '000000',
                    status: Status.NORMAL,
                    delFlag: DelFlag.NORMAL,
                    createBy: 'admin',
                    updateBy: 'admin',
                },
            });
            console.log(`✓ 配置已创建: ${config.configName}`);
        } else {
            await prisma.sysConfig.update({
                where: { configId: existing.configId },
                data: config,
            });
            console.log(`✓ 配置已更新: ${config.configName}`);
        }
    }

    console.log('文件管理系统配置插入完成！');
}

/**
 * 文件管理定时任务种子数据
 */
export async function seedFileManagementJobs() {
    console.log('开始插入文件管理定时任务...');

    const jobs = [
        {
            jobName: '存储配额预警',
            jobGroup: 'SYSTEM',
            invokeTarget: 'storageQuotaAlert()',
            cronExpression: '0 0 9 * * ?',
            misfirePolicy: '1',
            concurrent: '0',
            status: Status.NORMAL,
            remark: '每天早上9点检查租户存储使用情况，超过80%发送预警通知',
        },
        {
            jobName: '清理旧文件版本',
            jobGroup: 'SYSTEM',
            invokeTarget: 'cleanOldFileVersions()',
            cronExpression: '0 0 2 * * ?',
            misfirePolicy: '1',
            concurrent: '0',
            status: Status.NORMAL,
            remark: '每天凌晨2点批量扫描并清理超过maxVersions限制的旧版本文件',
        },
    ];

    for (const job of jobs) {
        const existing = await prisma.sysJob.findFirst({
            where: {
                tenantId: '000000',
                jobName: job.jobName,
            },
        });

        if (!existing) {
            await prisma.sysJob.create({
                data: {
                    ...job,
                    tenantId: '000000',
                    createBy: 'admin',
                    updateBy: 'admin',
                },
            });
            console.log(`✓ 定时任务已创建: ${job.jobName}`);
        } else {
            console.log(`⊙ 定时任务已存在: ${job.jobName}`);
        }
    }

    console.log('文件管理定时任务插入完成！');
}

/**
 * 更新租户表添加存储配额字段
 */
export async function updateTenantStorageQuota() {
    console.log('开始更新租户存储配额...');

    const tenants = await prisma.sysTenant.findMany({
        where: { delFlag: DelFlag.NORMAL },
    });

    for (const tenant of tenants) {
        // 如果storageQuota为null或0，设置默认值10GB
        if (!tenant.storageQuota || tenant.storageQuota === 0) {
            await prisma.sysTenant.update({
                where: { id: tenant.id },
                data: {
                    storageQuota: 10240, // 10GB
                    storageUsed: 0,
                },
            });
            console.log(`✓ 租户 ${tenant.companyName} 存储配额已设置为 10GB`);
        }
    }

    console.log('租户存储配额更新完成！');
}

// 主执行函数
async function main() {
    try {
        // await seedFileManagementConfig(); // 配置已存在，跳过
        // await seedFileManagementJobs(); // 任务已存在，跳过
        await updateTenantStorageQuota();
    } catch (error) {
        console.error('Seed执行失败:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main()
        .then(() => {
            console.log('✅ 所有seed数据已成功插入！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seed失败:', error);
            process.exit(1);
        });
}

export default main;
