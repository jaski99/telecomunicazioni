/** web/js/layout/indice.js — owner E1.
 * Unico modulo indice della pagina, usato da nodo e (condiviso) dalla dimostrazione.
 * Accetta voci { id, titolo, href, livello, attiva } e restituisce HTML <ol> con ancore.
 */
export function indiceHTML(voci) {
  if (!Array.isArray(voci) || !voci.length) return '';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const items = voci.map((v) => {
    const classi = [];
    if (v.livello) classi.push(`livello-${String(v.livello)}`);
    if (v.attiva) classi.push('attiva');
    const classeAttr = classi.length ? ` class="${classi.join(' ')}"` : '';
    const attivaAttr = v.attiva ? ' aria-current="page"' : '';
    const href = v.href ? ` href="${esc(v.href)}"` : '';
    return `<li${classeAttr}${attivaAttr}><a${href}>${esc(v.titolo)}</a></li>`;
  }).join('');
  return `<nav class="indice-pagina" aria-label="Indice della pagina"><ol>${items}</ol></nav>`;
}

/** Costruisce le voci di indice dagli elementi di intestazione (h1..h3) di un contenitore. */
export function indiceDaIntestazioni(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return [];
  const voci = [];
  let sezione = 0;
  let sottosezione = 0;
  for (const h of container.querySelectorAll('h1, h2, h3')) {
    const id = h.id || `sez-${voci.length + 1}`;
    if (!h.id) h.id = id;
    const testo = h.textContent.trim();
    if (!testo) continue;
    if (h.tagName === 'H2') {
      sezione += 1; sottosezione = 0;
      voci.push({ id, titolo: testo, href: `#${id}`, livello: 2 });
    } else if (h.tagName === 'H3') {
      sottosezione += 1;
      voci.push({ id, titolo: testo, href: `#${id}`, livello: 3 });
    }
  }
  return voci;
}
