import test from 'node:test';
import assert from 'node:assert/strict';
import { leggiEsiti, registraEsito } from '../modules/quiz/esiti.js';
import { readFile } from 'node:fs/promises';

class Memoria {
  #valori = new Map();
  getItem(key) { return this.#valori.has(key) ? this.#valori.get(key) : null; }
  setItem(key, value) { this.#valori.set(key, String(value)); }
}
const valido = (id='q-uno') => ({item_id:id,nodo_id:'nodo-valido',corretto:true,modalita:'allenamento',ts:'2026-10-29T12:00:00.000Z'});

test('registra e legge esiti nella chiave contrattuale', () => {
  const storage = new Memoria();
  assert.equal(registraEsito(storage,valido()),true);
  assert.deepEqual(leggiEsiti(storage),[valido()]);
  assert.ok(storage.getItem('tlc-kg:esiti-quiz:v1'));
});

test('rifiuta esiti incompleti e recupera storage corrotto', () => {
  const storage = new Memoria();
  assert.equal(registraEsito(storage,{item_id:'x'}),false);
  storage.setItem('tlc-kg:esiti-quiz:v1','{');
  assert.deepEqual(leggiEsiti(storage),[]);
});

test('mantiene soltanto gli ultimi 2000 risultati', () => {
  const storage = new Memoria();
  storage.setItem('tlc-kg:esiti-quiz:v1',JSON.stringify(Array.from({length:2000},(_,i)=>valido(`q-${i}`))));
  assert.equal(registraEsito(storage,valido('q-new')),true);
  const all=leggiEsiti(storage);
  assert.equal(all.length,2000);
  assert.equal(all.at(-1).item_id,'q-new');
  assert.equal(all[0].item_id,'q-1');
});

test('dati demo e modulo non inseriscono contenuti utente come HTML', async () => {
  const module=await readFile(new URL('../modules/quiz/index.js',import.meta.url),'utf8');
  const demo=await readFile(new URL('../modules/quiz/demo.html',import.meta.url),'utf8');
  assert.match(module,/textContent/);
  assert.doesNotMatch(module,/\.innerHTML\s*=/);
  assert.match(demo,/montaQuiz/);
  assert.match(demo,/lang="it"/);
});
