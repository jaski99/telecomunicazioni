import { test } from 'node:test';
import assert from 'node:assert/strict';
import { azioneTasto, descriviBersaglio } from '../js/pages/dim/tastiera.js';

const bersaglio = (tag, extra = {}) => descriviBersaglio({ tagName: tag, isContentEditable: false, closest: () => extra.scroll ? {} : null });

test('→ e Spazio vanno avanti, ← indietro', () => {
  const corpo = bersaglio('LI');
  assert.equal(azioneTasto('ArrowRight', corpo), 'avanti');
  assert.equal(azioneTasto(' ', corpo), 'avanti');
  assert.equal(azioneTasto('ArrowLeft', corpo), 'indietro');
  assert.equal(azioneTasto('a', corpo), null);
});

test('non agisce quando il focus è in un campo di testo o in un\'area scorrevole', () => {
  assert.equal(azioneTasto('ArrowRight', bersaglio('INPUT')), null);
  assert.equal(azioneTasto('ArrowLeft', bersaglio('TEXTAREA')), null);
  assert.equal(azioneTasto('ArrowRight', bersaglio('DIV', { scroll: true })), null);
  assert.equal(azioneTasto('ArrowRight', descriviBersaglio({ tagName: 'DIV', isContentEditable: true, closest: () => null })), null);
});

test('Spazio è ignorato sui controlli interattivi, le frecce no', () => {
  for (const tag of ['BUTTON', 'A', 'SUMMARY', 'SELECT']) {
    assert.equal(azioneTasto(' ', bersaglio(tag)), null, tag);
  }
  assert.equal(azioneTasto('ArrowRight', bersaglio('BUTTON')), 'avanti');
});

test('i modificatori disattivano la scorciatoia', () => {
  assert.equal(azioneTasto('ArrowRight', bersaglio('BODY'), { ctrlKey: true }), null);
  assert.equal(azioneTasto('ArrowLeft', bersaglio('BODY'), { metaKey: true }), null);
  assert.equal(azioneTasto('ArrowLeft', bersaglio('BODY'), { altKey: true }), null);
});

test('descriviBersaglio gestisce bersagli assenti', () => {
  assert.deepEqual(descriviBersaglio(null), { tag: '', editabile: false, interattivo: false, scorrevole: false });
  assert.equal(azioneTasto('ArrowRight', null), null);
});
