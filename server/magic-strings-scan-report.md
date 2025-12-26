# Magic Strings Scan Report

## Overview
This report identifies magic strings in the codebase that should be replaced with enums and constants.

## 1. Status Field Magic Strings ("0", "1")

### Files with status magic strings:

1. **server/src/module/system/dept/dept.controller.ts**
   - Line 39: API documentation enum: `['0', '1']`
   - Should use: Status enum values

2. **server/src/module/system/dict/dict.service.ts**
   - Line 95: `status: createDictDataDto.status ?? '0'`
   - Should use: `Status.NORMAL`

3. **server/src/module/system/user/user.service.ts**
   - Line 203: `status: userPayload.status ?? '0'`
   - Should use: `Status.NORMAL`

4. **server/src/module/system/post/post.service.ts**
   - Line 29: `status: createPostDto.status ?? '0'`
   - Should use: `Status.NORMAL`

5. **server/src/module/monitor/job/job.service.ts**
   - Line 160: `if (status === '0')`
   - Should use: `Status.NORMAL`

6. **server/src/module/monitor/job/task.service.ts**
   - Line 74: `let status = '0'`
   - Line 95: `status = '1'`
   - Should use: `Status.NORMAL` and `Status.DISABLED`

## 2. DelFlag Field Magic Strings ("0", "2")

### Files with delFlag magic strings:

1. **server/src/common/repository/soft-delete.repository.ts**
   - Line 56: `where.delFlag = '0'`
   - Line 71: `where.delFlag = '0'`
   - Line 90: `where.delFlag = '0'`
   - Should use: `DelFlag.NORMAL`

## 3. Error Message Magic Strings

### Common error messages found:

1. **"用户不存在" (User not found)**
   - server/src/module/system/user/services/user-auth.service.ts (Line 243)
   - server/src/module/system/user/services/user-role.service.ts (Line 88)
   - server/src/common/response/response.interface.ts (Line 120)

2. **"密码错误" (Password error)**
   - server/src/common/response/response.interface.ts (Line 115, 124)
   - server/src/module/system/user/services/user-profile.service.ts (Line 61)
   - server/src/module/system/user/services/user-auth.service.ts (Line 48)
   - server/src/module/monitor/cache/cache.service.ts (Line 51)

3. **"权限不足" (Permission denied)**
   - server/src/common/exceptions/business.exception.ts (Line 111)
   - server/src/common/filters/global-exception.filter.ts (Line 73)
   - server/src/common/response/response.interface.ts (Line 117)

4. **"操作成功" (Operation successful)**
   - server/src/common/decorators/api.decorator.ts (Line 475, 490)
   - server/src/common/response/result.ts (Line 24)
   - server/src/common/response/response.interface.ts (Line 80)
   - server/src/module/main/main.controller.ts (Line 79, 110, 124)
   - server/src/module/system/tool/template/vue/dialogVue.vue.ts (Line 147)

5. **"操作失败" (Operation failed)**
   - server/src/common/constant/error.constants.ts (Line 53)
   - server/src/common/response/result.ts (Line 59, 109)

## 4. Configuration-Related Magic Strings

### Configuration keys found:

1. **server/src/module/main/main.controller.ts**
   - Line 78: `'sys.account.registerUser'`
   - Should use: Config constant

## Summary

### Total Magic Strings Found:
- **Status field strings**: 7 occurrences
- **DelFlag field strings**: 3 occurrences
- **Error message strings**: 20+ occurrences
- **Config key strings**: 1+ occurrences

### Recommended Actions:
1. Replace all status field strings with `Status` enum from Prisma
2. Replace all delFlag field strings with `DelFlag` enum from Prisma
3. Use existing error constants from `server/src/common/constant/error.constants.ts`
4. Create config key constants for configuration-related strings
5. Update API documentation to reference enum values instead of string literals

### Notes:
- Error constants already exist in `server/src/common/constant/error.constants.ts`
- Response messages are already centralized in `server/src/common/response/response.interface.ts`
- Some error messages are used in multiple places and should reference the centralized constants
