import { Injectable } from '@nestjs/common';
import Axios from 'axios';

export type NasdaqListItem = {
  Symbol: string;
};

export type SnP500ListItem = {
  Symbol: string;
};

@Injectable()
export class DatahubService {
  async getNasdaqList() {
    const x = await Axios.get<NasdaqListItem[]>(
      `https://pkgstore.datahub.io/core/nasdaq-listings/nasdaq-listed-symbols_json/data/5c10087ff8d283899b99f1c126361fa7/nasdaq-listed-symbols_json.json`,
    ).then(t => t.data.map(i => i.Symbol));
    return x;
  }

  async getSnP500List() {
    const x = await Axios.get<SnP500ListItem[]>(
      `https://pkgstore.datahub.io/core/s-and-p-500-companies/constituents_json/data/8fd832966a715a70cb9cf3f723498e3b/constituents_json.json`,
    ).then(t => t.data.map(i => i.Symbol));
    return x;
  }
}
