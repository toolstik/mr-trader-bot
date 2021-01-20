import { DatahubService } from './datahub.service';
import { ListKey, KnownListKeys } from '../types/commons';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetListService {

	constructor(
		private datahubService: DatahubService
	) {

	}

	isKnownList(key: string): key is ListKey {
		return KnownListKeys.includes(key?.toLowerCase() as ListKey);
	}

	async getListTickers(key: ListKey) {

		if(!this.isKnownList(key)){
			return [];
		}

		switch (key) {
			case 'nasdaq':
				return await this.datahubService.getNasdaqList().then(t => t.map(i => i.Symbol));
			case 'snp500':
				return await this.datahubService.getSnP500List().then(t => t.map(i => i.Symbol));
		}

		return [];
	}

}
