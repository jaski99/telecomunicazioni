/* Elementi finti minimi per i test node dei moduli dim/ (in node non c'è un DOM reale).
   Supportano solo le operazioni che i moduli usano; il comportamento reale è coperto dai test e2e. */

export function elemento(opzioni = {}) {
  const attrs = { ...(opzioni.attrs || {}) };
  const classi = new Set(opzioni.classi || []);
  const ascoltatori = {};
  return {
    tagName: opzioni.tag || 'DIV',
    id: attrs.id || '',
    dataset: { ...(opzioni.dataset || {}) },
    textContent: opzioni.textContent || '',
    innerHTML: '',
    className: '',
    value: opzioni.value || '',
    disabled: Boolean(opzioni.disabled),
    hidden: Boolean(opzioni.hidden),
    style: {},
    isContentEditable: false,
    childElementCount: opzioni.childElementCount || 0,
    children: opzioni.children || {},
    matches: opzioni.matches || [],
    classList: {
      add: (c) => classi.add(c),
      remove: (c) => classi.delete(c),
      toggle(c, forza) {
        const on = forza === undefined ? !classi.has(c) : Boolean(forza);
        if (on) classi.add(c); else classi.delete(c);
        return on;
      },
      contains: (c) => classi.has(c),
    },
    get classi() { return [...classi]; },
    getAttribute: (nome) => (nome in attrs ? attrs[nome] : null),
    setAttribute(nome, valore) { attrs[nome] = String(valore); },
    querySelector(selettore) { return [].concat(this.children[selettore] || [])[0] || null; },
    querySelectorAll(selettore) { return [].concat(this.children[selettore] || []); },
    closest(selettore) { return this.matches.includes(selettore) ? this : null; },
    addEventListener(tipo, fn) { (ascoltatori[tipo] ||= []).push(fn); },
    removeEventListener(tipo, fn) { ascoltatori[tipo] = (ascoltatori[tipo] || []).filter((f) => f !== fn); },
    dispatch(tipo, ev = {}) { (ascoltatori[tipo] || []).forEach((fn) => fn({ target: this, preventDefault() { this.prevenuto = true; }, ...ev })); },
    ascoltatori: () => Object.keys(ascoltatori).reduce((n, t) => n + ascoltatori[t].length, 0),
  };
}

/** Memorizzazione in memoria con la stessa interfaccia di localStorage. */
export function memoria(iniziale = {}) {
  const dati = { ...iniziale };
  return {
    getItem: (k) => (k in dati ? dati[k] : null),
    setItem(k, v) { dati[k] = String(v); },
    dati,
  };
}

/** Documento finto: solo i listener globali usati dai moduli (keydown) e getElementById. */
export function documentoFinto(elementiPerId = {}) {
  const ascoltatori = {};
  return {
    addEventListener(tipo, fn) { (ascoltatori[tipo] ||= []).push(fn); },
    removeEventListener(tipo, fn) { ascoltatori[tipo] = (ascoltatori[tipo] || []).filter((f) => f !== fn); },
    dispatch(tipo, ev = {}) { (ascoltatori[tipo] || []).forEach((fn) => fn({ target: null, preventDefault() { this.prevenuto = true; }, ...ev })); },
    getElementById: (id) => elementiPerId[id] || null,
    ascoltatori: () => Object.keys(ascoltatori).reduce((n, t) => n + ascoltatori[t].length, 0),
  };
}

/** Dimostrazione minima ma completa, con figure e verifica, per i test dei moduli. */
export function dimostrazioneEsempio(sovrascrivi = {}) {
  return {
    id: 'dim-test',
    titolo: 'Prova di test',
    domande_esame: ['T2'],
    enunciato: 'Primo paragrafo.\n\nSecondo paragrafo.',
    ipotesi: ['Segnale limitato'],
    notazione: [{ simbolo: 'x(t)', significato: 'segnale' }],
    idea: 'Usare la linearità.',
    passi: [
      { n: 1, testo: 'Primo passo con $x$.', formula: '\\int_0^1 x\\,dt', perche: 'Per definizione.', figura: 'fig-a' },
      { n: 2, testo: 'Secondo passo.', formula: '', perche: 'Per somma.' },
      { n: 3, testo: 'Terzo passo.', formula: 'y=x', perche: 'Per ipotesi.' },
    ],
    formula_finale: 'Y(f)=X(f)',
    figure: [
      { id: 'fig-a', tipo: 'grafico', titolo: 'Figura A', descrizione: 'Descrizione A', serie: [] },
      { id: 'fig-b', tipo: 'grafico', titolo: 'Figura B', descrizione: 'Descrizione B', serie: [] },
    ],
    verifica: { stato: 'verificata_file1_file3', data: '2026-10-29', note: 'Nota.', punti_aperti: ['Da chiarire'] },
    fonti: [{ chiave: 'FILE1', rif: 'pp. 1-2' }],
    errori_frequenti: [{ errore: 'Sbaglio', perche_sbagliato: 'Non vale', correzione: 'Fare così' }],
    richiamo_attivo: [{ domanda: 'Quanto vale?', risposta: 'Vale uno.' }],
    varianti_notazione: [{ canonica: '$\\omega_0$', variante: '$m_0$', fonte: 'file3' }],
    a_voce: 'Parlato uno. Parlato due.',
    versione_compatta: ['$X(f)$ è la trasformata.'],
    a_buchi: { testo: 'Il valore è ___1___ e poi ___2___.', soluzioni: { 1: ['uno'], 2: ['due', '2'] } },
    collegamenti: [],
    ...sovrascrivi,
  };
}

export function graphEsempio(dim = dimostrazioneEsempio()) {
  return {
    meta: { fonti: { FILE1: { descrizione: 'Appunti' } } },
    nodi: [{ id: dim.id, tipo: 'dimostrazione', dimostrazione: dim }],
    esame: [{ id: 'T2', tipo: 'T', titolo: 'Trasformata impulsiva', punti: 10 }],
  };
}
