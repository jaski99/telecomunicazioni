/** Pagina #/nodo/<id>: colonna .prose, checklist criteri, prerequisiti, dimostrazione e lezione. */
import { renderMarkdown } from '../ui.js';
import { testoSicuro, escapeHtml, tokenizzaMatematica, formulaBlock, devePromuovereInDisplay } from '../core/math.js';
import { renderFigura } from '../figure/index.js';
import { etichettaTipo, etichettaPriorita, nomeArea, chipNodoLink, formattaParoleIntere } from './grafo.js';
import { etichettaFonte, etichettaUrlFonte } from './fonti.js';
import { puliziaTesto, formulaConPunteggiatura, paragrafoConFormule } from './esercizi.js';

const blocchi = (testo, prefisso = '') => paragrafoConFormule(testo, { blocchi: true, prefisso });
const voce = (testo, soloInline = false) => paragrafoConFormule(testo, { blocchi: false, soloInline });

function renderProsaMarkdown(testo) {
  const formule = [];
  const protetto = tokenizzaMatematica(puliziaTesto(testo))
    .map((t) => (t.type === 'text' ? t.body : `@@TLCF${formule.push(t) - 1}@@`))
    .join('');
  const html = renderMarkdown(protetto).replace(/@@TLCF(\d+)@@([.,;:)]*)/g, (_, idx, punct) => {
    const f = formule[Number(idx)];
    if (f.type === 'display' || f.body.length > 48 || devePromuovereInDisplay(f.body)) {
      const resto = punct.replace(/^[.,;:]+/, '');
      return `@@BOX_START@@${formulaBlock(f.body)}@@BOX_END@@${escapeHtml(resto)}`;
    }
    return formulaConPunteggiatura(f.body, punct);
  });
  return html
    .replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) => (inner.includes('@@BOX_START@@')
      ? inner.split(/@@BOX_START@@([\s\S]*?)@@BOX_END@@/).map((seg, i) => (
        i % 2 === 1 ? seg : (seg.trim() ? `<p>${seg.replace(/^[.,;:]+\s*/, '').trimStart()}</p>` : '')
      )).join('')
      : `<p>${inner}</p>`))
    .replace(/@@BOX_(?:START|END)@@/g, '');
}

function renderChecklist(voci) {
  if (!Array.isArray(voci) || !voci.length) return '';
  return `<ul class="nodo-checklist">${voci.map((v) => `<li>${voce(v)}</li>`).join('')}</ul>`;
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
      ${L.perche_ti_serve ? renderProsaMarkdown(L.perche_ti_serve) : ''}
      ${L.scenario ? `<h3>Scenario concreto</h3>${renderProsaMarkdown(L.scenario)}` : ''}
    </div>
    ${def.definizione ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Definizione per l'esame</h3>${blocchi(def.definizione, 'Definizione:')}${blocchi(def.scopo, 'Scopo:')}${blocchi(def.esempio, 'Esempio:')}</div></div>` : ''}
    ${L.spiegazione ? `<div class="prose nodo-spiegazione"><h2>Spiegazione</h2>${renderProsaMarkdown(L.spiegazione)}</div>` : ''}
    ${Array.isArray(L.figure) && L.figure.length ? `<div class="nodo-figure"><h2>Figure</h2>${L.figure.map((f) => renderFigura(f, L.figure)).join('')}</div>` : ''}
    ${an.testo ? `<div class="callout"><div class="callout__title">Analogia</div>${blocchi(an.testo)}${blocchi(an.limite, 'Limite:')}</div>` : ''}
    ${ex.problema ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Esempio svolto: ${voce(ex.titolo, true)}</h3>${blocchi(ex.problema)}${Array.isArray(ex.passi) && ex.passi.length ? `<ol>${ex.passi.map((p) => `<li>${voce(p)}</li>`).join('')}</ol>` : ''}${blocchi(ex.soluzione, 'Soluzione:')}${blocchi(ex.perche_funziona, 'Perché funziona:')}</div></div>` : ''}
    ${cp.testo ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Problema di completamento: ${voce(cp.titolo, true)}</h3>${blocchi(cp.testo)}${renderChecklist(cp.passi_mancanti)}</div>${bottoneRivelatore('nodo-cp-sol', 'Mostra soluzione', blocchi(cp.soluzione))}</div>` : ''}
    ${ea.testo ? `<div class="card nodo-card-blocco"><div class="prose"><h3>Esercizio autonomo: ${voce(ea.titolo, true)}</h3>${blocchi(ea.testo)}${blocchi(ea.suggerimento, 'Suggerimento:')}</div>${bottoneRivelatore('nodo-ea-sol', 'Mostra soluzione attesa', blocchi(ea.soluzione_attesa))}</div>` : ''}
    ${errori.length ? `<div class="nodo-errori"><h2>Errori frequenti</h2>${errori.map((e) => `<div class="callout callout--error"><div class="callout__title">${voce(e.errore, true)}</div>${blocchi(e.perche_sbagliato)}</div>`).join('')}</div>` : ''}
    ${domande.length ? `<div class="nodo-richiamo"><h2>Richiamo attivo</h2>${spiegaTue ? `<div class="prose">${blocchi(spiegaTue)}</div>` : ''}${domande.map((r, i) => `<div class="card nodo-card-blocco"><div class="prose">${blocchi(r.domanda, `Domanda ${i + 1}:`)}</div>${bottoneRivelatore(`nodo-rich-${i}`, 'Mostra risposta', blocchi(r.risposta))}</div>`).join('')}</div>` : ''}
    ${L.riepilogo ? `<div class="callout"><div class="callout__title">Riepilogo</div>${blocchi(L.riepilogo)}</div>` : ''}
    ${flash.length ? `<div class="nodo-flash"><h2>Flashcard</h2>${flash.map((f, i) => `<div class="card nodo-card-blocco"><div class="prose">${blocchi(f.fronte)}</div>${bottoneRivelatore(`nodo-fc-${i}`, 'Mostra retro', blocchi(f.retro))}</div>`).join('')}</div>` : ''}
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
<section class="nodo-sezione prose">
  <h2>Cosa si deve sapere</h2>
  ${blocchi(nodo.sapere)}
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
  ${risorse.length ? `<h3>Risorse di approfondimento</h3><div class="chip-row">${risorse.map((r) => `<a class="btn btn--ghost" href="${escapeHtml(String(r.url))}" rel="noopener" target="_blank">${escapeHtml(testoSicuro(r.titolo || etichettaUrlFonte(r.url)))}</a>`).join('')}</div>` : ''}
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
