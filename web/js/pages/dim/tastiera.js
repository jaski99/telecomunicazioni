/** Scorciatoie di Studio: → e Spazio passo successivo, ← passo precedente. Funzioni pure. */

const INTERATTIVI = ['BUTTON', 'A', 'SUMMARY', 'SELECT', 'INPUT', 'TEXTAREA'];
const EDITABILI = ['INPUT', 'TEXTAREA', 'SELECT'];

/** Riassume il bersaglio di un evento tastiera senza mantenere riferimenti al DOM. */
export function descriviBersaglio(el) {
  const tag = el && el.tagName ? String(el.tagName).toUpperCase() : '';
  return {
    tag,
    editabile: Boolean(el && el.isContentEditable) || EDITABILI.includes(tag),
    interattivo: INTERATTIVI.includes(tag),
    scorrevole: Boolean(el && typeof el.closest === 'function' && el.closest('.scroll-x')),
  };
}

/** Restituisce 'avanti', 'indietro' o null. Non agisce su campi di testo, né sulle aree
 *  scorrevoli (formule larghe), né su Spazio quando il focus è su un controllo. */
export function azioneTasto(tasto, bersaglio, modificatori = {}) {
  if (modificatori.altKey || modificatori.ctrlKey || modificatori.metaKey) return null;
  if (!bersaglio || bersaglio.editabile || bersaglio.scorrevole) return null;
  if (tasto === 'ArrowRight') return 'avanti';
  if (tasto === 'ArrowLeft') return 'indietro';
  if ((tasto === ' ' || tasto === 'Spacebar') && !bersaglio.interattivo) return 'avanti';
  return null;
}
