/** Stato di studio della dimostrazione: passi rivelati, persistito in localStorage. */

const PREFISSO = 'tlc-kg:dimostrazioni:v1.';

export function chiaveStato(id) {
  return PREFISSO + String(id);
}

/** Porta un valore a un intero compreso tra 0 e il numero di passi. */
export function clampRivelati(valore, totale) {
  const massimo = Math.max(0, Math.floor(Number(totale)) || 0);
  const n = Math.floor(Number(valore));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), massimo);
}

export function leggiRivelati(storage, id, totale) {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(chiaveStato(id));
    if (raw === null) return 0;
    const valore = JSON.parse(raw);
    return clampRivelati(valore && valore.passiRivelati, totale);
  } catch (_e) {
    return 0;
  }
}

export function scriviRivelati(storage, id, rivelati) {
  if (!storage) return false;
  try {
    storage.setItem(chiaveStato(id), JSON.stringify({ passiRivelati: Math.max(0, Math.floor(rivelati) || 0) }));
    return true;
  } catch (_e) {
    return false;
  }
}
