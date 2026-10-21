# Disposing a layout stops its loop (#24)

## Problem

A layout instance's `dispose()` stops the running layout by cancelling the next `wordclouddrawn`
event with `preventDefault()`. `sendEvent` created that event without `cancelable: true`, so the
cancel was ignored and a disposed layout kept placing every remaining word on its off-screen canvas
after each redraw or resize.

## Change

- `src/events.ts`: `dispatchToAll(elements, type, cancelable, detail)`, the old `sendEvent` body,
  creating cancelable events with `cancelable: true`. `layout.ts`'s `sendEvent` calls it.
- `wordcloudstart` is also sent as cancelable; nothing in the package cancels it, so only a
  consumer's own `preventDefault()` on it changes behaviour (which is what the existing comment
  says it should do).
- Each layout draws on a canvas of its own, so a disposed layout's cancelling listener never
  reaches the next layout.

## Tests

- `test/test_events.mjs` (`node:test`, Node's own `EventTarget` / `CustomEvent`): a
  `preventDefault()` cancels a cancelable event, stops at the first element that cancels, does not
  cancel a non-cancelable one, and passes the detail. Removing `cancelable` turns two of them red.
- `yarn test` runs in CI after the build.
