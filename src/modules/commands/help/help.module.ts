import { Module } from '@nestjs/common';

import { TemplateModule } from '../../template/template.module';
import { HelpScene } from './help.scene';
import { HelpUpdate } from './help.update';

@Module({
  imports: [TemplateModule],
  providers: [HelpUpdate, HelpScene],
  exports: [HelpUpdate, HelpScene],
})
export class HelpModule {}
