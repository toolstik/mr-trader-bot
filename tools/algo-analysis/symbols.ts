/* eslint-disable @typescript-eslint/no-var-requires */
import { SnP500ListItem } from '../../src/modules/datahub/datahub.service';

function snpData() {
  const result = require('./snp-list.json') as SnP500ListItem[];
  return result;
}

export function snpSymbols() {
  return snpData()
    .map(i => i.Symbol)
    .sort();
}

export function customSymbols1() {
  return [
    'AFKS.ME',
    'AFLT.ME',
    'ALRS.ME',
    'CHMF.ME',
    'ENRU.ME',
    'FEES.ME',
    'FIVE.ME',
    'GAZP.ME',
    'GMKN.ME',
    'HYDR.ME',
    'IRAO.ME',
    'LKOH.ME',
    'MAGN.ME',
    'MAIL.ME',
    'MGNT.ME',
    'MOEX.ME',
    'MTSS.ME',
    'MVID.ME',
    'NLMK.ME',
    'NVTK.ME',
    'PLZL.ME',
    'POLY.ME',
    'ROSN.ME',
    'RTKM.ME',
    'SBER.ME',
    'SBERP.ME',
    'SIBN.ME',
    'SNGSP.ME',
    'TATN.ME',
    'TATNP.ME',
    'TCSG.ME',
    'TRNFP.ME',
    'UPRO.ME',
    'VTBR.ME',
    'YNDX.ME',
  ];
}

export function customSymbols2() {
  return [
    'ABNB',
    'ATUS',
    'BATRA',
    'CABO',
    'DASH',
    'FWONA',
    'IAC',
    'LBRDA',
    'LBRDK',
    'LSXMA',
    'MTCH',
    'PINS',
    'ROKU',
    'SIRI',
    'SKLZ',
    'SNAP',
    'TWLO',
    'WMG',
    'Z',
    'ZG',
    'ZM',
    'ZNGA',
  ];
}

export function customSymbols1plus2() {
  return [...customSymbols1(), ...customSymbols2()];
}
