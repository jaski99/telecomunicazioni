/** Schede delle cinque modalità (tabs sticky) e visibilità dei relativi pannelli. */

export const MODI = [
  ['studio', 'Studio'],
  ['avocce', 'A voce'],
  ['compatta', 'Compatta'],
  ['abuchi', 'A buchi'],
  ['recall', 'Recall'],
];

function scheda([modo, etichetta]) {
  const attivo = modo === 'studio';
  return `<button class="dim-tab${attivo ? ' attivo' : ''}" type="button" role="tab" id="tab-${modo}" data-modo="${modo}" aria-controls="modo-${modo}" aria-selected="${attivo}">${etichetta}</button>`;
}

/** Barra delle modalità: scorre in orizzontale dentro .scroll-x, resta in cima allo scroll. */
export function renderTabs() {
  return `<div class="dim-tabs"><div class="scroll-x" role="region" tabindex="0" aria-label="Modalità di studio"><div class="tabs" role="tablist" aria-label="Modalità di studio">${MODI.map(scheda).join('')}</div></div></div>`;
}

/** Pannello di una modalità; è nascosto tranne quello di Studio. La classe «sempre-visibile»
 *  resta sul pannello Studio perché i test di D2 la cercano nella modalità Studio. */
export function renderPannello(modo, contenuto) {
  const attivo = modo === 'studio';
  const classi = attivo ? 'dim-pannello sempre-visibile' : 'dim-pannello';
  return `<section id="modo-${modo}" class="${classi}" role="tabpanel" aria-labelledby="tab-${modo}"${attivo ? '' : ' hidden'}>${contenuto}</section>`;
}

/** Mostra solo il pannello della modalità scelta; i controlli di studio vivono solo in Studio. */
export function mostraModo(container, modo) {
  for (const tab of container.querySelectorAll('[role="tab"]')) {
    const attivo = tab.getAttribute('data-modo') === modo;
    tab.classList.toggle('attivo', attivo);
    tab.setAttribute('aria-selected', String(attivo));
  }
  for (const pannello of container.querySelectorAll('[role="tabpanel"]')) {
    pannello.hidden = pannello.id !== `modo-${modo}`;
  }
  const controlli = container.querySelector('.dim-controlli');
  if (controlli) controlli.hidden = modo !== 'studio';
  const corpo = container.querySelector('.dim-corpo');
  if (corpo) corpo.classList.toggle('dim-corpo--studio', modo === 'studio');
}

export function setupModalita(container) {
  const lista = container.querySelector('[role="tablist"]');
  if (!lista) return;
  lista.addEventListener('click', (ev) => {
    const tab = ev.target.closest('[role="tab"][data-modo]');
    if (tab) mostraModo(container, tab.getAttribute('data-modo'));
  });
}
