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
    // Il glifo prosegue nel verso del collegamento, anche quando il flusso stretto
    // torna verso sinistra o verso l'alto. Un ingresso innestato (servito) delega
    // tratto e punta al collegamento: restano un solo tratto e una sola punta.
    if (forma === 'ingresso' && nodo.servito)
      return nodo.diramazione ? `<circle cx="${n(x)}" cy="${n(y)}" r="4" fill="${SCURO}"/>` : '';
    const giunzione = forma === 'uscita' && nodo.diramazione
      ? `<circle cx="${n(x)}" cy="${n(y)}" r="4" fill="${SCURO}"/>` : '';
    if (nodo.verticale) {
      const d = nodo.verso === 'su' ? -1 : 1;
      return `<line x1="${n(x)}" y1="${n(y - 16 * d)}" x2="${n(x)}" y2="${n(y + 9 * d)}" stroke="${SCURO}" stroke-width="2"/><path d="M ${n(x)} ${n(y + 16 * d)} L ${n(x - 5)} ${n(y + 7 * d)} L ${n(x + 5)} ${n(y + 7 * d)} Z" fill="${SCURO}"/>${giunzione}`;
    }
    const d = nodo.verso === 'sinistra' ? -1 : 1;
    return `<line x1="${n(x - 16 * d)}" y1="${n(y)}" x2="${n(x + 9 * d)}" y2="${n(y)}" stroke="${SCURO}" stroke-width="2"/><path d="M ${n(x + 16 * d)} ${n(y)} L ${n(x + 7 * d)} ${n(y - 5)} L ${n(x + 7 * d)} ${n(y + 5)} Z" fill="${SCURO}"/>${giunzione}`;
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

/** Linea da inizio a base + punta piena; con senzaPunta (innesto sul glifo di uscita)
 *  la linea arriva fino a fine e la punta resta quella del glifo. */
export function disegnaFreccia(c) {
  const punti = c.punti?.length ? c.punti : [c.inizio, c.fine];
  const percorso = ps => ps.map((p, i) => `${i ? 'L' : 'M'} ${n(p.x)} ${n(p.y)}`).join(' ');
  const linea = c.senzaPunta
    ? `<path d="${percorso(punti)}" fill="none" stroke="${SCURO}" stroke-width="2"/>`
    : `<path d="${percorso([...punti.slice(0, -1), c.base])}" fill="none" stroke="${SCURO}" stroke-width="2"/><path d="${percorso([c.fine, ...c.ali])} Z" fill="${SCURO}"/>`;
  return linea;
}
