/**
 * Router basato su hash. Gestisce le rotte del sito:
 * #/ , #/grafo, #/nodo/<id>, #/dim/<id>, #/esercizi, #/quiz,
 * #/ripasso, #/fonti.
 */

export function parseHash() {
  let hash = typeof location !== 'undefined' ? location.hash : '';
  if (hash.startsWith('#')) hash = hash.slice(1);
  return hash || '';
}

export function corrispondenzaPercorso(percorso, pattern) {
  const partiP = percorso.split('/').filter(s => s.length > 0);
  const partiPat = pattern.split('/').filter(s => s.length > 0);
  if (partiP.length !== partiPat.length) return null;
  const params = {};
  for (let i = 0; i < partiPat.length; i++) {
    const pat = partiPat[i];
    if (pat.startsWith(':') && pat.length > 1) {
      params[pat.slice(1)] = partiP[i];
    } else if (pat !== partiP[i]) {
      return null;
    }
  }
  return params;
}

export function creaRouter(routes, onRender) {
  let attivo = null;
  function eseguire(hash) {
    const percorso = hash.replace(/^#/, '');
    for (const route of routes) {
      const params = corrispondenzaPercorso(percorso, route.path);
      if (params !== null) {
        attivo = { route, params, percorso };
        if (onRender) onRender(attivo);
        return attivo;
      }
    }
    attivo = { route: null, params: {}, percorso };
    if (onRender) onRender(attivo);
    return attivo;
  }
  return { eseguire, stato: () => attivo };
}
