/** Modalità Studio: contenuto (sezioni, passi, chiusura) e comportamento dei controlli. */
import { passi } from './dati.js';
import { renderEnunciato, renderIpotesi, renderNotazione } from './sezioni.js';
import { aggiornaPassi, portaPassoInVista, renderPassi } from './passi.js';
import { aggiornaControlli } from './controlli.js';
import { aggiornaFinale, renderErrori, renderFigureGenerali, renderFormulaFinale } from './finale.js';
import { renderFonti } from './fonti.js';
import { clampRivelati, leggiRivelati, scriviRivelati } from './stato.js';
import { azioneTasto, descriviBersaglio } from './tastiera.js';

/** Blocchi del pannello Studio, nell'ordine: enunciato, ipotesi, notazione, passi, formula
 *  finale, errori, figure generali, fonti. I blocchi vuoti si scartano; l'indice di pagina
 *  usa lo stesso elenco (la formula finale non ha intestazione e resta fuori dall'indice). */
export function blocchiStudio(dim, rivelati, meta, area = 1) {
  const totale = passi(dim).length;
  return [
    { titolo: 'Enunciato', html: renderEnunciato(dim) },
    { titolo: 'Ipotesi', html: renderIpotesi(dim) },
    { titolo: 'Notazione', html: renderNotazione(dim) },
    { titolo: 'Passi', html: `<h2>Passi</h2>${renderPassi(dim, rivelati, area)}` },
    { titolo: '', html: renderFormulaFinale(dim, rivelati >= totale), fuoriIndice: true },
    { titolo: 'Errori frequenti', html: renderErrori(dim) },
    { titolo: 'Figure generali', html: renderFigureGenerali(dim, area) },
    { titolo: 'Fonti, varianti e verifica', html: renderFonti(dim, meta) },
  ].filter((blocco) => blocco.html);
}

/** Ancorabile: id sez-<n> sul primo tag del blocco, così ?sezione=<n> lo raggiunge. */
function ancorabile(html, n) {
  return html.replace(/^<([a-z0-9]+)/, `<$1 id="sez-${n}"`);
}

/** HTML del pannello Studio, con le sezioni numerate come ancore per l'indice di pagina. */
export function renderStudio(dim, rivelati, meta, area = 1) {
  let n = 0;
  return blocchiStudio(dim, rivelati, meta, area).map((blocco) => {
    if (blocco.fuoriIndice) return blocco.html;
    n += 1;
    return ancorabile(blocco.html, n);
  }).join('');
}

/** Voci di indice della dimostrazione, per il modulo indice unico di E1 (layout/indice.js). */
export function vociIndiceStudio(dim, meta, area = 1, idNodo = '') {
  let n = 0;
  return blocchiStudio(dim, 0, meta, area).filter((blocco) => !blocco.fuoriIndice).map((blocco) => {
    n += 1;
    return {
      id: `sez-${n}`,
      titolo: blocco.titolo,
      href: `#/dim/${encodeURIComponent(String(idNodo))}?sezione=${n}`,
      livello: 2,
    };
  });
}

function modificatori(ev) {
  return { altKey: ev.altKey, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey };
}

/** Il pannello di confronto va cercato dentro il passo del pulsante, non in tutto il
 *  pannello Studio: lo stesso id può comparire in più istanze della pagina. */
function pannelloConfronto(bottone) {
  const passo = bottone.closest('.step');
  if (!passo) return null;
  const id = bottone.getAttribute('aria-controls');
  return [...passo.querySelectorAll('[id]')].find(e => e.id === id) || null;
}

/** Collega barra, indice e tastiera. Restituisce la funzione che rimuove i listener. */
export function setupStudio(container, dim, storage, area = 1, passoRichiesto = null) {
  const pannello = container.querySelector('#modo-studio');
  const controlli = container.querySelector('.dim-controlli');
  if (!pannello || !controlli) return () => {};
  const totale = passi(dim).length;
  let rivelati = passoRichiesto == null ? leggiRivelati(storage, dim.id, totale) : clampRivelati(passoRichiesto, totale);

  const imposta = (nuovo, persisti = true) => {
    rivelati = clampRivelati(nuovo, totale);
    if (persisti) scriviRivelati(storage, dim.id, rivelati);
    aggiornaPassi(pannello, dim, rivelati, area);
    aggiornaFinale(pannello, rivelati >= totale);
    aggiornaControlli(controlli, rivelati, totale);
  };
  const azioni = {
    avanti: () => {
      if (rivelati >= totale) return;
      imposta(rivelati + 1);
      portaPassoInVista(pannello, rivelati);
    },
    indietro: () => imposta(rivelati - 1),
    tutti: () => imposta(totale),
    ricomincia: () => imposta(0),
  };

  const confrontoClick = ev => {
    const bottone = ev.target.closest('.figura-confronta[aria-controls]');
    if (!bottone) return;
    const target = pannelloConfronto(bottone);
    if (!target) return;
    target.hidden = !target.hidden;
    bottone.setAttribute('aria-expanded', String(!target.hidden));
  };
  pannello.addEventListener('click', confrontoClick);
  controlli.addEventListener('click', (ev) => {
    const bottone = ev.target.closest('[data-azione]');
    if (bottone && azioni[bottone.dataset.azione]) {
      azioni[bottone.dataset.azione]();
      return;
    }
    const voce = ev.target.closest('[data-indice]');
    if (voce && !voce.disabled) portaPassoInVista(pannello, voce.dataset.indice);
  });

  const alTasto = (ev) => {
    if (pannello.hidden) return;
    const azione = azioneTasto(ev.key, descriviBersaglio(ev.target), modificatori(ev));
    if (!azione) return;
    ev.preventDefault();
    azioni[azione]();
  };
  document.addEventListener('keydown', alTasto);
  const menu = controlli.querySelector('.dim-menu');
  const desktop = typeof matchMedia === 'function' ? matchMedia('(min-width: 1024px)') : null;
  const allineaMenu = () => { if (menu && desktop) menu.open = desktop.matches; };
  allineaMenu();
  if (desktop) desktop.addEventListener('change', allineaMenu);
  if (passoRichiesto != null && rivelati > 0) portaPassoInVista(pannello, rivelati);
  return () => {
    pannello.removeEventListener('click', confrontoClick);
    document.removeEventListener('keydown', alTasto);
    if (desktop) desktop.removeEventListener('change', allineaMenu);
  };
}
