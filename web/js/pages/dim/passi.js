/** Passi della dimostrazione: render, aggiornamento della rivelazione, portata in vista. */
import { escapeHtml, formulaBlock, testoSicuro } from '../../core/math.js';
import { renderFigura } from '../../figure/index.js';
import { passi } from './dati.js';

const t = (v) => escapeHtml(testoSicuro(v));

/** Un passo: il contenuto è sempre nel DOM (formula compresa) ma nascosto finché non è rivelato.
 *  Le figure dei passi nascosti non sono renderizzate: arrivano alla rivelazione. */
export function renderPasso(p, dim, rivelato) {
  const n = Number(p.n) || 0;
  const figuraId = p.figura ? String(p.figura) : '';
  const figura = rivelato && figuraId ? renderFigura(figuraId, dim.figure) : '';
  const slot = figuraId ? `<div class="step__figura" data-figura="${escapeHtml(figuraId)}">${figura}</div>` : '';
  return `<li class="step ${rivelato ? 'step--rivelato' : 'step--nascosto'}" id="passo-${n}" data-passo="${n}" tabindex="-1">
<h3 class="step__titolo"><span class="step__num" aria-hidden="true">${n}</span><span>Passo ${n}</span><span class="step__nascosto-testo"> — nascosto</span></h3>
<div class="step__corpo"${rivelato ? '' : ' hidden'}>
<div class="prose step__testo"><p>${t(p.testo)}</p></div>
${p.formula ? `<div class="passo-formula">${formulaBlock(p.formula)}</div>` : ''}
${slot}
<aside class="callout callout--tip"><p class="callout__title">Perché si può fare</p><p>${t(p.perche)}</p></aside>
</div>
</li>`;
}

export function renderPassi(dim, rivelati) {
  const items = passi(dim).map((p) => renderPasso(p, dim, Number(p.n) <= rivelati)).join('');
  return `<ol class="dim-passi" aria-label="Passi della dimostrazione">${items}</ol>`;
}

function riempiFigura(li, dim) {
  const slot = li.querySelector('.step__figura[data-figura]');
  if (!slot || slot.childElementCount > 0) return;
  const passo = passi(dim).find((p) => Number(p.n) === Number(li.dataset.passo));
  if (!passo) return;
  slot.innerHTML = renderFigura(passo.figura, dim.figure);
}

/** Allinea i passi al numero di passi rivelati (classi, corpo nascosto, figura al primo rivelo). */
export function aggiornaPassi(root, dim, rivelati) {
  for (const li of root.querySelectorAll('.step[data-passo]')) {
    const attivo = Number(li.dataset.passo) <= rivelati;
    li.classList.toggle('step--rivelato', attivo);
    li.classList.toggle('step--nascosto', !attivo);
    const corpo = li.querySelector('.step__corpo');
    if (corpo) corpo.hidden = !attivo;
    if (attivo) riempiFigura(li, dim);
  }
}

/** Porta il passo n al centro dello schermo e gli dà il focus (senza cambiare l'hash). */
export function portaPassoInVista(root, n) {
  const li = root.querySelector(`.step[data-passo="${Number(n)}"]`);
  if (!li) return;
  li.scrollIntoView({ block: 'center' });
  li.focus({ preventScroll: true });
}
