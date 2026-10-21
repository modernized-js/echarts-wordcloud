/*!
 * wordcloud2.js
 * http://timdream.org/wordcloud2.js/
 *
 * Copyright 2011 - 2019 Tim Guan-tin Chien and contributors.
 * Released under the MIT license
 */

type ImmediateFunction = (callback: () => void) => number | undefined;
type ClearImmediateFunction = (id: number | undefined) => void;

declare global {
  interface Window {
    setImmediate?: ImmediateFunction;
    msSetImmediate?: ImmediateFunction;
    webkitSetImmediate?: ImmediateFunction;
    mozSetImmediate?: ImmediateFunction;
    oSetImmediate?: ImmediateFunction;
    clearImmediate?: ClearImmediateFunction;
    msClearImmediate?: ClearImmediateFunction;
    webkitClearImmediate?: ClearImmediateFunction;
    mozClearImmediate?: ClearImmediateFunction;
    oClearImmediate?: ClearImmediateFunction;
  }
}

export type WordCloudArrayItem = [string, number, ...unknown[]];

export interface WordCloudObjectItem {
  word: string;
  weight: number;
  attributes?: Record<string, string>;
}

export type WordCloudListEntry = WordCloudArrayItem | WordCloudObjectItem;

type WordCallback<Result> = (
  word: string,
  weight: number,
  fontSize: number,
  extraData: unknown[]
) => Result;

type ColorCallback = (
  word: string,
  weight: number,
  fontSize: number,
  distance: number,
  theta: number,
  extraData: unknown[]
) => string;

type ShapeFunction = (theta: number) => number;

export interface WordDimension {
  x: number;
  y: number;
  w: number;
  h: number;
}

type HoverCallback = (
  item: WordCloudListEntry | undefined,
  dimension: WordDimension | undefined,
  evt: MouseEvent | TouchEvent
) => void;

type ClickCallback = (
  item: WordCloudListEntry,
  dimension: WordDimension | undefined,
  evt: MouseEvent | TouchEvent
) => void;

export interface WordCloudOptions {
  list: WordCloudListEntry[];
  fontFamily: string;
  fontWeight: string | number | WordCallback<string | number>;
  color: string | ColorCallback;
  minSize: number;
  weightFactor: number | ((weight: number) => number);
  clearCanvas: boolean;
  backgroundColor: string;
  gridSize: number;
  drawOutOfBound: boolean;
  shrinkToFit: boolean;
  origin: [number, number] | null;
  drawMask: boolean;
  maskColor: string;
  maskGapWidth: number;
  layoutAnimation: boolean;
  wait: number;
  abortThreshold: number;
  abort: () => void;
  minRotation: number;
  maxRotation: number;
  rotationStep: number;
  shuffle: boolean;
  rotateRatio: number;
  shape: string | ShapeFunction;
  ellipticity: number;
  classes: string | WordCallback<string | null> | null;
  hover: HoverCallback | null;
  click: ClickCallback | null;
}

export interface WordTextInfo {
  mu: number;
  occupied: [number, number][];
  bounds: [number, number, number, number];
  gw: number;
  gh: number;
  fillTextOffsetX: number;
  fillTextOffsetY: number;
  fillTextWidth: number;
  fillTextHeight: number;
  fontSize: number;
}

export interface DrawnWord {
  gx: number;
  gy: number;
  rot: number;
  info: WordTextInfo;
}

export interface WordCloudDrawnDetail {
  item: WordCloudListEntry;
  drawn: DrawnWord | false | null;
}

interface InfoGridCell {
  item: WordCloudListEntry;
  dimension: WordDimension | undefined;
}

type GridPoint = [number, number, number];

const isCanvasElement = (el: HTMLElement): el is HTMLCanvasElement =>
  'getContext' in el && Boolean(el.getContext);

const get2dContext = (
  canvas: HTMLCanvasElement,
  settings?: CanvasRenderingContext2DSettings
): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d', settings);
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }
  return ctx;
};

// setImmediate
function setupSetZeroTimeout(): ImmediateFunction | null {
  if (
    typeof window.postMessage !== 'function' ||
    typeof window.addEventListener !== 'function'
  ) {
    return null;
  }

  const callbacks: ((() => void) | undefined)[] = [undefined];
  const message = 'zero-timeout-message';

  // Like setTimeout, but only takes a function argument.  There's
  // no time argument (always zero) and no arguments (you have to
  // use a closure).
  const setZeroTimeout = function setZeroTimeout(callback: () => void) {
    const id = callbacks.length;
    callbacks.push(callback);
    window.postMessage(message + id.toString(36), '*');

    return id;
  };

  window.addEventListener(
    'message',
    function setZeroTimeoutMessage(evt: MessageEvent<unknown>) {
      // Skipping checking event source, retarded IE confused this window
      // object with another in the presence of iframe
      if (
        typeof evt.data !== 'string' ||
        evt.data.substr(0, message.length) !== message /* ||
            evt.source !== window */
      ) {
        return;
      }

      evt.stopImmediatePropagation();

      const id = parseInt(evt.data.substr(message.length), 36);
      const callback = callbacks[id];
      if (!callback) {
        return;
      }

      callback();
      callbacks[id] = undefined;
    },
    true
  );

  /* specify clearImmediate() here since we need the scope */
  window.clearImmediate = function clearZeroTimeout(id) {
    if (id === undefined || !callbacks[id]) {
      return;
    }

    callbacks[id] = undefined;
  };

  return setZeroTimeout;
}

const setImmediateFallback: ImmediateFunction = function setImmediateFallback(
  fn
) {
  window.setTimeout(fn, 0);
  return undefined;
};

const clearImmediateFallback: ClearImmediateFunction =
  function clearImmediateFallback(timer) {
    window.clearTimeout(timer);
  };

if (!window.setImmediate) {
  window.setImmediate = (function setupSetImmediate() {
    return (
      window.msSetImmediate ||
      window.webkitSetImmediate ||
      window.mozSetImmediate ||
      window.oSetImmediate ||
      setupSetZeroTimeout() ||
      // fallback
      setImmediateFallback
    );
  })();
}

if (!window.clearImmediate) {
  window.clearImmediate = (function setupClearImmediate() {
    return (
      window.msClearImmediate ||
      window.webkitClearImmediate ||
      window.mozClearImmediate ||
      window.oClearImmediate ||
      // "clearZeroTimeout" is implement on the previous block ||
      // fallback
      clearImmediateFallback
    );
  })();
}

// Check if WordCloud can run on this browser
const isSupported = (function isSupported() {
  const canvas = document.createElement('canvas');
  if (!canvas || typeof canvas.getContext !== 'function') {
    return false;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }
  if (typeof ctx.getImageData !== 'function') {
    return false;
  }
  if (typeof ctx.fillText !== 'function') {
    return false;
  }

  if (typeof Array.prototype.some !== 'function') {
    return false;
  }
  if (typeof Array.prototype.push !== 'function') {
    return false;
  }

  return true;
})();

// Find out if the browser impose minium font size by
// drawing small texts on a canvas and measure it's width.
const minFontSize = (function getMinFontSize(): number | undefined {
  if (!isSupported) {
    return;
  }

  const ctx = get2dContext(document.createElement('canvas'));

  // start from 20
  let size = 20;

  // two sizes to measure
  let hanWidth: number | undefined, mWidth: number | undefined;

  while (size) {
    ctx.font = size.toString(10) + 'px sans-serif';
    if (
      ctx.measureText('Ｗ').width === hanWidth &&
      ctx.measureText('m').width === mWidth
    ) {
      return size + 1;
    }

    hanWidth = ctx.measureText('Ｗ').width;
    mWidth = ctx.measureText('m').width;

    size--;
  }

  return 0;
})();

const getItemExtraData = function (item: WordCloudListEntry): unknown[] {
  if (Array.isArray(item)) {
    const itemCopy: unknown[] = item.slice();
    // remove data we already have (word and weight)
    itemCopy.splice(0, 2);
    return itemCopy;
  } else {
    return [];
  }
};

// Based on http://jsfromhell.com/array/shuffle
const shuffleArray = function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length; i;) {
    const j = Math.floor(Math.random() * i);
    const x = arr[--i];
    arr[i] = arr[j];
    arr[j] = x;
  }
  return arr;
};

const resolveElement = function (el: HTMLElement | string): HTMLElement {
  if (typeof el === 'string') {
    const found = document.getElementById(el);
    if (!found) {
      throw new Error('The element id specified is not found.');
    }
    return found;
  } else if (!el.tagName && typeof el.appendChild !== 'function') {
    throw new Error('You must pass valid HTML elements, or ID of the element.');
  }
  return el;
};

const settingsDefaults = (): WordCloudOptions => ({
  list: [],
  fontFamily:
    '"Trebuchet MS", "Heiti TC", "微軟正黑體", ' +
    '"Arial Unicode MS", "Droid Fallback Sans", sans-serif',
  fontWeight: 'normal',
  color: 'random-dark',
  minSize: 0, // 0 to disable
  weightFactor: 1,
  clearCanvas: true,
  backgroundColor: '#fff', // opaque white = rgba(255, 255, 255, 1)

  gridSize: 8,
  drawOutOfBound: false,
  shrinkToFit: false,
  origin: null,

  drawMask: false,
  maskColor: 'rgba(255,0,0,0.3)',
  maskGapWidth: 0.3,

  layoutAnimation: true,

  wait: 0,
  abortThreshold: 0, // disabled
  abort: function noop() {},

  minRotation: -Math.PI / 2,
  maxRotation: Math.PI / 2,
  rotationStep: 0.1,

  shuffle: true,
  rotateRatio: 0.1,

  shape: 'circle',
  ellipticity: 0.65,

  classes: null,

  hover: null,
  click: null
});

function toShapeFunction(shape: string): ShapeFunction | 'circle' {
  switch (shape) {
    case 'circle':
    /* falls through */
    default:
      // 'circle' is the default and a shortcut in the code loop.
      return 'circle';

    case 'cardioid':
      return function shapeCardioid(theta) {
        return 1 - Math.sin(theta);
      };

    /*
      To work out an X-gon, one has to calculate "m",
      where 1/(cos(2*PI/X)+m*sin(2*PI/X)) = 1/(cos(0)+m*sin(0))
      http://www.wolframalpha.com/input/?i=1%2F%28cos%282*PI%2FX%29%2Bm*sin%28
      2*PI%2FX%29%29+%3D+1%2F%28cos%280%29%2Bm*sin%280%29%29
      Copy the solution into polar equation r = 1/(cos(t') + m*sin(t'))
      where t' equals to mod(t, 2PI/X);
      */

    case 'diamond':
      // http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+
      // %28t%2C+PI%2F2%29%29%2Bsin%28mod+%28t%2C+PI%2F2%29%29%29%2C+t+%3D
      // +0+..+2*PI
      return function shapeSquare(theta) {
        const thetaPrime = theta % ((2 * Math.PI) / 4);
        return 1 / (Math.cos(thetaPrime) + Math.sin(thetaPrime));
      };

    case 'square':
      // http://www.wolframalpha.com/input/?i=plot+r+%3D+min(1%2Fabs(cos(t
      // )),1%2Fabs(sin(t)))),+t+%3D+0+..+2*PI
      return function shapeSquare(theta) {
        return Math.min(
          1 / Math.abs(Math.cos(theta)),
          1 / Math.abs(Math.sin(theta))
        );
      };

    case 'triangle-forward':
      // http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+
      // %28t%2C+2*PI%2F3%29%29%2Bsqrt%283%29sin%28mod+%28t%2C+2*PI%2F3%29
      // %29%29%2C+t+%3D+0+..+2*PI
      return function shapeTriangle(theta) {
        const thetaPrime = theta % ((2 * Math.PI) / 3);
        return 1 / (Math.cos(thetaPrime) + Math.sqrt(3) * Math.sin(thetaPrime));
      };

    case 'triangle':
    case 'triangle-upright':
      return function shapeTriangle(theta) {
        const thetaPrime = (theta + (Math.PI * 3) / 2) % ((2 * Math.PI) / 3);
        return 1 / (Math.cos(thetaPrime) + Math.sqrt(3) * Math.sin(thetaPrime));
      };

    case 'pentagon':
      return function shapePentagon(theta) {
        const thetaPrime = (theta + 0.955) % ((2 * Math.PI) / 5);
        return 1 / (Math.cos(thetaPrime) + 0.726543 * Math.sin(thetaPrime));
      };

    case 'star':
      return function shapeStar(theta) {
        const thetaPrime = (theta + 0.955) % ((2 * Math.PI) / 10);
        if (((theta + 0.955) % ((2 * Math.PI) / 5)) - (2 * Math.PI) / 10 >= 0) {
          return (
            1 /
            (Math.cos((2 * Math.PI) / 10 - thetaPrime) +
              3.07768 * Math.sin((2 * Math.PI) / 10 - thetaPrime))
          );
        } else {
          return 1 / (Math.cos(thetaPrime) + 3.07768 * Math.sin(thetaPrime));
        }
      };
  }
}

const timer: Record<number, number | undefined> = {};

type LoopingFunction = (
  callback: () => void,
  wait: number
) => number | undefined;
type StoppingFunction = (id: number | undefined) => void;

function WordCloud(
  elementOrElements: HTMLElement | string | (HTMLElement | string)[],
  options?: Partial<WordCloudOptions>
): void {
  if (!isSupported) {
    return;
  }

  const timerId = Math.floor(Math.random() * Date.now());

  const elements = (
    Array.isArray(elementOrElements) ? elementOrElements : [elementOrElements]
  ).map(resolveElement);

  /* Default values to be overwritten by options object */
  const settings: WordCloudOptions = { ...settingsDefaults(), ...options };

  /* Convert weightFactor into a function */
  const configuredWeightFactor = settings.weightFactor;
  const weightFactor =
    typeof configuredWeightFactor === 'function'
      ? configuredWeightFactor
      : function weightFactor(pt: number) {
          return pt * configuredWeightFactor; // in px
        };

  /* Convert shape into a function */
  const shape =
    typeof settings.shape === 'function'
      ? settings.shape
      : toShapeFunction(settings.shape);

  /* Make sure gridSize is a whole number and is not smaller than 4px */
  settings.gridSize = Math.max(Math.floor(settings.gridSize), 4);

  /* shorthand */
  const g = settings.gridSize;
  const maskRectWidth = g - settings.maskGapWidth;

  /* normalize rotation settings */
  const rotationRange = Math.abs(settings.maxRotation - settings.minRotation);
  const minRotation = Math.min(settings.maxRotation, settings.minRotation);
  const rotationStep = settings.rotationStep;

  /* information/object available to all functions, set when start() */
  let grid: boolean[][] = [], // 2d array containing filling information
    ngx = 0,
    ngy = 0, // width and height of the grid
    center: [number, number] = [0, 0], // position of the center of the cloud
    maxRadius = 0;

  /* timestamp for measuring each putWord() action */
  let escapeTime = 0;

  /* function for getting the color of the text */
  function randomHslColor(min: number, max: number) {
    return (
      'hsl(' +
      (Math.random() * 360).toFixed() +
      ',' +
      (Math.random() * 30 + 70).toFixed() +
      '%,' +
      (Math.random() * (max - min) + min).toFixed() +
      '%)'
    );
  }
  const configuredColor = settings.color;
  const getTextColor: ColorCallback = (function () {
    switch (configuredColor) {
      case 'random-dark':
        return function getRandomDarkColor() {
          return randomHslColor(10, 50);
        };

      case 'random-light':
        return function getRandomLightColor() {
          return randomHslColor(50, 90);
        };

      default:
        if (typeof configuredColor === 'function') {
          return configuredColor;
        }
        return function fixedColor() {
          return configuredColor;
        };
    }
  })();

  /* function for getting the font-weight of the text */
  const configuredFontWeight = settings.fontWeight;
  const getTextFontWeight: WordCallback<string | number> =
    typeof configuredFontWeight === 'function'
      ? configuredFontWeight
      : function fixedFontWeight() {
          return configuredFontWeight;
        };

  /* function for getting the classes of the text */
  const configuredClasses = settings.classes;
  const getTextClasses: WordCallback<string | null> =
    typeof configuredClasses === 'function'
      ? configuredClasses
      : function fixedClasses() {
          return configuredClasses;
        };

  /* Interactive */
  let interactive = false;
  const infoGrid: (InfoGridCell | undefined)[][] = [];
  let hovered: InfoGridCell | null | undefined;

  const getInfoGridFromMouseTouchEvent =
    function getInfoGridFromMouseTouchEvent(
      evt: MouseEvent | TouchEvent
    ): InfoGridCell | null | undefined {
      const target = evt.currentTarget;
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      const rect = target.getBoundingClientRect();
      // A non-canvas target has no width/height, so the ratio falls back to 1.
      const targetWidth = isCanvasElement(target) ? target.width : NaN;
      const targetHeight = isCanvasElement(target) ? target.height : NaN;
      let clientX: number;
      let clientY: number;
      /** Detect if touches are available */
      if ('touches' in evt) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
      } else {
        clientX = evt.clientX;
        clientY = evt.clientY;
      }
      const eventX = clientX - rect.left;
      const eventY = clientY - rect.top;

      const x = Math.floor((eventX * (targetWidth / rect.width || 1)) / g);
      const y = Math.floor((eventY * (targetHeight / rect.height || 1)) / g);

      if (!infoGrid[x]) {
        return null;
      }

      return infoGrid[x][y];
    };

  const wordcloudhover = function wordcloudhover(evt: MouseEvent) {
    const info = getInfoGridFromMouseTouchEvent(evt);

    if (hovered === info) {
      return;
    }

    hovered = info;
    if (!info) {
      settings.hover?.(undefined, undefined, evt);

      return;
    }

    settings.hover?.(info.item, info.dimension, evt);
  };

  const wordcloudclick = function wordcloudclick(evt: MouseEvent | TouchEvent) {
    const info = getInfoGridFromMouseTouchEvent(evt);
    if (!info) {
      return;
    }

    settings.click?.(info.item, info.dimension, evt);
    evt.preventDefault();
  };

  /* Get points on the grid for a given radius away from the center */
  const pointsAtRadius: GridPoint[][] = [];
  const getPointsAtRadius = function getPointsAtRadius(
    radius: number
  ): GridPoint[] {
    if (pointsAtRadius[radius]) {
      return pointsAtRadius[radius];
    }

    // Look for these number of points on each radius
    const T = radius * 8;

    // Getting all the points at this radius
    let t = T;
    const points: GridPoint[] = [];

    if (radius === 0) {
      points.push([center[0], center[1], 0]);
    }

    while (t--) {
      // distort the radius to put the cloud in shape
      let rx = 1;
      if (shape !== 'circle') {
        rx = shape((t / T) * 2 * Math.PI); // 0 to 1
      }

      // Push [x, y, t]; t is used solely for getTextColor()
      points.push([
        center[0] + radius * rx * Math.cos((-t / T) * 2 * Math.PI),
        center[1] +
          radius * rx * Math.sin((-t / T) * 2 * Math.PI) * settings.ellipticity,
        (t / T) * 2 * Math.PI
      ]);
    }

    pointsAtRadius[radius] = points;
    return points;
  };

  /* Return true if we had spent too much time */
  const exceedTime = function exceedTime() {
    return (
      settings.abortThreshold > 0 &&
      new Date().getTime() - escapeTime > settings.abortThreshold
    );
  };

  /* Get the deg of rotation according to settings, and luck. */
  const getRotateDeg = function getRotateDeg() {
    if (settings.rotateRatio === 0) {
      return 0;
    }

    if (Math.random() > settings.rotateRatio) {
      return 0;
    }

    if (rotationRange === 0) {
      return minRotation;
    }

    return (
      minRotation +
      Math.round((Math.random() * rotationRange) / rotationStep) * rotationStep
    );
  };

  const getTextInfo = function getTextInfo(
    word: string,
    weight: number,
    rotateDeg: number,
    extraDataArray: unknown[]
  ): WordTextInfo | false {
    // calculate the acutal font size
    // fontSize === 0 means weightFactor function wants the text skipped,
    // and size < minSize means we cannot draw the text.
    const debug = false;
    const fontSize = weightFactor(weight);
    if (fontSize <= settings.minSize) {
      return false;
    }

    // Scale factor here is to make sure fillText is not limited by
    // the minium font size set by browser.
    // It will always be 1 or 2n.
    let mu = 1;
    if (minFontSize !== undefined && fontSize < minFontSize) {
      const browserMinFontSize = minFontSize;
      mu = (function calculateScaleFactor() {
        let mu = 2;
        while (mu * fontSize < browserMinFontSize) {
          mu += 2;
        }
        return mu;
      })();
    }

    // Get fontWeight that will be used to set fctx.font
    const fontWeight = getTextFontWeight(
      word,
      weight,
      fontSize,
      extraDataArray
    );

    const fcanvas = document.createElement('canvas');
    const fctx = get2dContext(fcanvas, { willReadFrequently: true });

    fctx.font =
      fontWeight +
      ' ' +
      (fontSize * mu).toString(10) +
      'px ' +
      settings.fontFamily;

    // Estimate the dimension of the text with measureText().
    const fw = fctx.measureText(word).width / mu;
    const fh =
      Math.max(
        fontSize * mu,
        fctx.measureText('m').width,
        fctx.measureText('Ｗ').width
      ) / mu;

    // Create a boundary box that is larger than our estimates,
    // so text don't get cut of (it sill might)
    let boxWidth = fw + fh * 2;
    let boxHeight = fh * 3;
    const fgw = Math.ceil(boxWidth / g);
    const fgh = Math.ceil(boxHeight / g);
    boxWidth = fgw * g;
    boxHeight = fgh * g;

    // Calculate the proper offsets to make the text centered at
    // the preferred position.

    // This is simply half of the width.
    const fillTextOffsetX = -fw / 2;
    // Instead of moving the box to the exact middle of the preferred
    // position, for Y-offset we move 0.4 instead, so Latin alphabets look
    // vertical centered.
    const fillTextOffsetY = -fh * 0.4;

    // Calculate the actual dimension of the canvas, considering the rotation.
    const cgh = Math.ceil(
      (boxWidth * Math.abs(Math.sin(rotateDeg)) +
        boxHeight * Math.abs(Math.cos(rotateDeg))) /
        g
    );
    const cgw = Math.ceil(
      (boxWidth * Math.abs(Math.cos(rotateDeg)) +
        boxHeight * Math.abs(Math.sin(rotateDeg))) /
        g
    );
    const width = cgw * g;
    const height = cgh * g;

    fcanvas.setAttribute('width', String(width));
    fcanvas.setAttribute('height', String(height));

    if (debug) {
      // Attach fcanvas to the DOM
      document.body.appendChild(fcanvas);
      // Save it's state so that we could restore and draw the grid correctly.
      fctx.save();
    }

    // Scale the canvas with |mu|.
    fctx.scale(1 / mu, 1 / mu);
    fctx.translate((width * mu) / 2, (height * mu) / 2);
    fctx.rotate(-rotateDeg);

    // Once the width/height is set, ctx info will be reset.
    // Set it again here.
    fctx.font =
      fontWeight +
      ' ' +
      (fontSize * mu).toString(10) +
      'px ' +
      settings.fontFamily;

    // Fill the text into the fcanvas.
    // XXX: We cannot because textBaseline = 'top' here because
    // Firefox and Chrome uses different default line-height for canvas.
    // Please read https://bugzil.la/737852#c6.
    // Here, we use textBaseline = 'middle' and draw the text at exactly
    // 0.5 * fontSize lower.
    fctx.fillStyle = '#000';
    fctx.textBaseline = 'middle';
    fctx.fillText(
      word,
      fillTextOffsetX * mu,
      (fillTextOffsetY + fontSize * 0.5) * mu
    );

    // Get the pixels of the text
    const imageData = fctx.getImageData(0, 0, width, height).data;

    if (exceedTime()) {
      return false;
    }

    if (debug) {
      // Draw the box of the original estimation
      fctx.strokeRect(fillTextOffsetX * mu, fillTextOffsetY, fw * mu, fh * mu);
      fctx.restore();
    }

    // Read the pixels and save the information to the occupied array
    const occupied: [number, number][] = [];
    let gx = cgw;
    let gy, x, y;
    const bounds: [number, number, number, number] = [
      cgh / 2,
      cgw / 2,
      cgh / 2,
      cgw / 2
    ];
    while (gx--) {
      gy = cgh;
      while (gy--) {
        y = g;
        singleGridLoop: while (y--) {
          x = g;
          while (x--) {
            if (imageData[((gy * g + y) * width + (gx * g + x)) * 4 + 3]) {
              occupied.push([gx, gy]);

              if (gx < bounds[3]) {
                bounds[3] = gx;
              }
              if (gx > bounds[1]) {
                bounds[1] = gx;
              }
              if (gy < bounds[0]) {
                bounds[0] = gy;
              }
              if (gy > bounds[2]) {
                bounds[2] = gy;
              }

              if (debug) {
                fctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                fctx.fillRect(gx * g, gy * g, g - 0.5, g - 0.5);
              }
              break singleGridLoop;
            }
          }
        }
        if (debug) {
          fctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
          fctx.fillRect(gx * g, gy * g, g - 0.5, g - 0.5);
        }
      }
    }

    if (debug) {
      fctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      fctx.fillRect(
        bounds[3] * g,
        bounds[0] * g,
        (bounds[1] - bounds[3] + 1) * g,
        (bounds[2] - bounds[0] + 1) * g
      );
    }

    // Return information needed to create the text on the real canvas
    return {
      mu: mu,
      occupied: occupied,
      bounds: bounds,
      gw: cgw,
      gh: cgh,
      fillTextOffsetX: fillTextOffsetX,
      fillTextOffsetY: fillTextOffsetY,
      fillTextWidth: fw,
      fillTextHeight: fh,
      fontSize: fontSize
    };
  };

  /* Determine if there is room available in the given dimension */
  const canFitText = function canFitText(
    gx: number,
    gy: number,
    gw: number,
    gh: number,
    occupied: [number, number][]
  ) {
    // Go through the occupied points,
    // return false if the space is not available.
    let i = occupied.length;
    while (i--) {
      const px = gx + occupied[i][0];
      const py = gy + occupied[i][1];

      if (px >= ngx || py >= ngy || px < 0 || py < 0) {
        if (!settings.drawOutOfBound) {
          return false;
        }
        continue;
      }

      if (!grid[px][py]) {
        return false;
      }
    }
    return true;
  };

  /* Actually draw the text on the grid */
  const drawText = function drawText(
    gx: number,
    gy: number,
    info: WordTextInfo,
    word: string,
    weight: number,
    distance: number,
    theta: number,
    rotateDeg: number,
    attributes: Record<string, string> | undefined,
    extraDataArray: unknown[]
  ) {
    const fontSize = info.fontSize;
    const color = getTextColor(
      word,
      weight,
      fontSize,
      distance,
      theta,
      extraDataArray
    );

    // get fontWeight that will be used to set ctx.font and font style rule
    const fontWeight = getTextFontWeight(
      word,
      weight,
      fontSize,
      extraDataArray
    );

    const classes = getTextClasses(word, weight, fontSize, extraDataArray);

    elements.forEach(function (el) {
      if (isCanvasElement(el)) {
        const ctx = get2dContext(el);
        const mu = info.mu;

        // Save the current state before messing it
        ctx.save();
        ctx.scale(1 / mu, 1 / mu);

        ctx.font =
          fontWeight +
          ' ' +
          (fontSize * mu).toString(10) +
          'px ' +
          settings.fontFamily;
        ctx.fillStyle = color;

        // Translate the canvas position to the origin coordinate of where
        // the text should be put.
        ctx.translate((gx + info.gw / 2) * g * mu, (gy + info.gh / 2) * g * mu);

        if (rotateDeg !== 0) {
          ctx.rotate(-rotateDeg);
        }

        // Finally, fill the text.

        // XXX: We cannot because textBaseline = 'top' here because
        // Firefox and Chrome uses different default line-height for canvas.
        // Please read https://bugzil.la/737852#c6.
        // Here, we use textBaseline = 'middle' and draw the text at exactly
        // 0.5 * fontSize lower.
        ctx.textBaseline = 'middle';
        ctx.fillText(
          word,
          info.fillTextOffsetX * mu,
          (info.fillTextOffsetY + fontSize * 0.5) * mu
        );

        // The below box is always matches how <span>s are positioned
        /* ctx.strokeRect(info.fillTextOffsetX, info.fillTextOffsetY,
            info.fillTextWidth, info.fillTextHeight); */

        // Restore the state.
        ctx.restore();
      } else {
        // drawText on DIV element
        const span = document.createElement('span');
        let transformRule = 'rotate(' + (-rotateDeg / Math.PI) * 180 + 'deg) ';
        if (info.mu !== 1) {
          transformRule +=
            'translateX(-' +
            info.fillTextWidth / 4 +
            'px) ' +
            'scale(' +
            1 / info.mu +
            ')';
        }
        const styleRules: Record<string, string> = {
          position: 'absolute',
          display: 'block',
          font:
            fontWeight + ' ' + fontSize * info.mu + 'px ' + settings.fontFamily,
          left: (gx + info.gw / 2) * g + info.fillTextOffsetX + 'px',
          top: (gy + info.gh / 2) * g + info.fillTextOffsetY + 'px',
          width: info.fillTextWidth + 'px',
          height: info.fillTextHeight + 'px',
          lineHeight: fontSize + 'px',
          whiteSpace: 'nowrap',
          transform: transformRule,
          webkitTransform: transformRule,
          msTransform: transformRule,
          transformOrigin: '50% 40%',
          webkitTransformOrigin: '50% 40%',
          msTransformOrigin: '50% 40%'
        };
        if (color) {
          styleRules.color = color;
        }
        span.textContent = word;
        Object.assign(span.style, styleRules);
        if (attributes) {
          for (const attribute in attributes) {
            span.setAttribute(attribute, attributes[attribute]);
          }
        }
        if (classes) {
          span.className += classes;
        }
        el.appendChild(span);
      }
    });
  };

  const firstCanvasContext = function firstCanvasContext() {
    const first = elements[0];
    if (!isCanvasElement(first)) {
      throw new Error('drawMask requires a canvas element.');
    }
    return get2dContext(first);
  };

  /* Help function to updateGrid */
  const fillGridAt = function fillGridAt(
    x: number,
    y: number,
    drawMask: boolean,
    dimension: WordDimension | undefined,
    item: WordCloudListEntry
  ) {
    if (x >= ngx || y >= ngy || x < 0 || y < 0) {
      return;
    }

    grid[x][y] = false;

    if (drawMask) {
      const ctx = firstCanvasContext();
      ctx.fillRect(x * g, y * g, maskRectWidth, maskRectWidth);
    }

    if (interactive) {
      infoGrid[x][y] = { item: item, dimension: dimension };
    }
  };

  /* Update the filling information of the given space with occupied points.
       Draw the mask on the canvas if necessary. */
  const updateGrid = function updateGrid(
    gx: number,
    gy: number,
    gw: number,
    gh: number,
    info: WordTextInfo,
    item: WordCloudListEntry
  ) {
    const occupied = info.occupied;
    const drawMask = settings.drawMask;
    let ctx: CanvasRenderingContext2D | undefined;
    if (drawMask) {
      ctx = firstCanvasContext();
      ctx.save();
      ctx.fillStyle = settings.maskColor;
    }

    let dimension: WordDimension | undefined;
    if (interactive) {
      const bounds = info.bounds;
      dimension = {
        x: (gx + bounds[3]) * g,
        y: (gy + bounds[0]) * g,
        w: (bounds[1] - bounds[3] + 1) * g,
        h: (bounds[2] - bounds[0] + 1) * g
      };
    }

    let i = occupied.length;
    while (i--) {
      const px = gx + occupied[i][0];
      const py = gy + occupied[i][1];

      if (px >= ngx || py >= ngy || px < 0 || py < 0) {
        continue;
      }

      fillGridAt(px, py, drawMask, dimension, item);
    }

    if (ctx) {
      ctx.restore();
    }
  };

  /* putWord() processes each item on the list,
       calculate it's size and determine it's position, and actually
       put it on the canvas. */
  const putWord = function putWord(
    item: WordCloudListEntry,
    loopIndex: number
  ): DrawnWord | false | null {
    if (loopIndex > 20) {
      return null;
    }

    let word: string,
      weight: number,
      attributes: Record<string, string> | undefined;
    if (Array.isArray(item)) {
      word = item[0];
      weight = item[1];
    } else {
      word = item.word;
      weight = item.weight;
      attributes = item.attributes;
    }
    const rotateDeg = getRotateDeg();

    const extraDataArray = getItemExtraData(item);

    // get info needed to put the text onto the canvas
    const info = getTextInfo(word, weight, rotateDeg, extraDataArray);

    // not getting the info means we shouldn't be drawing this one.
    if (!info) {
      return false;
    }

    if (exceedTime()) {
      return false;
    }

    // If drawOutOfBound is set to false,
    // skip the loop if we have already know the bounding box of
    // word is larger than the canvas.
    if (!settings.drawOutOfBound && !settings.shrinkToFit) {
      const bounds = info.bounds;
      if (bounds[1] - bounds[3] + 1 > ngx || bounds[2] - bounds[0] + 1 > ngy) {
        return false;
      }
    }

    // Determine the position to put the text by
    // start looking for the nearest points
    let r = maxRadius + 1;

    const tryToPutWordAtPoint = function (gxy: GridPoint): DrawnWord | false {
      const gx = Math.floor(gxy[0] - info.gw / 2);
      const gy = Math.floor(gxy[1] - info.gh / 2);
      const gw = info.gw;
      const gh = info.gh;

      // If we cannot fit the text at this position, return false
      // and go to the next position.
      if (!canFitText(gx, gy, gw, gh, info.occupied)) {
        return false;
      }

      // Actually put the text on the canvas
      drawText(
        gx,
        gy,
        info,
        word,
        weight,
        maxRadius - r,
        gxy[2],
        rotateDeg,
        attributes,
        extraDataArray
      );

      // Mark the spaces on the grid as filled
      updateGrid(gx, gy, gw, gh, info, item);

      return {
        gx: gx,
        gy: gy,
        rot: rotateDeg,
        info: info
      };
    };

    while (r--) {
      let points = getPointsAtRadius(maxRadius - r);

      if (settings.shuffle) {
        points = points.slice();
        shuffleArray(points);
      }

      // Try to fit the words by looking at each point.
      // array.some() will stop and return true
      // when putWordAtPoint() returns true.
      for (let i = 0; i < points.length; i++) {
        const res = tryToPutWordAtPoint(points[i]);
        if (res) {
          return res;
        }
      }

      // var drawn = points.some(tryToPutWordAtPoint);
      // if (drawn) {
      //   // leave putWord() and return true
      //   return true;
      // }
    }

    if (settings.shrinkToFit) {
      if (Array.isArray(item)) {
        item[1] = (item[1] * 3) / 4;
      } else {
        item.weight = (item.weight * 3) / 4;
      }
      return putWord(item, loopIndex + 1);
    }

    // we tried all distances but text won't fit, return null
    return null;
  };

  /* Send DOM event to all elements. Will stop sending event and return
       if the previous one is canceled (for cancelable events). */
  const sendEvent = function sendEvent(
    type: string,
    cancelable: boolean,
    details?: WordCloudDrawnDetail
  ): boolean | undefined {
    if (cancelable) {
      return !elements.some(function (el) {
        const event = new CustomEvent(type, {
          detail: details || {}
        });
        return !el.dispatchEvent(event);
      });
    } else {
      elements.forEach(function (el) {
        const event = new CustomEvent(type, {
          detail: details || {}
        });
        el.dispatchEvent(event);
      });
    }
  };

  /* Start drawing on a canvas */
  const start = function start() {
    // For dimensions, clearCanvas etc.,
    // we only care about the first element.
    const canvas = elements[0];

    if (isCanvasElement(canvas)) {
      ngx = Math.ceil(canvas.width / g);
      ngy = Math.ceil(canvas.height / g);
    } else {
      const rect = canvas.getBoundingClientRect();
      ngx = Math.ceil(rect.width / g);
      ngy = Math.ceil(rect.height / g);
    }

    // Sending a wordcloudstart event which cause the previous loop to stop.
    // Do nothing if the event is canceled.
    if (!sendEvent('wordcloudstart', true)) {
      return;
    }

    // Determine the center of the word cloud
    center = settings.origin
      ? [settings.origin[0] / g, settings.origin[1] / g]
      : [ngx / 2, ngy / 2];

    // Maxium radius to look for space
    maxRadius = Math.floor(Math.sqrt(ngx * ngx + ngy * ngy));

    /* Clear the canvas only if the clearCanvas is set,
         if not, update the grid to the current canvas state */
    grid = [];

    let gx: number, gy: number, i: number;
    if (!isCanvasElement(canvas) || settings.clearCanvas) {
      elements.forEach(function (el) {
        if (isCanvasElement(el)) {
          const ctx = get2dContext(el);
          ctx.fillStyle = settings.backgroundColor;
          ctx.clearRect(0, 0, ngx * (g + 1), ngy * (g + 1));
          ctx.fillRect(0, 0, ngx * (g + 1), ngy * (g + 1));
        } else {
          el.textContent = '';
          el.style.backgroundColor = settings.backgroundColor;
          el.style.position = 'relative';
        }
      });

      /* fill the grid with empty state */
      gx = ngx;
      while (gx--) {
        grid[gx] = [];
        gy = ngy;
        while (gy--) {
          grid[gx][gy] = true;
        }
      }
    } else {
      /* Determine bgPixel by creating
           another canvas and fill the specified background color. */
      const bctx = get2dContext(document.createElement('canvas'));

      bctx.fillStyle = settings.backgroundColor;
      bctx.fillRect(0, 0, 1, 1);
      const bgPixel = bctx.getImageData(0, 0, 1, 1).data;

      /* Read back the pixels of the canvas we got to tell which part of the
           canvas is empty.
           (no clearCanvas only works with a canvas, not divs) */
      const imageData = get2dContext(canvas).getImageData(
        0,
        0,
        ngx * g,
        ngy * g
      ).data;

      gx = ngx;
      let x, y;
      while (gx--) {
        grid[gx] = [];
        gy = ngy;
        while (gy--) {
          y = g;
          singleGridLoop: while (y--) {
            x = g;
            while (x--) {
              i = 4;
              while (i--) {
                if (
                  imageData[((gy * g + y) * ngx * g + (gx * g + x)) * 4 + i] !==
                  bgPixel[i]
                ) {
                  grid[gx][gy] = false;
                  break singleGridLoop;
                }
              }
            }
          }
          if (grid[gx][gy] !== false) {
            grid[gx][gy] = true;
          }
        }
      }
    }

    // fill the infoGrid with empty state if we need it
    if (settings.hover || settings.click) {
      interactive = true;

      /* fill the grid with empty state */
      gx = ngx + 1;
      while (gx--) {
        infoGrid[gx] = [];
      }

      if (settings.hover) {
        canvas.addEventListener('mousemove', wordcloudhover);
      }

      if (settings.click) {
        canvas.addEventListener('click', wordcloudclick);
        canvas.addEventListener('touchstart', wordcloudclick);
        canvas.addEventListener('touchend', function (e) {
          e.preventDefault();
        });
        Object.assign(canvas.style, {
          webkitTapHighlightColor: 'rgba(0, 0, 0, 0)'
        });
      }

      canvas.addEventListener('wordcloudstart', function stopInteraction() {
        canvas.removeEventListener('wordcloudstart', stopInteraction);

        canvas.removeEventListener('mousemove', wordcloudhover);
        canvas.removeEventListener('click', wordcloudclick);
        hovered = undefined;
      });
    }

    i = 0;
    let loopingFunction: LoopingFunction, stoppingFunction: StoppingFunction;
    let layouting = true;
    if (!settings.layoutAnimation) {
      loopingFunction = function (cb) {
        cb();
        return undefined;
      };
      stoppingFunction = function () {
        layouting = false;
      };
    } else if (settings.wait !== 0) {
      loopingFunction = function (cb, wait) {
        return window.setTimeout(cb, wait);
      };
      stoppingFunction = function (id) {
        window.clearTimeout(id);
      };
    } else {
      loopingFunction = window.setImmediate || setImmediateFallback;
      stoppingFunction = window.clearImmediate || clearImmediateFallback;
    }

    const addEventListener = function addEventListener(
      type: string,
      listener: () => void
    ) {
      elements.forEach(function (el) {
        el.addEventListener(type, listener);
      });
    };

    const removeEventListener = function removeEventListener(
      type: string,
      listener: () => void
    ) {
      elements.forEach(function (el) {
        el.removeEventListener(type, listener);
      });
    };

    const anotherWordCloudStart = function anotherWordCloudStart() {
      removeEventListener('wordcloudstart', anotherWordCloudStart);
      stoppingFunction(timer[timerId]);
    };

    addEventListener('wordcloudstart', anotherWordCloudStart);

    // At least wait the following code before call the first iteration.
    timer[timerId] = (settings.layoutAnimation ? loopingFunction : setTimeout)(
      function loop() {
        if (!layouting) {
          return;
        }
        if (i >= settings.list.length) {
          stoppingFunction(timer[timerId]);
          sendEvent('wordcloudstop', false);
          removeEventListener('wordcloudstart', anotherWordCloudStart);
          delete timer[timerId];
          return;
        }
        escapeTime = new Date().getTime();
        const drawn = putWord(settings.list[i], 0);
        const canceled = !sendEvent('wordclouddrawn', true, {
          item: settings.list[i],
          drawn: drawn
        });
        if (exceedTime() || canceled) {
          stoppingFunction(timer[timerId]);
          settings.abort();
          sendEvent('wordcloudabort', false);
          sendEvent('wordcloudstop', false);
          removeEventListener('wordcloudstart', anotherWordCloudStart);
          return;
        }
        i++;
        timer[timerId] = loopingFunction(loop, settings.wait);
      },
      settings.wait
    );
  };

  // All set, start the drawing
  start();
}

WordCloud.isSupported = isSupported;
WordCloud.minFontSize = minFontSize;

export default WordCloud;
