/* Renderer degli schemi a blocchi: layout, ingombri e viewBox senza tagli. */
import { FS_BLOCCHI, layoutBlocchi, layoutCollegamenti } from './blocchi-layout.js';
import { attributiProgressivi } from './helpers.js';
import { disegnaBlocco, disegnaFreccia, disegnaTesto } from './blocchi-forme.js';

const PADDING = 10;
const LARGHEZZA_MASSIMA = 700;

/** Unione degli ingombri di forme, testi, linee e punte delle frecce. */
export function bboxBlocchi(nodi, collegamenti) {
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  function aggiungi(b) {
    box.left = Math.min(box.left, b.left); box.right = Math.max(box.right, b.right);
    box.top = Math.min(box.top, b.top); box.bottom = Math.max(box.bottom, b.bottom);
  }
  for (const nodo of nodi) aggiungi(nodo.box);
  for (const c of collegamenti) {
    const punti = c.punti?.length ? [...c.punti, c.base] : [c.inizio, c.base, c.fine];
    for (const p of [...punti, ...c.ali]) {
      aggiungi({ left: p.x - 1, right: p.x + 1, top: p.y - 1, bottom: p.y + 1 });
    }
    if (c.testo) {
      const t = c.testo;
      aggiungi({ left: t.x - t.w / 2, right: t.x + t.w / 2, top: t.y - t.h / 2, bottom: t.y + t.h / 2 });
    }
  }
  return box;
}

function costruisci(blocchi, collegamenti, limite, spazio, completo = true) {
  const nodi = layoutBlocchi(blocchi, limite, spazio);
  const frecce = layoutCollegamenti(nodi, collegamenti, limite, completo);
  const box = bboxBlocchi(nodi, frecce);
  const left = Math.floor(box.left - PADDING), top = Math.floor(box.top - PADDING);
  const right = Math.ceil(box.right + PADDING), bottom = Math.ceil(box.bottom + PADDING);
  return { nodi, frecce, left, top, w: right - left, h: bottom - top };
}

function riorganizza(blocchi, colonnePerRiga, collegamenti) {
  const colonne = [...new Set(blocchi.map(b => Number(b.colonna) || 0))].sort((a, b) => a - b);
  const righe = [...new Set(blocchi.map(b => Number(b.riga) || 0))].sort((a, b) => a - b);
  const righeBase = new Map(righe.map((r, i) => [r, i]));
  const disposizione = blocchi.map(b => {
    const indice = colonne.indexOf(Number(b.colonna) || 0), fascia = Math.floor(indice / colonnePerRiga), pos = indice % colonnePerRiga;
    const fisica = fascia % 2 ? colonnePerRiga - 1 - pos : pos;
    return { ...b, colonna: fisica, riga: (righeBase.get(Number(b.riga) || 0) || 0) + fascia * righe.length };
  });
  if (colonnePerRiga !== 1 || disposizione.some(b => b.id == null)) return disposizione;
  // In una sola colonna un nodo a valle non deve precedere uno dei suoi ingressi.
  // L'ordine visivo gia' calcolato decide soltanto fra i nodi contemporaneamente liberi.
  const ordinati = [...disposizione].sort((a, b) => a.riga - b.riga || a.colonna - b.colonna
    || (a.__figuraIndice || 0) - (b.__figuraIndice || 0));
  const grado = new Map(ordinati.map(b => [String(b.id), 0])), successori = new Map();
  for (const c of collegamenti) {
    const da = String(c?.da), a = String(c?.a);
    if (!c || da === a || !grado.has(da) || !grado.has(a)) continue;
    if (!successori.has(da)) successori.set(da, []);
    successori.get(da).push(a); grado.set(a, grado.get(a) + 1);
  }
  const usati = new Set(), ordine = [];
  while (ordine.length < ordinati.length) {
    const libero = ordinati.find(b => !usati.has(String(b.id)) && grado.get(String(b.id)) === 0);
    if (!libero) return disposizione; // Un ciclo non ha un ordinamento topologico.
    const id = String(libero.id); usati.add(id); ordine.push(libero);
    for (const a of successori.get(id) || []) grado.set(a, grado.get(a) - 1);
  }
  const riga = new Map(ordine.map((b, i) => [String(b.id), i]));
  return disposizione.map(b => ({ ...b, riga: riga.get(String(b.id)) }));
}

export function renderBlocchi(spec, opzioni = {}) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const blocchi = Array.isArray(spec.blocchi) ? spec.blocchi
    .map((b, indice) => b && typeof b === 'object' ? { ...b, __figuraIndice: indice } : null).filter(Boolean) : [];
  if (blocchi.length < 2) throw new Error('servono almeno due blocchi');
  const collegamenti = Array.isArray(spec.collegamenti) ? spec.collegamenti : [];
  const cssWidth = Number(opzioni.larghezzaMassima);
  const larghezzaMassima = Number.isFinite(cssWidth) && cssWidth > 0
    ? Math.max(80, Math.floor(cssWidth * FS_BLOCCHI / 15)) : LARGHEZZA_MASSIMA;
  let disegno;
  // Prima si compatta il layout; se non basta, i blocchi rifluiscono in righe.
  for (let colonne = Infinity; colonne >= 1;) {
    const layout = Number.isFinite(colonne) ? riorganizza(blocchi, colonne, collegamenti) : blocchi;
    for (let limite = 16; limite >= 1; limite--) {
      const spazio = Math.max(0, 24 - (16 - limite) * 2);
      disegno = costruisci(layout, collegamenti, limite, spazio, false);
      if (disegno.w <= larghezzaMassima || (colonne === 1 && limite === 1)) {
        disegno = costruisci(layout, collegamenti, limite, spazio, true);
        if (disegno.w <= larghezzaMassima) break;
      }
    }
    if (disegno.w <= larghezzaMassima || colonne === 1) break;
    colonne = colonne === Infinity ? 6 : colonne - 1;
  }

  const frecce = disegno.frecce.map(c => `<g ${attributiProgressivi(opzioni.progressione, 'collegamento', c.indice)}>${disegnaFreccia(c)}${disegnaTesto(c.testo, true)}</g>`).join('');
  const forme = disegno.nodi.map(n => disegnaBlocco(n, opzioni, n.blocco.__figuraIndice)).join('');
  return { svgInner: `<g transform="translate(${-disegno.left},${-disegno.top})">${frecce}${forme}</g>`,
    viewBox: { w: disegno.w, h: disegno.h }, serie: [], fs: FS_BLOCCHI,
    nodi: disegno.nodi, frecce: disegno.frecce };
}
