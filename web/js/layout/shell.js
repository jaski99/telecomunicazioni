const SEZIONI = [
  ['', 'Percorso'], ['grafo', 'Grafo'], ['esercizi', 'Esercizi'],
  ['quiz', 'Quiz'], ['ripasso', 'Ripasso'],
];

export function navHTML(route = '') {
  const links = SEZIONI.map(([path, label]) => {
    const active = route === path || (path && route.startsWith(`${path}/`));
    return `<a href="#/${path}"${active ? ' aria-current="page" class="attivo"' : ''}>${label}</a>`;
  }).join('');
  return `<nav class="nav-principale" aria-label="Navigazione principale"><div class="nav-lista">${links}</div></nav>`;
}

export function shellHTML(route = '') {
  return `<div class="container header-inner"><a href="#/" class="brand" aria-label="Home">TLC Studio</a>${navHTML(route)}</div>`;
}
