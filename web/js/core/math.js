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

/** Compila LaTeX puro senza mai sollevare eccezioni; errore in katex-err. */
export function compilaLatexSicuro(s) {
  if (typeof s !== 'string' || !s.length) return '';
  try { return katex.renderToString(s, { ...RUNTIME_OPTIONS, throwOnError: false }); }
  catch (_e) { return `<code class="katex katex-err">${escapeHtml(s)}</code>`; }
}

/** Vero se una inline lunga va promossa a display (ha comando display e >40 char). */
export function devePromuovereInDisplay(corpo) {
  if (typeof corpo !== 'string') return false;
  if (DISPLAY_SEMPRE_RE.test(corpo)) return true;
  return corpo.length > PROMOZIONE_SOGLIA_CARATTERI && DISPLAY_COMMANDS_RE.test(corpo);
}

/** Formula inline (nessuna aria-hidden: il MathML resta accessibile). */
export function formulaInline(latex) {
  if (typeof latex !== 'string' || !latex.length) return '';
  return `<span class="formula-inline">${compilaLatexSicuro(latex)}</span>`;
}

/** Formula in display: .formula-box[--key] > .scroll-x con KaTeX displayMode. */
export function formulaBlock(latex, opzioni = {}) {
  const chiave = opzioni && opzioni.variante === 'chiave';
  const etichetta = opzioni && opzioni.etichetta != null ? String(opzioni.etichetta) : '';
  const label = etichetta ? `<div class="formula-box__label">${escapeHtml(etichetta)}</div>` : '';
  const corpo = typeof latex === 'string' && latex.length ? compilaLatexSicuro(latex) : '';
  return `<div class="formula-box${chiave ? ' formula-box--key' : ''}">
${label}
<div class="scroll-x" tabindex="0" role="region" aria-label="Formula">${corpo}</div>
</div>`;
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

/** Renderizza matematica con promozione automatica inline->display. Mai eccezioni. */
export async function renderMath(el) {
  if (typeof Element === 'undefined' || !(el instanceof Element)) return;
  const nodes = []; const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node;
  while ((node = walker.nextNode()) !== null) {
    if (node.parentElement && node.parentElement.closest('.katex, .katex-html')) continue;
    nodes.push(node);
  }
  for (const textNode of nodes) {
    const parent = textNode.parentNode; if (!parent) continue;
    const tokens = tokenizzaMatematica(textNode.textContent); if (!tokens.length) continue;
    const frag = document.createDocumentFragment();
    for (const t of tokens) {
      if (t.type === 'text') { frag.appendChild(document.createTextNode(t.body)); continue; }
      const inDisplay = t.type === 'display' || devePromuovereInDisplay(t.body);
      let html; try { html = katex.renderToString(t.body, { ...RUNTIME_OPTIONS, displayMode: inDisplay, throwOnError: false }); }
      catch (_e) { html = `<code class="katex katex-err">${escapeHtml(t.body)}</code>`; }
      let wrap = document.createElement(inDisplay ? 'div' : 'span');
      wrap.className = inDisplay ? '' : 'formula-inline';
      if (inDisplay) {
        const box = document.createElement('div'); box.className = 'formula-box';
        const sc = document.createElement('div'); sc.className = 'scroll-x';
        sc.setAttribute('tabindex', '0'); sc.setAttribute('role', 'region'); sc.setAttribute('aria-label', 'Formula');
        sc.innerHTML = html; box.appendChild(sc); wrap = box;
      } else wrap.innerHTML = html;
      frag.appendChild(wrap);
    }
    parent.replaceChild(frag, textNode);
  }
}
