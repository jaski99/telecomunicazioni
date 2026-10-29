#!/usr/bin/env python3
import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

_kg_root = Path(__file__).resolve().parent.parent
if str(_kg_root) not in sys.path:
    sys.path.insert(0, str(_kg_root))

from scripts.allowlist import AREE_TITOLI
from scripts.caricamento import (
    GRAPH_DIR,
    collect_nodes,
    collect_nodes_with_dirs,
    load_dim_with_dirs,
    load_dimostrazioni,
    load_esame,
    load_esame_with_dir,
    load_lezioni,
    load_meta,
    load_schema,
    validator_for,
)
from scripts.cicli import detect_cycle
from scripts.contratto import carica_contratto
from scripts.figure import valida_figure
from scripts.regole import valida_dimostrazioni, valida_esame, valida_lezioni, valida_nodi


def build_graph(base: Path | None = None) -> dict:
    if base is not None:
        graph_dir = base / "graph"
        meta = json.loads((graph_dir / "meta.json").read_text(encoding="utf-8"))
        contratto = carica_contratto()
        contratto_map = {n["id"]: n for n in contratto["nodi"]}
        contratto_ids = set(contratto_map.keys())
        nodi = collect_nodes_with_dirs(graph_dir / "parts")
        lezioni = load_dim_with_dirs(graph_dir / "lezioni", "lezione")
        dims = load_dim_with_dirs(graph_dir / "dimostrazioni", "dimostrazione")
        esame_prove = load_esame_with_dir(graph_dir)
    else:
        contratto = carica_contratto()
        contratto_map = {n["id"]: n for n in contratto["nodi"]}
        contratto_ids = set(contratto_map.keys())
        meta = load_meta()
        if "fonti" not in meta:
            raise ValueError("meta.json deve contenere 'fonti'")
        nodi = collect_nodes()
        lezioni = load_lezioni()
        dims = load_dimostrazioni()
        esame_prove = load_esame()
    node_validator = validator_for(load_schema("node.schema.json"))
    valida_nodi(nodi, contratto_map, contratto_ids, meta, node_validator)
    present_map = {n["id"]: n for n in nodi}
    cycle = detect_cycle(present_map, contratto_map)
    if cycle:
        raise ValueError(f"Ciclo rilevato: {' -> '.join(cycle)}")
    lezione_validator = validator_for(load_schema("lezione.schema.json"))
    dim_validator = validator_for(load_schema("dimostrazione.schema.json"))
    valida_lezioni(lezioni, present_map, lezione_validator)
    valida_dimostrazioni(dims, present_map, contratto_ids, meta, dim_validator, contratto_map)
    for did, dim in dims.items():
        valida_figure(dim, did)
    for nodo in nodi:
        if nodo["tipo"] == "dimostrazione" and nodo["id"] not in dims:
            raise ValueError(f"Nodo dimostrazione {nodo['id']} senza file")
    if esame_prove is not None:
        valida_esame(esame_prove, contratto_ids)
    citati = {p["id"] for nodo in nodi for p in nodo.get("prerequisiti", [])}
    pendenti = sorted(citati - set(present_map.keys()), key=lambda pid: (contratto_map[pid]["area"], pid))
    aree = [{"id": n, "titolo": AREE_TITOLI[n]} for n in range(1, 8)]
    prove_per_nodo = defaultdict(list)
    if esame_prove is not None:
        for prova in esame_prove:
            for nid in prova.get("nodi", []):
                prove_per_nodo[nid].append(prova["id"])
        for nid in prove_per_nodo:
            prove_per_nodo[nid] = sorted(prove_per_nodo[nid])
    nodi_out = []
    for nodo in sorted(nodi, key=lambda n: (n["area"], n["id"])):
        clean = {k: v for k, v in nodo.items() if not k.startswith("_")}
        if clean["id"] in lezioni:
            clean["lezione"] = lezioni[clean["id"]]
        if clean["id"] in dims:
            clean["dimostrazione"] = dims[clean["id"]]
        if clean["id"] in prove_per_nodo:
            clean["domande_esame"] = prove_per_nodo[clean["id"]]
        elif esame_prove is None:
            clean["domande_esame"] = contratto_map[clean["id"]].get("domande_esame", [])
        else:
            clean["domande_esame"] = prove_per_nodo.get(clean["id"], [])
        nodi_out.append(clean)
    return {
        "versione": contratto.get("versione", 1),
        "meta": meta,
        "aree": aree,
        "nodi": nodi_out,
        "esame": esame_prove if esame_prove is not None else [],
        "pendenti": pendenti,
    }


def cmd_build(args):
    try:
        graph = build_graph()
    except Exception as exc:
        print(f"Errore di build: {exc}", file=sys.stderr)
        sys.exit(1)
    out = GRAPH_DIR / "graph.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Costruito {out} con {len(graph['nodi'])} nodi, {len(graph['pendenti'])} pendenti")


def cmd_check(args):
    try:
        expected = build_graph()
    except Exception as exc:
        print(f"Errore di build durante check: {exc}", file=sys.stderr)
        sys.exit(1)
    p = GRAPH_DIR / "graph.json"
    if not p.exists():
        print("graph/graph.json non trovato", file=sys.stderr)
        sys.exit(1)
    actual = json.loads(p.read_text(encoding="utf-8"))
    if json.dumps(expected, ensure_ascii=False, sort_keys=True) != json.dumps(actual, ensure_ascii=False, sort_keys=True):
        print("graph/graph.json non coincide con la build attesa", file=sys.stderr)
        sys.exit(1)
    if args.completo:
        contratto = carica_contratto()
        presente = {n["id"] for n in expected["nodi"]}
        mancanti = sorted(set(n["id"] for n in contratto["nodi"]) - presente)
        if mancanti:
            print(f"Check --completo fallito: mancano {mancanti}", file=sys.stderr)
            sys.exit(1)
        for nodo in expected["nodi"]:
            if nodo["tipo"] in ("concetto", "tipo_esercizio") and "lezione" not in nodo:
                print(f"Check --completo fallito: nodo {nodo['id']} senza lezione", file=sys.stderr)
                sys.exit(1)
        if expected["pendenti"]:
            print(f"Check --completo fallito: pendenti {expected['pendenti']}", file=sys.stderr)
            sys.exit(1)
        if not (GRAPH_DIR / "esame.json").exists():
            print("Check --completo fallito: esame.json mancante", file=sys.stderr)
            sys.exit(1)
        attesi = [f"T{i}" for i in range(1, 18)] + [f"E{i}" for i in range(1, 10)] + [f"M{i}" for i in range(1, 35)] + [f"I{i}" for i in range(1, 10)]
        presenti_ids = [p["id"] for p in expected["esame"]]
        if sorted(presenti_ids) != sorted(attesi):
            print("Check --completo fallito: esame incompleto", file=sys.stderr)
            sys.exit(1)
        print("Check --completo OK")
    else:
        print("Check OK")


def main():
    parser = argparse.ArgumentParser(description="KG build/check")
    sub = parser.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build", help="Costruisce graph/graph.json")
    b.set_defaults(func=cmd_build)
    c = sub.add_parser("check", help="Verifica graph/graph.json")
    c.add_argument("--completo", action="store_true")
    c.set_defaults(func=cmd_check)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
