"""Contratto D5: la matematica nei campi testuali usa delimitatori LaTeX."""

import json
from pathlib import Path

from scripts.trova_unicode_math import Occorrenza, trova_occorrenze

ROOT = Path(__file__).resolve().parent.parent


def _prepara_grafo(root: Path, contenuto: dict) -> None:
    lezione = root / "graph" / "lezioni"
    lezione.mkdir(parents=True)
    (root / "graph" / "dimostrazioni").mkdir(parents=True)
    (root / "graph" / "parts").mkdir(parents=True)
    (lezione / "notazione.json").write_text(
        json.dumps(contenuto, ensure_ascii=False), encoding="utf-8"
    )
    (root / "graph" / "esame.json").write_text("{}", encoding="utf-8")
    (root / "graph" / "quiz.json").write_text("{}", encoding="utf-8")


def test_nessuna_pseudo_matematica_unicode_nei_campi_testuali():
    occorrenze = trova_occorrenze(ROOT)
    dettagli = "\n".join(
        f"{occorrenza.file} [{occorrenza.campo}] "
        f"({occorrenza.motivo})\n  {occorrenza.testo}"
        for occorrenza in occorrenze
    )
    assert occorrenze == [], "Convertire la notazione matematica fuori da $...$:\n" + dettagli


def test_finder_copre_notazione_greca_indici_operatori_frazioni_e_underscore(tmp_path):
    testo = (
        "ω₀ + xₙ² + ∫₀^τ f(t)dt + ∑ₖ x_k + 1/(2π) + x_0; "
        "unità rad/s; formula già delimitata $ω₁$."
    )
    _prepara_grafo(
        tmp_path,
        {
            "id": "fixture_ω",
            "url": "https://example.invalid/ω₀",
            "chiave": "ω₀",
            "stato": "ω₀",
            "testo": testo,
            "formula": "ω₀",
            "formula_finale": "∑ₖ",
            "notazione": [{"simbolo": "ω_s", "significato": "Pulsazione"}],
            "figure": [
                {
                    "asse_x": {"etichetta": "ω₀ → ω₁"},
                    "descrizione": "Grafico di una funzione, senza notazione.",
                }
            ],
            "a_buchi": {
                "testo": "Il valore è ___1___ per la pulsazione.",
                "soluzioni": {"1": ["ω₀", "∑ₖ"]},
            },
        },
    )

    occorrenze = trova_occorrenze(tmp_path)
    assert occorrenze == [
        Occorrenza(
            file="graph/lezioni/notazione.json",
            campo="testo",
            testo=testo,
            motivo=(
                "lettera greca, pedice o apice Unicode, simbolo matematico Unicode, "
                "underscore grezzo, frazione con barra"
            ),
        )
    ]


def test_notazione_dentro_dollari_non_e_segnalata_e_figure_esclusa(tmp_path):
    _prepara_grafo(
        tmp_path,
        {
            "testo": r"La formula è $\omega_0 = \sum_k x_k$.",
            "descrizione": "Il rapporto di trasmissione è rad/s.",
            "figure": [
                {
                    "asse_x": {"etichetta": "ω₀ → ω₁"},
                    "titolo": "$y^(2)$",
                    "descrizione": "La figura contiene $x_(n)$ senza delimitatori da correggere.",
                }
            ],
        },
    )
    assert trova_occorrenze(tmp_path) == []


def test_finder_segnala_apici_e_pedici_con_parentesi_dentro_i_dollari(tmp_path):
    testo = r"La formula errata è $e^(-j\omega t_{c})$ e anche $x_(n)$"
    _prepara_grafo(tmp_path, {"testo": testo})

    assert trova_occorrenze(tmp_path) == [
        Occorrenza(
            file="graph/lezioni/notazione.json",
            campo="testo",
            testo=testo,
            motivo="apice o pedice con parentesi tonde nel LaTeX",
        )
    ]
