"""Test di integrità: ID, prerequisiti, DAG, fonti, allowlist, esame."""

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent

ALLOWLIST = {
    "https://web.ing.unimo.it/wiki/index.php/Maurizio_Casoni",
    "https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico",
    "https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo",
    "https://www.dii.unimore.it/~mcasoni/tecnologie/LEZIONI_FONDAMENTI_TLC/",
    "https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)",
    "https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)/10%3A_Sampling_and_Reconstruction/10.02%3A_Sampling_Theorem",
    "https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/video_galleries/video-lectures/",
    "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/video_galleries/lecture-videos/",
    "https://ocw.mit.edu/courses/6-263j-data-communication-networks-fall-2002/pages/syllabus/",
    "https://openstax.org/books/statistics/pages/5-3-the-exponential-distribution-optional",
    "https://www3.diism.unisi.it/~giambene/fondamenti/dispense/dispense_tds.pdf",
}


def test_contratto_caricabile():
    from scripts.contratto import carica_contratto

    data = carica_contratto()
    assert "versione" in data
    assert "nodi" in data
    assert len(data["nodi"]) == 56  # come da CONTRACTS §4


def test_prerequisiti_sono_in_contratto():
    from scripts.contratto import carica_contratto
    from scripts.kg import build_graph

    contratto = carica_contratto()
    ids = {n["id"] for n in contratto["nodi"]}
    graph = build_graph()
    for nodo in graph["nodi"]:
        for p in nodo.get("prerequisiti", []):
            assert p["id"] in ids, f"Prerequisito {p['id']} di {nodo['id']} non in contratto"


def test_nessun_self_loop():
    from scripts.kg import build_graph

    graph = build_graph()
    for nodo in graph["nodi"]:
        for p in nodo.get("prerequisiti", []):
            assert p["id"] != nodo["id"], f"Self-loop in {nodo['id']}"


def test_nessun_ciclo():
    from scripts.kg import build_graph

    # build_graph già solleva su ciclo, quindi se passa non c'è ciclo
    graph = build_graph()
    # verifica aggiuntiva con topo
    from scripts.topo import ordina_topologico

    # deve ordinare senza eccezioni
    try:
        ordina_topologico(graph["nodi"])
    except ValueError as e:
        pytest.fail(f"Ciclo rilevato: {e}")


def test_fonti_chiavi_in_meta():
    meta = json.loads((ROOT / "graph" / "meta.json").read_text(encoding="utf-8"))
    fonti_ok = set(meta["fonti"].keys())
    from scripts.kg import build_graph

    graph = build_graph()
    for nodo in graph["nodi"]:
        for f in nodo.get("fonti", []):
            assert f["chiave"] in fonti_ok, f"Chiave fonte {f['chiave']} non in meta"
        if "dimostrazione" in nodo:
            for f in nodo["dimostrazione"].get("fonti", []):
                assert f["chiave"] in fonti_ok


def test_risorse_allowlist():
    from scripts.kg import build_graph

    graph = build_graph()
    for nodo in graph["nodi"]:
        for r in nodo.get("risorse", []):
            assert r["url"] in ALLOWLIST, f"URL {r['url']} non in allowlist"
            assert r["verificato"] is True


def test_punteggi_solo_T5_T11():
    esame_path = ROOT / "graph" / "esame.json"
    if not esame_path.exists():
        return
    data = json.loads(esame_path.read_text(encoding="utf-8"))
    prove = data.get("prove", data) if isinstance(data, dict) else data
    for p in prove:
        pid = p["id"]
        punti = p["punti"]
        if pid in ("T5", "T11"):
            assert punti == 10, f"{pid} deve valere 10"
        else:
            assert punti == "NON TROVATO", f"{pid} deve essere NON TROVATO, trovato {punti!r}"


def test_esame_titoli_riformulati():
    esame_path = ROOT / "graph" / "esame.json"
    if not esame_path.exists():
        return
    data = json.loads(esame_path.read_text(encoding="utf-8"))
    prove = data.get("prove", data) if isinstance(data, dict) else data
    for p in prove:
        assert len(p["titolo"]) <= 120
        # non deve contenere testi integrali troppo lunghi? almeno non vuoto
        assert len(p["titolo"]) >= 3


def test_area_tipo_worker_coerenti_con_contratto():
    from scripts.contratto import carica_contratto
    from scripts.kg import build_graph

    contratto = carica_contratto()
    cmap = {n["id"]: n for n in contratto["nodi"]}
    graph = build_graph()
    for nodo in graph["nodi"]:
        c = cmap[nodo["id"]]
        assert nodo["area"] == c["area"]
        assert nodo["tipo"] == c["tipo"]
        assert nodo["worker"] == c["worker"]


def test_figure_min_max():
    from scripts.kg import build_graph

    graph = build_graph()
    for nodo in graph["nodi"]:
        if "dimostrazione" in nodo:
            for fig in nodo["dimostrazione"].get("figure", []):
                if fig["tipo"] == "grafico":
                    assert fig["asse_x"]["min"] < fig["asse_x"]["max"]
                    assert fig["asse_y"]["min"] < fig["asse_y"]["max"]
                    assert 1 <= len(fig["serie"][0]["punti"]) <= 800
                elif fig["tipo"] == "temporale":
                    assert fig["asse_t"]["min"] < fig["asse_t"]["max"]
                    for interv in fig.get("intervalli", []):
                        assert interv["t0"] < interv["t1"]


def test_nessun_pdf_versionato():
    pdfs = list(ROOT.rglob("*.pdf"))
    # ignora eventuali fuori root? Conta solo dentro repo
    # devono essere zero
    assert len(pdfs) == 0, f"PDF versionati trovati: {pdfs}"


def test_no_null_undefined_in_graph():
    from scripts.kg import build_graph

    graph = build_graph()

    def collect_strings(obj):
        if isinstance(obj, str):
            yield obj
        elif isinstance(obj, dict):
            for v in obj.values():
                yield from collect_strings(v)
        elif isinstance(obj, list):
            for item in obj:
                yield from collect_strings(item)

    for s in collect_strings(graph):
        for parola in ["null", "undefined", "NaN"]:
            pattern = re.compile(rf"\b{parola}\b")
            assert not pattern.search(s), f"Trovato '{parola}' isolato in stringa: {s[:80]!r}"
