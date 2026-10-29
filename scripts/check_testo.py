#!/usr/bin/env python3
"""Controlli di testo: accenti con apostrofo, parole isolate null/undefined/NaN, $ sbilanciati."""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Pattern per accenti scritti con apostrofo (vietati)
APOSTROFO_PATTERN = re.compile(
    r"\b(e'|perche'|perché'|piu'|pù|puo'|gia'|cosi'|ne'|cioe'|citta'|virtu'|sara'|è'|"
    r"perche'|piu'|puo'|gia')"
    r"|e'\b|perche'\b|piu'\b|puo'\b|gia'\b|cosi'\b|ne'\b",
    re.IGNORECASE,
)
# Più preciso: cerca parole con apostrofo al posto dell'accento
VIETATI_APOSTROFO = [
    (re.compile(r"\be'"), "e' al posto di è"),
    (re.compile(r"\bperche'", re.IGNORECASE), "perche' al posto di perché"),
    (re.compile(r"\bperchè\b", re.IGNORECASE), "perchè con accento grave errato"),
    (re.compile(r"\bpiu'", re.IGNORECASE), "piu' al posto di più"),
    (re.compile(r"\bpuo'", re.IGNORECASE), "puo' al posto di può"),
    (re.compile(r"\bgia'", re.IGNORECASE), "gia' al posto di già"),
    (re.compile(r"\bcosi'", re.IGNORECASE), "cosi' al posto di così"),
    (re.compile(r"\bcoli'", re.IGNORECASE), "coli'"),
    (re.compile(r"\bne'", re.IGNORECASE), "ne'"),
]

# Parole isolate vietate (ma 'nulli' ammesso)
VIETATE_PAROLE = re.compile(r"\b(null|undefined|NaN)\b")

# Controllo $ sbilanciati: conta $ non escaped, ignora $$?
# Specifica: stringhe LaTeX con $ sbilanciati (in docs e json, ogni $ aperto deve avere chiusura)
# Contiamo i $ singoli non escaped; se dispari -> sbilanciato
# Ma $$ è display: contiene due $ consecutivi; li contiamo come bilanciati se coppia


def _dollari_sbilanciati(testo: str) -> bool:
    # Rimuovi \$ escaped
    t = testo.replace(r"\$", "")
    # Conta occorrenze di $ non escaped
    # Sbilanciato se numero di $ è dispari
    # Tuttavia $$ conta come 2, quindi già coperto
    # Ma per essere più preciso, consideriamo che \$ è già rimosso
    count = t.count("$")
    return count % 2 == 1


def _cerca_accenti_apostrofo(testo: str) -> list:
    trovati = []
    for pat, descr in VIETATI_APOSTROFO:
        for m in pat.finditer(testo):
            trovati.append((descr, m.group(0), m.start()))
    return trovati


def _cerca_parole_vietate(testo: str) -> list:
    # Esclude 'nulli' ammesso: il pattern \bnull\b non matcha 'nulli'
    # Quindi già corretto
    return VIETATE_PAROLE.findall(testo)


def _raccogli_testo_da_json(path: Path) -> list:
    """Raccoglie tutte le stringhe da un file JSON."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []
    strings = []

    def walk(obj, prefix=""):
        if isinstance(obj, str):
            strings.append((prefix, obj))
        elif isinstance(obj, dict):
            for k, v in obj.items():
                walk(v, f"{prefix}.{k}" if prefix else k)
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                walk(v, f"{prefix}[{i}]")

    walk(data)
    return strings


def _is_schema_file(path: Path) -> bool:
    return "schema" in path.parts

def main():
    parser = argparse.ArgumentParser(description="Controlli di testo")
    parser.add_argument("paths", nargs="*", help="File o directory da controllare (default: graph)")
    args = parser.parse_args()

    if args.paths:
        targets = [Path(p) for p in args.paths]
    else:
        # Di default controlla solo i contenuti del grafo (file di nodo/lezione/dimostrazione)
        # per evitare falsi positivi su CONTRACTS, README e schemi (regex con $)
        targets = [ROOT / "graph"]

    files = []
    for t in targets:
        if t.is_file():
            files.append(t)
        elif t.is_dir():
            files.extend(t.rglob("*.json"))
            files.extend(t.rglob("*.md"))
        elif t.exists() is False:
            pass

    # Filtra solo json e md, escludi schemi e file generati di build
    files = [f for f in files if f.suffix in (".json", ".md") and f.exists() and not _is_schema_file(f)]

    errori = []

    for f in sorted(files):
        # salta file generati (graph.json) se contiene null JSON letterale — già gestito sotto
        # Ma graph.json va comunque verificato sulle stringhe
        if f.suffix == ".json":
            # Per JSON: verifica solo le stringhe, non il testo grezzo (evita di flagga 'null' letterale e regex $)
            for prefix, s in _raccogli_testo_da_json(f):
                # 1. accenti con apostrofo
                for descr, match, pos in _cerca_accenti_apostrofo(s):
                    ctx = s[max(0, pos - 20) : pos + 20].replace("\n", " ")
                    errori.append(f"{f} [{prefix}]: accento con apostrofo '{match}' ({descr}) contesto: ...{ctx}...")
                # 2. parole isolate vietate
                for w in _cerca_parole_vietate(s):
                    idx = s.find(w)
                    ctx = s[max(0, idx - 20) : idx + 20].replace("\n", " ")
                    errori.append(f"{f} [{prefix}]: parola isolata vietata '{w}' contesto: ...{ctx}...")
                # 3. $ sbilanciati
                if "$" in s and _dollari_sbilanciati(s):
                    errori.append(f"{f} [{prefix}]: $ sbilanciati in: {s[:80]!r}...")
        else:
            try:
                testo = f.read_text(encoding="utf-8")
            except Exception as e:
                errori.append(f"{f}: impossibile leggere ({e})")
                continue
            # Per MD: verifica riga per riga, ignorando blocchi di codice con backtick
            for i, line in enumerate(testo.splitlines(), 1):
                # ignora righe che sono esempi di codice con backtick che menzionano null/undefined volutamente?
                # Ma per semplicità controlliamo comunque, ma togliendo i segmenti tra backtick
                line_senza_code = re.sub(r"`[^`]*`", "", line)
                for descr, match, pos in _cerca_accenti_apostrofo(line_senza_code):
                    ctx = line[max(0, pos - 20) : pos + 40].replace("\n", " ")
                    errori.append(f"{f}:{i}: accento con apostrofo '{match}' ({descr}) contesto: ...{ctx}...")
                for w in _cerca_parole_vietate(line_senza_code):
                    idx = line_senza_code.find(w)
                    ctx = line_senza_code[max(0, idx - 20) : idx + 20].replace("\n", " ")
                    errori.append(f"{f}:{i}: parola isolata vietata '{w}' contesto: ...{ctx}...")
                if "$" in line_senza_code and _dollari_sbilanciati(line_senza_code):
                    errori.append(f"{f}:{i}: $ sbilanciati: {line[:120]!r}")

    if errori:
        for e in errori:
            print(f"FAIL {e}", file=sys.stderr)
        print(f"\n{len(errori)} errori di testo", file=sys.stderr)
        sys.exit(1)
    print(f"OK — {len(files)} file verificati, nessun errore di testo")


if __name__ == "__main__":
    main()
