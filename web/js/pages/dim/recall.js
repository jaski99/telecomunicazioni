/** Modalità «Recall»: domande con risposta nascosta, esposta con aria-expanded. */
import { escapeHtml, testoSicuro } from '../../core/math.js';

const idRisposta = (dimId, i) => `recall-${String(dimId)}-${i}`;

export function renderRecall(dim) {
  const domande = Array.isArray(dim.richiamo_attivo) ? dim.richiamo_attivo.filter((r) => r && typeof r === 'object') : [];
  if (!domande.length) {
    return `<section class="card"><h2 class="card__title">Recall</h2><p>Nessuna domanda di recall per questa dimostrazione.</p></section>`;
  }
  const schede = domande.map((r, i) => `<article class="card dim-recall__scheda">
<p><strong>Domanda ${i + 1} di ${domande.length}</strong></p>
<p>${escapeHtml(testoSicuro(r.domanda))}</p>
<button class="btn btn--ghost" type="button" data-recall="${i}" aria-expanded="false" aria-controls="${idRisposta(dim.id, i)}">Mostra risposta</button>
<div class="callout dim-recall__risposta" id="${idRisposta(dim.id, i)}" hidden><p>${escapeHtml(testoSicuro(r.risposta))}</p></div>
</article>`).join('');
  return `<section class="dim-recall" aria-label="Domande di recall"><h2>Recall</h2><p>Leggi la domanda, prova a rispondere, poi mostra la risposta.</p>${schede}</section>`;
}

export function setupRecall(container) {
  const sezione = container.querySelector('.dim-recall');
  if (!sezione) return () => {};
  const alClick = (ev) => {
    const bottone = ev.target.closest('[data-recall]');
    if (!bottone) return;
    const risposta = document.getElementById(bottone.getAttribute('aria-controls'));
    if (!risposta) return;
    const aperta = bottone.getAttribute('aria-expanded') === 'true';
    bottone.setAttribute('aria-expanded', String(!aperta));
    bottone.textContent = aperta ? 'Mostra risposta' : 'Nascondi risposta';
    risposta.hidden = aperta;
  };
  sezione.addEventListener('click', alClick);
  return () => sezione.removeEventListener('click', alClick);
}
