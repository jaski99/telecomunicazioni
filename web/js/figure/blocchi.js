/* Renderer degli schemi a blocchi: layout, ingombri e viewBox senza tagli. */
import { FS_BLOCCHI, layoutBlocchi, layoutCollegamenti } from './blocchi-layout.js';
import { attributiProgressivi } from './helpers.js';
import { disegnaBlocco, disegnaFreccia, disegnaTesto } from './blocchi-forme.js';
import { impostaRicercaRapida, impostaLimiteEtichetta, rettificaCollisioni } from './blocchi-collisioni.js';

const PADDING = 10;
const LARGHEZZA_MASSIMA = 700;

// Il confronto riusa la geometria della stessa figura, ma produce markup con
// ID e attributi progressivi propri. Il contenuto della specifica partecipa
// alla chiave, così modifiche ai dati non lasciano in cache disegni obsoleti.
const cacheGeometria = new WeakMap();
function disegna(disegno, opzioni) {
  const frecce = disegno.frecce.map(c => `<g ${attributiProgressivi(opzioni.progressione, 'collegamento', c.indice)}>${disegnaFreccia(c)}${disegnaTesto(c.testo, true)}</g>`).join('');
  const forme = disegno.nodi.map(n => disegnaBlocco(n, opzioni, n.blocco.__figuraIndice)).join('');
  return { svgInner: `<g transform="translate(${-disegno.left},${-disegno.top})">${frecce}${forme}</g>`,
    viewBox: { w: disegno.w, h: disegno.h }, serie: [], fs: FS_BLOCCHI,
    nodi: disegno.nodi, frecce: disegno.frecce };
}


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
  return { nodi, frecce, left, top, w: right - left, h: bottom - top, conflitti: frecce.conflitti || 0 };
}

/** Ordine in una colonna per grafi con retroazione: condensa le componenti
 *  fortemente connesse e, dentro ciascuna, segue gli archi del ciclo. */
function ordineConCicli(ordinati, collegamenti, blocchiOriginali) {
  const perId = new Map(ordinati.map(b => [String(b.id), b]));
  const rango = new Map(ordinati.map((b, i) => [String(b.id), i]));
  const successori = new Map([...perId.keys()].map(id => [id, new Set()]));
  const predecessori = new Map([...perId.keys()].map(id => [id, new Set()]));
  for (const c of collegamenti) {
    const da = String(c?.da), a = String(c?.a);
    if (!c || da === a || !perId.has(da) || !perId.has(a)) continue;
    successori.get(da).add(a); predecessori.get(a).add(da);
  }
  const indici = new Map(), bassi = new Map(), componenteDi = new Map();
  const pila = [], inPila = new Set(), componenti = [];
  let contatore = 0;
  function visita(v) {
    indici.set(v, contatore); bassi.set(v, contatore); contatore++;
    pila.push(v); inPila.add(v);
    for (const w of successori.get(v)) {
      if (!indici.has(w)) { visita(w); bassi.set(v, Math.min(bassi.get(v), bassi.get(w))); }
      else if (inPila.has(w)) bassi.set(v, Math.min(bassi.get(v), indici.get(w)));
    }
    if (bassi.get(v) === indici.get(v)) {
      const componente = [];
      for (;;) { const w = pila.pop(); inPila.delete(w); componenteDi.set(w, componenti.length); componente.push(w); if (w === v) break; }
      componenti.push(componente);
    }
  }
  for (const id of perId.keys()) if (!indici.has(id)) visita(id);
  const grado = componenti.map(() => 0), archiComponenti = componenti.map(() => new Set());
  for (const [da, insieme] of successori) for (const a of insieme) {
    const cd = componenteDi.get(da), ca = componenteDi.get(a);
    if (cd !== ca && !archiComponenti[cd].has(ca)) { archiComponenti[cd].add(ca); grado[ca]++; }
  }
  const rangoComponente = componenti.map(ids => Math.min(...ids.map(id => rango.get(id))));
  const usate = new Set(), ordineComponenti = [];
  while (ordineComponenti.length < componenti.length) {
    const libera = componenti.keys().find(i => !usate.has(i) && grado[i] === 0
      && componenti.every((_, j) => usate.has(j) || grado[j] !== 0 || rangoComponente[i] <= rangoComponente[j]));
    if (libera === undefined) return null;
    usate.add(libera); ordineComponenti.push(libera);
    for (const ca of archiComponenti[libera]) grado[ca]--;
  }
  const originali = new Map(blocchiOriginali.map(b => [String(b.id), b]));
  const ordine = [];
  for (const ci of ordineComponenti) {
    const ids = componenti[ci];
    if (ids.length === 1) { ordine.push(perId.get(ids[0])); continue; }
    const dentro = new Set(ids), visti = new Set();
    const perOriginale = (x, y) => {
      const a = originali.get(x) || {}, b = originali.get(y) || {};
      return (Number(a.riga) || 0) - (Number(b.riga) || 0)
        || (Number(a.colonna) || 0) - (Number(b.colonna) || 0)
        || (a.__figuraIndice || 0) - (b.__figuraIndice || 0);
    };
    function percorri(id) {
      if (visti.has(id)) return;
      visti.add(id); ordine.push(perId.get(id));
      for (const a of [...successori.get(id)].filter(x => dentro.has(x)).sort(perOriginale)) percorri(a);
    }
    const inizi = ids.filter(id => [...predecessori.get(id)].some(p => !dentro.has(p)))
      .sort((x, y) => rango.get(x) - rango.get(y));
    for (const id of inizi) percorri(id);
    for (const id of [...ids].sort((x, y) => rango.get(x) - rango.get(y))) percorri(id);
  }
  return ordine.length === ordinati.length ? ordine : null;
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
    if (!libero) {
      const ordineCicli = ordineConCicli(ordinati, collegamenti, blocchi);
      if (!ordineCicli) return disposizione;
      const rigaCicli = new Map(ordineCicli.map((b, i) => [String(b.id), i]));
      return disposizione.map(b => ({ ...b, riga: rigaCicli.get(String(b.id)) }));
    }
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
  // La ricerca combinatoria cresce rapidamente con il numero di archi.
  const chiaveCache = JSON.stringify([blocchi, collegamenti, opzioni.larghezzaMassima, Boolean(opzioni.adattaAlContenitore)]);
  const cache = cacheGeometria.get(spec);
  if (cache?.chiave === chiaveCache) return disegna(cache.disegno, opzioni);
  impostaRicercaRapida(Boolean(opzioni.adattaAlContenitore));
  try {
  const cssWidth = Number(opzioni.larghezzaMassima);
  const larghezzaMassima = Number.isFinite(cssWidth) && cssWidth > 0
    ? Math.max(80, Math.floor(cssWidth * FS_BLOCCHI / 15)) : LARGHEZZA_MASSIMA;
  // Con "adattaAlContenitore" il disegno non supera la larghezza disponibile:
  // niente scorrimento orizzontale e testo mai rimpicciolito sotto i 15 px.
  const adatta = Boolean(opzioni.adattaAlContenitore);
  impostaLimiteEtichetta(adatta ? Math.max(60, Math.round(larghezzaMassima * 0.36)) : 0);
  // Le etichette hanno bisogno di spazio ai lati dei blocchi: se il disegno che
  // entra in larghezza non ne lascia, si tollera un viewBox piu' largo (il testo
  // scala) purche' nessuna corsia resti bloccata.
  const larghezzaTollerata = Math.max(larghezzaMassima, Math.min(700, Math.max(480, Math.round(larghezzaMassima * 1.7))));
  // Prima si compatta il layout; se non basta, i blocchi rifluiscono in righe.
  const spazio = limite => Math.max(0, 26 - (16 - limite) * 2);
  const misura = (layout, limite, completo) =>
    costruisci(layout, collegamenti, limite, spazio(limite), completo);
  // La larghezza cala col limite (testo piu' stretto): si cerca per bisezione il
  // limite piu' largo che entra. Il giro e' senza etichette, cosi' costa poco e
  // serve solo a scegliere le disposizioni da misurare davvero.
  const candidati = [], misure = new Map();
  const esplora = tollerata => {
    let ultimo = null;
    for (let colonne = Infinity; colonne >= 1;) {
      const layout = Number.isFinite(colonne) ? riorganizza(blocchi, colonne, collegamenti) : blocchi;
      const prova = limite => {
        const chiave = `${colonne}|${limite}`;
        if (!misure.has(chiave)) misure.set(chiave, misura(layout, limite, false));
        return misure.get(chiave);
      };
      let basso = 1, alto = 16, entra = 0;
      while (basso <= alto) {
        const m = (basso + alto) >> 1;
        if (prova(m).w <= tollerata) { entra = m; basso = m + 1; } else alto = m - 1;
      }
      const stretta = prova(1);
      if (!ultimo || stretta.w < ultimo.w) ultimo = stretta;
      if (entra) {
        const p = prova(entra);
        if (!candidati.some(c => c.chiave === `${colonne}|${entra}`)) {
          candidati.push({ chiave: `${colonne}|${entra}`, colonne, limite: entra, layout, w: p.w, conflitti: p.conflitti, valutato: null });
        }
      }
      if (colonne === 1) break;
      colonne = colonne === Infinity ? 6 : colonne - 1;
    }
    return ultimo;
  };
  // Le etichette si misurano solo sui migliori candidati: vince chi ha meno
  // conflitti, a pari conflitti il disegno piu' stretto (testo piu' grande).
  // Scelta per il contenitore stretto: si misurano davvero le disposizioni piu'
  // compatte e vince la piu' larga che entra, a parita' di conflitti. Se nessuna
  // entra si prende la piu' stretta, mai un disegno non misurato.
  const scegliStretto = budget => {
    // A desktop si preserva per quanto possibile la disposizione originale:
    // non comprimere in una colonna quando c'è spazio per la sequenza.
    const ordinati = [...candidati].sort((a, b) => b.colonne - a.colonne || b.w - a.w);
    let migliore = null, stretto = null;
    for (const c of ordinati) {
      if (!c.valutato) c.valutato = misura(c.layout, c.limite, true);
      // La stima senza nomi può sottovalutare la larghezza finale. Prima di
      // spezzare una catena poco densa, compatta la disposizione originale.
      if (c.colonne === Infinity && collegamenti.length <= 12 && c.valutato.w > budget) {
        for (let limite = c.limite - 1; limite >= 1; limite--) {
          const prova = misura(c.layout, limite, true);
          if (prova.w < c.valutato.w) c.valutato = prova;
          if (prova.w <= budget) break;
        }
      }
      const completo = c.valutato;
      if (!stretto || completo.w < stretto.w) stretto = completo;
      if (completo.w > budget) continue;
      if (!migliore || completo.conflitti < migliore.conflitti
        || (completo.conflitti === migliore.conflitti && completo.w > migliore.w)) migliore = completo;
      if (!migliore.conflitti) break;
    }
    return migliore || stretto;
  };
  const scegli = (tollerata, quanti) => {
    let migliore = null, tentativi = 0;
    for (const c of candidati) {
      if (tentativi >= quanti) break;
      if (!c.valutato) { c.valutato = misura(c.layout, c.limite, true); tentativi++; }
      const completo = c.valutato;
      if (completo.w > tollerata) continue;
      if (!migliore || completo.conflitti < migliore.conflitti
        || (completo.conflitti === migliore.conflitti && completo.w < migliore.w)) migliore = completo;
      if (!completo.conflitti) break;
    }
    return migliore;
  };
  const ordina = () => candidati.sort((a, b) => a.conflitti - b.conflitti || a.w - b.w);
  let ultimo = esplora(larghezzaMassima);
  if (adatta) {
    const stretto = scegliStretto(larghezzaMassima);
    if (!stretto) throw new Error('disposizione non trovata');
    rettificaCollisioni(stretto.frecce, collegamenti, stretto.nodi);
    const box = bboxBlocchi(stretto.nodi, stretto.frecce);
    stretto.left = Math.floor(box.left - PADDING); stretto.top = Math.floor(box.top - PADDING);
    stretto.w = Math.ceil(box.right + PADDING) - stretto.left;
    stretto.h = Math.ceil(box.bottom + PADDING) - stretto.top;
    cacheGeometria.set(spec, { chiave: chiaveCache, disegno: stretto });
    return disegna(stretto, opzioni);
  }
  let disegno = scegli(larghezzaMassima, 3);
  if (!disegno || disegno.conflitti) {
    // Serve piu' spazio ai nomi: si tollera un viewBox piu' largo (il testo scala).
    esplora(larghezzaTollerata);
    ordina();
    const ampio = scegli(larghezzaTollerata, 3);
    if (ampio && (!disegno || !Number.isFinite(disegno.conflitti) || ampio.conflitti < disegno.conflitti)) disegno = ampio;
  }
  if (!disegno) disegno = ultimo ? { ...ultimo, conflitti: Infinity } : null;
  if (!disegno) throw new Error('disposizione non trovata');

  cacheGeometria.set(spec, { chiave: chiaveCache, disegno });
  return disegna(disegno, opzioni);
  } finally {
    impostaRicercaRapida(false);
  }
}
