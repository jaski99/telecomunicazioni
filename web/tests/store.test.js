import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  leggiChiave,
  scriviChiave,
  backupTutteChiavi,
  importaChiavi,
  KEY_STATO,
  KEY_RIPASSO,
  KEY_DIMOSTRAZIONI,
  KEY_IMPOSTAZIONI,
} from '../js/core/store.js';

class FakeStorage {
  constructor() { this.d = new Map(); }
  getItem(k) { return this.d.has(k) ? this.d.get(k) : null; }
  setItem(k, v) { this.d.set(k, String(v)); }
  removeItem(k) { this.d.delete(k); }
  key(i) { return [...this.d.keys()][i] ?? null; }
  get length() { return this.d.size; }
}

test('leggiChiave restituisce il default per chiave assente', () => {
  const s = new FakeStorage();
  assert.strictEqual(leggiChiave(s, KEY_STATO, 'default'), 'default');
});

test('scriviChiave e leggiChiave round-trip JSON', () => {
  const s = new FakeStorage();
  const valore = { nodo: 'dim-x', passo: 3, ok: true };
  assert.strictEqual(scriviChiave(s, KEY_STATO, valore), true);
  assert.deepStrictEqual(leggiChiave(s, KEY_STATO), valore);
  assert.strictEqual(s.getItem(KEY_STATO), JSON.stringify(valore));
});

test('leggiChiave con JSON corrotto restituisce il default', () => {
  const s = new FakeStorage();
  s.d.set(KEY_STATO, "{non e' json}");
  assert.deepStrictEqual(leggiChiave(s, KEY_STATO, { a: 1 }), { a: 1 });
});

test('scriviChiave rifiuta chiavi senza prefisso tlc-kg:', () => {
  const s = new FakeStorage();
  assert.strictEqual(scriviChiave(s, 'altra-cosa', 1), false);
  assert.strictEqual(scriviChiave(s, 'tlc-kg', 1), false);
  assert.strictEqual(scriviChiave(s, 'tlc-kg:', 1), false);
  assert.strictEqual(s.length, 0);
  assert.strictEqual(leggiChiave(s, 'altra-cosa', 'd'), 'd');
});

test('backupTutteChiavi esporta solo chiavi tlc-kg:', () => {
  const s = new FakeStorage();
  s.setItem(KEY_STATO, JSON.stringify({ x: 1 }));
  s.setItem(KEY_RIPASSO, JSON.stringify({ intervallo: 3 }));
  s.setItem('altra', 'deve essere ignorata');
  s.setItem('tlc-kg:spazzatura', 's');
  const backup = backupTutteChiavi(s);
  assert.deepStrictEqual(Object.keys(backup).sort(), [
    KEY_DIMOSTRAZIONI, KEY_IMPOSTAZIONI, KEY_RIPASSO, KEY_STATO,
    'tlc-kg:spazzatura',
  ].sort().filter((k) => Object.keys(backup).includes(k)));
  assert.strictEqual(backup[KEY_STATO].x, 1);
  assert.strictEqual(backup['altra'], undefined);
});

test('importaChiavi importa solo chiavi con prefisso tlc-kg:', () => {
  const s = new FakeStorage();
  const n = importaChiavi(s, {
    [KEY_STATO]: { a: 1 },
    [KEY_IMPOSTAZIONI]: { data: '2026-10-29' },
    chiave_strana: 'ignorata',
  });
  assert.strictEqual(n, 2);
  assert.deepStrictEqual(leggiChiave(s, KEY_STATO), { a: 1 });
  assert.strictEqual(s.getItem('chiave_strana'), null);
});

test('leggiStatoNodo/scriviStatoNodo (via chiavi dirette)', () => {
  const s = new FakeStorage();
  const stati = {};
  stati['nodo-1'] = { livello: 2 };
  scriviChiave(s, KEY_STATO, stati);
  const letto = leggiChiave(s, KEY_STATO, {})['nodo-1'];
  assert.deepStrictEqual(letto, { livello: 2 });
});

test('chiavi canoniche esportate', () => {
  assert.strictEqual(KEY_STATO, 'tlc-kg:stato:v1');
  assert.strictEqual(KEY_RIPASSO, 'tlc-kg:ripasso:v1');
  assert.strictEqual(KEY_DIMOSTRAZIONI, 'tlc-kg:dimostrazioni:v1');
  assert.strictEqual(KEY_IMPOSTAZIONI, 'tlc-kg:impostazioni:v1');
});
