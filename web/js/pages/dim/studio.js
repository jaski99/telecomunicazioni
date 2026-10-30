/** Modalità Studio: contenuto (sezioni, passi, chiusura) e comportamento dei controlli. */
import { passi } from './dati.js';
import { renderEnunciato, renderIpotesi, renderNotazione } from './sezioni.js';
import { aggiornaPassi, portaPassoInVista, renderPassi } from './passi.js';
import { aggiornaControlli } from './controlli.js';
import { aggiornaFinale, renderErrori, renderFigureGenerali, renderFormulaFinale } from './finale.js';
import { renderFonti } from './fonti.js';
import { clampRivelati, leggiRivelati, scriviRivelati } from './stato.js';
import { azioneTasto, descriviBersaglio } from './tastiera.js';

/** HTML del pannello Studio, nell'ordine: enunciato, ipotesi, notazione, idea, passi, formula finale,
 *  errori, figure generali, fonti chiuse. */
export function renderStudio(dim, rivelati, meta, area = 1) {
  const totale = passi(dim).length;
  const sezioni = [
    renderEnunciato(dim),
    renderIpotesi(dim),
    renderNotazione(dim),
    `<h2>Passi</h2>${renderPassi(dim, rivelati, area)}`,
    renderFormulaFinale(dim, rivelati >= totale),
    renderErrori(dim),
    renderFigureGenerali(dim, area),
    renderFonti(dim, meta),
  ];
  return sezioni.filter(Boolean).join('');
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
