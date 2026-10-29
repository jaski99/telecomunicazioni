/** Pagina #/ripasso: ripasso SM-2 a intervalli 1-3-7-14 giorni sullo stato
 * di studio dei nodi. Usa solo chiavi tlc-kg: (store.js).
 */
import { linkNodo } from '../ui.js';
import { testoSicuro, escapeHtml } from '../core/math.js';
import { leggiEsiti } from '../../modules/quiz/esiti.js';
import {
  leggiChiave,
  scriviChiave,
  KEY_STATO,
  KEY_RIPASSO,
  KEY_IMPOSTAZIONI,
  backupTutteChiavi,
  importaChiavi,
} from '../core/store.js';

const INTERVALLI = [1, 3, 7, 14]; // giorni SM-2

export function render(ctx) {
  const { graph, storage } = ctx;
  const nodi = Array.isArray(graph.nodi) ? graph.nodi : [];
  const ripasso = leggiChiave(storage, KEY_RIPASSO, {}) || {};
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  // Livelli di padronanza dai risultati quiz (chiave tlc-kg:esiti-quiz:v1)
  const esiti = leggiEsiti(storage) || [];
  const padronanzaPerNodo = {};
  for (const e of esiti) {
    if (!padronanzaPerNodo[e.nodo_id]) padronanzaPerNodo[e.nodo_id] = { ok: 0, totale: 0 };
    padronanzaPerNodo[e.nodo_id].totale++;
    if (e.corretto) padronanzaPerNodo[e.nodo_id].ok++;
  }

  let html = `<h1>Ripasso (SM-2: 1-3-7-14 giorni)</h1>
<p>Intervalli di ripasso dopo una revisione positiva: 1, 3, 7 e 14 giorni.
I nodi in scadenza o scaduti sono in cima all'elenco.</p>`;

  const righe = nodi.filter((n) => n).map((n) => {
    const r = ripasso[String(n.id)] || {};
    const prossimo = r.prossimo ? new Date(r.prossimo) : null;
    const scaduto = prossimo && prossimo < oggi;
    const intervalloAttuale = Number(r.intervallo || 0);
    return { n, r, prossimo, scaduto, intervalloAttuale };
  });

  righe.sort((a, b) => {
    if (a.scaduto && !b.scaduto) return -1;
    if (!a.scaduto && b.scaduto) return 1;
    if (!a.prossimo && b.prossimo) return -1;
    if (a.prossimo && !b.prossimo) return 1;
    if (a.prossimo && b.prossimo) return a.prossimo - b.prossimo;
    return 0;
  });

  if (righe.length === 0) {
    html += `<p class="avviso">Nessun nodo da ripassare (grafo vuoto o non caricato).</p>`;
  } else {
    html += `<table class="tabella">
<thead><tr><th>Nodo</th><th>Area</th><th>Ultimo intervallo</th><th>Prossimo</th><th>Stato</th><th>Padronanza</th><th>Azioni</th></tr></thead>
<tbody>`;
    for (const { n, r, prossimo, scaduto, intervalloAttuale } of righe) {
      const dataStr = prossimo ? formatData(prossimo) : 'mai revisionato';
      const p = padronanzaPerNodo[String(n.id)] || { ok: 0, totale: 0 };
      const padronanzaStr = p.totale > 0
        ? `${Math.round((p.ok / p.totale) * 100)}% (${p.ok}/${p.totale})`
        : '<span class="muted">nessun esito</span>';
      html += `<tr>
      <td><a href="#/nodo/${escapeHtml(String(n.id))}">${escapeHtml(testoSicuro(n.titolo || n.id))}</a></td>
      <td>${escapeHtml(testoSicuro(String(n.area || '?')))}</td>
      <td>${escapeHtml(String(r.intervallo || 0))} giorni</td>
      <td>${dataStr}</td>
      <td>${scaduto ? '<span class="chip chip-in-arrivo">da ripassare</span>' : '<span class="chip chip-ok">ok</span>'}</td>
      <td>${padronanzaStr}</td>
      <td>
        <button class="btn piccoli" type="button" data-id="${escapeHtml(String(n.id))}" data-esito="si">Ricorda</button>
        <button class="btn piccoli secondario" type="button" data-id="${escapeHtml(String(n.id))}" data-esito="no">Non ricorda</button>
      </td>
    </tr>`;
    }
    html += '</tbody></table>';
  }

  // Data d'esame (impostazioni) + backup/import di tutte le chiavi tlc-kg:.
  const impostazioni = leggiChiave(storage, KEY_IMPOSTAZIONI, {}) || {};
  html += `<section class="impostazioni">
  <h2>Impostazioni</h2>
  <p>Data d'esame:<br><input type="date" id="input-data-esame" value="${escapeHtml(String(impostazioni.data_esame || ''))}"></p>
  <button class="btn" type="button" id="btn-salva-data">Salva data esame</button>
  <button class="btn secondario" type="button" id="btn-backup">Backup JSON (chiavi tlc-kg:)</button>
  <button class="btn secondario" type="button" id="btn-import-file">Importa JSON</button>
  <input type="file" id="input-import" accept=".json" style="margin-left:8px;display:none">
  <div id="esito-storage" class="esito" aria-live="polite"></div>
</section>`;
  return html;
}

export function setup(container, ctx) {
  const { storage } = ctx;
  container.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-id]');
    if (btn) {
      const id = btn.getAttribute('data-id');
      const esito = btn.getAttribute('data-esito') === 'si';
      aggiornaRipasso(storage, id, esito);
      location.reload();
      return;
    }
    if (ev.target.id === 'btn-salva-data') {
      salvaDataEsame(storage, container);
      return;
    }
    if (ev.target.id === 'btn-backup') {
      backupJSON(storage, container);
      return;
    }
    if (ev.target.id === 'btn-import-file') {
      container.querySelector('#input-import').click();
      return;
    }
  });
  container.querySelector('#input-import').addEventListener('change', (ev) => {
    importaFileJSON(storage, ev.target.files, container);
  });
}

function aggiornaRipasso(storage, id, esito) {
  const ripasso = leggiChiave(storage, KEY_RIPASSO, {}) || {};
  const r = ripasso[String(id)] || {};
  let intervallo = Number(r.intervallo || 0);
  if (!esito) intervallo = 0;
  else if (intervallo === 0) intervallo = 1;
  else if (intervallo === 1) intervallo = 3;
  else if (intervallo === 3) intervallo = 7;
  else if (intervallo === 7) intervallo = 14;
  const prossimo = new Date();
  prossimo.setDate(prossimo.getDate() + intervallo);
  ripasso[String(id)] = { intervallo, prossimo: prossimo.toISOString() };
  scriviChiave(storage, KEY_RIPASSO, ripasso);
}

function salvaDataEsame(storage, container) {
  const input = container.querySelector('#input-data-esame');
  const impostazioni = leggiChiave(storage, KEY_IMPOSTAZIONI, {}) || {};
  impostazioni.data_esame = input ? input.value : '';
  scriviChiave(storage, KEY_IMPOSTAZIONI, impostazioni);
  const esito = container.querySelector('#esito-storage');
  if (esito) esito.textContent = 'Data esame salvata.';
}

function backupJSON(storage, container) {
  const dati = backupTutteChiavi(storage);
  const blob = new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tlc-kg-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  const esito = container.querySelector('#esito-storage');
  if (esito) esito.textContent = 'Backup scaricato (tlc-kg-backup.json).';
}

function importaFileJSON(storage, files, container) {
  const file = files && files[0];
  if (!file) return;
  const lettore = new FileReader();
  lettore.onload = () => {
    try {
      const dati = JSON.parse(lettore.result);
      const n = importaChiavi(storage, dati);
      const esito = container.querySelector('#esito-storage');
      if (esito) esito.textContent = 'Importate ' + n + ' chiavi tlc-kg:.';
    } catch (_err) {
      const esito = container.querySelector('#esito-storage');
      if (esito) esito.textContent = 'File JSON non valido.';
    }
  };
  lettore.readAsText(file);
}

function prossimoIntervalloDa(intervallo) {
  if (intervallo === 0) return 1;
  if (intervallo === 1) return 3;
  if (intervallo === 3) return 7;
  return 14;
}

function formatData(d) {
  const gg = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${gg}/${mm}/${d.getFullYear()}`;
}
