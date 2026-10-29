/** Controlli di studio: barra di avanzamento, azioni, indice dei passi. Solo DOM e testi. */
import { escapeHtml } from '../../core/math.js';
import { passi } from './dati.js';

export function testoProgresso(rivelati, totale) {
  if (rivelati === 0) return `Nessun passo rivelato (0 di ${totale})`;
  return `Passo ${rivelati} di ${totale}`;
}

function percentuale(rivelati, totale) {
  return totale > 0 ? Math.round((rivelati / totale) * 100) : 0;
}

function voceIndice(n, rivelato) {
  return `<li><button class="dim-indice__voce" type="button" data-indice="${n}"${rivelato ? '' : ' disabled'}>Passo ${n}<span class="dim-indice__stato">${rivelato ? 'rivelato' : 'nascosto'}</span></button></li>`;
}

/** Barra fissa in basso su mobile, colonna sticky con indice da 1024 px (CSS). */
export function renderControlli(dim, rivelati) {
  const elenco = passi(dim);
  const totale = elenco.length;
  const indice = elenco.map((p) => voceIndice(Number(p.n) || 0, Number(p.n) <= rivelati)).join('');
  return `<aside class="dim-controlli" aria-label="Controlli di studio">
<div class="dim-controlli__progresso">
<p class="dim-controlli__testo" data-progresso-testo aria-live="polite">${escapeHtml(testoProgresso(rivelati, totale))}</p>
<div class="progress" role="progressbar" aria-label="Passi rivelati" aria-valuemin="0" aria-valuemax="${totale}" aria-valuenow="${rivelati}"><div class="progress__bar" data-progresso-barra style="width: ${percentuale(rivelati, totale)}%"></div></div>
</div>
<div class="dim-controlli__azioni">
<button class="btn btn--ghost" type="button" data-azione="indietro"${rivelati === 0 ? ' disabled' : ''}>Indietro</button>
<button class="btn" type="button" data-azione="avanti"${rivelati >= totale ? ' disabled' : ''}>Prossimo passo</button>
<button class="btn btn--ghost" type="button" data-azione="tutti"${rivelati >= totale ? ' disabled' : ''}>Mostra tutti</button>
<button class="btn btn--ghost" type="button" data-azione="ricomincia"${rivelati === 0 ? ' disabled' : ''}>Ricomincia</button>
</div>
<nav class="dim-indice" aria-label="Indice dei passi"><p class="dim-indice__titolo">Passi</p><ol class="dim-indice__lista">${indice}</ol></nav>
</aside>`;
}

/** Riallinea barra, testo, pulsanti e indice al nuovo numero di passi rivelati. */
export function aggiornaControlli(root, rivelati, totale) {
  const testo = root.querySelector('[data-progresso-testo]');
  if (testo) testo.textContent = testoProgresso(rivelati, totale);
  const progresso = root.querySelector('.progress');
  if (progresso) progresso.setAttribute('aria-valuenow', String(rivelati));
  const barra = root.querySelector('[data-progresso-barra]');
  if (barra) barra.style.width = `${percentuale(rivelati, totale)}%`;
  const azione = (nome) => root.querySelector(`[data-azione="${nome}"]`);
  if (azione('indietro')) azione('indietro').disabled = rivelati === 0;
  if (azione('avanti')) azione('avanti').disabled = rivelati >= totale;
  if (azione('tutti')) azione('tutti').disabled = rivelati >= totale;
  if (azione('ricomincia')) azione('ricomincia').disabled = rivelati === 0;
  for (const voce of root.querySelectorAll('[data-indice]')) {
    const n = Number(voce.dataset.indice);
    voce.disabled = n > rivelati;
    const stato = voce.querySelector('.dim-indice__stato');
    if (stato) stato.textContent = n <= rivelati ? 'rivelato' : 'nascosto';
  }
}
