import { Module } from '@nestjs/common';

import { AnalysisModule } from '../../analysis/analysis.module';
import { UpdateScene } from './update.scene';
import { UpdateUpdate } from './update.update';

@Module({
  imports: [AnalysisModule],
  providers: [UpdateUpdate, UpdateScene],
  exports: [UpdateUpdate, UpdateScene],
})
export class UpdateModule {}
