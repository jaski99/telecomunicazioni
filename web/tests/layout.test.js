import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navHTML, shellHTML } from '../js/layout/shell.js';

test('shell unica e navigazione accessibile con rotta attiva', () => {
  const html = shellHTML('quiz');
  assert.equal((html.match(/TLC Studio/g) || []).length, 1);
  assert.match(html, /href="#\/quiz" aria-current="page"/);
  assert.equal((html.match(/aria-current/g) || []).length, 1);
  assert.doesNotMatch(navHTML('fonti'), /aria-current/);
  assert.match(navHTML('grafo/area'), /href="#\/grafo" aria-current/);
});
