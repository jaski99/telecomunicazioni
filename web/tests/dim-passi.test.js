import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPasso, renderPassi, aggiornaPassi, portaPassoInVista } from '../js/pages/dim/passi.js';
import { dimostrazioneEsempio, elemento } from './dim-fake-dom.js';

const dim = dimostrazioneEsempio();

test('un passo rivelato mostra testo, formula, figura e il perché', () => {
  const html = renderPasso(dim.passi[0], dim, true);
  assert.match(html, /class="step step--rivelato" id="passo-1" data-passo="1" tabindex="-1"/);
  assert.match(html, /<div class="step__corpo">/);
  assert.match(html, /<div class="passo-formula"><div class="formula-box">/);
  assert.match(html, /data-figura="fig-a"><figure/);
  assert.match(html, /callout--tip"><p class="callout__title">Perché si può fare<\/p><p>Per definizione\.<\/p>/);
});

test('un passo non rivelato ha il corpo nascosto, nessuna figura e il segnaposto «nascosto»', () => {
  const html = renderPasso(dim.passi[0], dim, false);
  assert.match(html, /class="step step--nascosto"/);
  assert.match(html, /<div class="step__corpo" hidden>/);
  assert.match(html, /data-figura="fig-a"><\/div>/);
  assert.match(html, /<span class="step__nascosto-testo"> — nascosto<\/span>/);
});

test('renderPassi mantiene la formula anche nei passi nascosti (conteggio per D2)', () => {
  const html = renderPassi(dim, 1);
  assert.equal((html.match(/passo-formula/g) || []).length, 2);
  assert.equal((html.match(/step--rivelato/g) || []).length, 1);
  assert.match(html, /<ol class="dim-passi"/);
});

function radiceConPassi(rivelati) {
  const lis = dim.passi.map((p) => {
    const corpo = elemento();
    const slot = elemento({ childElementCount: 0 });
    const li = elemento({ classi: [], dataset: { passo: String(p.n) }, children: { '.step__corpo': corpo, '.step__figura[data-figura]': slot } });
    li.hidden = false;
    li.corpo = corpo; li.slot = slot;
    return li;
  });
  return { lis, radice: elemento({ children: { '.step[data-passo]': lis } }) };
}

test('aggiornaPassi rivela i passi fino al numero dato e riempie la figura al primo rivelo', () => {
  const { lis, radice } = radiceConPassi(0);
  aggiornaPassi(radice, dim, 2);
  assert.deepEqual(lis.map((li) => li.classList.contains('step--rivelato')), [true, true, false]);
  assert.deepEqual(lis.map((li) => li.corpo.hidden), [false, false, true]);
  assert.match(lis[0].slot.innerHTML, /<figure/);
  assert.equal(lis[2].slot.innerHTML, '');
});

test('aggiornaPassi non riscrive una figura già presente', () => {
  const { lis, radice } = radiceConPassi(0);
  lis[0].slot.childElementCount = 1;
  lis[0].slot.innerHTML = 'GIÀ';
  aggiornaPassi(radice, dim, 1);
  assert.equal(lis[0].slot.innerHTML, 'GIÀ');
});

test('portaPassoInVista porta il passo al centro e gli dà il focus', () => {
  const calls = [];
  const li = elemento();
  li.scrollIntoView = (opz) => calls.push(['scroll', opz.block]);
  li.focus = (opz) => calls.push(['focus', opz.preventScroll]);
  const radice = elemento({ children: { '.step[data-passo="2"]': li } });
  portaPassoInVista(radice, 2);
  assert.deepEqual(calls, [['scroll', 'center'], ['focus', true]]);
  portaPassoInVista(radice, 9);
  assert.equal(calls.length, 2);
});
