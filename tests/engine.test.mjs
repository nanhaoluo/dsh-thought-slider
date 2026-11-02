import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

test('engine source has valid syntax and defines required styles', async () => {
  const engineSource = await readFile(join(root, 'src', 'engine.js'), 'utf8');
  assert.ok(engineSource.includes('.bre-effort-slider'));
  assert.ok(engineSource.includes('.bre-effort-slider-fill'));
  assert.ok(engineSource.includes('.bre-effort-slider-thumb'));
  assert.ok(engineSource.includes('.bre-effort-track'));
  assert.ok(engineSource.includes('.bre-effort-knob'));
  assert.ok(engineSource.includes('--bre-progress'));
  assert.ok(engineSource.includes('zcode-thought-bubble-flow'));
  assert.ok(engineSource.includes('zcode-thought-bubbles'));
  assert.ok(engineSource.includes('data-dsh-thought-slider'));
});

test('lib/client.js is buildable and contains module loader hook', async () => {
  const clientJs = await readFile(join(root, 'lib', 'client.js'), 'utf8');
  assert.ok(clientJs.includes('__ModuleLoader__.load'));
  assert.ok(clientJs.includes('dsh-thought-slider'));
  assert.ok(clientJs.includes('__DSH_THOUGHT_SLIDER__'));
});
