/**
 * Gestione dello stato persistente nel localStorage con prefisso tlc-kg:.
 * Le funzioni accettano un oggetto `storage` (in browser window.localStorage;
 * nei test un oggetto map-like) per restare testabili in node senza DOM.
 */

const PREFIX = 'tlc-kg:';
const KEY_STATO = 'tlc-kg:stato:v1';           // stato di studio per nodo
const KEY_RIPASSO = 'tlc-kg:ripasso:v1';       // SM-2 1-3-7-14
const KEY_DIMOSTRAZIONI = 'tlc-kg:dimostrazioni:v1'; // progressi a buchi / recall
const KEY_IMPOSTAZIONI = 'tlc-kg:impostazioni:v1';   // data d'esame, preferenze

function chiaveValida(chiave) {
  return typeof chiave === 'string' && chiave.startsWith(PREFIX) && chiave.length > PREFIX.length;
}

/**
 * Legge un valore JSON da una chiave tlc-kg:.
 * @param {object} storage
 * @param {string} chiave
 * @param {unknown} defaultValue
 * @returns {unknown}
 */
export function leggiChiave(storage, chiave, defaultValue = null) {
  if (!storage || !chiaveValida(chiave)) return defaultValue;
  try {
    const raw = storage.getItem(chiave);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch (_err) {
    return defaultValue;
  }
}

/**
 * Scrive un valore JSON su una chiave tlc-kg:.
 * @param {object} storage
 * @param {string} chiave
 * @param {unknown} valore
 * @returns {boolean}
 */
export function scriviChiave(storage, chiave, valore) {
  if (!storage || !chiaveValida(chiave)) return false;
  try {
    storage.setItem(chiave, JSON.stringify(valore));
    return true;
  } catch (_err) {
    return false; // quota esaurita o storage bloccato: niente crash
  }
}

/**
 * Stato di studio per nodo.
 * @param {object} storage
 * @param {string} nodoId
 * @returns {object}
 */
export function leggiStatoNodo(storage, nodoId) {
  const stati = leggiChiave(storage, KEY_STATO, {});
  return (stati && stati[nodoId]) || {};
}

/**
 * Salva lo stato di studio per un nodo.
 * @param {object} storage
 * @param {string} nodoId
 * @param {object} stato
 * @returns {boolean}
 */
export function scriviStatoNodo(storage, nodoId, stato) {
  const stati = leggiChiave(storage, KEY_STATO, {});
  if (!stati || typeof stati !== 'object') stati = {};
  stati[nodoId] = stato;
  return scriviChiave(storage, KEY_STATO, stati);
}

/**
 * Esporta tutte le chiavi tlc-kg: in un oggetto (backup JSON).
 * @param {object} storage
 * @returns {object}
 */
export function backupTutteChiavi(storage) {
  const risultato = {};
  if (!storage) return risultato;
  try {
    for (let i = 0; i < storage.length; i++) {
      const chiave = storage.key(i);
      if (chiaveValida(chiave)) {
        risultato[chiave] = leggiChiave(storage, chiave);
      }
    }
  } catch (_err) {
    // ignora
  }
  return risultato;
}

/**
 * Importa chiavi tlc-kg: da un oggetto JSON. Valida il prefisso di ogni chiave.
 * @param {object} storage
 * @param {object} dati
 * @returns {number} chiavi importate
 */
export function importaChiavi(storage, dati) {
  if (!storage || !dati || typeof dati !== 'object') return 0;
  let n = 0;
  for (const [chiave, valore] of Object.entries(dati)) {
    if (chiaveValida(chiave)) {
      scriviChiave(storage, chiave, valore);
      n++;
    }
  }
  return n;
}

/* Chiavi canoniche (sez. 9.5 del contratto) */
export { KEY_STATO, KEY_RIPASSO, KEY_DIMOSTRAZIONI, KEY_IMPOSTAZIONI };
