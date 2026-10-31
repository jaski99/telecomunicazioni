/* Geometria pura per gli schemi a blocchi: nessun accesso al DOM. */
import { testoSicuro } from './helpers.js';
import { separaRaccordi } from './blocchi-raccordi.js';
import { risolviVincoli } from './blocchi-collisioni.js';

export const FS_BLOCCHI = 14;
export const INTERLINEA = 1.2;
const PASSO_TESTO = FS_BLOCCHI * INTERLINEA;
const SPAZIO_RIGHE = 48;

/** Va a capo solo fra parole: le parole lunghe occupano una riga e allargano il blocco. */
export function testoARighe(testo, limite = 16) {
  const parole = testoSicuro(testo).trim().split(/\s+/u).filter(Boolean);
  const righe = []; let riga = '';
  for (const parola of parole) {
    const candidata = riga ? `${riga} ${parola}` : parola;
    if (riga && Array.from(candidata).length > limite) { righe.push(riga); riga = parola; }
    else riga = candidata;
  }
  if (riga) righe.push(riga);
  return righe;
}

/** Stima conservativa per sans-serif: comprende anche glifi larghi e margine. */
export function misuraTesto(righe) {
  const larghezza = r => Array.from(r).reduce((sum, c) => {
    const fattore = /[MW@]/u.test(c) ? 1.05 : /[mw]/u.test(c) ? 1 : 0.8;
    return sum + FS_BLOCCHI * fattore;
  }, 8);
  return { w: righe.length ? Math.max(...righe.map(larghezza)) : 0,
    h: righe.length ? FS_BLOCCHI * 1.5 + (righe.length - 1) * PASSO_TESTO : 0 };
}

function testo(etichetta, limite, x = 0, y = 0) {
  const righe = testoARighe(etichetta, limite);
  return { originale: testoSicuro(etichetta), righe, x, y, ...misuraTesto(righe) };
}

function profilo(blocco, limite) {
  const forma = blocco.forma || 'rettangolo';
  const etichetta = testo(blocco.etichetta, limite);
  const rettangolo = !['sommatore', 'moltiplicatore', 'ritardo', 'nodo', 'ingresso', 'uscita'].includes(forma);
  const simboloSolo = forma === 'sommatore' && etichetta.originale.trim() === '+';
  const w = rettangolo ? Math.max(44, etichetta.w + 16) :
    forma === 'ritardo' ? 48 : forma === 'nodo' ? 16 :
    forma === 'ingresso' || forma === 'uscita' ? 32 : 36;
  const h = rettangolo ? Math.max(36, etichetta.h + 14) :
    forma === 'ritardo' ? 32 : forma === 'nodo' ? 16 :
    forma === 'ingresso' || forma === 'uscita' ? 16 : 36;
  if (!rettangolo) etichetta.y = h / 2 + 7 + etichetta.h / 2;
  const testi = etichetta.righe.length && !simboloSolo ? [etichetta] : [];
  if (forma === 'ritardo') testi.unshift(testo('D', limite));
  const box = { left: -w / 2 - 1, right: w / 2 + 1, top: -h / 2 - 1, bottom: h / 2 + 1 };
  for (const t of testi) {
    box.left = Math.min(box.left, t.x - t.w / 2); box.right = Math.max(box.right, t.x + t.w / 2);
    box.top = Math.min(box.top, t.y - t.h / 2); box.bottom = Math.max(box.bottom, t.y + t.h / 2);
  }
  return { blocco, forma, w, h, testi, box };
}

/** Colonne e righe usate sono ordinate e distanziate secondo i loro ingombri. */
export function layoutBlocchi(blocchi, limite = 16, spazioColonne = 24) {
  const nodi = blocchi.filter(b => b && typeof b === 'object').map(b => profilo(b, limite));
  const colonne = [...new Set(nodi.map(n => Number(n.blocco.colonna) || 0))].sort((a, b) => a - b);
  const righe = [...new Set(nodi.map(n => Number(n.blocco.riga) || 0))].sort((a, b) => a - b);
  const xs = new Map(), ys = new Map(); let cursore = 0;
  for (const c of colonne) {
    const col = nodi.filter(n => (Number(n.blocco.colonna) || 0) === c);
    const meta = Math.max(...col.map(n => Math.max(-n.box.left, n.box.right)));
    xs.set(c, cursore + meta); cursore += 2 * meta + spazioColonne;
  }
  cursore = 0;
  for (const r of righe) {
    const row = nodi.filter(n => (Number(n.blocco.riga) || 0) === r);
    const top = Math.min(...row.map(n => n.box.top)), bottom = Math.max(...row.map(n => n.box.bottom));
    ys.set(r, cursore - top); cursore += bottom - top + SPAZIO_RIGHE;
  }
  return nodi.map(n => {
    const x = xs.get(Number(n.blocco.colonna) || 0), y = ys.get(Number(n.blocco.riga) || 0);
    return { ...n, x, y, testi: n.testi.map(t => ({ ...t, x: x + t.x, y: y + t.y })),
      box: { left: x + n.box.left, right: x + n.box.right, top: y + n.box.top, bottom: y + n.box.bottom } };
  });
}

function bordo(da, a) {
  const dx = a.x - da.x, dy = a.y - da.y;
  if (!dx && !dy) return { x: da.x, y: da.y };
  const cerchio = ['sommatore', 'moltiplicatore', 'nodo'].includes(da.forma);
  const fattore = cerchio ? da.w / 2 / Math.hypot(dx, dy) :
    Math.min(dx ? da.w / 2 / Math.abs(dx) : Infinity, dy ? da.h / 2 / Math.abs(dy) : Infinity);
  return { x: da.x + dx * fattore, y: da.y + dy * fattore };
}

/** Nel flusso verticale l'etichetta va inizialmente di lato; dopo aver costruito
 *  tutti i collegamenti viene spostata se il suo fondo copre un tratto o una punta. */
const META_FRECCIA = 16;

function verticalizzaEstremo(n, altro) {
  if (n.verticale || Math.abs(altro.y - n.y) <= Math.abs(altro.x - n.x)) return;
  n.verticale = true;
  n.box.top = Math.min(n.box.top, n.y - META_FRECCIA - 1);
  n.box.bottom = Math.max(n.box.bottom, n.y + META_FRECCIA + 1);
  for (const t of n.testi) {
    t.x = n.x + 8 + t.w / 2; t.y = n.y;
    n.box.right = Math.max(n.box.right, t.x + t.w / 2);
  }
}

function codaUscita(n) {
  if (n.verticale) return { x: n.x, y: n.y + (n.verso === 'su' ? META_FRECCIA : -META_FRECCIA) };
  return { x: n.x + (n.verso === 'sinistra' ? META_FRECCIA : -META_FRECCIA), y: n.y };
}

function rettangoloTesto(t) {
  return { left: t.x - t.w / 2, right: t.x + t.w / 2, top: t.y - t.h / 2, bottom: t.y + t.h / 2 };
}

/** Intersezione segmento/rettangolo (Liang–Barsky), estremi compresi. */
function trattoSuRettangolo(a, b, r) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const p = [-dx, dx, -dy, dy], q = [a.x - r.left, r.right - a.x, a.y - r.top, r.bottom - a.y];
  let inizio = 0, fine = 1;
  for (let i = 0; i < 4; i++) {
    if (!p[i]) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > fine) return false; inizio = Math.max(inizio, t); }
    else { if (t < inizio) return false; fine = Math.min(fine, t); }
  }
  return true;
}

function etichettaCopreFreccia(t, frecce) {
  const r = rettangoloTesto(t);
  return frecce.some(c => {
    if (trattoSuRettangolo(c.inizio, c.senzaPunta ? c.fine : c.base, r)) return true;
    if (c.senzaPunta) return false;
    const punti = [c.fine, ...c.ali], xs = punti.map(p => p.x), ys = punti.map(p => p.y);
    return r.left <= Math.max(...xs) && r.right >= Math.min(...xs)
      && r.top <= Math.max(...ys) && r.bottom >= Math.min(...ys);
  });
}

function aggiornaBoxIngresso(n) {
  const box = { left: n.x - n.w / 2 - 1, right: n.x + n.w / 2 + 1,
    top: n.y - n.h / 2 - 1, bottom: n.y + n.h / 2 + 1 };
  if (n.verticale) {
    box.top = Math.min(box.top, n.y - META_FRECCIA - 1);
    box.bottom = Math.max(box.bottom, n.y + META_FRECCIA + 1);
  }
  for (const t of n.testi) {
    const r = rettangoloTesto(t);
    box.left = Math.min(box.left, r.left); box.right = Math.max(box.right, r.right);
    box.top = Math.min(box.top, r.top); box.bottom = Math.max(box.bottom, r.bottom);
  }
  n.box = box;
}

/** Un ingresso con diramazioni può avere sia un tratto orizzontale sia uno verticale:
 *  il fondo opaco dell'etichetta non deve nasconderne uno già disegnato. */
function liberaEtichetteIngressi(frecce, perId) {
  for (const n of perId.values()) {
    if (n.forma !== 'ingresso') continue;
    for (const t of n.testi) {
      if (!etichettaCopreFreccia(t, frecce)) continue;
      const candidati = [
        { x: n.x, y: n.y - META_FRECCIA - 8 - t.h / 2 },
        { x: n.x - META_FRECCIA - 8 - t.w / 2, y: n.y },
        { x: n.x, y: n.y + META_FRECCIA + 8 + t.h / 2 },
        { x: n.x + META_FRECCIA + 8 + t.w / 2, y: n.y },
      ];
      const libero = candidati.find(p => !etichettaCopreFreccia({ ...t, ...p }, frecce));
      if (libero) { t.x = libero.x; t.y = libero.y; aggiornaBoxIngresso(n); }
    }
  }
}

/** Gli estremi delle frecce si fermano al bordo delle forme, mai al centro. */
export function layoutCollegamenti(nodi, collegamenti, limite = 16, completo = true) {
  const perId = new Map(nodi.map(n => [String(n.blocco.id), n]));
  const uscenti = new Map(), entranti = new Map();
  for (const c of collegamenti) if (c) {
    uscenti.set(String(c.da), (uscenti.get(String(c.da)) || 0) + 1);
    entranti.set(String(c.a), (entranti.get(String(c.a)) || 0) + 1);
  }
  const risultato = [];
  for (const [indice, c] of collegamenti.entries()) {
    if (!c) continue;
    const da = perId.get(String(c.da)), a = perId.get(String(c.a));
    if (!da || !a || da === a) continue;
    if (a.forma === 'uscita') {
      verticalizzaEstremo(a, da);
      a.verso = a.verticale ? (da.y <= a.y ? 'giu' : 'su') : (da.x <= a.x ? 'destra' : 'sinistra');
    }
    // Le diramazioni partono dal medesimo punto, mai da code o punte diverse.
    if (da.forma === 'ingresso') {
      da.servito = true; da.diramazione = uscenti.get(String(c.da)) > 1;
      if (!da.diramazione) verticalizzaEstremo(da, a);
    } else if (da.forma === 'uscita') da.diramazione = (entranti.get(String(c.da)) || 0) > 0;
    const inizio = da.diramazione ? { x: da.x, y: da.y } : da.forma === 'ingresso'
      ? (da.verticale ? { x: da.x, y: da.y - META_FRECCIA } : { x: da.x - META_FRECCIA, y: da.y })
      : da.forma === 'uscita' ? { x: da.x + da.w / 2, y: da.y } : bordo(da, a);
    const fine = a.forma === 'uscita' ? codaUscita(a) : bordo(a, da);
    const dx = fine.x - inizio.x, dy = fine.y - inizio.y, lunghezza = Math.hypot(dx, dy) || 1;
    const ux = dx / lunghezza, uy = dy / lunghezza;
    const base = { x: fine.x - ux * 8, y: fine.y - uy * 8 };
    const ali = [{ x: base.x - uy * 4, y: base.y + ux * 4 }, { x: base.x + uy * 4, y: base.y - ux * 4 }];
    const et = testo(c.etichetta, limite);
    if (et.righe.length) {
      et.x = (inizio.x + fine.x) / 2; et.y = (inizio.y + fine.y) / 2;
      if (Math.abs(dy) > Math.abs(dx)) et.x += et.w / 2 + 8;
      else et.y -= et.h / 2 + 8;
    }
    risultato.push({ inizio, fine, base, ali, senzaPunta: a.forma === 'uscita', testo: et.righe.length ? et : null, indice });
  }
  separaRaccordi(risultato, collegamenti, perId);
  liberaEtichetteIngressi(risultato, perId);
  risultato.conflitti = risolviVincoli(risultato, collegamenti, perId, completo);
  return risultato;
}
