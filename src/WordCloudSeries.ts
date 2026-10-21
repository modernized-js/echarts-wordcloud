import * as echarts from 'echarts/lib/echarts';
import type { Model } from 'echarts/lib/echarts';
import type {
  WordCloudSeriesModel,
  WordCloudSeriesModelOption,
  WordCloudTextStyleOption
} from './types';

echarts.extendSeriesModel({
  type: 'series.wordCloud',

  visualStyleAccessPath: 'textStyle',
  visualStyleMapper: function (model: Model<WordCloudTextStyleOption>) {
    return {
      fill: model.get('color')
    };
  },
  visualDrawType: 'fill',

  optionUpdated: function (this: WordCloudSeriesModel) {
    const option = this.option;
    option.gridSize = Math.max(Math.floor(option.gridSize), 4);
  },

  getInitialData: function (
    this: WordCloudSeriesModel,
    option: WordCloudSeriesModelOption
  ) {
    const dimensions = echarts.helper.createDimensions(option.data, {
      coordDimensions: ['value']
    });
    const list = new echarts.List(dimensions, this);
    list.initData(option.data);
    return list;
  },

  // Most of options are from https://github.com/timdream/wordcloud2.js/blob/gh-pages/API.md
  defaultOption: {
    maskImage: null,

    // Shape can be 'circle', 'cardioid', 'diamond', 'triangle-forward', 'triangle', 'pentagon', 'star'
    shape: 'circle',
    keepAspect: false,

    left: 'center',

    top: 'center',

    width: '70%',

    height: '80%',

    sizeRange: [12, 60],

    rotationRange: [-90, 90],

    rotationStep: 45,

    gridSize: 8,

    drawOutOfBound: false,
    shrinkToFit: false,

    textStyle: {
      fontWeight: 'normal'
    }
  }
});
