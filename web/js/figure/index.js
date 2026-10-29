/* Router figure: renderFigura(specOId, figureDisponibili). accetta ID stringa
   + elenco figure; "Figura non disponibile" solo se l'ID non esiste. */

import { renderGrafico } from './grafico.js';
import { renderBlocchi } from './blocchi.js';
import { renderTemporale } from './temporale.js';
import { figuraSVG, figuraSoloTesto, svgBase, fontSize } from './helpers.js';

const RENDERER = { grafico: renderGrafico, blocchi: renderBlocchi, temporale: renderTemporale };

export function renderFigura(specOId, figureDisponibili = []) {
  try {
    let spec = specOId;
    if (typeof specOId === 'string') {
      spec = Array.isArray(figureDisponibili) ? figureDisponibili.find(f => f && String(f.id) === specOId) : undefined;
      if (!spec) return figuraSoloTesto({ titolo: 'Figura', descrizione: 'Figura non disponibile.' });
    }
    if (!spec || typeof spec !== 'object') return figuraSoloTesto(spec);
    const tipo = spec.tipo; if (!tipo || !RENDERER[tipo]) return figuraSoloTesto({ titolo: spec.titolo, descrizione: spec.descrizione });
    const r = RENDERER[tipo](spec);
    const fs = r.fs || fontSize(r.viewBox.w);
    const svg = svgBase(spec, r.viewBox.w, r.viewBox.h, r.svgInner, fs);
    return figuraSVG(spec, svg, r.serie);
  } catch (_e) { return figuraSoloTesto(specOId); }
}
