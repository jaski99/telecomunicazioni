#!/bin/sh
# web/build.sh
# Copia graph/graph.json e graph/quiz.json in web/ (se mancano, file vuoti validi)
# e genera la precache per il service worker. Compatibile con sh/dash (CI).

set -u

WEB_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$WEB_DIR/.." && pwd)

echo "[web/build.sh] copia i file del grafo in web/ ..."

if [ -f "$ROOT/graph/graph.json" ]; then
  cp "$ROOT/graph/graph.json" "$WEB_DIR/graph.json"
  echo "[web/build.sh] graph/graph.json copiato in web/graph.json"
else
  printf '{"versione":1,"meta":{"fonti":{}},"nodi":[],"esame":[],"pendenti":[]}\n' > "$WEB_DIR/graph.json"
  echo "[web/build.sh] graph/graph.json mancante: web/graph.json creato vuoto valido"
fi

if [ -f "$ROOT/graph/quiz.json" ]; then
  cp "$ROOT/graph/quiz.json" "$WEB_DIR/quiz.json"
  echo "[web/build.sh] graph/quiz.json copiato in web/quiz.json"
else
  printf '{"versione":1,"descrizione":"","elementi":[]}\n' > "$WEB_DIR/quiz.json"
  echo "[web/build.sh] graph/quiz.json mancante: web/quiz.json creato vuoto valido"
fi

echo "[web/build.sh] genera la precache ..."
node - "$WEB_DIR" <<'NODE'
const fs = require('fs');
const path = require('path');
const webDir = process.argv[2];
const files = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'icon-512.png',
  'css/tokens.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/legacy.css',
  'css/math.css',
  'css/figure.css',
  'css/pages/dimostrazione.css',
  'css/pages/home.css',
  'css/pages/grafo.css',
  'css/pages/nodo.css',
  'css/pages/quiz.css',
  'css/pages/esercizi.css',
  'css/pages/ripasso.css',
  'css/pages/fonti.css',
  'js/layout/shell.js',
  'js/app.js',
  'js/core/math.js',
  'js/core/store.js',
  'js/router.js',
  'js/ui.js',
  'js/figure/helpers.js',
  'js/figure/index.js',
  'js/figure/grafico.js',
  'js/figure/blocchi.js',
  'js/figure/temporale.js',
  'js/pages/home.js',
  'js/pages/grafo.js',
  'js/pages/nodo.js',
  'js/pages/dimostrazione.js',
  'js/pages/esercizi.js',
  'js/pages/quiz.js',
  'js/pages/ripasso.js',
  'js/pages/fonti.js',
  'graph.json',
  'quiz.json',
  'vendor/katex/katex.mjs',
  'vendor/katex/katex.min.css',
  'vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  'vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  'vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  'vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
  'vendor/marked/marked.esm.js',
  'vendor/dompurify/purify.es.mjs',
  'modules/quiz/index.js',
  'modules/quiz/esiti.js',
];
// Versione di cache derivata dal contenuto delle risorse precachate.
const existing = files.filter((f) => fs.existsSync(path.join(webDir, f)));
// Versione di cache derivata dal CONTENUTO delle risorse precachate.
const crypto = require('crypto');
const h = crypto.createHash('sha1');
for (const f of existing) {
  try { h.update(fs.readFileSync(path.join(webDir, f))); } catch (_e) { h.update(f); }
}
const cacheVersion = 'tlc-kg-' + h.digest('hex').slice(0,12);
const js =
  'self.__TLK_CACHE_VERSION = ' + JSON.stringify(cacheVersion) + ';\n' +
  'self.__TLK_PRECACHE = ' + JSON.stringify(existing, null, 2) + ';\n';
fs.writeFileSync(path.join(webDir, 'precache.js'), js, { encoding: 'utf8' });
fs.writeFileSync(path.join(webDir, 'precache-manifest.json'), JSON.stringify(existing, null, 2), { encoding: 'utf8' });
console.log('[web/build.sh] precache generata con ' + existing.length + ' risorse');
NODE

echo "[web/build.sh] fatto."
