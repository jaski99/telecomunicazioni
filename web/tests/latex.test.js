import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilaLatex } from '../js/core/math.js';

const __dirname = join(fileURLToPath(import.meta.url), '..');

function leggiJsonSeEsiste(rel) {
  const percorso = join(__dirname, rel);
  try {
    return JSON.parse(readFileSync(percorso, 'utf8'));
  } catch (_err) {
    return null;
  }
}

/** Raccoglie i corpi $...$ e $$...$$ camminando ricorsivamente un oggetto JSON. */
function raccogliLatex(v, raccolte) {
  if (Array.isArray(v)) {
    for (const elem of v) raccogliLatex(elem, raccolte);
    return;
  }
  if (v && typeof v === 'object') {
    for (const valore of Object.values(v)) raccogliLatex(valore, raccolte);
    return;
  }
  if (typeof v !== 'string') return;
  const re = /\$\$(.*?)\$\$|\$(.*?)\$/gs;
  let match;
  while ((match = re.exec(v)) !== null) {
    raccolte.push(match[1] !== undefined ? match[1] : match[2]);
  }
}

/** Stringhe LaTeX pure (senza delimitatori $) tratte dai campi dei nodi:
 * devono compilare con throwOnError: true, mai eccezione. */
const LATEX_PURO = [
  '\\frac{1}{2}',
  '\\omega',
  '\\Omega',
  '\\sum_n x(nT)',
  '\\delta(t-nT)',
  '\\operatorname{sinc}\\left(\\frac{t-nT}{T}\\right)',
  '\\int_{-\\infty}^{+\\infty} x(t)e^{-j\\omega t}\\,dt',
  '\\ge',
  '\\infty',
  'f_s \\ge 2 f_m',
];

test('compilaLatex compila ogni stringa LaTeX pura con throwOnError: true', () => {
  for (const latex of LATEX_PURO) {
    assert.doesNotThrow(
      () => compilaLatex(latex),
      `LaTeX puro non compilabile: ${latex}`
    );
    const html = compilaLatex(latex);
    assert.ok(typeof html === 'string' && html.length > 0, `vuoto per: ${latex}`);
  }
});

test('compilaLatex lancia un errore con throwOnError su comando inesistente', () => {
  assert.throws(() => compilaLatex('\\comandoInesistente{'), /KaTeX parse error/);
});

test('compila ogni stringa LaTeX di web/graph.json e web/quiz.json con throwOnError: true', () => {
  // I file in web/ sono generati da web/build.sh. Se non sono ancora stati
  // generati (checkout pulito senza build), il test si affida alle stringhe
  // pure sopra e non fallisce per file mancanti.
  let totale = LATEX_PURO.length;
  for (const rel of ['../graph.json', '../quiz.json']) {
    const oggetto = leggiJsonSeEsiste(rel);
    if (!oggetto) continue;
    const raccolte = [];
    raccogliLatex(oggetto, raccolte);
    for (const latex of raccolte) {
      totale++;
      assert.doesNotThrow(
        () => compilaLatex(latex),
        `LaTeX non compilabile in ${rel}: ${latex}`
      );
    }
  }
  assert.ok(totale > 0, 'nessuna stringa LaTeX da compilare');
});
