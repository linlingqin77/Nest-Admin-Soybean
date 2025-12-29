import { apiTempalte } from './vue/api.js';
import { indexVue } from './vue/indexVue.vue';
import { dialogVue } from './vue/dialogVue.vue';
import { entityTem } from './nestjs/entity';
import { dtoTem } from './nestjs/dto';
import { controllerTem } from './nestjs/controller';
import { moduleTem } from './nestjs/module';
import { serviceTem } from './nestjs/service';

const templates = {
  'tool/template/nestjs/entity.ts.vm': entityTem,
  'tool/template/nestjs/dto.ts.vm': dtoTem,
  'tool/template/nestjs/controller.ts.vm': controllerTem,
  'tool/template/nestjs/service.ts.vm': serviceTem,
  'tool/template/nestjs/module.ts.vm': moduleTem,
  'tool/template/vue/api.js.vm': apiTempalte,
  'tool/template/vue/indexVue.vue.vm': indexVue,
  'tool/template/vue/dialogVue.vue.vm': dialogVue,
};

export const index = (options) => {
  const result = {};
  for (const [path, templateFunc] of Object.entries(templates)) {
    result[path] = templateFunc(options);
  }
  return result;
};
