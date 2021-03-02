import { Module } from '@nestjs/common';

import { AnalysisModule } from '../analysis/analysis.module';
import { AssetModule } from '../asset/asset.module';
import { SessionModule } from '../session/session.module';
import { TemplateModule } from '../template/template.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [AssetModule, SessionModule, AnalysisModule, TemplateModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
