import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTestata } from '../js/pages/dim/testata.js';
import { dimostrazioneEsempio, graphEsempio } from './dim-fake-dom.js';

const nodo = { id: 'dim-test', tipo: 'dimostrazione' };

test('la testata ha h1, chip leggibili e il link «Torna al concetto» come bottone ghost', () => {
  const html = renderTestata(dimostrazioneEsempio(), nodo, graphEsempio());
  assert.match(html, /<h1>Prova di test<\/h1>/);
  assert.match(html, /class="btn btn--ghost" href="#\/nodo\/dim-test">Torna al concetto</);
  assert.match(html, />Dimostrazione</);
  assert.match(html, />Domanda d&#039;esame T2</);
  assert.match(html, /title="Trasformata impulsiva"/);
  assert.match(html, />10 punti</);
});

test('la verifica mostra l\'etichetta umana con il tono giusto', () => {
  const html = renderTestata(dimostrazioneEsempio(), nodo, graphEsempio());
  assert.match(html, /chip--ok">Verificata su file1 e file3</);
  const ricostruita = dimostrazioneEsempio({ verifica: { stato: 'ricostruzione_non_del_prof' } });
  assert.match(renderTestata(ricostruita, nodo, graphEsempio(ricostruita)), /chip--warn">Ricostruzione: non dal testo del prof</);
});

test('punti non numerici non producono «NON TROVATO» né «null» visibili', () => {
  const graph = graphEsempio();
  graph.esame[0].punti = 'NON TROVATO';
  const html = renderTestata(dimostrazioneEsempio(), nodo, graph);
  assert.doesNotMatch(html, /punti|NON TROVATO|null|undefined/);
});

test('gli ID grezzi e i float non compaiono nel testo visibile', () => {
  const html = renderTestata(dimostrazioneEsempio(), nodo, graphEsempio());
  const visibile = html.replace(/<[^>]+>/g, ' ').replace(/title="[^"]*"/g, '');
  assert.doesNotMatch(visibile, /dim-test|\d\.\d{3,}/);
});
