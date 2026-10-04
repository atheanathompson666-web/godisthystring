const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(resolve(__dirname, '../solar-system-3d.js'), 'utf8');
const context = vm.createContext({ window: { addEventListener() {} } });
vm.runInContext(source, context);
const onMouseWheel = vm.runInContext('SolarSystemScene.prototype.onMouseWheel', context);

test('wheel zoom does not go below its minimum', () => {
  const scene = { controls: { targetZoom: 0.31 } };
  let preventedDefault = false;

  onMouseWheel.call(scene, {
    deltaY: -1,
    preventDefault() {
      preventedDefault = true;
    }
  });

  assert.equal(scene.controls.targetZoom, 0.3);
  assert.equal(preventedDefault, true);
});

test('wheel zoom does not exceed its maximum', () => {
  const scene = { controls: { targetZoom: 7999 } };

  onMouseWheel.call(scene, {
    deltaY: 1,
    preventDefault() {}
  });

  assert.equal(scene.controls.targetZoom, 8000);
});
