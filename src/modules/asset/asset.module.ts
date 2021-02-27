import { Module } from '@nestjs/common';

import { FinvizModule } from '../finviz/finviz.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { SessionModule } from '../session/session.module';
import { YahooModule } from '../yahoo/yahoo.module';
import { AssetService } from './asset.service';

@Module({
  imports: [FirebaseModule, SessionModule, FinvizModule, YahooModule],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
