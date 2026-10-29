/**
 * Aiutanti UI condivisi. Nessuna dipendenza dal DOM al caricamento:
 * le funzioni che usano marked/DOMPurify le richiamano solo quando
 * il browser le ha rese disponibili (script vendor caricati in index.html).
 */

import { testoSicuro } from './core/math.js';

/**
 * Renderizza Markdown (testo delle lezioni) in HTML sicuro.
 * @param {string} testo
 * @returns {string}
 */
export function renderMarkdown(testo) {
  const t = testoSicuro(testo);
  let html = t;
  if (typeof window !== 'undefined' && window.marked) {
    try {
      html = window.marked.parse(t);
    } catch (_err) {
      html = escapeHtmlHtml(t);
    }
  }
  if (typeof window !== 'undefined' && window.DOMPurify) {
    try {
      html = window.DOMPurify.sanitize(html, { USE_PROFILE: { html: true } });
    } catch (_err) {
      // sanitize non disponibile: lascia il testo escapato
      html = escapeHtmlHtml(t);
    }
  }
  return html;
}

function escapeHtmlHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Chip di stato leggibile, senza 'null'.
 * @param {string} testo
 * @param {string} tipo 'ok'|'in-arrivo'|'avviso'
 * @returns {string}
 */
export function chipStato(testo, tipo = 'ok') {
  const t = testoSicuro(testo);
  const classe = `chip chip-${tipo}`;
  return `<span class="${classe}">${escapeHtmlHtml(t)}</span>`;
}

/**
 * Elenco puntato sicuro da un array di stringhe.
 * @param {unknown} arr
 * @returns {string}
 */
export function elenco(arr) {
  if (!Array.isArray(arr)) return '';
  const items = arr
    .map((v) => `<li>${escapeHtmlHtml(testoSicuro(v))}</li>`)
    .join('');
  return items.length ? `<ul>${items}</ul>` : '';
}

/**
 * Link di navigazione verso un nodo; se il nodo non esiste nel grafo,
 * segnala 'in arrivo' senza mai mostrare 'null'.
 * @param {string} id
 * @param {string} titolo
 * @param {boolean} esistente
 * @returns {string}
 */
export function linkNodo(id, titolo, esistente) {
  const t = testoSicuro(titolo || id);
  if (esistente) {
    return `<a href="#/nodo/${escapeHtmlHtml(String(id))}" class="link-nodo">${escapeHtmlHtml(t)}</a>`;
  }
  return `<span class="link-nodo in-arrivo" aria-label="${escapeHtmlHtml(t)}, in arrivo">${escapeHtmlHtml(t)} <span class="badge">in arrivo</span></span>`;
}
