"""Contratto autonomo dei contenuti W5, utilizzabile anche prima del merge di W1."""

import datetime
import json
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
    for x, y in graph["serie"][0]["punti"]:
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
    assert proof["verifica"]["stato"] == "da_verificare"
    assert any("A7" in point for point in proof["verifica"]["punti_aperti"])


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
    assert proof["verifica"]["stato"] == "da_verificare"
    assert any("A9" in point for point in proof["verifica"]["punti_aperti"])


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
               and "non consultata" in source["rif"] for source in proof["fonti"])
    assert proof["verifica"]["stato"] != "verificata_testo_prof"
    if any("IPOTESI" in hypothesis for hypothesis in proof["ipotesi"]):
        assert proof["verifica"]["stato"] == "da_verificare"
        assert proof["verifica"]["punti_aperti"]
