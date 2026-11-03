import { STYLES } from './mtl/styles';
const sheet=document.createElement('style');sheet.textContent=STYLES;document.head.appendChild(sheet);
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ComposerSlider } from './mtl/ComposerSlider';
let snapshot = {
  current: { provider: 'test', model: 'model', reasoningEffort: 'e2' },
  groups: [{ id: 'test', models: [{ id: 'model', name: 'Test Model', reasoning: {
    efforts: Array.from({ length: 5 }, (_, i) => ({ id: 'e' + i, name: 'Level ' + i }))
  } }] }], status: 'ready', error: null
};
const listeners = new Set();
window.calls = [];
const directory = {
  store: { getSnapshot: () => snapshot, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } },
  load: async () => {},
  select: async selection => {
    window.calls.push(selection);
    await new Promise(resolve => setTimeout(resolve, window.delay || 0));
    if (window.refuseNext) { window.refuseNext = false; return { ok: false, error: { code: 'test/refused', message: 'refused' } }; }
    snapshot = { ...snapshot, current: selection };
    listeners.forEach(fn => fn());
  }
};
window.hostRoot = createRoot(document.getElementById('app'));
window.hostRoot.render(<ComposerSlider directory={directory} t={key => key} />);
