/**
 * Pagina #/ — Percorso d'esame: intro .prose, card "Da dove partire"
 * (T5, T11, Esercizi) e prove d'esame (.stack-list < 768 px, .table in .scroll-x >= 768 px).
 */

import { testoSicuro, escapeHtml } from '../core/math.js';
import { chipNodoLink, formattaParoleIntere } from './grafo.js';

const TIPI_PROVA = {
  teoria: 'Teoria',
  esercizio: 'Esercizio',
  quiz: 'Quesito a scelta',
  intro_reti: 'Introduzione alle reti',
};

function etichettaTipoProva(tipo) {
  const t = testoSicuro(tipo).trim();
  return TIPI_PROVA[t] || t.replace(/_/g, ' ') || 'Prova';
}

function renderPunti(punti) {
  const p = testoSicuro(punti).trim();
  if (p === '10') return '<span class="chip chip--warn">10 punti</span>';
  return `<span class="chip">${escapeHtml(p || 'NON TROVATO')}</span>`;
}

function renderStatoProva(pr, mappa) {
  const ok = Array.isArray(pr.nodi) && pr.nodi.length > 0 && pr.nodi.every((id) => mappa.has(String(id)));
  return ok
    ? '<span class="chip chip--ok">Disponibile</span>'
    : '<span class="chip chip--warn">In arrivo</span>';
}

function cardPartenza({ badge, titolo, testo, href, labelBtn, ghost = false }) {
  const clsBtn = ghost ? 'btn btn--ghost' : 'btn btn--primary';
  return `<article class="card partenza-card">
    <div class="chip-row"><span class="chip chip--warn">${escapeHtml(badge)}</span></div>
    <h3 class="partenza-card__titolo">${escapeHtml(titolo)}</h3>
    <p>${escapeHtml(testo)}</p>
    <div class="partenza-card__azioni">
      <a class="${clsBtn}" href="${escapeHtml(href)}">${escapeHtml(labelBtn)}</a>
    </div>
  </article>`;
}

export function render(ctx) {
  const graph = (ctx && ctx.graph) || {};
  const nodi = (Array.isArray(graph.nodi) ? graph.nodi : []).filter(Boolean);
  const prove = (Array.isArray(graph.esame) ? graph.esame : []).filter(Boolean);
  const mappa = new Map(nodi.map((n) => [String(n.id), n]));
  const nEsercizi = nodi.filter((n) => n.tipo === 'tipo_esercizio').length;

  const t5Href = mappa.has('dim-pam-due-spettri') ? '#/dim/dim-pam-due-spettri' : '#/grafo';
  const t11Href = mappa.has('dim-quadripoli-passa-basso-equivalente')
    ? '#/dim/dim-quadripoli-passa-basso-equivalente'
    : '#/grafo';

  const partenzaHtml = [
    cardPartenza({
      badge: 'Prova T5 · 10 punti',
      titolo: 'Segnali PAM e due spettri',
      testo: 'Dimostrazione ad alta priorità con punteggio dichiarato nella raccolta: ricava la componente continua e discreta dello spettro.',
      href: t5Href,
      labelBtn: 'Studia T5',
    }),
    cardPartenza({
      badge: 'Prova T11 · 10 punti',
      titolo: 'Equivalente passa-basso dei quadripoli',
      testo: 'Seconda dimostrazione da 10 punti documentati: collega il filtraggio passa-banda alla rappresentazione in inviluppo complesso.',
      href: t11Href,
      labelBtn: 'Studia T11',
    }),
    cardPartenza({
      badge: nEsercizi > 0 ? `${nEsercizi} esercizi guidati` : 'Esercizi d’esame',
      titolo: "Esercizi ricorrenti d'esame",
      testo: 'Spettri rettangolari, reti RC e CR, condizione di Nyquist, processi gaussiani e codifiche di linea PAM.',
      href: '#/esercizi',
      labelBtn: 'Vai agli esercizi',
      ghost: true,
    }),
  ].join('');

  const cardsProve = prove.length === 0
    ? `<li class="card"><p>Nessuna prova d'esame caricata nel grafo corrente.</p></li>`
    : prove.map((pr) => {
      const id = escapeHtml(testoSicuro(pr.id));
      const titolo = formattaParoleIntere(pr.titolo || '');
      const nodiChips = Array.isArray(pr.nodi) && pr.nodi.length
        ? pr.nodi.map((nid) => chipNodoLink(nid, mappa)).join('')
        : '<span class="chip">Nessun nodo collegato</span>';
      return `<li class="card prova-card">
        <div class="chip-row">
          <span class="chip chip--info">Prova ${id}</span>
          <span class="chip">${escapeHtml(etichettaTipoProva(pr.tipo))}</span>
          ${renderPunti(pr.punti)}
          ${renderStatoProva(pr, mappa)}
        </div>
        <div class="card__title">${titolo}</div>
        <div class="chip-row">${nodiChips}</div>
      </li>`;
    }).join('');

  const righeProve = prove.length === 0
    ? `<tr><td colspan="5">Nessuna prova d'esame caricata nel grafo corrente.</td></tr>`
    : prove.map((pr) => {
      const id = escapeHtml(testoSicuro(pr.id));
      const titolo = formattaParoleIntere(pr.titolo || '');
      const nodiChips = Array.isArray(pr.nodi) && pr.nodi.length
        ? `<div class="chip-row">${pr.nodi.map((nid) => chipNodoLink(nid, mappa)).join('')}</div>`
        : '<span class="chip">Nessun nodo</span>';
      return `<tr>
        <td><strong>${id}</strong><div class="prova-tipo-cell">${escapeHtml(etichettaTipoProva(pr.tipo))}</div></td>
        <td>${titolo}</td>
        <td>${renderPunti(pr.punti)}</td>
        <td>${nodiChips}</td>
        <td>${renderStatoProva(pr, mappa)}</td>
      </tr>`;
    }).join('');

  return `<h1>Percorso d'esame</h1>
<div class="prose">
  <p>Ordine consigliato per lo studio di Fondamenti di Telecomunicazioni: parti dalle dimostrazioni T5 e T11, prosegui con segnali, sistemi, trasmissione numerica, modulazioni e reti. I punti sono riportati solo dove documentati (T5 e T11: 10 punti); negli altri casi il punteggio resta <em>NON TROVATO</em>.</p>
</div>
<section class="home-sezione">
  <h2>Da dove partire</h2>
  <div class="partenza-grid">${partenzaHtml}</div>
</section>
<section class="home-sezione">
  <h2>Prove d'esame</h2>
  <ul class="stack-list prove-mobile">${cardsProve}</ul>
  <div class="scroll-x prove-desktop" tabindex="0" role="region" aria-label="Tabella delle prove d'esame">
    <table class="table tabella">
      <thead>
        <tr><th scope="col">Prova</th><th scope="col">Titolo</th><th scope="col">Punti</th><th scope="col">Nodi collegati</th><th scope="col">Stato</th></tr>
      </thead>
      <tbody>${righeProve}</tbody>
    </table>
  </div>
</section>`;
}
