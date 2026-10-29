#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

_gd_root = Path(__file__).resolve().parent.parent
if str(_gd_root) not in sys.path:
    sys.path.insert(0, str(_gd_root))

from scripts.contratto import carica_contratto
from scripts.topo import ordina_topologico

ROOT = Path(__file__).resolve().parent.parent
GRAPH_JSON = ROOT / "graph" / "graph.json"
DOCS_DIR = ROOT / "docs"


def _load_graph() -> dict:
    if not GRAPH_JSON.exists():
        from scripts.kg import build_graph

        return build_graph()
    return json.loads(GRAPH_JSON.read_text(encoding="utf-8"))


def genera_piano_studio(graph: dict) -> str:
    nodi = graph.get("nodi", [])
    try:
        ordine = ordina_topologico(nodi)
    except ValueError as exc:
        print(f"Avviso topo: {exc}", file=sys.stderr)
        ordine = [n["id"] for n in sorted(nodi, key=lambda x: (x["area"], x["id"]))]
    mappa = {n["id"]: n for n in nodi}
    lines = []
    lines.append("# Piano di studio — ordine consigliato")
    lines.append("")
    lines.append("> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.")
    lines.append("> Ordine topologico deterministico: priorità alta → media → bassa, poi area e id.")
    lines.append("> Le dimostrazioni con 10 punti (T5, T11) hanno priorità alta.")
    lines.append("")
    lines.append(f"Totale nodi: {len(nodi)} — pendenti: {len(graph.get('pendenti', []))}")
    lines.append("")
    lines.append("## Percorso consigliato")
    lines.append("")
    lines.append("| # | ID | Titolo | Area | Tipo | Priorità | Tempo | Prerequisiti |")
    lines.append("|---|---|---|---|---|---|---|---|\n")
    for idx, nid in enumerate(ordine, 1):
        n = mappa[nid]
        prereq = ", ".join(p["id"] for p in n.get("prerequisiti", [])) or "—"
        lines.append(f"| {idx} | `{nid}` | {n.get('titolo','')} | {n.get('area','')} | {n.get('tipo','')} | {n.get('priorita',{}).get('livello','')} | {n.get('tempo_studio_min','')}′ | {prereq} |")
    pendenti = graph.get("pendenti", [])
    if pendenti:
        lines.append("")
        lines.append("## Nodi pendenti (in arrivo)")
        lines.append("")
        lines.append("Questi nodi sono previsti dal contratto ma non ancora presenti nel grafo:")
        lines.append("")
        for pid in pendenti:
            lines.append(f"- `{pid}`")
    lines.append("")
    lines.append("## Note")
    lines.append("")
    lines.append("- L'ordine rispetta le dipendenze: un nodo compare sempre dopo i suoi prerequisiti.")
    lines.append("- A parità di vincoli, i nodi con priorità più alta vengono prima.")
    lines.append("- Il tempo di studio è indicativo (minuti).")
    lines.append("- Per la preparazione all'esame, iniziare da T5 e T11 (10 punti) con i loro prerequisiti.")
    lines.append("")
    return "\n".join(lines)


def genera_mappa_esame(graph: dict) -> str:
    esame = graph.get("esame", [])
    nodi = {n["id"]: n for n in graph.get("nodi", [])}
    lines = []
    lines.append("# Mappa d'esame — prova → nodi")
    lines.append("")
    lines.append("> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.")
    lines.append("> Fonte: `graph/esame.json` (se presente) e `graph/graph.json`. Avvertenza: raccolta di studenti (file2), non prova ufficiale; frequenze e punteggi non indicati = NON TROVATO.")
    lines.append("")
    if not esame:
        lines.append("Nessuna prova configurata in `graph/esame.json` (in attesa di W6).")
        lines.append("")
        lines.append("Struttura prevista (da file2):")
        lines.append("")
        lines.append("- **Teoria (T1–T17)**: 17 domande — solo T5 e T11 valgono 10 punti, altre NON TROVATO")
        lines.append("- **Esercizi (E1–E9)**: 9 esercizi — punteggio NON TROVATO")
        lines.append("- **Quiz (M1–M34)**: 34 domande a risposta multipla — punteggio NON TROVATO")
        lines.append("- **Intro reti (I1–I9)**: 9 domande introduttive — punteggio NON TROVATO")
        lines.append("")
        try:
            contratto = carica_contratto()
            lines.append("## Mappa contratto (ID → domande)")
            lines.append("")
            lines.append("| Nodo | Area | Tipo | Domande |")
            lines.append("|---|---|---|---|\n")
            for c in sorted(contratto["nodi"], key=lambda x: (x["area"], x["id"])):
                dom = ", ".join(c.get("domande_esame", [])) or "—"
                lines.append(f"| `{c['id']}` | {c['area']} | {c['tipo']} | {dom} |")
            lines.append("")
        except Exception as e:
            print(f"FAIL mappa contratto: {e}", file=sys.stderr)
            sys.exit(1)
        return "\n".join(lines)
    gruppi = {"teoria": [], "esercizio": [], "quiz": [], "intro_reti": []}
    for p in esame:
        gruppi.setdefault(p.get("tipo", ""), []).append(p)
    titoli = {"teoria": "Domande teoriche (T)", "esercizio": "Esercizi (E)", "quiz": "Risposta multipla (M)", "intro_reti": "Domande introduttive reti (I)"}
    for tipo in ["teoria", "esercizio", "quiz", "intro_reti"]:
        prove = gruppi.get(tipo, [])
        if not prove:
            continue
        lines.append(f"## {titoli.get(tipo, tipo)}")
        lines.append("")
        lines.append("| ID | Titolo | Punti | Nodi | Stato verifica |")
        lines.append("|---|---|---|---|---|\n")
        for p in sorted(prove, key=lambda x: x["id"]):
            nodi_ids = p.get("nodi", [])
            nodi_str = ", ".join(f"`{nid}`" for nid in nodi_ids) if nodi_ids else "—"
            stati = []
            for nid in nodi_ids:
                nodo = nodi.get(nid)
                if nodo and "dimostrazione" in nodo:
                    stato = nodo["dimostrazione"].get("verifica", {}).get("stato", "")
                    if stato:
                        stati.append(f"{nid}:{stato}")
            stato_str = ", ".join(stati) if stati else "—"
            lines.append(f"| {p['id']} | {p.get('titolo','')} | {p.get('punti','NON TROVATO')} | {nodi_str} | {stato_str} |")
        lines.append("")
    lines.append("## Legenda verifica")
    lines.append("")
    lines.append("- `verificata_testo_prof`: confrontata col libro del prof.")
    lines.append("- `verificata_file1_file3`: confrontata con file1 e file3")
    lines.append("- `solo_file3`: solo da file3")
    lines.append("- `ricostruzione_non_del_prof`: ricostruzione standard, non del testo")
    lines.append("- `da_verificare`: da verificare")
    lines.append("")
    return "\n".join(lines)


def cmd_build(args):
    graph = _load_graph()
    piano = genera_piano_studio(graph)
    mappa = genera_mappa_esame(graph)
    (DOCS_DIR / "PIANO_STUDIO.md").write_text(piano, encoding="utf-8")
    (DOCS_DIR / "MAPPA_ESAME.md").write_text(mappa, encoding="utf-8")
    print(f"Generato {DOCS_DIR / 'PIANO_STUDIO.md'}")
    print(f"Generato {DOCS_DIR / 'MAPPA_ESAME.md'}")


def main():
    parser = argparse.ArgumentParser(description="Genera docs da graph")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("build", help="Genera PIANO_STUDIO e MAPPA_ESAME")
    p.set_defaults(func=cmd_build)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
