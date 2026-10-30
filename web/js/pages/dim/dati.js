/** Accesso ai dati di una dimostrazione (funzioni pure, senza DOM). */

/** Trova il nodo e la sua dimostrazione per ID; null se mancano. */
export function trovaDimostrazione(graph, id) {
  const nodi = Array.isArray(graph && graph.nodi) ? graph.nodi : [];
  const nodo = nodi.find((n) => n && String(n.id) === String(id));
  const dim = nodo && nodo.dimostrazione && typeof nodo.dimostrazione === 'object' ? nodo.dimostrazione : null;
  return dim ? { nodo, dim } : null;
}

export function passi(dim) {
  return Array.isArray(dim && dim.passi) ? dim.passi.filter(Boolean) : [];
}

export function figureDi(dim) {
  return Array.isArray(dim && dim.figure) ? dim.figure.filter(Boolean) : [];
}

/** Figure non agganciate a nessun passo: vanno nell'elenco «Figure generali». */
export function figureGenerali(dim) {
  const usate = new Set(passi(dim).map((p) => p.figura).filter(Boolean));
  return figureDi(dim).filter((f) => !usate.has(f.id));
}

/** Paragrafi separati da righe vuote; un testo senza righe vuote è un solo paragrafo. */
export function paragrafi(testo) {
  return String(testo == null ? '' : testo).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
}

/** Prove d'esame della dimostrazione con titolo e punti (solo se numerici, da graph.esame). */
export function proveDi(dim, graph) {
  const esame = Array.isArray(graph && graph.esame) ? graph.esame : [];
  const ids = Array.isArray(dim && dim.domande_esame) ? dim.domande_esame : [];
  return ids.map((id) => {
    const prova = esame.find((p) => p && p.id === id);
    return {
      id: String(id),
      titolo: prova && typeof prova.titolo === 'string' ? prova.titolo : '',
      punti: prova && Number.isFinite(prova.punti) ? prova.punti : null,
    };
  });
}
