/** Render e aggiornamento dei passi, incluse figure progressive e confronto accessibile. */
import { escapeHtml, formulaBlock, testoSicuro } from '../../core/math.js';
import { renderFigura } from '../../figure/index.js';
import { progressione, etichetteNuove } from '../../figure/progressione.js';
import { passi } from './dati.js';

const t = v => escapeHtml(testoSicuro(v));
const figuraSpec = (dim, id) => (dim.figure || []).find(f => f && String(f.id) === String(id));
const primaOccorrenza = (dim, p) => !passi(dim).some(x => Number(x.n) < Number(p.n) && String(x.figura || '') === String(p.figura || ''));

function numeroFigura(dim, numeroPasso) {
  return passi(dim).filter(p => p.figura && Number(p.n) <= numeroPasso).length;
}

function figuraConfrontabile(p, dim, area, opzioni = {}) {
  const n = Number(p.n), prec = passi(dim).find(x => Number(x.n) === n - 1 && x.figura);
  const precedente = prec && figuraSpec(dim, prec.figura), corrente = figuraSpec(dim, p.figura);
  const relazione = precedente && corrente ? progressione(precedente, corrente) : { compatibile: false, nuovi: [] };
  const numero = numeroFigura(dim, n), prefix = `${Number(area) || 1}.${numero}`;
  let progressiva = {}, didascalia = `Figura ${prefix} — ${testoSicuro(corrente && corrente.titolo)}`;
  if (relazione.compatibile) {
    const etichette = etichetteNuove(relazione.nuovi);
    progressiva = { progressione: relazione };
    didascalia = `Figura ${prefix} — nuovo in questo passo: ${etichette.length ? etichette.join(', ') : testoSicuro(corrente.titolo)}`;
  }
  const correnteHtml = renderFigura(p.figura, dim.figure, { ...progressiva, senzaId: !primaOccorrenza(dim, p), istanza: `passo-${n}`, didascalia });
  if (!relazione.compatibile) return { html: correnteHtml, compatibile: false };
  const confrontoId = `confronto-passo-${n}`;
  const prima = renderFigura(prec.figura, dim.figure, { senzaId: true, istanza: `confronto-prima-${n}`, didascalia: `Figura ${prefix.slice(0, prefix.lastIndexOf('.'))}.${numero - 1} — ${testoSicuro(precedente.titolo)}` });
  const dopo = renderFigura(p.figura, dim.figure, { ...progressiva, senzaId: true, istanza: `confronto-dopo-${n}`, didascalia });
  return { compatibile: true, html: `${correnteHtml}
<button class="btn btn--ghost figura-confronta" type="button" aria-expanded="false" aria-controls="${confrontoId}">Confronta con il passo precedente</button>
<div class="figura-confronto" id="${confrontoId}" hidden><div><h4>Passo ${n - 1}</h4>${prima}</div><div><h4>Passo ${n}</h4>${dopo}</div></div>` };
}

export function renderPasso(p, dim, rivelato, area = 1) {
  const n = Number(p.n) || 0, id = p.figura ? String(p.figura) : '';
  const figura = rivelato && id ? figuraConfrontabile(p, dim, area).html : '';
  const slot = id ? `<div class="step__figura" data-figura="${t(id)}">${figura}</div>` : '';
  return `<li class="step ${rivelato ? 'step--rivelato' : 'step--nascosto'}" id="passo-${n}" data-passo="${n}" tabindex="-1">
<h3 class="step__titolo"><span class="step__num" aria-hidden="true">${n}</span><span>Passo ${n}</span><span class="step__nascosto-testo"> — nascosto</span></h3>
<div class="step__corpo"${rivelato ? '' : ' hidden'}>
<div class="prose step__testo"><p>${t(p.testo)}</p></div>
${p.formula ? `<div class="passo-formula">${formulaBlock(p.formula)}</div>` : ''}
${slot}
<aside class="callout callout--tip nota-margine" role="note"><p class="callout__title">Perché si può fare</p><p>${t(p.perche)}</p></aside>
</div>
</li>`;
}

export function renderPassi(dim, rivelati, area = 1) {
  const items = passi(dim).map(p => renderPasso(p, dim, Number(p.n) <= rivelati, area)).join('');
  return `<ol class="dim-passi" aria-label="Passi della dimostrazione">${items}</ol>`;
}

function riempiFigura(li, dim, area) {
  const slot = li.querySelector('.step__figura[data-figura]');
  if (!slot || slot.childElementCount > 0) return;
  const p = passi(dim).find(x => Number(x.n) === Number(li.dataset.passo));
  if (p) slot.innerHTML = figuraConfrontabile(p, dim, area).html;
}

export function aggiornaPassi(root, dim, rivelati, area = 1) {
  for (const li of root.querySelectorAll('.step[data-passo]')) {
    const attivo = Number(li.dataset.passo) <= rivelati;
    li.classList.toggle('step--rivelato', attivo); li.classList.toggle('step--nascosto', !attivo);
    const corpo = li.querySelector('.step__corpo'); if (corpo) corpo.hidden = !attivo;
    if (attivo) riempiFigura(li, dim, area);
  }
}

export function portaPassoInVista(root, n) {
  const li = root.querySelector(`.step[data-passo="${Number(n)}"]`);
  if (!li) return;
  li.scrollIntoView({ block: 'center' }); li.focus({ preventScroll: true });
}
