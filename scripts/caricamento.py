import json
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "schema"
GRAPH_DIR = ROOT / "graph"
PARTS_DIR = GRAPH_DIR / "parts"
LEZIONI_DIR = GRAPH_DIR / "lezioni"
DIM_DIR = GRAPH_DIR / "dimostrazioni"


def load_schema(name: str) -> dict:
    return json.loads((SCHEMA_DIR / name).read_text(encoding="utf-8"))


def validator_for(schema: dict) -> Draft202012Validator:
    from referencing import Registry, Resource

    figura_schema = json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
    registry = Registry().with_resource(
        uri="https://jaski99.github.io/telecomunicazioni/schema/figura.schema.json",
        resource=Resource.from_contents(figura_schema),
    )
    registry = registry.with_resource(uri="figura.schema.json", resource=Resource.from_contents(figura_schema))
    return Draft202012Validator(schema, registry=registry)


def collect_nodes() -> list:
    nodi = []
    if not PARTS_DIR.exists():
        return nodi
    for f in sorted(PARTS_DIR.glob("*.json")):
        nome = f.name
        if not nome.startswith("area-"):
            raise ValueError(f"File in parts non conforme: {nome}")
        try:
            resto = nome[len("area-") :]
            n_str = resto.split(".")[0].split("-")[0]
            n = int(n_str)
        except Exception:
            raise ValueError(f"Nome file parts non valido: {nome}")
        if not 1 <= n <= 7:
            raise ValueError(f"Area fuori range 1-7 in file {nome}")
        data = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError(f"File {f} deve contenere un array di nodi")
        for nodo in data:
            if nodo.get("area") != n:
                raise ValueError(f"Nodo {nodo.get('id')} in {nome} ha area diversa da {n}")
            nodo["_source"] = str(f)
            nodi.append(nodo)
    return nodi


def load_meta() -> dict:
    p = GRAPH_DIR / "meta.json"
    if not p.exists():
        raise FileNotFoundError("graph/meta.json non trovato")
    return json.loads(p.read_text(encoding="utf-8"))


def load_lezioni() -> dict:
    lezioni = {}
    if not LEZIONI_DIR.exists():
        return lezioni
    for f in LEZIONI_DIR.glob("*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        lid = data.get("id")
        if not lid:
            raise ValueError(f"Lezione senza id in {f}")
        if lid in lezioni:
            raise ValueError(f"Lezione duplicata per id {lid}")
        lezioni[lid] = data
    return lezioni


def load_dimostrazioni() -> dict:
    dims = {}
    if not DIM_DIR.exists():
        return dims
    for f in DIM_DIR.glob("*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        did = data.get("id")
        if not did:
            raise ValueError(f"Dimostrazione senza id in {f}")
        if did in dims:
            raise ValueError(f"Dimostrazione duplicata per id {did}")
        dims[did] = data
    return dims


def load_esame() -> list | None:
    p = GRAPH_DIR / "esame.json"
    if not p.exists():
        return None
    data = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "prove" in data:
        return data["prove"]
    if isinstance(data, list):
        return data
    return data


def collect_nodes_with_dirs(parts_dir: Path) -> list:
    nodi = []
    if not parts_dir.exists():
        return nodi
    for f in sorted(parts_dir.glob("*.json")):
        nome = f.name
        if not nome.startswith("area-"):
            raise ValueError(f"File in parts non conforme: {nome}")
        n = int(nome[len("area-") :].split(".")[0].split("-")[0])
        if not 1 <= n <= 7:
            raise ValueError(f"Area fuori range in file {nome}")
        data = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError(f"File {f} deve contenere array")
        for nodo in data:
            if nodo.get("area") != n:
                raise ValueError(f"Nodo {nodo.get('id')} area diversa da {n}")
            nodo["_source"] = str(f)
            nodi.append(nodo)
    return nodi


def load_dim_with_dirs(dir_path: Path, kind: str) -> dict:
    out = {}
    if not dir_path.exists():
        return out
    for f in dir_path.glob("*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        did = data.get("id")
        if not did:
            raise ValueError(f"{kind} senza id in {f}")
        if did in out:
            raise ValueError(f"{kind} duplicata per id {did}")
        out[did] = data
    return out


def load_esame_with_dir(graph_dir: Path) -> list | None:
    p = graph_dir / "esame.json"
    if not p.exists():
        return None
    data = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "prove" in data:
        return data["prove"]
    return data
