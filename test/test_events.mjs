import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchToAll } from '../src/events.ts';

const cancelOnDrawn = (target) =>
  target.addEventListener('wordclouddrawn', (event) => event.preventDefault());

describe('dispatchToAll', () => {
  it('reports a cancelable event canceled when a listener calls preventDefault', () => {
    const target = new EventTarget();
    cancelOnDrawn(target);
    assert.equal(dispatchToAll([target], 'wordclouddrawn', true, {}), false);
  });

  it('reports a cancelable event not canceled when no listener prevents it', () => {
    const target = new EventTarget();
    target.addEventListener('wordclouddrawn', () => {});
    assert.equal(dispatchToAll([target], 'wordclouddrawn', true, {}), true);
  });

  it('stops at the first element that cancels', () => {
    const first = new EventTarget();
    const second = new EventTarget();
    const reached = [];
    first.addEventListener('wordclouddrawn', (event) => {
      reached.push('first');
      event.preventDefault();
    });
    second.addEventListener('wordclouddrawn', () => reached.push('second'));
    assert.equal(
      dispatchToAll([first, second], 'wordclouddrawn', true, {}),
      false
    );
    assert.deepEqual(reached, ['first']);
  });

  it('sends a non-cancelable event to every element, whatever the listeners do', () => {
    const targets = [new EventTarget(), new EventTarget()];
    const reached = [];
    targets.forEach((target, index) =>
      target.addEventListener('wordcloudstop', (event) => {
        reached.push(index);
        event.preventDefault();
        assert.equal(event.cancelable, false);
      })
    );
    assert.equal(dispatchToAll(targets, 'wordcloudstop', false, {}), true);
    assert.deepEqual(reached, [0, 1]);
  });

  it('passes the detail to the listeners', () => {
    const target = new EventTarget();
    const details = [];
    target.addEventListener('wordclouddrawn', (event) =>
      details.push(event.detail)
    );
    const detail = { item: ['word', 3], drawn: false };
    dispatchToAll([target], 'wordclouddrawn', true, detail);
    assert.deepEqual(details, [detail]);
  });
});
