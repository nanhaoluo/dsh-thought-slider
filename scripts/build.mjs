/**
 * Build script: inlines src/engine.js into src/client.bundle.js -> lib/client.js
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const MARKER = '// __ENGINE_SOURCE__';

export async function build() {
  const engine = await readFile(join(root, 'src', 'engine.js'), 'utf8');
  const template = await readFile(join(root, 'src', 'client.bundle.js'), 'utf8');
  if (!template.includes(MARKER)) {
    throw new Error('client.bundle.js missing marker: ' + MARKER);
  }
  const indented = engine.trimEnd().split('\n')
    .map(line => (line.length === 0 ? line : '    ' + line))
    .join('\n');
  return template.replace(MARKER, ';\n' + indented);
}

const built = await build();
await writeFile(join(root, 'lib', 'client.js'), built, 'utf8');
console.log('built lib/client.js (' + built.length + ' bytes)');
