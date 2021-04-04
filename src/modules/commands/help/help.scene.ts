import PromisePool = require('@supercharge/promise-pool/dist');
import _ = require('lodash');
import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { TemplateService } from '../../template/template.service';

@Scene(HelpScene.sceneName)
export class HelpScene {
  static sceneName = 'help';

  constructor(private templateService: TemplateService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();

    const message = this.templateService.apply('help', null);
    await ctx.reply(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
  }
}
