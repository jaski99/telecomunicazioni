"""Caricamento del contratto nodi da CONTRACTS.md — unica funzione pubblica carica_contratto."""

import json
import re
from pathlib import Path


def carica_contratto(path: str = "docs/CONTRACTS.md") -> dict:
    """
    Estrae il blocco JSON tra i marcatori di CONTRACTS.md §4.

    Algoritmo vincolante (CONTRATTI §3.6): primo blocco ```json dopo
    <!-- contratto-nodi:inizio -->.

    Args:
        path: percorso al file CONTRACTS.md

    Returns:
        dict con chiavi 'versione' e 'nodi'

    Raises:
        FileNotFoundError: se il file non esiste
        ValueError: se i marcatori o il blocco JSON non sono trovati o non sono validi
    """
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File non trovato: {path}")
    testo = p.read_text(encoding="utf-8")

    inizio = "<!-- contratto-nodi:inizio -->"
    fine = "<!-- contratto-nodi:fine -->"

    idx_inizio = testo.find(inizio)
    if idx_inizio == -1:
        raise ValueError(f"Marcatore non trovato: {inizio}")

    idx_fine = testo.find(fine, idx_inizio)
    if idx_fine == -1:
        raise ValueError(f"Marcatore non trovato: {fine}")

    blocco = testo[idx_inizio:idx_fine]

    # primo blocco ```json dopo il marcatore di inizio
    pattern = re.compile(r"```json\s*\n(.*?)\n```", re.DOTALL)
    m = pattern.search(blocco)
    if not m:
        raise ValueError("Blocco ```json non trovato tra i marcatori del contratto")

    json_str = m.group(1).strip()
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON del contratto non valido: {exc}") from exc

    if "versione" not in data or "nodi" not in data:
        raise ValueError("Il contratto deve contenere 'versione' e 'nodi'")

    return data
