// echarts ships no declarations for this entry; it re-exports `echarts/core`
// and also registers the canvas renderer, so the runtime import must stay.
declare module 'echarts/lib/echarts' {
  export * from 'echarts/core';
}
