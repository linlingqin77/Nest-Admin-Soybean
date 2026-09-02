import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MailAccountService } from './mail-account.service';
import { CreateMailAccountDto, ListMailAccountDto, UpdateMailAccountDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { MailAccountResponseDto } from './dto';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from 'src/modules/users/user.decorator';

@ApiTags('邮箱账号管理')
@Controller('system/mail/account')
@ApiBearerAuth('Authorization')
export class MailAccountController {
  constructor(private readonly mailAccountService: MailAccountService) {}

  @Api({
    summary: '邮箱账号-创建',
    description: '创建新的邮箱账号',
    body: CreateMailAccountDto,
  })
  @RequirePermission('system:mail:account:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createDto: CreateMailAccountDto, @UserTool() { injectCreate }: UserToolType) {
    return this.mailAccountService.create(injectCreate(createDto));
  }

  @Api({
    summary: '邮箱账号-列表',
    description: '分页查询邮箱账号列表',
    type: MailAccountResponseDto,
  })
  @RequirePermission('system:mail:account:list')
  @Get('/list')
  findAll(@Query() query: ListMailAccountDto) {
    return this.mailAccountService.findAll(query);
  }

  @Api({
    summary: '邮箱账号-启用列表',
    description: '获取所有启用的邮箱账号（用于下拉选择）',
  })
  @RequirePermission('system:mail:account:list')
  @Get('/enabled')
  getEnabledAccounts() {
    return this.mailAccountService.getEnabledAccounts();
  }

  @Api({
    summary: '邮箱账号-详情',
    description: '根据ID获取邮箱账号详情',
    type: MailAccountResponseDto,
    params: [{ name: 'id', description: '账号ID', type: 'number' }],
  })
  @RequirePermission('system:mail:account:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mailAccountService.findOne(+id);
  }

  @Api({
    summary: '邮箱账号-更新',
    description: '修改邮箱账号信息',
    body: UpdateMailAccountDto,
  })
  @RequirePermission('system:mail:account:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateDto: UpdateMailAccountDto, @UserTool() { injectUpdate }: UserToolType) {
    return this.mailAccountService.update(injectUpdate(updateDto));
  }

  @Api({
    summary: '邮箱账号-删除',
    description: '批量删除邮箱账号，多个ID用逗号分隔',
    params: [{ name: 'id', description: '账号ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:mail:account:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const accountIds = ids.split(',').map((id) => +id);
    return this.mailAccountService.remove(accountIds);
  }
}
