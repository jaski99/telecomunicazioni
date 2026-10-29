"""Regression checks for the worked exercises and W6 exam material."""

import math
import json
import re
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "schema"
LESSONS_DIR = ROOT / "graph" / "lezioni"
PARTS_DIR = ROOT / "graph" / "parts"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def lesson(lesson_id):
    return load_json(LESSONS_DIR / f"{lesson_id}.json")


def number_text(text, expected, *, tolerance=1e-9):
    """Assert that a decimal value in a JSON solution agrees with its derivation."""
    candidates = [float(value.replace(",", ".")) for value in re.findall(r"(?<![\w/])\d+(?:[,.]\d+)?", text)]
    assert any(math.isclose(value, expected, rel_tol=tolerance, abs_tol=tolerance) for value in candidates), (
        f"{expected} is absent from the JSON solution: {text}"
    )


def test_w6_nodes_have_specific_learning_outcomes_and_validate():
    validator = Draft202012Validator(load_json(SCHEMA_DIR / "node.schema.json"))
    nodes = []
    for path in sorted(PARTS_DIR.glob("area-*-esercizi.json")):
        nodes.extend(node for node in load_json(path) if node.get("worker") == "W6")

    assert len(nodes) == 10
    assert len({node["titolo"] for node in nodes}) == len(nodes)
    for node in nodes:
        validator.validate(node)
        assert len(node["sapere"]) >= 40
        assert len(node["saper_fare"]) >= 1
        assert all(len(outcome) >= 20 for outcome in node["saper_fare"])


def test_w6_lessons_validate_and_autonomous_solutions_are_answers():
    schema = load_json(SCHEMA_DIR / "lezione.schema.json")
    figura = load_json(SCHEMA_DIR / "figura.schema.json")
    registry = Registry().with_resource(
        uri="figura.schema.json", resource=Resource.from_contents(figura)
    )
    validator = Draft202012Validator(schema, registry=registry)
    paths = sorted(LESSONS_DIR.glob("es-*.json"))
    assert len(paths) == 10
    for path in paths:
        data = load_json(path)
        validator.validate(data)
        solution = data["esercizio_autonomo"]["soluzione_attesa"]
        assert isinstance(solution, str) and len(solution) > 40
        assert "?" not in solution
        assert "$" in data["spiegazione"]


def test_periodic_rectangles_figure_matches_sinc_coefficients():
    data = lesson("es-spettri-impulsi-periodici")
    solution = data["esercizio_autonomo"]["soluzione_attesa"]
    assert "c₀=1/4" in solution
    assert "c₁=√2/(2π)≈0,2251" in solution

    figure = next(item for item in data["figure"] if item["id"] == "spettro-a-righe")
    Draft202012Validator(load_json(SCHEMA_DIR / "figura.schema.json")).validate(figure)
    bars = {int(n): value for n, value in figure["serie"][0]["punti"]}
    for n in (-5, -4, 4, 5):
        expected = abs(math.sin(n * math.pi / 3) / (n * math.pi / 3))
        assert math.isclose(bars[n], expected, rel_tol=1e-10)
    assert math.isclose(bars[4], 0.2067483358, rel_tol=1e-9)
    assert math.isclose(bars[5], 0.1653986686, rel_tol=1e-9)
    envelope = figure["serie"][1]["punti"]
    assert len(envelope) >= 400
    assert any(-4 < x < -3 for x, _ in envelope)
    assert any(3 < x < 4 for x, _ in envelope)


def test_worked_numerical_results_are_present_in_json():
    inverse = lesson("es-antitrasformata-rettangolare")
    inverse_result = inverse["esercizio_autonomo"]["soluzione_attesa"]
    assert "x(t)=sin(2t)/t" in inverse_result
    assert "x(0)=2" in inverse_result
    assert "π/2 s" in inverse_result
    number_text(inverse_result, 2)

    nyquist = lesson("es-condizione-nyquist")["esercizio_autonomo"]["soluzione_attesa"]
    assert "500π rad/s" in nyquist and "1000π rad/s" in nyquist
    assert "0,006" in nyquist

    derivator = lesson("es-derivatore-processo-gaussiano")["esercizio_autonomo"]["soluzione_attesa"]
    assert "G_y(ω)=3ω²" in derivator
    assert math.isclose(3 * 2**3 / 3, 8)
    number_text(derivator, 8)

    ami = lesson("es-pam-ami")["esercizio_autonomo"]["soluzione_attesa"]
    assert "1, 2 e 3 kHz" in ami
    assert "f=k/T" in ami

    bipolar = lesson("es-pam-bipolare")["esercizio_autonomo"]["soluzione_attesa"]
    assert "G_s(0)=0,002/π≈6,366·10⁻⁴" in bipolar
    assert "500 Hz" in bipolar and "1000 Hz" in bipolar

    rc = lesson("es-rete-rc")["esercizio_autonomo"]["soluzione_attesa"]
    assert "ωc=1000 rad/s" in rc and "|H|=1/√2≈0,7071" in rc
    assert math.isclose(1 / (1000 * 1e-6), 1000)

    cr = lesson("es-rete-cr")["esercizio_autonomo"]["soluzione_attesa"]
    assert "ωc=1000 rad/s" in cr and "fase π/4" in cr
    assert math.isclose(1 / (2000 * 0.25e-6), 2000)

    traffic = lesson("es-teoria-traffico-extra")["worked_example"]["soluzione"]
    assert "N=30 pacchetti medi" in traffic
    assert math.isclose(10 * 3, 30)
    assert lesson("es-teoria-traffico-extra")["esercizio_autonomo"]["soluzione_attesa"].startswith("λ=N/W=9/15=0,6")


def test_a2_convention_and_traffic_source_are_resolved():
    for lesson_id in ("es-pam-ami", "es-pam-bipolare", "es-derivatore-processo-gaussiano"):
        data = lesson(lesson_id)
        text = json.dumps(data, ensure_ascii=False).lower()
        assert "da confermare" not in text
        assert "ancora da confermare" not in text
        assert "non è ancora disponibile" not in text
        assert "ipotesi di lavoro a2" not in text

    traffic_node = next(
        node
        for path in PARTS_DIR.glob("area-*-esercizi.json")
        for node in load_json(path)
        if node["id"] == "es-teoria-traffico-extra"
    )
    assert traffic_node["fonti"] == [{"chiave": "FILE3", "rif": "file3 pp. 44, 53-57"}]
    assert all("spettr" not in item.lower() for item in traffic_node["checklist_ripasso"])


def test_exam_and_quiz_json_validate_and_questions_are_balanced():
    exam = load_json(ROOT / "graph" / "esame.json")
    quiz = load_json(ROOT / "graph" / "quiz.json")
    Draft202012Validator(load_json(SCHEMA_DIR / "esame.schema.json")).validate(exam)
    Draft202012Validator(load_json(SCHEMA_DIR / "quiz.schema.json")).validate(quiz)

    items = quiz["elementi"]
    assert len(items) == 79
    multiple_choice = [item for item in items if item["tipo"] == "scelta_multipla"]
    true_false = [item for item in items if item["tipo"] == "vero_falso"]
    assert len(multiple_choice) == 45
    assert len(true_false) == 28
    assert sum(not item["risposta_corretta"] for item in true_false) == 14

    for item in multiple_choice:
        correct = [option for option in item["opzioni"] if option["id"] == item["corretta"]]
        wrong = [option for option in item["opzioni"] if option["id"] != item["corretta"]]
        assert len(correct) == 1
        assert all(option.get("perche_sbagliata", "").strip() for option in wrong)
        assert all("È sufficiente considerare soltanto" not in option["perche_sbagliata"] for option in wrong)
        lengths = [len(option["testo"]) for option in item["opzioni"]]
        assert max(lengths) <= 1.8 * min(lengths)
        assert len({option["testo"] for option in item["opzioni"]}) == 3

    # Locate conversion items by stable IDs, not array offsets.
    by_id = {item["id"]: item for item in multiple_choice}
    for item_id in ("q-m07", "q-m08"):
        item = by_id[item_id]
        answer = next(option for option in item["opzioni"] if option["id"] == item["corretta"])
        assert answer["testo"]
        assert all(option["id"] != item["corretta"] for option in item["opzioni"] if "perche_sbagliata" in option)

    pcm = by_id["q-pcm-quantizzazione"]
    assert "perche_sbagliata" not in next(option for option in pcm["opzioni"] if option["id"] == pcm["corretta"])
