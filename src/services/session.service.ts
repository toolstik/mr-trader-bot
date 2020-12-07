import { Injectable } from "@nestjs/common";
import { Session } from "../types/my-context";
import { FirebaseService } from "./firebase.service";
import { ReferenceService } from "./reference.service";
import _ = require('lodash');

export class SessionEntity {
	[key: string]: Session;
}

@Injectable()
export class SessionService extends ReferenceService<SessionEntity>{

	protected getEntityType() {
		return SessionEntity;
	}

	constructor(firebase: FirebaseService) {
		super(firebase);
	}

	protected getRefName(): string {
		return 'sessions';
	}

	async getSessions() {
		const sessionRefValue = await this.getAll();
		return _.flatten(Object.values(sessionRefValue).map(sv => Object.values(sv)));
	}

	async getAllSessionTickers(){
		const sessions = await this.getSessions();
		return  _.uniq(_.flatten(sessions.map(s => s.subscriptionTickers)));
	}

}
