import * as echarts from 'echarts/lib/echarts';

import './WordCloudSeries';
import './WordCloudView';

import wordCloudLayoutHelper from './layout';
import type { WordCloudArrayItem, WordCloudDrawnDetail } from './layout';
import {
  findLayoutInstance,
  getLayoutInstance,
  isWordCloudSeriesModel,
  setLayoutInstance
} from './layoutInstances';
import type { WordCloudDataItemOption } from './types';

if (!wordCloudLayoutHelper.isSupported) {
  throw new Error('Sorry your browser not support wordCloud');
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDrawnDetail = (detail: unknown): detail is WordCloudDrawnDetail =>
  isRecord(detail) && 'item' in detail && 'drawn' in detail;

// https://github.com/timdream/wordcloud2.js/blob/c236bee60436e048949f9becc4f0f67bd832dc5c/index.js#L233
function updateCanvasMask(maskCanvas: HTMLCanvasElement) {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }
  const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const newImageData = ctx.createImageData(imageData);

  let toneSum = 0;
  let toneCnt = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    if (alpha > 128) {
      const tone =
        imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
      toneSum += tone;
      ++toneCnt;
    }
  }
  const threshold = toneSum / toneCnt;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const tone =
      imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
    const alpha = imageData.data[i + 3];

    if (alpha < 128 || tone > threshold) {
      // Area not to draw
      newImageData.data[i] = 0;
      newImageData.data[i + 1] = 0;
      newImageData.data[i + 2] = 0;
      newImageData.data[i + 3] = 0;
    } else {
      // Area to draw
      // The color must be same with backgroundColor
      newImageData.data[i] = 255;
      newImageData.data[i + 1] = 255;
      newImageData.data[i + 2] = 255;
      newImageData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(newImageData, 0, 0);
}

echarts.registerLayout(function (ecModel, api) {
  ecModel.eachSeriesByType('wordCloud', function (seriesModel) {
    if (!isWordCloudSeriesModel(seriesModel)) {
      return;
    }
    const gridRect: Rect = echarts.helper.getLayoutRect(
      seriesModel.getBoxLayoutParams(),
      {
        width: api.getWidth(),
        height: api.getHeight()
      }
    );

    const keepAspect = seriesModel.get('keepAspect');
    const maskImage = seriesModel.get('maskImage');
    const ratio = maskImage ? maskImage.width / maskImage.height : 1;
    if (keepAspect) {
      adjustRectAspect(gridRect, ratio);
    }

    const data = seriesModel.getData();

    const canvas = document.createElement('canvas');
    canvas.width = gridRect.width;
    canvas.height = gridRect.height;

    const ctx = canvas.getContext('2d');
    if (maskImage) {
      try {
        if (!ctx) {
          throw new Error('Canvas 2D context is not available.');
        }
        ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
        updateCanvasMask(canvas);
      } catch (e) {
        console.error('Invalid mask image');
        console.error(String(e));
      }
    }

    const sizeRange = seriesModel.get('sizeRange');
    const rotationRange = seriesModel.get('rotationRange');
    const valueExtent = data.getDataExtent('value');

    const DEGREE_TO_RAD = Math.PI / 180;
    const gridSize = seriesModel.get('gridSize');
    wordCloudLayoutHelper(canvas, {
      list: data
        .mapArray('value', function (value, idx): WordCloudArrayItem {
          const itemModel = data.getItemModel<WordCloudDataItemOption>(idx);
          return [
            data.getName(idx),
            Number(
              itemModel.get(['textStyle', 'fontSize'], true) ||
                echarts.number.linearMap(Number(value), valueExtent, sizeRange)
            ),
            idx
          ];
        })
        .sort(function (a, b) {
          // Sort from large to small in case there is no more room for more words
          return b[1] - a[1];
        }),
      fontFamily:
        seriesModel.get(['textStyle', 'fontFamily']) ||
        seriesModel.get(['emphasis', 'textStyle', 'fontFamily']) ||
        ecModel.get('textStyle')?.fontFamily,
      fontWeight:
        seriesModel.get(['textStyle', 'fontWeight']) ||
        seriesModel.get(['emphasis', 'textStyle', 'fontWeight']) ||
        ecModel.get('textStyle')?.fontWeight,

      gridSize: gridSize,

      ellipticity: gridRect.height / gridRect.width,

      minRotation: rotationRange[0] * DEGREE_TO_RAD,
      maxRotation: rotationRange[1] * DEGREE_TO_RAD,

      clearCanvas: !maskImage,

      rotateRatio: 1,

      rotationStep: seriesModel.get('rotationStep') * DEGREE_TO_RAD,

      drawOutOfBound: seriesModel.get('drawOutOfBound'),
      shrinkToFit: seriesModel.get('shrinkToFit'),

      layoutAnimation: seriesModel.get('layoutAnimation'),

      shuffle: false,

      shape: seriesModel.get('shape')
    });

    const wordCloudSeries = seriesModel;
    function onWordCloudDrawn(e: Event) {
      if (!(e instanceof CustomEvent) || !isDrawnDetail(e.detail)) {
        return;
      }
      const item = e.detail.item;
      const drawn = e.detail.drawn;
      if (!drawn) {
        return;
      }
      const ondraw = getLayoutInstance(wordCloudSeries).ondraw;
      if (ondraw && Array.isArray(item)) {
        drawn.gx += gridRect.x / gridSize;
        drawn.gy += gridRect.y / gridSize;
        ondraw(item[0], item[1], Number(item[2]), drawn);
      }
    }

    canvas.addEventListener('wordclouddrawn', onWordCloudDrawn);

    // Dispose previous
    findLayoutInstance(seriesModel)?.dispose();

    setLayoutInstance(seriesModel, {
      ondraw: null,

      dispose: function () {
        canvas.removeEventListener('wordclouddrawn', onWordCloudDrawn);
        // Abort
        canvas.addEventListener('wordclouddrawn', function (e) {
          // Prevent default to cancle the event and stop the loop
          e.preventDefault();
        });
      }
    });
  });
});

echarts.registerPreprocessor(function (option) {
  const rawSeries: unknown = (option || {}).series;
  const seriesList: unknown[] = Array.isArray(rawSeries)
    ? rawSeries
    : rawSeries
      ? [rawSeries]
      : [];

  const compats = [
    'shadowColor',
    'shadowBlur',
    'shadowOffsetX',
    'shadowOffsetY'
  ];

  echarts.util.each(seriesList, function (seriesItem) {
    if (isRecord(seriesItem) && seriesItem.type === 'wordCloud') {
      const textStyle = seriesItem.textStyle || {};

      if (isRecord(textStyle)) {
        compatTextStyle(textStyle.normal);
        compatTextStyle(textStyle.emphasis);
      }
    }
  });

  function compatTextStyle(textStyle: unknown) {
    if (!isRecord(textStyle)) {
      return;
    }
    echarts.util.each(compats, function (key) {
      if (Object.prototype.hasOwnProperty.call(textStyle, key)) {
        textStyle['text' + echarts.format.capitalFirst(key)] = textStyle[key];
      }
    });
  }
});

function adjustRectAspect(gridRect: Rect, aspect: number) {
  // var outerWidth = gridRect.width + gridRect.x * 2;
  // var outerHeight = gridRect.height + gridRect.y * 2;
  const width = gridRect.width;
  const height = gridRect.height;
  if (width > height * aspect) {
    gridRect.x += (width - height * aspect) / 2;
    gridRect.width = height * aspect;
  } else {
    gridRect.y += (height - width / aspect) / 2;
    gridRect.height = width / aspect;
  }
}
