"""Test che vieta skip/xfail/--ignore/-k not/continue-on-error."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKFLOW = ROOT / ".github" / "workflows" / "pages.yml"
PYTEST_INI = ROOT / "pytest.ini"


def test_workflow_esiste():
    assert WORKFLOW.exists(), "Workflow pages.yml mancante"


def test_workflow_vieta_continue_on_error():
    testo = WORKFLOW.read_text(encoding="utf-8")
    assert "continue-on-error" not in testo, "continue-on-error vietato"


def test_workflow_non_ignora_test():
    testo = WORKFLOW.read_text(encoding="utf-8")
    assert "--ignore" not in testo, "--ignore vietato in workflow"
    # -k not e2e vietato
    assert not re.search(r"-k\s+['\"]?not", testo), "-k 'not e2e' vietato"
    assert "xfail" not in testo.lower()


def test_workflow_ha_passi_obbligatori():
    testo = WORKFLOW.read_text(encoding="utf-8")
    assert "setup-python" in testo
    assert "3.12" in testo
    assert "setup-node" in testo
    assert "22" in testo
    assert "pip install -r requirements.txt" in testo
    assert "playwright" in testo
    assert "playwright install --with-deps chromium" in testo
    assert "kg.py check" in testo
    assert "web/build.sh" in testo
    assert "npm test" in testo
    assert "pytest" in testo
    # deploy solo da main
    assert "refs/heads/main" in testo


def test_workflow_hashfiles_condition():
    testo = WORKFLOW.read_text(encoding="utf-8")
    # finché web non esiste, i passi web hanno condizione hashFiles
    assert "hashFiles('web/package.json')" in testo


def test_pytest_ini_testpaths():
    assert PYTEST_INI.exists(), "pytest.ini mancante"
    testo = PYTEST_INI.read_text(encoding="utf-8")
    assert "testpaths" in testo
    assert "tests" in testo
    assert "web/tests" in testo
    # vietati --ignore, -k not
    assert "--ignore" not in testo
    assert "-k" not in testo or "not" not in testo


def test_nessun_skip_xfail_nei_test():
    # cerca skip, xfail nei file tests
    tests_dir = ROOT / "tests"
    for f in tests_dir.rglob("*.py"):
        if f.name == "test_ci.py":
            continue
        testo = f.read_text(encoding="utf-8")
        # vietati: @pytest.mark.skip, skipif, xfail, skip(
        assert "pytest.mark.skip" not in testo, f"skip vietato in {f}"
        assert "pytest.mark.xfail" not in testo, f"xfail vietato in {f}"
        assert re.search(r"\bskip\s*\(", testo) is None, f"skip() vietato in {f}"
        # xfail come marker
        assert "xfail" not in testo.lower(), f"xfail vietato in {f}"


def test_workflow_non_installa_libasound2_a_mano():
    testo = WORKFLOW.read_text(encoding="utf-8")
    assert "libasound2" not in testo, "non installare libasound2 a mano su Ubuntu 24.04"


def test_gitignore_contiene_voci_obbligatorie():
    gi = ROOT / ".gitignore"
    assert gi.exists(), ".gitignore mancante"
    testo = gi.read_text(encoding="utf-8")
    assert "web/graph.json" in testo
    assert "web/quiz.json" in testo
    assert "*.pdf" in testo


def test_requirements_contiene_jsonschema_pytest():
    req = ROOT / "requirements.txt"
    assert req.exists()
    testo = req.read_text(encoding="utf-8")
    assert "jsonschema" in testo.lower()
    assert "pytest" in testo.lower()
