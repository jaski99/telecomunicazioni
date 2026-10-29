/**
 * Pagina #/ripasso: ripasso distanziato (intervalli 1-3-7-14 giorni).
 * Mobile (< 768 px): .stack-list di card con bottoni >= 44 px.
 * Desktop (>= 768 px): .table in .scroll-x. Impostazioni e backup JSON.
 */
import { testoSicuro, escapeHtml } from '../core/math.js';
import { formattaParoleIntere } from './grafo.js';
import { leggiEsiti } from '../../modules/quiz/esiti.js';
import { leggiChiave, scriviChiave, KEY_RIPASSO, KEY_IMPOSTAZIONI, backupTutteChiavi, importaChiavi } from '../core/store.js';

export function prossimoIntervallo(attuale, ricordato) {
  if (!ricordato) return 0;
  const n = Number(attuale || 0);
  if (n <= 0) return 1;
  if (n === 1) return 3;
  return n === 3 ? 7 : 14;
}

function formatData(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function chipStatoRipasso(prossimo, scaduto) {
  if (scaduto) return '<span class="chip chip--warn">Da ripassare</span>';
  return prossimo ? '<span class="chip chip--ok">In regola</span>' : '<span class="chip chip--info">Da iniziare</span>';
}

function bottoniValutazione(id) {
  return `<div class="ripasso-azioni"><button class="btn btn--primary" type="button" data-id="${id}" data-esito="si">Ricorda</button><button class="btn btn--ghost" type="button" data-id="${id}" data-esito="no">Non ricorda</button></div>`;
}

export function render(ctx) {
  const graph = (ctx && ctx.graph) || {};
  const storage = ctx && ctx.storage;
  const nodi = (Array.isArray(graph.nodi) ? graph.nodi : []).filter(Boolean);
  const ripasso = leggiChiave(storage, KEY_RIPASSO, {}) || {};
  const impostazioni = leggiChiave(storage, KEY_IMPOSTAZIONI, {}) || {};
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);

  const padronanza = {};
  for (const e of leggiEsiti(storage) || []) {
    if (!padronanza[e.nodo_id]) padronanza[e.nodo_id] = { ok: 0, tot: 0 };
    padronanza[e.nodo_id].tot += 1;
    if (e.corretto) padronanza[e.nodo_id].ok += 1;
  }

  const righe = nodi.map((n) => {
    const r = ripasso[String(n.id)] || {};
    const prossimo = r.prossimo ? new Date(r.prossimo) : null;
    const scaduto = Boolean(prossimo && prossimo < oggi);
    const p = padronanza[String(n.id)] || { ok: 0, tot: 0 };
    return {
      id: escapeHtml(String(n.id)),
      tit: formattaParoleIntere(n.titolo || n.id),
      area: escapeHtml(String(n.area || 1)),
      intervallo: Number(r.intervallo || 0),
      prossimo,
      scaduto,
      dataStr: formattaParoleIntere(prossimo ? formatData(prossimo) : 'Mai revisionato'),
      pad: formattaParoleIntere(p.tot > 0 ? `${Math.round((p.ok / p.tot) * 100)}% (${p.ok}/${p.tot})` : 'Nessun esito'),
    };
  }).sort((a, b) => (Number(b.scaduto) - Number(a.scaduto))
    || (Number(!b.prossimo) - Number(!a.prossimo))
    || ((a.prossimo && b.prossimo) ? a.prossimo - b.prossimo : 0));

  const cardsHtml = righe.length === 0
    ? '<li class="card"><p>Nessun argomento da ripassare nel grafo corrente.</p></li>'
    : righe.map((x) => `<li class="card ripasso-card">
      <a class="ripasso-link" href="#/nodo/${x.id}">${x.tit}</a>
      <div class="chip-row"><span class="chip">Area ${x.area}</span>${chipStatoRipasso(x.prossimo, x.scaduto)}<span class="chip">Prossimo: ${x.dataStr}</span><span class="chip">Intervallo: ${x.intervallo} giorni</span><span class="chip">Quiz: ${x.pad}</span></div>
      ${bottoniValutazione(x.id)}
    </li>`).join('');

  const tableRows = righe.length === 0
    ? '<tr><td colspan="7">Nessun argomento da ripassare nel grafo corrente.</td></tr>'
    : righe.map((x) => `<tr><td><a class="ripasso-link" href="#/nodo/${x.id}">${x.tit}</a></td><td>Area ${x.area}</td><td>${x.intervallo} giorni</td><td>${x.dataStr}</td><td>${chipStatoRipasso(x.prossimo, x.scaduto)}</td><td>${x.pad}</td><td>${bottoniValutazione(x.id)}</td></tr>`).join('');

  return `<h1>Ripasso programmato</h1>
<div class="prose"><p>Ripasso a intervalli crescenti (1, 3, 7 e 14 giorni) con priorità automatica ai nodi scaduti o mai revisionati e sintesi della padronanza nei quiz.</p></div>
<section class="ripasso-sezione">
  <h2>Piano di revisione</h2>
  <ul class="stack-list ripasso-mobile">${cardsHtml}</ul>
  <div class="scroll-x ripasso-desktop" tabindex="0" role="region" aria-label="Tabella del piano di ripasso">
    <table class="table tabella">
      <thead><tr><th scope="col">Argomento</th><th scope="col">Area</th><th scope="col">Intervallo</th><th scope="col">Prossimo</th><th scope="col">Stato</th><th scope="col">Padronanza</th><th scope="col">Valutazione</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</section>
<section class="card ripasso-impostazioni">
  <h2>Impostazioni e salvataggio dati</h2>
  <div class="ripasso-campo"><label for="input-data-esame">Data prevista dell'esame</label><input type="date" id="input-data-esame" value="${escapeHtml(testoSicuro(impostazioni.data_esame || ''))}"></div>
  <div class="ripasso-azioni">
    <button class="btn btn--primary" type="button" id="btn-salva-data">Salva data esame</button>
    <button class="btn btn--ghost" type="button" id="btn-backup">Esporta backup JSON</button>
    <button class="btn btn--ghost" type="button" id="btn-import-file">Importa JSON</button>
    <input type="file" id="input-import" accept=".json" hidden>
  </div>
  <div id="esito-storage" class="callout" aria-live="polite" hidden></div>
</section>`;
}

export function setup(container, ctx) {
  const storage = ctx && ctx.storage;
  const mostraEsito = (msg) => { const box = container.querySelector('#esito-storage'); if (box) { box.hidden = false; box.textContent = msg; } };
  container.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-id]');
    if (btn) {
      const id = String(btn.getAttribute('data-id'));
      const rip = leggiChiave(storage, KEY_RIPASSO, {}) || {};
      const intervallo = prossimoIntervallo(rip[id] && rip[id].intervallo, btn.getAttribute('data-esito') === 'si');
      const prossimo = new Date(); prossimo.setDate(prossimo.getDate() + intervallo);
      rip[id] = { intervallo, prossimo: prossimo.toISOString() };
      scriviChiave(storage, KEY_RIPASSO, rip);
      container.innerHTML = render(ctx);
      return;
    }
    if (ev.target.closest('#btn-salva-data')) {
      const imp = leggiChiave(storage, KEY_IMPOSTAZIONI, {}) || {};
      const inp = container.querySelector('#input-data-esame');
      imp.data_esame = inp ? inp.value : ''; scriviChiave(storage, KEY_IMPOSTAZIONI, imp);
      mostraEsito('Data esame salvata.');
    } else if (ev.target.closest('#btn-backup')) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(backupTutteChiavi(storage), null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'tlc-kg-backup.json'; a.click(); URL.revokeObjectURL(url);
      mostraEsito('Backup scaricato (tlc-kg-backup.json).');
    } else if (ev.target.closest('#btn-import-file')) {
      const fileIn = container.querySelector('#input-import'); if (fileIn) fileIn.click();
    }
  });
  container.addEventListener('change', (ev) => {
    if (ev.target.id !== 'input-import' || !ev.target.files || !ev.target.files[0]) return;
    const lettore = new FileReader();
    lettore.onload = () => {
      try { mostraEsito(`Importate ${importaChiavi(storage, JSON.parse(lettore.result))} chiavi tlc-kg:.`); }
      catch (_e) { mostraEsito('File JSON non valido.'); }
    };
    lettore.readAsText(ev.target.files[0]);
  });
}
