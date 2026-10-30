/** Stato di studio persistito e parsing del permalink ?passo=n. */
const PREFISSO = 'tlc-kg:dimostrazioni:v1.';

export function chiaveStato(id) { return PREFISSO + String(id); }

export function clampRivelati(valore, totale) {
  const massimo = Math.max(0, Math.floor(Number(totale)) || 0), n = Math.floor(Number(valore));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), massimo);
}

export function parsePasso(query, totale) {
  const parametri = new URLSearchParams(String(query || '').replace(/^\?/, ''));
  return parametri.has('passo') ? clampRivelati(parametri.get('passo'), totale) : null;
}

export function leggiRivelati(storage, id, totale) {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(chiaveStato(id));
    return raw === null ? 0 : clampRivelati(JSON.parse(raw)?.passiRivelati, totale);
  } catch (_e) { return 0; }
}

export function scriviRivelati(storage, id, rivelati) {
  if (!storage) return false;
  try {
    storage.setItem(chiaveStato(id), JSON.stringify({ passiRivelati: Math.max(0, Math.floor(rivelati) || 0) }));
    return true;
  } catch (_e) { return false; }
}
