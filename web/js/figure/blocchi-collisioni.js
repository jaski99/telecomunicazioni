/* Vincoli geometrici dei diagrammi: corsie distinte ed etichette opache libere. */
const EPS = 1e-7;
const DISTANZA_CORSIE = 8;
const DISTANZA_PUNTE = 14;
const MONCONE = 12;
const copia = p => ({ x: p.x, y: p.y });
const stesso = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 0.1;
const rettangoloTesto = t => ({ left: t.x - t.w / 2, right: t.x + t.w / 2, top: t.y - t.h / 2, bottom: t.y + t.h / 2 });
const rettangoloNodo = n => ({ left: n.x - n.w / 2, right: n.x + n.w / 2, top: n.y - n.h / 2, bottom: n.y + n.h / 2 });
const sovrapposti = (a, b) => a.left < b.right - 0.1 && a.right > b.left + 0.1 && a.top < b.bottom - 0.1 && a.bottom > b.top + 0.1;
const formaConBordo = n => !['ingresso', 'uscita'].includes(n.forma);

/** Ingombro della forma effettivamente disegnata (per i fondi opachi). */
function rettangoloForma(n) {
  if (n.forma === 'ingresso' && n.servito)
    return n.diramazione ? { left: n.x - 4, right: n.x + 4, top: n.y - 4, bottom: n.y + 4 } : null;
  if (n.forma === 'ingresso' || n.forma === 'uscita')
    return n.verticale ? { left: n.x - 5, right: n.x + 5, top: n.y - 16, bottom: n.y + 16 }
      : { left: n.x - 16, right: n.x + 16, top: n.y - 5, bottom: n.y + 5 };
  return rettangoloNodo(n);
}

/** Se due tratti sono paralleli, distanza e lunghezza della proiezione comune. */
function paralleli(a, b, c, d) {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
  const lr = Math.hypot(rx, ry), ls = Math.hypot(sx, sy);
  if (lr < 0.01 || ls < 0.01 || Math.abs(rx * sy - ry * sx) / (lr * ls) > 1e-6) return null;
  const ux = rx / lr, uy = ry / lr;
  const pc = (c.x - a.x) * ux + (c.y - a.y) * uy, pd = (d.x - a.x) * ux + (d.y - a.y) * uy;
  return { dist: Math.abs((c.x - a.x) * uy - (c.y - a.y) * ux),
    overlap: Math.min(lr, Math.max(pc, pd)) - Math.max(0, Math.min(pc, pd)) };
}

function latiNodo(n) {
  if (!formaConBordo(n)) return [];
  const r = rettangoloNodo(n);
  return [[{ x: r.left, y: r.top }, { x: r.right, y: r.top }],
    [{ x: r.left, y: r.bottom }, { x: r.right, y: r.bottom }],
    [{ x: r.left, y: r.top }, { x: r.left, y: r.bottom }],
    [{ x: r.right, y: r.top }, { x: r.right, y: r.bottom }]];
}

const cacheNodi = new WeakMap();
function datiNodo(n) {
  if (!cacheNodi.has(n)) cacheNodi.set(n, { rect: rettangoloNodo(n), lati: latiNodo(n) });
  return cacheNodi.get(n);
}

function scatoleLontane(a, b, c, d, distanzaMinima = DISTANZA_CORSIE) {
  return Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) - Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) >= distanzaMinima
    || Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) - Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) >= distanzaMinima;
}

function trattoRettangolo(a, b, r) {
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

/** Restituisce il punto di incrocio, oppure "tratto" per una sovrapposizione collineare. */
function incrocio(a, b, c, d) {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) > EPS) {
    const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
    const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
    if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
    return { x: a.x + t * rx, y: a.y + t * ry };
  }
  if (Math.abs((c.x - a.x) * ry - (c.y - a.y) * rx) > EPS
    || Math.abs((d.x - a.x) * ry - (d.y - a.y) * rx) > EPS) return null;
  const asse = Math.abs(rx) >= Math.abs(ry) ? 'x' : 'y';
  const valori = [a[asse], b[asse], c[asse], d[asse]];
  if (Math.abs(valori[0] - valori[1]) < EPS && Math.abs(valori[2] - valori[3]) < EPS) return null;
  const lo = Math.max(Math.min(valori[0], valori[1]), Math.min(valori[2], valori[3]));
  const hi = Math.min(Math.max(valori[0], valori[1]), Math.max(valori[2], valori[3]));
  if (hi < lo - EPS) return null;
  if (hi - lo > EPS) return 'tratto';
  const altro = asse === 'x' ? 'y' : 'x';
  return { [asse]: lo, [altro]: Math.abs(a[asse] - lo) < EPS ? a[altro] : Math.abs(b[asse] - lo) < EPS ? b[altro] : c[altro] };
}

const vertici = c => c.punti?.length ? c.punti : [c.inizio, c.fine];
const segmenti = punti => punti.slice(1).map((p, i) => [punti[i], p]);

function compatibili(corrente, tratto, altro, altroTratto) {
  if (scatoleLontane(tratto[0], tratto[1], altroTratto[0], altroTratto[1])) return true;
  const corsie = paralleli(tratto[0], tratto[1], altroTratto[0], altroTratto[1]);
  if (corsie && corsie.overlap > 0.1 && corsie.dist < DISTANZA_CORSIE - 0.01) return false;
  const p = incrocio(tratto[0], tratto[1], altroTratto[0], altroTratto[1]);
  if (!p) return true;
  if (p === 'tratto') return false;
  const estremiA = [vertici(corrente)[0], vertici(corrente).at(-1)];
  const estremiB = [vertici(altro)[0], vertici(altro).at(-1)];
  return estremiA.some(x => stesso(p, x)) && estremiB.some(x => stesso(p, x));
}

function lunghezza(punti) {
  return segmenti(punti).reduce((s, [a, b]) => s + Math.hypot(b.x - a.x, b.y - a.y), 0);
}

function ripulisci(punti) {
  const out = [];
  for (const p of punti) {
    if (out.length && stesso(out.at(-1), p)) continue;
    if (out.length >= 2) {
      const a = out[out.length - 2], b = out[out.length - 1];
      if (Math.abs((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)) < EPS
        && (b.x - a.x) * (p.x - b.x) + (b.y - a.y) * (p.y - b.y) >= -EPS) out.pop();
    }
    out.push(copia(p));
  }
  return out;
}

function aggiornaFreccia(c, punti) {
  punti = ripulisci(punti);
  c.inizio = copia(punti[0]); c.fine = copia(punti.at(-1));
  if (punti.length > 2) c.punti = punti.map(copia); else delete c.punti;
  const precedente = punti.at(-2), dx = c.fine.x - precedente.x, dy = c.fine.y - precedente.y;
  const lun = Math.hypot(dx, dy) || 1, ux = dx / lun, uy = dy / lun;
  c.base = { x: c.fine.x - ux * 8, y: c.fine.y - uy * 8 };
  c.ali = [{ x: c.base.x - uy * 4, y: c.base.y + ux * 4 }, { x: c.base.x + uy * 4, y: c.base.y - ux * 4 }];
  if (c.testo) {
    const tratto = segmenti(punti).sort((a, b) => Math.hypot(b[1].x - b[0].x, b[1].y - b[0].y)
      - Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y))[0];
    const [a, b] = tratto, t = c.testo;
    t.x = (a.x + b.x) / 2; t.y = (a.y + b.y) / 2;
    if (Math.abs(b.y - a.y) > Math.abs(b.x - a.x)) t.x += t.w / 2 + 8;
    else t.y -= t.h / 2 + 8;
  }
}

function bordo(n, verso) {
  const dx = verso.x - n.x, dy = verso.y - n.y;
  if (!dx && !dy) return { x: n.x, y: n.y };
  const cerchio = ['sommatore', 'moltiplicatore', 'nodo'].includes(n.forma);
  const fattore = cerchio ? n.w / 2 / Math.hypot(dx, dy)
    : Math.min(dx ? n.w / 2 / Math.abs(dx) : Infinity, dy ? n.h / 2 / Math.abs(dy) : Infinity);
  return { x: n.x + dx * fattore, y: n.y + dy * fattore };
}

function unisciDiramazioni(frecce, collegamenti, perId) {
  const gruppi = new Map();
  for (const c of frecce) {
    const da = String(collegamenti[c.indice].da), nodo = perId.get(da);
    // Il centro comune con punto di giunzione vale per gli ingressi diramati
    // e per le uscite attraversate dalla retroazione: gli altri blocchi
    // espongono porte distinte per ciascun collegamento uscente.
    if (!nodo || !(nodo.forma === 'ingresso' || (nodo.forma === 'uscita' && nodo.diramazione))) continue;
    if (!gruppi.has(da)) gruppi.set(da, []);
    gruppi.get(da).push(c);
  }
  for (const gruppo of gruppi.values()) {
    if (gruppo.length < 2) continue;
    const inizio = copia(gruppo[0].inizio);
    for (const c of gruppo.slice(1)) if (!stesso(c.inizio, inizio)) aggiornaFreccia(c, [inizio, c.fine]);
  }
}

const distanza = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angoloDi = (n, p) => Math.atan2(p.y - n.y, p.x - n.x);
const differenzaAngoli = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function assegnaEstremo(c, estremo, punto) {
  const punti = vertici(c);
  aggiornaFreccia(c, estremo === 'fine' ? [...punti.slice(0, -1), punto] : [punto, ...punti.slice(1)]);
}

function datiEstremi(n, gruppo, estremo) {
  return gruppo.map(c => {
    const punti = vertici(c);
    const rif = estremo === 'fine' ? (punti.at(-2) || punti[0]) : (punti[1] || punti.at(-1));
    return { c, punto: estremo === 'fine' ? c.fine : c.inizio, a: angoloDi(n, rif) };
  }).sort((x, y) => x.a - y.a);
}

function distribuisciCerchio(n, gruppo, estremo, soglia, fissi) {
  const dati = datiEstremi(n, gruppo, estremo), r = n.w / 2;
  const interniOk = dati.every((d, i) => dati.slice(i + 1).every(e => distanza(d.punto, e.punto) >= soglia - 0.01));
  const fissiOk = dati.every(d => fissi.every(p => distanza(d.punto, p) >= 7 - 0.01));
  if (interniOk && fissiOk) return;
  const delta = 2 * Math.asin(Math.min(1, soglia / (2 * r)));
  let vuoto = -1, primo = 0;
  for (let i = 0; i < dati.length; i++) {
    const salto = (dati[(i + 1) % dati.length].a - dati[i].a + 2 * Math.PI) % (2 * Math.PI);
    if (salto > vuoto) { vuoto = salto; primo = (i + 1) % dati.length; }
  }
  const ordinati = dati.slice(primo).concat(dati.slice(0, primo));
  const svolti = ordinati.map((d, i) => d.a + (i && d.a < ordinati[0].a ? 2 * Math.PI : 0));
  const arco = svolti.at(-1) - svolti[0];
  let base = null;
  if (dati.length > 1 && arco <= Math.PI + EPS) {
    const passo = Math.max(delta, arco / (dati.length - 1));
    if ((dati.length - 1) * passo <= 2 * Math.PI - delta + EPS) {
      const centro = svolti.reduce((s, a) => s + a, 0) / svolti.length;
      base = ordinati.map((_, i) => centro + (i - (dati.length - 1) / 2) * passo);
    }
  }
  if (!base) {
    const passo = 2 * Math.PI / dati.length;
    const rotazione = svolti.reduce((s, a, i) => s + a - i * passo, 0) / svolti.length;
    base = ordinati.map((_, i) => rotazione + i * passo);
  }
  let scelta = base;
  if (fissi.length) {
    let punteggioScelto = Infinity;
    for (let gradi = -180; gradi <= 180; gradi += 5) {
      const rot = gradi * Math.PI / 180, prova = base.map(a => a + rot);
      const punti = prova.map(a => ({ x: n.x + r * Math.cos(a), y: n.y + r * Math.sin(a) }));
      const violazioni = punti.reduce((s, p) => s + fissi.filter(q => distanza(p, q) < 7 - 0.01).length, 0);
      const scarto = prova.reduce((s, a, i) => s + differenzaAngoli(a, ordinati[i].a) ** 2, 0);
      const punteggio = violazioni * 100 + scarto;
      if (punteggio < punteggioScelto) { punteggioScelto = punteggio; scelta = prova; }
    }
  }
  ordinati.forEach((d, i) => assegnaEstremo(d.c, estremo,
    { x: n.x + r * Math.cos(scelta[i]), y: n.y + r * Math.sin(scelta[i]) }));
}

function puntiPerimetro(n) {
  const punti = [], passo = 7, margine = 7;
  const aggiungi = (x, y) => { const p = { x, y }; if (!punti.some(q => stesso(p, q))) punti.push(p); };
  for (let x = n.x - n.w / 2 + margine; x <= n.x + n.w / 2 - margine + EPS; x += passo) {
    aggiungi(x, n.y - n.h / 2); aggiungi(x, n.y + n.h / 2);
  }
  for (let y = n.y - n.h / 2 + margine; y <= n.y + n.h / 2 - margine + EPS; y += passo) {
    aggiungi(n.x - n.w / 2, y); aggiungi(n.x + n.w / 2, y);
  }
  aggiungi(n.x, n.y - n.h / 2); aggiungi(n.x, n.y + n.h / 2);
  aggiungi(n.x - n.w / 2, n.y); aggiungi(n.x + n.w / 2, n.y);
  return punti;
}

function distribuisciRettangolo(n, gruppo, estremo, soglia, fissi) {
  const dati = datiEstremi(n, gruppo, estremo);
  const interniOk = dati.every((d, i) => dati.slice(i + 1).every(e => distanza(d.punto, e.punto) >= soglia - 0.01));
  const fissiOk = dati.every(d => fissi.every(p => distanza(d.punto, p) >= 7 - 0.01));
  if (interniOk && fissiOk) return;
  const candidati = puntiPerimetro(n), assegnati = [];
  for (const d of dati) {
    const liberi = candidati.filter(p => assegnati.every(q => distanza(p, q) >= soglia - 0.01)
      && fissi.every(q => distanza(p, q) >= 7 - 0.01));
    const scelta = (liberi.length ? liberi : candidati).sort((a, b) => {
      const minima = p => Math.min(...assegnati.map(q => distanza(p, q)), Infinity);
      const valore = p => Math.abs(differenzaAngoli(angoloDi(n, p), d.a)) + distanza(p, d.punto) / 100
        - (liberi.length ? 0 : minima(p));
      return valore(a) - valore(b);
    })[0];
    if (!scelta) continue;
    assegnati.push(scelta); assegnaEstremo(d.c, estremo, scelta);
  }
}

function distribuisciEstremi(n, gruppo, estremo, soglia, fissi) {
  if (['sommatore', 'moltiplicatore', 'nodo'].includes(n.forma))
    distribuisciCerchio(n, gruppo, estremo, soglia, fissi);
  else distribuisciRettangolo(n, gruppo, estremo, soglia, fissi);
}

/** Punte entranti nello stesso blocco ad almeno 14 px; partenze non coincidenti. */
function separaEstremi(frecce, collegamenti, perId, opzioni = {}) {
  const entranti = new Map(), uscenti = new Map();
  const raccogli = (mappa, chiave, c) => { if (!mappa.has(chiave)) mappa.set(chiave, []); mappa.get(chiave).push(c); };
  for (const c of frecce) {
    raccogli(uscenti, String(collegamenti[c.indice].da), c);
    if (!c.senzaPunta) raccogli(entranti, String(collegamenti[c.indice].a), c);
  }
  for (const [id, gruppo] of entranti) {
    if (opzioni.punte === false || gruppo.length < 2) continue;
    const fissi = (uscenti.get(id) || []).map(c => c.inizio);
    distribuisciEstremi(perId.get(id), gruppo, 'fine', DISTANZA_PUNTE, fissi);
  }
  for (const [id, gruppo] of uscenti) {
    const n = perId.get(id);
    if (opzioni.partenze === false || gruppo.length < 2 || !formaConBordo(n)) continue;
    const fissi = frecce.filter(c => !c.senzaPunta && String(collegamenti[c.indice].a) === id).map(c => c.fine);
    distribuisciEstremi(n, gruppo, 'inizio', 10, fissi);
  }
}

function conflittiTra(c, punti, altro, altriPunti) {
  const provvisorio = { ...c, inizio: punti[0], fine: punti.at(-1), punti };
  const altroProvvisorio = { ...altro, inizio: altriPunti[0], fine: altriPunti.at(-1), punti: altriPunti };
  let totale = 0;
  for (const [a, b] of segmenti(punti)) for (const [x, y] of segmenti(altriPunti))
    if (!compatibili(provvisorio, [a, b], altroProvvisorio, [x, y])) totale++;
  return totale;
}

/** Un tratto agganciato al bordo non deve rientrare nella propria forma. */
function attraversaInterno(a, b, n) {
  if (['sommatore', 'moltiplicatore', 'nodo'].includes(n.forma)) {
    const dx = b.x - a.x, dy = b.y - a.y, lun2 = dx * dx + dy * dy;
    const t = lun2 ? Math.max(0, Math.min(1, ((n.x - a.x) * dx + (n.y - a.y) * dy) / lun2)) : 0;
    return Math.hypot(a.x + t * dx - n.x, a.y + t * dy - n.y) < n.w / 2 - 0.25;
  }
  const r = rettangoloNodo(n);
  return trattoRettangolo(a, b, { left: r.left + 0.25, right: r.right - 0.25, top: r.top + 0.25, bottom: r.bottom - 0.25 });
}

function conflitti(c, punti, frecce, collegamenti, perId) {
  const link = collegamenti[c.indice], propri = new Set([String(link.da), String(link.a)]);
  let blocchi = 0, incroci = 0, lati = 0;
  const provvisorio = { ...c, inizio: punti[0], fine: punti.at(-1), punti };
  const infoNodi = [...perId.values()].map(n => ({ n, proprio: propri.has(String(n.blocco.id)),
    ruolo: String(n.blocco.id) === String(link.da) ? 'da' : String(n.blocco.id) === String(link.a) ? 'a' : null,
    ...datiNodo(n) }));
  const altriTratti = frecce.filter(altro => altro !== c)
    .flatMap(altro => segmenti(vertici(altro)).map(tratto => ({ altro, tratto })));
  const tratti = segmenti(punti);
  for (const [indiceTratto, [a, b]] of tratti.entries()) {
    for (const info of infoNodi) {
      if (!info.proprio && trattoRettangolo(a, b, info.rect)) blocchi++;
      if (info.proprio && formaConBordo(info.n) && attraversaInterno(a, b, info.n)) blocchi++;
      // Il moncone agganciato al blocco non e' una corsia: deve solo evitare
      // di correre lungo il lato (<2 px). Ogni altro tratto resta a >=8 px.
      const monconeProprio = (info.ruolo === 'da' && indiceTratto === 0)
        || (info.ruolo === 'a' && indiceTratto === tratti.length - 1);
      const soglia = monconeProprio ? 2 : DISTANZA_CORSIE;
      for (const lato of info.lati) {
        if (scatoleLontane(a, b, lato[0], lato[1], soglia)) continue;
        const vicino = paralleli(a, b, lato[0], lato[1]);
        if (vicino && vicino.overlap > 0.1 && vicino.dist < soglia - 0.01) lati++;
      }
    }
    for (const { altro, tratto } of altriTratti)
      if (!compatibili(provvisorio, [a, b], altro, tratto)) incroci++;
  }
  return { blocchi, incroci, lati, totale: blocchi * 100 + incroci * 100 + lati * 10 };
}

function orientamentoUscita(n, orizzontale, segno) {
  const verticale = !orizzontale, verso = orizzontale ? (segno > 0 ? 'destra' : 'sinistra') : (segno > 0 ? 'giu' : 'su');
  const fine = orizzontale ? { x: n.x + (segno > 0 ? -16 : 16), y: n.y } : { x: n.x, y: n.y + (segno > 0 ? -16 : 16) };
  return { fine, verticale, verso };
}

/** Breve tratto normale al bordo: la corsia non nasce lungo un lato. */
function moncone(n, p, rif) {
  if (!n || n.forma === 'ingresso' || stesso(p, n)) return null;
  const direzioni = [
    { x: 1, y: 0, d: Math.abs(p.x - (n.x + n.w / 2)) },
    { x: -1, y: 0, d: Math.abs(p.x - (n.x - n.w / 2)) },
    { x: 0, y: 1, d: Math.abs(p.y - (n.y + n.h / 2)) },
    { x: 0, y: -1, d: Math.abs(p.y - (n.y - n.h / 2)) },
  ];
  const sulBordo = direzioni.filter(v => v.d < 0.75);
  const verso = { x: rif.x - p.x, y: rif.y - p.y };
  const scelta = sulBordo.length
    ? sulBordo.sort((a, b) => (b.x * verso.x + b.y * verso.y) - (a.x * verso.x + a.y * verso.y))[0]
    : Math.abs(p.x - n.x) >= Math.abs(p.y - n.y)
      ? { x: Math.sign(p.x - n.x) || 1, y: 0 } : { x: 0, y: Math.sign(p.y - n.y) || 1 };
  return { x: p.x + scelta.x * MONCONE, y: p.y + scelta.y * MONCONE };
}

function candidati(c, frecce, collegamenti, perId) {
  const link = collegamenti[c.indice], da = perId.get(String(link.da)), a = perId.get(String(link.a));
  const inizio = vertici(c)[0], fine = vertici(c).at(-1), nodi = [...perId.values()];
  const out = [{ punti: [inizio, fine], uscita: null }];
  const inizioMoncone = moncone(da, inizio, fine);
  const fineMoncone = a.forma === 'uscita' ? null : moncone(a, fine, inizio);
  const testa = inizioMoncone || inizio, coda = fineMoncone || fine;
  const prefisso = inizioMoncone ? [inizio, inizioMoncone] : [inizio];
  const suffisso = fineMoncone ? [fineMoncone, fine] : [fine];
  const xs = new Set([testa.x, coda.x]), ys = new Set([testa.y, coda.y]);
  for (const n of nodi) {
    for (const d of [10, 22]) {
      xs.add(n.x - n.w / 2 - d); xs.add(n.x + n.w / 2 + d);
      ys.add(n.y - n.h / 2 - d); ys.add(n.y + n.h / 2 + d);
    }
  }
  for (const d of [12, 24, 40, 64, 96, 144]) {
    xs.add(testa.x - d); xs.add(testa.x + d); xs.add(coda.x - d); xs.add(coda.x + d);
    ys.add(testa.y - d); ys.add(testa.y + d); ys.add(coda.y - d); ys.add(coda.y + d);
  }
  const monconeUscita = z => ({ x: z.x + (z.x - a.x) * MONCONE / 16, y: z.y + (z.y - a.y) * MONCONE / 16 });
  for (const x of xs) {
    let punti, uscita = null;
    if (a.forma === 'uscita' && Math.abs(x - a.x) > 1) {
      uscita = orientamentoUscita(a, true, a.x > x ? 1 : -1);
      const z = uscita.fine, zm = monconeUscita(z);
      punti = [...prefisso, { x, y: testa.y }, { x, y: zm.y }, zm, z];
    } else punti = [...prefisso, { x, y: testa.y }, { x, y: coda.y }, ...suffisso];
    out.push({ punti, uscita });
  }
  for (const y of ys) {
    let punti, uscita = null;
    if (a.forma === 'uscita' && Math.abs(y - a.y) > 1) {
      uscita = orientamentoUscita(a, false, a.y > y ? 1 : -1);
      const z = uscita.fine, zm = monconeUscita(z);
      punti = [...prefisso, { x: testa.x, y }, { x: zm.x, y }, zm, z];
    } else punti = [...prefisso, { x: testa.x, y }, { x: coda.x, y }, ...suffisso];
    out.push({ punti, uscita });
  }
  // Su una porta circolare diagonale anche il moncone lungo l'altro asse
  // esce dalla forma: serve ai ventagli annidati, dove l'ultimo tratto
  // deve arrivare di fianco anziche' dal basso (o viceversa).
  if (a.forma !== 'uscita' && fineMoncone) {
    const coda2 = monconeAsse(a, fine, inizio, fineMoncone.x !== fine.x ? 'y' : 'x');
    if (coda2) {
      for (const x of xs) out.push({ punti: [...prefisso, { x, y: testa.y }, { x, y: coda2.y }, coda2, fine], uscita: null });
      for (const y of ys) out.push({ punti: [...prefisso, { x: testa.x, y }, { x: coda2.x, y }, coda2, fine], uscita: null });
    }
  }
  if (inizioMoncone) {
    const testa2 = monconeAsse(da, inizio, fine, inizioMoncone.x !== inizio.x ? 'y' : 'x');
    if (testa2) {
      const prefisso2 = [inizio, testa2];
      for (const x of xs) out.push({ punti: [...prefisso2, { x, y: testa2.y }, { x, y: coda.y }, ...suffisso], uscita: null });
      for (const y of ys) out.push({ punti: [...prefisso2, { x: testa2.x, y }, { x: coda.x, y }, ...suffisso], uscita: null });
    }
  }
  const visti = new Set();
  return out.filter(cand => {
    cand.punti = ripulisci(cand.punti);
    const chiave = cand.punti.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(';')
      + `|${cand.uscita ? `${cand.uscita.verticale}/${cand.uscita.verso}` : ''}`;
    if (visti.has(chiave)) return false;
    visti.add(chiave); return true;
  });
}

function applicaPercorso(c, cand, collegamenti, perId) {
  aggiornaFreccia(c, cand.punti);
  if (cand.uscita) {
    const a = perId.get(String(collegamenti[c.indice].a));
    a.verticale = cand.uscita.verticale; a.verso = cand.uscita.verso;
  }
}

function cercaCoppia(frecce, collegamenti, perId) {
  const cache = new Map(), promettenti = new Map();
  const candidatiDi = x => {
    if (!cache.has(x)) cache.set(x, candidati(x, frecce, collegamenti, perId)
      .map(cand => ({ ...cand, punti: ripulisci(cand.punti) })));
    return cache.get(x);
  };
  const scelteDi = x => {
    if (!promettenti.has(x)) promettenti.set(x, candidatiDi(x).map(cand => ({
      cand, esito: conflitti(x, cand.punti, frecce, collegamenti, perId), lun: lunghezza(cand.punti),
    })).sort((a, b) => a.esito.totale - b.esito.totale || a.lun - b.lun).slice(0, 36));
    return promettenti.get(x);
  };
  let migliore = null;
  for (const c of frecce) {
    const puntiC = vertici(c).map(copia), primaC = conflitti(c, puntiC, frecce, collegamenti, perId);
    if (!primaC.totale) continue;
    for (const { cand: candC, esito: esitoC } of scelteDi(c)) {
      // Un percorso puo' peggiorare da solo ma liberarsi spostando il partner.
      if (esitoC.totale > primaC.totale + 300) continue;
      for (const d of frecce) {
        if (d === c || !conflittiTra(c, candC.punti, d, vertici(d))) continue;
        const puntiD = vertici(d).map(copia), primaD = conflitti(d, puntiD, frecce, collegamenti, perId);
        const prima = primaC.totale + primaD.totale - 100 * conflittiTra(c, puntiC, d, puntiD);
        const conD = candD => frecce.map(x => x === d
          ? { ...x, inizio: candD[0], fine: candD.at(-1), punti: candD } : x);
        const conC = frecce.map(x => x === c
          ? { ...x, inizio: candC.punti[0], fine: candC.punti.at(-1), punti: candC.punti } : x);
        for (const { cand: candD } of scelteDi(d)) {
          const localeC = conflitti(c, candC.punti, conD(candD.punti), collegamenti, perId);
          const localeD = conflitti(d, candD.punti, conC, collegamenti, perId);
          const dopo = localeC.totale + localeD.totale - 100 * conflittiTra(c, candC.punti, d, candD.punti);
          if (dopo >= prima) continue;
          if (dopo === 0) {
            applicaPercorso(c, candC, collegamenti, perId);
            applicaPercorso(d, candD, collegamenti, perId);
            return true;
          }
          const lun = lunghezza(candC.punti) + lunghezza(candD.punti);
          if (!migliore || dopo < migliore.dopo || (dopo === migliore.dopo && lun < migliore.lun))
            migliore = { c, d, candC, candD, dopo, lun };
        }
      }
    }
  }
  if (!migliore) return false;
  applicaPercorso(migliore.c, migliore.candC, collegamenti, perId);
  applicaPercorso(migliore.d, migliore.candD, collegamenti, perId);
  return true;
}

/** Ricerca su griglia ortogonale compressa: trova anche percorsi a piu' corsie
 *  quando né il percorso a una corsia né la coppia coordinata bastano. */
function monconeAsse(n, p, rif, asse) {
  const primario = moncone(n, p, rif);
  if (!asse || !primario) return primario;
  if (!['sommatore', 'moltiplicatore', 'nodo'].includes(n.forma)) return null;
  const segno = asse === 'x' ? Math.sign(p.x - n.x) : Math.sign(p.y - n.y);
  if (!segno) return null;
  const alt = asse === 'x' ? { x: p.x + segno * MONCONE, y: p.y } : { x: p.x, y: p.y + segno * MONCONE };
  return stesso(alt, primario) ? null : alt;
}

function percorsoGriglia(c, frecce, collegamenti, perId, variante = null, inizioAlt = null, fineAlt = null, asseTesta = null, asseCoda = null) {
  const link = collegamenti[c.indice], da = perId.get(String(link.da)), a = perId.get(String(link.a));
  if (!da || !a || da.forma === 'ingresso' || a.forma === 'ingresso') return null;
  const inizio = inizioAlt || vertici(c)[0];
  let fine = fineAlt || vertici(c).at(-1), uscita = null;
  if (variante) { fine = variante.fine; uscita = variante; }
  const testaMoncone = monconeAsse(da, inizio, fine, asseTesta), testa = testaMoncone || inizio;
  if (asseTesta && !testaMoncone) return null;
  if (stesso(testa, da) && !formaConBordo(da)) return null;
  let coda, suffisso;
  if (a.forma === 'uscita') {
    if (!uscita) return null;
    coda = { x: fine.x + (fine.x - a.x) * MONCONE / 16, y: fine.y + (fine.y - a.y) * MONCONE / 16 };
    suffisso = [coda, fine];
  } else {
    const fineMoncone = monconeAsse(a, fine, inizio, asseCoda);
    if (asseCoda && !fineMoncone) return null;
    coda = fineMoncone || fine; suffisso = fineMoncone ? [fineMoncone, fine] : [fine];
  }
  const minX = Math.min(testa.x, coda.x) - 120, maxX = Math.max(testa.x, coda.x) + 120;
  const minY = Math.min(testa.y, coda.y) - 120, maxY = Math.max(testa.y, coda.y) + 120;
  const xs = new Map(), ys = new Map();
  const aggiungiX = (x, sempre = false) => { if (sempre || (x >= minX && x <= maxX)) xs.set(x.toFixed(2), x); };
  const aggiungiY = (y, sempre = false) => { if (sempre || (y >= minY && y <= maxY)) ys.set(y.toFixed(2), y); };
  aggiungiX(testa.x, true); aggiungiX(coda.x, true); aggiungiY(testa.y, true); aggiungiY(coda.y, true);
  let estremoSinistra = Infinity, estremoDestra = -Infinity, estremoAlto = Infinity, estremoBasso = -Infinity;
  for (const n of perId.values()) {
    estremoSinistra = Math.min(estremoSinistra, n.x - n.w / 2); estremoDestra = Math.max(estremoDestra, n.x + n.w / 2);
    estremoAlto = Math.min(estremoAlto, n.y - n.h / 2); estremoBasso = Math.max(estremoBasso, n.y + n.h / 2);
    for (const d of [10, 22]) {
      aggiungiX(n.x - n.w / 2 - d); aggiungiX(n.x + n.w / 2 + d);
      aggiungiY(n.y - n.h / 2 - d); aggiungiY(n.y + n.h / 2 + d);
    }
  }
  aggiungiX(estremoSinistra - 34, true); aggiungiX(estremoDestra + 34, true);
  aggiungiY(estremoAlto - 34, true); aggiungiY(estremoBasso + 34, true);
  for (const d of [12, 24, 40, 64, 96]) {
    aggiungiX(testa.x - d); aggiungiX(testa.x + d); aggiungiX(coda.x - d); aggiungiX(coda.x + d);
    aggiungiY(testa.y - d); aggiungiY(testa.y + d); aggiungiY(coda.y - d); aggiungiY(coda.y + d);
  }
  for (const altro of frecce) if (altro !== c) for (const p of vertici(altro)) {
    aggiungiX(p.x - 10); aggiungiX(p.x + 10); aggiungiY(p.y - 10); aggiungiY(p.y + 10);
  }
  const X = [...xs.values()].sort((p, q) => p - q), Y = [...ys.values()].sort((p, q) => p - q);
  const ixDi = x => X.findIndex(v => Math.abs(v - x) < 0.01), iyDi = y => Y.findIndex(v => Math.abs(v - y) < 0.01);
  const sx = ixDi(testa.x), sy = iyDi(testa.y), ex = ixDi(coda.x), ey = iyDi(coda.y);
  if (sx < 0 || sy < 0 || ex < 0 || ey < 0) return null;
  const ostacoli = [...perId.values()].map(n => {
    const r = datiNodo(n).rect;
    return { n, left: r.left - 7.5, right: r.right + 7.5, top: r.top - 7.5, bottom: r.bottom + 7.5 };
  });
  const altriTratti = frecce.filter(altro => altro !== c)
    .flatMap(altro => segmenti(vertici(altro)).map(tratto => ({ altro, tratto })));
  const provvisorio = { ...c, inizio, fine, punti: [inizio, fine] };
  const cacheArchi = new Map();
  const arcoLibero = (x1, y1, x2, y2) => {
    const chiave = [x1, y1, x2, y2].join(',');
    if (cacheArchi.has(chiave)) return cacheArchi.get(chiave);
    const p = { x: X[x1], y: Y[y1] }, q = { x: X[x2], y: Y[y2] };
    let libero = true;
    for (const o of ostacoli) {
      if (!trattoRettangolo(p, q, o)) continue;
      const esente = (o.n === da && x1 === sx && y1 === sy) || (o.n === a && x2 === ex && y2 === ey);
      if (!esente) { libero = false; break; }
    }
    if (libero) for (const { altro, tratto } of altriTratti)
      if (!compatibili(provvisorio, [p, q], altro, tratto)) { libero = false; break; }
    cacheArchi.set(chiave, libero);
    return libero;
  };
  const distanze = new Map(), precedenti = new Map(), codaHeap = [];
  const chiaveStato = (x, y, d) => `${x},${y},${d}`;
  const inserisci = voce => {
    codaHeap.push(voce);
    for (let i = codaHeap.length - 1; i > 0;) {
      const genitore = (i - 1) >> 1;
      if (codaHeap[genitore][0] <= codaHeap[i][0]) break;
      [codaHeap[genitore], codaHeap[i]] = [codaHeap[i], codaHeap[genitore]]; i = genitore;
    }
  };
  const estrai = () => {
    const primo = codaHeap[0], ultimo = codaHeap.pop();
    if (codaHeap.length) {
      codaHeap[0] = ultimo;
      for (let i = 0;;) {
        let m = i; const sinistra = 2 * i + 1, destra = sinistra + 1;
        if (sinistra < codaHeap.length && codaHeap[sinistra][0] < codaHeap[m][0]) m = sinistra;
        if (destra < codaHeap.length && codaHeap[destra][0] < codaHeap[m][0]) m = destra;
        if (m === i) break;
        [codaHeap[m], codaHeap[i]] = [codaHeap[i], codaHeap[m]]; i = m;
      }
    }
    return primo;
  };
  distanze.set(chiaveStato(sx, sy, 0), 0); inserisci([0, sx, sy, 0]);
  let statoFinale = null;
  while (codaHeap.length) {
    const [costo, x, y, direzione] = estrai();
    if (costo > (distanze.get(chiaveStato(x, y, direzione)) ?? Infinity)) continue;
    if (x === ex && y === ey) { statoFinale = chiaveStato(x, y, direzione); break; }
    for (const [nx, ny, nd] of [[x - 1, y, 1], [x + 1, y, 1], [x, y - 1, 2], [x, y + 1, 2]]) {
      if (nx < 0 || ny < 0 || nx >= X.length || ny >= Y.length || !arcoLibero(x, y, nx, ny)) continue;
      const nuovo = costo + Math.hypot(X[nx] - X[x], Y[ny] - Y[y]) + (direzione && direzione !== nd ? 6 : 0);
      const chiave = chiaveStato(nx, ny, nd);
      if (nuovo < (distanze.get(chiave) ?? Infinity)) {
        distanze.set(chiave, nuovo); precedenti.set(chiave, chiaveStato(x, y, direzione)); inserisci([nuovo, nx, ny, nd]);
      }
    }
  }
  if (!statoFinale) return null;
  const stati = [];
  for (let s = statoFinale; s; s = precedenti.get(s)) {
    const [x, y] = s.split(',').map(Number); stati.push({ x: X[x], y: Y[y] });
  }
  stati.reverse();
  const punti = [...(testaMoncone ? [inizio] : []), ...stati, ...suffisso.slice(1)];
  return { punti: ripulisci(punti), uscita };
}

function porteAlternative(n, corrente) {
  if (!n || !formaConBordo(n)) return [corrente];
  const candidati = ['sommatore', 'moltiplicatore', 'nodo'].includes(n.forma)
    ? Array.from({ length: 24 }, (_, i) => {
      const a = i * Math.PI / 12;
      return { x: n.x + n.w / 2 * Math.cos(a), y: n.y + n.h / 2 * Math.sin(a) };
    }) : puntiPerimetro(n);
  const base = angoloDi(n, corrente), out = [corrente];
  const bersagli = [0, Math.PI / 2, Math.PI, -Math.PI / 2,
    Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4,
    ...[90, -90, 180].map(gradi => base + gradi * Math.PI / 180)];
  for (const bersaglio of bersagli) {
    const scelta = candidati.sort((p, q) => Math.abs(differenzaAngoli(angoloDi(n, p), bersaglio))
      - Math.abs(differenzaAngoli(angoloDi(n, q), bersaglio)))[0];
    if (scelta && !out.some(p => stesso(p, scelta))) out.push(scelta);
  }
  return out;
}

function estremiCompatibili(c, punti, frecce, collegamenti) {
  const link = collegamenti[c.indice];
  for (const altro of frecce) {
    if (altro === c) continue;
    const altroLink = collegamenti[altro.indice];
    if (String(altroLink.da) === String(link.da) && distanza(punti[0], altro.inizio) < 7 - 0.01) return false;
    if (String(altroLink.a) === String(link.da) && !altro.senzaPunta && distanza(punti[0], altro.fine) < 7 - 0.01) return false;
    if (!c.senzaPunta && String(altroLink.a) === String(link.a) && !altro.senzaPunta
      && distanza(punti.at(-1), altro.fine) < DISTANZA_PUNTE - 0.01) return false;
    if (!c.senzaPunta && String(altroLink.da) === String(link.a) && distanza(punti.at(-1), altro.inizio) < 7 - 0.01) return false;
  }
  return true;
}

function instradaGriglia(frecce, collegamenti, perId) {
  let cambiati = 0;
  for (const c of frecce) {
    const prima = conflitti(c, vertici(c), frecce, collegamenti, perId);
    if (!prima.totale || (!prima.blocchi && !prima.incroci)) continue;
    const link = collegamenti[c.indice];
    const da = perId.get(String(link.da)), a = perId.get(String(link.a));
    const varianti = a?.forma === 'uscita'
      ? [orientamentoUscita(a, true, 1), orientamentoUscita(a, true, -1),
        orientamentoUscita(a, false, 1), orientamentoUscita(a, false, -1)] : [null];
    let migliore = null;
    const prova = (variante, inizioAlt = null, fineAlt = null, asseTesta = null, asseCoda = null) => {
      const cand = percorsoGriglia(c, frecce, collegamenti, perId, variante, inizioAlt, fineAlt, asseTesta, asseCoda);
      if (!cand || !estremiCompatibili(c, cand.punti, frecce, collegamenti)) return false;
      const esito = conflitti(c, cand.punti, frecce, collegamenti, perId), lun = lunghezza(cand.punti);
      if (esito.totale < prima.totale && (!migliore || esito.totale < migliore.esito.totale
        || (esito.totale === migliore.esito.totale && lun < migliore.lun))) migliore = { ...cand, esito, lun };
      return migliore?.esito.totale === 0;
    };
    let risolto = false;
    for (const variante of varianti) if (prova(variante)) { risolto = true; break; }
    if (!risolto) for (const variante of varianti) {
      for (const [asseTesta, asseCoda] of [[null, 'x'], [null, 'y'], ['x', null], ['y', null]])
        if (prova(variante, null, null, asseTesta, asseCoda)) { risolto = true; break; }
      if (risolto) break;
    }
    if (!risolto && !migliore) {
      const partenze = porteAlternative(da, c.inizio).slice(1);
      if (a?.forma === 'uscita') {
        for (const variante of varianti) {
          for (const inizioAlt of partenze) if (prova(variante, inizioAlt)) { risolto = true; break; }
          if (risolto) break;
        }
      } else {
        for (const inizioAlt of partenze) if (prova(null, inizioAlt)) { risolto = true; break; }
        if (!risolto) for (const fineAlt of porteAlternative(a, c.fine).slice(1))
          if (prova(null, null, fineAlt)) break;
      }
    }
    if (migliore) { applicaPercorso(c, migliore, collegamenti, perId); cambiati++; }
  }
  return cambiati > 0;
}

/** Scambia le porte di due frecce sullo stesso blocco che si incrociano. */
function scambiaPunte(frecce, collegamenti, perId) {
  const gruppi = new Map();
  for (const c of frecce) {
    if (c.senzaPunta) continue;
    const a = String(collegamenti[c.indice].a), nodo = perId.get(a);
    if (!nodo || !formaConBordo(nodo)) continue;
    if (!gruppi.has(a)) gruppi.set(a, []);
    gruppi.get(a).push(c);
  }
  const totale = (c, d) => conflitti(c, vertici(c), frecce, collegamenti, perId).totale
    + conflitti(d, vertici(d), frecce, collegamenti, perId).totale
    - 100 * conflittiTra(c, vertici(c), d, vertici(d));
  const ottimizza = c => {
    let migliore = null, esitoAttuale = conflitti(c, vertici(c), frecce, collegamenti, perId).totale;
    for (const cand of candidati(c, frecce, collegamenti, perId)) {
      const punti = ripulisci(cand.punti), esito = conflitti(c, punti, frecce, collegamenti, perId);
      if (esito.totale > esitoAttuale) continue;
      const lun = lunghezza(punti);
      if (!migliore || esito.totale < migliore.esito.totale
        || (esito.totale === migliore.esito.totale && lun < migliore.lun))
        migliore = { ...cand, punti, esito, lun };
    }
    if (migliore) applicaPercorso(c, migliore, collegamenti, perId);
  };
  let cambiati = false;
  for (const gruppo of gruppi.values()) for (let i = 0; i < gruppo.length; i++)
    for (let j = i + 1; j < gruppo.length; j++) {
      const c = gruppo[i], d = gruppo[j];
      if (stesso(c.fine, d.fine) || !conflittiTra(c, vertici(c), d, vertici(d))) continue;
      const prima = totale(c, d), salvaC = vertici(c).map(copia), salvaD = vertici(d).map(copia);
      aggiornaFreccia(c, [c.inizio, copia(d.fine)]);
      aggiornaFreccia(d, [d.inizio, copia(salvaC.at(-1))]);
      ottimizza(c); ottimizza(d); ottimizza(c);
      if (totale(c, d) < prima) cambiati = true;
      else { aggiornaFreccia(c, salvaC); aggiornaFreccia(d, salvaD); }
    }
  return cambiati;
}

function instrada(frecce, collegamenti, perId, coppia = true) {
  for (let giro = 0; giro < 6; giro++) {
    let cambiati = 0;
    for (const c of frecce) {
      const attuale = vertici(c).map(copia), prima = conflitti(c, attuale, frecce, collegamenti, perId);
      if (!prima.totale) continue;
      let migliore = null;
      for (const cand of candidati(c, frecce, collegamenti, perId)) {
        const punti = ripulisci(cand.punti), esito = conflitti(c, punti, frecce, collegamenti, perId);
        if (esito.totale >= prima.totale) continue;
        const valore = { ...cand, punti, esito, lun: lunghezza(punti) };
        if (!migliore || esito.totale < migliore.esito.totale
          || (esito.totale === migliore.esito.totale && valore.lun < migliore.lun)) migliore = valore;
      }
      if (migliore) { applicaPercorso(c, migliore, collegamenti, perId); cambiati++; }
    }
    if (!cambiati) break;
  }
  if (coppia) for (let tentativi = 0; tentativi < 2; tentativi++) {
    if (!frecce.some(c => conflitti(c, vertici(c), frecce, collegamenti, perId).totale)) break;
    if (!cercaCoppia(frecce, collegamenti, perId)) break;
    instrada(frecce, collegamenti, perId, false);
    if (!frecce.some(c => conflitti(c, vertici(c), frecce, collegamenti, perId).totale)) break;
  }
  if (coppia && frecce.some(c => conflitti(c, vertici(c), frecce, collegamenti, perId).totale)
    && instradaGriglia(frecce, collegamenti, perId)) instrada(frecce, collegamenti, perId, false);
  if (coppia && frecce.some(c => conflitti(c, vertici(c), frecce, collegamenti, perId).totale)
    && scambiaPunte(frecce, collegamenti, perId)) instrada(frecce, collegamenti, perId, false);
}

function punteUscite(perId) {
  const out = [];
  for (const n of perId.values()) {
    if (n.forma !== 'uscita') continue;
    if (n.verticale) {
      const d = n.verso === 'su' ? -1 : 1;
      out.push([{ x: n.x, y: n.y + 16 * d }, { x: n.x - 5, y: n.y + 7 * d }, { x: n.x + 5, y: n.y + 7 * d }]);
    } else {
      const d = n.verso === 'sinistra' ? -1 : 1;
      out.push([{ x: n.x + 16 * d, y: n.y }, { x: n.x + 7 * d, y: n.y - 5 }, { x: n.x + 7 * d, y: n.y + 5 }]);
    }
  }
  return out;
}

function raccogliTesti(frecce, perId) {
  const items = [];
  for (const n of perId.values()) for (const [i, t] of n.testi.entries()) items.push({
    t, n, c: null, opaco: n.forma !== 'rettangolo' && (n.forma !== 'ritardo' || i > 0),
  });
  for (const c of frecce) if (c.testo) items.push({ t: c.testo, n: null, c, opaco: true });
  return items;
}

function liberaEtichette(frecce, collegamenti, perId) {
  const items = raccogliTesti(frecce, perId);
  // Si preferisce l'ingombro gia' misurato; se non esiste una posizione libera,
  // il fallback limita l'espansione orizzontale invece di lasciare una copertura.
  const limiti = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  const espandi = r => { limiti.left = Math.min(limiti.left, r.left); limiti.right = Math.max(limiti.right, r.right);
    limiti.top = Math.min(limiti.top, r.top); limiti.bottom = Math.max(limiti.bottom, r.bottom); };
  for (const n of perId.values()) espandi(n.box);
  for (const c of frecce) {
    for (const p of vertici(c)) espandi({ left: p.x, right: p.x, top: p.y, bottom: p.y });
    if (c.testo) espandi(rettangoloTesto(c.testo));
  }
  const dentro = t => { const r = rettangoloTesto(t); return r.left >= limiti.left - 0.1 && r.right <= limiti.right + 0.1; };
  const fuori = t => { const r = rettangoloTesto(t); return Math.max(0, limiti.left - r.left) + Math.max(0, r.right - limiti.right); };
  const punte = frecce.filter(c => !c.senzaPunta).map(c => [c.fine, ...c.ali]).concat(punteUscite(perId));
  const forme = [...perId.values()].map(n => ({ n, forma: rettangoloForma(n) })).filter(v => v.forma);
  const tratti = frecce.flatMap(c => segmenti(vertici(c)).map(tratto => ({ c, tratto })));
  const scatolePunte = punte.map(punti => ({
    left: Math.min(...punti.map(p => p.x)), right: Math.max(...punti.map(p => p.x)),
    top: Math.min(...punti.map(p => p.y)), bottom: Math.max(...punti.map(p => p.y)),
  }));
  const penalita = (item, t) => {
    const r = rettangoloTesto(t);
    let valore = 0;
    for (const { n, forma } of forme) {
      const allargata = { left: forma.left - 1, right: forma.right + 1, top: forma.top - 1, bottom: forma.bottom + 1 };
      if (sovrapposti(r, allargata)) valore += item.n === n ? 100 : 60;
    }
    for (const { c, tratto } of tratti)
      if (item.c !== c && trattoRettangolo(tratto[0], tratto[1], r)) valore += 25;
    for (const scatola of scatolePunte)
      if (r.left <= scatola.right && r.right >= scatola.left && r.top <= scatola.bottom && r.bottom >= scatola.top) valore += 25;
    for (const altro of items) if (altro !== item && sovrapposti(r, rettangoloTesto(altro.t))) valore += 15;
    return valore;
  };
  const offset = [[0, 0]];
  for (let d = 4; d <= 192; d += 4) offset.push([-d, 0], [d, 0], [0, -d], [0, d]);
  for (const d of [8, 16, 32, 64, 96, 128, 160]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) offset.push([sx * d, sy * d]);
  for (const item of items) {
    if (!item.opaco) continue;
    const penalitaOriginale = penalita(item, item.t);
    if (!penalitaOriginale) continue;
    const originale = { x: item.t.x, y: item.t.y }, candidati = [];
    for (const [dx, dy] of offset) candidati.push({ x: originale.x + dx, y: originale.y + dy });
    if (item.n) {
      const n = item.n, t = item.t, forma = rettangoloForma(n) || rettangoloNodo(n);
      for (const gap of [8, 24, 48]) candidati.push(
        { x: forma.left - gap - t.w / 2, y: n.y }, { x: forma.right + gap + t.w / 2, y: n.y },
        { x: n.x, y: forma.top - gap - t.h / 2 }, { x: n.x, y: forma.bottom + gap + t.h / 2 });
    }
    candidati.push(
      { x: originale.x, y: limiti.top - 8 - item.t.h / 2 },
      { x: originale.x, y: limiti.bottom + 8 + item.t.h / 2 },
      { x: limiti.left - 8 - item.t.w / 2, y: originale.y },
      { x: limiti.right + 8 + item.t.w / 2, y: originale.y });
    const valutati = candidati.map(p => ({ ...item.t, ...p })).map(t => ({
      t, pen: penalita(item, t), dentro: dentro(t),
      costo: Math.hypot(t.x - originale.x, t.y - originale.y) + 4 * fuori(t),
    })).sort((a, b) => a.pen - b.pen || a.costo - b.costo);
    if (valutati.length && valutati[0].pen < penalitaOriginale) {
      item.t.x = valutati[0].t.x; item.t.y = valutati[0].t.y;
    }
  }
  return items.reduce((s, item) => s + (item.opaco ? penalita(item, item.t) : 0), 0);
}

function aggiornaBox(perId) {
  for (const n of perId.values()) {
    const box = rettangoloNodo(n);
    box.left -= 1; box.right += 1; box.top -= 1; box.bottom += 1;
    if (n.verticale) { box.top = Math.min(box.top, n.y - 17); box.bottom = Math.max(box.bottom, n.y + 17); }
    for (const t of n.testi) {
      const r = rettangoloTesto(t);
      box.left = Math.min(box.left, r.left); box.right = Math.max(box.right, r.right);
      box.top = Math.min(box.top, r.top); box.bottom = Math.max(box.bottom, r.bottom);
    }
    n.box = box;
  }
}

export function risolviVincoli(frecce, collegamenti, perId, completo = true) {
  unisciDiramazioni(frecce, collegamenti, perId);
  // Le partenze si separano subito; le punte entranti dopo l'instradamento,
  // cosi' l'ordine delle porte segue il lato reale di arrivo delle corsie.
  separaEstremi(frecce, collegamenti, perId, { punte: false });
  instrada(frecce, collegamenti, perId, completo);
  const firmaEstremi = () => frecce.map(c => `${c.inizio.x},${c.inizio.y},${c.fine.x},${c.fine.y}`).join('|');
  for (let giro = 0; giro < 2; giro++) {
    const prima = firmaEstremi();
    separaEstremi(frecce, collegamenti, perId, { partenze: false });
    if (firmaEstremi() === prima) break;
    instrada(frecce, collegamenti, perId, completo);
  }
  const percorsi = frecce.reduce((s, c) => s + conflitti(c, vertici(c), frecce, collegamenti, perId).totale, 0);
  const etichette = liberaEtichette(frecce, collegamenti, perId);
  aggiornaBox(perId);
  return percorsi + etichette;
}
