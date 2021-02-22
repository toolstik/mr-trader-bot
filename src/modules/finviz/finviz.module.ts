import { Module } from "@nestjs/common";
import { FinvizService } from "./finviz.service";

@Module({
	providers: [FinvizService],
	exports: [FinvizService],
})
export class FinvizModule {

}
