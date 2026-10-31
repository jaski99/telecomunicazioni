/* Router figure: renderFigura(specOId, figureDisponibili). accetta ID stringa
   + elenco figure; "Figura non disponibile" solo se l'ID non esiste. */

import { renderGrafico } from './grafico.js';
import { renderBlocchi } from './blocchi.js';
import { renderTemporale } from './temporale.js';
import { figuraSVG, figuraSoloTesto, svgBase, fontSize } from './helpers.js';

const RENDERER = { grafico: renderGrafico, blocchi: renderBlocchi, temporale: renderTemporale };

function opzioniBlocchiResponsive(opzioni) {
  if (opzioni.larghezzaMassima != null || typeof window === 'undefined') return opzioni;
  const viewport = window.innerWidth;
  const larghezzaMassima = viewport < 600 ? viewport - 72 : viewport < 1024 ? viewport - 96
    : viewport < 1200 ? viewport - 404 : 750;
  return { ...opzioni, larghezzaMassima: Math.max(80, larghezzaMassima) };
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
