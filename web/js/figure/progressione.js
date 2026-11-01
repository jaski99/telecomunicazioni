/* Confronto puro tra stati autonomi di figura secondo S1-S4. */
const uguali = (a, b) => canonico(a) === canonico(b);

function canonico(v) {
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonico(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

function assiUguali(a, b) {
  return ['etichetta', 'min', 'max', 'tacche'].every(k => uguali(a && a[k], b && b[k]));
}

function etichetta(elemento) {
  return elemento && (elemento.etichetta || elemento.testo || elemento.titolo || '');
}

function contiene(tutti, sottoinsieme, idKey) {
  const usati = new Set();
  return sottoinsieme.every(elemento => {
    const i = tutti.findIndex((x, n) => !usati.has(n) && (idKey
      ? String(x && x[idKey]) === String(elemento && elemento[idKey])
      : uguali(x, elemento)));
    if (i < 0) return false;
    usati.add(i); return true;
  });
}

function nuoviPerValore(correnti, precedenti, tipo, idKey) {
  const usati = new Set();
  return correnti.flatMap((elemento, indice) => {
    const trovato = precedenti.findIndex((p, i) => !usati.has(i) && (idKey
      ? String(p && p[idKey]) === String(elemento && elemento[idKey])
      : uguali(p, elemento)));
    if (trovato >= 0) { usati.add(trovato); return []; }
    return [{ tipo, indice, ...(idKey && elemento && elemento[idKey] != null ? { id: String(elemento[idKey]) } : {}), etichetta: etichetta(elemento) }];
  });
}

function progressioneGrafico(prec, corr) {
  if (!assiUguali(prec.asse_x, corr.asse_x) || !assiUguali(prec.asse_y, corr.asse_y)) return null;
  const ps = prec.serie || [], cs = corr.serie || [], pa = prec.annotazioni || [], ca = corr.annotazioni || [];
  if (cs.length < ps.length || !ps.every((s, i) => uguali(s, cs[i])) || !contiene(ca, pa)) return null;
  const nuovi = cs.slice(ps.length).map((s, i) => ({ tipo: 'serie', indice: ps.length + i, etichetta: etichetta(s) }));
  nuovi.push(...nuoviPerValore(ca, pa, 'annotazione'));
  return nuovi;
}

function progressioneBlocchi(prec, corr) {
  const pb = prec.blocchi || [], cb = corr.blocchi || [];
  const perId = new Map(cb.map(b => [String(b && b.id), b]));
  if (!pb.every(b => {
    const corrente = perId.get(String(b && b.id));
    return corrente && uguali(b, corrente) && b.colonna === corrente.colonna && b.riga === corrente.riga;
  })) return null;
  const pc = prec.collegamenti || [], cc = corr.collegamenti || [];
  if (!contiene(cc, pc)) return null;
  const blocchi = nuoviPerValore(cb, pb, 'blocco', 'id');
  const link = nuoviPerValore(cc, pc, 'collegamento');
  return [...blocchi, ...link];
}

function progressioneTemporale(prec, corr) {
  if (!uguali(prec.asse_t, corr.asse_t) || !uguali(prec.corsie, corr.corsie)) return null;
  const nuovi = [];
  const nomi = { intervalli: 'intervallo', frecce: 'freccia', marcatori: 'marcatore' };
  for (const tipo of Object.keys(nomi)) {
    if (!contiene(corr[tipo] || [], prec[tipo] || [])) return null;
    nuovi.push(...nuoviPerValore(corr[tipo] || [], prec[tipo] || [], nomi[tipo]));
  }
  return nuovi;
}

/** Ritorna gli identificatori degli elementi nuovi; incompatibile se manca crescita. */
export function progressione(prec, corr) {
  if (!prec || !corr || prec.tipo !== corr.tipo) return { compatibile: false, nuovi: [] };
  const nuovi = corr.tipo === 'grafico' ? progressioneGrafico(prec, corr)
    : corr.tipo === 'blocchi' ? progressioneBlocchi(prec, corr)
      : corr.tipo === 'temporale' ? progressioneTemporale(prec, corr) : null;
  return { compatibile: Array.isArray(nuovi) && nuovi.length > 0, nuovi: Array.isArray(nuovi) ? nuovi : [] };
}

/** Didascalie leggibili derivate esclusivamente dalle etichette presenti nei dati. */
export function etichetteNuove(nuovi) {
  return [...new Set((nuovi || []).map(x => String(x.etichetta || '').trim()).filter(Boolean))];
}
