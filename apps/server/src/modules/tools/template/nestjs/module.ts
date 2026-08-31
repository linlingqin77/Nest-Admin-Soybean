import * as Lodash from 'lodash';

/**
 * NestJS Module 模板生成器
 *
 * 生成符合项目规范的 Module 代码
 *
 * Requirements: 13.2
 */
export const moduleTem = (options) => {
  const { BusinessName, businessName, functionName, tableComment } = options;
  const className = Lodash.upperFirst(BusinessName);

  return `import { Module } from '@nestjs/common';
import { ${className}Service } from './${businessName}.service';
import { ${className}Controller } from './${businessName}.controller';

/**
 * ${functionName || tableComment || businessName}模块
 *
 * @description 提供${functionName || tableComment || businessName}的相关功能
 */
@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service],
})
export class ${className}Module {}
`;
};
