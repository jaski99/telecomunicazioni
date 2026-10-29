/**
 * Pagina #/fonti: fonti dichiarate, incertezze (NON TROVATO) e avviso
 * diritti. Solo URL della allowlist di CONTRACTS.md sez. 5.
 */

import { elenco, renderMarkdown } from '../ui.js';
import { testoSicuro, escapeHtml } from '../core/math.js';

const AVVISO_DIRITTI = `Questo sito riformula a parole proprie i temi della raccolta di domande d'esame (file2) e delle dimostrazioni degli appunti (file1, file3).
I PDF degli appunti e della raccolta non sono mai pubblicati, né integralmente né in parti significative; nessun testo integrale di PDF o quiz è presente nel repository pubblico.
Le informazioni su punteggi, date, soglie e struttura dell'esame che non riscontrano nelle fonti aperte sono segnate 'NON TROVATO': non sono state inventate.
Le referenze 'p. x.y' sono indizi degli appunti, non corrispondenze verificate con l'edizione adottata del libro di testo (edizione NON TROVATA).`;

export function render(ctx) {
  const { graph } = ctx;
  const meta = graph && graph.meta ? graph.meta : {};
  const fonti = meta && meta.fonti && typeof meta.fonti === 'object'
    ? Object.entries(meta.fonti)
    : [];

  let html = `<h1>Fonti</h1>
<p>Elenco delle fonti dichiarate nel grafo. I collegamenti usano solo URL della allowlist prevista dal contratto di progetto; dove un dato manca, si legge 'NON TROVATO'.</p>
<table class="tabella">
<thead><tr><th>Chiave</th><th>Descrizione</th><th>URL</th><th>Nota</th></tr></thead>
<tbody>`;
  if (fonti.length === 0) {
    html += `<tr><td colspan="4" class="avviso">Nessuna fonte dichiarata (file graph.json/meta non caricato o senza fonti).</td></tr>`;
  } else {
    for (const [chiave, f] of fonti) {
      if (!f || typeof f !== 'object') continue;
      const url = f.url ? `<a href="${escapeHtml(String(f.url))}" rel="noopener" target="_blank">${escapeHtml(String(f.url))}</a>` : '<span class="chip chip-avviso">NON TROVATO</span>';
      html += `<tr>
        <td><strong>${escapeHtml(String(chiave))}</strong></td>
        <td>${escapeHtml(testoSicuro(f.descrizione || ''))}</td>
        <td>${url}</td>
        <td>${escapeHtml(testoSicuro(f.nota || ''))}</td>
      </tr>`;
    }
  }
  html += '</tbody></table>';
  html += `<section class="avviso-box"><h3>Avviso diritti</h3>${renderMarkdown(AVVISO_DIRITTI)}</section>`;
  return html;
}
