import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { urlModuliDim } from '../js/pages/dim/cache.js';

test('urlModuliDim elenca i moduli della cartella dim/ come URL assoluti', () => {
  const base = new URL('../js/pages/dim/cache.js', import.meta.url);
  const urls = urlModuliDim(base);
  assert.ok(urls.length >= 17);
  assert.ok(urls.every((u) => u.startsWith(new URL('./', base).href)));
  assert.ok(urls.some((u) => u.endsWith('/studio.js')));
});

test('ogni modulo elencato esiste davvero nella cartella', () => {
  const base = new URL('../js/pages/dim/cache.js', import.meta.url);
  for (const url of urlModuliDim(base)) {
    assert.ok(fs.existsSync(new URL(url)), url);
  }
});
