import { Donchian, FractalBounds } from '../modules/analysis/indicators';
import { PriceModule } from '../modules/yahoo/yahoo.service';

type Bound = { value: number } & (
  | {
      type: 'fractal';
    }
  | {
      type: 'donchian';
      periods: number;
    }
);

export type Bounds = {
  top: Bound;
  bottom: Bound;
  stopTop: Bound;
  stopBottom: Bound;
};

export type MarketData = {
  price: number;
  date: Date;
  asset: PriceModule;
  donchianOuter: Donchian;
  donchianInner: Donchian;
  fractals: FractalBounds;
  bounds: Bounds;
};
