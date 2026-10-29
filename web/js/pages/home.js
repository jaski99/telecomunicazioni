/**
 * Pagina #/ - percorso d'esame (T1-T17, E1-E9, esercizi, quiz, priorita',
 * punti dichiarati). Renderizza tutto dal grafo: nessuna costante sul
 * numero di nodi o di aree.
 */

import { elenco, linkNodo, chipStato } from '../ui.js';
import { testoSicuro, escapeHtml } from '../core/math.js';

export function render(ctx) {
  const { graph } = ctx;
  const nodi = Array.isArray(graph.nodi) ? graph.nodi : [];
  const prove = Array.isArray(graph.esame) ? graph.esame : [];
  const esistente = new Set(nodi.map((n) => n && n.id));

  const esistenteCheck = (id) => esistente.has(String(id));
  const puntiProva = (id) => {
    const p = prove.find((pr) => pr && pr.id === id);
    return p && p.punti !== undefined ? testoSicuro(p.punti) : 'NON TROVATO';
  };

  // Raggruppa per area (derivata dai dati, senza costanti).
  const aree = [];
  for (const n of nodi) {
    if (!n || typeof n.area !== 'number') continue;
    if (!aree.includes(n.area)) aree.push(n.area);
  }
  aree.sort((a, b) => a - b);

  // Raggruppa per priorita (derivata dai dati).
  const perPriorita = { alta: [], media: [], bassa: [] };
  for (const n of nodi) {
    if (!n) continue;
    const livello = n.priorita && n.priorita.livello ? String(n.priorita.livello) : 'bassa';
    if (perPriorita[livello]) perPriorita[livello].push(n);
  }

  let html = `<h1>Percorso d'esame</h1>
<p>Ordine consigliato per lo studio: le dimostrazioni P0 prima (T5, T11),
poi i blocchi segnali e sistemi, trasmissione numerica, modulazioni, reti.
I punti sono indicati solo quando dichiarati dalla prova d'esame (T5 e
T11: 10 punti); per tutte le altre domande il punteggio è <em>NON TROVATO</em>.</p>

<section>
  <h2>Prove d'esame</h2>
  <table class="tabella">
    <thead>
      <tr><th>Prova</th><th>Titolo</th><th>Punti</th><th>Nodi collegati</th><th>Stato</th></tr>
    </thead>
    <tbody>`;
  for (const pr of prove) {
    if (!pr) continue;
    const nodiHtml = Array.isArray(pr.nodi)
      ? pr.nodi.map((id) => linkNodo(id, id, esistenteCheck(id))).join(' ')
      : '';
    html += `<tr>
      <td><strong>${escapeHtml(testoSicuro(pr.id))}</strong></td>
      <td>${escapeHtml(testoSicuro(pr.titolo || ''))}</td>
      <td>${testoSicuro(puntiProva(pr.id)) === '10' ? '<span class="punti-dieci">10 punti</span>' : testoSicuro(puntiProva(pr.id))}</td>
      <td>${nodiHtml}</td>
      <td>${chiaveProvaStato(pr, esistenteCheck)}</td>
    </tr>`;
  }
  html += `</tbody></table>
  <p class="note">Prove M (quiz) e I (introduzione alle reti) sono gestite dal modulo quiz e dalla lezione di rete, quando disponibili.</p>
</section>

<section>
  <h2>Priorita di studio</h2>
  ${prioritaBlocco('alta', 'P0 / alta', perPriorita.alta)}
  ${prioritaBlocco('media', 'P1 / media', perPriorita.media)}
  ${prioritaBlocco('bassa', 'P3-P4 / bassa', perPriorita.bassa)}
</section>

<section>
  <h2>Nodi per area</h2>
  ${aree.map((a) => {
    const nodiArea = nodi.filter((n) => n && n.area === a);
    const elencoHtml = nodiArea.map((n) => {
      const tipo = testoSicuro(n.tipo);
      const prio = n.priorita && n.priorita.livello ? testoSicuro(n.priorita.livello) : '-';
      return `<li><a href="#/nodo/${escapeHtml(String(n.id))}">${escapeHtml(testoSicuro(n.titolo || n.id))}</a> <span class="badge">${escapeHtml(tipo)}</span> <span class="badge">${escapeHtml(prio)}</span></li>`;
    }).join('');
    return `<h3>Area ${a}</h3><ul>${elencoHtml}</ul>`;
  }).join('')}
</section>`;
  return html;
}

function prioritaBlocco(chiave, etichetta, lista) {
  const items = lista.map((n) => {
    const punti = n.domande_esame && n.domande_esame.some((id) => ['T5', 'T11'].includes(String(id)))
      ? ' (10 punti)' : '';
    return `<li><a href="#/nodo/${escapeHtml(String(n.id))}">${escapeHtml(testoSicuro(n.titolo || n.id))}</a>${escapeHtml(punti)}</li>`;
  }).join('');
  return items ? `<h3>${etichetta}</h3><ul>${items}</ul>` : '';
}

function chiaveProvaStato(pr, esiste) {
  const nodiOk = Array.isArray(pr.nodi) && pr.nodi.every((id) => esiste(id));
  if (!nodiOk) return chipStato('in arrivo', 'in-arrivo');
  return chipStato('disponibile', 'ok');
}
