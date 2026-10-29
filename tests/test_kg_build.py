import json
import shutil
from pathlib import Path

import pytest

from scripts.contratto import carica_contratto


def _setup_base(tmp_path: Path):
    src_meta = Path("graph/meta.json")
    graph_dir = tmp_path / "graph"
    graph_dir.mkdir()
    shutil.copy(src_meta, graph_dir / "meta.json")
    (graph_dir / "parts").mkdir()
    (graph_dir / "lezioni").mkdir()
    (graph_dir / "dimostrazioni").mkdir()
    return graph_dir


def _nodo_base(id_: str, area: int, tipo: str, worker: str, prereq=None, risorse=None):
    if prereq is None:
        prereq = []
    if risorse is None:
        risorse = []
    contratto = carica_contratto()
    cmap = {n["id"]: n for n in contratto["nodi"]}
    c = cmap[id_]
    # usa valori di contratto per area/tipo/worker se non specificato diverso per test
    return {
        "id": id_,
        "titolo": f"Titolo {id_}",
        "area": area,
        "tipo": tipo,
        "gruppo": c["gruppo"],
        "worker": worker,
        "sapere": "Sapere di almeno quaranta caratteri per soddisfare il vincolo dello schema del nodo.",
        "saper_fare": ["so fare qualcosa di osservabile"],
        "prerequisiti": prereq,
        "tempo_studio_min": 30,
        "priorita": {"livello": "media", "motivazione": "test"},
        "fonti": [{"chiave": "LIBRO_CI", "rif": "p. 1.1"}],
        "risorse": risorse,
    }


def _scrivi_parts(tmp_path: Path, nodi: list):
    graph_dir = tmp_path / "graph"
    parts = graph_dir / "parts"
    # raggruppa per area
    per_area = {}
    for n in nodi:
        per_area.setdefault(n["area"], []).append(n)
    for area, lst in per_area.items():
        (parts / f"area-{area}.json").write_text(json.dumps(lst, ensure_ascii=False, indent=2), encoding="utf-8")


def test_build_valido_con_pendenti_e_domande(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    # due nodi validi: segnali-deterministici e serie-fourier con soft extra per creare pendente
    n1 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n2 = _nodo_base(
        "serie-fourier",
        1,
        "concetto",
        "W3",
        [
            {"id": "segnali-deterministici", "forza": "hard", "motivo": "base"},
            {"id": "processo-poisson", "forza": "soft", "motivo": "extra per pendente"},
        ],
    )
    _scrivi_parts(base, [n1, n2])
    # aggiungi esame.json minimo per domande_esame
    esame = {
        "versione": 1,
        "avvertenza": "test",
        "prove": [
            {"id": "T1", "tipo": "teoria", "titolo": "Domanda T1", "punti": "NON TROVATO", "nodi": ["serie-fourier"], "fonte": "FILE2"}
        ],
    }
    (base / "graph" / "esame.json").write_text(json.dumps(esame, ensure_ascii=False, indent=2), encoding="utf-8")
    g = build_graph(base=base)
    assert len(g["nodi"]) == 2
    assert "processo-poisson" in g["pendenti"]
    # domande_esame deve essere popolato da esame.json
    nodo_serie = next(n for n in g["nodi"] if n["id"] == "serie-fourier")
    assert "T1" in nodo_serie["domande_esame"]


def test_id_duplicato(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n1 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n2 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    _scrivi_parts(base, [n1, n2])
    with pytest.raises(ValueError, match="ID duplicato"):
        build_graph(base=base)


def test_nodo_fuori_contratto(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n["id"] = "id-inventato-fuori-contratto"
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="non è nella lista"):
        build_graph(base=base)


def test_area_tipo_worker_diversi(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 2, "concetto", "W3", [])
    # area 2 diversa da contratto (1) -> errore
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="campo 'area'"):
        build_graph(base=base)


def test_tipo_worker_diversi(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 1, "dimostrazione", "W3", [])
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="campo 'tipo'"):
        build_graph(base=base)


def test_prerequisito_fuori_contratto(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [{"id": "inesistente", "forza": "hard", "motivo": "x"}])
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="non è in CONTRACTS"):
        build_graph(base=base)


def test_hard_mancante(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    # serie-fourier richiede hard segnali-deterministici, lo omettiamo
    n = _nodo_base("serie-fourier", 1, "concetto", "W3", [])
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="mancano prerequisiti hard"):
        build_graph(base=base)


def test_ciclo_via_pendente(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    # Creiamo due nodi che formano ciclo via pendente:
    # segnali-deterministici normalmente non ha prereq, ma lo facciamo dipendere da serie-fourier (hard)
    # serie-fourier dipende da segnali-deterministici -> ciclo
    # Però serie-fourier ha hard segnali-deterministici, quindi se aggiungiamo a segnali un prereq verso serie, ciclo hard+soft
    n1 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [{"id": "serie-fourier", "forza": "soft", "motivo": "ciclo"}])
    n2 = _nodo_base("serie-fourier", 1, "concetto", "W3", [{"id": "segnali-deterministici", "forza": "hard", "motivo": "ciclo"}])
    _scrivi_parts(base, [n1, n2])
    with pytest.raises(ValueError, match="Ciclo"):
        build_graph(base=base)


def test_dimostrazione_mancante(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("dim-impulso-dirac-trasformata", 1, "dimostrazione", "W3", [{"id": "trasformata-fourier", "forza": "hard", "motivo": "x"}])
    # serve anche il prereq trasformata-fourier e i suoi prereq, altrimenti manca hard -> aggiungiamo catena
    n0 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n01 = _nodo_base("serie-fourier", 1, "concetto", "W3", [{"id": "segnali-deterministici", "forza": "hard", "motivo": "x"}])
    n02 = _nodo_base("trasformata-fourier", 1, "concetto", "W3", [{"id": "serie-fourier", "forza": "hard", "motivo": "x"}])
    _scrivi_parts(base, [n0, n01, n02, n])
    with pytest.raises(ValueError, match="senza file"):
        build_graph(base=base)


def test_lezione_senza_nodo(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    _scrivi_parts(base, [n])
    lez = {
        "id": "serie-fourier",
        "perche_ti_serve": "Serve per T2 e per tutti i blocchi successivi: senza la distinzione non puoi capire spettri e campionamento all'esame con priorità alta.",
        "scenario": "Devi trasmettere la voce di una telefonata su un collegamento numerico: prima di campionare devi capire se il segnale ha energia finita o potenza finita, altrimenti sbagli la rappresentazione completa del sistema.",
        "definizione_esame": {"definizione": "def", "scopo": "scopo", "esempio": "esempio $x$"},
        "spiegazione": "### A\n" + "a"*600 + " $x$ \n### B\n" + "b"*600 + " $y$",
        "analogia": {"testo": "testo", "limite": "limite"},
        "worked_example": {"titolo": "t", "problema": "p", "passi": ["a", "b", "c"], "soluzione": "s", "perche_funziona": "p"},
        "completion_problem": {"titolo": "t", "testo": "t", "passi_mancanti": ["a"], "soluzione": "s"},
        "esercizio_autonomo": {"titolo": "t", "testo": "t", "suggerimento": "s", "soluzione_attesa": "s"},
        "errori_trappole": [{"errore": "e", "perche_sbagliato": "p"}, {"errore": "e2", "perche_sbagliato": "p2"}],
        "richiamo_attivo": {"domande": [{"domanda": "d", "risposta": "r"}, {"domanda": "d2", "risposta": "r2"}, {"domanda": "d3", "risposta": "r3"}], "spiega_con_parole_tue": "s"},
        "riepilogo": "riepilogo con almeno quaranta caratteri per soddisfare il vincolo dello schema",
        "flashcard": [{"fronte": "f", "retro": "r"}],
        "checklist": {"so_fare": ["a"], "so_dire": ["b"]},
    }
    (base / "graph" / "lezioni" / "serie-fourier.json").write_text(json.dumps(lez, ensure_ascii=False, indent=2), encoding="utf-8")
    with pytest.raises(ValueError, match="senza nodo"):
        build_graph(base=base)


def test_chiave_fonte_ignota(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n["fonti"] = [{"chiave": "FAKE", "rif": "p.1"}]
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="fonte"):
        build_graph(base=base)


def test_url_fuori_allowlist(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [], [{"titolo": "x", "url": "https://evil.com", "verificato": True}])
    _scrivi_parts(base, [n])
    with pytest.raises(ValueError, match="allowlist"):
        build_graph(base=base)


def test_passi_non_consecutivi(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    for nid in ["segnali-deterministici", "serie-fourier", "trasformata-fourier"]:
        area = 1
        c = [n for n in carica_contratto()["nodi"] if n["id"] == nid][0]
        n = _nodo_base(nid, c["area"], c["tipo"], c["worker"], [{"id": p, "forza": "hard", "motivo": "x"} for p in c["prerequisiti_hard"]])
        _scrivi_parts(base, [n])
    # usa helper per scrivere parti multiple
    # invece ricrea
    base2 = tmp_path
    # pulisci e riscrivi tutto con catena corretta + dimostrazione errata
    import shutil, json as js

    shutil.rmtree(base2 / "graph" / "parts")
    (base2 / "graph" / "parts").mkdir()
    n0 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n1 = _nodo_base("serie-fourier", 1, "concetto", "W3", [{"id": "segnali-deterministici", "forza": "hard", "motivo": "x"}])
    n2 = _nodo_base("trasformata-fourier", 1, "concetto", "W3", [{"id": "serie-fourier", "forza": "hard", "motivo": "x"}])
    n3 = _nodo_base("dim-impulso-dirac-trasformata", 1, "dimostrazione", "W3", [{"id": "trasformata-fourier", "forza": "hard", "motivo": "x"}])
    _scrivi_parts(base2, [n0, n1, n2, n3])
    dim = {
        "id": "dim-impulso-dirac-trasformata",
        "titolo": "Titolo dimostrazione valida per test",
        "domande_esame": ["T2"],
        "enunciato": "Enunciato lungo almeno quaranta caratteri per soddisfare il vincolo dello schema della dimostrazione.",
        "ipotesi": ["ipotesi 1"],
        "notazione": [{"simbolo": "a", "significato": "b"}, {"simbolo": "c", "significato": "d"}],
        "idea": "Idea di venti caratteri minimo qui",
        "passi": [
            {"n": 1, "testo": "t1", "perche": "perche abbastanza lungo per vincolo"},
            {"n": 3, "testo": "t3", "perche": "perche abbastanza lungo per vincolo"},
            {"n": 4, "testo": "t4", "perche": "perche abbastanza lungo per vincolo"},
            {"n": 5, "testo": "t5", "perche": "perche abbastanza lungo per vincolo"},
        ],
        "formula_finale": "x",
        "figure": [
            {
                "id": "fig1",
                "tipo": "grafico",
                "titolo": "Titolo figura grafico",
                "descrizione": "Descrizione lunga almeno trenta caratteri per figura grafico di test",
                "asse_x": {"etichetta": "x", "min": 0, "max": 1},
                "asse_y": {"etichetta": "y", "min": 0, "max": 1},
                "serie": [{"stile": "linea", "punti": [[0, 0], [1, 1]]}],
            }
        ],
        "a_voce": "a" * 500,
        "errori_frequenti": [
            {"errore": "e", "perche_sbagliato": "p", "correzione": "c"},
            {"errore": "e2", "perche_sbagliato": "p2", "correzione": "c2"},
        ],
        "versione_compatta": ["a", "b", "c"],
        "a_buchi": {"testo": "___1___ ___2___ ___3___", "soluzioni": {"1": ["a"], "2": ["b"], "3": ["c"]}},
        "richiamo_attivo": [{"domanda": "d", "risposta": "r"}, {"domanda": "d2", "risposta": "r2"}, {"domanda": "d3", "risposta": "r3"}],
        "fonti": [{"chiave": "LIBRO_CI", "rif": "p.1"}],
        "verifica": {"stato": "da_verificare", "data": "2026-10-29", "note": "n", "punti_aperti": ["a"]},
    }
    (base2 / "graph" / "dimostrazioni" / "dim-impulso-dirac-trasformata.json").write_text(json.dumps(dim, ensure_ascii=False, indent=2), encoding="utf-8")
    with pytest.raises(ValueError, match="consecutivi"):
        build_graph(base=base2)


def test_chiavi_a_buchi_diverse(tmp_path):
    from scripts.kg import build_graph

    base = tmp_path
    _setup_base(base)
    n0 = _nodo_base("segnali-deterministici", 1, "concetto", "W3", [])
    n1 = _nodo_base("serie-fourier", 1, "concetto", "W3", [{"id": "segnali-deterministici", "forza": "hard", "motivo": "x"}])
    n2 = _nodo_base("trasformata-fourier", 1, "concetto", "W3", [{"id": "serie-fourier", "forza": "hard", "motivo": "x"}])
    n3 = _nodo_base("dim-impulso-dirac-trasformata", 1, "dimostrazione", "W3", [{"id": "trasformata-fourier", "forza": "hard", "motivo": "x"}])
    _scrivi_parts(base, [n0, n1, n2, n3])
    dim = {
        "id": "dim-impulso-dirac-trasformata",
        "titolo": "Titolo dimostrazione valida per test",
        "domande_esame": ["T2"],
        "enunciato": "Enunciato lungo almeno quaranta caratteri per soddisfare il vincolo dello schema della dimostrazione.",
        "ipotesi": ["ipotesi 1"],
        "notazione": [{"simbolo": "a", "significato": "b"}, {"simbolo": "c", "significato": "d"}],
        "idea": "Idea di venti caratteri minimo qui",
        "passi": [
            {"n": 1, "testo": "t1", "perche": "perche abbastanza lungo per vincolo"},
            {"n": 2, "testo": "t2", "perche": "perche abbastanza lungo per vincolo"},
            {"n": 3, "testo": "t3", "perche": "perche abbastanza lungo per vincolo"},
            {"n": 4, "testo": "t4", "perche": "perche abbastanza lungo per vincolo"},
        ],
        "formula_finale": "x",
        "figure": [
            {
                "id": "fig1",
                "tipo": "grafico",
                "titolo": "Titolo figura grafico",
                "descrizione": "Descrizione lunga almeno trenta caratteri per figura grafico di test",
                "asse_x": {"etichetta": "x", "min": 0, "max": 1},
                "asse_y": {"etichetta": "y", "min": 0, "max": 1},
                "serie": [{"stile": "linea", "punti": [[0, 0], [1, 1]]}],
            }
        ],
        "a_voce": "a" * 500,
        "errori_frequenti": [
            {"errore": "e", "perche_sbagliato": "p", "correzione": "c"},
            {"errore": "e2", "perche_sbagliato": "p2", "correzione": "c2"},
        ],
        "versione_compatta": ["a", "b", "c"],
        "a_buchi": {"testo": "___1___ ___2___ ___3___", "soluzioni": {"1": ["a"], "2": ["b"]}},
        "richiamo_attivo": [{"domanda": "d", "risposta": "r"}, {"domanda": "d2", "risposta": "r2"}, {"domanda": "d3", "risposta": "r3"}],
        "fonti": [{"chiave": "LIBRO_CI", "rif": "p.1"}],
        "verifica": {"stato": "da_verificare", "data": "2026-10-29", "note": "n", "punti_aperti": ["a"]},
    }
    (base / "graph" / "dimostrazioni" / "dim-impulso-dirac-trasformata.json").write_text(json.dumps(dim, ensure_ascii=False, indent=2), encoding="utf-8")
    with pytest.raises(ValueError, match="chiavi soluzioni"):
        build_graph(base=base)
