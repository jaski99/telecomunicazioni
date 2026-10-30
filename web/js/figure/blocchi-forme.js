/* Disegno SVG: riceve geometria già calcolata, senza decidere il layout. */
import { escapeHtml, attributiProgressivi } from './helpers.js';
import { FS_BLOCCHI, INTERLINEA } from './blocchi-layout.js';

const SCURO = '#111827';
const TESTO = '#374151';
const n = valore => Math.round(valore * 100) / 100;

/** Un solo <text> per etichetta; ogni riga successiva riparte dal centro. */
export function disegnaTesto(t, sfondo = false) {
  if (!t || !t.righe.length) return '';
  const x = n(t.x), y = n(t.y - (t.righe.length - 1) * FS_BLOCCHI * INTERLINEA / 2);
  const fondo = sfondo ? `<rect x="${n(t.x - t.w / 2)}" y="${n(t.y - t.h / 2)}" width="${n(t.w)}" height="${n(t.h)}" fill="#fff" rx="2"/>` : '';
  const contenuto = t.righe.length === 1 ? escapeHtml(t.righe[0]) : t.righe.map((r, i) =>
    `<tspan x="${x}" dy="${i ? `${INTERLINEA}em` : '0'}">${escapeHtml(r)}</tspan>`).join('');
  return `${fondo}<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${TESTO}" font-family="sans-serif" font-size="${FS_BLOCCHI}" aria-label="${escapeHtml(t.originale)}">${contenuto}</text>`;
}

function figura(nodo) {
  const { x, y, w, h, forma } = nodo;
  if (forma === 'nodo') return `<circle cx="${n(x)}" cy="${n(y)}" r="6" fill="${SCURO}"/>`;
  if (forma === 'ingresso' || forma === 'uscita') {
    return `<line x1="${n(x - 16)}" y1="${n(y)}" x2="${n(x + 9)}" y2="${n(y)}" stroke="${SCURO}" stroke-width="2"/><path d="M ${n(x + 16)} ${n(y)} L ${n(x + 7)} ${n(y - 5)} L ${n(x + 7)} ${n(y + 5)} Z" fill="${SCURO}"/>`;
  }
  if (forma === 'sommatore' || forma === 'moltiplicatore') {
    const segno = forma === 'sommatore'
      ? `M ${n(x - 8)} ${n(y)} h 16 M ${n(x)} ${n(y - 8)} v 16`
      : `M ${n(x - 7)} ${n(y - 7)} l 14 14 M ${n(x + 7)} ${n(y - 7)} l -14 14`;
    return `<circle cx="${n(x)}" cy="${n(y)}" r="18" fill="#fff" stroke="${SCURO}" stroke-width="2"/><path d="${segno}" stroke="${SCURO}" stroke-width="2" fill="none"/>`;
  }
  return `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" fill="#fff" stroke="${SCURO}" stroke-width="2" rx="5"/>`;
}

export function disegnaBlocco(nodo, opzioni = {}, indice = 0) {
  const suffisso = opzioni.istanza ? `-${String(opzioni.istanza).replace(/[^a-zA-Z0-9_-]/g, '-')}` : '';
  const id = nodo.blocco.id ? ` id="blocco-${escapeHtml(String(nodo.blocco.id))}${suffisso}"` : '';
  const progressivo = attributiProgressivi(opzioni.progressione, 'blocco', indice, nodo.blocco.id || '');
  const esterno = !['rettangolo', 'ritardo'].includes(nodo.forma);
  const testi = nodo.testi.map((t, i) => disegnaTesto(t, esterno || (nodo.forma === 'ritardo' && i > 0))).join('');
  return `<g${id} class="blocco ${escapeHtml(nodo.forma)}" ${progressivo}>${figura(nodo)}${testi}</g>`;
}

export function disegnaFreccia(c) {
  const { inizio: a, base: b, fine: z, ali } = c;
  return `<path d="M ${n(a.x)} ${n(a.y)} L ${n(b.x)} ${n(b.y)}" fill="none" stroke="${SCURO}" stroke-width="2"/><path d="M ${n(z.x)} ${n(z.y)} L ${n(ali[0].x)} ${n(ali[0].y)} L ${n(ali[1].x)} ${n(ali[1].y)} Z" fill="${SCURO}"/>`;
}
