/** Testata della dimostrazione: titolo, chip leggibili, link al concetto. */
import { escapeHtml, testoSicuro } from '../../core/math.js';
import { etichettaProva, etichettaTipo, etichettaVerifica, toneVerifica } from './etichette.js';
import { proveDi } from './dati.js';

function chip(testo, tono, titolo = '') {
  const attributo = titolo ? ` title="${escapeHtml(titolo)}"` : '';
  return `<span class="chip chip--${tono}"${attributo}>${escapeHtml(testo)}</span>`;
}

/** HTML della testata: tipo, prove d'esame (con punti se dichiarati), stato di verifica. */
export function renderTestata(dim, nodo, graph) {
  const chips = [chip(etichettaTipo(nodo.tipo), 'info')];
  for (const prova of proveDi(dim, graph)) {
    chips.push(chip(etichettaProva(prova.id), 'info', prova.titolo));
    if (prova.punti !== null) chips.push(chip(`${prova.punti} punti`, 'info'));
  }
  if (dim.verifica && typeof dim.verifica === 'object') {
    chips.push(chip(etichettaVerifica(dim.verifica.stato), toneVerifica(dim.verifica.stato)));
  }
  return `<header class="dim-testata">
<h1>${escapeHtml(testoSicuro(dim.titolo || dim.id))}</h1>
<div class="dim-chips">${chips.join('')}</div>
<p class="dim-testata__azioni"><a class="btn btn--ghost" href="#/nodo/${escapeHtml(String(nodo.id))}">Torna al concetto</a></p>
</header>`;
}
