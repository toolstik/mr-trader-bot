import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AnalysisService } from '../../analysis/analysis.service';
import { EventEmitterService } from '../../global/event-emitter.service';

@Scene(UpdateScene.sceneName)
export class UpdateScene {
  static sceneName = 'update';

  constructor(
    private analysisService: AnalysisService,
    private eventEmitterService: EventEmitterService,
  ) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    await this.analysisService.updateAssetStatus('CAG');
    await this.eventEmitterService.waitAll();
  }
}
