/** Etichette umane per i valori tecnici dei dati (stati, tipi, fonti). Funzioni pure. */

const VERIFICA = {
  verificata_testo_prof: 'Verificata sul testo del prof',
  verificata_file1_file3: 'Verificata su file1 e file3',
  solo_file3: 'Solo da file3',
  ricostruzione_non_del_prof: 'Ricostruzione: non dal testo del prof',
  da_verificare: 'Da verificare',
};

const TONO_VERIFICA = {
  verificata_testo_prof: 'ok',
  verificata_file1_file3: 'ok',
};

const TIPO = {
  dimostrazione: 'Dimostrazione',
  concetto: 'Concetto',
  tipo_esercizio: 'Tipo di esercizio',
};

const FONTI = {
  FILE1: 'Appunti di studente (file1)',
  FILE2: "Raccolta di domande d'esame (file2)",
  FILE3: 'Dimostrazioni di studenti (file3)',
  RICOSTRUZIONE: 'Ricostruzione non tratta dal testo del prof',
};

function umanizza(valore) {
  const testo = String(valore == null ? '' : valore).replace(/_/g, ' ').trim().toLowerCase();
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

function leggi(mappa, chiave) {
  return Object.prototype.hasOwnProperty.call(mappa, chiave) ? mappa[chiave] : undefined;
}

/** Etichetta dello stato di verifica; stati sconosciuti diventano «Da verificare». */
export function etichettaVerifica(stato) {
  const etichetta = leggi(VERIFICA, stato);
  return etichetta === undefined ? VERIFICA.da_verificare : etichetta;
}

/** Tono del chip di verifica: 'ok' solo per gli stati verificati, altrimenti 'warn'. */
export function toneVerifica(stato) {
  const tono = leggi(TONO_VERIFICA, stato);
  return tono === undefined ? 'warn' : tono;
}

export function etichettaTipo(tipo) {
  const etichetta = leggi(TIPO, tipo);
  return etichetta === undefined ? umanizza(tipo) : etichetta;
}

/** Etichetta di una chiave di `fonti`: mappa nota, poi descrizione in meta, infine chiave umanizzata. */
export function etichettaFonte(chiave, meta) {
  const nota = leggi(FONTI, chiave);
  if (nota !== undefined) return nota;
  const descrizione = meta && meta.fonti && meta.fonti[chiave] && meta.fonti[chiave].descrizione;
  return typeof descrizione === 'string' && descrizione ? descrizione : umanizza(chiave);
}

/** Etichetta di una domanda d'esame, es. «Domanda d'esame T5». */
export function etichettaProva(id) {
  return `Domanda d'esame ${String(id == null ? '' : id)}`;
}
