/** web/js/pages/nodo.js — owner E1. Entry point della scheda nodo.
 * Re-export di render/setup (logica in nodo/render.js) più comportamento
 * dei rivelatori e apertura sezione richiesta da ?sezione=.
 */
export { render } from './nodo/render.js';

export function setup(container, ctx, params) {
  container.addEventListener('click', (ev) => {
    const link = ev.target.closest('.indice-pagina a[href^="#sez-"]');
    if (link) {
      ev.preventDefault();
      const numero = link.getAttribute('href').slice(5);
      location.hash = `#/nodo/${encodeURIComponent(params.id)}?sezione=${numero}`;
      return;
    }
    const btn = ev.target.closest('.js-rivelatore');
    if (!btn) return;
    const target = container.querySelector(`#${btn.getAttribute('data-target')}`);
    if (!target) return;
    const apri = target.hidden;
    target.hidden = !apri;
    btn.setAttribute('aria-expanded', apri ? 'true' : 'false');
    btn.textContent = apri ? 'Nascondi' : (btn.getAttribute('data-label') || 'Mostra');
  });
  // Apertura sezione richiesta da ?sezione=
  const sezione = (params && params.sezione) || '';
  if (sezione) {
    const el = container.querySelector(`#sez-${sezione}`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
    }
  }
}
