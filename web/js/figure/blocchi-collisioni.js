/* Vincoli geometrici dei diagrammi: corsie distinte ed etichette opache libere. */
const EPS = 1e-7;
const copia = p => ({ x: p.x, y: p.y });
const stesso = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 0.1;
const rettangoloTesto = t => ({ left: t.x - t.w / 2, right: t.x + t.w / 2, top: t.y - t.h / 2, bottom: t.y + t.h / 2 });
const rettangoloNodo = n => ({ left: n.x - n.w / 2, right: n.x + n.w / 2, top: n.y - n.h / 2, bottom: n.y + n.h / 2 });
const sovrapposti = (a, b) => a.left < b.right - 0.1 && a.right > b.left + 0.1 && a.top < b.bottom - 0.1 && a.bottom > b.top + 0.1;

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

function unisciDiramazioni(frecce, collegamenti) {
  const gruppi = new Map();
  for (const c of frecce) {
    const da = String(collegamenti[c.indice].da);
    if (!gruppi.has(da)) gruppi.set(da, []);
    gruppi.get(da).push(c);
  }
  for (const gruppo of gruppi.values()) {
    if (gruppo.length < 2) continue;
    const inizio = copia(gruppo[0].inizio);
    for (const c of gruppo.slice(1)) if (!stesso(c.inizio, inizio)) aggiornaFreccia(c, [inizio, c.fine]);
  }
}

/** Due frecce entranti non possono condividere la stessa punta sul bordo del nodo. */
function separaPunte(frecce, collegamenti, perId) {
  const gruppi = new Map();
  for (const c of frecce) {
    if (c.senzaPunta) continue;
    const chiave = `${collegamenti[c.indice].a}:${c.fine.x.toFixed(2)}:${c.fine.y.toFixed(2)}`;
    if (!gruppi.has(chiave)) gruppi.set(chiave, []);
    gruppi.get(chiave).push(c);
  }
  for (const gruppo of gruppi.values()) {
    if (gruppo.length < 2) continue;
    const offsets = gruppo.length === 2 ? [-8, 8]
      : Array.from({ length: gruppo.length }, (_, i) => (i - (gruppo.length - 1) / 2) * 8);
    const a = perId.get(String(collegamenti[gruppo[0].indice].a));
    const rx = gruppo[0].fine.x - a.x, ry = gruppo[0].fine.y - a.y, lun = Math.hypot(rx, ry) || 1;
    const tx = -ry / lun, ty = rx / lun;
    const arrivo = c => { const p = vertici(c).at(-2); return (p.x - c.fine.x) * tx + (p.y - c.fine.y) * ty; };
    const ordinati = [...gruppo].sort((x, y) => arrivo(x) - arrivo(y));
    for (const [i, c] of ordinati.entries()) {
      const verso = { x: c.fine.x + tx * offsets[i], y: c.fine.y + ty * offsets[i] };
      aggiornaFreccia(c, [...vertici(c).slice(0, -1), bordo(a, verso)]);
    }
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

function conflitti(c, punti, frecce, collegamenti, perId) {
  const link = collegamenti[c.indice], propri = new Set([String(link.da), String(link.a)]);
  let blocchi = 0, incroci = 0;
  const provvisorio = { ...c, inizio: punti[0], fine: punti.at(-1), punti };
  for (const [a, b] of segmenti(punti)) {
    for (const n of perId.values()) if (!propri.has(String(n.blocco.id)) && trattoRettangolo(a, b, rettangoloNodo(n))) blocchi++;
    for (const altro of frecce) {
      if (altro === c) continue;
      for (const [x, y] of segmenti(vertici(altro))) if (!compatibili(provvisorio, [a, b], altro, [x, y])) incroci++;
    }
  }
  return { blocchi, incroci, totale: blocchi + incroci };
}

function orientamentoUscita(n, orizzontale, segno) {
  const verticale = !orizzontale, verso = orizzontale ? (segno > 0 ? 'destra' : 'sinistra') : (segno > 0 ? 'giu' : 'su');
  const fine = orizzontale ? { x: n.x + (segno > 0 ? -16 : 16), y: n.y } : { x: n.x, y: n.y + (segno > 0 ? -16 : 16) };
  return { fine, verticale, verso };
}

function candidati(c, frecce, collegamenti, perId) {
  const link = collegamenti[c.indice], a = perId.get(String(link.a));
  const inizio = vertici(c)[0], fine = vertici(c).at(-1), nodi = [...perId.values()];
  const out = [{ punti: [inizio, fine], uscita: null }];
  const xs = new Set(), ys = new Set();
  for (const n of nodi) {
    for (const d of [10, 22]) {
      xs.add(n.x - n.w / 2 - d); xs.add(n.x + n.w / 2 + d);
      ys.add(n.y - n.h / 2 - d); ys.add(n.y + n.h / 2 + d);
    }
  }
  for (const d of [12, 24, 40, 64, 96, 144]) {
    xs.add(inizio.x - d); xs.add(inizio.x + d); xs.add(fine.x - d); xs.add(fine.x + d);
    ys.add(inizio.y - d); ys.add(inizio.y + d); ys.add(fine.y - d); ys.add(fine.y + d);
  }
  for (const x of xs) {
    let z = fine, uscita = null;
    if (a.forma === 'uscita' && Math.abs(x - a.x) > 1) {
      uscita = orientamentoUscita(a, true, a.x > x ? 1 : -1); z = uscita.fine;
    }
    out.push({ punti: [inizio, { x, y: inizio.y }, { x, y: z.y }, z], uscita });
  }
  for (const y of ys) {
    let z = fine, uscita = null;
    if (a.forma === 'uscita' && Math.abs(y - a.y) > 1) {
      uscita = orientamentoUscita(a, false, a.y > y ? 1 : -1); z = uscita.fine;
    }
    out.push({ punti: [inizio, { x: inizio.x, y }, { x: z.x, y }, z], uscita });
  }
  return out;
}

function applicaPercorso(c, cand, collegamenti, perId) {
  aggiornaFreccia(c, cand.punti);
  if (cand.uscita) {
    const a = perId.get(String(collegamenti[c.indice].a));
    a.verticale = cand.uscita.verticale; a.verso = cand.uscita.verso;
  }
}

function cercaCoppia(frecce, collegamenti, perId) {
  const cache = new Map(frecce.map(c => [c, candidati(c, frecce, collegamenti, perId)
    .map(cand => ({ ...cand, punti: ripulisci(cand.punti) }))]));
  let migliore = null;
  for (const c of frecce) {
    const puntiC = vertici(c).map(copia), primaC = conflitti(c, puntiC, frecce, collegamenti, perId);
    if (!primaC.totale) continue;
    for (const candC of cache.get(c)) {
      const esitoC = conflitti(c, candC.punti, frecce, collegamenti, perId);
      if (esitoC.totale > primaC.totale) continue;
      for (const d of frecce) {
        if (d === c || !conflittiTra(c, candC.punti, d, vertici(d))) continue;
        const puntiD = vertici(d).map(copia), primaD = conflitti(d, puntiD, frecce, collegamenti, perId);
        const prima = primaC.totale + primaD.totale - conflittiTra(c, puntiC, d, puntiD);
        const conD = candD => frecce.map(x => x === d
          ? { ...x, inizio: candD[0], fine: candD.at(-1), punti: candD } : x);
        const conC = frecce.map(x => x === c
          ? { ...x, inizio: candC.punti[0], fine: candC.punti.at(-1), punti: candC.punti } : x);
        for (const candD of cache.get(d)) {
          const localeC = conflitti(c, candC.punti, conD(candD.punti), collegamenti, perId);
          const localeD = conflitti(d, candD.punti, conC, collegamenti, perId);
          const dopo = localeC.totale + localeD.totale - conflittiTra(c, candC.punti, d, candD.punti);
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
  if (coppia && cercaCoppia(frecce, collegamenti, perId)) instrada(frecce, collegamenti, perId, false);
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
  const conflitto = (item, t) => {
    const r = rettangoloTesto(t);
    for (const c of frecce) {
      if (item.c !== c) for (const [a, b] of segmenti(vertici(c))) if (trattoRettangolo(a, b, r)) return true;
    }
    for (const punti of punte) {
      const xs = punti.map(p => p.x), ys = punti.map(p => p.y);
      if (r.left <= Math.max(...xs) && r.right >= Math.min(...xs)
        && r.top <= Math.max(...ys) && r.bottom >= Math.min(...ys)) return true;
    }
    return items.some(altro => altro !== item && sovrapposti(r, rettangoloTesto(altro.t)));
  };
  const offset = [[0, 0]];
  for (let d = 4; d <= 128; d += 4) offset.push([-d, 0], [d, 0], [0, -d], [0, d]);
  for (const d of [8, 16, 32, 64]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) offset.push([sx * d, sy * d]);
  for (const item of items) {
    if (!item.opaco || !conflitto(item, item.t)) continue;
    const originale = { x: item.t.x, y: item.t.y }, candidati = [];
    for (const [dx, dy] of offset) candidati.push({ x: originale.x + dx, y: originale.y + dy });
    if (item.n) {
      const n = item.n, t = item.t;
      candidati.push(
        { x: n.x - n.w / 2 - 8 - t.w / 2, y: n.y }, { x: n.x + n.w / 2 + 8 + t.w / 2, y: n.y },
        { x: n.x, y: n.y - n.h / 2 - 8 - t.h / 2 }, { x: n.x, y: n.y + n.h / 2 + 8 + t.h / 2 });
    }
    const liberi = candidati.map(p => ({ ...item.t, ...p })).filter(t => !conflitto(item, t));
    if (!liberi.length) continue;
    const interni = liberi.filter(dentro), scelte = interni.length ? interni : liberi;
    scelte.sort((a, b) => {
      const punteggio = t => Math.hypot(t.x - originale.x, t.y - originale.y) + (interni.length ? 0 : 4 * fuori(t));
      return punteggio(a) - punteggio(b);
    });
    item.t.x = scelte[0].x; item.t.y = scelte[0].y;
  }
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
  unisciDiramazioni(frecce, collegamenti);
  instrada(frecce, collegamenti, perId, completo);
  separaPunte(frecce, collegamenti, perId);
  instrada(frecce, collegamenti, perId, completo);
  liberaEtichette(frecce, collegamenti, perId);
  aggiornaBox(perId);
}
