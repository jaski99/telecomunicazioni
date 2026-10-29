"""Test di graph/meta.json e costruzione del grafo."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / "graph" / "meta.json"
GRAPH_JSON = ROOT / "graph" / "graph.json"


def test_meta_esiste():
    assert META.exists(), "graph/meta.json mancante"


def test_meta_struttura():
    data = json.loads(META.read_text(encoding="utf-8"))
    assert "corso" in data
    assert "Fondamenti di Telecomunicazioni" in data["corso"]
    assert "aree" in data
    assert len(data["aree"]) == 7
    ids = [a["id"] for a in data["aree"]]
    assert ids == list(range(1, 8))
    # verifica titoli aree
    assert data["aree"][0]["titolo"].startswith("Segnali")


def test_meta_fonti_complete():
    data = json.loads(META.read_text(encoding="utf-8"))
    fonti = data.get("fonti", {})
    attese = {"LIBRO_CI", "LUCIDI_CASONI", "PROGRAMMA", "ESSE3_2016", "FILE1", "FILE2", "FILE3", "RICOSTRUZIONE"}
    assert set(fonti.keys()) == attese, f"fonti mancanti: {attese - set(fonti.keys())}"
    for k, v in fonti.items():
        assert "descrizione" in v
        assert "pubblico" in v
        assert "nota" in v
        assert isinstance(v["pubblico"], bool)
    # edizione NON TROVATO
    assert "NON TROVATO" in fonti["LIBRO_CI"]["nota"]
    # URL allowlist
    assert fonti["LIBRO_CI"]["url"] == "https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo"
    assert fonti["LUCIDI_CASONI"]["url"] == "https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico"
    assert fonti["FILE1"]["url"] is None


def test_meta_avvertenze_non_trovato():
    data = json.loads(META.read_text(encoding="utf-8"))
    testo = json.dumps(data, ensure_ascii=False)
    assert "NON TROVATO" in testo


def test_graph_build():
    # verifica che kg build produca graph.json valido
    from scripts.kg import build_graph

    graph = build_graph()
    assert "versione" in graph
    assert "meta" in graph
    assert "aree" in graph
    assert "nodi" in graph
    assert "esame" in graph
    assert "pendenti" in graph
    assert isinstance(graph["nodi"], list)
    assert isinstance(graph["pendenti"], list)
    # nodi ordinati per (area, id)
    nodi = graph["nodi"]
    ordinati = sorted(nodi, key=lambda n: (n["area"], n["id"]))
    assert nodi == ordinati, "nodi devono essere ordinati per (area, id)"


def test_graph_pendenti_coerenti():
    from scripts.contratto import carica_contratto
    from scripts.kg import build_graph

    contratto = carica_contratto()
    graph = build_graph()
    # pendenti devono essere subset di contratto non presenti
    contratto_ids = {n["id"] for n in contratto["nodi"]}
    presenti = {n["id"] for n in graph["nodi"]}
    for p in graph["pendenti"]:
        assert p in contratto_ids
        assert p not in presenti


def test_graph_contiene_meta_corretta():
    from scripts.kg import build_graph

    graph = build_graph()
    assert graph["meta"]["corso"] == json.loads(META.read_text(encoding="utf-8"))["corso"]
