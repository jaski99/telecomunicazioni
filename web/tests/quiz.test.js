import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { leggiEsiti, registraEsito } from '../modules/quiz/esiti.js';
import {
  el,
  listaQuiz,
  normalizzaTesto,
  rispostaCorretta,
  descrizioneCorretta,
} from '../modules/quiz/logica.js';
import { costruisciStrutturaQuiz, mostraEsitoAllenamento, mostraRiepilogoFinale } from '../modules/quiz/vista.js';
import { montaQuiz } from '../modules/quiz/index.js';

class Memoria {
  #valori = new Map();
  getItem(key) { return this.#valori.has(key) ? this.#valori.get(key) : null; }
  setItem(key, value) { this.#valori.set(key, String(value)); }
}

class NodoFinto {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.attrs = {};
    this.listeners = {};
    this.dataset = {};
    this.style = { setProperty(k, v) { this[k] = v; } };
    this.className = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.classList = {
      toggle: (cls, force) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        if (force) set.add(cls); else set.delete(cls);
        this.className = [...set].join(' ');
      },
    };
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  append(...items) {
    for (const it of items) {
      if (it == null) continue;
      this.children.push(typeof it === 'string' ? { tagName: '#TEXT', textContent: it, children: [] } : it);
    }
  }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  dispatch(ev) {
    if (ev === 'click' && typeof this.onclick === 'function') this.onclick();
    for (const fn of this.listeners[ev] || []) fn({ preventDefault() {} });
  }
  querySelectorAll(sel) {
    if (sel === 'input[name="risposta"]') return this.findAll((n) => n.name === 'risposta' || n.attrs.name === 'risposta');
    if (sel === 'input[data-buco]') return this.findAll((n) => 'data-buco' in n.attrs);
    if (sel === 'label.quiz-option') return this.findAll((n) => n.className.includes('quiz-option') && n.tagName === 'LABEL');
    return [];
  }
  querySelector(sel) {
    if (sel === 'input[name="risposta"]:checked') return this.querySelectorAll('input[name="risposta"]').find((n) => n.checked) || null;
    if (sel === 'input') return this.findAll((n) => n.tagName === 'INPUT')[0] || null;
    return null;
  }
  findAll(pred, out = []) {
    if (pred(this)) out.push(this);
    for (const c of this.children) if (c.findAll) c.findAll(pred, out);
    return out;
  }
}

const valido = (id = 'q-uno') => ({
  item_id: id,
  nodo_id: 'nodo-valido',
  corretto: true,
  modalita: 'allenamento',
  ts: '2026-10-29T12:00:00.000Z',
});

test('registra e legge esiti nella chiave contrattuale', () => {
  const storage = new Memoria();
  assert.equal(registraEsito(storage, valido()), true);
  assert.deepEqual(leggiEsiti(storage), [valido()]);
  assert.ok(storage.getItem('tlc-kg:esiti-quiz:v1'));
});

test('rifiuta esiti incompleti e recupera storage corrotto', () => {
  const storage = new Memoria();
  assert.equal(registraEsito(storage, { item_id: 'x' }), false);
  storage.setItem('tlc-kg:esiti-quiz:v1', '{');
  assert.deepEqual(leggiEsiti(storage), []);
});

test('mantiene soltanto gli ultimi 2000 risultati', () => {
  const storage = new Memoria();
  storage.setItem('tlc-kg:esiti-quiz:v1', JSON.stringify(Array.from({ length: 2000 }, (_, i) => valido(`q-${i}`))));
  assert.equal(registraEsito(storage, valido('q-new')), true);
  const all = leggiEsiti(storage);
  assert.equal(all.length, 2000);
  assert.equal(all.at(-1).item_id, 'q-new');
  assert.equal(all[0].item_id, 'q-1');
});

test('logica quiz valida scelta multipla, vero/falso e completamento formula', () => {
  assert.equal(normalizzaTesto('  Omega^2   Hz '), 'omega^2 hz');
  assert.equal(listaQuiz({ elementi: [{ id: 'q-1' }] }).length, 1);
  assert.equal(listaQuiz([{ id: 'q-1' }]).length, 1);

  const sm = {
    tipo: 'scelta_multipla',
    corretta: 'b',
    opzioni: [{ id: 'a', testo: 'Errata' }, { id: 'b', testo: 'Integratore' }],
  };
  assert.equal(rispostaCorretta(sm, 'b'), true);
  assert.equal(rispostaCorretta(sm, 'a'), false);
  assert.equal(descrizioneCorretta(sm), 'Integratore');

  const vf = { tipo: 'vero_falso', risposta_corretta: false };
  assert.equal(rispostaCorretta(vf, 'false'), true);
  assert.equal(rispostaCorretta(vf, 'true'), false);
  assert.equal(descrizioneCorretta(vf), 'Falso.');

  const cf = { tipo: 'completamento_formula', soluzioni: { 1: ['ω²', 'omega^2'] } };
  assert.equal(rispostaCorretta(cf, ['omega^2']), true);
  assert.equal(rispostaCorretta(cf, ['altro']), false);
  assert.match(descrizioneCorretta(cf), /omega\^2/);
});

test('vista quiz e montaQuiz gestiscono tabs, progress, conferma, feedback e smontaggio', () => {
  const prevDoc = globalThis.document;
  globalThis.document = {
    createElement: (t) => new NodoFinto(t),
    createTextNode: (t) => ({ tagName: '#TEXT', textContent: String(t), children: [] }),
  };
  try {
    assert.ok(el('span', { className: 'chip' }, 'ok'));
    const vistaRoot = new NodoFinto('div');
    const refs = costruisciStrutturaQuiz(vistaRoot, 3);
    assert.equal(refs.progress.getAttribute('aria-valuemax'), '3');
    mostraEsitoAllenamento(refs.feedback, { tipo: 'vero_falso', risposta_corretta: true, spiegazione: 'Spieg.' }, true, 'true', () => {});
    assert.match(refs.feedback.className, /callout--ok/);
    mostraRiepilogoFinale(refs.feedback, 'allenamento', [{ item: { tipo: 'vero_falso', domanda: 'D?', risposta_corretta: true, spiegazione: 'S.' }, correct: true, answer: 'true' }], () => {});
    assert.equal(refs.feedback.hidden, false);

    const root = new NodoFinto('div');
    const storage = new Memoria();
    const mathChiamate = [];
    const navigazioni = [];
    const quizData = {
      elementi: [{
        id: 'q-test',
        nodo_id: 'serie-fourier',
        tipo: 'vero_falso',
        domanda: 'Enunciato di prova $x=1$',
        risposta_corretta: true,
        spiegazione: 'Perché sì.',
      }],
    };
    const smonta = montaQuiz(root, {
      quiz: quizData,
      graph: { nodi: [{ id: 'serie-fourier' }] },
      storage,
      naviga: (h) => navigazioni.push(h),
      renderMath: (node) => mathChiamate.push(node),
    });
    assert.ok(mathChiamate.length >= 1);
    const form = root.findAll((n) => n.tagName === 'FORM')[0];
    const radios = form.querySelectorAll('input[name="risposta"]');
    assert.equal(radios.length, 2);
    radios[0].checked = true;
    radios[0].dispatch('change');

    form.dispatch('submit');
    assert.equal(leggiEsiti(storage).length, 1);
    assert.equal(leggiEsiti(storage)[0].corretto, true);

    const calloutOk = root.findAll((n) => n.className.includes('callout--ok'));
    assert.equal(calloutOk.length, 1);
    const linkNodo = root.findAll((n) => n.textContent === 'Riapri il nodo')[0];
    linkNodo.dispatch('click');
    assert.deepEqual(navigazioni, ['#/nodo/serie-fourier']);
    smonta();
  } finally {
    globalThis.document = prevDoc;
  }
});

test('dati demo e modulo non inseriscono contenuti utente come HTML', async () => {
  const module = await readFile(new URL('../modules/quiz/index.js', import.meta.url), 'utf8');
  const logica = await readFile(new URL('../modules/quiz/logica.js', import.meta.url), 'utf8');
  const vista = await readFile(new URL('../modules/quiz/vista.js', import.meta.url), 'utf8');
  const demo = await readFile(new URL('../modules/quiz/demo.html', import.meta.url), 'utf8');
  assert.match(module, /textContent/);
  assert.doesNotMatch(module, /\.innerHTML\s*=/);
  assert.doesNotMatch(logica, /\.innerHTML\s*=/);
  assert.doesNotMatch(vista, /\.innerHTML\s*=/);
  assert.match(demo, /montaQuiz/);
  assert.match(demo, /lang="it"/);
});
