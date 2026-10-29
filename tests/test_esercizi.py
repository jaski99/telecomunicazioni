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


def _gruppo_latex(testo, inizio):
    """Legge un gruppo bilanciato {…} da una stringa LaTeX."""
    assert testo[inizio] == "{"
    profondita = 1
    indice = inizio + 1
    while indice < len(testo) and profondita:
        if testo[indice] == "{":
            profondita += 1
        elif testo[indice] == "}":
            profondita -= 1
        indice += 1
    assert profondita == 0, f"Gruppo LaTeX non bilanciato: {testo!r}"
    return testo[inizio + 1 : indice - 1], indice


def _frazioni_in_testo(testo):
    """Riduce ricorsivamente frazioni e radici a una forma leggibile per i test."""
    backslash = chr(92)
    risultato = []
    indice = 0
    comandi = {backslash + "frac{": "frac", backslash + "sqrt{": "sqrt"}
    while indice < len(testo):
        comando = next((nome for nome in comandi if testo.startswith(nome, indice)), None)
        if comando is None:
            risultato.append(testo[indice])
            indice += 1
            continue
        corpo, fine = _gruppo_latex(testo, indice + len(comando) - 1)
        corpo = _frazioni_in_testo(corpo)
        if comandi[comando] == "sqrt":
            risultato.append("√" + corpo)
            indice = fine
            continue
        if fine >= len(testo) or testo[fine] != "{":
            risultato.append(testo[indice])
            indice += 1
            continue
        denominatore, fine_den = _gruppo_latex(testo, fine)
        denominatore = _frazioni_in_testo(denominatore)
        numeratore = corpo
        if any(operatore in numeratore for operatore in "+−-") and not numeratore.startswith(("-", "−")):
            numeratore = f"({numeratore})"
        if len(denominatore) > 1 and not denominatore.startswith("√"):
            denominatore = f"({denominatore})"
        risultato.append(f"{numeratore}/{denominatore}")
        indice = fine_den
    return "".join(risultato)


def _normalizza_latex(testo):
    """Normalizza solo la sintassi LaTeX per mantenere leggibili i test numerici."""
    backslash = chr(92)
    testo = _frazioni_in_testo(testo.replace("$", ""))
    for funzione in ("sinc", "arg"):
        testo = testo.replace(backslash + "operatorname{" + funzione + "}", funzione)
    testo = testo.replace(backslash + "mathrm{k}", "k").replace(backslash + "mathrm{F}", "F")
    macro = {
        "omega": "ω", "tau": "τ", "sigma": "σ", "pi": "π", "lambda": "λ",
        "mu": "μ", "phi": "φ", "Delta": "Δ", "Omega": "Ω", "alpha": "α",
        "beta": "β", "gamma": "γ", "sin": "sin", "cos": "cos", "tan": "tan",
        "exp": "exp", "arctan": "atan", "log": "log", "approx": "≈", "cdot": "·",
        "to": "→", "pm": "±", "ne": "≠", "le": "≤", "ge": "≥", "infty": "∞",
        "int": "∫", "sum": "Σ", "lceil": "ceil", "rceil": "ceil",
    }
    for comando, simbolo in sorted(macro.items(), key=lambda item: -len(item[0])):
        testo = testo.replace(backslash + comando, simbolo)
    for comando in ("qquad", "quad", ",", ";", ":"):
        testo = testo.replace(backslash + comando, " ")
    testo = testo.replace(backslash + "!", "").replace(backslash + "left", "").replace(backslash + "right", "")

    pedici = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")
    apici = str.maketrans("0123456789+-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻")
    lettere_pedice = {"n": "ₙ", "m": "ₘ", "y": "ᵧ", "r": "ᵣ", "c": "c"}
    risultato = []
    indice = 0
    while indice < len(testo):
        if testo.startswith("_{", indice) or testo.startswith("^{", indice):
            apice = testo[indice] == "^"
            corpo, fine = _gruppo_latex(testo, indice + 1)
            if apice:
                valore = corpo.translate(apici) if all(char in "0123456789+-" for char in corpo) else "^" + corpo
            elif len(corpo) == 1 and not corpo.isdigit():
                valore = lettere_pedice.get(corpo, "_" + corpo)
            else:
                valore = corpo.translate(pedici)
            risultato.append(valore)
            indice = fine
        else:
            risultato.append(testo[indice])
            indice += 1
    return "".join(risultato)


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
    solution = _normalizza_latex(data["esercizio_autonomo"]["soluzione_attesa"])
    assert "c₀=1/4" in solution
    assert re.search(r"c₁=√2/\(2π\)≈\s*0,2251", solution)

    figure = next(item for item in data["figure"] if item["id"] == "spettro-a-righe")
    Draft202012Validator(load_json(SCHEMA_DIR / "figura.schema.json")).validate(figure)
    bars = {int(n): value for n, value in figure["serie"][0]["punti"]}
    for n in (-5, -4, 4, 5):
        expected = abs(math.sin(n * math.pi / 3) / (n * math.pi / 3))
        assert math.isclose(bars[n], expected, rel_tol=1e-10)
    assert math.isclose(bars[4], 0.2067483358, rel_tol=1e-9)
    assert math.isclose(bars[5], 0.1653986686, rel_tol=1e-9)
    assert bars[-3] == bars[3] == 0
    envelope = figure["serie"][1]["punti"]
    envelope_at_harmonics = {x: y for x, y in envelope if x in (-3, 3)}
    assert envelope_at_harmonics == {-3.0: 0, 3.0: 0}
    assert len(envelope) >= 400
    assert any(-4 < x < -3 for x, _ in envelope)
    assert any(3 < x < 4 for x, _ in envelope)


def test_worked_example_results_are_recomputed_from_json_parameters():
    # E1: derive c1 and c2 from the A and duty-cycle values in the guided problem.
    periodic = lesson("es-spettri-impulsi-periodici")["worked_example"]
    periodic_problem = _normalizza_latex(periodic["problema"])
    periodic_passi = [_normalizza_latex(line) for line in periodic["passi"]]
    amplitude = float(re.search(r"A=(\d+(?:[.,]\d+)?)", periodic_problem).group(1).replace(",", "."))
    divisor = int(re.search(r"τ=T/(\d+)", periodic_problem).group(1))
    duty = 1 / divisor
    def sinc(value):
        return 1.0 if value == 0 else math.sin(value) / value
    for harmonic, expected in ((1, amplitude * duty * sinc(math.pi * duty)),
                               (2, amplitude * duty * sinc(2 * math.pi * duty))):
        step = next(line for line in periodic_passi if line.startswith(f"Per n={harmonic}:"))
        reported = float(re.search(r"≈\s*([0-9]+,[0-9]+)", step).group(1).replace(",", "."))
        assert math.isclose(reported, expected, rel_tol=2e-3)
    assert "c₀=Aτ/T=2/3" in periodic_passi[2]

    # E2: transform magnitude, first zero, and sample value all follow A and τ in JSON.
    pulse = lesson("es-spettri-impulso-rettangolare")["worked_example"]
    pulse_problem = _normalizza_latex(pulse["problema"])
    pulse_passi = [_normalizza_latex(line) for line in pulse["passi"]]
    amp = float(re.search(r"A=(\d+(?:[.,]\d+)?)", pulse_problem).group(1).replace(",", "."))
    tau_ms = float(re.search(r"τ=(\d+(?:[.,]\d+)?) ms", pulse_problem).group(1).replace(",", "."))
    tau = tau_ms / 1000
    x0_step = next(line for line in pulse_passi if "X(0)=Aτ=" in line)
    x0_reported = float(re.search(r"X\(0\)=Aτ=([0-9]+,[0-9]+)", x0_step).group(1).replace(",", "."))
    assert math.isclose(x0_reported, amp * tau, rel_tol=1e-5)
    zero_step = next(line for line in pulse_passi if "primo è ω=" in line)
    zero_reported = float(re.search(r"≈\s*([0-9]+,[0-9]+) rad/s", zero_step).group(1).replace(",", "."))
    assert math.isclose(zero_reported, 2 * math.pi / tau, rel_tol=1e-5)
    sample_step = next(line for line in pulse_passi if "0,00382" in line and "Aτ" in line)
    sample_reported = float(re.search(r"≈\s*([0-9]+,[0-9]+)", sample_step).group(1).replace(",", "."))
    assert math.isclose(sample_reported, amp * tau * 2 / math.pi, rel_tol=1e-3)

    # E3: the finite value at the origin uses X0 and omega_m from the worked problem.
    inverse = lesson("es-antitrasformata-rettangolare")["worked_example"]
    inverse_problem = _normalizza_latex(inverse["problema"])
    inverse_passi = [_normalizza_latex(line) for line in inverse["passi"]]
    x0 = float(re.search(r"X₀=(\d+(?:[.,]\d+)?)", inverse_problem).group(1).replace(",", "."))
    omega_m = float(re.search(r"ωₘ=(\d+(?:[.,]\d+)?)", inverse_problem).group(1).replace(",", "."))
    limit_step = next(line for line in inverse_passi if "x(0)=" in line and "2,546" in line)
    limit_reported = float(re.search(r"≈\s*([0-9]+,[0-9]+)", limit_step).group(1).replace(",", "."))
    assert math.isclose(limit_reported, x0 * omega_m / math.pi, rel_tol=2e-4)
    assert "primi sono ±π/4 s" in next(line for line in inverse_passi if "primi sono" in line)

    # E5/E6: read R and C from each problem before checking the reported cutoff.
    for lesson_id in ("es-rete-rc", "es-rete-cr"):
        worked = lesson(lesson_id)["worked_example"]
        problem = _normalizza_latex(worked["problema"])
        steps = [_normalizza_latex(line) for line in worked["passi"]]
        resistance_kohm = float(re.search(r"R=(\d+(?:[.,]\d+)?) kΩ", problem).group(1).replace(",", "."))
        capacitance_uf = float(re.search(r"C=(\d+(?:[.,]\d+)?) μF", problem).group(1).replace(",", "."))
        expected_cutoff = 1 / (resistance_kohm * 1000 * capacitance_uf * 1e-6)
        cutoff_step = next(line for line in steps if "pulsazione di taglio" in line)
        cutoff_reported = float(re.search(r"=(\d+(?:[.,]\d+)?) rad/s", cutoff_step).group(1).replace(",", "."))
        assert math.isclose(cutoff_reported, expected_cutoff, rel_tol=1e-9)

    # E7: variance and Gaussian exponent use the parameters stated in the worked example.
    derivator = lesson("es-derivatore-processo-gaussiano")["worked_example"]
    problem = _normalizza_latex(derivator["problema"])
    steps = [_normalizza_latex(line) for line in derivator["passi"]]
    g0 = float(re.search(r"G₀=(\d+(?:[.,]\d+)?)", problem).group(1).replace(",", "."))
    omega_m = float(re.search(r"ωₘ=(\d+(?:[.,]\d+)?)", problem).group(1).replace(",", "."))
    variance = g0 * omega_m**3 / 3
    variance_step = next(line for line in steps if "σ²=" in line and "18" in line)
    variance_reported = float(re.search(r"=([0-9]+)\.$", variance_step).group(1))
    assert math.isclose(variance_reported, variance)
    density_step = next(line for line in steps if "pᵧ(y)=" in line)
    gaussian_denominator = float(re.search(r"exp\(-y²/\(?([0-9]+)\)?\)", density_step).group(1))
    assert math.isclose(gaussian_denominator, 2 * variance)

    # E8: calculate the autonomous zero-frequency level and first nulls from its own T.
    bipolar = lesson("es-pam-bipolare")
    t_ms = float(re.search(r"T=(\d+(?:[.,]\d+)?) ms", bipolar["esercizio_autonomo"]["titolo"]).group(1).replace(",", "."))
    t = t_ms / 1000
    reported = _normalizza_latex(bipolar["esercizio_autonomo"]["soluzione_attesa"])
    scientific = re.search(r"≈\s*([0-9]+,[0-9]+)·\s*10⁻([⁰¹²³⁴⁵⁶⁷⁸⁹]+)", reported)
    level = float(scientific.group(1).replace(",", "."))
    exponent = int(scientific.group(2).translate(str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789")))
    assert math.isclose(t / math.pi, level * 10**(-exponent), rel_tol=2e-4)
    zero_hz = [int(value) for value in re.findall(r"(\d+) Hz", reported)]
    assert zero_hz == [int(1 / t), int(2 / t)]
    bipolar_worked = bipolar["worked_example"]
    worked_t_ms = float(re.search(r"T=(\d+(?:[.,]\d+)?) ms", bipolar_worked["problema"]).group(1).replace(",", "."))
    first_null_step = next(
        line for line in map(_normalizza_latex, bipolar_worked["passi"]) if "primo è" in line
    )
    first_null_pi = float(re.search(r"primo è (\d+)π rad/s", first_null_step).group(1))
    assert math.isclose(first_null_pi, 2 / (worked_t_ms / 1000), rel_tol=1e-9)

    # E9: test guided-example and autonomous nulls against their different T values.
    ami = lesson("es-pam-ami")
    worked = ami["worked_example"]
    guided_problem = _normalizza_latex(worked["problema"])
    guided_t_ms = float(re.search(r"T=(\d+(?:[.,]\d+)?) ms", guided_problem).group(1).replace(",", "."))
    last_step = next(
        line for line in map(_normalizza_latex, worked["passi"]) if "Fino a 4π/T" in line
    )
    assert "0, 2π/T e 4π/T" in last_step
    assert math.isclose(1 / (guided_t_ms / 1000), 500)
    autonomous_title = _normalizza_latex(ami["esercizio_autonomo"]["titolo"])
    autonomous_t_ms = float(re.search(r"T=(\d+(?:[.,]\d+)?) ms", autonomous_title).group(1).replace(",", "."))
    autonomous = _normalizza_latex(ami["esercizio_autonomo"]["soluzione_attesa"])
    k_values = [int(value) for value in re.search(r"per k=(\d+),(\d+),(\d+)", autonomous).groups()]
    reported_khz = [int(value) for value in re.search(r"a f=k/T: (\d+), (\d+) e (\d+) kHz", autonomous).groups()]
    expected_khz = [round(k / (autonomous_t_ms / 1000) / 1000) for k in k_values]
    assert reported_khz == expected_khz

    # Little: parse the arrival rate and mean residence time from its exercise data.
    traffic = lesson("es-teoria-traffico-extra")["worked_example"]
    traffic_problem = _normalizza_latex(traffic["problema"])
    traffic_passi = [_normalizza_latex(line) for line in traffic["passi"]]
    rate = float(re.search(r"flusso medio di (\d+(?:[.,]\d+)?) pacchetti/s", traffic_problem).group(1).replace(",", "."))
    residence = float(re.search(r"permanenza media di (\d+(?:[.,]\d+)?) s", traffic_problem).group(1).replace(",", "."))
    little_step = next(line for line in traffic_passi if "N=(" in line)
    population = float(re.search(r"=([0-9]+) pacchetti", little_step).group(1))
    assert math.isclose(population, rate * residence)


def test_autonomous_results_include_correct_frequency_units():
    # The autonomo E7 uses G0=3 and omega_m=2 (distinct from the guided E7 example).
    derivator = lesson("es-derivatore-processo-gaussiano")
    parameters = _normalizza_latex(derivator["esercizio_autonomo"]["titolo"])
    g0 = float(re.search(r"G₀=(\d+(?:[.,]\d+)?)", parameters).group(1).replace(",", "."))
    omega_m = float(re.search(r"ωₘ=(\d+(?:[.,]\d+)?)", parameters).group(1).replace(",", "."))
    variance = g0 * omega_m**3 / 3
    autonomous_result = _normalizza_latex(derivator["esercizio_autonomo"]["soluzione_attesa"])
    reported_variance = float(re.search(r"σ²=.*?=([0-9]+)", autonomous_result).group(1))
    assert math.isclose(variance, reported_variance)

    inverse = _normalizza_latex(lesson("es-antitrasformata-rettangolare")["esercizio_autonomo"]["soluzione_attesa"])
    assert "x(t)=sin(2t)/t" in inverse and "x(0)=2" in inverse and "π/2 s" in inverse

    nyquist = _normalizza_latex(lesson("es-condizione-nyquist")["esercizio_autonomo"]["soluzione_attesa"])
    assert "500π rad/s" in nyquist and "1000π rad/s" in nyquist and "0,006" in nyquist

    rc = _normalizza_latex(lesson("es-rete-rc")["esercizio_autonomo"]["soluzione_attesa"])
    assert "ωc=1000 rad/s" in rc and re.search(r"\|H\|=1/√2≈\s*0,7071", rc)
    cr = _normalizza_latex(lesson("es-rete-cr")["esercizio_autonomo"]["soluzione_attesa"])
    assert "ωc=1000 rad/s" in cr and "fase π/4" in cr

    bipolar = _normalizza_latex(lesson("es-pam-bipolare")["esercizio_autonomo"]["soluzione_attesa"])
    assert re.search(r"G_s\(0\)=0,002/\(?π\)?≈\s*6,366·\s*10⁻⁴", bipolar)
    ami = _normalizza_latex(lesson("es-pam-ami")["esercizio_autonomo"]["soluzione_attesa"])
    assert "1, 2 e 3 kHz" in ami


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



def test_long_text_is_not_reused_across_exercise_lessons():
    owners = {}
    def visit(value, path):
        if isinstance(value, dict):
            for child in value.values():
                visit(child, path)
        elif isinstance(value, list):
            for child in value:
                visit(child, path)
        elif isinstance(value, str) and len(value) > 30:
            owners.setdefault(value, set()).add(path.name)

    for path in sorted(LESSONS_DIR.glob("es-*.json")):
        visit(load_json(path), path)
    repeated = {text: files for text, files in owners.items() if len(files) > 1}
    assert not repeated, "Long identical text reused across exercise lessons: " + repr(repeated)


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
