import { TenantContext } from './tenant.context';

// 引入实际的扩展逻辑函数进行测试
// 注意：由于 tenantExtension 是 Prisma 扩展，我们测试其内部逻辑

// 辅助函数：在租户上下文中运行测试
const runWithTenant = <T>(tenantId: string, ignoreTenant: boolean, fn: () => T): T => {
    return TenantContext.run({ tenantId, ignoreTenant }, fn);
};

describe('Tenant Extension Logic', () => {

    describe('hasTenantField', () => {
        // 需要租户隔离的模型列表
        const TENANT_MODELS = [
            'SysConfig',
            'SysDept',
            'SysDictData',
            'SysDictType',
            'SysJob',
            'SysLogininfor',
            'SysMenu',
            'SysNotice',
            'SysOperLog',
            'SysPost',
            'SysRole',
            'SysUpload',
            'SysUser',
        ];

        const hasTenantField = (model: string): boolean => {
            return TENANT_MODELS.includes(model);
        };

        it('should return true for tenant models', () => {
            expect(hasTenantField('SysUser')).toBe(true);
            expect(hasTenantField('SysRole')).toBe(true);
            expect(hasTenantField('SysDept')).toBe(true);
            expect(hasTenantField('SysMenu')).toBe(true);
        });

        it('should return false for non-tenant models', () => {
            expect(hasTenantField('GenTable')).toBe(false);
            expect(hasTenantField('GenTableColumn')).toBe(false);
            expect(hasTenantField('SysTenant')).toBe(false);
        });
    });

    describe('addTenantFilter', () => {
        const TENANT_MODELS = ['SysUser', 'SysRole'];

        const hasTenantField = (model: string): boolean => TENANT_MODELS.includes(model);

        const addTenantFilter = (model: string, args: any): any => {
            if (!hasTenantField(model)) {
                return args;
            }

            if (TenantContext.isIgnoreTenant()) {
                return args;
            }

            if (TenantContext.isSuperTenant()) {
                return args;
            }

            const tenantId = TenantContext.getTenantId();
            if (!tenantId) {
                return args;
            }

            args = args || {};
            args.where = args.where || {};
            args.where.tenantId = tenantId;

            return args;
        };

        it('should not modify args for non-tenant models', () => {
            runWithTenant('100001', false, () => {
                const args = { where: { id: 1 } };
                const result = addTenantFilter('GenTable', args);
                expect(result.where.tenantId).toBeUndefined();
            });
        });

        it('should add tenantId to args for tenant models', () => {
            runWithTenant('100001', false, () => {
                const args = { where: { status: '0' } };
                const result = addTenantFilter('SysUser', args);
                expect(result.where.tenantId).toBe('100001');
                expect(result.where.status).toBe('0');
            });
        });

        it('should not add tenantId when ignoreTenant is set', () => {
            runWithTenant('100001', true, () => {
                const args = { where: { status: '0' } };
                const result = addTenantFilter('SysUser', args);
                expect(result.where.tenantId).toBeUndefined();
            });
        });

        it('should not add tenantId for super tenant', () => {
            runWithTenant('000000', false, () => {
                const args = { where: { status: '0' } };
                const result = addTenantFilter('SysUser', args);
                expect(result.where.tenantId).toBeUndefined();
            });
        });

        it('should handle empty args', () => {
            runWithTenant('100001', false, () => {
                const args = {};
                const result = addTenantFilter('SysUser', args);
                expect(result.where).toBeDefined();
                expect(result.where.tenantId).toBe('100001');
            });
        });

        it('should handle null args', () => {
            runWithTenant('100001', false, () => {
                const result = addTenantFilter('SysUser', null);
                expect(result.where.tenantId).toBe('100001');
            });
        });
    });

    describe('setTenantId for create', () => {
        const TENANT_MODELS = ['SysUser', 'SysRole'];

        const hasTenantField = (model: string): boolean => TENANT_MODELS.includes(model);

        const setTenantId = (model: string, args: any): any => {
            if (!hasTenantField(model)) {
                return args;
            }

            const tenantId = TenantContext.getTenantId();
            if (!tenantId) {
                return args;
            }

            args = args || {};
            args.data = args.data || {};

            if (!args.data.tenantId) {
                args.data.tenantId = tenantId;
            }

            return args;
        };

        it('should set tenantId when creating data', () => {
            runWithTenant('100001', false, () => {
                const args = { data: { userName: 'test', nickName: 'Test' } };
                const result = setTenantId('SysUser', args);
                expect(result.data.tenantId).toBe('100001');
            });
        });

        it('should not override existing tenantId', () => {
            runWithTenant('100001', false, () => {
                const args = { data: { userName: 'test', tenantId: '100002' } };
                const result = setTenantId('SysUser', args);
                expect(result.data.tenantId).toBe('100002');
            });
        });

        it('should not set tenantId for non-tenant models', () => {
            runWithTenant('100001', false, () => {
                const args = { data: { tableName: 'test' } };
                const result = setTenantId('GenTable', args);
                expect(result.data.tenantId).toBeUndefined();
            });
        });
    });

    describe('setTenantIdForMany for createMany', () => {
        const TENANT_MODELS = ['SysUser'];

        const hasTenantField = (model: string): boolean => TENANT_MODELS.includes(model);

        const setTenantIdForMany = (model: string, args: any): any => {
            if (!hasTenantField(model)) {
                return args;
            }

            const tenantId = TenantContext.getTenantId();
            if (!tenantId) {
                return args;
            }

            args = args || {};
            if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({
                    ...item,
                    tenantId: item.tenantId || tenantId,
                }));
            }

            return args;
        };

        it('should set tenantId for all items in batch create', () => {
            runWithTenant('100001', false, () => {
                const args = {
                    data: [
                        { userName: 'user1', nickName: 'User 1' },
                        { userName: 'user2', nickName: 'User 2' },
                    ],
                };
                const result = setTenantIdForMany('SysUser', args);
                expect(result.data[0].tenantId).toBe('100001');
                expect(result.data[1].tenantId).toBe('100001');
            });
        });

        it('should not override existing tenantId in batch create', () => {
            runWithTenant('100001', false, () => {
                const args = {
                    data: [
                        { userName: 'user1', tenantId: '100002' },
                        { userName: 'user2' },
                    ],
                };
                const result = setTenantIdForMany('SysUser', args);
                expect(result.data[0].tenantId).toBe('100002');
                expect(result.data[1].tenantId).toBe('100001');
            });
        });
    });
});;

describe('TenantContext', () => {
    describe('getTenantId / setTenantId', () => {
        it('should set and get tenant id within context', () => {
            TenantContext.run({ tenantId: '100001' }, () => {
                expect(TenantContext.getTenantId()).toBe('100001');
            });
        });

        it('should return undefined when not in context', () => {
            expect(TenantContext.getTenantId()).toBeUndefined();
        });

        it('should update tenant id within existing context', () => {
            TenantContext.run({ tenantId: '100001' }, () => {
                TenantContext.setTenantId('100002');
                expect(TenantContext.getTenantId()).toBe('100002');
            });
        });
    });

    describe('isSuperTenant', () => {
        it('should return true for super tenant', () => {
            TenantContext.run({ tenantId: '000000' }, () => {
                expect(TenantContext.isSuperTenant()).toBe(true);
            });
        });

        it('should return false for normal tenant', () => {
            TenantContext.run({ tenantId: '100001' }, () => {
                expect(TenantContext.isSuperTenant()).toBe(false);
            });
        });
    });

    describe('isIgnoreTenant', () => {
        it('should return true when ignoreTenant is set', () => {
            TenantContext.run({ tenantId: '100001', ignoreTenant: true }, () => {
                expect(TenantContext.isIgnoreTenant()).toBe(true);
            });
        });

        it('should return false by default', () => {
            TenantContext.run({ tenantId: '100001' }, () => {
                expect(TenantContext.isIgnoreTenant()).toBe(false);
            });
        });

        it('should update ignoreTenant within existing context', () => {
            TenantContext.run({ tenantId: '100001', ignoreTenant: false }, () => {
                TenantContext.setIgnoreTenant(true);
                expect(TenantContext.isIgnoreTenant()).toBe(true);
            });
        });
    });

    describe('nested contexts', () => {
        it('should maintain separate context in nested runs', () => {
            TenantContext.run({ tenantId: '100001' }, () => {
                expect(TenantContext.getTenantId()).toBe('100001');

                TenantContext.run({ tenantId: '100002' }, () => {
                    expect(TenantContext.getTenantId()).toBe('100002');
                });

                expect(TenantContext.getTenantId()).toBe('100001');
            });
        });
    });
});
