import { Injectable } from "@nestjs/common";
import { Session } from "../interfaces/my-context";
import { FirebaseService } from "./firebase.service";
import { ReferenceService } from "./reference.service";
import _ = require('lodash');

export type SessionEntity<C extends string = any> = {
	[key in C]: Session;
}

@Injectable()
export class SessionService extends ReferenceService<SessionEntity>{

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

}
