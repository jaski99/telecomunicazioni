import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etichettaVerifica, toneVerifica, etichettaTipo, etichettaFonte, etichettaProva } from '../js/pages/dim/etichette.js';

test('etichettaVerifica mappa gli stati noti alle etichette umane', () => {
  assert.equal(etichettaVerifica('verificata_file1_file3'), 'Verificata su file1 e file3');
  assert.equal(etichettaVerifica('ricostruzione_non_del_prof'), 'Ricostruzione: non dal testo del prof');
  assert.equal(etichettaVerifica('da_verificare'), 'Da verificare');
});

test('etichettaVerifica ripiega su «Da verificare» per stati sconosciuti o assenti', () => {
  assert.equal(etichettaVerifica('stato_nuovo'), 'Da verificare');
  assert.equal(etichettaVerifica(undefined), 'Da verificare');
  assert.equal(etichettaVerifica('toString'), 'Da verificare');
});

test('toneVerifica è ok solo per gli stati verificati', () => {
  assert.equal(toneVerifica('verificata_file1_file3'), 'ok');
  assert.equal(toneVerifica('ricostruzione_non_del_prof'), 'warn');
  assert.equal(toneVerifica(undefined), 'warn');
});

test('etichettaTipo e etichettaProva producono testo leggibile', () => {
  assert.equal(etichettaTipo('dimostrazione'), 'Dimostrazione');
  assert.equal(etichettaTipo('tipo_esercizio'), 'Tipo di esercizio');
  assert.equal(etichettaTipo('nuovo_tipo'), 'Nuovo tipo');
  assert.equal(etichettaProva('T5'), "Domanda d'esame T5");
});

test('etichettaFonte usa la mappa, poi la descrizione in meta, poi la chiave', () => {
  assert.equal(etichettaFonte('FILE3', {}), 'Dimostrazioni di studenti (file3)');
  assert.equal(etichettaFonte('ALTRA', { fonti: { ALTRA: { descrizione: 'Libro di testo' } } }), 'Libro di testo');
  assert.equal(etichettaFonte('ALTRA_FONTE', null), 'Altra fonte');
});
