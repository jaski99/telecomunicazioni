/**
 * Applicazione a pagina singola: bootstrap, routing hash, montaggio delle
 * pagine e rendering della matematica (KaTeX). Moduli ES, nessun bundler.
 */

import { renderMath, testoSicuro, escapeHtml } from './core/math.js';
import { creaRouter, parseHashConQuery } from './router.js';
import { shellHTML } from './layout/shell.js';
import { salvaUltimaPagina } from './core/store.js';
import * as homePage from './pages/home.js';
import * as grafoPage from './pages/grafo.js';
import * as nodoPage from './pages/nodo.js';
import * as dimPage from './pages/dimostrazione.js';
import * as eserciziPage from './pages/esercizi.js';
import * as quizPage from './pages/quiz.js';
import * as ripassoPage from './pages/ripasso.js';
import * as fontiPage from './pages/fonti.js';
import * as areaPage from './pages/area.js';
const ROUTES = [
  { path: '', page: homePage },
  { path: 'area/:n', page: areaPage },
  { path: 'grafo', page: grafoPage },
  { path: 'nodo/:id', page: nodoPage },
  { path: 'dim/:id', page: dimPage },
  { path: 'esercizi', page: eserciziPage },
  { path: 'quiz', page: quizPage },
  { path: 'ripasso', page: ripassoPage },
  { path: 'fonti', page: fontiPage },
];
let graph = { versione: 1, meta: {}, nodi: [], esame: [], pendenti: [] };
let quiz = { versione: 1, descrizione: '', elementi: [] };
let currentUnmount = null;
const storage = typeof window !== 'undefined' ? window.localStorage : null;
async function caricaJSON(url, fallback) {
  try {
    const risposta = await fetch(url, { cache: 'no-store' });
    if (!risposta.ok) return fallback;
    return await risposta.json();
  } catch (_err) {
    return fallback;
  }
}
function renderErrore(messaggio) {
  return `<section class="errore">
    <h1>Errore di pagina</h1>
    <p class="avviso">${escapeHtml(testoSicuro(messaggio))}</p>
    <button class="btn" type="button" onclick="location.reload()">Ricarica</button>
  </section>`;
}
const router = creaRouter(ROUTES, () => { /* stato gestito da mostraRoute */ });
async function mostraRoute(hash) {
  const main = document.getElementById('app');
  if (!main) return;
  if (typeof currentUnmount === 'function') {
    try { currentUnmount(); } catch (_err) { /* ignora */ }
    currentUnmount = null;
  }
  document.getElementById('shell').innerHTML = shellHTML(hash);
  main.innerHTML = '';
  const { percorso, query } = parseHashConQuery(hash);
  const stato = router.eseguire(percorso);
  const route = stato.route;
  const params = { ...(stato.params || {}), ...query };
  if (!route) {
    main.innerHTML += renderErrore('Route non riconosciuta.');
    return;
  }
  if ((route.path === 'nodo/:id' || route.path === 'dim/:id') && graph.nodi.some((n) => n.id === params.id)) {
    salvaUltimaPagina(storage, route.path.split('/')[0], params.id);
  }
  const page = route.page;
  const ctx = { graph, quiz, storage, renderMath, testoSicuro };
  let html;
  try {
    if (typeof page.render === 'function') {
      html = await page.render(ctx, params || {});
    } else {
      html = renderErrore("La pagina non è disponibile.");
    }
  } catch (err) {
    html = renderErrore(`Impossibile rendere la pagina: ${escapeHtml(String(err && err.message ? err.message : err))}`);
  }
  main.innerHTML += html;
  const sezione = document.getElementById('contenuto-pagina');
  const target = sezione || main;
  if (typeof page.setup === 'function') {
    try {
      const unmount = await page.setup(target, ctx, params || {});
      if (typeof unmount === 'function') currentUnmount = unmount;
    } catch (err) {
      console.error('setup pagina fallito:', err);
      target.insertAdjacentHTML('beforeend', `<p class="avviso">Comportamento ridotto: setup pagina non completato.</p>`);
    }
  }
  // renderizza la matematica inserita dalla pagina
  try {
    await renderMath(target);
  } catch (err) {
    console.error('renderMath fallito:', err);
  }
  if (params.sezione && /^\d+$/.test(params.sezione)) {
    document.getElementById(`sez-${params.sezione}`)?.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}

function gestoreErroreGlobale(event) {
  const msg = event && (event.message || event.error || String(event));
  console.error('Errore JS globale:', msg);
  return false;
}

async function avvia() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', gestoreErroreGlobale);
  window.addEventListener('unhandledrejection', (ev) => {
    console.error('Promise non gestita:', ev && ev.reason);
  });

  // PWA: service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (_err) {
      console.error('Service worker non registrato:', _err);
    }
  }

  graph = await caricaJSON('./graph.json', graph);
  quiz = await caricaJSON('./quiz.json', quiz);

  window.addEventListener('hashchange', () => mostraRoute(parseHashConQuery().percorso));
  mostraRoute(parseHashConQuery().percorso);

  // Stampa: apri tutti i <details> prima di stampa, richiudi dopo.
  let dettagliChiusi = [];
  window.addEventListener('beforeprint', () => {
    dettagliChiusi = [...document.querySelectorAll('details:not([open])')];
    dettagliChiusi.forEach((d) => { d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    dettagliChiusi.forEach((d) => { d.open = false; });
    dettagliChiusi = [];
  });
}

avvia();
