const CHIAVE = 'tlc-kg:esiti-quiz:v1';
const LIMITE = 2000;

function validaEsito(esito) {
  return esito && typeof esito.item_id === 'string' && typeof esito.nodo_id === 'string' &&
    typeof esito.corretto === 'boolean' && ['allenamento', 'simulazione'].includes(esito.modalita) &&
    typeof esito.ts === 'string' && !Number.isNaN(Date.parse(esito.ts));
}

export function leggiEsiti(storage) {
  try {
    const raw = storage?.getItem(CHIAVE);
    if (!raw) return [];
    const valori = JSON.parse(raw);
    if (!Array.isArray(valori)) return [];
    return valori.filter(validaEsito).slice(-LIMITE);
  } catch {
    return [];
  }
}

export function registraEsito(storage, esito) {
  if (!storage || !validaEsito(esito)) return false;
  try {
    const valori = [...leggiEsiti(storage), esito].slice(-LIMITE);
    storage.setItem(CHIAVE, JSON.stringify(valori));
    return true;
  } catch {
    return false;
  }
}
