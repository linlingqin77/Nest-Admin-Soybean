import * as Lodash from 'lodash';
import { assertIdentifier, escapeMultilineText } from '../utils/sanitize';

interface ModuleOptions {
  BusinessName: string;
  businessName: string;
  functionName?: string;
  tableComment?: string;
}

/**
 * NestJS Module 模板生成器
 *
 * 生成符合项目规范的 Module 代码
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过
 * escapeMultilineText / assertIdentifier 做严格转义或校验，
 * 防止函数名/表注释中含特殊字符破坏生成的 TS 代码。
 *
 * Requirements: 13.2
 */
export const moduleTem = (options: ModuleOptions) => {
  const { BusinessName, businessName, functionName, tableComment } = options;

  // 安全：businessName / BusinessName 必须为合法标识符
  assertIdentifier(businessName, 'businessName');
  assertIdentifier(BusinessName, 'BusinessName');

  // 安全：functionName / tableComment 转义后用于注释
  const safeFunctionName = escapeMultilineText(functionName ?? '');
  const safeTableComment = escapeMultilineText(tableComment ?? '');
  const safeBusinessName = escapeMultilineText(businessName);

  const className = Lodash.upperFirst(BusinessName);

  return `import { Module } from '@nestjs/common';
import { ${className}Service } from './${businessName}.service';
import { ${className}Controller } from './${businessName}.controller';

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName}模块
 *
 * @description 提供${safeFunctionName || safeTableComment || safeBusinessName}的相关功能
 */
@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service],
})
export class ${className}Module {}
`;
};
