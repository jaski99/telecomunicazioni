/** Modalità «A buchi»: campi inline da completare e verifica contro le soluzioni accettate. */
import { escapeHtml, testoSicuro } from '../../core/math.js';

const SEGNAPOSTO = /___(\d+)___/g;

function normalizza(valore) {
  return String(valore == null ? '' : valore).trim().toLowerCase();
}

/** Confronta le risposte (chiave = numero del buco) con le varianti accettate.
 *  Restituisce i numeri dei buchi corretti ed errati, in ordine numerico. */
export function valutaBuchi(risposte, soluzioni) {
  const numeri = Object.keys(soluzioni || {}).sort((a, b) => Number(a) - Number(b));
  const corretti = [];
  const errati = [];
  for (const numero of numeri) {
    const varianti = Array.isArray(soluzioni[numero]) ? soluzioni[numero] : [];
    const risposta = normalizza(risposte && risposte[numero]);
    const ok = risposta !== '' && varianti.some((v) => normalizza(v) === risposta);
    (ok ? corretti : errati).push(numero);
  }
  return { corretti, errati };
}

/** Testo con ogni segnaposto ___n___ sostituito da un campo inline alto 44 px. */
export function renderTestoBuchi(testo) {
  return escapeHtml(testoSicuro(testo)).replace(SEGNAPOSTO, (_m, numero) =>
    `<input class="dim-buco" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="80" data-buco="${numero}" aria-label="Buco ${numero}">`
  );
}

export function renderABuchi(dim) {
  const ab = dim.a_buchi;
  if (!ab || typeof ab !== 'object' || !ab.testo) {
    return `<section class="card"><h2 class="card__title">A buchi</h2><p>Nessun esercizio a buchi per questa dimostrazione.</p></section>`;
  }
  return `<section class="card dim-abuchi" aria-labelledby="titolo-abuchi">
<h2 class="card__title" id="titolo-abuchi">A buchi</h2>
<p>Completa ogni buco, poi premi <strong>Controlla</strong>.</p>
<div class="prose dim-abuchi__testo">${renderTestoBuchi(ab.testo)}</div>
<div class="dim-abuchi__azioni"><button class="btn" type="button" data-abuchi="controlla">Controlla</button><button class="btn btn--ghost" type="button" data-abuchi="reimposta">Reimposta</button></div>
<div class="dim-esito" aria-live="polite" data-esito></div>
</section>`;
}

/** Testo e classi dell'esito: callout--ok se tutti i buchi sono giusti, altrimenti callout--error con l'elenco. */
function esitoHtml(esito) {
  if (esito.errati.length === 0) {
    return { classe: 'callout callout--ok', html: '<p>Esatto! Tutti i buchi sono corretti.</p>' };
  }
  const elenco = esito.errati.map((n) => `<li>Buco ${escapeHtml(n)}</li>`).join('');
  return { classe: 'callout callout--error', html: `<p>Non ancora: ${esito.errati.length === 1 ? 'un buco da rivedere' : 'buchi da rivedere'}.</p><ul>${elenco}</ul>` };
}

export function setupABuchi(container, dim) {
  const ab = dim.a_buchi;
  const sezione = container.querySelector('.dim-abuchi');
  if (!sezione || !ab || !ab.soluzioni || Object.keys(ab.soluzioni).length === 0) return () => {};
  const esito = sezione.querySelector('[data-esito]');
  const campi = () => [...sezione.querySelectorAll('.dim-buco')];
  const alClick = (ev) => {
    const bottone = ev.target.closest('[data-abuchi]');
    if (!bottone) return;
    if (bottone.dataset.abuchi === 'reimposta') {
      for (const campo of campi()) {
        campo.value = '';
        campo.classList.remove('dim-buco--ok', 'dim-buco--errore');
      }
      esito.innerHTML = '';
      esito.className = 'dim-esito';
      return;
    }
    const risposte = {};
    for (const campo of campi()) risposte[campo.dataset.buco] = campo.value;
    const valutazione = valutaBuchi(risposte, ab.soluzioni);
    for (const campo of campi()) {
      const ok = valutazione.corretti.includes(campo.dataset.buco);
      campo.classList.toggle('dim-buco--ok', ok);
      campo.classList.toggle('dim-buco--errore', !ok);
    }
    const { classe, html } = esitoHtml(valutazione);
    esito.innerHTML = html;
    esito.className = `dim-esito ${classe}`;
  };
  sezione.addEventListener('click', alClick);
  return () => sezione.removeEventListener('click', alClick);
}
