/* Cache dei moduli della pagina dimostrazione. La precache di web/build.sh elenca solo i file
   storici: questi moduli sono importati all'avvio da dimostrazione.js, quindi vanno aggiunti
   alla cache del service worker (stesso approccio dei moduli figura di D2). */

const MODULI = [
  'index.js', 'cache.js', 'dati.js', 'etichette.js', 'stato.js', 'testata.js', 'testi.js',
  'modalita.js', 'studio.js', 'sezioni.js', 'passi.js', 'controlli.js', 'tastiera.js',
  'finale.js', 'fonti.js', 'abuchi.js', 'recall.js',
];

/** URL assoluti dei moduli della cartella dim/, a partire dalla base (import.meta.url). */
export function urlModuliDim(base) {
  return MODULI.map((nome) => new URL(nome, base).href);
}

function completaCache() {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker || typeof caches === 'undefined') return;
  const urls = urlModuliDim(import.meta.url);
  const aggiorna = async () => {
    if (navigator.onLine === false) return;
    await navigator.serviceWorker.ready;
    if (navigator.onLine === false) return;
    const nomi = (await caches.keys()).filter((nome) => nome.startsWith('tlc-kg-'));
    const risposte = await Promise.all(urls.map((url) => fetch(`${url}?tlc-precache=1`, { cache: 'no-store' })));
    for (const nome of nomi) {
      const cache = await caches.open(nome);
      await Promise.all(risposte.map((risposta, i) => (risposta.ok ? cache.put(urls[i], risposta.clone()) : Promise.resolve())));
    }
  };
  aggiorna().catch(() => {});
}

completaCache();
