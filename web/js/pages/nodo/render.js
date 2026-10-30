/** web/js/pages/nodo/render.js — owner E1.
 * Orchestratore del rendering della scheda nodo.
 */
import { testoSicuro, escapeHtml } from '../../core/math.js';
import { nomeArea, etichettaTipo, etichettaPriorita, chipNodoLink, formattaParoleIntere } from '../grafo.js';
import { etichettaFonte, etichettaUrlFonte } from '../fonti.js';
import { renderChiave, renderScenario, renderAnalogia } from './chiave.js';
import { renderLezione, resetContatori } from './sezioni.js';
import { blocchi } from './util.js';
import { indiceHTML } from '../../layout/indice.js';
import { navSequenzaHTML } from '../../layout/sequenza.js';

const esc = (s) => escapeHtml(testoSicuro(s));

export function render(ctx, params) {
  resetContatori();
  const graph = (ctx && ctx.graph) || {};
  const nodi = (Array.isArray(graph.nodi) ? graph.nodi : []).filter(Boolean);
  const mappa = new Map(nodi.map((n) => [String(n.id), n]));
  const richiesto = testoSicuro(params && params.id);
  const nodo = mappa.get(richiesto);
  if (!nodo) {
    return `<h1>Argomento non trovato</h1><div class="callout callout--warn"><p>Il nodo <strong>${escapeHtml(richiesto)}</strong> non è ancora disponibile (in arrivo).</p></div>`;
  }
  const titArea = nomeArea(graph, nodo.area);
  const prereq = Array.isArray(nodo.prerequisiti) ? nodo.prerequisiti : [];
  const domande = Array.isArray(nodo.domande_esame) ? nodo.domande_esame : [];
  const fonti = Array.isArray(nodo.fonti) ? nodo.fonti.filter(Boolean) : [];
  const risorse = Array.isArray(nodo.risorse) ? nodo.risorse.filter((r) => r && r.url) : [];
  const lezione = nodo.lezione;

  const chiaveHtml = nodo.perche_ti_serve ? renderChiave(nodo) : '';
  const scenarioHtml = renderScenario(nodo);
  const analogiaHtml = renderAnalogia(lezione);
  const lezioneHtml = lezione ? renderLezione(lezione) : '';

  // Indice: voci dalle h2 numerate, ancore -> #/nodo/<id>?sezione=<n>
  const indiceVoci = [];
  if (lezioneHtml) {
    for (const m of lezioneHtml.matchAll(/<h2[^>]*><span class="sezione__num">(\d+)<\/span>([^<]+)<\/h2>/g)) {
      const num = m[1];
      const titolo = m[2].trim();
      if (titolo) indiceVoci.push({ id: `sez-${num}`, titolo, href: `#/nodo/${esc(String(nodo.id))}?sezione=${num}`, livello: 2 });
    }
  }
  const indiceHtml = indiceHTML(indiceVoci);

  const ctaDim = nodo.dimostrazione
    ? `<div class="nodo-azioni"><a class="btn btn--primary" href="#/dim/${escapeHtml(String(nodo.id))}">Studia la dimostrazione</a></div>`
    : '';

  return `<div class="nodo-testata">
  <h1>${formattaParoleIntere(nodo.titolo || nodo.id)}</h1>
  <div class="chip-row">
    <span class="chip">Area ${escapeHtml(String(nodo.area || 1))}${titArea ? ' · ' + escapeHtml(titArea) : ''}</span>
    <span class="chip chip--info">${escapeHtml(etichettaTipo(nodo.tipo))}</span>
    <span class="chip">${escapeHtml(etichettaPriorita(nodo.priorita && nodo.priorita.livello))}</span>
    ${nodo.tempo_studio_min ? `<span class="chip">${escapeHtml(String(nodo.tempo_studio_min))} min</span>` : ''}
    ${domande.map((d) => `<span class="chip chip--warn">Prova ${escapeHtml(testoSicuro(d))}</span>`).join('')}
  </div>
  ${ctaDim}
</div>
${chiaveHtml}
${scenarioHtml}
${analogiaHtml}
<nav class="indice-in-testa" aria-label="In questa scheda">${indiceHtml || '<p>Indice non disponibile.</p>'}</nav>
<section class="nodo-corpo prose">${lezioneHtml}</section>
<section class="nodo-sezione prose">
  <h2>Cosa si deve sapere</h2>
  ${blocchi(nodo.sapere)}
</section>
<section class="nodo-sezione">
  <h2>Prerequisiti</h2>
  <div class="chip-row">${prereq.length ? prereq.map((p) => chipNodoLink(p && p.id, mappa)).join('') : '<span class="chip chip--ok">Nessun prerequisito richiesto</span>'}</div>
</section>
<section class="nodo-sezione prose">
  <h2>Fonti</h2>
  ${fonti.length ? `<ul>${fonti.map((f) => `<li><strong>${escapeHtml(etichettaFonte(f.chiave))}</strong>: ${escapeHtml(testoSicuro(f.rif))}</li>`).join('')}</ul>` : '<p>Nessuna fonte dichiarata.</p>'}
  ${risorse.length ? `<h3>Risorse di approfondimento</h3><div class="chip-row">${risorse.map((r) => `<a class="btn btn--ghost" href="${escapeHtml(String(r.url))}" rel="noopener" target="_blank">${escapeHtml(testoSicuro(r.titolo || etichettaUrlFonte(r.url)))}</a>`).join('')}</div>` : ''}
</section>
${navSequenzaHTML(graph, nodo.id)}`;
}
