/** web/js/pages/nodo/util.js — owner E1.
 * Helper condivisi per il rendering della scheda nodo.
 */
import { renderMarkdown } from '../../ui.js';
import {
  testoSicuro,
  escapeHtml,
  tokenizzaMatematica,
  formulaBlock,
  devePromuovereInDisplay,
} from '../../core/math.js';
import { puliziaTesto, formulaConPunteggiatura, paragrafoConFormule } from '../esercizi.js';

export const blocchi = (testo, prefisso = '') => paragrafoConFormule(testo, { blocchi: true, prefisso });
export const voce = (testo, soloInline = false) => paragrafoConFormule(testo, { blocchi: false, soloInline });
export const esc = (s) => escapeHtml(testoSicuro(s));

export function renderChecklist(voci) {
  if (!Array.isArray(voci) || !voci.length) return '';
  return `<ul class="nodo-checklist">${voci.map((v) => `<li>${voce(v)}</li>`).join('')}</ul>`;
}

export function bottoneRivelatore(id, etichettaMostra, contenutoHtml) {
  if (!contenutoHtml) return '';
  return `<div class="nodo-rivelatore">
    <button class="btn btn--ghost js-rivelatore" type="button" aria-expanded="false" data-target="${id}" data-label="${escapeHtml(etichettaMostra)}">${escapeHtml(etichettaMostra)}</button>
    <div id="${id}" class="nodo-rivelato prose" hidden>${contenutoHtml}</div>
  </div>`;
}

export function renderProsaMarkdown(testo) {
  const formule = [];
  const protetto = tokenizzaMatematica(puliziaTesto(testo))
    .map((t) => (t.type === 'text' ? t.body : `@@TLCF${formule.push(t) - 1}@@`))
    .join('');
  const html = renderMarkdown(protetto).replace(/@@TLCF(\d+)@@([.,;:)]*)/g, (_, idx, punct) => {
    const f = formule[Number(idx)];
    if (f.type === 'display' || f.body.length > 48 || devePromuovereInDisplay(f.body)) {
      const resto = punct.replace(/^[.,;:]+/, '');
      return `@@BOX_START@@${formulaBlock(f.body)}@@BOX_END@@${escapeHtml(resto)}`;
    }
    return formulaConPunteggiatura(f.body, punct);
  });
  return html
    .replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) =>
      inner.includes('@@BOX_START@@')
        ? inner.split(/@@BOX_START@@([\s\S]*?)@@BOX_END@@/).map((seg, i) =>
          i % 2 === 1 ? seg : (seg.trim() ? `<p>${seg.replace(/^[.,;:]+\s*/, '').trimStart()}</p>` : '')
        ).join('')
        : `<p>${inner}</p>`)
    .replace(/@@BOX_(?:START|END)@@/g, '');
}
