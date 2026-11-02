/* Router figure: renderFigura(specOId, figureDisponibili). accetta ID stringa
   + elenco figure; "Figura non disponibile" solo se l'ID non esiste. */

import { renderGrafico } from './grafico.js';
import { renderBlocchi } from './blocchi.js';
import { renderTemporale } from './temporale.js';
import { figuraSVG, figuraSoloTesto, svgBase, fontSize } from './helpers.js';

const RENDERER = { grafico: renderGrafico, blocchi: renderBlocchi, temporale: renderTemporale };

/** Larghezza utile del riquadro della figura: il contenuto di .scroll-x misura
 *  viewport - 34 px sotto i 600 px, viewport - 50 px fino a 768 px, poi 718 px.
 *  Si resta sotto di una manciata di pixel per non sfiorare lo scorrimento. */
export function larghezzaUtileFigura(viewport) {
  const utile = viewport < 600 ? viewport - 40 : viewport < 768 ? viewport - 56 : 670;
  return Math.max(80, utile);
}

function opzioniBlocchiResponsive(opzioni) {
  if (opzioni.larghezzaMassima != null || typeof window === 'undefined') return opzioni;
  return { ...opzioni, larghezzaMassima: larghezzaUtileFigura(window.innerWidth), adattaAlContenitore: true };
}

export function renderFigura(specOId, figureDisponibili = [], opzioni = {}) {
  try {
    let spec = specOId;
    if (typeof specOId === 'string') {
      spec = Array.isArray(figureDisponibili) ? figureDisponibili.find(f => f && String(f.id) === specOId) : undefined;
      if (!spec) return figuraSoloTesto({ titolo: 'Figura', descrizione: 'Figura non disponibile.' });
    }
    if (!spec || typeof spec !== 'object') return figuraSoloTesto(spec);
    const tipo = spec.tipo; if (!tipo || !RENDERER[tipo]) return figuraSoloTesto({ titolo: spec.titolo, descrizione: spec.descrizione });
    const rendering = tipo === 'blocchi' ? opzioniBlocchiResponsive(opzioni) : opzioni;
    const r = RENDERER[tipo](spec, rendering);
    const fs = r.fs || fontSize(r.viewBox.w);
    const svg = svgBase(spec, r.viewBox.w, r.viewBox.h, r.svgInner, fs, rendering);
    return figuraSVG(spec, svg, r.serie, rendering);
  } catch (_e) { return figuraSoloTesto(specOId); }
}
