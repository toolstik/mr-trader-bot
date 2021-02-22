import { Injectable } from "@nestjs/common";

type Environment = {
	name: string,
	bot_token: string;
}

@Injectable()
export class ConfigService {

	private readonly env: Environment;

	constructor() {
		this.env = require('../../../env.json');
	}

	getEnv(){
		return this.env;
	}

}
