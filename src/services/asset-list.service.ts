import { DatahubService } from './datahub.service';
import { ListKey } from '../types/commons';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetListService {

	constructor(
		private datahubService: DatahubService
	) {

	}

	async getListTickers(key: ListKey) {
		switch (key) {
			case 'nasdaq':
				return await this.datahubService.getNasdaqList().then(t => t.map(i => i.Symbol));
			case 'snp500':
				return await this.datahubService.getSnP500List().then(t => t.map(i => i.Symbol));
		}

		return [];
	}

}