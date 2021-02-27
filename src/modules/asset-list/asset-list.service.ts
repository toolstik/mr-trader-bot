import { Injectable } from '@nestjs/common';

import { KnownListKeys, ListKey } from '../../types/commons';
import { DatahubService } from '../datahub/datahub.service';

@Injectable()
export class AssetListService {
  constructor(private datahubService: DatahubService) {}

  isKnownList(key: string): key is ListKey {
    return KnownListKeys.includes(key?.toLowerCase() as ListKey);
  }

  async getListTickers(key: ListKey) {
    if (!this.isKnownList(key)) {
      return [];
    }

    switch (key) {
      case 'nasdaq':
        return await this.datahubService.getNasdaqList();
      case 'snp500':
        return await this.datahubService.getSnP500List().then(result => {
          const map: Record<string, string> = {
            ETFC: 'ETFCX',
          };

          return result.map(s => {
            if (map[s]) {
              return map[s];
            }

            return s.replace('.', '-');
          });
        });
    }

    return [];
  }
}
