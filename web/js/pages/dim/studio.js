/** Modalità Studio: contenuto (sezioni, passi, chiusura) e comportamento dei controlli. */
import { passi } from './dati.js';
import { renderEnunciato, renderIdea, renderIpotesi, renderNotazione } from './sezioni.js';
import { aggiornaPassi, portaPassoInVista, renderPassi } from './passi.js';
import { aggiornaControlli } from './controlli.js';
import { aggiornaFinale, renderErrori, renderFigureGenerali, renderFormulaFinale } from './finale.js';
import { renderFonti } from './fonti.js';
import { clampRivelati, leggiRivelati, scriviRivelati } from './stato.js';
import { azioneTasto, descriviBersaglio } from './tastiera.js';

/** HTML del pannello Studio, nell'ordine: enunciato, ipotesi, notazione, idea, passi, formula finale,
 *  errori, figure generali, fonti chiuse. */
export function renderStudio(dim, rivelati, meta) {
  const totale = passi(dim).length;
  const sezioni = [
    renderEnunciato(dim),
    renderIpotesi(dim),
    renderNotazione(dim),
    renderIdea(dim),
    `<h2>Passi</h2>${renderPassi(dim, rivelati)}`,
    renderFormulaFinale(dim, rivelati >= totale),
    renderErrori(dim),
    renderFigureGenerali(dim),
    renderFonti(dim, meta),
  ];
  return sezioni.filter(Boolean).join('');
}

function modificatori(ev) {
  return { altKey: ev.altKey, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey };
}

/** Collega barra, indice e tastiera. Restituisce la funzione che rimuove i listener. */
export function setupStudio(container, dim, storage) {
  const pannello = container.querySelector('#modo-studio');
  const controlli = container.querySelector('.dim-controlli');
  if (!pannello || !controlli) return () => {};
  const totale = passi(dim).length;
  let rivelati = leggiRivelati(storage, dim.id, totale);

  const imposta = (nuovo) => {
    rivelati = clampRivelati(nuovo, totale);
    scriviRivelati(storage, dim.id, rivelati);
    aggiornaPassi(pannello, dim, rivelati);
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
  return () => document.removeEventListener('keydown', alTasto);
}
