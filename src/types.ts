import type * as echarts from 'echarts/lib/echarts';
import type { Model, SeriesModel } from 'echarts/lib/echarts';
import type { DrawnWord } from './layout';

type TextStyleModel = Parameters<typeof echarts.helper.createTextStyle>[0];

export type WordCloudTextStyleOption =
  TextStyleModel extends Model<infer Option> ? Option : never;

export type WordCloudShape =
  | 'circle'
  | 'cardioid'
  | 'diamond'
  | 'square'
  | 'triangle-forward'
  | 'triangle'
  | 'triangle-upright'
  | 'pentagon'
  | 'star';

// Nested objects are typed as present because echarts' `Model.get([a, b])`
// cannot address through an optional property; at runtime they may be absent.
interface WordCloudStateOption {
  focus?: 'self' | 'series' | 'none';
  blurScope?: 'coordinateSystem' | 'global' | 'series';
  textStyle: WordCloudTextStyleOption;
}

export interface WordCloudDataItemOption {
  name?: string;
  value?: number | number[];
  textStyle: WordCloudTextStyleOption;
  emphasis: WordCloudStateOption;
  blur: WordCloudStateOption;
}

type BaseSeriesOption = SeriesModel['option'];
type StateAnimationOption = NonNullable<BaseSeriesOption['stateAnimation']>;

// Shape of `seriesModel.option` after echarts merged in `defaultOption`.
export interface WordCloudSeriesModelOption extends BaseSeriesOption {
  type: 'wordCloud';
  maskImage: HTMLImageElement | HTMLCanvasElement | null;
  shape: WordCloudShape;
  keepAspect: boolean;
  left: number | string;
  top: number | string;
  width: number | string;
  height: number | string;
  right?: number | string;
  bottom?: number | string;
  sizeRange: [number, number];
  rotationRange: [number, number];
  rotationStep: number;
  gridSize: number;
  drawOutOfBound: boolean;
  shrinkToFit: boolean;
  layoutAnimation?: boolean;
  textStyle: WordCloudTextStyleOption;
  emphasis: WordCloudStateOption;
  stateAnimation: StateAnimationOption;
  data: WordCloudDataItemOption[];
}

export type WordCloudSeriesModel = SeriesModel<WordCloudSeriesModelOption>;

export type OnWordDraw = (
  text: string,
  size: number,
  dataIdx: number,
  drawn: DrawnWord
) => void;

export interface LayoutInstance {
  ondraw: OnWordDraw | null;
  dispose: () => void;
}
