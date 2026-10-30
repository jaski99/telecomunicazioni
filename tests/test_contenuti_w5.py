"""Contratto autonomo dei contenuti W5, utilizzabile anche prima del merge di W1."""

import datetime
import hashlib
import json
from copy import deepcopy
import math
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
GRAPH = ROOT / "graph"
ID_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
SOURCES = {"LIBRO_CI", "LUCIDI_CASONI", "PROGRAMMA", "ESSE3_2016", "FILE1", "FILE2", "FILE3", "RICOSTRUZIONE"}
ALLOWED_URLS = {
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


def read(path):
    def reject_constant(name):
        raise ValueError(f"Costante numerica JSON non valida: {name}")

    return json.loads(path.read_text(encoding="utf-8"), parse_constant=reject_constant)


def contract():
    text = (ROOT / "docs/CONTRACTS.md").read_text(encoding="utf-8")
    block = text.split("<!-- contratto-nodi:inizio -->", 1)[1].split("```json", 1)[1].split("```", 1)[0]
    return {node["id"]: node for node in json.loads(block)["nodi"]}


def w5_contract():
    return {key: value for key, value in contract().items() if value["worker"] == "W5"}


def nodes():
    return [node for area in (6, 7) for node in read(GRAPH / f"parts/area-{area}.json")]


def content(node_id, kind):
    return read(GRAPH / kind / f"{node_id}.json")


def string(minimum=1, maximum=None, **extra):
    result = {"type": "string", "minLength": minimum, **extra}
    if maximum is not None:
        result["maxLength"] = maximum
    return result


def array(items, minimum=1, maximum=None, **extra):
    result = {"type": "array", "items": items, "minItems": minimum, **extra}
    if maximum is not None:
        result["maxItems"] = maximum
    return result


def obj(properties, required=None):
    return {"type": "object", "properties": properties,
            "required": list(properties) if required is None else required, "additionalProperties": False}


def enumeration(*values):
    return {"enum": list(values)}


TEXT = string()
ID = string(1, 64, pattern=ID_PATTERN)
SOURCE = obj({"chiave": enumeration(*sorted(SOURCES)), "rif": TEXT})
RESOURCE = obj({"titolo": TEXT, "url": {"enum": sorted(ALLOWED_URLS)}, "verificato": {"const": True}})
PREREQUISITE = obj({"id": ID, "forza": enumeration("hard", "soft"), "motivo": TEXT})
NODE = obj({
    "id": ID, "titolo": string(3, 120), "area": {"type": "integer", "minimum": 1, "maximum": 7},
    "tipo": enumeration("concetto", "dimostrazione", "tipo_esercizio"), "gruppo": enumeration("A", "B", "C"),
    "worker": enumeration("W1", "W2", "W3", "W4", "W5", "W6"), "sapere": string(40),
    "saper_fare": array(TEXT), "prerequisiti": array(PREREQUISITE, 0),
    "tempo_studio_min": {"type": "integer", "minimum": 5, "maximum": 600},
    "priorita": obj({"livello": enumeration("alta", "media", "bassa"), "motivazione": TEXT}),
    "fonti": array(SOURCE), "risorse": array(RESOURCE, 0), "checklist_ripasso": array(TEXT, 0),
}, ["id", "titolo", "area", "tipo", "gruppo", "worker", "sapere", "saper_fare", "prerequisiti",
    "tempo_studio_min", "priorita", "fonti", "risorse"])

NUMBER = {"type": "number"}
AXIS = obj({"etichetta": TEXT, "min": NUMBER, "max": NUMBER,
            "tacche": array(obj({"valore": NUMBER, "etichetta": TEXT}), 0)}, ["etichetta", "min", "max"])
PAIR = {"type": "array", "prefixItems": [NUMBER, NUMBER], "items": False, "minItems": 2, "maxItems": 2}
SERIES = obj({"stile": enumeration("linea", "tratteggio", "righe", "punti"), "punti": array(PAIR, 1, 800),
              "etichetta": TEXT}, ["stile", "punti"])
COMMON = {"id": ID, "tipo": TEXT, "titolo": string(3, 80), "descrizione": string(30)}
GRAFICO = obj({**COMMON, "tipo": {"const": "grafico"}, "asse_x": AXIS, "asse_y": AXIS,
               "serie": array(SERIES), "annotazioni": array(obj({"x": NUMBER, "y": NUMBER, "testo": TEXT}), 0)},
              [*COMMON, "asse_x", "asse_y", "serie"])
BLOCK = obj({"id": ID, "etichetta": TEXT,
             "forma": enumeration("rettangolo", "sommatore", "moltiplicatore", "ritardo", "nodo", "ingresso", "uscita"),
             "colonna": {"type": "integer", "minimum": 0, "maximum": 12},
             "riga": {"type": "integer", "minimum": 0, "maximum": 6}})
EDGE = obj({"da": ID, "a": ID, "etichetta": TEXT}, ["da", "a"])
BLOCCHI = obj({**COMMON, "tipo": {"const": "blocchi"}, "blocchi": array(BLOCK, 2), "collegamenti": array(EDGE)})
LANE = obj({"id": ID, "etichetta": TEXT})
INTERVAL = obj({"corsia": ID, "t0": NUMBER, "t1": NUMBER, "etichetta": TEXT,
                "stile": enumeration("trasmissione", "attesa", "collisione", "ack")},
               ["corsia", "t0", "t1", "stile"])
ENDPOINT = obj({"corsia": ID, "t": NUMBER})
ARROW = obj({"da": ENDPOINT, "a": ENDPOINT, "etichetta": TEXT}, ["da", "a"])
TEMPORALE = obj({**COMMON, "tipo": {"const": "temporale"},
                 "asse_t": obj({"etichetta": TEXT, "min": NUMBER, "max": NUMBER}),
                 "corsie": array(LANE), "intervalli": array(INTERVAL), "frecce": array(ARROW, 0),
                 "marcatori": array(obj({"t": NUMBER, "etichetta": TEXT}), 0)},
                [*COMMON, "asse_t", "corsie", "intervalli"])
FIGURE = {"oneOf": [GRAFICO, BLOCCHI, TEMPORALE]}

RECALL = obj({"domanda": TEXT, "risposta": TEXT})
EXAMPLE = obj({"titolo": TEXT, "problema": TEXT, "passi": array(TEXT, 3), "soluzione": TEXT, "perche_funziona": TEXT})
LESSON = obj({
    "id": ID, "perche_ti_serve": string(20, 300), "scenario": string(50),
    "definizione_esame": obj({"definizione": TEXT, "scopo": TEXT, "esempio": TEXT}),
    "spiegazione": string(1200), "analogia": obj({"testo": TEXT, "limite": TEXT}),
    "worked_example": EXAMPLE,
    "completion_problem": obj({"titolo": TEXT, "testo": TEXT, "passi_mancanti": array(TEXT), "soluzione": TEXT}),
    "esercizio_autonomo": obj({"titolo": TEXT, "testo": TEXT, "suggerimento": TEXT, "soluzione_attesa": TEXT}),
    "errori_trappole": array(obj({"errore": TEXT, "perche_sbagliato": TEXT}), 2),
    "richiamo_attivo": obj({"domande": array(RECALL, 3, 5), "spiega_con_parole_tue": TEXT}),
    "riepilogo": string(40, 800), "flashcard": array(obj({"fronte": TEXT, "retro": TEXT}), 1, 6),
    "checklist": obj({"so_fare": array(TEXT), "so_dire": array(TEXT)}), "figure": array(FIGURE, 0),
}, ["id", "perche_ti_serve", "scenario", "definizione_esame", "spiegazione", "analogia", "worked_example",
    "completion_problem", "esercizio_autonomo", "errori_trappole", "richiamo_attivo", "riepilogo", "flashcard", "checklist"])

STEP = obj({"n": {"type": "integer", "minimum": 1}, "testo": TEXT, "formula": TEXT,
            "perche": string(15), "figura": ID}, ["n", "testo", "perche"])
PROOF = obj({
    "id": ID, "titolo": string(3, 120), "domande_esame": array(string(2, pattern=r"^(T(?:[1-9]|1[0-7])|M(?:[1-9]|[12][0-9]|3[0-4]))$")),
    "enunciato": string(40), "ipotesi": array(TEXT),
    "notazione": array(obj({"simbolo": TEXT, "significato": TEXT}), 2),
    "varianti_notazione": array(obj({"canonica": TEXT, "variante": TEXT, "fonte": TEXT}), 0),
    "idea": string(20, 200), "passi": array(STEP, 4), "formula_finale": TEXT, "figure": array(FIGURE),
    "a_voce": string(300, 1500),
    "errori_frequenti": array(obj({"errore": TEXT, "perche_sbagliato": TEXT, "correzione": TEXT}), 2),
    "versione_compatta": array(TEXT, 3, 8),
    "a_buchi": obj({"testo": TEXT, "soluzioni": {"type": "object", "minProperties": 3,
                                                    "additionalProperties": array(TEXT)}}),
    "richiamo_attivo": array(RECALL, 3, 5), "collegamenti": array(ID, 0), "fonti": array(SOURCE),
    "verifica": obj({"stato": enumeration("verificata_testo_prof", "verificata_file1_file3", "solo_file3",
                                         "ricostruzione_non_del_prof", "da_verificare"),
                     "data": string(10, 10, pattern=r"^\d{4}-\d{2}-\d{2}$"), "note": TEXT,
                     "punti_aperti": array(TEXT, 0)}),
}, ["id", "titolo", "domande_esame", "enunciato", "ipotesi", "notazione", "idea", "passi", "formula_finale",
    "figure", "a_voce", "errori_frequenti", "versione_compatta", "a_buchi", "richiamo_attivo", "fonti", "verifica"])


def validate(schema, instance):
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(instance)


def strings(value, path=()):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, dict):
        for key, item in value.items():
            yield from strings(item, (*path, key))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from strings(item, (*path, index))


def w5_source_files():
    # I soli sorgenti: graph.json incorpora già una copia dei contenuti.
    paths = [GRAPH / f"parts/area-{area}.json" for area in (6, 7)]
    for node_id, spec in sorted(w5_contract().items()):
        directory = "dimostrazioni" if spec["tipo"] == "dimostrazione" else "lezioni"
        paths.append(GRAPH / directory / f"{node_id}.json")
    return paths


def duplicate_exempt(path, text):
    field = path[-1] if path else None
    if field in {"id", "stato", "figura", "corsia"}:
        return True
    if field in {"da", "a"} and "collegamenti" in path:
        return True
    if len(path) >= 2 and isinstance(field, int) and path[-2] in {"collegamenti", "domande_esame"}:
        return True
    return "punti_aperti" in path and "NON TROVATO" in text


def repeated_texts(documents):
    occurrences = defaultdict(list)
    for filename, document in documents:
        for path, text in strings(document):
            if duplicate_exempt(path, text):
                continue
            normalized = re.sub(r"\s+", " ", unicodedata.normalize("NFC", text)).strip()
            if len(normalized) > 30:
                occurrences[normalized].append((str(filename), path))
    return {text: locations for text, locations in occurrences.items()
            if len({filename for filename, _ in locations}) > 1}


def formulas(text):
    pos = 0
    while (start := text.find("$", pos)) != -1:
        delimiter = "$$" if text.startswith("$$", start) else "$"
        end = text.find(delimiter, start + len(delimiter))
        assert end != -1, f"Delimitatore LaTeX aperto: {text!r}"
        formula = text[start + len(delimiter):end]
        assert formula, f"Formula vuota: {text!r}"
        yield formula
        pos = end + len(delimiter)


def balanced_latex(formula):
    stack = []
    i = 0
    while i < len(formula):
        char = formula[i]
        if char == "\\" and i + 1 < len(formula) and formula[i + 1] in "{}\\":
            i += 2
            continue
        if char == "{":
            stack.append(char)
        elif char == "}":
            assert stack, f"Graffa chiusa senza apertura: {formula!r}"
            stack.pop()
        i += 1
    assert not stack, f"Graffe non bilanciate: {formula!r}"
    assert len(re.findall(r"\\left\b", formula)) == len(re.findall(r"\\right\b", formula)), formula
    environments = re.findall(r"\\(begin|end)\{([^{}]+)\}", formula)
    opened = []
    for command, name in environments:
        if command == "begin":
            opened.append(name)
        else:
            assert opened and opened.pop() == name, f"Ambiente LaTeX sbilanciato: {formula!r}"
    assert not opened, f"Ambiente LaTeX aperto: {formula!r}"


def check_text(value):
    for path, text in strings(value):
        assert not re.search(r"\b(?:null|undefined|NaN)\b", text, re.IGNORECASE), (path, text)
        assert not re.search(r"(?<!\w)(?:e|perche|piu|gia|puo|cosi|ne)'(?!\w)", text, re.IGNORECASE), (path, text)
        assert not any(ord(c) < 32 and c != "\n" for c in text), (path, repr(text))
        assert not re.search(r"\b\d+\s+punti\b", text, re.IGNORECASE), (path, text)
        assert not re.search(r"<(?:svg|script)\b", text, re.IGNORECASE), (path, text)
        if path[-1] in {"formula", "formula_finale", "simbolo"}:
            assert "$" not in text, (path, text)
            balanced_latex(text)
        else:
            for formula in formulas(text):
                balanced_latex(formula)
            if "soluzioni" in path and "\\" in text and "$" not in text:
                balanced_latex(text)


def check_figures(figures):
    ids = [figure["id"] for figure in figures]
    assert len(ids) == len(set(ids))
    for fig in figures:
        validate(FIGURE, fig)
        for _, label in strings(fig):
            assert "$" not in label and "<svg" not in label.lower(), label
        if fig["tipo"] == "grafico":
            for axis_name in ("asse_x", "asse_y"):
                axis = fig[axis_name]
                assert axis["min"] < axis["max"]
                assert all(axis["min"] <= tick["valore"] <= axis["max"] for tick in axis.get("tacche", []))
            for serie in fig["serie"]:
                for x, y in serie["punti"]:
                    assert math.isfinite(x) and math.isfinite(y)
                    assert fig["asse_x"]["min"] <= x <= fig["asse_x"]["max"]
                    assert fig["asse_y"]["min"] <= y <= fig["asse_y"]["max"]
            for a in fig.get("annotazioni", []):
                assert fig["asse_x"]["min"] <= a["x"] <= fig["asse_x"]["max"]
                assert fig["asse_y"]["min"] <= a["y"] <= fig["asse_y"]["max"]
        elif fig["tipo"] == "blocchi":
            blocks = [block["id"] for block in fig["blocchi"]]
            assert len(blocks) == len(set(blocks))
            assert all(edge["da"] in blocks and edge["a"] in blocks for edge in fig["collegamenti"])
        else:
            lanes = [lane["id"] for lane in fig["corsie"]]
            assert len(lanes) == len(set(lanes))
            axis = fig["asse_t"]
            assert axis["min"] < axis["max"]
            for interval in fig["intervalli"]:
                assert interval["corsia"] in lanes
                assert axis["min"] <= interval["t0"] < interval["t1"] <= axis["max"]
            for arrow in fig.get("frecce", []):
                assert arrow["da"]["corsia"] in lanes and arrow["a"]["corsia"] in lanes
                assert axis["min"] <= arrow["da"]["t"] <= arrow["a"]["t"] <= axis["max"]
            assert all(axis["min"] <= marker["t"] <= axis["max"] for marker in fig.get("marcatori", []))


def fig(proof, fig_id):
    return next(f for f in proof["figure"] if f["id"] == fig_id)


def require_acyclic(edges):
    visiting, done = set(), set()

    def visit(node):
        assert node not in visiting, f"Ciclo nei prerequisiti che coinvolge {node}"
        if node in done:
            return
        visiting.add(node)
        for dependency in edges[node]:
            visit(dependency)
        visiting.remove(node)
        done.add(node)

    for node in edges:
        visit(node)


def test_catalogo_e_prerequisiti_da_contratto():
    expected = w5_contract()
    actual = nodes()
    assert len(expected) == 16
    assert len(actual) == len(expected) == len({node["id"] for node in actual})
    assert {node["id"] for node in actual} == set(expected)
    all_specs = contract()
    edges = {key: set(spec["prerequisiti_hard"]) for key, spec in all_specs.items()}
    for node in actual:
        spec = expected[node["id"]]
        assert all(node[key] == spec[key] for key in ("area", "tipo", "gruppo", "worker"))
        hard = {p["id"] for p in node["prerequisiti"] if p["forza"] == "hard"}
        assert hard == set(spec["prerequisiti_hard"])
        assert len(node["prerequisiti"]) == len({p["id"] for p in node["prerequisiti"]})
        assert all(p["id"] in all_specs and p["id"] != node["id"] for p in node["prerequisiti"])
        edges[node["id"]] = {p["id"] for p in node["prerequisiti"]}
    require_acyclic(edges)


@pytest.mark.parametrize("node_id", sorted(w5_contract()))
def test_nodo_schema_e_testo(node_id):
    node = next(node for node in nodes() if node["id"] == node_id)
    validate(NODE, node)
    check_text(node)
    spec = w5_contract()[node_id]
    is_direct_theory = spec["tipo"] == "dimostrazione" or any(
        node_id in other["prerequisiti_hard"] for other in w5_contract().values()
        if other["tipo"] == "dimostrazione"
    )
    assert node["priorita"]["livello"] == ("alta" if is_direct_theory else "bassa" if spec["gruppo"] == "C" else "media")


CONCEPTS = sorted(key for key, spec in w5_contract().items() if spec["tipo"] == "concetto")
PROOFS = sorted(key for key, spec in w5_contract().items() if spec["tipo"] == "dimostrazione")


@pytest.mark.parametrize("node_id", CONCEPTS)
def test_lezione_completa(node_id):
    lesson = content(node_id, "lezioni")
    validate(LESSON, lesson)
    assert lesson["id"] == node_id
    assert len(re.findall(r"^### ", lesson["spiegazione"], re.MULTILINE)) >= 2
    assert list(formulas(lesson["spiegazione"]))
    assert len(lesson["riepilogo"].splitlines()) <= 5
    check_figures(lesson.get("figure", []))
    check_text(lesson)


@pytest.mark.parametrize("node_id", PROOFS)
def test_dimostrazione_completa(node_id):
    proof = content(node_id, "dimostrazioni")
    validate(PROOF, proof)
    assert proof["id"] == node_id
    assert proof["domande_esame"] == w5_contract()[node_id]["domande_esame"]
    assert [step["n"] for step in proof["passi"]] == list(range(1, len(proof["passi"]) + 1))
    ids = {figure["id"] for figure in proof["figure"]}
    assert all("formula" in step and ("figura" not in step or step["figura"] in ids) for step in proof["passi"])
    holes = proof["a_buchi"]
    indexes = re.findall(r"___(\d+)___", holes["testo"])
    assert indexes == [str(i) for i in range(1, len(indexes) + 1)] and len(indexes) >= 3
    assert set(indexes) == set(holes["soluzioni"])
    assert "perché" in holes["testo"].lower()
    assert all(link in contract() and link != node_id for link in proof.get("collegamenti", []))
    verify = proof["verifica"]
    datetime.date.fromisoformat(verify["data"])
    if not verify["stato"].startswith("verificata_"):
        assert verify["punti_aperti"]
    assert any(source["chiave"] == "FILE2" and "NON TROVATO" in source["rif"]
               for source in proof["fonti"])
    assert all("file2" not in text.lower() for path, text in strings(proof) if "fonti" not in path)
    assert "punteggio" not in proof["enunciato"].lower()
    check_figures(proof["figure"])
    check_text(proof)


@pytest.mark.parametrize("node_id,fragments", [
    ("dim-sliding-window-efficienza", (r"WF\le C\,TT", r"WF>C\,TT", r"\eta=\dfrac{WD}{C\,TT}", r"\eta=\dfrac{D}{F}")),
    ("dim-poisson-tempo-residuo", (r"X>t_0", r"P(R>r\mid X>t_0)=e^{-\lambda r}")),
    ("dim-nascita-morte-equilibrio", (r"p_k=p_0\prod_{i=0}^{k-1}\frac{\lambda_i}{\mu_{i+1}}", r"p_0=\left(1+\sum_{k=1}^{N}")),
    ("dim-aloha-throughput", (r"Ge^{-2G}", r"Ge^{-G}", "1/(2e)", "1/e", "G=1/2", "G=1")),
    ("dim-csma-cd-throughput", (r"S=\frac{1}{1+2a(1-A)/A}", r"A=Np(1-p)^{N-1}", r"A_{\max}=\left(1-\frac{1}{N}\right)^{N-1}", "verificare")),
    ("dim-ritardo-tdma-fdma", (r"D_{FD}=T", r"D_{TD}=\frac{T(M+1)}{2M}", "inizio del ciclo", "verificare")),
])
def test_enunciato_esplicita_risultato_e_ipotesi(node_id, fragments):
    statement = content(node_id, "dimostrazioni")["enunciato"]
    for fragment in fragments:
        assert fragment in statement, (node_id, fragment)


def test_motivazioni_e_prerequisiti_specifici():
    all_nodes = nodes()
    specs = w5_contract()
    motivations = [node["priorita"]["motivazione"] for node in all_nodes]
    reasons = [p["motivo"] for node in all_nodes for p in node["prerequisiti"]]
    assert len(motivations) == len(set(motivations))
    assert len(reasons) == len(set(reasons))
    assert all(len(reason.strip()) > 30 for reason in reasons)
    for node in all_nodes:
        motivation = node["priorita"]["motivazione"]
        questions = specs[node["id"]]["domande_esame"]
        for question in questions:
            assert re.search(rf"(?<![A-Za-z0-9]){re.escape(question)}(?![0-9])", motivation), (node["id"], question)
        if not questions:
            assert "nessuna prova" in motivation.lower(), node["id"]


def test_compiti_di_richiamo_specifici_per_lezione():
    markers = {
        "reti-concetti-introduttivi": ("nodo", "protocollo"),
        "architetture-iso-osi-tcpip": ("OSI", "TCP"),
        "commutazione-circuito-pacchetto": ("circuito", "store-and-forward"),
        "protocolli-linea-hdlc-sliding-window": ("W=2", "ACK"),
        "codici-rivelazione-errore": ("CRC", "101"),
        "parametro-a-propagazione-trasmissione": ("200 m", "T_p"),
        "accesso-multiplo-deterministico-casuale": ("TDMA", "ALOHA"),
        "lan-ieee802-ethernet": ("Ethernet", "CSMA/CD"),
        "processo-poisson": ("arrivi/s", "residuo"),
        "code-mm1-little": ("M/M/1", "Little"),
    }
    assert set(markers) == set(CONCEPTS)
    tasks = [content(node_id, "lezioni")["richiamo_attivo"]["spiega_con_parole_tue"] for node_id in CONCEPTS]
    assert len(tasks) == len(set(tasks))
    for node_id, expected in markers.items():
        task = content(node_id, "lezioni")["richiamo_attivo"]["spiega_con_parole_tue"]
        assert all(marker in task for marker in expected), node_id


def test_rilevatore_ripetizioni_e_sole_eccezioni_consentite():
    identifier = "identificatore-di-riferimento-molto-lungo"
    state = "stato-di-verifica-con-nome-molto-lungo"
    missing = "Confronto con la fonte originale: NON TROVATO."
    shared_open = "La condizione sul ritardo deve ancora essere verificata."
    common = "Una spiegazione descrittiva più lunga di trenta caratteri."
    only_one = "Una frase ripetuta soltanto dentro il medesimo file."
    ordinary_text = "questotestolungononeunidentificatoredistruttura"
    docs = [
        ("primo.json", {"id": identifier, "stato": state, "collegamenti": [identifier],
                        "punti_aperti": [missing, shared_open], "testo": common,
                        "esempio": ordinary_text, "breve": "x" * 30, "interno": [only_one, only_one]}),
        ("secondo.json", {"id": identifier, "stato": state, "collegamenti": [identifier],
                          "punti_aperti": [missing, shared_open], "testo": f"  {common}\n",
                          "esempio": ordinary_text, "breve": "x" * 30}),
    ]
    duplicates = repeated_texts(docs)
    assert set(duplicates) == {common, ordinary_text, shared_open}
    assert all(len({filename for filename, _ in locations}) == 2 for locations in duplicates.values())


def test_nessuna_stringa_lunga_ripetuta_tra_file_w5():
    paths = w5_source_files()
    assert len(paths) == 18
    duplicates = repeated_texts((path.relative_to(ROOT), read(path)) for path in paths)
    assert not duplicates, "Stringhe ripetute: " + repr(duplicates)


def test_introduzione_reti_nove_temi_e_fonti():
    lesson = content("reti-concetti-introduttivi", "lezioni")
    explanation = lesson["spiegazione"]
    for i in range(1, 10):
        assert re.search(rf"\*\*I{i}\.", explanation), f"Tema I{i} mancante"
    assert set(re.findall(r"(?<!\d)(?:1\d{3}|20\d{2})(?!\d)", explanation)) == {"1865", "1871", "2002"}
    assert all(term in explanation for term in ("ITU", "Meucci", "Marconi", "rame", "fibra", "radio", "NON TROVATO"))
    assert "riflessione interna totale" in explanation
    assert "verifica indipendente" in explanation
    node = next(n for n in nodes() if n["id"] == "reti-concetti-introduttivi")
    assert any(s["chiave"] == "FILE2" and "p. 8" in s["rif"] for s in node["fonti"])


def test_sliding_window_due_regimi_e_figure():
    proof = content("dim-sliding-window-efficienza", "dimostrazioni")
    assert r"\dfrac{WD}{C\,TT}" in proof["formula_finale"]
    assert r"D+H+A+2IC" in proof["formula_finale"]
    d, h, ack, capacity, delay = 800, 200, 1000, 1000, 0.5
    frame = d + h
    tt = frame / capacity + delay + ack / capacity + delay
    efficiency = lambda w: d / frame * min(1, w * frame / (capacity * tt))
    assert tt == pytest.approx(3)
    assert efficiency(2) == pytest.approx(1600 / 3000)
    assert efficiency(3) == pytest.approx(0.8)  # uguaglianza: nessuna pausa
    assert efficiency(4) == pytest.approx(0.8)
    assert all(efficiency(w) <= d / frame for w in range(1, 20))
    waiting = fig(proof, "finestra-con-attesa")
    continuous = fig(proof, "finestra-continua")
    assert any(i["corsia"] == "mittente" and i["stile"] == "attesa" and (i["t0"], i["t1"]) == (2, 3) for i in waiting["intervalli"])
    assert any(i["corsia"] == "ack-ricevuto" and i["t1"] == 3 for i in waiting["intervalli"])
    assert not any(i["corsia"] == "mittente" and i["stile"] == "attesa" for i in continuous["intervalli"])
    assert proof["verifica"]["stato"] == "da_verificare"
    assert any("A8" in x and "ACK" in x for x in proof["verifica"]["punti_aperti"])


def test_poisson_residuo_condizionato_e_grafico():
    proof = content("dim-poisson-tempo-residuo", "dimostrazioni")
    assert r"1-e^{-\lambda r}" in proof["formula_finale"]
    assert r"\frac1\lambda" in proof["formula_finale"]
    rate, r = 2.0, 0.5
    for elapsed in (0, 1, 4):
        conditional = math.exp(-rate * (elapsed + r)) / math.exp(-rate * elapsed)
        assert conditional == pytest.approx(math.exp(-rate * r))
    assert 1 - math.exp(-rate * r) == pytest.approx(0.6321205588)
    graph = fig(proof, "poisson-distribuzione-residuo")
    assert len(graph["serie"]) == 2  # C-3: la sopravvivenza resta in testa.
    for x, y in graph["serie"][0]["punti"]:
        assert y == pytest.approx(math.exp(-0.5 * x), abs=1e-8)
    for x, y in graph["serie"][1]["punti"]:
        assert y == pytest.approx(1 - math.exp(-0.5 * x), abs=1e-8)
    assert any(s["chiave"] == "FILE3" and "p. 47" in s["rif"] for s in proof["fonti"])


def test_nascita_morte_prodotto_normalizzato_e_catena():
    proof = content("dim-nascita-morte-equilibrio", "dimostrazioni")
    assert r"\prod_{i=0}^{k-1}\frac{\lambda_i}{\mu_{i+1}}" in proof["formula_finale"]
    rate_birth, rate_death, last_state = 2.0, 4.0, 3
    weights = [(rate_birth / rate_death) ** k for k in range(last_state + 1)]
    probabilities = [weight / sum(weights) for weight in weights]
    assert probabilities[0] == pytest.approx(8 / 15)
    assert sum(probabilities) == pytest.approx(1)
    for k in range(last_state):
        assert probabilities[k] * rate_birth == pytest.approx(probabilities[k + 1] * rate_death)
    graph = fig(proof, "catena-nascita-morte")
    edges = {(e["da"], e["a"]) for e in graph["collegamenti"]}
    blocks = {block["id"]: block for block in graph["blocchi"]}
    for k in range(3):
        upper, lower = blocks[f"nascita-{k}"], blocks[f"morte-{k + 1}"]
        assert upper["etichetta"] == "λ" + "₀₁₂"[k]
        assert lower["etichetta"] == "μ" + "₁₂₃"[k]
        assert upper["riga"] < blocks[f"stato-{k}"]["riga"] < lower["riga"]
        assert {(f"stato-{k}", upper["id"]), (upper["id"], f"stato-{k + 1}"),
                (f"stato-{k + 1}", lower["id"]), (lower["id"], f"stato-{k}")} <= edges
    assert any(s["chiave"] == "FILE3" and "48–49" in s["rif"] for s in proof["fonti"])


def test_aloha_curve_finestre_e_massimi():
    proof = content("dim-aloha-throughput", "dimostrazioni")
    assert r"Ge^{-2G}" in proof["formula_finale"]
    assert r"Ge^{-G}" in proof["formula_finale"]
    graph = fig(proof, "aloha-throughput-grafico")
    pure, slotted = graph["serie"]
    for x, y in pure["punti"]:
        assert y == pytest.approx(x * math.exp(-2 * x), abs=1e-8)
    for x, y in slotted["punti"]:
        assert y == pytest.approx(x * math.exp(-x), abs=1e-8)
    xp, yp = max(pure["punti"], key=lambda p: p[1])
    xs, ys = max(slotted["punti"], key=lambda p: p[1])
    assert xp == pytest.approx(0.5) and yp == pytest.approx(1 / (2 * math.e), abs=1e-8)
    assert xs == pytest.approx(1) and ys == pytest.approx(1 / math.e, abs=1e-8)
    assert ys == pytest.approx(2 * yp, abs=1e-8)
    assert math.exp(0.5) != pytest.approx(2)  # il rapporto dei throughput non è sempre 2
    pure_window = fig(proof, "aloha-finestra-puro")
    slotted_window = fig(proof, "aloha-finestra-slotted")
    assert any(i["corsia"] == "vulnerabile" and i["t1"] - i["t0"] == 2 for i in pure_window["intervalli"])
    assert any(i["etichetta"] == "Slot vulnerabile τ" and i["t1"] - i["t0"] == 1 for i in slotted_window["intervalli"])
    assert all("unità di τ" in f["asse_t"]["etichetta"] for f in (pure_window, slotted_window))
    assert "A10" in proof["verifica"]["note"] and "refuso" in proof["verifica"]["note"]


def test_csma_cd_slot_formula_e_curve():
    proof = content("dim-csma-cd-throughput", "dimostrazioni")
    assert r"1+2a\dfrac{1-A_{\max}}{A_{\max}}" in proof["formula_finale"]
    assert any(r"\frac{A}{A+2a(1-A)}" in step["formula"] for step in proof["passi"])
    graph = fig(proof, "csma-cd-throughput-grafico")
    for series, n in zip(graph["serie"], (2, 10)):
        success = (1 - 1 / n) ** (n - 1)
        previous = float("inf")
        for a, value in series["punti"]:
            expected = 1 / (1 + 2 * a * (1 - success) / success)
            assert value == pytest.approx(expected, abs=1e-8)
            assert value <= previous
            previous = value
        assert series["punti"][-1][1] == pytest.approx(success, abs=1e-8)
    assert 1 / (1 + 2 * 0.1 * (1 - 0.5) / 0.5) == pytest.approx(5 / 6)
    assert (1 - 1 / 100000) ** 99999 == pytest.approx(1 / math.e, rel=1e-5)
    timeline = fig(proof, "csma-cd-contesa")
    a_frame = next(i for i in timeline["intervalli"] if i["etichetta"] == "Frame riuscito")
    first_slot = next(i for i in timeline["intervalli"] if i["etichetta"] == "Slot 2Tp: collisione")
    assert a_frame["t1"] - a_frame["t0"] == 1
    assert first_slot["t1"] - first_slot["t0"] == 0.5  # 2 Tp, con Tp = 0,25 s
    arrows = {arrow["etichetta"]: arrow for arrow in timeline["frecce"]}
    assert arrows["Segnale A: Tp"]["a"]["t"] - arrows["Segnale A: Tp"]["da"]["t"] == pytest.approx(0.25)
    assert arrows["Segnale B: Tp"]["a"]["t"] - arrows["Segnale B: Tp"]["da"]["t"] == pytest.approx(0.25)
    collisions = {i["corsia"]: i for i in timeline["intervalli"] if i["corsia"] in {"a", "b"} and i["stile"] == "collisione"}
    assert collisions["a"]["t1"] == arrows["Segnale B: Tp"]["a"]["t"]
    assert collisions["b"]["t1"] == arrows["Segnale A: Tp"]["a"]["t"]
    assert proof["verifica"]["stato"] == "verificata_file1_file3"
    assert "La formula coincide con quella dei lucidi" in proof["verifica"]["note"]
    assert any("Figure 1 e 4" in point and "NON TROVATO" in point
               for point in proof["verifica"]["punti_aperti"])
    assert any(source["chiave"] == "LUCIDI_CASONI" for source in proof["fonti"])
    assert graph["asse_x"]["min"] == 0 and graph["asse_x"]["max"] == 0.5


def test_ritardi_tdma_fdma_e_temporale():
    proof = content("dim-ritardo-tdma-fdma", "dimostrazioni")
    assert r"\frac{T(M+1)}{2M}" in proof["formula_finale"]
    for m in range(1, 11):
        period = 4.0
        mean_wait = sum((position - 1) * period / m for position in range(1, m + 1)) / m
        tdma_delay = mean_wait + period / m
        assert tdma_delay == pytest.approx(period * (m + 1) / (2 * m))
        assert tdma_delay <= period
        assert (tdma_delay == pytest.approx(period)) == (m == 1)
    diagram = fig(proof, "tdma-fdma-confronto-temporale")
    tdma_endings = [next(i["t1"] for i in diagram["intervalli"] if i["corsia"] == f"td-{n}" and i["stile"] == "trasmissione") for n in range(1, 5)]
    fdma_endings = [next(i["t1"] for i in diagram["intervalli"] if i["corsia"] == f"fd-{n}" and i["stile"] == "trasmissione") for n in range(1, 5)]
    assert sum(tdma_endings) / 4 == pytest.approx(2.5)
    assert sum(fdma_endings) / 4 == pytest.approx(4)
    assert proof["verifica"]["stato"] == "verificata_file1_file3"
    assert not proof["verifica"]["punti_aperti"]
    assert "lucidi del docente" in proof["ipotesi"][1]
    assert "ricostruzione" not in proof["ipotesi"][1]
    assert any(source["chiave"] == "LUCIDI_CASONI" for source in proof["fonti"])


def test_figure_temporali_e_stati_obbligatori():
    for node_id in ("dim-sliding-window-efficienza", "dim-aloha-throughput",
                    "dim-csma-cd-throughput", "dim-ritardo-tdma-fdma"):
        assert any(f["tipo"] == "temporale" for f in content(node_id, "dimostrazioni")["figure"])
    for node_id in ("dim-aloha-throughput", "dim-csma-cd-throughput"):
        assert any(f["tipo"] == "grafico" for f in content(node_id, "dimostrazioni")["figure"])
    assert any(f["tipo"] == "blocchi" for f in content("dim-nascita-morte-equilibrio", "dimostrazioni")["figure"])
    assert len(CONCEPTS) == 10 and len(PROOFS) == 6


@pytest.mark.parametrize("node_id,slide", [
    ("dim-sliding-window-efficienza", "75"),
    ("dim-poisson-tempo-residuo", "106"),
    ("dim-nascita-morte-equilibrio", "110"),
    ("dim-aloha-throughput", "5"),
    ("dim-csma-cd-throughput", "12"),
    ("dim-ritardo-tdma-fdma", "25"),
])
def test_provenienza_slide_e_ipotesi(node_id, slide):
    proof = content(node_id, "dimostrazioni")
    assert any(source["chiave"] == "FILE1" and f"slide {slide}" in source["rif"]
               for source in proof["fonti"])
    assert proof["verifica"]["stato"] != "verificata_testo_prof"
    if any("IPOTESI" in hypothesis for hypothesis in proof["ipotesi"]):
        assert proof["verifica"]["stato"] == "da_verificare"
        assert proof["verifica"]["punti_aperti"]


# Round E, E5: B1/B2 e S1-S8. Gli indici si riferiscono ai passi consecutivi,
# non a un elenco filtrato che nasconderebbe interruzioni della progressione.
CATENE_E5 = {
    "dim-aloha-throughput": (5, 6, 7),
    "dim-nascita-morte-equilibrio": (3, 4, 5),
    "dim-ritardo-tdma-fdma": (1, 2, 3),
    "dim-poisson-tempo-residuo": (5, 6),
    "dim-csma-cd-throughput": (5, 6),
    "dim-sliding-window-efficienza": (5, 6),
}


def assert_progressiva(prima, dopo):
    """Regole dati del piano: identità profonda, inclusione e crescita reale."""
    assert prima["tipo"] == dopo["tipo"], "S1: tipo"
    check_figures([prima, dopo])  # S5, anche frecce, marcatori e annotazioni.
    tipo = prima["tipo"]
    if tipo == "grafico":
        assert all(prima[a] == dopo[a] for a in ("asse_x", "asse_y")), "S2: assi"
        assert dopo["serie"][:len(prima["serie"])] == prima["serie"], "S3: prefisso serie"
        campi = ("annotazioni",)
        crescita = len(dopo["serie"]) > len(prima["serie"])
    elif tipo == "temporale":
        assert prima["asse_t"] == dopo["asse_t"] and prima["corsie"] == dopo["corsie"], "S2: corsie"
        campi = ("intervalli", "frecce", "marcatori")
        crescita = False
    else:
        campi = ("blocchi", "collegamenti")  # L'identità dei blocchi implica S2.
        crescita = False
    for campo in campi:
        vecchi, nuovi = prima.get(campo, []), dopo.get(campo, [])
        assert all(x in nuovi for x in vecchi), f"S3: {campo}"
        crescita |= any(x not in vecchi for x in nuovi)
    assert crescita, "S4: nessun elemento nuovo"


@pytest.mark.parametrize("node_id", PROOFS)
def test_b1_b2_catene_e5_consecutive(node_id):
    proof = content(node_id, "dimostrazioni")
    indici = CATENE_E5[node_id]
    assert list(indici) == list(range(indici[0], indici[-1] + 1))
    minimo = 3 if node_id in {"dim-aloha-throughput", "dim-nascita-morte-equilibrio", "dim-ritardo-tdma-fdma"} else 2
    assert len(indici) >= minimo
    figure = [fig(proof, proof["passi"][n - 1]["figura"]) for n in indici]
    for prima, dopo in zip(figure, figure[1:]):
        assert_progressiva(prima, dopo)
    for stato in figure:
        assert len(stato["descrizione"]) >= 30
        assert not any(
            (ord(c) > 127 and unicodedata.category(c) == "Sm")
            or any(nome in unicodedata.name(c, "") for nome in (
                "GREEK", "SUBSCRIPT", "SUPERSCRIPT", "MATHEMATICAL", "VULGAR FRACTION", "DOUBLE-STRUCK"
            ))
            for c in stato["descrizione"]
        ), "S7: descrizione in prosa senza Unicode matematico"
    assert len(proof["collegamenti"]) >= 2


@pytest.mark.parametrize("difetto", ["asse", "tacca", "ordine", "stile", "punto", "legenda", "annotazione", "crescita"])
def test_rilevatore_progressione_rifiuta_regressioni_grafico(difetto):
    d = content("dim-aloha-throughput", "dimostrazioni")
    prima = deepcopy(fig(d, "aloha-throughput-puro-slotted"))
    dopo = deepcopy(fig(d, "aloha-throughput-grafico"))
    if difetto == "asse":
        dopo["asse_x"]["max"] += 1
    elif difetto == "tacca":
        dopo["asse_x"]["tacche"] = [{"valore": 0, "etichetta": "origine"}]
    elif difetto == "ordine":
        dopo["serie"].reverse()
    elif difetto == "stile":
        dopo["serie"][0]["stile"] = "punti"
    elif difetto == "punto":
        dopo["serie"][0]["punti"][0][1] = -1
    elif difetto == "legenda":
        dopo["serie"][0]["etichetta"] = "Etichetta cambiata"
    elif difetto == "annotazione":
        prima["annotazioni"] = [{"x": 0, "y": 0, "testo": "Da conservare"}]
    else:
        dopo["annotazioni"] = []
    with pytest.raises(AssertionError):
        assert_progressiva(prima, dopo)


@pytest.mark.parametrize("tipo", ["blocchi", "temporale"])
def test_rilevatore_progressione_rifiuta_sostituzioni_e_spostamenti(tipo):
    id, iniziale, finale = (("dim-nascita-morte-equilibrio", "nascita-morte-taglio-zero", "taglio-flussi")
                             if tipo == "blocchi" else
                             ("dim-ritardo-tdma-fdma", "tdma-fdma-primo-slot", "tdma-fdma-corsie-fdma"))
    d = content(id, "dimostrazioni")
    prima, dopo = deepcopy(fig(d, iniziale)), deepcopy(fig(d, finale))
    if tipo == "blocchi":
        dopo["blocchi"][0]["colonna"] += 1
    else:
        dopo["intervalli"][0]["t1"] += 0.1
    with pytest.raises(AssertionError):
        assert_progressiva(prima, dopo)


def test_s6_s8_aloha_e_tdma_non_anticipano():
    aloha = content("dim-aloha-throughput", "dimostrazioni")
    puro, slot, massimi = [fig(aloha, aloha["passi"][n - 1]["figura"]) for n in (5, 6, 7)]
    assert len(puro["serie"]) == 1 and len(slot["serie"]) == len(massimi["serie"]) == 2
    assert not puro["annotazioni"] and not slot["annotazioni"]
    assert len(massimi["annotazioni"]) == 2
    assert "prime" in aloha["passi"][6]["formula"] and "0{,}3679" in aloha["passi"][6]["formula"]
    assert aloha["passi"][1]["figura"] == "aloha-finestra-puro"
    assert aloha["passi"][3]["figura"] == "aloha-finestra-slotted"
    tdma = content("dim-ritardo-tdma-fdma", "dimostrazioni")
    primo, fdma, tutti = [fig(tdma, tdma["passi"][n - 1]["figura"]) for n in (1, 2, 3)]
    assert {i["corsia"] for i in primo["intervalli"]} == {"td-1"}
    assert {i["corsia"] for i in fdma["intervalli"]} == {"td-1", "fd-1", "fd-2", "fd-3", "fd-4"}
    assert {i["corsia"] for i in tutti["intervalli"]} == {c["id"] for c in tutti["corsie"]}
    assert tutti["id"] == "tdma-fdma-confronto-temporale"


def test_s6_nascita_morte_tagli_dopo_equilibrio():
    d = content("dim-nascita-morte-equilibrio", "dimostrazioni")
    stati = [fig(d, d["passi"][n - 1]["figura"]) for n in (3, 4, 5)]
    tagli = [{b["id"] for b in s["blocchi"] if b["id"].startswith("taglio-")} for s in stati]
    assert tagli == [set(), {"taglio-zero"}, {"taglio-zero", "taglio-k"}]
    assert r"\frac{dp_k}{dt}=0" in d["passi"][2]["formula"]
    assert "telescopica" in d["passi"][4]["perche"]
    assert {"0", "1", "k", "k+1", "N"} <= {b["etichetta"] for b in stati[-1]["blocchi"]}
    archi = {(a["da"], a["a"]) for a in stati[-1]["collegamenti"]}
    assert {("k", "nascita-k"), ("nascita-k", "k-piu-uno"),
            ("k-piu-uno", "morte-k-piu-uno"), ("morte-k-piu-uno", "k")} <= archi


def test_c3_t13_sopravvivenza_cdf_e_densita_senza_scambio_di_unita():
    d = content("dim-poisson-tempo-residuo", "dimostrazioni")
    iniziale = fig(d, d["passi"][0]["figura"])
    assert iniziale["id"] == "poisson-sopravvivenza-interarrivo"
    assert len(iniziale["serie"]) == 1 and iniziale["serie"][0]["punti"][0] == [0, 1]
    finale = fig(d, "poisson-distribuzione-residuo")
    assert all(iniziale[asse] == finale[asse] for asse in ("asse_x", "asse_y")), "C-3: stessi assi fin dal passo 1"
    for t, y in iniziale["serie"][0]["punti"]:
        assert y == pytest.approx(math.exp(-0.5 * t), abs=1e-8)
    cdf = next(p for p in d["passi"] if p.get("figura") == "poisson-distribuzione-residuo")
    assert r"F_R(r)=P(R\le r\mid X>t_0)=1-e^{-\lambda r}" == cdf["formula"]
    assert "assenza di memoria" in d["passi"][4]["testo"]
    assert "non dipende da $t_0$" in d["passi"][-1]["perche"]
    density = fig(d, "poisson-densita-condizionata")
    assert d["passi"][3]["figura"] == density["id"] and len(density["serie"]) == 2
    assert density["serie"][1]["stile"] == "tratteggio"
    for serie, t0 in zip(density["serie"], (0, 2)):
        for t, y in serie["punti"]:
            assert t >= t0
            assert y == pytest.approx(0.5 * math.exp(-0.5 * (t - t0)), abs=1e-8)
    assert any("coda è identica" in a["testo"] for a in density["annotazioni"])
    assert all(r"\lambda_t" not in v["variante"] for v in d["varianti_notazione"])
    assert any(v["variante"] == r"$\delta$" and "p. 53" in v["fonte"] for v in d["varianti_notazione"])


# B3: algoritmo di R6 §7.3 riportato nel test d'area, senza dipendenze dai PDF.
NON_DIGITABILE = re.compile(r"[\\$^_]")


def problemi_r6(d):
    problemi = []
    ids = {f["id"] for f in d["figure"]}
    usate = [p["figura"] for p in d["passi"] if p.get("figura")]
    if len(usate) != len(set(usate)):
        problemi.append("figura ripetuta")
    if ids - set(usate):
        problemi.append("figura orfana")
    if set(usate) - ids:
        problemi.append("figura inesistente")
    for p in d["passi"]:
        if not p.get("formula") and not p.get("figura"):
            problemi.append("passo senza formula né figura")
        if len(p.get("perche", "")) < 40:
            problemi.append("perche corto")
    for varianti in d["a_buchi"]["soluzioni"].values():
        if any(NON_DIGITABILE.search(v) for v in varianti):
            problemi.append("buco non digitabile")
    if not 300 <= len(d["a_voce"]) <= 1500:
        problemi.append("a_voce fuori range")
    if [p["n"] for p in d["passi"]] != list(range(1, len(d["passi"]) + 1)):
        problemi.append("numerazione non consecutiva")
    return problemi


@pytest.mark.parametrize("node_id", PROOFS)
def test_b3_struttura_r6_e_granularita(node_id):
    d = content(node_id, "dimostrazioni")
    assert not problemi_r6(d), (node_id, problemi_r6(d))
    assert 4 <= len(d["passi"]) <= 12
    assert len(d["collegamenti"]) >= 2
    assert len(set(d["collegamenti"])) == len(d["collegamenti"])


@pytest.mark.parametrize("difetto", ["orfana", "ripetuta", "vuoto", "perche", "buco", "voce", "numero"])
def test_rilevatore_r6_individua_i_difetti(difetto):
    d = deepcopy(content("dim-aloha-throughput", "dimostrazioni"))
    if difetto == "orfana":
        d["passi"][1].pop("figura")
    elif difetto == "ripetuta":
        d["passi"][0]["figura"] = d["passi"][1]["figura"]
    elif difetto == "vuoto":
        d["passi"][0].pop("formula")
    elif difetto == "perche":
        d["passi"][0]["perche"] = "Troppo breve"
    elif difetto == "buco":
        d["a_buchi"]["soluzioni"]["1"] = [r"$2\tau$"]
    elif difetto == "voce":
        d["a_voce"] = "Breve"
    else:
        d["passi"][0]["n"] = 99
    assert problemi_r6(d)


# B6: tutti i numeri delle schede T12-T17, calcolati e collegati al testo.
def test_b6_t12_numeri_e_nuova_figura_insufficiente():
    d = content("dim-sliding-window-efficienza", "dimostrazioni")
    useful, header, ack, capacity, delay = 950, 50, 50, 10_000, 0.010
    frame = useful + header
    tf = frame / capacity
    tt = tf + delay + ack / capacity + delay
    assert (tf, tt, capacity * tt) == pytest.approx((0.1, 0.125, 1250))
    assert capacity * tt / frame == pytest.approx(1.25)
    for w, attesa in ((1, 0.76), (2, 0.95), (3, 0.95)):
        assert useful / frame * min(1, w * frame / (capacity * tt)) == pytest.approx(attesa)
    assert d["passi"][2]["figura"] == "finestra-insufficiente"
    assert d["passi"][0]["figura"] == "finestra-con-attesa"
    insufficiente = fig(d, "finestra-insufficiente")
    assert any(i["stile"] == "attesa" and (i["t0"], i["t1"]) == (2, 3) for i in insufficiente["intervalli"])
    assert {"I: andata", "I: ritorno"} <= {a["etichetta"] for a in insufficiente["frecce"]}
    assert "due volte" in d["passi"][0]["perche"] and r"\eta\le1" in d["passi"][-1]["perche"]
    assert "p. 29" in d["verifica"]["note"] and "p. 30" in d["verifica"]["note"]
    assert "p. 50" in d["verifica"]["note"]  # Le formule dei due regimi sono qui, non a p. 49.
    assert all(valore in d["richiamo_attivo"][-1]["risposta"] for valore in ("0{,}76", "0{,}95", "1250"))


def test_b6_t13_t14_numeri():
    poisson = content("dim-poisson-tempo-residuo", "dimostrazioni")
    assert math.exp(-500 * 0.001) == pytest.approx(0.6065, abs=5e-5)
    assert 1000 / 500 == 2  # millisecondi
    assert all(v in poisson["richiamo_attivo"][-1]["risposta"] for v in ("500", "0{,}6065", r"2\ \mathrm{ms}"))
    nascita = content("dim-nascita-morte-equilibrio", "dimostrazioni")
    weights = [1, 2, 2 * 0.5]
    p = [x / sum(weights) for x in weights]
    assert p == pytest.approx([0.25, 0.5, 0.25])
    assert sum(p) == 1 and p[1] / p[0] == 2 and p[2] / p[1] == 0.5
    assert "(0{,}25;0{,}5;0{,}25)" in nascita["richiamo_attivo"][-1]["risposta"]
    assert any(v["canonica"] == "$p_k$" and v["variante"] == "$P_k$" for v in nascita["varianti_notazione"])
    assert r"\lambda_N=0" in nascita["passi"][-1]["perche"]


def test_b6_t15_massimi_e_stesso_carico():
    d = content("dim-aloha-throughput", "dimostrazioni")
    assert 1 / (2 * math.e) == pytest.approx(0.1839, abs=5e-5)
    assert 1 / math.e == pytest.approx(0.3679, abs=5e-5)
    assert 0.5 * math.exp(-0.5) == pytest.approx(0.3033, abs=5e-5)
    assert math.exp(-2) == pytest.approx(0.1353, abs=5e-5)
    assert all(v in d["formula_finale"] for v in ("0{,}1839", "0{,}3679"))
    assert any(n["simbolo"] == r"\lambda_r" and r"\lambda_t=\lambda+\lambda_r" in n["significato"]
               and "lucidi del docente" in n["significato"] for n in d["notazione"])
    assert all(v in d["richiamo_attivo"][-1]["risposta"] for v in ("0{,}1839", "0{,}3033", "0{,}1353", "0{,}3679"))


def test_b6_t16_limite_monotonia_e_non_attribuzione():
    d = content("dim-csma-cd-throughput", "dimostrazioni")
    success = 2 * 0.5 * (1 - 0.5)
    s = lambda a: 1 / (1 + 2 * a * (1 - success) / success)
    assert s(0) == 1 and s(0.5) == 0.5
    assert all(s(a / 100) > s((a + 1) / 100) for a in range(50))
    assert "rapporto fra due durate" in d["passi"][0]["perche"]
    assert r"T_f/T_{\mathrm{slot}}" in d["passi"][0]["perche"]
    assert all(term in d["ipotesi"][4] for term in ("carrier sensing", "multiple access", "collision detection", "jamming", "back-off"))
    assert any(v["variante"] == r"$a=\frac{Rd}{VL}$" for v in d["varianti_notazione"])
    assert "valori numerici NON TROVATO" in d["verifica"]["note"]
    graph = fig(d, "csma-cd-throughput-grafico")
    assert "ricalcolate" in graph["descrizione"] and "non lette" in graph["descrizione"]
    assert graph["asse_x"]["max"] == 0.5  # T16-3 non autorizza l'IPOTESI dell'asse esteso.


def test_b6_t17_ritardi_e_simbolo_della_fonte():
    d = content("dim-ritardo-tdma-fdma", "dimostrazioni")
    m, bits, rate = 4, 1000, 4000
    period = m * bits / rate
    mean_wait = sum((n - 1) * period / m for n in range(1, m + 1)) / m
    assert period == 1
    assert mean_wait + period / m == 0.625
    assert period - (mean_wait + period / m) == 0.375
    assert r"\omega" not in json.dumps(d, ensure_ascii=False)
    assert r"D=w+\tau" in d["passi"][0]["formula"]
    assert r"D_{FD}-\frac{T}{2}" in d["passi"][4]["formula"]
    assert r"D_{FD}-\frac{b}{2R}(M-1)" in d["passi"][4]["formula"]
    assert "inizio del ciclo" in d["passi"][2]["perche"] and "ipotesi" in d["passi"][2]["perche"]
    assert "strutturalmente superiore a FDMA" in d["passi"][5]["testo"]
    assert "M>1" in d["passi"][5]["formula"] and "M=1" in d["passi"][5]["formula"]
    assert all(v in d["richiamo_attivo"][-1]["risposta"] for v in (r"1\ \mathrm{s}", "0{,}625", "0{,}375"))


@pytest.mark.parametrize("node_id", ["dim-aloha-throughput", "dim-csma-cd-throughput", "dim-ritardo-tdma-fdma"])
def test_lucidi_consultati_solo_dove_previsto_da_r6(node_id):
    d = content(node_id, "dimostrazioni")
    assert any(s["chiave"] == "LUCIDI_CASONI" and "AccessoMultiplo.pdf" in s["rif"] for s in d["fonti"])
    assert all("non consultata" not in s["rif"] for s in d["fonti"] if s["chiave"] == "FILE1")
    assert d["verifica"]["stato"] == "verificata_file1_file3"
    assert d["verifica"]["data"] == "2026-10-30"


@pytest.mark.parametrize("node_id", ["dim-sliding-window-efficienza", "dim-poisson-tempo-residuo", "dim-nascita-morte-equilibrio"])
def test_lucidi_reti_restano_non_consultati(node_id):
    d = content(node_id, "dimostrazioni")
    assert all(s["chiave"] != "LUCIDI_CASONI" for s in d["fonti"])
    assert any("non consultata" in s["rif"] for s in d["fonti"] if s["chiave"] == "FILE1")


# B7: snapshot generato UNA volta con git show da main 0ef8a4c, mai dai dati corretti.
BASE_E5 = "0ef8a4c7e488853798f6410cc45aca5ec3f45c21"
SNAPSHOT_E5 = ROOT / "tests/fixtures/invarianti_w5.json"
SNAPSHOT_SHA256 = "3c6a614bf97f621c867df8626d46eb4605f12e30934dc30abc581dd8dacca92e"
COMUNI_E5 = {"versione_compatta": "G-5", "a_voce": "G-5", "a_buchi": "G-1/G-5"}
# Ogni eccezione è motivata dagli ID di §5, non da un generico via libera al file.
ECCEZIONI_E5 = {
    "dim-sliding-window-efficienza": {**COMUNI_E5, "passi": "T12-1/T12-2/T12-3/T12-5/S1-S8", "figure": "T12-1/S1-S8", "richiamo_attivo": "T12-4", "verifica.note": "T12-6 (rinvio rettificato sulle immagini)"},
    "dim-poisson-tempo-residuo": {**COMUNI_E5, "passi": "T13-1/T13-2/T13-4/C-3/G-3", "figure": "T13-4/C-3/S1-S8", "richiamo_attivo": "T13-3", "varianti_notazione": "T13-5"},
    "dim-nascita-morte-equilibrio": {**COMUNI_E5, "passi": "T14-1/T14-2/T14-3/T14-6", "figure": "T14-3/S1-S8", "richiamo_attivo": "T14-4", "varianti_notazione": "T14-5"},
    "dim-aloha-throughput": {**COMUNI_E5, "passi": "T15-1/G-3/S1-S8", "figure": "S1-S8", "formula_finale": "T15-2", "notazione": "T15-3", "fonti": "T15-4", "verifica": "T15-5", "richiamo_attivo": "T15-6"},
    "dim-csma-cd-throughput": {**COMUNI_E5, "passi": "T16-1/S1-S8", "figure": "S1-S8 (T16-3: asse NON esteso)", "ipotesi": "T16-2/T16-4", "fonti": "T16-4", "varianti_notazione": "T16-4", "verifica": "T16-5"},
    "dim-ritardo-tdma-fdma": {**COMUNI_E5, "passi": "T17-1/T17-2/T17-3/T17-7/S1-S8", "figure": "S1-S8", "notazione": "T17-1", "varianti_notazione": "T17-1", "formula_finale": "T17-1/T17-2", "errori_frequenti": "T17-1 (solo simbolo)", "richiamo_attivo": "T17-4", "fonti": "T17-5", "ipotesi": "T17-5", "verifica": "T17-6"},
}
# Vecchio passo -> nuovo passo; fuori dai campi elencati il testo resta identico.
# n e figura sono verificati separatamente (rinumerazione G-5 e agganci S1-S8).
PASSI_ECCEZIONI_E5 = {
    "dim-sliding-window-efficienza": [(1, 1, {"perche"}), (2, 2, set()), (3, 3, set()), (4, 4, set()), (5, 6, {"perche"})],
    "dim-poisson-tempo-residuo": [(1, 1, set()), (2, 2, set()), (3, 3, set()), (4, 4, set()), (5, 7, {"testo", "formula", "perche"})],
    "dim-nascita-morte-equilibrio": [(1, 1, set()), (2, 2, set()), (3, 4, set()), (4, 5, {"perche"}), (5, 6, {"perche"})],
    "dim-aloha-throughput": [(1, 1, set()), (2, 2, set()), (3, 3, set()), (4, 5, set()), (5, 4, {"testo", "formula"}), (6, 7, {"formula"})],
    "dim-csma-cd-throughput": [(1, 1, {"perche"}), (2, 2, set()), (3, 3, set()), (4, 4, set()), (5, 5, set()), (6, 6, set())],
    "dim-ritardo-tdma-fdma": [(1, 1, {"formula"}), (2, 2, {"formula"}), (3, 3, {"formula", "perche"}), (4, 4, {"formula"}), (5, 5, {"formula"})],
}
FIGURE_ECCEZIONI_E5 = {
    "aloha-throughput-grafico": {"descrizione"},  # S7: nuovo rispetto alle due curve.
    "csma-cd-throughput-grafico": {"descrizione"},  # S7 e T16: nessun numero attribuito.
    "tdma-fdma-confronto-temporale": {"descrizione"},  # S7: le corsie si riempiono.
    "poisson-distribuzione-residuo": {"descrizione", "asse_x", "asse_y", "serie"},  # C-3.
}


def differenze(prima, dopo, path=()):
    if type(prima) is not type(dopo):
        yield path
    elif isinstance(prima, dict):
        for key in sorted(prima.keys() | dopo.keys()):
            if key not in prima or key not in dopo:
                yield (*path, key)
            else:
                yield from differenze(prima[key], dopo[key], (*path, key))
    elif isinstance(prima, list):
        if len(prima) != len(dopo):
            yield path
        for i, (a, b) in enumerate(zip(prima, dopo)):
            yield from differenze(a, b, (*path, str(i)))
    elif prima != dopo:
        yield path


def test_b7_snapshot_originale_e_graph_fuori_scope_invariato():
    assert hashlib.sha256(SNAPSHOT_E5.read_bytes()).hexdigest() == SNAPSHOT_SHA256
    snapshot = read(SNAPSHOT_E5)
    assert snapshot["base_commit"] == BASE_E5
    assert set(snapshot["dimostrazioni"]) == set(PROOFS) == set(ECCEZIONI_E5)
    actual = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
              for p in GRAPH.rglob("*.json")
              if p.parent != GRAPH / "dimostrazioni" and p.name not in {"graph.json", "quiz.json"}}
    assert actual == snapshot["graph_invariato_sha256"]


@pytest.mark.parametrize("node_id", PROOFS)
def test_b7_invarianti_per_campo_e_id_di_correzione(node_id):
    prima = read(SNAPSHOT_E5)["dimostrazioni"][node_id]
    dopo = content(node_id, "dimostrazioni")
    assert prima.keys() == dopo.keys(), "Nessun campo nuovo"
    assert all(prima[k] == dopo[k] for k in ("id", "titolo", "enunciato", "domande_esame", "idea", "collegamenti"))
    prefissi = [tuple(k.split(".")) for k in ECCEZIONI_E5[node_id]]
    non_consentite = [p for p in differenze(prima, dopo) if not any(p[:len(k)] == k for k in prefissi)]
    assert not non_consentite, (node_id, non_consentite)
    for vecchio, nuovo, campi in PASSI_ECCEZIONI_E5[node_id]:
        p, q = prima["passi"][vecchio - 1], dopo["passi"][nuovo - 1]
        assert q["n"] == nuovo
        for key in (p.keys() | q.keys()) - campi - {"n", "figura"}:
            assert p.get(key) == q.get(key), (node_id, vecchio, nuovo, key)
    assert len(prima["passi"]) == len(PASSI_ECCEZIONI_E5[node_id])
    for originale in prima["figure"]:
        attuale = fig(dopo, originale["id"])
        assert originale.keys() == attuale.keys()
        for key in originale.keys() - FIGURE_ECCEZIONI_E5.get(originale["id"], set()):
            assert originale[key] == attuale[key], (node_id, originale["id"], key)
    assert next(s for s in prima["fonti"] if s["chiave"] == "FILE2") == next(s for s in dopo["fonti"] if s["chiave"] == "FILE2")
    assert dopo["verifica"]["stato"] != "verificata_testo_prof"


def test_b7_eccezioni_di_notazione_non_autorizzano_altro():
    baseline = read(SNAPSHOT_E5)["dimostrazioni"]
    aloha = content("dim-aloha-throughput", "dimostrazioni")
    assert aloha["notazione"][:-1] == baseline[aloha["id"]]["notazione"]
    tdma = content("dim-ritardo-tdma-fdma", "dimostrazioni")
    for campo in ("notazione", "errori_frequenti"):
        atteso = json.loads(json.dumps(baseline[tdma["id"]][campo]).replace(r"\\omega", "w"))
        assert tdma[campo] == atteso
    poisson = content("dim-poisson-tempo-residuo", "dimostrazioni")
    assert fig(poisson, "poisson-distribuzione-residuo")["serie"][-1] == baseline[poisson["id"]]["figure"][0]["serie"][0]
