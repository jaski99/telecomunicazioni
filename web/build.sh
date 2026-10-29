#!/bin/sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/web"
if [ -f "$ROOT/graph/graph.json" ]; then
  cp "$ROOT/graph/graph.json" "$ROOT/web/graph.json"
  echo "Copiato graph/graph.json -> web/graph.json"
else
  echo '{"versione":1,"meta":{},"aree":[],"nodi":[],"esame":[],"pendenti":[]}' > "$ROOT/web/graph.json"
  echo "Creato web/graph.json vuoto (graph/graph.json non trovato)"
fi
if [ -f "$ROOT/graph/quiz.json" ]; then
  cp "$ROOT/graph/quiz.json" "$ROOT/web/quiz.json"
  echo "Copiato graph/quiz.json -> web/quiz.json"
else
  if [ ! -f "$ROOT/web/quiz.json" ]; then
    echo '{"versione":1,"descrizione":"","elementi":[]}' > "$ROOT/web/quiz.json"
    echo "Creato web/quiz.json vuoto"
  fi
fi
echo "web/build.sh completato"
