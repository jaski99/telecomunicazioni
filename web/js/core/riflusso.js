/* Riflusso delle formule display sotto 600px: righe brevi senza scroll nella .formula-box; la relazione apre la riga. */
import { apici, gruppo, larghezzaStimata, TESTUALI } from './larghezza-latex.js';

/** Capacità stimata di una riga (em): il box più stretto tiene ~10,9; il margine assorbe l'errore di stima (~20%). */
const CAPACITA = 8.5;
/** 	ext{...} non va mai a capo in KaTeX: sopra questa lunghezza si spezza in parole. */
const TESTO_MASSIMO = 18, TESTO_RIGA = 14;

const GRANDI = ['sum', 'prod', 'int', 'iint', 'oint', 'lim', 'frac', 'dfrac', 'sqrt',
  'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'max', 'min', 'operatorname'];
const LIMITATI = ['sum', 'prod', 'int', 'iint', 'oint', 'lim']; // operatori con limiti: taglio anche dopo pedici/apici
const RELAZIONI = ['leq', 'geq', 'le', 'ge', 'approx', 'neq', 'equiv', 'sim', 'propto', 'll', 'gg', 'in', 'to', 'mapsto',
  'iff', 'imply', 'rightarrow', 'leftarrow', 'leftrightarrow', 'longrightarrow', 'Longrightarrow', 'Longleftrightarrow', 'Rightarrow', 'Leftarrow', 'Leftrightarrow'];
const DOPO_OPERATORE = new RegExp(`(?:[=<>+\\-(\\[{]|\\\\(?:${RELAZIONI.join('|')}|quad|qquad|sin|cos|tan|log|ln|exp|max|min|operatorname\\{[^{}]*\\}|lgroup|lbrace|langle|lvert|lbrack|[,;:! ]|\\{))\\s*$`, 'u'),
  DOPO_FUNZIONE = /\\(?:sin|cos|tan|log|ln|exp|max|min|operatorname\{[^{}]*\})(?:\s*[_^](?:\{[^{}]*\}|\\[A-Za-z]+|.))*\s*(?:\\[,;:!]\s*)*$/u;
const PRIMA_DI_CHIUSURA = /^\s*(?:[)\]}>]|\\(?:rangle|rvert|rbrack|rgroup|rbrace|right\b|\}))/u;
const SOLO_OPERATORE = new RegExp(`^(?:[=<>+-]|\\\\(?:${RELAZIONI.join('|')}))(?:\\\\[,;:!])*\\s*$`, 'u');

/** Tier di taglio: 0 virgole/\quad, 1 relazioni, 2 binari, 3 operatori grandi, 4 spazi, 5 giustapposizioni. I gruppi proteggono; i delimitatori di \left/\right no (li appiana neutralizza). */
function analizza(s) {
  const punti = []; let graffe = 0, tonde = 0, quadre = 0, ambienti = 0;
  const chiuso = () => graffe || tonde || quadre || ambienti;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') {
      const ambiente = /^\\(begin|end)\s*\{([^}]+)\}/u.exec(s.slice(i));
      if (ambiente) { ambienti += ambiente[1] === 'begin' ? 1 : -1; i += ambiente[0].length - 1; continue; }
      const m = /^\\([A-Za-z]+|.)/u.exec(s.slice(i)), dopo = i + m[0].length;
      // \text{...} è modalità testo: si salta intero; parentesi/virgole interne non sono struttura.
      if (TESTUALI.includes(m[1])) { if (!chiuso() && i > 0 && GRANDI.includes(m[1]) && !DOPO_FUNZIONE.test(s.slice(0, i))) punti.push({ tier: 3, fineRiga: i, inizioRiga: i }); i = gruppo(s, dopo)[1] - 1; continue; }
      // Il delimitatore dopo \left/\right non protegge: se un taglio lo scavalca, neutralizza lo rende semplice.
      if ((m[1] === 'left' || m[1] === 'right') && '()[]'.includes(s[dopo] ?? '')) { i = dopo; continue; }
      if (!chiuso()) {
        if ((m[1] === 'quad' || m[1] === 'qquad') && !DOPO_FUNZIONE.test(s.slice(0, i))) punti.push({ tier: 0, fineRiga: i, inizioRiga: dopo });
        else if (RELAZIONI.includes(m[1])) punti.push({ tier: 1, fineRiga: i, inizioRiga: i });
        else if (GRANDI.includes(m[1]) && i > 0 && !DOPO_FUNZIONE.test(s.slice(0, i))) {
          punti.push({ tier: 3, fineRiga: i, inizioRiga: i });
          const { fine } = LIMITATI.includes(m[1]) ? apici(s, dopo).fine : dopo; // confine operatore/sommando
          if (fine > dopo) punti.push({ tier: 3, fineRiga: fine, inizioRiga: fine });
        }
      }
      i = dopo - 1; continue;
    }
    const c = s[i];
    if (c === '{') graffe += 1; else if (c === '}') graffe = Math.max(0, graffe - 1);
    else if (c === '(') tonde += 1; else if (c === ')') tonde = Math.max(0, tonde - 1);
    else if (c === '[') quadre += 1; else if (c === ']') quadre = Math.max(0, quadre - 1);
    if (c === ',' && !chiuso()) punti.push({ tier: 0, fineRiga: i + 1, inizioRiga: i + 1 });
    else if (!chiuso() && '=<>'.includes(c)) punti.push({ tier: 1, fineRiga: i, inizioRiga: i });
    else if (!chiuso() && (c === '+' || c === '-') && i > 0 && !(/[(,^[{]\s*$/u.test(s.slice(0, i)) || DOPO_OPERATORE.test(s.slice(0, i)))) punti.push({ tier: 2, fineRiga: i, inizioRiga: i });
    else if (!chiuso() && /\s/u.test(c) && !DOPO_OPERATORE.test(s.slice(0, i)) && !DOPO_FUNZIONE.test(s.slice(0, i)) && !PRIMA_DI_CHIUSURA.test(s.slice(i))) punti.push({ tier: 4, fineRiga: i, inizioRiga: i + 1 });
    else if (!chiuso() && c === ')' && /[A-Za-z\\(]/u.test(s[i + 1] ?? '')) punti.push({ tier: 5, fineRiga: i + 1, inizioRiga: i + 1 });
  }
  return punti.sort((a, b) => a.fineRiga - b.fineRiga);
}

const monda = (t) => t.replace(/^\s+/u, '').replace(/(?<!\\)\s+$/u, ''); // trim che rispetta `\ ` finale: è un comando

function spezza(s, offset, punti) {
  const righe = []; let inizio = 0;
  for (const p of punti) {
    const grezzo = s.slice(inizio, Math.max(p.fineRiga, inizio)), riga = monda(grezzo);
    if (SOLO_OPERATORE.test(riga)) continue; // `= \frac...`: l'operatore guida il frammento dopo
    if (riga) righe.push({ testo: riga, offset: offset + inizio + /^\s*/u.exec(grezzo)[0].length });
    inizio = Math.max(inizio, p.inizioRiga); // i punti adiacenti (virgola + \quad) non perdono il salto
  }
  const grezzo = s.slice(inizio), riga = monda(grezzo);
  if (riga) righe.push({ testo: riga, offset: offset + inizio + /^\s*/u.exec(grezzo)[0].length });
  return righe;
}

function imballa(seg, capacita = CAPACITA) {
  const atomi = spezza(seg.testo, seg.offset, analizza(seg.testo).filter(p => p.tier >= 1));
  if (atomi.length <= 1) return [seg];
  const righe = []; let corrente = atomi[0];
  for (const atomo of atomi.slice(1)) {
    if (SOLO_OPERATORE.test(atomo.testo)) { righe.push(corrente); corrente = atomo; continue; }
    const unito = { testo: `${corrente.testo} ${atomo.testo}`, offset: corrente.offset };
    if (larghezzaStimata(unito.testo) <= capacita) corrente = unito;
    else { righe.push(corrente); corrente = atomo; }
  }
  righe.push(corrente);
  return righe.length > 1 ? righe : [seg];
}

function spezzaTutto(latex) {
  const segmenti = spezza(latex, 0, analizza(latex).filter(p => p.tier === 0));
  return segmenti.flatMap(seg => larghezzaStimata(seg.testo) > CAPACITA ? imballa(seg) : [seg]);
}

function spezzaTestiLunghi(latex) {
  return latex.replace(/\\text\{([^{}]*)\}/gu, (m, contenuto) => {
    if (Array.from(contenuto).length <= TESTO_MASSIMO) return m;
    const pezzi = []; let corrente = '';
    for (const parola of contenuto.match(/\S+\s*/gu) || []) {
      if (corrente && Array.from(corrente + parola).length > TESTO_RIGA) { pezzi.push(corrente); corrente = parola; }
      else corrente += parola;
    }
    if (corrente) pezzi.push(corrente);
    return pezzi.length > 1 ? pezzi.map(p => `\\text{${p}}`).join(' ') : m;
  });
}

/** Valore e condizione restano distinti da una virgola e da uno spazio leggibile. */
function unisciCelle(celle) {
  return celle.map((c, i) => i < celle.length - 1 ? c.replace(/,\s*$/u, '') : c).join(', \\quad ');
}

function spezzaCaso(celle) {
  const unito = unisciCelle(celle);
  if (larghezzaStimata(unito) <= CAPACITA) return [unito];
  if (celle.length < 2) return imballa({ testo: unito, offset: 0 }).map((f, i) => (i ? `{}${f.testo}` : f.testo));
  const valore = celle[0].replace(/,\s*$/u, ''), condizione = unisciCelle(celle.slice(1));
  const frammenti = imballa({ testo: valore, offset: 0 });
  const ordine = [...new Set([frammenti.length - 1, 0, ...frammenti.keys()])];
  const componi = (scelto, condizioni) => {
    const righe = frammenti.map(f => f.testo);
    righe[scelto] += `, \\quad ${condizioni[0].testo}`;
    righe.splice(scelto + 1, 0, ...condizioni.slice(1).map(f => f.testo));
    return righe.map((r, i) => (i ? `{}${r}` : r));
  };
  // Preferisce la coda del valore; se non entra, usa il primo frammento piuttosto
  // che lasciare la condizione sola su una riga (il caso lungo di eta scorre così).
  for (const i of ordine) {
    if (larghezzaStimata(`${frammenti[i].testo}, \\quad ${condizione}`) <= CAPACITA)
      return componi(i, [{ testo: condizione }]);
  }
  // Se il valore lascia poco spazio, spezza anche la condizione: il suo inizio resta
  // accanto al valore e soltanto la continuazione (mai una condizione intera) va a capo.
  for (const i of ordine) {
    const disponibile = CAPACITA - larghezzaStimata(`${frammenti[i].testo}, \\quad `);
    if (disponibile <= 0) continue;
    const condizioni = imballa({ testo: condizione, offset: 0 }, disponibile);
    if (condizioni.length > 1 && condizioni.every(f => larghezzaStimata(f.testo) <= disponibile))
      return componi(i, condizioni);
  }
  // Fallback per notazioni atomiche eccezionali: evita comunque la condizione orfana.
  let scelto = ordine[0], minimo = Infinity;
  for (const i of ordine) {
    const larghezza = larghezzaStimata(`${frammenti[i].testo}, \\quad ${condizione}`);
    if (larghezza < minimo) { scelto = i; minimo = larghezza; }
  }
  return componi(scelto, [{ testo: condizione }]);
}

/** Ogni case diventa una o più righe di gathered, senza condizioni orfane. */
function appiattisciCasi(latex) {
  const casi = /\\begin\{(cases|dcases)\}([\s\S]*?)\\end\{\1\}/gu;
  if (!casi.test(latex) || larghezzaStimata(latex) <= CAPACITA) return latex;
  return latex.replace(casi, (m, ambiente, corpo) => {
    const righe = corpo.split(/\\\\(?:\[[^\]]*\])?/u).map(r => r.trim()).filter(Boolean)
      .flatMap(r => spezzaCaso(r.split('&').map(c => c.trim()).filter(Boolean)));
    if (righe.length < 2) return m;
    return `\\left\\{\\begin{gathered}${righe.join('\\\\{}')}\\end{gathered}\\right.`;
  });
}

/** Coppia scavalcata → delimitatore-comando invisibile ai contatori: il gruppo non si riprotegge e KaTeX non fallisce. */
const SINISTRA = { '(': '\\lgroup ', '[': '\\lbrack ', '{': '\\lbrace ', '|': '\\lvert ', '.': '' };
const DESTRA = { ')': '\\rgroup ', ']': '\\rbrack ', '}': '\\rbrace ', '|': '\\rvert ', '.': '' };

function neutralizza(latex, tagli) {
  const re = /\\(left|right)\s*(\\[A-Za-z]+|\\.|[\s\S])/gu;
  const pila = [], coppie = [];
  for (let m = re.exec(latex); m; m = re.exec(latex)) {
    if (m[1] === 'left') pila.push(m);
    else { const sx = pila.pop(); if (sx) coppie.push([sx, m]); }
  }
  const attraversate = coppie.flatMap(([sx, dx]) => tagli.some(t => t > sx.index && t <= dx.index) ? [sx, dx] : []);
  if (!attraversate.length) return latex;
  let esito = latex;
  for (const m of attraversate.sort((a, b) => b.index - a.index)) {
    const delimitatore = (m[1] === 'left' ? SINISTRA : DESTRA)[m[2]] ?? (m[2].trim() === '.' ? '' : m[2]);
    esito = esito.slice(0, m.index) + delimitatore + esito.slice(m.index + m[0].length);
  }
  return esito;
}
/** Righe di riflusso per una formula display; [] se non serve o non si può spezzare. */
export function righeDisplay(latex) {
  if (typeof latex !== 'string' || latex.length < 40 || !analizza(latex).some(p => p.tier <= 1)) return [];
  let corrente = spezzaTestiLunghi(appiattisciCasi(latex));
  for (let giro = 0; giro < 3; giro++) {
    const segmenti = spezzaTutto(corrente);
    if (segmenti.length <= 1) return [];
    const neutro = neutralizza(corrente, segmenti.slice(1).map(s => s.offset));
    if (neutro === corrente) return segmenti.map(s => s.testo);
    corrente = neutro;
  }
  return spezzaTutto(corrente).map(s => s.testo);
}
