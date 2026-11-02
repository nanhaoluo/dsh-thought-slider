/**
 * dsh-thought-slider — host half.
 *
 * Mounts the ZCode / Codex thought slider enhancement layer into DeepSeek Harness.
 *
 * @module dsh-thought-slider
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const VERSION = (() => {
  try {
    const manifest = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
    return typeof manifest.version === 'string' ? manifest.version : '1.0.0';
  } catch {
    return '1.0.0';
  }
})();

export function apply(ctx) {
  const logger = ctx.logger;
  if (logger && typeof logger.info === 'function') {
    logger.info(`dsh-thought-slider ${VERSION}: ZCode / Codex thought slider active`);
  }
  ctx.effect(() => () => {
    if (logger && typeof logger.info === 'function') {
      logger.info('dsh-thought-slider: unmounted');
    }
  }, 'dsh-thought-slider: host lifecycle');
}

export default apply;
