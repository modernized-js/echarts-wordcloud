import type { SeriesModel } from 'echarts/lib/echarts';
import type { LayoutInstance, WordCloudSeriesModel } from './types';

const layoutInstances = new WeakMap<object, LayoutInstance>();

export const isWordCloudSeriesModel = (
  seriesModel: SeriesModel
): seriesModel is WordCloudSeriesModel => seriesModel.subType === 'wordCloud';

export const findLayoutInstance = (
  seriesModel: WordCloudSeriesModel
): LayoutInstance | undefined => layoutInstances.get(seriesModel);

export const getLayoutInstance = (
  seriesModel: WordCloudSeriesModel
): LayoutInstance => {
  const layoutInstance = layoutInstances.get(seriesModel);
  if (!layoutInstance) {
    throw new Error('wordCloud layout has not run for this series.');
  }
  return layoutInstance;
};

export const setLayoutInstance = (
  seriesModel: WordCloudSeriesModel,
  layoutInstance: LayoutInstance
): void => {
  layoutInstances.set(seriesModel, layoutInstance);
};
