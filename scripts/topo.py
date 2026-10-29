"""Ordinamento topologico deterministico (Kahn) per il knowledge graph."""

from collections import defaultdict, deque
from typing import Dict, List


PRIORITA_ORDINE = {"alta": 0, "media": 1, "bassa": 2}


def ordina_topologico(nodi: List[dict]) -> List[str]:
    """
    Ordina i nodi in ordine topologico deterministico.

    Determinismo: Kahn con coda ordinata per (priorità, area, id).
    priorità alta -> media -> bassa, poi area crescente, poi id alfabetico.

    Args:
        nodi: lista di dict con chiavi 'id', 'area', 'priorita' ({'livello': ...}),
              'prerequisiti' (lista di {'id': ...})

    Returns:
        lista ordinata di id

    Raises:
        ValueError: se esiste un ciclo
    """
    # mappa id -> nodo
    mappa: Dict[str, dict] = {n["id"]: n for n in nodi}
    # grafo: id -> lista di successori
    succ: Dict[str, List[str]] = defaultdict(list)
    indegree: Dict[str, int] = {nid: 0 for nid in mappa}

    for nodo in nodi:
        nid = nodo["id"]
        for pre in nodo.get("prerequisiti", []):
            pid = pre["id"]
            if pid not in mappa:
                # prerequisito pendente: non contribuisce al grado interno
                # ma verrà gestito da kg.py; qui lo ignoriamo per l'ordinamento
                # dei soli nodi presenti
                continue
            succ[pid].append(nid)
            indegree[nid] += 1

    def chiave(nid: str):
        n = mappa[nid]
        prio = n.get("priorita", {}).get("livello", "bassa")
        ordine_prio = PRIORITA_ORDINE.get(prio, 9)
        return (ordine_prio, n.get("area", 99), nid)

    # nodi senza prerequisiti
    coda: List[str] = sorted(
        [nid for nid, deg in indegree.items() if deg == 0], key=chiave
    )
    risultato: List[str] = []

    # Kahn deterministico: estraiamo sempre il minimo secondo chiave
    while coda:
        # coda è mantenuta ordinata
        current = coda.pop(0)
        risultato.append(current)
        for s in succ[current]:
            indegree[s] -= 1
            if indegree[s] == 0:
                coda.append(s)
        coda.sort(key=chiave)

    if len(risultato) != len(mappa):
        # ciclo rilevato
        rimanenti = [nid for nid, deg in indegree.items() if deg > 0]
        raise ValueError(f"Ciclo rilevato tra i nodi: {', '.join(sorted(rimanenti))}")

    return risultato


def main():
    import argparse
    import json
    import sys
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Ordinamento topologico deterministico")
    parser.add_argument(
        "input",
        nargs="?",
        help="File graph.json o parti; se omesso legge graph/graph.json",
    )
    args = parser.parse_args()

    if args.input:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
        if "nodi" in data:
            nodi = data["nodi"]
        elif isinstance(data, list):
            nodi = data
        else:
            nodi = [data]
    else:
        gpath = Path("graph/graph.json")
        if not gpath.exists():
            print("graph/graph.json non trovato", file=sys.stderr)
            sys.exit(1)
        data = json.loads(gpath.read_text(encoding="utf-8"))
        nodi = data.get("nodi", [])

    try:
        ordine = ordina_topologico(nodi)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)

    for nid in ordine:
        print(nid)


if __name__ == "__main__":
    main()
