/** web/js/pages/nodo/render.js — owner E1.
 * Rendering della scheda nodo: sezioni numerate, indice, .chiave in apertura,
 * figure numerate «Figura n.m», note a margine da 1200 px, ?sezione=, nav prev/succ.
 */
import { renderMarkdown } from '../../ui.js';
import {
  testoSicuro,
  escapeHtml,
  tokenizzaMatematica,
  formulaBlock,
  devePromuovereInDisplay,
} from '../../core/math.js';
import { renderFigura } from '../../figure/index.js';
import {
  etichettaTipo,
  etichettaPriorita,
  nomeArea,
  chipNodoLink,
  formattaParoleIntere,
} from '../grafo.js';
import { etichettaFonte, etichettaUrlFonte } from '../fonti.js';
import { puliziaTesto, formulaConPunteggiatura, paragrafoConFormule } from '../esercizi.js';
import { indiceHTML } from '../../layout/indice.js';
import { navSequenzaHTML } from '../../layout/sequenza.js';

const blocchi = (testo, prefisso = '') => paragrafoConFormule(testo, { blocchi: true, prefisso });
const voce = (testo, soloInline = false) => paragrafoConFormule(testo, { blocchi: false, soloInline });

let sezioneNum = 0;
let figuraNum = 0;

function prossimaSezione() {
  sezioneNum += 1;
  return String(sezioneNum);
}

function prossimaFigura() {
  figuraNum += 1;
  return String(figuraNum);
}

function resetContatori() {
  sezioneNum = 0;
  figuraNum = 0;
}

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
    .replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) =>
      inner.includes('@@BOX_START@@')
        ? inner.split(/@@BOX_START@@([\s\S]*?)@@BOX_END@@/).map((seg, i) =>
          i % 2 === 1 ? seg : (seg.trim() ? `<p>${seg.replace(/^[.,;:]+\s*/, '').trimStart()}</p>` : '')
        ).join('')
        : `<p>${inner}</p>`)
    .replace(/@@BOX_(?:START|END)@@/g, '');
}

function figuraConNumero(f, tutte) {
  figuraNum += 1;
  const svg = renderFigura(f, tutte);
  const titoloEsc = escapeHtml(testoSicuro(f.titolo || ''));
  const descEsc = escapeHtml(testoSicuro(f.descrizione || ''));
  return `<figure class="figure figura-numerata" id="fig-${figuraNum}">
    <div class="figure__numero">Figura ${figuraNum}</div>
    ${svg}
    <figcaption><strong>Figura ${figuraNum} — ${titoloEsc}</strong> ${descEsc}</figcaption>
  </figure>`;
}

function notaMargine(testo, etichetta) {
  const id = `nota-${figuraNum}-${sezioneNum}`;
  const toggId = `togg-${id}`;
  return `<label class="nota-toggle" for="${toggId}" aria-label="${escapeHtml(etichetta || 'Nota')}">${escapeHtml(etichetta || 'Nota')}</label>
<aside class="nota-margine" id="${id}" role="note">
  <p class="nota-margine__titolo">${escapeHtml(etichetta || 'Nota')}</p>
  ${renderProsaMarkdown(testo)}
</aside>`;
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

function renderSezione(numero, titolo, contenuto) {
  return `<section class="nodo-sezione" id="sez-${numero}">
    <h2><span class="sezione__num">${numero}</span> ${escapeHtml(titolo)}</h2>
    <div class="prose">${contenuto}</div>
  </section>`;
}

function renderLezione(L) {
  if (!L || typeof L !== 'object') return '';
  resetContatori();
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
  const varianti = Array.isArray(L.varianti_notazione) ? L.varianti_notazione : [];
  const puntiAperti = Array.isArray(L.verifica && L.verifica.punti_aperti) ? L.verifica.punti_aperti : [];

  const parti = [];

  // 1. Definizione
  if (def.definizione) {
    parti.push(renderSezione(prossimaSezione(), 'Definizione per l’esame',
      `${blocchi(def.definizione, 'Definizione:')}${blocchi(def.scopo, 'Scopo:')}${blocchi(def.esempio, 'Esempio:')}`));
  }

  // 2. Spiegazione (con sottosezioni dai ### del markdown)
  if (L.spiegazione) {
    const spiegazioneHtml = renderProsaMarkdown(L.spiegazione);
    // Numera le sottosezioni h3 presenti nel markdown
    const spiegazioneNumerata = spiegazioneHtml.replace(/<h3>(.*?)<\/h3>/g, (_, testo) => {
      const sotto = `${prossimaSezione()}.${sezioneNum === 0 ? 1 : sezioneNum}`;
      return `<h3><span class="sezione__num">${sotto}</span> ${escapeHtml(testo)}</h3>`;
    });
    parti.push(renderSezione(prossimaSezione(), 'Spiegazione', spiegazioneNumerata));
  }

  // Note a margine da varianti_notazione (prima delle sezioni tecniche)
  for (const v of varianti) {
    parti.push(notaMargine(`${escapeHtml(testoSicuro(v.canonica || ''))} → ${escapeHtml(testoSicuro(v.variante || ''))}`, testoSicuro(v.fonte || 'Variante di notazione')));
  }

  // 3. Esempio svolto
  if (ex.problema) {
    parti.push(renderSezione(prossimaSezione(), 'Esempio svolto',
      `${blocchi(ex.problema)}${Array.isArray(ex.passi) && ex.passi.length ? `<ol>${ex.passi.map((p) => `<li>${voce(p)}</li>`).join('')}</ol>` : ''}${blocchi(ex.soluzione, 'Soluzione:')}${blocchi(ex.perche_funziona, 'Perché funziona:')}`));
  }

  // 4. Prova tu (completamento + autonomo)
  const provaTu = [];
  if (cp.testo) provaTu.push(`${blocchi(cp.testo)}${renderChecklist(cp.passi_mancanti)}${bottoneRivelatore('nodo-cp-sol', 'Mostra soluzione', blocchi(cp.soluzione))}`);
  if (ea.testo) provaTu.push(`${blocchi(ea.testo)}${blocchi(ea.suggerimento, 'Suggerimento:')}${bottoneRivelatore('nodo-ea-sol', 'Mostra soluzione attesa', blocchi(ea.soluzione_attesa))}`);
  if (provaTu.length) {
    parti.push(renderSezione(prossimaSezione(), 'Prova tu', provaTu.join('')));
  }

  // 5. Errori da non fare
  if (errori.length) {
    parti.push(`<section class="nodo-sezione" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Errori da non fare</h2><div class="prose">${errori.map((e) => `<div class="errore"><div class="errore__riga"><span class="errore__label">Errore</span>${voce(e.errore, true)}</div><div class="errore__riga"><span class="errore__label">Perché è sbagliato</span>${blocchi(e.perche_sbagliato)}</div><div class="errore__riga"><span class="errore__label">Correzione</span>${blocchi(e.correzione)}</div></div>`).join('')}</div></section>`);
  }

  // 6. Verifica
  const verificaParti = [];
  if (domande.length) {
    verificaParti.push('<h3>Richiamo attivo</h3>');
    verificaParti.push(domande.map((r, i) => `<div class="verifica-domanda"><p>${blocchi(r.domanda, `Domanda ${i + 1}:`)}</p>${bottoneRivelatore(`nodo-rich-${i}`, 'Mostra risposta', blocchi(r.risposta))}</div>`).join(''));
  }
  if (flash.length) {
    verificaParti.push(flash.map((f, i) => `<div class="verifica-domanda"><p>${blocchi(f.fronte)}</p>${bottoneRivelatore(`nodo-fc-${i}`, 'Mostra retro', blocchi(f.retro))}</div>`).join(''));
  }
  // Note a margine da punti_aperti
  for (const p of puntiAperti) {
    verificaParti.push(notaMargine(p, 'Punto aperto'));
  }
  if (verificaParti.length) {
    parti.push(`<section class="nodo-sezione" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Verifica</h2><div class="prose">${verificaParti.join('')}</div></section>`);
  }

  // 7. Riepilogo
  if (L.riepilogo) {
    parti.push(renderSezione(prossimaSezione(), 'Riepilogo', blocchi(L.riepilogo)));
  }

  // 8. Fonti e stato (piccolo, in fondo)
  if (L.fonti && L.fonti.length) {
    parti.push(`<section class="nodo-sezione verifica" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Fonti e verifica</h2><div class="prose"><ul>${L.fonti.map((f) => `<li><strong>${esc(etichettaFonte(f.chiave))}</strong>: ${esc(testoSicuro(f.rif))}</li>`).join('')}</ul></div></section>`);
  }

  // <details> amministrativi: prerequisiti e criterri
  const prereqHtml = `<details><summary>Prerequisiti e criteri osservabili</summary>
    <h3>Prerequisiti</h3><div class="chip-row">${renderPrerequisitiChip([])}</div>
    <h3>Criteri osservabili</h3>${renderChecklist(L.saper_fare || [])}
  </details>`;
  parti.push(prereqHtml);

  return parti.join('');
}

function esc(s) { return escapeHtml(testoSicuro(s)); }

function renderPrerequisitiChip(prereq) {
  if (!prereq.length) return '<span class="chip chip--ok">Nessun prerequisito richiesto</span>';
  return prereq.map((p) => chipNodoLink(p && p.id, new Map())).join('');
}

export function render(ctx, params) {
  resetContatori();
  const graph = (ctx && ctx.graph) || {};
  const nodi = (Array.isArray(graph.nodi) ? graph.nodi : []).filter(Boolean);
  const mappa = new Map(nodi.map((n) => [String(n.id), n]));
  const richiesto = testoSicuro(params && params.id);
  const sezioneRichiesta = testoSicuro(params && params.sezione);
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
  const ctaDim = nodo.dimostrazione
    ? `<div class="nodo-azioni"><a class="btn btn--primary" href="#/dim/${escapeHtml(String(nodo.id))}">Studia la dimostrazione</a></div>`
    : '';

  // .chiave in apertura (perche_ti_serve)
  const chiaveHtml = nodo.perche_ti_serve
    ? `<aside class="chiave chiave--def" aria-labelledby="chiave-${nodo.id}"><p class="chiave__etichetta" id="chiave-${nodo.id}">Perché ti serve</p><p>${renderProsaMarkdown(nodo.perche_ti_serve)}</p></aside>`
    : '';

  // .scenario e .analogia prima delle sezioni
  const scenarioHtml = nodo.scenario ? `<div class="scenario">${renderProsaMarkdown(nodo.scenario)}</div>` : '';
  const an = lezione && lezione.analogia;
  const analogiaHtml = an && an.testo
    ? `<div class="analogia">${blocchi(an.testo)}${an.limite ? `<p class="analogia__limite"><span class="errore__label">Limite</span>${blocchi(an.limite)}</p>` : ''}</div>`
    : '';

  // Contenuto lezione (sezioni numerate)
  resetContatori();
  const lezioneHtml = lezione ? renderLezione(lezione) : '';

  // Indice della pagina: voci dalle h2 con sezione__num (senza DOM, node-safe)
  const indiceVoci = [];
  if (lezioneHtml) {
    for (const m of lezioneHtml.matchAll(/<h2[^>]*><span class="sezione__num">(\d+)<\/span>([^<]+)<\/h2>/g)) {
      const num = m[1];
      const titolo = m[2].trim();
      if (titolo) indiceVoci.push({ id: `sez-${num}`, titolo, href: `#sez-${num}`, livello: 2 });
    }
  }
  const indiceHtml = indiceHTML(indiceVoci);

  // Supporto ?sezione=: dettagli da aprire
  let aperturaSezione = '';
  if (sezioneRichiesta) {
    aperturaSezione = `<script>(()=>{const el=document.getElementById('sez-${escapeHtml(sezioneRichiesta)}');if(el)el.scrollIntoView();})();</script>`;
  }

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
${navSequenzaHTML(graph, nodo.id)}
${aperturaSezione}`;
}
