/**
 * Pagina #/nodo/<id>: dettaglio di un nodo del knowledge graph con la sua
 * lezione, figure SVG, flashcard, checklist e richiamo attivo.
 */
import { elenco, linkNodo, renderMarkdown, chipStato } from '../ui.js';
import { testoSicuro, escapeHtml } from '../core/math.js';
import { renderFigura } from '../figure/index.js';
export function render(ctx, params) {
  const { graph } = ctx;
  const nodi = Array.isArray(graph.nodi) ? graph.nodi : [];
  const nodo = nodi.find((n) => n && String(n.id) === String(params.id));
  if (!nodo) {
    return `<h1>Nodo non trovato</h1>
<p class="avviso">Il nodo <strong>${escapeHtml(testoSicuro(params.id))}</strong> non è ancora disponibile (in arrivo).</p>`;
  }
  const prereqHtml = Array.isArray(nodo.prerequisiti) && nodo.prerequisiti.length
    ? nodo.prerequisiti.map((p) => linkNodo(testoSicuro(p && p.id), testoSicuro(p && p.id), vero(nodo, p && p.id))).join(' ')
    : chipStato('nessun prerequisito dichiarato', 'ok');
  const domandeHtml = Array.isArray(nodo.domande_esame) && nodo.domande_esame.length
    ? nodo.domande_esame.map((d) => `<span class="badge">${escapeHtml(testoSicuro(d))}</span>`).join(' ')
    : chipStato("nessuna prova d'esame diretta", "ok");
  let lezioneHtml = '';
  if (nodo.lezione) {
    const L = nodo.lezione;
    lezioneHtml = `
      <section class="lezione">
        <h2>Lezione</h2>
        ${renderBlock('perche_ti_serve', L.perche_ti_serve)}
        ${renderBlock('scenario', L.scenario)}
        ${renderBlocchiDefinizione(L.definizione_esame)}
        ${renderSpiegazione(L.spiegazione)}
        ${renderBloccoL('analogia', L.analogia)}
        ${renderWorkedExample(L.worked_example)}
        ${renderCompletion(L.completion_problem)}
        ${renderEsercizioAutonomo(L.esercizio_autonomo)}
        ${renderErrori(L.errori_trappole)}
        ${renderRichiamo(L.richiamo_attivo)}
        ${renderRiepilogo(L.riepilogo)}
        ${renderFlashcard(L.flashcard)}
        ${renderChecklist(L.checklist)}
      </section>`;
    if (Array.isArray(L.figure) && L.figure.length) {
      lezioneHtml += `<section class="figure-lezione">
        <h2>Figure</h2>
        ${L.figure.map((f) => renderFigura(f)).join('')}
      </section>`;
    }
  }
  return `<h1>${escapeHtml(testoSicuro(nodo.titolo || nodo.id))}</h1>
<p class="meta">
  <span class="badge">area ${escapeHtml(testoSicuro(String(nodo.area)))}</span>
  <span class="badge">${escapeHtml(testoSicuro(nodo.tipo || ''))}</span>
  <span class="badge">${escapeHtml(testoSicuro(nodo.gruppo || ''))}</span>
  <span class="badge">${escapeHtml(testoSicuro(nodo.worker || ''))}</span>
</p>
<h3>Cosa si deve sapere</h3>
<p>${escapeHtml(testoSicuro(nodo.sapere || ''))}</p>
<h3>Criteri osservabili</h3>${elenco(nodo.saper_fare)}
<h3>Prerequisiti</h3><div>${prereqHtml}</div>
<h3>Prove d'esame collegate</h3><div>${domandeHtml}</div>
${lezioneHtml}
<h3>Fonti</h3>${elencoFonti(nodo.fonti)}`;
}
function vero(nodo, id) {
  return Array.isArray(nodo.prerequisiti) && nodo.prerequisiti.some((p) => p && String(p.id) === String(id));
}

function renderBlock(chiave, valore) {
  if (!valore) return '';
  return `<h4>${etichettaBlock(chiave)}</h4><p>${renderMarkdown(valore)}</p>`;
}

function etichettaBlock(chiave) {
  const map = {
    perche_ti_serve: 'Perché ti serve',
    scenario: 'Scenario ricorrente',
    analogia: 'Analogia',
  };
  return map[chiave] || chiave;
}

function renderBlocchiDefinizione(def) {
  if (!def || typeof def !== 'object') return '';
  return `<h4>Definizione d'esame</h4>
<p><strong>Definizione:</strong> ${escapeHtml(testoSicuro(def.definizione))}</p>
<p><strong>Scopo:</strong> ${escapeHtml(testoSicuro(def.scopo))}</p>
<p><strong>Esempio:</strong> ${escapeHtml(testoSicuro(def.esempio))}</p>`;
}

function renderSpiegazione(s) {
  if (!s) return '';
  return `<h4>Spiegazione</h4>${renderMarkdown(s)}`;
}

function renderBloccoL(chiave, obj) {
  if (!obj || typeof obj !== 'object') return '';
  const testo = testoSicuro(obj.testo);
  const limite = testoSicuro(obj.limite);
  return testo || limite ? `<h4>${etichettaBlock(chiave)}</h4>
<p>${escapeHtml(testo)} ${limite ? `<em class="muted">Limite: ${escapeHtml(limite)}.</em>` : ''}</p>` : '';
}

function renderWorkedExample(ex) {
  if (!ex || typeof ex !== 'object') return '';
  let html = `<h4>Esempio svolto: ${escapeHtml(testoSicuro(ex.titolo || ''))}</h4>
<p>${escapeHtml(testoSicuro(ex.problema || ''))}</p>
<h5>Passi</h5>${elenco(ex.passi)}`;
  if (ex.soluzione) html += `<p><strong>Soluzione:</strong> ${escapeHtml(testoSicuro(ex.soluzione))}</p>`;
    if (ex.perche_funziona) html += `<p><strong>Perché funziona:</strong> ${escapeHtml(testoSicuro(ex.perche_funziona))}</p>`;
  return html;
}

function renderCompletion(cp) {
  if (!cp || typeof cp !== 'object') return '';
  return `<h4>Problema di completamento: ${escapeHtml(testoSicuro(cp.titolo || ''))}</h4>
<p>${escapeHtml(testoSicuro(cp.testo || ''))}</p>
<p><strong>Soluzione:</strong> ${escapeHtml(testoSicuro(cp.soluzione || ''))}</p>`;
}

function renderEsercizioAutonomo(ea) {
  if (!ea || typeof ea !== 'object') return '';
  let html = `<h4>Esercizio autonomo: ${escapeHtml(testoSicuro(ea.titolo || ''))}</h4>
<p>${escapeHtml(testoSicuro(ea.testo || ''))}</p>`;
  if (ea.suggerimento) html += `<p><em>Suggerimento:</em> ${escapeHtml(testoSicuro(ea.suggerimento))}</p>`;
  if (ea.soluzione_attesa) html += `<p><strong>Soluzione attesa:</strong> ${escapeHtml(testoSicuro(ea.soluzione_attesa))}</p>`;
  return html;
}

function renderErrori(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  let html = `<h4>Errori e trappole</h4><ul>`;
  for (const e of arr) {
    if (!e || typeof e !== 'object') continue;
    html += `<li><strong>${escapeHtml(testoSicuro(e.errore || ''))}</strong> — ${escapeHtml(testoSicuro(e.perche_sbagliato || ''))}</li>`;
  }
  html += '</ul>';
  return html;
}

function renderRichiamo(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  let html = `<h4>Richiamo attivo</h4>`;
  for (const r of arr) {
    if (!r || typeof r !== 'object') continue;
    const id = `rich-${Math.random().toString(36).slice(2)}`;
    html += `<div class="richiamo">
      <p>${escapeHtml(testoSicuro(r.domanda || ''))}</p>
      <button class="btn" type="button" onclick="document.getElementById('${id}').style.display = document.getElementById('${id}').style.display === 'none' ? 'block' : 'none'">Mostra risposta</button>
      <p id="${id}" style="display:none">${escapeHtml(testoSicuro(r.risposta || ''))}</p>
    </div>`;
  }
  return html;
}

function renderRiepilogo(s) {
  if (!s) return '';
  return `<h4>Riepilogo</h4><p>${escapeHtml(testoSicuro(s))}</p>`;
}

function renderFlashcard(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  let html = `<h4>Flashcard</h4>`;
  for (const f of arr) {
    if (!f || typeof f !== 'object') continue;
    const id = `fc-${Math.random().toString(36).slice(2)}`;
    html += `<div class="flashcard" tabindex="0" role="button" aria-label="Gira la flashcard">
      <div class="fc-fronte">${escapeHtml(testoSicuro(f.fronte || ''))}</div>
      <div class="fc-retro" id="${id}" style="display:none">${escapeHtml(testoSicuro(f.retro || ''))}</div>
    </div>`;
  }
  return html;
}

function renderChecklist(cl) {
  if (!cl || typeof cl !== 'object') return '';
  return `<h4>Checklist</h4>
<h5>So fare</h5>${elenco(cl.so_fare)}
<h5>So dire</h5>${elenco(cl.so_dire)}`;
}

function elencoFonti(fonti) {
  if (!Array.isArray(fonti) || fonti.length === 0) return chipStato('nessuna fonte dichiarata', 'ok');
  let html = '<ul class="fonti">';
  for (const f of fonti) {
    if (!f || typeof f !== 'object') continue;
    html += `<li><strong>${escapeHtml(testoSicuro(f.chiave || ''))}</strong>: ${escapeHtml(testoSicuro(f.rif || ''))}</li>`;
  }
  html += '</ul>';
  return html;
}
