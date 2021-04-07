import { Module } from '@nestjs/common';

import { TemplateModule } from '../../template/template.module';
import { MenuMiddleware } from './menu.middleware';
import { MenuScene } from './menu.scene';
import { MenuUpdate } from './menu.update';

@Module({
  imports: [TemplateModule],
  providers: [MenuUpdate, MenuScene, MenuMiddleware],
  exports: [MenuUpdate, MenuScene, MenuMiddleware],
})
export class MenuModule {}
