/** Pagina #/nodo/<id>: colonna .prose, checklist criteri, prerequisiti, dimostrazione e lezione. */
import { renderMarkdown } from '../ui.js';
import { testoSicuro, escapeHtml, tokenizzaMatematica, formulaBlock, formulaInline, devePromuovereInDisplay, formulaIsolata } from '../core/math.js';
import { renderFigura } from '../figure/index.js';
import { etichettaTipo, etichettaPriorita, nomeArea, chipNodoLink } from './grafo.js';
import { etichettaFonte } from './fonti.js';

function puliziaTesto(testo) {
  return testoSicuro(testo).replace(/_{2,}/g, '[…]').replace(/(?:,\s*di competenza di|\s+da)\s+W[1-6]\b/g, '');
}

function blocchiFormule(testo, prefisso = '') {
  const s = puliziaTesto(testo);
  if (!s) return '';
  const tokens = tokenizzaMatematica(s);
  const isolata = !prefisso && formulaIsolata(tokens);
  const out = [];
  let buf = prefisso ? `<strong>${escapeHtml(prefisso)}</strong> ` : '';
  let dopoBox = false;
  const chiudi = () => { if (buf.trim()) out.push(`<p>${buf}</p>`); buf = ''; };
  for (const t of tokens) {
    if (t.type === 'text') {
      const txt = dopoBox ? t.body.replace(/^[.,;:]+\s*/, (m) => (m.trim() === t.body.trim() ? '' : '')).replace(/^([a-zà-ÿ])/, (c) => c.toUpperCase()) : t.body;
      if (txt) { buf += escapeHtml(txt); dopoBox = false; }
    } else if (t.type === 'display' || isolata || t.body.length > 48 || devePromuovereInDisplay(t.body)) { chiudi(); out.push(formulaBlock(t.body)); dopoBox = true; }
    else { buf += formulaInline(t.body); dopoBox = false; }
  }
  chiudi();
  return out.join('');
}

function voceListaFormule(testo) {
  const tokens = tokenizzaMatematica(puliziaTesto(testo));
  return tokens.map((t) => (t.type === 'text' ? escapeHtml(t.body)
    : (t.type === 'display' || t.body.length > 48 || devePromuovereInDisplay(t.body)) ? formulaBlock(t.body) : formulaInline(t.body))).join('');
}

function renderChecklist(voci) {
  if (!Array.isArray(voci) || !voci.length) return '';
  return `<ul class="nodo-checklist">${voci.map((v) => `<li>${voceListaFormule(v)}</li>`).join('')}</ul>`;
}

function bottoneRivelatore(id, etichettaMostra, contenutoHtml) {
  if (!contenutoHtml) return '';
  return `<div class="nodo-rivelatore">
    <button class="btn btn--ghost js-rivelatore" type="button" aria-expanded="false" data-target="${id}" data-label="${escapeHtml(etichettaMostra)}">${escapeHtml(etichettaMostra)}</button>
    <div id="${id}" class="nodo-rivelato prose" hidden>${contenutoHtml}</div>
  </div>`;
}

function renderLezione(L) {
  if (!L || typeof L !== 'object') return '';
  const def = L.definizione_esame || {};
  const ex = L.worked_example || {};
  const cp = L.completion_problem || {};
  const ea = L.esercizio_autonomo || {};
  const an = L.analogia || {};
  const errori = Array.isArray(L.errori_trappole) ? L.errori_trappole.filter(Boolean) : [];
  const domande = Array.isArray(L.richiamo_attivo) ? L.richiamo_attivo : (L.richiamo_attivo && L.richiamo_attivo.domande) || [];
  const spiegaTue = L.richiamo_attivo && L.richiamo_attivo.spiega_con_parole_tue;
  const flash = Array.isArray(L.flashcard) ? L.flashcard.filter(Boolean) : [];
  const cl = L.checklist || {};

  return `<section class="nodo-sezione">
    <div class="prose">
      <h2>Contesto e obiettivo</h2>
      ${L.perche_ti_serve ? renderMarkdown(puliziaTesto(L.perche_ti_serve)) : ''}
      ${L.scenario ? `<h3>Scenario concreto</h3>${renderMarkdown(puliziaTesto(L.scenario))}` : ''}
    </div>
    ${def.definizione ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Definizione per l'esame</h3>${blocchiFormule(def.definizione, 'Definizione:')}${blocchiFormule(def.scopo, 'Scopo:')}${blocchiFormule(def.esempio, 'Esempio:')}</div></div>` : ''}
    ${L.spiegazione ? `<div class="prose nodo-spiegazione"><h2>Spiegazione</h2>${renderMarkdown(puliziaTesto(L.spiegazione))}</div>` : ''}
    ${Array.isArray(L.figure) && L.figure.length ? `<div class="nodo-figure"><h2>Figure</h2>${L.figure.map((f) => renderFigura(f, L.figure)).join('')}</div>` : ''}
    ${an.testo ? `<div class="callout"><div class="callout__title">Analogia</div>${blocchiFormule(an.testo)}${blocchiFormule(an.limite, 'Limite:')}</div>` : ''}
    ${ex.problema ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Esempio svolto: ${voceListaFormule(ex.titolo)}</h3>${blocchiFormule(ex.problema)}${Array.isArray(ex.passi) && ex.passi.length ? `<ol>${ex.passi.map((p) => `<li>${voceListaFormule(p)}</li>`).join('')}</ol>` : ''}${blocchiFormule(ex.soluzione, 'Soluzione:')}${blocchiFormule(ex.perche_funziona, 'Perché funziona:')}</div></div>` : ''}
    ${cp.testo ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Problema di completamento: ${voceListaFormule(cp.titolo)}</h3>${blocchiFormule(cp.testo)}${renderChecklist(cp.passi_mancanti)}</div>${bottoneRivelatore('nodo-cp-sol', 'Mostra soluzione', blocchiFormule(cp.soluzione))}</div>` : ''}
    ${ea.testo ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Esercizio autonomo: ${voceListaFormule(ea.titolo)}</h3>${blocchiFormule(ea.testo)}${blocchiFormule(ea.suggerimento, 'Suggerimento:')}</div>${bottoneRivelatore('nodo-ea-sol', 'Mostra soluzione attesa', blocchiFormule(ea.soluzione_attesa))}</div>` : ''}
    ${errori.length ? `<div class="nodo-errori"><h2>Errori frequenti</h2>${errori.map((e) => `<div class="callout callout--error"><div class="callout__title">${voceListaFormule(e.errore)}</div>${blocchiFormule(e.perche_sbagliato)}</div>`).join('')}</div>` : ''}
    ${domande.length ? `<div class="nodo-richiamo"><h2>Richiamo attivo</h2>${spiegaTue ? `<div class="prose">${blocchiFormule(spiegaTue)}</div>` : ''}${domande.map((r, i) => `<div class="card nodo-card-blocco"><div class="prose">${blocchiFormule(r.domanda, `Domanda ${i + 1}:`)}</div>${bottoneRivelatore(`nodo-rich-${i}`, 'Mostra risposta', blocchiFormule(r.risposta))}</div>`).join('')}</div>` : ''}
    ${L.riepilogo ? `<div class="callout"><div class="callout__title">Riepilogo</div>${blocchiFormule(L.riepilogo)}</div>` : ''}
    ${flash.length ? `<div class="nodo-flash"><h2>Flashcard</h2>${flash.map((f, i) => `<div class="card nodo-card-blocco"><div class="prose">${blocchiFormule(f.fronte)}</div>${bottoneRivelatore(`nodo-fc-${i}`, 'Mostra retro', blocchiFormule(f.retro))}</div>`).join('')}</div>` : ''}
    ${(cl.so_fare || cl.so_dire) ? `<div class="prose"><h2>Checklist di autovalutazione</h2>${cl.so_fare ? `<h3>So fare</h3>${renderChecklist(cl.so_fare)}` : ''}${cl.so_dire ? `<h3>So dire</h3>${renderChecklist(cl.so_dire)}` : ''}</div>` : ''}
  </section>`;
}

export function render(ctx, params) {
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
  const ctaDim = nodo.dimostrazione
    ? `<div class="nodo-azioni"><a class="btn btn--primary" href="#/dim/${escapeHtml(String(nodo.id))}">Studia la dimostrazione</a></div>`
    : '';

  return `<div class="nodo-testata">
  <h1>${escapeHtml(testoSicuro(nodo.titolo || nodo.id))}</h1>
  <div class="chip-row">
    <span class="chip">Area ${escapeHtml(String(nodo.area || 1))}${titArea ? ' · ' + escapeHtml(titArea) : ''}</span>
    <span class="chip chip--info">${escapeHtml(etichettaTipo(nodo.tipo))}</span>
    <span class="chip">${escapeHtml(etichettaPriorita(nodo.priorita && nodo.priorita.livello))}</span>
    ${nodo.tempo_studio_min ? `<span class="chip">${escapeHtml(String(nodo.tempo_studio_min))} min</span>` : ''}
    ${domande.map((d) => `<span class="chip chip--warn">Prova ${escapeHtml(testoSicuro(d))}</span>`).join('')}
  </div>
  ${ctaDim}
</div>
<section class="nodo-sezione prose">
  <h2>Cosa si deve sapere</h2>
  ${blocchiFormule(nodo.sapere)}
  <h2>Criteri osservabili</h2>
  ${renderChecklist(nodo.saper_fare)}
</section>
<section class="nodo-sezione">
  <h2>Prerequisiti</h2>
  <div class="chip-row">${prereq.length ? prereq.map((p) => chipNodoLink(p && p.id, mappa)).join('') : '<span class="chip chip--ok">Nessun prerequisito richiesto</span>'}</div>
</section>
${renderLezione(nodo.lezione)}
<section class="nodo-sezione prose">
  <h2>Fonti</h2>
  ${fonti.length ? `<ul>${fonti.map((f) => `<li><strong>${escapeHtml(etichettaFonte(f.chiave))}</strong>: ${escapeHtml(testoSicuro(f.rif))}</li>`).join('')}</ul>` : '<p>Nessuna fonte dichiarata.</p>'}
  ${risorse.length ? `<h3>Risorse di approfondimento</h3><div class="chip-row">${risorse.map((r) => `<a class="btn btn--ghost" href="${escapeHtml(String(r.url))}" rel="noopener" target="_blank">${escapeHtml(testoSicuro(r.titolo || r.url))}</a>`).join('')}</div>` : ''}
</section>`;
}

export function setup(container) {
  container.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.js-rivelatore');
    if (!btn) return;
    const target = container.querySelector(`#${btn.getAttribute('data-target')}`);
    if (!target) return;
    const apri = target.hidden;
    target.hidden = !apri;
    btn.setAttribute('aria-expanded', apri ? 'true' : 'false');
    btn.textContent = apri ? 'Nascondi' : (btn.getAttribute('data-label') || 'Mostra');
  });
}
