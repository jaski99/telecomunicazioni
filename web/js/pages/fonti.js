/**
 * Pagina #/fonti: fonti dichiarate nel grafo, incertezze (NON TROVATO)
 * e avviso sui diritti. Mobile: .stack-list di card; Desktop: .table in .scroll-x.
 */

import { testoSicuro, escapeHtml } from '../core/math.js';
import { formattaParoleIntere } from './grafo.js';

const NOMI_FONTI = {
  LIBRO_CI: 'Libro di testo (Calandrino, Immovilli)',
  LUCIDI_CASONI: 'Lucidi del docente (Casoni)',
  PROGRAMMA: 'Programma del corso',
  ESSE3_2016: 'Syllabus ESSE3 2016/17',
  FILE1: 'Appunti di studente (file 1)',
  FILE2: "Raccolta domande d'esame (file 2)",
  FILE3: 'Dimostrazioni svolte (file 3)',
  RICOSTRUZIONE: 'Ricostruzione didattica',
};

/** Restituisce un'etichetta umana senza underscore per una chiave fonte. */
export function etichettaFonte(chiave) {
  const k = testoSicuro(chiave).trim();
  if (!k) return 'Fonte';
  if (NOMI_FONTI[k]) return NOMI_FONTI[k];
  return k.replace(/_/g, ' ');
}

/** Costruisce un'etichetta leggibile per un indirizzo esterno senza esporre path grezzi o jsessionid. */
export function etichettaUrlFonte(url) {
  const raw = testoSicuro(url).trim();
  try {
    const host = new URL(raw).hostname;
    return host ? `Apri pagina (${host})` : 'Apri pagina';
  } catch (_err) {
    return 'Apri pagina';
  }
}

function renderUrlFonte(url) {
  if (!url) return '<span class="chip chip--danger">NON TROVATO</span>';
  const u = escapeHtml(testoSicuro(url).trim());
  const etichetta = escapeHtml(etichettaUrlFonte(url));
  return `<a class="fonte-url" href="${u}" rel="noopener" target="_blank">${etichetta}</a>`;
}

export function render(ctx) {
  const meta = ctx && ctx.graph && ctx.graph.meta ? ctx.graph.meta : {};
  const voci = meta && meta.fonti && typeof meta.fonti === 'object'
    ? Object.entries(meta.fonti).filter(([, f]) => f && typeof f === 'object')
    : [];

  const cardsHtml = voci.length === 0
    ? `<li class="card"><p>Nessuna fonte dichiarata nel grafo corrente.</p></li>`
    : voci.map(([chiave, f]) => {
      const nome = formattaParoleIntere(etichettaFonte(chiave));
      const desc = formattaParoleIntere(f.descrizione || 'NON TROVATO');
      const nota = formattaParoleIntere(f.nota || 'Nessuna nota aggiuntiva.');
      return `<li class="card fonte-card">
        <div class="card__title">${nome}</div>
        <p>${desc}</p>
        <div class="fonte-card__url">${renderUrlFonte(f.url)}</div>
        <p class="fonte-card__nota">${nota}</p>
      </li>`;
    }).join('');

  const righeHtml = voci.length === 0
    ? `<tr><td colspan="4">Nessuna fonte dichiarata nel grafo corrente.</td></tr>`
    : voci.map(([chiave, f]) => {
      const nome = formattaParoleIntere(etichettaFonte(chiave));
      const desc = formattaParoleIntere(f.descrizione || 'NON TROVATO');
      const nota = formattaParoleIntere(f.nota || '');
      return `<tr>
        <td><strong>${nome}</strong></td>
        <td>${desc}</td>
        <td>${renderUrlFonte(f.url)}</td>
        <td>${nota}</td>
      </tr>`;
    }).join('');

  return `<h1>Fonti e diritti</h1>
<div class="prose">
  <p>Elenco delle fonti dichiarate nel grafo di studio. I collegamenti usano solo gli indirizzi verificati del contratto; dove un dato manca nelle fonti aperte si legge <strong>NON TROVATO</strong>.</p>
</div>
<section class="fonti-sezione">
  <h2>Fonti del materiale</h2>
  <ul class="stack-list fonti-mobile">${cardsHtml}</ul>
  <div class="scroll-x fonti-desktop" tabindex="0" role="region" aria-label="Tabella delle fonti">
    <table class="table tabella">
      <thead>
        <tr><th scope="col">Fonte</th><th scope="col">Descrizione</th><th scope="col">Indirizzo</th><th scope="col">Nota</th></tr>
      </thead>
      <tbody>${righeHtml}</tbody>
    </table>
  </div>
</section>
<section class="callout callout--warn fonti-diritti">
  <div class="callout__title">Avviso sui diritti</div>
  <p>Questo sito riformula a parole proprie i temi della raccolta di domande d'esame e delle dimostrazioni degli appunti di studio.</p>
  <p>I PDF degli appunti e della raccolta non sono mai pubblicati, né integralmente né in parti significative; nessun testo integrale di PDF o quiz è presente nel repository.</p>
  <p>Le informazioni su punteggi, date, soglie e struttura dell'esame prive di riscontro nelle fonti aperte sono segnate NON TROVATO e i riferimenti di pagina restano indizi degli appunti.</p>
</section>`;
}
