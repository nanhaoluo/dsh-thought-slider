import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const engine = await readFile(new URL('../src/engine.js', import.meta.url), 'utf8');
const client = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
const template = await readFile(new URL('../src/client.bundle.js', import.meta.url), 'utf8');

test('engine parses, tolerates a non-browser environment and repeated loading', () => {
  const context = vm.createContext({});
  vm.runInContext(engine, context);
  const instance = context.__DSH_THOUGHT_SLIDER__;
  assert.equal(typeof instance.install, 'function');
  instance.install();
  instance.scanAndHarmonize();
  instance.uninstall();
  vm.runInContext(engine, context);
  assert.equal(context.__DSH_THOUGHT_SLIDER__, instance);
});

test('shipped client matches engine source and registers the host module lifecycle', () => {
  const inlined = engine.trimEnd().split('\n').map(line => line ? '    ' + line : line).join('\n');
  assert.equal(client, template.replace('// __ENGINE_SOURCE__', ';\n' + inlined), 'Run npm run build');
  let definition;
  const context = vm.createContext({ window: { __ModuleLoader__: { load: value => { definition = value; } } } });
  vm.runInContext(client, context);
  assert.equal(definition.id, 'dsh-thought-slider');
  const plugin = definition.factory(() => { throw new Error('Unexpected runtime dependency'); });
  assert.equal(plugin.name, 'dsh-thought-slider');
  let installs = 0;
  let uninstalls = 0;
  context.__DSH_THOUGHT_SLIDER__.install = () => installs++;
  context.__DSH_THOUGHT_SLIDER__.uninstall = () => uninstalls++;
  let dispose;
  plugin.apply({ effect: callback => { dispose = callback(); } });
  assert.equal(installs, 1);
  dispose();
  assert.equal(uninstalls, 1);
});
