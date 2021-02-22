import { Module } from "@nestjs/common";
import { FirebaseModule } from "../firebase/firebase.module";
import { SessionService } from "./session.service";

@Module({
	imports: [FirebaseModule],
	providers: [SessionService],
	exports: [SessionService],
})
export class SessionModule {

}
