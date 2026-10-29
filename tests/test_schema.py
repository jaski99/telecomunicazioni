"""Test di schema JSON Draft 2020-12 — CONTRACTS §3.1-3.4."""

import json
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "schema"
FIXTURES = Path(__file__).parent / "fixtures"


def _load(name):
    return json.loads((SCHEMA_DIR / name).read_text(encoding="utf-8"))


def test_schemi_esistono():
    for name in ["node.schema.json", "lezione.schema.json", "dimostrazione.schema.json", "figura.schema.json"]:
        assert (SCHEMA_DIR / name).exists(), f"Schema mancante: {name}"


def test_schemi_draft_2020_12():
    for name in ["node.schema.json", "lezione.schema.json", "dimostrazione.schema.json", "figura.schema.json"]:
        schema = _load(name)
        assert schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema", f"{name} deve usare Draft 2020-12"
        assert schema.get("additionalProperties") is False, f"{name} deve avere additionalProperties false"


def test_node_schema_valido_con_fixture():
    schema = _load("node.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "nodo_concetto.json").read_text(encoding="utf-8"))
    validator.validate(data)


def test_node_schema_rifiuta_additional_properties():
    schema = _load("node.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "invalidi" / "nodo_extra.json").read_text(encoding="utf-8"))
    assert not validator.is_valid(data), "Deve rifiutare campo extra"


def test_node_schema_rifiuta_id_non_kebab():
    schema = _load("node.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "nodo_concetto.json").read_text(encoding="utf-8"))
    data["id"] = "Bad_ID"
    assert not validator.is_valid(data)


def test_lezione_schema_valida():
    schema = _load("lezione.schema.json")
    # con registry per figura
    from referencing import Registry, Resource

    figura = json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
    registry = Registry().with_resource(uri="figura.schema.json", resource=Resource.from_contents(figura))
    validator = Draft202012Validator(schema, registry=registry)
    data = json.loads((FIXTURES / "lezione_concetto.json").read_text(encoding="utf-8"))
    validator.validate(data)


def test_lezione_schema_rifiuta_spiegazione_corta():
    schema = _load("lezione.schema.json")
    from referencing import Registry, Resource

    figura = json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
    registry = Registry().with_resource(uri="figura.schema.json", resource=Resource.from_contents(figura))
    validator = Draft202012Validator(schema, registry=registry)
    data = json.loads((FIXTURES / "lezione_concetto.json").read_text(encoding="utf-8"))
    data["spiegazione"] = "troppo corta"
    assert not validator.is_valid(data)


def test_dimostrazione_schema_valida():
    schema = _load("dimostrazione.schema.json")
    from referencing import Registry, Resource

    figura = json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
    registry = Registry().with_resource(uri="figura.schema.json", resource=Resource.from_contents(figura))
    validator = Draft202012Validator(schema, registry=registry)
    data = json.loads((FIXTURES / "dimostrazione_valida.json").read_text(encoding="utf-8"))
    validator.validate(data)


def test_dimostrazione_schema_rifiuta_stato_errato():
    schema = _load("dimostrazione.schema.json")
    from referencing import Registry, Resource

    figura = json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
    registry = Registry().with_resource(uri="figura.schema.json", resource=Resource.from_contents(figura))
    validator = Draft202012Validator(schema, registry=registry)
    data = json.loads((FIXTURES / "dimostrazione_valida.json").read_text(encoding="utf-8"))
    data["verifica"]["stato"] = "stato_inesistente"
    assert not validator.is_valid(data)


def test_figura_schema_grafico_valido():
    schema = _load("figura.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "figura_grafico.json").read_text(encoding="utf-8"))
    validator.validate(data)


def test_figura_schema_blocchi_valido():
    schema = _load("figura.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "figura_blocchi.json").read_text(encoding="utf-8"))
    validator.validate(data)


def test_figura_schema_temporale_valido():
    schema = _load("figura.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "figura_temporale.json").read_text(encoding="utf-8"))
    validator.validate(data)


def test_figura_schema_rifiuta_titolo_corto():
    schema = _load("figura.schema.json")
    validator = Draft202012Validator(schema)
    data = json.loads((FIXTURES / "figura_grafico.json").read_text(encoding="utf-8"))
    data["titolo"] = "ab"
    assert not validator.is_valid(data)


def test_schemi_hanno_required_e_tipi():
    node = _load("node.schema.json")
    assert "id" in node["required"]
    assert "area" in node["required"]
    assert node["properties"]["area"]["minimum"] == 1
    assert node["properties"]["area"]["maximum"] == 7
    assert set(node["properties"]["tipo"]["enum"]) == {"concetto", "dimostrazione", "tipo_esercizio"}

    lez = _load("lezione.schema.json")
    assert "spiegazione" in lez["required"]
    assert lez["properties"]["spiegazione"]["minLength"] >= 1200

    dim = _load("dimostrazione.schema.json")
    assert "passi" in dim["required"]
    assert dim["properties"]["passi"]["minItems"] >= 4
    assert "figure" in dim["required"]
    assert dim["properties"]["figure"]["minItems"] >= 1

    fig = _load("figura.schema.json")
    assert "tipo" in fig["required"]
    assert set(fig["properties"]["tipo"]["enum"]) == {"grafico", "blocchi", "temporale"}
