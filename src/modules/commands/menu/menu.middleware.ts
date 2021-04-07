import { Injectable } from '@nestjs/common';
import { MiddlewareObj } from 'telegraf/typings/middleware';
import { MenuMiddleware as InlineMenuMiddleware } from 'telegraf-inline-menu/dist/source';

import { MyContext } from '../../../types/my-context';
import { notificationSettingsMenu } from './menus/notification-settings.menu';

@Injectable()
export class MenuMiddleware implements MiddlewareObj<MyContext> {
  private wrapper: InlineMenuMiddleware<MyContext>;

  constructor() {
    const menu = this.getMenu();
    this.wrapper = new InlineMenuMiddleware('/', menu);
  }

  middleware() {
    return this.wrapper.middleware();
  }

  reply(context: MyContext) {
    return this.wrapper.replyToContext(context);
  }

  private getMenu() {
    const mainMenu = notificationSettingsMenu;

    return mainMenu;
  }
}
