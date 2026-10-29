import katex from '../../vendor/katex/katex.mjs';

// Opzioni KaTeX a runtime: mai eccezioni su input della pagina,
// mai fiducia cieca (trust: false), output HTML + MathML.
const RUNTIME_OPTIONS = {
  throwOnError: false,
  trust: false,
  output: 'htmlAndMathml',
  displayMode: false,
};

// Delimitatori: $$...$$ (display) ha la precedenza su $...$ (inline).
const MATH_RE = /\$\$(.*?)\$\$|\$(.*?)\$/gs;

/**
 * Tokenizza una stringa di testo in frammenti di testo puro e matematica.
 * @param {string} text
 * @returns {Array<{type: 'text'|'inline'|'display', body: string}>}
 */
export function tokenizzaMatematica(text) {
  const tokens = [];
  let lastIndex = 0;
  let match;
  MATH_RE.lastIndex = 0;
  while ((match = MATH_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', body: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      tokens.push({ type: 'display', body: match[1] });
    } else {
      tokens.push({ type: 'inline', body: match[2] });
    }
    lastIndex = MATH_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', body: text.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Compila una stringa LaTeX pura (senza delimitatori $).
 * Usato dai test con throwOnError: true.
 * @param {string} s
 * @returns {string} HTML di KaTeX
 */
export function compilaLatex(s) {
  if (typeof s !== 'string' || s.length === 0) {
    return '';
  }
  return katex.renderToString(s, { ...RUNTIME_OPTIONS, throwOnError: true });
}

/**
 * Renderizza la matematica ($...$ e $$...$$) contenuta nei nodi di testo
 * discendenti di `el`. A runtime non solleva mai eccezioni visibili.
 * @param {Element} el
 */
export async function renderMath(el) {
  if (typeof Element === 'undefined' || !(el instanceof Element)) {
    return;
  }
  const textNodes = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode()) !== null) {
    // Non rielaborare testi già dentro output KaTeX.
    if (node.parentElement && node.parentElement.closest('.katex, .katex-html')) {
      continue;
    }
    textNodes.push(node);
  }
  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (!parent) continue;
    const tokens = tokenizzaMatematica(textNode.textContent);
    if (tokens.length === 0) continue;
    const fragment = document.createDocumentFragment();
    for (const token of tokens) {
      if (token.type === 'text') {
        fragment.appendChild(document.createTextNode(token.body));
        continue;
      }
      let html = '';
      try {
        html = katex.renderToString(token.body, {
          ...RUNTIME_OPTIONS,
          displayMode: token.type === 'display',
        });
      } catch (_err) {
        // Formula non risolvibile: mostra il sorgente tra parentesi,
        // mai 'null'/'undefined' a schermo.
        html = `<span class="katex katex-err" style="color:#b00020">${escapeHtml(token.body)}</span>`;
      }
      const wrapper = document.createElement('span');
      wrapper.innerHTML = html;
      while (wrapper.firstChild) {
        fragment.appendChild(wrapper.firstChild);
      }
    }
    parent.replaceChild(fragment, textNode);
  }
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Testo sicuro da mostrare: mai 'null', 'undefined', 'NaN' a schermo.
 * @param {unknown} v
 * @returns {string}
 */
export function testoSicuro(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    return String(v);
  }
  return String(v);
}
