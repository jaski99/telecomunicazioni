/**
 * Router delle figure SVG. Esporta renderFigura(spec) -> stringa HTML
 * contenente un <figure> accessibile con SVG oppure, per spec non valida,
 * solo la descrizione testuale. Mai solleva eccezioni non gestite.
 */

import { renderGrafico } from './grafico.js';
import { renderBlocchi } from './blocchi.js';
import { renderTemporale } from './temporale.js';
import { figuraSVG, figuraSoloTesto, svgBase } from './helpers.js';

const RENDERER = {
  grafico: renderGrafico,
  blocchi: renderBlocchi,
  temporale: renderTemporale,
};

/**
 * @param {object} spec
 * @returns {string} HTML <figure> ... </figure>
 */
export function renderFigura(spec) {
  try {
    if (!spec || typeof spec !== 'object') {
      return figuraSoloTesto(spec);
    }
    const titolo = testoSicuroLocal(spec.titolo);
    const descrizione = testoSicuroLocal(spec.descrizione);
    const tipo = spec.tipo;
    if (!tipo || !RENDERER[tipo]) {
      return figuraSoloTesto({ titolo, descrizione });
    }
    const svgInner = RENDERER[tipo](spec);
    const svg = svgBase(spec, spec.viewBox_w || 760, spec.viewBox_h || 460, svgInner);
    return figuraSVG(spec, svg);
  } catch (_err) {
    return figuraSoloTesto(spec);
  }
}

function testoSicuroLocal(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}
