"""Fixture condivise per i test W1."""

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
# Assicura che 'scripts' sia importabile
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

SCHEMA_DIR = ROOT / "schema"
GRAPH_DIR = ROOT / "graph"
FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def contratto():
    from scripts.contratto import carica_contratto

    return carica_contratto()


@pytest.fixture
def node_schema():
    return json.loads((SCHEMA_DIR / "node.schema.json").read_text(encoding="utf-8"))


@pytest.fixture
def lezione_schema():
    return json.loads((SCHEMA_DIR / "lezione.schema.json").read_text(encoding="utf-8"))


@pytest.fixture
def dimostrazione_schema():
    return json.loads((SCHEMA_DIR / "dimostrazione.schema.json").read_text(encoding="utf-8"))


@pytest.fixture
def figura_schema():
    return json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
