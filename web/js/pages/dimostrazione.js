/** Pagina #/dim/<id>: dimostrazione con 5 modalita. Studio rivela i passi
 * uno alla volta col perché. Tutti i campi sono sempre visibili.
 * Mantiene il file sotto le 200 righe.
 */
import { testoSicuro, escapeHtml } from '../core/math.js';
import { elenco, chipStato, linkNodo } from '../ui.js';
import { renderFigura } from '../figure/index.js';
const KEY = 'tlc-kg:dimostrazioni:v1';
export function render(ctx, params) {
  const nodo = (Array.isArray(ctx.graph.nodi) ? ctx.graph.nodi : []).find(
    (n) => n && String(n.id) === String(params && params.id)
  );
  const dim = nodo && nodo.dimostrazione ? nodo.dimostrazione : null;
  if (!dim) {
    return `<h1>Dimostrazione non trovata</h1><p class="avviso">Nessuna dimostrazione per il nodo <strong>${escapeHtml(String(params && params.id))}</strong> (in arrivo).</p>`;
  }
  const progresso = leggiChiaveLocal(ctx.storage, `${KEY}.${String(dim.id)}`, {});
  const passoAttivo = Math.min(Math.max(progresso.passiRivelati || 0, 0), dim.passi.length);
  const domandeHtml = Array.isArray(dim.domande_esame) && dim.domande_esame.length
    ? dim.domande_esame.map((d) => `<span class="badge">${escapeHtml(String(d))}</span>`).join(' ')
    : chipStato('nessuna prova diretta', 'ok');
  return `<h1>${escapeHtml(testoSicuro(dim.titolo || dim.id))}</h1>
<p class="meta">
  <span class="badge">${escapeHtml(testoSicuro(nodo.tipo || ''))}</span>${domandeHtml}
  ${verificaBadge(dim.verifica)}
  <a href="#/nodo/${escapeHtml(String(nodo.id))}" class="btn secondario" style="float:right">Nodo ${escapeHtml(String(nodo.id))}</a>
</p>
<section class="sempre-visibile">
  ${dim.enunciato ? `<h2>Enunciato</h2><p>${escapeHtml(testoSicuro(dim.enunciato))}</p>` : ''}
  ${dim.ipotesi ? `<h2>Ipotesi</h2><p>${escapeHtml(testoSicuro(dim.ipotesi))}</p>` : ''}
  ${dim.notazione ? `<h2>Notazione</h2><ul>${Array.isArray(dim.notazione) ? dim.notazione.map((s) => `<li><strong>${escapeHtml(String(s.simbolo || ''))}</strong>: ${escapeHtml(testoSicuro(s.significato || ''))}</li>`).join('') : `<li>${escapeHtml(testoSicuro(dim.notazione))}</li>`}</ul>` : ''}
  ${dim.idea ? `<h2>Idea della dimostrazione</h2><p>${escapeHtml(testoSicuro(dim.idea))}</p>` : ''}
  ${dim.formula_finale ? `<h2>Formula finale</h2><div class="formula">${escapeHtml('$' + dim.formula_finale + '$')}</div>` : ''}
  ${renderFigureLista(dim.figure)}
  ${dim.errori_frequenti ? `<h2>Errori frequenti</h2>${elenco(dim.errori_frequenti)}` : ''}
  ${dim.fonti ? `<h2>Fonti</h2>${elenco(dim.fonti)}` : ''}
  ${dim.verifica ? `<h2>Verifica</h2><p>${escapeHtml(testoSicuro(dim.verifica.stato || ''))}</p>${dim.verifica.note ? `<p class="muted">${escapeHtml(testoSicuro(dim.verifica.note))}</p>` : ''}${renderPuntiAperti(dim.verifica.punti_aperti)}` : ''}
</section>
<div class="toolbar" role="radiogroup" aria-label="Modalita di studio">
  <button class="btn attivo" type="button" data-modo="studio">Studio</button>
  <button class="btn" type="button" data-modo="avocce">A voce</button>
  <button class="btn" type="button" data-modo="compatta">Compatta</button>
  <button class="btn" type="button" data-modo="abuchi">A buchi</button>
  <button class="btn" type="button" data-modo="recall">Recall</button>
</div>
<section id="modo-studio" class="modo attivo">${renderStudio(dim, passoAttivo)}</section>
<section id="modo-avocce" class="modo" hidden><h2>A voce</h2><p>${escapeHtml(testoSicuro(dim.a_voce || ''))}</p></section>
<section id="modo-compatta" class="modo" hidden><h2>Versione compatta</h2>${Array.isArray(dim.versione_compatta) ? elenco(dim.versione_compatta) : `<p>${escapeHtml(testoSicuro(dim.versione_compatta || ''))}</p>`}</section>
<section id="modo-abuchi" class="modo" hidden>${renderABuchi(dim)}</section>
<section id="modo-recall" class="modo" hidden>${renderRecall(dim)}</section>`;
}
export function setup(container, ctx, params) {
  const nodo = (Array.isArray(ctx.graph.nodi) ? ctx.graph.nodi : []).find(
    (n) => n && String(n.id) === String(params && params.id)
  );
  const dim = nodo && nodo.dimostrazione ? nodo.dimostrazione : null;
  if (!dim) return;
  setupModi(container);
  setupStudio(container, dim, ctx.storage);
  setupABuchi(container, dim);
  setupRecall(container, dim);
}
function setupModi(container) {
  const tb = container.querySelector('.toolbar');
  if (!tb) return;
  tb.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-modo]');
    if (!btn) return;
    const modo = btn.getAttribute('data-modo');
    for (const b of tb.querySelectorAll('button[data-modo]')) b.classList.toggle('attivo', b === btn);
    for (const s of container.querySelectorAll('.modo')) s.hidden = s.id !== 'modo-' + modo;
  });
}
function renderStudio(dim, passoAttivo) {
  const totale = dim.passi.length;
  let html = `<p class="muted">Passi rivelati: ${passoAttivo} di ${totale}. Clicca "Passo successivo" per rivelare il passo con il suo <strong>perché</strong>.</p><div class="studio-passi">`;
  for (const p of dim.passi) {
    const n = Number(p.n) || 0;
    const visibile = n <= passoAttivo;
    html += `<div class="passo ${visibile ? 'visibile' : 'nascosto'}" id="passo-${n}">
      <div class="passo-header">Passo ${n}</div>
      <p class="passo-testo">${escapeHtml(testoSicuro(p.testo || ''))}</p>
      ${p.formula ? `<div class="passo-formula">${escapeHtml('$' + p.formula + '$')}</div>` : ''}
      ${p.figura ? renderFigura(p.figura) : ''}
      <div class="passo-perche"><strong>Perché si può fare:</strong> ${escapeHtml(testoSicuro(p.perche || ''))}</div>
    </div>`;
  }
  return html + `</div><div class="studio-controlli"><button class="btn" id="btn-passo-successivo" type="button">${passoAttivo >= totale ? 'Tutti i passi rivelati' : 'Passo successivo'}</button><button class="btn secondario" id="btn-passo-reset" type="button">Ripristina</button></div>`;
}
function setupStudio(container, dim, storage) {
  const btnNext = container.querySelector('#btn-passo-successivo');
  const btnReset = container.querySelector('#btn-passo-reset');
  if (!btnNext || !btnReset) return;
  const chiave = `${KEY}.${String(dim.id)}`;
  let progresso = leggiChiaveLocal(storage, chiave, {});
  btnNext.addEventListener('click', () => {
    const rivelati = Math.min(Math.max(progresso.passiRivelati || 0, 0) + 1, dim.passi.length);
    progresso.passiRivelati = rivelati;
    scriviChiaveLocal(storage, chiave, progresso);
    container.querySelectorAll('.passo').forEach((el) => {
      const n = Number(el.id.slice(el.id.lastIndexOf('-') + 1));
      el.classList.toggle('visibile', n <= rivelati);
      el.classList.toggle('nascosto', n > rivelati);
    });
    btnNext.disabled = rivelati >= dim.passi.length;
    btnNext.textContent = rivelati >= dim.passi.length ? 'Tutti i passi rivelati' : 'Passo successivo';
  });
  btnReset.addEventListener('click', () => {
    progresso.passiRivelati = 0;
    scriviChiaveLocal(storage, chiave, progresso);
    container.querySelectorAll('.passo').forEach((el) => {
      el.classList.remove('visibile');
      el.classList.add('nascosto');
    });
    btnNext.disabled = false;
    btnNext.textContent = 'Passo successivo';
  });
}
function renderABuchi(dim) {
  const ab = dim.a_buchi;
  if (!ab || typeof ab !== 'object' || !ab.testo)
    return `<p class="avviso">Nessun problema a buchi disponibile.</p>`;
  let testo = testoSicuro(ab.testo).replace(/___(\d+)___/g, (_m, num) =>
    `<span class="buco"><input type="text" data-buco="${escapeHtml(String(num))}" autocomplete="off" maxlength="80" aria-label="Buco ${escapeHtml(String(num))}"></span>`);
  const soluzioni = ab.soluzioni || {};
  return `<h2>A buchi</h2><p>Completa ogni buco, poi premi <strong>Controlla</strong>.</p><div class="abuchi-testo">${testo}</div><div class="abuchi-controlli"><button class="btn" id="btn-controlla-abuchi">Controlla</button><button class="btn secondario" id="btn-riset-abuchi">Reimposta</button></div><div id="esito-abuchi" class="esito" aria-live="polite"></div>`;
}
function setupABuchi(container, dim) {
  const ab = dim.a_buchi;
  if (!ab || !ab.testo) return;
  const soluzioni = ab.soluzioni || {};
  const btn = container.querySelector('#btn-controlla-abuchi');
  const btnReset = container.querySelector('#btn-riset-abuchi');
  const esito = container.querySelector('#esito-abuchi');
  if (!btn || !esito) return;
  btn.addEventListener('click', () => {
    let ok = true;
    esito.innerHTML = '';
    for (const el of container.querySelectorAll('.buco input')) {
      const attese = Array.isArray(soluzioni[el.getAttribute('data-buco')]) ? soluzioni[el.getAttribute('data-buco')] : [];
      const corretto = attese.some((a) => String(a || '').trim().toLowerCase() === el.value.trim().toLowerCase());
      if (!corretto) ok = false;
      el.classList.toggle('corretto', corretto);
      el.classList.toggle('sbagliato', !corretto && el.value.length > 0);
    }
    esito.innerHTML = ok ? '<strong>Esatto!</strong> Tutti i buchi sono corretti.' : '<strong>Non ancora.</strong> Controlla i buchi evidenziati.';
  });
  btnReset.addEventListener('click', () => {
    for (const el of container.querySelectorAll('.buco input')) { el.value = ''; el.classList.remove('corretto', 'sbagliato'); }
    esito.innerHTML = '';
  });
}
function renderRecall(dim) {
  const richiamo = Array.isArray(dim.richiamo_attivo) ? dim.richiamo_attivo : [];
  if (!richiamo.length) return `<p class="avviso">Nessuna domanda di recall per questa dimostrazione.</p>`;
  let html = `<h2>Recall attivo</h2><p>Leggi la domanda, poi confronta con la risposta nascosta.</p>`;
  for (let i = 0; i < richiamo.length; i++) {
    const r = richiamo[i], id = `recall-${String(dim.id)}-${i}`;
    html += `<div class="richiamo"><p><strong>Domanda ${i + 1}:</strong> ${escapeHtml(testoSicuro(r.domanda || ''))}</p><button class="btn" type="button">Mostra risposta</button><p id="${id}" style="display:none">${escapeHtml(testoSicuro(r.risposta || ''))}</p></div>`;
  }
  return html;
}
function setupRecall(container, dim) {
  const richiamo = Array.isArray(dim.richiamo_attivo) ? dim.richiamo_attivo : [];
  for (let i = 0; i < richiamo.length; i++) {
    const id = `recall-${String(dim.id)}-${i}`;
    const el = document.getElementById(id);
    const btn = el && el.previousElementSibling;
    if (!btn || !el) continue;
    btn.addEventListener('click', () => {
      const vis = el.style.display !== 'none';
      el.style.display = vis ? 'none' : 'block';
      btn.textContent = vis ? 'Mostra risposta' : 'Nascondi risposta';
    });
  }
}
function renderFigureLista(figura) {
  if (!Array.isArray(figura) || !figura.length) return '';
  return `<h2>Figure</h2>${figura.map((f) => renderFigura(f)).join('')}`;
}
function renderPuntiAperti(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return `<h3>Punti aperti</h3>${elenco(arr)}`;
}
function verificaBadge(v) {
  if (!v || typeof v !== 'object') return '';
  const stato = testoSicuro(v.stato || '');
  return stato ? `<span class="badge verifica" title="${escapeHtml(testoSicuro(v.note || ''))}">verifica: ${escapeHtml(stato)}</span>` : '';
}
function leggiChiaveLocal(storage, chiave, defaultValue) {
  if (!storage) return defaultValue;
  try { const raw = storage.getItem(chiave); return raw === null ? defaultValue : JSON.parse(raw); } catch (_e) { return defaultValue; }
}
function scriviChiaveLocal(storage, chiave, valore) {
  if (!storage) return false;
  try { storage.setItem(chiave, JSON.stringify(valore)); return true; } catch (_e) { return false; }
}
