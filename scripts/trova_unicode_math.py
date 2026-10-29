#!/usr/bin/env python3
"""Trova notazione matematica non-LaTeX nei campi testuali del grafo.

Le stringhe Markdown possono contenere matematica solo tra ``$...$`` o
``$$...$$``. I campi LaTeX puro e le etichette SVG sono eccezioni previste
dal contratto e vengono ignorati.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent

# Segni matematici Unicode che devono essere scritti con i comandi LaTeX
# equivalenti quando compaiono nella prosa, fuori dai delimitatori.
SIMBOLI_MATEMATICI = frozenset(
    "∫∬∭∑∏√∞≈≃≅≠≤≥±∓∝∂∇∈∉∋⊂⊆⊃⊇∪∩×·⋅−∼∅∠∥∦⊥⊕⊗≡≢≜"
    "→←↔⇒⇔↦↗↘"
)

# Le frazioni ASCII sono notazione matematica anche quando non hanno un
# carattere Unicode (ad esempio ``1/(2π)``). Si segnala il caso se i due
# membri hanno forma numerica o algebrica, evitando unità come ``rad/s``.
ATOMO_FRAZIONE = r"(?:\([^()]*\)|\|[^|]*\||[A-Za-z0-9]+(?:_[A-Za-z0-9]+)?(?:\^[A-Za-z0-9]+)?)"
FRAZIONE_RE = re.compile(
    rf"(?<![\w/])(?P<num>{ATOMO_FRAZIONE})\s*/\s*(?P<den>{ATOMO_FRAZIONE})(?![\w/])"
)
UNDERSCORE_MATEMATICO_RE = re.compile(
    r"(?<![A-Za-z0-9\\])[A-Za-z]_(?:[A-Za-z0-9]+|\{[^{}]+\})(?![A-Za-z0-9])|(?<![A-Za-z0-9\\])[A-Za-z]{2,}_(?:[A-Za-z0-9]|\{(?:[A-Za-z0-9]|max|min)\}|max|min)(?![A-Za-z0-9])"
)

# Campi non testuali o già LaTeX puro per contratto.
CAMPI_ESCLUSI = frozenset({"url", "id", "chiave", "stato"})
# Le soluzioni accettate sono input raw confrontati per uguaglianza, non testo renderizzato.
CAMPI_RISPOSTE = frozenset({"soluzioni"})


@dataclass(frozen=True)
class Occorrenza:
    """Una stringa testuale da convertire, con percorso JSON leggibile."""

    file: str
    campo: str
    testo: str
    motivo: str


def _segmenti_fuori_dai_dollari(testo: str) -> Iterable[tuple[int, int, str]]:
    """Restituisce intervalli non delimitati da $ o $$, preservandone gli offset."""
    i = 0
    inizio = 0
    delimitatore: str | None = None
    while i < len(testo):
        if testo[i] != "$" or (i > 0 and testo[i - 1] == "\\"):
            i += 1
            continue

        token = "$$" if testo.startswith("$$", i) else "$"
        if delimitatore is None:
            if inizio < i:
                yield inizio, i, testo[inizio:i]
            delimitatore = token
            i += len(token)
            inizio = i
        elif token == delimitatore:
            delimitatore = None
            i += len(token)
            inizio = i
        else:
            # Un singolo $ non chiude un blocco $$ e viceversa.
            i += len(token)

    # Se manca la chiusura, non trattare il resto della stringa come LaTeX.
    if inizio < len(testo):
        yield inizio, len(testo), testo[inizio:]


def _e_greca(c: str) -> bool:
    nome = unicodedata.name(c, "")
    return "GREEK" in nome and "LETTER" in nome


def _e_pedice_o_apice(c: str) -> bool:
    nome = unicodedata.name(c, "")
    return "SUBSCRIPT" in nome or "SUPERSCRIPT" in nome or c in "ᵝᵞᵟᵠᵡ"


def _frazione_matematica(match: re.Match[str], testo: str = "") -> bool:
    numeratore = match.group("num")
    denominatore = match.group("den")
    intera = numeratore + denominatore

    # Nelle note, "CROP 7/8" indica due ritagli, non un quoziente.
    if numeratore == "7" and denominatore == "8" and re.search(
        r"\bCROP\s*$", testo[: match.start()], re.IGNORECASE
    ):
        return False

    if any(_e_greca(c) or _e_pedice_o_apice(c) or c in SIMBOLI_MATEMATICI for c in intera):
        return True
    if "_" in intera or "^" in intera:
        return True
    # Una frazione con numeri, operatori o variabili singole è algebrica.
    # Sigle come A/D e unità come bit/s o rad/s restano testo.
    if re.fullmatch(r"\d+(?:[.,]\d+)?", numeratore) or re.fullmatch(
        r"\d+(?:[.,]\d+)?", denominatore
    ):
        return True
    if any(op in intera for op in "=+−-×·"):
        return True
    if re.fullmatch(r"[A-Za-z]", numeratore) and re.fullmatch(r"[A-Za-z]", denominatore):
        return not (numeratore.isupper() and denominatore.isupper())
    if re.fullmatch(r"\d+[A-Za-z]", numeratore) and re.fullmatch(r"[A-Za-z]", denominatore):
        return True
    numeratore_gruppo = numeratore.startswith("(") and numeratore.endswith(")")
    denominatore_gruppo = denominatore.startswith("(") and denominatore.endswith(")")
    return numeratore_gruppo and denominatore_gruppo


def _motivi(segmento: str) -> list[str]:
    # I segnaposto di completamento ___, ___1___ ecc. non sono pedici.
    testo = re.sub(r"_{3,}\d*_{3,}|_{3,}", " ", segmento)
    motivi: list[str] = []

    if any(_e_greca(c) for c in testo):
        motivi.append("lettera greca")
    if any(_e_pedice_o_apice(c) for c in testo):
        motivi.append("pedice o apice Unicode")
    if any(c in SIMBOLI_MATEMATICI for c in testo):
        motivi.append("simbolo matematico Unicode")
    if UNDERSCORE_MATEMATICO_RE.search(testo):
        motivi.append("underscore grezzo")
    if any(_frazione_matematica(m, testo) for m in FRAZIONE_RE.finditer(testo)):
        motivi.append("frazione con barra")

    return motivi


def _campo_escluso(percorso: tuple[str, ...]) -> bool:
    if not percorso:
        return False
    ultimo = percorso[-1]
    if ultimo in CAMPI_ESCLUSI or CAMPI_RISPOSTE.intersection(percorso):
        return True

    # Questi campi contengono LaTeX puro, senza delimitatori, per contratto.
    if ultimo == "formula_finale":
        return True
    if ultimo == "formula":
        return True
    if ultimo == "simbolo" and "notazione" in percorso:
        return True
    # Le etichette incorporate negli SVG restano Unicode. Le descrizioni
    # accessibili, invece, sono testo e vengono controllate normalmente.
    dentro_figura = "figure" in percorso
    if dentro_figura and ultimo == "etichetta":
        return True
    if dentro_figura and ultimo == "testo" and "annotazioni" in percorso:
        return True

    return False


def _campo(percorso: tuple[str, ...]) -> str:
    risultato = ""
    for parte in percorso:
        if parte.startswith("["):
            risultato += parte
        elif risultato:
            risultato += "." + parte
        else:
            risultato = parte
    return risultato or "$"


def _cammina(
    oggetto: object,
    percorso: tuple[str, ...],
    nome_file: str,
    trovati: list[Occorrenza],
) -> None:
    if isinstance(oggetto, dict):
        for chiave, valore in oggetto.items():
            _cammina(valore, (*percorso, str(chiave)), nome_file, trovati)
        return
    if isinstance(oggetto, list):
        for indice, valore in enumerate(oggetto):
            _cammina(valore, (*percorso, f"[{indice}]"), nome_file, trovati)
        return
    if not isinstance(oggetto, str) or _campo_escluso(percorso):
        return

    motivi: list[str] = []
    for _, _, segmento in _segmenti_fuori_dai_dollari(oggetto):
        for motivo in _motivi(segmento):
            if motivo not in motivi:
                motivi.append(motivo)
    if motivi:
        trovati.append(
            Occorrenza(
                file=nome_file,
                campo=_campo(percorso),
                testo=oggetto,
                motivo=", ".join(motivi),
            )
        )


def file_contenuti(root: Path = ROOT) -> list[Path]:
    """File sorgente contrattuali, senza duplicati generati dal grafo/web."""
    file: list[Path] = []
    for directory in ("graph/lezioni", "graph/dimostrazioni", "graph/parts"):
        file.extend((root / directory).glob("*.json"))
    file.extend((root / "graph" / name) for name in ("esame.json", "quiz.json"))
    return sorted(file)


def trova_occorrenze(root: Path = ROOT) -> list[Occorrenza]:
    """Cerca pseudo-matematica nei soli campi Markdown testuali del grafo."""
    trovati: list[Occorrenza] = []
    for path in file_contenuti(root):
        try:
            contenuto = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ValueError(f"Impossibile leggere JSON {path}: {exc}") from exc
        _cammina(contenuto, (), path.relative_to(root).as_posix(), trovati)
    return trovati


def main() -> int:
    try:
        trovati = trova_occorrenze()
    except ValueError as exc:
        print(f"ERRORE {exc}", file=sys.stderr)
        return 2

    if trovati:
        for occorrenza in trovati:
            print(
                f"{occorrenza.file} [{occorrenza.campo}] "
                f"({occorrenza.motivo})\n  {occorrenza.testo}"
            )
        print(f"\nTrovate {len(trovati)} stringhe da convertire.", file=sys.stderr)
        return 1

    print(f"OK — {len(file_contenuti())} file, nessuna pseudo-matematica Unicode nei campi testuali.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
