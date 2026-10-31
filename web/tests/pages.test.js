import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as homePage from '../js/pages/home.js';
import * as grafoPage from '../js/pages/grafo.js';
import * as nodoPage from '../js/pages/nodo.js';
import * as eserciziPage from '../js/pages/esercizi.js';
import * as quizPage from '../js/pages/quiz.js';
import * as ripassoPage from '../js/pages/ripasso.js';
import * as fontiPage from '../js/pages/fonti.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const graphPath = path.join(__dirname, '..', 'graph.json');
const realGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

class StorageMemoria {
  #m = new Map();
  get length() { return this.#m.size; }
  key(i) { return [...this.#m.keys()][i] ?? null; }
  getItem(k) { return this.#m.has(k) ? this.#m.get(k) : null; }
  setItem(k, v) { this.#m.set(k, String(v)); }
}

test('fonti: etichettaFonte converte chiavi interne in nomi umani senza underscore', () => {
  assert.equal(fontiPage.etichettaFonte('LIBRO_CI'), 'Libro di testo (Calandrino, Immovilli)');
  assert.equal(fontiPage.etichettaFonte('LUCIDI_CASONI'), 'Lucidi del docente (Casoni)');
  assert.equal(fontiPage.etichettaFonte('ESSE3_2016'), 'Syllabus ESSE3 2016/17');
  assert.equal(fontiPage.etichettaFonte('CHIAVE_CUSTOM'), 'CHIAVE CUSTOM');
  assert.equal(fontiPage.etichettaFonte(null), 'Fonte');
});

test('fonti: render mostra stack-list mobile, tabella in scroll-x desktop, etichette URL leggibili e avviso diritti', () => {
  assert.equal(
    fontiPage.etichettaUrlFonte('https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo'),
    'Apri pagina (web.ing.unimo.it)'
  );
  const html = fontiPage.render({ graph: realGraph });
  assert.match(html, /class="stack-list fonti-mobile"/);
  assert.match(html, /class="scroll-x fonti-desktop"/);
  assert.match(html, /class="table tabella"/);
  assert.match(html, /Apri pagina \(web\.ing\.unimo\.it\)/);
  assert.match(html, /href="https:\/\/web\.ing\.unimo\.it\/wiki\/index\.php\/Libro_di_Testo"/);
  assert.match(html, /NON TROVATO/);
  assert.match(html, /Avviso sui diritti/);
  const visibile = html.replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visibile, /LIBRO_CI|LUCIDI_CASONI|ESSE3_2016|Libro_di_Testo|Materiale_Didattico|jsessionid/);
});

test('grafo: etichette umane, parola-intera nowrap e chipNodoLink tollerante ai nodi pendenti', () => {
  assert.equal(grafoPage.etichettaTipo('concetto'), 'Concetto');
  assert.equal(grafoPage.etichettaTipo('dimostrazione'), 'Dimostrazione');
  assert.equal(grafoPage.etichettaTipo('tipo_esercizio'), 'Esercizio guidato');
  assert.equal(grafoPage.etichettaPriorita('alta'), 'Priorità alta');
  assert.match(grafoPage.nomeArea(realGraph, 1), /Fourier/);
  assert.equal(
    grafoPage.formattaParoleIntere('Probabilità di equilibrio nascita–morte'),
    'Probabilità di equilibrio <span class="parola-intera">nascita–morte</span>'
  );
  assert.equal(
    grafoPage.formattaParoleIntere('Filtro passa-basso e CSMA/CD'),
    'Filtro <span class="parola-intera">passa-basso</span> e <span class="parola-intera">CSMA/CD</span>'
  );

  const mappa = new Map([
    ['serie-fourier', { id: 'serie-fourier', titolo: 'Serie di Fourier' }],
    ['dim-nascita-morte-equilibrio', { id: 'dim-nascita-morte-equilibrio', titolo: 'Probabilità di equilibrio nascita–morte' }],
  ]);
  const ok = grafoPage.chipNodoLink('serie-fourier', mappa);
  assert.match(ok, /href="#\/nodo\/serie-fourier"/);
  assert.match(ok, /Serie di Fourier/);
  const composto = grafoPage.chipNodoLink('dim-nascita-morte-equilibrio', mappa);
  assert.match(composto, /<span class="parola-intera">nascita–morte<\/span>/);
  const pendente = grafoPage.chipNodoLink('nodo-futuro', mappa);
  assert.doesNotMatch(pendente, /href=/);
  assert.match(pendente, /in arrivo/);
});

test('grafo: render raggruppa per area con card, Apri dimostrazione, filtri e zero ID grezzi', () => {
  const html = grafoPage.render({ graph: realGraph });
  assert.match(html, /id="grafo-ricerca"/);
  assert.match(html, /id="grafo-area"/);
  assert.match(html, /Area 1 —/);
  assert.match(html, /class="card nodo-card"/);
  assert.match(html, />Apri dimostrazione<\/a>/);
  assert.doesNotMatch(html, />Dimostrazione<\/a>/);
  assert.doesNotMatch(html, /tipo_esercizio|\bW[1-6]\b/);
});

test('home: render include Da dove partire (T5, T11, esercizi), parola-intera e tabella in scroll-x', () => {
  const html = homePage.render({ graph: realGraph });
  assert.match(html, /Da dove partire/);
  assert.match(html, /Prova T5 · 10 punti/);
  assert.match(html, /Prova T11 · 10 punti/);
  assert.match(html, /href="#\/esercizi"/);
  assert.match(html, /class="stack-list prove-mobile"/);
  assert.match(html, /class="scroll-x prove-desktop"/);
  assert.match(html, /class="table tabella"/);
  assert.match(html, /<span class="parola-intera">nascita–morte<\/span>/);
  assert.doesNotMatch(html, /tipo_esercizio|\bW[1-6]\b/);
});

test('esercizi: calcolaDifficolta e paragrafoConFormule unificato avvolgono punteggiatura in formula-gruppo', () => {
  assert.equal(eserciziPage.calcolaDifficolta({ area: 1, tempo_studio_min: 35, prerequisiti: [{}] }), 1);
  assert.equal(eserciziPage.calcolaDifficolta({ area: 3, tempo_studio_min: 35, prerequisiti: [{}] }), 2);
  assert.equal(eserciziPage.calcolaDifficolta({ area: 3, tempo_studio_min: 35, prerequisiti: [{}, {}] }), 3);
  assert.equal(eserciziPage.calcolaDifficolta({ difficolta: 2 }), 2);

  for (const segno of ['.', ',', ';', ':', ')']) {
    const inline = eserciziPage.paragrafoConFormule(`Valore $x=1$${segno} successivo.`);
    assert.match(inline, new RegExp(`<span class="formula-gruppo"><span class="formula-inline"[\\s\\S]*?<\\/span>\\${segno}<\\/span>`));
  }
  const voce = eserciziPage.paragrafoConFormule('Caso ($f_0$): attivo.', { blocchi: false });
  assert.match(voce, /<span class="formula-gruppo"><span class="formula-inline"[\s\S]*?<\/span>\):<\/span>/);
  const display = eserciziPage.paragrafoConFormule('Risultato $$\\int_0^T x(t)\\,dt$$ finale.');
  assert.match(display, /class="formula-box"/);
  assert.doesNotMatch(display, /<p>[^<]*<div class="formula-box"/);

  const html = eserciziPage.render({ graph: realGraph });
  assert.match(html, /Difficoltà 1\/3/);
  assert.match(html, /Difficoltà 2\/3/);
  assert.match(html, /Difficoltà 3\/3/);
  assert.match(html, /Prova E3/);
  assert.match(html, /class="formula-gruppo"/);
});

test('nodo: renderizza colonna prose, formula-gruppo anche in markdown, checklist, prerequisiti e dimostrazione', () => {
  const htmlConcetto = nodoPage.render({ graph: realGraph }, { id: 'serie-fourier' });
  assert.match(htmlConcetto, /class="nodo-checklist"/);
  assert.match(htmlConcetto, /class="formula-gruppo"/);
  assert.match(htmlConcetto, /Richiamo attivo/);
  assert.doesNotMatch(htmlConcetto, /\bW[1-6]\b|LIBRO_CI|tipo_esercizio/);

  const htmlDim = nodoPage.render({ graph: realGraph }, { id: 'dim-teorema-campionamento' });
  assert.match(htmlDim, /class="btn btn--primary" href="#\/dim\/dim-teorema-campionamento"/);

  const htmlAssente = nodoPage.render({ graph: realGraph }, { id: 'inesistente' });
  assert.match(htmlAssente, /in arrivo/);
});

test('ripasso: prossimoIntervallo segue 1-3-7-14 e protegge parole composte nella tabella', () => {
  assert.equal(ripassoPage.prossimoIntervallo(0, true), 1);
  assert.equal(ripassoPage.prossimoIntervallo(1, true), 3);
  assert.equal(ripassoPage.prossimoIntervallo(3, true), 7);
  assert.equal(ripassoPage.prossimoIntervallo(7, true), 14);
  assert.equal(ripassoPage.prossimoIntervallo(14, false), 0);

  const storage = new StorageMemoria();
  const html = ripassoPage.render({ graph: realGraph, storage });
  assert.match(html, /class="stack-list ripasso-mobile"/);
  assert.match(html, /class="scroll-x ripasso-desktop"/);
  assert.match(html, /class="table tabella"/);
  assert.match(html, /<span class="parola-intera">nascita–morte<\/span>/);
});

test('quiz page: render espone #quiz-root con intro prose', async () => {
  const html = await quizPage.render();
  assert.match(html, /id="quiz-root"/);
  assert.match(html, /Allenamento/);
});

test('tutte le pagine D4 e i 56 nodi non espongono mai null, undefined, NaN o badge W1-W6', () => {
  const storage = new StorageMemoria();
  const pagine = [
    homePage.render({ graph: realGraph }),
    grafoPage.render({ graph: realGraph }),
    eserciziPage.render({ graph: realGraph }),
    ripassoPage.render({ graph: realGraph, storage }),
    fontiPage.render({ graph: realGraph }),
    ...realGraph.nodi.map((n) => nodoPage.render({ graph: realGraph }, { id: n.id })),
  ];
  for (const html of pagine) {
    const senzaTag = html.replace(/<math[\s\S]*?<\/math>/g, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(senzaTag, /\b(?:null|undefined|NaN|W[1-6]|tipo_esercizio|LIBRO_CI|LUCIDI_CASONI|ESSE3_2016)\b/);
  }
});

test('B10: precache contiene tutti i file serviti sotto js/ e css/', () => {
  const manifestPath = path.join(__dirname, '..', 'precache-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const dir = path.join(__dirname, '..');
  const attesi = [];
  const cammina = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const pp = path.join(d, e.name);
      if (e.isDirectory()) cammina(pp);
      else attesi.push(path.relative(dir, pp));
    }
  };
  cammina(path.join(dir, 'js'));
  cammina(path.join(dir, 'css'));
  for (const f of attesi) assert.ok(manifest.includes(f), 'mancante in precache: ' + f);
});

test('La chiave usa la prima frase didattica, non il testo amministrativo', async () => {
  const { primaFrase, renderChiave } = await import('../js/pages/nodo/chiave.js');
  assert.equal(primaFrase('Una frase $x$. Una seconda $y$.'), 'Una frase $x$.');
  const html = renderChiave({ id: 'test', lezione: {
    riepilogo: 'Una frase $x$. Una seconda frase.', perche_ti_serve: 'Priorità alta e prova T1.',
    definizione_esame: { definizione: 'Altra definizione.' },
  } });
  assert.match(html, /Da ricordare/);
  assert.match(html, /Una frase/);
  assert.doesNotMatch(html, /Priorità|seconda frase|Altra definizione/);
  assert.match(renderChiave({ id: 'test', lezione: { definizione_esame: { definizione: 'Definizione. Altra.' } } }), /Definizione\./);
  assert.equal(primaFrase('Primo $x$ e secondo $y$. Altra frase.'), 'Primo $x$ e secondo $y$.');
});
