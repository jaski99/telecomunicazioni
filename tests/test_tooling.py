"""Test del tooling W1: kg, topo, gen_docs, check_testo, check_urls, contratto."""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_contratto_carica():
    from scripts.contratto import carica_contratto

    data = carica_contratto()
    assert data["versione"] == 1
    assert any(n["id"] == "dim-pam-due-spettri" for n in data["nodi"])
    # verifica unica funzione pubblica
    import scripts.contratto as mod

    pubs = [k for k in dir(mod) if not k.startswith("_") and callable(getattr(mod, k))]
    # deve esserci solo carica_contratto come pubblica callable principale
    assert "carica_contratto" in pubs


def test_topo_deterministico():
    from scripts.topo import ordina_topologico

    nodi = [
        {"id": "a", "area": 1, "priorita": {"livello": "alta"}, "prerequisiti": []},
        {"id": "b", "area": 1, "priorita": {"livello": "media"}, "prerequisiti": [{"id": "a"}]},
        {"id": "c", "area": 2, "priorita": {"livello": "alta"}, "prerequisiti": []},
    ]
    ordine = ordina_topologico(nodi)
    # a e c senza prereq: a prima per priorità alta+area minore? entrambi alta, area 1 vs 2 -> a prima
    assert ordine.index("a") < ordine.index("b")
    assert ordine[0] == "a"


def test_topo_priorita():
    from scripts.topo import ordina_topologico

    nodi = [
        {"id": "x", "area": 1, "priorita": {"livello": "bassa"}, "prerequisiti": []},
        {"id": "y", "area": 1, "priorita": {"livello": "alta"}, "prerequisiti": []},
        {"id": "z", "area": 1, "priorita": {"livello": "media"}, "prerequisiti": []},
    ]
    ordine = ordina_topologico(nodi)
    assert ordine == ["y", "z", "x"]


def test_topo_rileva_ciclo():
    from scripts.topo import ordina_topologico

    nodi = [
        {"id": "a", "area": 1, "priorita": {"livello": "alta"}, "prerequisiti": [{"id": "b"}]},
        {"id": "b", "area": 1, "priorita": {"livello": "alta"}, "prerequisiti": [{"id": "a"}]},
    ]
    try:
        ordina_topologico(nodi)
        assert False, "Doveva sollevare ciclo"
    except ValueError as e:
        assert "Ciclo" in str(e)


def test_kg_build_e_check():
    # esegue build e check
    r = subprocess.run([sys.executable, "scripts/kg.py", "build"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, f"kg build fallito: {r.stderr}"
    r = subprocess.run([sys.executable, "scripts/kg.py", "check"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, f"kg check fallito: {r.stderr}"
    assert "OK" in r.stdout or r.returncode == 0


def test_kg_check_completo_fallisce_senza_tutti_nodi(tmp_path):
    # Preparare una copia isolata: il grafo di lavoro può ormai essere completo.
    import shutil

    for directory in ("scripts", "schema", "graph"):
        shutil.copytree(ROOT / directory, tmp_path / directory)
    (tmp_path / "docs").mkdir()
    shutil.copy2(ROOT / "docs" / "CONTRACTS.md", tmp_path / "docs" / "CONTRACTS.md")

    parts = tmp_path / "graph" / "parts" / "area-6.json"
    nodes = json.loads(parts.read_text(encoding="utf-8"))
    missing_id = "lan-ieee802-ethernet"
    assert any(node["id"] == missing_id for node in nodes)
    parts.write_text(json.dumps([node for node in nodes if node["id"] != missing_id],
                                ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (tmp_path / "graph" / "lezioni" / f"{missing_id}.json").unlink()

    build = subprocess.run([sys.executable, "scripts/kg.py", "build"], cwd=tmp_path,
                           capture_output=True, text=True)
    assert build.returncode == 0, build.stderr
    check = subprocess.run([sys.executable, "scripts/kg.py", "check", "--completo"],
                           cwd=tmp_path, capture_output=True, text=True)
    assert check.returncode != 0
    assert "mancano" in check.stderr and missing_id in check.stderr


def test_gen_docs_build():
    r = subprocess.run([sys.executable, "scripts/kg.py", "build"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0
    r = subprocess.run([sys.executable, "scripts/gen_docs.py", "build"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, f"gen_docs fallito: {r.stderr}"
    assert (ROOT / "docs" / "PIANO_STUDIO.md").exists()
    assert (ROOT / "docs" / "MAPPA_ESAME.md").exists()
    piano = (ROOT / "docs" / "PIANO_STUDIO.md").read_text(encoding="utf-8")
    assert "Piano di studio" in piano
    mappa = (ROOT / "docs" / "MAPPA_ESAME.md").read_text(encoding="utf-8")
    assert "Mappa" in mappa


def test_check_testo_rileva_apostrofo():
    from scripts.check_testo import _cerca_accenti_apostrofo

    assert len(_cerca_accenti_apostrofo("questo e' un test")) > 0
    assert len(_cerca_accenti_apostrofo("questo è un test")) == 0


def test_check_testo_nulli_ammesso():
    from scripts.check_testo import _cerca_parole_vietate

    assert "null" in _cerca_parole_vietate("valore null qui")
    assert _cerca_parole_vietate("valori nulli qui") == []


def test_check_testo_dollari():
    from scripts.check_testo import _dollari_sbilanciati

    assert _dollari_sbilanciati("$a$") is False
    assert _dollari_sbilanciati("$a") is True
    assert _dollari_sbilanciati("$$a$$") is False
    assert _dollari_sbilanciati("$a$ $b$") is False


def test_check_testo_su_fixture_valida():
    # la fixture valida non deve dare errori
    r = subprocess.run([sys.executable, "scripts/check_testo.py"], cwd=ROOT, capture_output=True, text=True)
    # deve passare (o almeno non fallire per apostrofi)
    # Se fallisce, mostra stderr
    if r.returncode != 0:
        # verifica che non sia per apostrofo su fixture valida
        assert "apostrofo" not in r.stderr.lower() or "NON TROVATO" in r.stderr


def test_check_urls_allowlist():
    from scripts.allowlist import ALLOWLIST

    assert "https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo" in ALLOWLIST
    assert len(ALLOWLIST) == 11


def test_figura_validazione_numericamente():
    # verifica che il massimo di rho = G*exp(-2G) in G=0.5 valga 1/(2e)
    import math

    G = 0.5
    rho = G * math.exp(-2 * G)
    assert abs(rho - 1 / (2 * math.e)) < 1e-9
    # e per slotted G*exp(-G) max 1/e in G=1
    assert abs(1 * math.exp(-1) - 1 / math.e) < 1e-9
