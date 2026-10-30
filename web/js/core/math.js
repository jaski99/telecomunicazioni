import katex from '../../vendor/katex/katex.mjs';

const RUNTIME_OPTIONS = { throwOnError: false, trust: false, output: 'htmlAndMathml', displayMode: false };
const MATH_RE = /\$\$(.*?)\$\$|\$(.*?)\$/gs;
const DISPLAY_COMMANDS_RE = /\\(?:frac|dfrac|sum|int|prod|lim)/;
const DISPLAY_SEMPRE_RE = /\\(?:dfrac|begin)/;
const PROMOZIONE_SOGLIA_CARATTERI = 40;

/** Tokenizza testo in frammenti testo / inline $...$ / display $$...$$. */
export function tokenizzaMatematica(text) {
  const tokens = []; let lastIndex = 0; let match;
  MATH_RE.lastIndex = 0;
  while ((match = MATH_RE.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push({ type: 'text', body: text.slice(lastIndex, match.index) });
    tokens.push(match[1] !== undefined ? { type: 'display', body: match[1] } : { type: 'inline', body: match[2] });
    lastIndex = MATH_RE.lastIndex;
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', body: text.slice(lastIndex) });
  return tokens;
}

/** Compila LaTeX puro (test: throwOnError: true). Mai eccezioni visibili. */
export function compilaLatex(s) {
  if (typeof s !== 'string' || !s.length) return '';
  return katex.renderToString(s, { ...RUNTIME_OPTIONS, throwOnError: true });
}

/** Compila senza eccezioni, mantenendo sorgente e modalità in caso di errore. */
function renderLatexSicuro(s, displayMode = false) {
  if (typeof s !== 'string' || !s.length) return '';
  try { return katex.renderToString(s, { ...RUNTIME_OPTIONS, displayMode, throwOnError: true }); }
  catch (_e) { return `<code class="katex-err">${escapeHtml(s)}</code>`; }
}

export function compilaLatexSicuro(s) { return renderLatexSicuro(s); }

/** Vero se una inline lunga va promossa a display (ha comando display e >40 char). */
export function devePromuovereInDisplay(corpo) {
  if (typeof corpo !== 'string') return false;
  if (DISPLAY_SEMPRE_RE.test(corpo)) return true;
  return corpo.length > PROMOZIONE_SOGLIA_CARATTERI && DISPLAY_COMMANDS_RE.test(corpo);
}

/** Formula inline (nessuna aria-hidden: il MathML resta accessibile). */
export function formulaInline(latex, punteggiatura = '') {
  if (typeof latex !== 'string' || !latex.length) return '';
  return `<span class="formula-inline">${compilaLatexSicuro(latex)}${escapeHtml(punteggiatura)}</span>`;
}

/** Separa virgole e spazi tipografici esterni; usa l'uguaglianza solo come ripiego. */
function righeDisplay(latex) {
  if (typeof latex !== 'string' || latex.length < 40) return [];
  const righe = [], uguaglianze = []; let inizio = 0, graffe = 0, tonde = 0, quadre = 0, ambienti = 0;
  for (let i = 0; i < latex.length; i++) {
    if (latex[i] === '\\') {
      const ambiente = /^\\(begin|end)\s*\{([^}]+)\}/u.exec(latex.slice(i));
      if (ambiente) { ambienti += ambiente[1] === 'begin' ? 1 : -1; i += ambiente[0].length - 1; continue; }
      const spazio = /^\\(qquad|quad)\b/u.exec(latex.slice(i));
      if (spazio && !graffe && !tonde && !quadre && !ambienti) {
        const riga = latex.slice(inizio, i).trim(); if (riga) righe.push(riga);
        i += spazio[0].length - 1; inizio = i + 1; continue;
      }
      const comando = /^\\(?:[A-Za-z]+|.)/u.exec(latex.slice(i));
      if (comando) { if (comando[0] === '\\{') graffe++; if (comando[0] === '\\}') graffe = Math.max(0, graffe - 1); i += comando[0].length - 1; continue; }
    }
    const c = latex[i];
    if (c === '{') graffe++; else if (c === '}') graffe = Math.max(0, graffe - 1);
    else if (c === '(') tonde++; else if (c === ')') tonde = Math.max(0, tonde - 1);
    else if (c === '[') quadre++; else if (c === ']') quadre = Math.max(0, quadre - 1);
    else if (c === '=' && !graffe && !tonde && !quadre && !ambienti) uguaglianze.push(i);
    else if (c === ',' && !graffe && !tonde && !quadre && !ambienti) {
      const riga = latex.slice(inizio, i + 1).trim(); if (riga) righe.push(riga); inizio = i + 1;
    }
  }
  const ultima = latex.slice(inizio).trim(); if (ultima) righe.push(ultima);
  if (righe.length <= 1 && uguaglianze.length) {
    righe.length = 0; inizio = 0;
    for (const indice of uguaglianze) { const riga = latex.slice(inizio, indice + 1).trim(); if (riga) righe.push(riga); inizio = indice + 1; }
    const resto = latex.slice(inizio).trim(); if (resto) righe.push(resto);
  }
  return righe.length > 1 ? righe : [];
}

function formulaDisplayResponsiva(latex) {
  const righe = righeDisplay(latex);
  return righe.length ? `\\begin{gathered}${righe.join('\\\\{}')}\\end{gathered}` : '';
}

/** Formula in display: .formula-box[--key] > .scroll-x con KaTeX displayMode. */
export function formulaBlock(latex, opzioni = {}) {
  const chiave = opzioni && opzioni.variante === 'chiave';
  const etichetta = opzioni && opzioni.etichetta != null ? String(opzioni.etichetta) : '';
  const label = etichetta ? `<div class="formula-box__label">${escapeHtml(etichetta)}</div>` : '';
  const corpo = renderLatexSicuro(latex, true);
  const responsive = formulaDisplayResponsiva(latex);
  const varianteMobile = responsive ? `<div class="formula-box__reflow">${renderLatexSicuro(responsive, true)}</div>` : '';
  return `<div class="formula-box${chiave ? ' formula-box--key' : ''}${responsive ? ' formula-box--reflow' : ''}">\n${label}\n<div class="scroll-x" tabindex="0" role="region" aria-label="Formula"><div class="formula-box__original">${corpo}</div>${varianteMobile}</div>\n</div>`;
}

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/** Testo sicuro: mai 'null', 'undefined', 'NaN' a schermo. */
export function testoSicuro(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  return String(v);
}

/** Una sola formula, eventualmente circondata da spazi, occupa il proprio blocco. */
export function formulaIsolata(tokens) {
  const significativi = tokens.filter(t => t.type !== 'text' || t.body.trim());
  return significativi.length === 1 && significativi[0].type === 'inline';
}

/** Renderizza matematica con promozione automatica inline->display. Mai eccezioni. */
export async function renderMath(el) {
  if (typeof Element === 'undefined' || !(el instanceof Element)) return;
  const nodes = []; const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node;
  while ((node = walker.nextNode()) !== null) {
    if (node.parentElement && node.parentElement.closest('.katex, .katex-html')) continue;
    nodes.push(node);
  }
  for (const textNode of nodes) {
    const parent = textNode.parentElement; if (!parent) continue;
    const tokens = tokenizzaMatematica(textNode.textContent);
    if (!tokens.some(t => t.type !== 'text')) continue;
    const inTitolo = !!parent.closest('h1, h2, h3, h4, h5, h6');
    const blocco = /^(DIV|P|LI|SECTION|ARTICLE|BLOCKQUOTE)$/.test(parent.tagName);
    const isolata = !inTitolo && blocco && parent.childNodes.length === 1 && formulaIsolata(tokens);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'text') { frag.appendChild(document.createTextNode(t.body)); continue; }
      const inDisplay = t.type === 'display' || (!inTitolo && (isolata || devePromuovereInDisplay(t.body)));
      let punteggiatura = '';
      const prossimo = tokens[i + 1];
      if (!inDisplay && t.type === 'inline' && prossimo && prossimo.type === 'text') {
        const match = /^(\s*[,.;:)]+)/u.exec(prossimo.body);
        if (match) { punteggiatura = match[1]; prossimo.body = prossimo.body.slice(match[1].length); }
      }
      const template = document.createElement('template');
      template.innerHTML = inDisplay ? formulaBlock(t.body) : formulaInline(t.body, punteggiatura);
      frag.appendChild(template.content);
    }
    parent.replaceChild(frag, textNode);
  }
}
