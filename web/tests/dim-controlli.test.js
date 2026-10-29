import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testoProgresso, renderControlli, aggiornaControlli } from '../js/pages/dim/controlli.js';
import { dimostrazioneEsempio, elemento } from './dim-fake-dom.js';

const dim = dimostrazioneEsempio();

test('testoProgresso dice sempre «Passo k di N», anche a zero', () => {
  assert.equal(testoProgresso(0, 3), 'Passo 0 di 3');
  assert.equal(testoProgresso(2, 3), 'Passo 2 di 3');
});

test('la barra è un progressbar con valori ARIA e i pulsanti del brief', () => {
  const html = renderControlli(dim, 1);
  assert.match(html, /role="progressbar"[^>]*aria-valuemin="0" aria-valuemax="3" aria-valuenow="1"/);
  assert.match(html, /<p class="dim-controlli__testo" data-progresso-testo aria-live="polite">Passo 1 di 3<\/p>/);
  for (const etichetta of ['Indietro', 'Prossimo passo', 'Mostra tutti', 'Ricomincia']) {
    assert.match(html, new RegExp(`>${etichetta}<`));
  }
});

test('a inizio percorso Indietro e Ricomincia sono disabilitati; a fine lo sono Prossimo e Mostra tutti', () => {
  const inizio = renderControlli(dim, 0);
  assert.match(inizio, /data-azione="indietro" disabled/);
  assert.match(inizio, /data-azione="ricomincia" disabled/);
  const fine = renderControlli(dim, 3);
  assert.match(fine, /data-azione="avanti" disabled/);
  assert.match(fine, /data-azione="tutti" disabled/);
});

test('l\'indice ha voci disabilitate per i passi non rivelati', () => {
  const html = renderControlli(dim, 1);
  assert.match(html, /data-indice="1">/);
  assert.match(html, /data-indice="2" disabled/);
  assert.match(html, /data-indice="3" disabled/);
});

test('aggiornaControlli riallinea barra, testo, pulsanti e indice', () => {
  const testo = elemento();
  const progresso = elemento();
  const barra = elemento();
  const azioni = {
    '[data-azione="indietro"]': elemento(), '[data-azione="avanti"]': elemento(),
    '[data-azione="tutti"]': elemento(), '[data-azione="ricomincia"]': elemento(),
  };
  const voce1 = elemento({ dataset: { indice: '1' }, children: { '.dim-indice__stato': elemento() } });
  const voce3 = elemento({ dataset: { indice: '3' }, children: { '.dim-indice__stato': elemento() } });
  const radice = elemento({
    children: { '[data-progresso-testo]': testo, '.progress': progresso, '[data-progresso-barra]': barra, ...azioni, '[data-indice]': [voce1, voce3] },
  });
  aggiornaControlli(radice, 3, 3);
  assert.equal(testo.textContent, 'Passo 3 di 3');
  assert.equal(progresso.getAttribute('aria-valuenow'), '3');
  assert.equal(barra.style.width, '100%');
  assert.equal(azioni['[data-azione="avanti"]'].disabled, true);
  assert.equal(azioni['[data-azione="indietro"]'].disabled, false);
  assert.equal(voce3.disabled, false);
  assert.equal(voce3.querySelector('.dim-indice__stato').textContent, 'rivelato');
  aggiornaControlli(radice, 0, 3);
  assert.equal(barra.style.width, '0%');
  assert.equal(voce1.disabled, true);
});
