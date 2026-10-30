import { renderProsaMarkdown, blocchi, voce, renderChecklist, bottoneRivelatore, esc } from './util.js';
import { renderFigura } from '../../figure/index.js';
import { etichettaFonte } from '../fonti.js';

let sezioneNum = 0;
let figuraNum = 0;
let notaNum = 0;
let sottoNum = 0;

export function resetContatori() { sezioneNum = 0; figuraNum = 0; sottoNum = 0; notaNum = 0; }
function prossimaSezione() { sezioneNum += 1; sottoNum = 0; figuraNum = 0; return String(sezioneNum); }
function prossimaSottosezione() { sottoNum += 1; return `${sezioneNum}.${sottoNum}`; }
function prossimaFigura() { figuraNum += 1; return `${sezioneNum}.${figuraNum}`; }

export function figuraConNumero(f) {
  const num = prossimaFigura();
  return renderFigura(f, []).replace('class="figure', 'class="figura-numerata figure')
    .replace(/(<figcaption[^>]*>)/, `$1<span class="figure__numero">Figura ${num}</span> `);
}

export function notaMargine(testo, etichetta) {
  const id = `nota-${++notaNum}`;
  return `<aside class="nota-margine" id="${id}" role="note"><p class="nota-margine__titolo">${esc(etichetta || 'Nota')}</p>${renderProsaMarkdown(testo)}</aside>`;
}

function renderSezione(numero, titolo, contenuto, classe = '') {
  return `<section class="nodo-sezione ${classe}" id="sez-${numero}"><h2><span class="sezione__num">${numero}</span> ${esc(titolo)}</h2><div class="prose">${contenuto}</div></section>`;
}

export function renderLezione(L) {
  if (!L || typeof L !== 'object') return '';
  resetContatori();
  const def = L.definizione_esame || {};
  const ex = L.worked_example || {};
  const cp = L.completion_problem || {};
  const ea = L.esercizio_autonomo || {};
  const errori = Array.isArray(L.errori_trappole) ? L.errori_trappole.filter(Boolean) : [];
  const domande = Array.isArray(L.richiamo_attivo) ? L.richiamo_attivo : (L.richiamo_attivo && L.richiamo_attivo.domande) || [];
  const spiegaTue = L.richiamo_attivo && L.richiamo_attivo.spiega_con_parole_tue;
  const flash = Array.isArray(L.flashcard) ? L.flashcard.filter(Boolean) : [];
  const varianti = Array.isArray(L.varianti_notazione) ? L.varianti_notazione : [];
  const puntiAperti = Array.isArray(L.verifica && L.verifica.punti_aperti) ? L.verifica.punti_aperti : [];
  const parti = [];
  if (def.definizione) parti.push(renderSezione(prossimaSezione(), 'Definizione per l’esame', `${blocchi(def.definizione, 'Definizione:')}${blocchi(def.scopo, 'Scopo:')}${blocchi(def.esempio, 'Esempio:')}`, 'definizione'));
  if (L.spiegazione) {
    const numero = prossimaSezione();
    const spiegazioneHtml = renderProsaMarkdown(L.spiegazione).replace(/<h3>(.*?)<\/h3>/g, (_, testo) => `<h3><span class="sezione__num">${prossimaSottosezione()}</span> ${esc(testo)}</h3>`);
    parti.push(renderSezione(numero, 'Spiegazione', spiegazioneHtml));
  }
  if (Array.isArray(L.figure) && L.figure.length) {
    const numero = prossimaSezione();
    parti.push(renderSezione(numero, 'Figure', L.figure.map(figuraConNumero).join('')));
  }
  for (const v of varianti) parti.push(notaMargine(`${esc(v.canonica || '')} → ${esc(v.variante || '')}`, esc(v.fonte || 'Variante di notazione')));
  if (ex.problema) parti.push(renderSezione(prossimaSezione(), 'Esempio svolto', `${blocchi(ex.problema)}${Array.isArray(ex.passi) && ex.passi.length ? `<ol>${ex.passi.map((p) => `<li>${voce(p)}</li>`).join('')}</ol>` : ''}${blocchi(ex.soluzione, 'Soluzione:')}${blocchi(ex.perche_funziona, 'Perché funziona:')}`, 'esempio'));
  const provaTu = [];
  if (cp.testo) provaTu.push(`${blocchi(cp.testo)}${renderChecklist(cp.passi_mancanti)}${bottoneRivelatore('nodo-cp-sol', 'Mostra soluzione', blocchi(cp.soluzione))}`);
  if (ea.testo) provaTu.push(`${blocchi(ea.testo)}${blocchi(ea.suggerimento, 'Suggerimento:')}${bottoneRivelatore('nodo-ea-sol', 'Mostra soluzione attesa', blocchi(ea.soluzione_attesa))}`);
  if (provaTu.length) parti.push(renderSezione(prossimaSezione(), 'Prova tu', provaTu.join('')));
  if (errori.length) parti.push(`<section class="nodo-sezione" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Errori da non fare</h2><div class="prose">${errori.map((e) => `<div class="errore errore-blocco"><div class="errore-blocco__riga"><span class="errore-blocco__label">Errore</span>${voce(e.errore, true)}</div><div class="errore-blocco__riga"><span class="errore-blocco__label">Perché è sbagliato</span>${blocchi(e.perche_sbagliato)}</div><div class="errore-blocco__riga"><span class="errore-blocco__label">Correzione</span>${blocchi(e.correzione)}</div></div>`).join('')}</div></section>`);
  const verificaParti = [];
  if (spiegaTue) verificaParti.push(blocchi(spiegaTue));
  if (domande.length) { verificaParti.push('<h3>Richiamo attivo</h3>'); verificaParti.push(domande.map((r, i) => `<div class="verifica-domanda"><p>${blocchi(r.domanda, `Domanda ${i + 1}:`)}</p>${bottoneRivelatore(`nodo-rich-${i}`, 'Mostra risposta', blocchi(r.risposta))}</div>`).join('')); }
  if (flash.length) verificaParti.push(flash.map((f, i) => `<div class="verifica-domanda"><p>${blocchi(f.fronte)}</p>${bottoneRivelatore(`nodo-fc-${i}`, 'Mostra retro', blocchi(f.retro))}</div>`).join(''));
  for (const p of puntiAperti) verificaParti.push(notaMargine(p, 'Punto aperto'));
  if (verificaParti.length) parti.push(`<section class="nodo-sezione" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Verifica</h2><div class="prose">${verificaParti.join('')}</div></section>`);
  const cl = L.checklist || {};
  if (cl.so_fare || cl.so_dire) parti.push(renderSezione(prossimaSezione(), 'Checklist di autovalutazione', `${cl.so_fare ? `<h3>So fare</h3>${renderChecklist(cl.so_fare)}` : ''}${cl.so_dire ? `<h3>So dire</h3>${renderChecklist(cl.so_dire)}` : ''}`));
  if (L.riepilogo) parti.push(renderSezione(prossimaSezione(), 'Riepilogo', blocchi(L.riepilogo)));
  if (L.fonti && L.fonti.length) parti.push(`<section class="nodo-sezione verifica" id="sez-${prossimaSezione()}"><h2><span class="sezione__num">${sezioneNum}</span> Fonti e verifica</h2><div class="prose"><ul>${L.fonti.map((f) => `<li><strong>${esc(etichettaFonte(f.chiave))}</strong>: ${esc(f.rif)}</li>`).join('')}</ul></div></section>`);
  return parti.join('');
}
