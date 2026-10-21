/**
 * Dispatches `type` to every element. A cancelable event stops at the first
 * listener that calls `preventDefault()`, and the result says whether none did.
 */
export function dispatchToAll<Detail>(
  elements: EventTarget[],
  type: string,
  cancelable: boolean,
  detail: Detail
): boolean {
  if (!cancelable) {
    elements.forEach(function (el) {
      el.dispatchEvent(new CustomEvent(type, { detail }));
    });
    return true;
  }
  return !elements.some(function (el) {
    return !el.dispatchEvent(new CustomEvent(type, { detail, cancelable }));
  });
}
