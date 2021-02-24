import { Module } from "@nestjs/common";
import { DatahubModule } from "../datahub/datahub.module";
import { AssetListService } from "./asset-list.service";

@Module({
	imports: [DatahubModule],
	providers: [AssetListService],
	exports: [AssetListService],
})
export class AssetListModule {

}
