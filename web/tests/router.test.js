import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corrispondenzaPercorso, creaRouter } from '../js/router.js';

test('corrispondenzaPercorso: match esatto', () => {
  assert.deepStrictEqual(corrispondenzaPercorso('grafo', 'grafo'), {});
  assert.deepStrictEqual(corrispondenzaPercorso('', ''), {});
});

test('corrispondenzaPercorso: estrae parametri :id', () => {
  assert.deepStrictEqual(
    corrispondenzaPercorso("dim/l'ultima", 'dim/:id'),
    { id: "l'ultima" }
  );
  assert.deepStrictEqual(
    corrispondenzaPercorso('nodo/abc-def', 'nodo/:id'),
    { id: 'abc-def' }
  );
});

test('corrispondenzaPercorso: rifiuta lunghezze diverse e segmenti diversi', () => {
  assert.strictEqual(corrispondenzaPercorso('grafo/extra', 'grafo'), null);
  assert.strictEqual(corrispondenzaPercorso('dim', 'dim/:id'), null);
  assert.strictEqual(corrispondenzaPercorso('altro', 'grafo'), null);
});

test('creaRouter: invoca onRender con lo stato della route matchata', () => {
  const chiamate = [];
  const router = creaRouter([
    { path: 'nodo/:id' },
    { path: 'quiz' },
  ], (stato) => chiamate.push(stato));

  router.eseguire('nodo/abc');
  assert.strictEqual(chiamate.length, 1);
  assert.strictEqual(chiamate[0].route.path, 'nodo/:id');
  assert.deepStrictEqual(chiamate[0].params, { id: 'abc' });
  assert.strictEqual(chiamate[0].percorso, 'nodo/abc');

  router.eseguire('quiz');
  assert.strictEqual(chiamate[1].route.path, 'quiz');
  assert.deepStrictEqual(chiamate[1].params, {});

  router.eseguire('inesistente');
  assert.strictEqual(chiamate[2].route, null);
  assert.deepStrictEqual(chiamate[2].params, {});
});

test("creaRouter: stato() restituisce la ultima route eseguita", () => {
  const router = creaRouter([{ path: 'ripasso' }], () => {});
  router.eseguire('ripasso');
  assert.deepStrictEqual(router.stato().params, {});
  assert.strictEqual(router.stato().percorso, 'ripasso');
});
