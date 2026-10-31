/* Stima della larghezza renderizzata di un frammento LaTeX, in em: pesi per token
 * calibrati sul display KaTeX. Serve al riflusso mobile per decidere i tagli di riga
 * senza misurare nel DOM. Approssimazione conservativa, non pixel-perfect. */

const SIMBOLI = {
  infty: 1, partial: 0.6, nabla: 0.85, cdot: 0.5, times: 0.75, div: 0.6, pm: 0.8,
  to: 1, rightarrow: 1, leftarrow: 1, Rightarrow: 1.1, longrightarrow: 1.3, mapsto: 1.2,
  approx: 0.85, equiv: 0.85, sim: 0.7, neq: 0.85, leq: 0.85, geq: 0.85, le: 0.85, ge: 0.85,
  ll: 0.9, gg: 0.9, propto: 0.85, langle: 0.5, rangle: 0.5, lvert: 0.3, rvert: 0.3,
  alpha: 0.7, beta: 0.65, gamma: 0.65, delta: 0.6, epsilon: 0.55, varepsilon: 0.6, zeta: 0.55,
  eta: 0.55, theta: 0.6, vartheta: 0.6, iota: 0.4, kappa: 0.6, lambda: 0.65, mu: 0.65, nu: 0.5,
  xi: 0.55, pi: 0.55, rho: 0.6, sigma: 0.65, tau: 0.55, upsilon: 0.6, phi: 0.65, varphi: 0.7,
  chi: 0.65, psi: 0.65, omega: 0.7, Gamma: 0.75, Delta: 0.85, Theta: 0.8, Lambda: 0.8,
  Xi: 0.75, Pi: 0.8, Sigma: 0.85, Upsilon: 0.8, Phi: 0.8, Psi: 0.85, Omega: 0.85,
  sin: 1.15, cos: 1.25, tan: 1.2, arctan: 2.2, sinh: 1.6, cosh: 1.75, log: 1.35, ln: 0.95,
  exp: 1.35, max: 1.65, min: 1.5, sup: 1.3, inf: 1.1, lim: 1.35, det: 1.3, gcd: 1.6, arg: 1.2,
};
const OPERATORI = { sum: 1.5, prod: 1.5, coprod: 1.6, bigcup: 1.4, bigcap: 1.4 };
const INTEGRALI = { int: 1.15, iint: 1.8, iiint: 2.4, oint: 1.5 };
const SPAZI = { ',': 0.17, ';': 0.28, ':': 0.22, '!': -0.08, ' ': 0.25, quad: 1, qquad: 2 };
export const TESTUALI = ['operatorname', 'text', 'mathrm', 'mathbf', 'mathcal', 'mathbb', 'boldsymbol'];

function saltaSpazi(s, i) { while (i < s.length && /\s/u.test(s[i])) i += 1; return i; }

/** Contenuto del gruppo {...} che inizia in i e posizione subito dopo. */
export function gruppo(s, i) {
  const inizio = saltaSpazi(s, i); // \frac12: argomento a token singolo (carattere o comando)
  if (s[inizio] !== '{') { const m = /^\\[A-Za-z]+|^[\s\S]/u.exec(s.slice(inizio)); return m ? [m[0], inizio + m[0].length] : ['', inizio]; }
  let profondita = 0;
  for (let j = saltaSpazi(s, i); j < s.length; j++) {
    if (s[j] === '\\') { j += 1; continue; }
    if (s[j] === '{') profondita += 1;
    else if (s[j] === '}' && (profondita -= 1) === 0) return [s.slice(saltaSpazi(s, i) + 1, j), j + 1];
  }
  return [s.slice(saltaSpazi(s, i) + 1), s.length];
}

/** Pedici/apici consecutivi dopo un operatore: contenuti e posizione seguente. */
export function apici(s, i) {
  const esito = { sub: '', sup: '', fine: i };
  for (;;) {
    const j = saltaSpazi(s, esito.fine);
    if (s[j] !== '_' && s[j] !== '^') return esito;
    const k = saltaSpazi(s, j + 1);
    let contenuto, prossimo;
    if (s[k] === '{') [contenuto, prossimo] = gruppo(s, k);
    else { const m = /^\\[A-Za-z]+|^\\.|^./su.exec(s.slice(k)); if (!m) return esito; contenuto = m[0]; prossimo = k + m[0].length; }
    if (s[j] === '_') esito.sub = contenuto; else esito.sup = contenuto;
    esito.fine = prossimo;
  }
}

/** Larghezza stimata in em di un frammento LaTeX, secondo il render KaTeX display. */
export function larghezzaStimata(s) {
  let w = 0, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      const ambiente = /^\\(?:begin|end)\s*\{[^}]*\}/u.exec(s.slice(i));
      if (ambiente) { i += ambiente[0].length; continue; }
      const m = /^\\([A-Za-z]+|.)/su.exec(s.slice(i)); if (!m) break;
      const nome = m[1]; let prossimo = i + m[0].length;
      if (['frac', 'dfrac', 'tfrac', 'cfrac'].includes(nome)) {
        const [num, j] = gruppo(s, prossimo), [den, k] = gruppo(s, j);
        w += Math.max(larghezzaStimata(num), larghezzaStimata(den)) + 0.45; i = k; continue;
      }
      if (nome === 'sqrt') { const [a, j] = gruppo(s, prossimo); w += 0.85 + larghezzaStimata(a) * 0.95; i = j; continue; }
      if (nome === 'left' || nome === 'right') { w += 0.55; i = prossimo; continue; }
      if (TESTUALI.includes(nome)) {
        const [a, j] = gruppo(s, prossimo);
        w += Array.from(a.replace(/[{}\\]/gu, '')).length * 0.45; i = j; continue;
      }
      if (nome in OPERATORI || nome in INTEGRALI) {
        const { sub, sup, fine } = apici(s, prossimo);
        w += nome in INTEGRALI
          ? INTEGRALI[nome] + (larghezzaStimata(sub) + larghezzaStimata(sup)) * 0.7
          : Math.max(OPERATORI[nome], Math.max(larghezzaStimata(sub), larghezzaStimata(sup)) * 0.75) + 0.15;
        i = fine; continue;
      }
      if (nome in SPAZI) { w += SPAZI[nome]; i = prossimo; continue; }
      w += SIMBOLI[nome] ?? 0.75; i = prossimo; continue;
    }
    if (c === '^' || c === '_') {
      const { sub, sup, fine } = apici(s, i);
      w += Math.max(larghezzaStimata(sub), larghezzaStimata(sup)) * 0.7 + 0.05; i = fine; continue;
    }
    if (c === '{') { const [a, j] = gruppo(s, i); w += larghezzaStimata(a); i = j; continue; }
    w += /[0-9a-zA-Z]/u.test(c) ? 0.55 : /[=<>+-]/u.test(c) ? 0.8 : /[,;]/u.test(c) ? 0.3
      : /[()[\]|]/u.test(c) ? 0.4 : /['!.?]/u.test(c) ? 0.3 : /\s/u.test(c) ? 0 : 0.5;
    i += 1;
  }
  return w;
}

