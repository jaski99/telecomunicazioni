import { renderProsaMarkdown, blocchi, voce, renderChecklist, bottoneRivelatore, esc } from './util.js';
import { renderFigura } from '../../figure/index.js';
import { chipNodoLink } from '../grafo.js';
import { etichettaFonte } from '../fonti.js';

let sezioneNum = 0;
let figuraNum = 0;
let sottoNum = 0;

export function resetContatori() { sezioneNum = 0; figuraNum = 0; sottoNum = 0; }
function prossimaSezione() { sezioneNum += 1; sottoNum = 0; return String(sezioneNum); }
function prossimaSottosezione() { sottoNum += 1; return `${sezioneNum}.${sottoNum}`; }
function prossimaFigura() { figuraNum += 1; return `${sezioneNum}.${figuraNum}`; }

export function figuraConNumero(f) {
  const num = prossimaFigura();
  const svg = renderFigura(f, []);
  return `<figure class="figure figura-numerata" id="fig-${num}"><div class="figure__numero">Figura ${num}</div>${svg}<figcaption><strong>Figura ${num} — ${esc(f.titolo || '')}</strong> ${esc(f.descrizione || '')}</figcaption></figure>`;
}

export function notaMargine(testo, etichetta) {
  const id = `nota-${prossimaFigura().replace('.', '-')}`;
  return `<label class="nota-toggle" for="togg-${id}" aria-label="${esc(etichetta || 'Nota')}">${esc(etichetta || 'Nota')}</label><aside class="nota-margine" id="${id}" role="note"><p class="nota-margine__titolo">${esc(etichetta || 'Nota')}</p>${renderProsaMarkdown(testo)}</aside>`;
}

function renderSezione(numero, titolo, contenuto) {
  return `<section class="nodo-sezione" id="sez-${numero}"><h2><span class="sezione__num">${numero}</span> ${esc(titolo)}</h2><div class="prose">${contenuto}</div></section>`;
}

export function renderLezione(L) {
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
  const varianti = Array.isArray(L.varianti_notazione) ? L.varianti_notazione : [];
  const puntiAperti = Array.isArray(L.verifica && L.verifica.punti_aperti) ? L.verifica.punti_aperti : [];
  const parti = [];
  if (def.definizione) parti.push(renderSezione(prossimaSezione(), 'Definizione per l’esame', `${blocchi(def.definizione, 'Definizione:')}${blocchi(def.scopo, 'Scopo:')}${blocchi(def.esempio, 'Esempio:')}`));
  if (L.spiegazione) {
    const spiegazioneHtml = renderProsaMarkdown(L.spiegazione).replace(/<h3>(.*?)<\/h3>/g, (_, testo) => `<h3><span class="sezione__num">${prossimaSottosezione()}</span> ${esc(testo)}</h3>`);
    parti.push(renderSezione(prossimaSezione(), 'Spiegazione', spiegazioneHtml));
  }
  for (const v of varianti) parti.push(notaMargine(`${esc(v.canonica || '')} → ${esc(v.variante || '')}`, esc(v.fonte || 'Variante di notazione')));
  if (ex.problema) parti.push(renderSezione(prossimaSezione(), 'Esempio svolto', `${blocchi(ex.problema)}${Array.isArray(ex.passi) && ex.passi.length ? `<ol>${ex.passi.map((p) => `<li>${voce(p)}</li>`).join('')}</ol>` : ''}${blocchi(ex.soluzione, 'Soluzione:')}${blocchi(ex.perche_funziona, 'Perché funziona:')}`));
  const provaTu = [];
  if (cp.testo) provaTu.push(`${blocchi(cp.testo)}${renderChecklist(cp.passi_mancanti)}${bottoneRivelatore('nodo-cp-sol', 'Mostra soluzione', blocchi(cp.soluzione))}`);
  if (ea.testo) provaTu.push(`${blocchi(ea.testo)}${blocchi(ea.suggerimento, 'Suggerimento:')}${bottoneRivelatore('nodo-ea-sol', 'Mostra soluzione attesa', blocchi(ea.soluzione_attesa))}`);
  if (provaTu.length) parti.push(renderSezione(prossimaSezione(), 'Prova tu', provaTu.join('')));
  if (errori.length) parti.push(`<section class="nodo-sezione" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Errori da non fare</h2><div class="prose">${errori.map((e) => `<div class="errore-blocco"><div class="errore-blocco__riga"><span class="errore-blocco__label">Errore</span>${voce(e.errore, true)}</div><div class="errore-blocco__riga"><span class="errore-blocco__label">Perché è sbagliato</span>${blocchi(e.perche_sbagliato)}</div><div class="errore-blocco__riga"><span class="errore-blocco__label">Correzione</span>${blocchi(e.correzione)}</div></div>`).join('')}</div></section>`);
  const verificaParti = [];
  if (domande.length) { verificaParti.push('<h3>Richiamo attivo</h3>'); verificaParti.push(domande.map((r, i) => `<div class="verifica-domanda"><p>${blocchi(r.domanda, `Domanda ${i + 1}:`)}</p>${bottoneRivelatore(`nodo-rich-${i}`, 'Mostra risposta', blocchi(r.risposta))}</div>`).join('')); }
  if (flash.length) verificaParti.push(flash.map((f, i) => `<div class="verifica-domanda"><p>${blocchi(f.fronte)}</p>${bottoneRivelatore(`nodo-fc-${i}`, 'Mostra retro', blocchi(f.retro))}</div>`).join(''));
  for (const p of puntiAperti) verificaParti.push(notaMargine(p, 'Punto aperto'));
  if (verificaParti.length) parti.push(`<section class="nodo-sezione" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Verifica</h2><div class="prose">${verificaParti.join('')}</div></section>`);
  if (L.riepilogo) parti.push(renderSezione(prossimaSezione(), 'Riepilogo', blocchi(L.riepilogo)));
  if (L.fonti && L.fonti.length) parti.push(`<section class="nodo-sezione verifica" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Fonti e verifica</h2><div class="prose"><ul>${L.fonti.map((f) => `<li><strong>${esc(etichettaFonte(f.chiave))}</strong>: ${esc(f.rif)}</li>`).join('')}</ul></div></section>`);
  const pre = Array.isArray(L.prerequisiti) ? L.prerequisiti : [];
  parti.push(`<details><summary>Prerequisiti e criteri osservabili</summary><h3>Prerequisiti</h3><div class="chip-row">${pre.length ? pre.map((p) => chipNodoLink(p && p.id, new Map())).join('') : '<span class="chip chip--ok">Nessun prerequisito richiesto</span>'}</div><h3>Criteri osservabili</h3>${renderChecklist(L.saper_fare || [])}</details>`);
  return parti.join('');
}
