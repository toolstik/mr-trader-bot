import { Module } from "@nestjs/common";
import { DatahubService } from "./datahub.service";

@Module({
	providers: [DatahubService],
	exports: [DatahubService],
})
export class DatahubModule {

}
