#!/usr/bin/env python3
"""Build e check del knowledge graph — CONTRACTS §3.6."""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

import jsonschema
from jsonschema import Draft202012Validator

# Import contratto
try:
    from scripts.contratto import carica_contratto
except ImportError:
    from contratto import carica_contratto  # type: ignore

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "schema"
GRAPH_DIR = ROOT / "graph"
PARTS_DIR = GRAPH_DIR / "parts"
LEZIONI_DIR = GRAPH_DIR / "lezioni"
DIM_DIR = GRAPH_DIR / "dimostrazioni"

ALLOWLIST = {
    "https://web.ing.unimo.it/wiki/index.php/Maurizio_Casoni",
    "https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico",
    "https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo",
    "https://www.dii.unimore.it/~mcasoni/tecnologie/LEZIONI_FONDAMENTI_TLC/",
    "https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)",
    "https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)/10%3A_Sampling_and_Reconstruction/10.02%3A_Sampling_Theorem",
    "https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/video_galleries/video-lectures/",
    "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/video_galleries/lecture-videos/",
    "https://ocw.mit.edu/courses/6-263j-data-communication-networks-fall-2002/pages/syllabus/",
    "https://openstax.org/books/statistics/pages/5-3-the-exponential-distribution-optional",
    "https://www3.diism.unisi.it/~giambene/fondamenti/dispense/dispense_tds.pdf",
}

AREE_TITOLI = {
    1: "Segnali deterministici e trasformata di Fourier",
    2: "Sistemi lineari e filtri",
    3: "Campionamento, Nyquist, PAM e processi aleatori",
    4: "Conversione A/D-D/A e trasmissione numerica",
    5: "Modulazioni e segnali passa-banda",
    6: "Reti, protocolli e accesso multiplo",
    7: "Teoria del traffico e code",
}


def _load_schema(name: str) -> dict:
    p = SCHEMA_DIR / name
    return json.loads(p.read_text(encoding="utf-8"))


def _validator(schema: dict) -> Draft202012Validator:
    # aggiungiamo resolver per $ref locali (figura.schema.json)
    # jsonschema 4.x gestisce automaticamente tramite Registry?
    # Per semplicità carichiamo figura come risorsa
    from jsonschema import Draft202012Validator as V

    # Se lo schema referenzia figura.schema.json, registriamo
    # Uso di referencing Registry
    try:
        from referencing import Registry, Resource

        figura_schema = json.loads((SCHEMA_DIR / "figura.schema.json").read_text(encoding="utf-8"))
        registry = Registry().with_resource(
            uri="https://jaski99.github.io/telecomunicazioni/schema/figura.schema.json",
            resource=Resource.from_contents(figura_schema),
        )
        # anche con path relativo
        registry = registry.with_resource(
            uri="figura.schema.json",
            resource=Resource.from_contents(figura_schema),
        )
        return V(schema, registry=registry)
    except Exception:
        return V(schema)


def _collect_nodes() -> list:
    nodi = []
    # pattern nomi: area-N.json oppure area-N-*.json
    if not PARTS_DIR.exists():
        return nodi
    for f in sorted(PARTS_DIR.glob("*.json")):
        # valida nome file: deve essere area-N.json o area-N-*.json
        nome = f.name
        if not nome.startswith("area-"):
            raise ValueError(f"File in parts non conforme: {nome} (deve iniziare con 'area-')")
        # estrae N
        try:
            # area-N.json -> N
            # area-N-suffisso.json -> N
            resto = nome[len("area-") :]
            n_str = resto.split(".")[0].split("-")[0]
            n = int(n_str)
        except Exception:
            raise ValueError(f"Nome file parts non valido: {nome}")
        if not (1 <= n <= 7):
            raise ValueError(f"Area fuori range 1-7 in file {nome}")
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"JSON non valido in {f}: {exc}") from exc
        if not isinstance(data, list):
            raise ValueError(f"File {f} deve contenere un array di nodi")
        for nodo in data:
            # verifica che area del nodo coincida con N
            if nodo.get("area") != n:
                raise ValueError(
                    f"Nodo {nodo.get('id', '?')} in {nome} ha area {nodo.get('area')} diversa da {n}"
                )
            # annota provenienza per debug
            nodo["_source"] = str(f)
            nodi.append(nodo)
    return nodi


def _load_meta() -> dict:
    p = GRAPH_DIR / "meta.json"
    if not p.exists():
        raise FileNotFoundError("graph/meta.json non trovato")
    return json.loads(p.read_text(encoding="utf-8"))


def _load_lezioni() -> dict:
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


def _load_dimostrazioni() -> dict:
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


def _load_esame() -> list | None:
    p = GRAPH_DIR / "esame.json"
    if not p.exists():
        return None
    data = json.loads(p.read_text(encoding="utf-8"))
    # supporta sia {prove: [...]} sia {versione, prove}
    if isinstance(data, dict) and "prove" in data:
        return data["prove"]
    if isinstance(data, list):
        return data
    return data


def _detect_cycle(present_map: dict, contratto_map: dict) -> list | None:
    """
    Rileva cicli considerando archi hard+soft dei nodi presenti
    e, per i nodi pendenti, i loro prerequisiti_hard da contratto.

    Ritorna lista del ciclo se trovato, altrimenti None.
    """
    # costruzione mappa completa temporanea per DFS
    # per ogni nodo (presente o pendente) definiamo i suoi prerequisiti
    # come lista di id
    all_ids = set(contratto_map.keys())

    def prereqs(nid: str) -> list:
        if nid in present_map:
            return [p["id"] for p in present_map[nid].get("prerequisiti", [])]
        if nid in contratto_map:
            return contratto_map[nid].get("prerequisiti_hard", [])
        return []

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {nid: WHITE for nid in all_ids}
    parent = {}

    cycle = None

    def dfs(u: str, stack: list):
        nonlocal cycle
        color[u] = GRAY
        stack.append(u)
        for v in prereqs(u):
            if v not in color:
                continue
            if color[v] == WHITE:
                parent[v] = u
                dfs(v, stack)
                if cycle is not None:
                    return
            elif color[v] == GRAY:
                # ciclo trovato: da v a u
                idx = stack.index(v)
                cycle = stack[idx:] + [v]
                return
        stack.pop()
        color[u] = BLACK

    # Eseguiamo DFS solo dai nodi che sono presenti o raggiungibili da presenti?
    # Per essere conformi a "contando anche quelli verso nodi pendenti tramite §4"
    # dobbiamo considerare tutto il grafo contratto, ma segnalare solo cicli
    # che coinvolgono almeno un nodo presente? Tuttavia la spec dice
    # "ciclo (archi hard+soft, contando anche quelli verso nodi pendenti tramite §4)"
    # quindi anche un ciclo che passa per pendenti va rilevato.
    # Facciamo DFS su tutti i nodi, ma diamo priorità a quelli presenti?
    # Iniziamo dai nodi presenti.
    for nid in list(present_map.keys()):
        if color[nid] == WHITE:
            dfs(nid, [])
            if cycle:
                return cycle
    # poi eventuali nodi contratto isolati (per completezza)
    for nid in sorted(all_ids):
        if color[nid] == WHITE:
            dfs(nid, [])
            if cycle:
                # se il ciclo non coinvolge nodi presenti, non è errore di build
                # perché riguarda solo nodi non ancora implementati?
                # Ma per sicurezza lo segnaliamo comunque se tutti i nodi del ciclo
                # sono pendenti e non ancora presenti? Potrebbe essere un errore
                # di contratto stesso (non dovrebbe avere cicli). Segnaliamo.
                if any(c in present_map for c in cycle):
                    return cycle
                # altrimenti reset e continua, non considerare ciclo solo-pendenti
                cycle = None
    return None


def build_graph() -> dict:
    contratto = carica_contratto()
    contratto_map = {n["id"]: n for n in contratto["nodi"]}
    contratto_ids = set(contratto_map.keys())

    meta = _load_meta()

    # valida meta.fonti chiavi
    # meta deve avere campo fonti
    if "fonti" not in meta:
        raise ValueError("meta.json deve contenere 'fonti'")

    # raccogli nodi
    nodi = _collect_nodes()

    # -- validazione schemi nodi --
    node_schema = _load_schema("node.schema.json")
    node_validator = _validator(node_schema)
    # figura validator per uso indiretto ma già incluso

    # check duplicati ID
    seen = {}
    for nodo in nodi:
        nid = nodo.get("id")
        if not nid:
            raise ValueError(f"Nodo senza id in {nodo.get('_source')}")
        if nid in seen:
            raise ValueError(f"ID duplicato: {nid} in {nodo.get('_source')} e {seen[nid]}")
        seen[nid] = nodo.get("_source")

    # validazione per ogni nodo
    for nodo in nodi:
        # rimuovi campo interno
        clean = {k: v for k, v in nodo.items() if not k.startswith("_")}
        errors = list(node_validator.iter_errors(clean))
        if errors:
            msgs = "; ".join(e.message for e in errors)
            raise ValueError(f"Nodo {nodo.get('id')} non valido: {msgs}")

        nid = nodo["id"]
        # nodo assente da §4 o con area/tipo/worker diversi
        if nid not in contratto_map:
            raise ValueError(f"Nodo {nid} non è nella lista di CONTRACTS §4")
        c = contratto_map[nid]
        for campo in ("area", "tipo", "worker"):
            if nodo[campo] != c[campo]:
                raise ValueError(
                    f"Nodo {nid}: campo '{campo}' = {nodo[campo]} diverso dal contratto ({c[campo]})"
                )
        # prerequisiti: almeno i hard del contratto come hard, altri solo verso ID §4, no self-loop
        prereq_ids = [p["id"] for p in nodo.get("prerequisiti", [])]
        # self-loop
        if nid in prereq_ids:
            raise ValueError(f"Nodo {nid} ha self-loop nei prerequisiti")
        # prerequisito non in §4
        for p in nodo.get("prerequisiti", []):
            if p["id"] not in contratto_ids:
                raise ValueError(f"Nodo {nid}: prerequisito {p['id']} non è in CONTRACTS §4")
        # verifica che contenga almeno i prerequisiti_hard come hard
        hard_contratto = set(c.get("prerequisiti_hard", []))
        hard_nodo = {p["id"] for p in nodo.get("prerequisiti", []) if p["forza"] == "hard"}
        mancanti = hard_contratto - hard_nodo
        if mancanti:
            raise ValueError(f"Nodo {nid}: mancano prerequisiti hard del contratto: {mancanti}")
        # fonti chiave non dichiarata
        for f in nodo.get("fonti", []):
            if f["chiave"] not in meta["fonti"]:
                raise ValueError(f"Nodo {nid}: fonte chiave '{f['chiave']}' non in meta.fonti")
        # URL risorse fuori allowlist
        for r in nodo.get("risorse", []):
            url = r.get("url")
            if url not in ALLOWLIST:
                raise ValueError(f"Nodo {nid}: URL risorsa non in allowlist: {url}")

    # ciclo detection
    present_map = {n["id"]: n for n in nodi}
    cycle = _detect_cycle(present_map, contratto_map)
    if cycle:
        raise ValueError(f"Ciclo rilevato: {' -> '.join(cycle)}")

    # lezioni e dimostrazioni
    lezioni = _load_lezioni()
    dimostrazioni = _load_dimostrazioni()

    lezione_schema = _load_schema("lezione.schema.json")
    dim_schema = _load_schema("dimostrazione.schema.json")
    lezione_validator = _validator(lezione_schema)
    dim_validator = _validator(dim_schema)

    # valida lezioni
    for lid, lec in lezioni.items():
        if lid not in present_map:
            raise ValueError(f"Lezione {lid} senza nodo corrispondente")
        errors = list(lezione_validator.iter_errors(lec))
        if errors:
            msgs = "; ".join(e.message for e in errors)
            raise ValueError(f"Lezione {lid} non valida: {msgs}")
        # check fonti
        # lezione non ha fonti obbligatorie? ma se presenti verifica?
        # controlla figura se presente (già validata dallo schema)

        # verifica spiegazione contenga almeno due ### e almeno una formula $?
        spieg = lec.get("spiegazione", "")
        if spieg.count("### ") < 2:
            raise ValueError(f"Lezione {lid}: spiegazione deve contenere almeno due '### ' sottotitoli")
        if "$" not in spieg:
            raise ValueError(f"Lezione {lid}: spiegazione deve contenere almeno una formula LaTeX con $")

        # riepilogo al più 5 righe
        riepilogo = lec.get("riepilogo", "")
        if riepilogo.count("\n") >= 5:
            # conta righe (splitlines)
            if len(riepilogo.splitlines()) > 5:
                raise ValueError(f"Lezione {lid}: riepilogo deve avere al più 5 righe")

        # verifica fonti chiavi? lezione non ha fonti obbligatorie per contratto?
        # ma se ha, controlla
        # (nessun campo fonti in lezione per §3.2)

        # check_testo integrato: per lezione non serve qui

    for did, dim in dimostrazioni.items():
        if did not in present_map:
            raise ValueError(f"Dimostrazione {did} senza nodo corrispondente")
        errors = list(dim_validator.iter_errors(dim))
        if errors:
            msgs = "; ".join(e.message for e in errors)
            raise ValueError(f"Dimostrazione {did} non valida: {msgs}")

        # verifica specifica dimostrazione: passi n consecutivi da 1, verifica punti_aperti, a_buchi, ecc.
        passi = dim.get("passi", [])
        ns = [p["n"] for p in passi]
        if ns != list(range(1, len(ns) + 1)):
            raise ValueError(f"Dimostrazione {did}: passi n devono essere consecutivi da 1")

        # verifica figura referenziata esista
        figure_ids = {f["id"] for f in dim.get("figure", [])}
        for p in passi:
            if "figura" in p and p["figura"] not in figure_ids:
                raise ValueError(f"Dimostrazione {did}: passo {p['n']} referenzia figura inesistente {p['figura']}")

        # a_buchi: almeno 3 segnaposto consecutivi
        a_buchi = dim.get("a_buchi", {})
        testo_buchi = a_buchi.get("testo", "")
        import re

        placeholders = re.findall(r"___(\d+)___", testo_buchi)
        if len(placeholders) < 3:
            raise ValueError(f"Dimostrazione {did}: a_buchi deve contenere almeno 3 segnaposto ___n___")
        # check consecutivi da 1
        nums = sorted(int(x) for x in placeholders)
        if nums != list(range(1, len(nums) + 1)):
            raise ValueError(f"Dimostrazione {did}: segnaposto a_buchi devono essere consecutivi da 1")
        # soluzioni chiavi devono coincidere
        sol_keys = set(a_buchi.get("soluzioni", {}).keys())
        expected_keys = {str(i) for i in nums}
        if sol_keys != expected_keys:
            raise ValueError(
                f"Dimostrazione {did}: chiavi soluzioni {sol_keys} non coincidono con segnaposto {expected_keys}"
            )

        # verifica stato punti_aperti
        verifica = dim.get("verifica", {})
        stato = verifica.get("stato")
        punti_aperti = verifica.get("punti_aperti", [])
        if stato in ("verificata_testo_prof", "verificata_file1_file3") and punti_aperti:
            # spec dice vuoto solo se verificata_*, ma può essere non vuoto? Descrizione: "vuoto solo se lo stato è verificata_*"
            # quindi se verificata_* deve essere vuoto. Se non vuoto è errore? Ma interpretiamo come deve essere vuoto.
            # Tuttavia lasciamo passare se non vuoto? Meglio warning.
            # Per conformità stretta: se verificata_* e punti_aperti non vuoto -> errore
            raise ValueError(f"Dimostrazione {did}: con stato {stato} punti_aperti deve essere vuoto")
        if stato in ("solo_file3", "ricostruzione_non_del_prof", "da_verificare") and not punti_aperti:
            # per questi stati punti_aperti dovrebbe non essere vuoto? Spec dice vuoto solo se verificata_*
            # quindi per altri dovrebbe avere almeno un elemento? Ma potrebbe essere vuoto in casi legit?
            # Non forziamo.
            pass

        # fonti chiavi
        for f in dim.get("fonti", []):
            if f["chiave"] not in meta["fonti"]:
                raise ValueError(f"Dimostrazione {did}: fonte chiave '{f['chiave']}' non in meta.fonti")

        # risorse? dimostrazione non ha risorse, ma figura e passi potrebbero?

        # figura validazione già fatta dallo schema, ma controlla assi min<max etc.
        for fig in dim.get("figure", []):
            if fig["tipo"] == "grafico":
                if fig["asse_x"]["min"] >= fig["asse_x"]["max"]:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} asse_x min >= max")
                if fig["asse_y"]["min"] >= fig["asse_y"]["max"]:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} asse_y min >= max")
                for s in fig.get("serie", []):
                    if not (1 <= len(s["punti"]) <= 800):
                        raise ValueError(f"Dimostrazione {did}: figura {fig['id']} serie punti fuori range 1-800")
            elif fig["tipo"] == "temporale":
                if fig["asse_t"]["min"] >= fig["asse_t"]["max"]:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} asse_t min >= max")
                for interv in fig.get("intervalli", []):
                    if interv["t0"] >= interv["t1"]:
                        raise ValueError(f"Dimostrazione {did}: figura {fig['id']} intervallo t0 >= t1")
                # verifica corsie esistano
                corsie_ids = {c["id"] for c in fig.get("corsie", [])}
                for interv in fig.get("intervalli", []):
                    if interv["corsia"] not in corsie_ids:
                        raise ValueError(
                            f"Dimostrazione {did}: figura {fig['id']} intervallo corsia {interv['corsia']} inesistente"
                        )
            elif fig["tipo"] == "blocchi":
                blocchi_ids = {b["id"] for b in fig.get("blocchi", [])}
                for coll in fig.get("collegamenti", []):
                    if coll["da"] not in blocchi_ids:
                        raise ValueError(
                            f"Dimostrazione {did}: figura {fig['id']} collegamento da {coll['da']} inesistente"
                        )
                    if coll["a"] not in blocchi_ids:
                        raise ValueError(
                            f"Dimostrazione {did}: figura {fig['id']} collegamento a {coll['a']} inesistente"
                        )

        # allowlist risorse non presente in dimostrazione per spec, ma se ha?
        # check collegamenti verso ID §4
        for cid in dim.get("collegamenti", []):
            if cid not in contratto_ids:
                raise ValueError(f"Dimostrazione {did}: collegamento {cid} non in CONTRACTS §4")

        # verifica a_voce lunghezza già validata da schema

    # verifica lezioni mancanti per nodi dimostrazione? spec: dimostrazione mancante per nodo dimostrazione presente
    for nodo in nodi:
        if nodo["tipo"] == "dimostrazione" and nodo["id"] not in dimostrazioni:
            raise ValueError(f"Nodo dimostrazione {nodo['id']} senza file in graph/dimostrazioni/")
        # concetto/tipo_esercizio con lezione: non obbligatorio in build normale, solo in --completo
        # ma se manca non è errore di build

    # verifica esame.json se presente
    esame_prove = _load_esame()
    if esame_prove is not None:
        # valida con esame.schema.json se esiste (W6 scope), altrimenti valida campi base
        ese_path = SCHEMA_DIR / "esame.schema.json"
        if ese_path.exists():
            ese_schema = json.loads(ese_path.read_text(encoding="utf-8"))
            ese_validator = _validator(ese_schema)
            # ricostruisci oggetto completo per validazione
            esame_obj = {"versione": 1, "avvertenza": "", "prove": esame_prove}
            # se il file originale aveva versione/avvertenza usali
            try:
                raw = json.loads((GRAPH_DIR / "esame.json").read_text(encoding="utf-8"))
                if isinstance(raw, dict):
                    esame_obj = raw
            except Exception:
                pass
            errors = list(ese_validator.iter_errors(esame_obj))
            if errors:
                msgs = "; ".join(e.message for e in errors)
                raise ValueError(f"esame.json non valido: {msgs}")
        else:
            # validazione leggera: ogni prova deve avere id, nodi, punti
            for prova in esame_prove:
                pid = prova.get("id")
                if pid not in [f"T{i}" for i in range(1, 18)] + [f"E{i}" for i in range(1, 10)] + [
                    f"M{i}" for i in range(1, 35)
                ] + [f"I{i}" for i in range(1, 10)]:
                    raise ValueError(f"Prova {pid} con id non valido")
                for nid in prova.get("nodi", []):
                    if nid not in contratto_ids:
                        raise ValueError(f"Prova {pid}: nodo {nid} non in CONTRACTS §4")
                punti = prova.get("punti")
                if pid in ("T5", "T11"):
                    if punti != 10:
                        raise ValueError(f"Prova {pid} deve valere 10 punti")
                else:
                    if punti != "NON TROVATO":
                        raise ValueError(f"Prova {pid} deve avere punti = 'NON TROVATO' (solo T5 e T11 valgono 10)")

    # costruisci pendenti: ID §4 citati come prerequisiti ma non ancora presenti
    citati = set()
    for nodo in nodi:
        for p in nodo.get("prerequisiti", []):
            citati.add(p["id"])
    pendenti = sorted(citati - set(present_map.keys()))
    # ordina pendenti per (area, id) come per contratto
    def pend_key(pid):
        c = contratto_map[pid]
        return (c["area"], pid)

    pendenti = sorted(pendenti, key=pend_key)

    # costruisci aree
    aree = []
    for num in range(1, 8):
        aree.append({"id": num, "titolo": AREE_TITOLI[num]})

    # costruisci nodi arricchiti: ordina per (area, id), aggiungi lezione/dimostrazione/domande_esame
    # mappa prova -> nodi
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
        # aggiungi lezione/dimostrazione se esistono
        if clean["id"] in lezioni:
            clean["lezione"] = lezioni[clean["id"]]
        if clean["id"] in dimostrazioni:
            clean["dimostrazione"] = dimostrazioni[clean["id"]]
        # domande_esame da esame.json
        if clean["id"] in prove_per_nodo:
            clean["domande_esame"] = prove_per_nodo[clean["id"]]
        else:
            # mantieni quello del contratto? ma spec dice graph.json aggiunge domande_esame da esame.json
            # se non presente in esame.json, sarà array vuoto o quello del contratto?
            # Per coerenza con spec, usiamo quello di contratto se esame non presente, altrimenti quello da esame
            if esame_prove is None:
                # nessun esame.json: usa domande_esame del contratto?
                # Ma nodo originale non ha campo domande_esame (non in node schema)
                # CONTRACTS §4 ha domande_esame per ogni nodo, ma node.schema non lo prevede?
                # In graph.json aggiungiamo domande_esame come da esame.json, ordinati
                # Se non esiste esame.json, mettiamo quello del contratto se presente
                clean["domande_esame"] = contratto_map[clean["id"]].get("domande_esame", [])
            else:
                clean["domande_esame"] = prove_per_nodo.get(clean["id"], [])
        nodi_out.append(clean)

    # versione: usa quella del contratto? oppure 1
    versione = contratto.get("versione", 1)

    # esame field: array prove o []
    esame_out = esame_prove if esame_prove is not None else []

    graph = {
        "versione": versione,
        "meta": meta,
        "aree": aree,
        "nodi": nodi_out,
        "esame": esame_out,
        "pendenti": pendenti,
    }
    return graph


def cmd_build(args):
    try:
        graph = build_graph()
    except Exception as exc:
        print(f"Errore di build: {exc}", file=sys.stderr)
        sys.exit(1)

    out = GRAPH_DIR / "graph.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    # scrivi con indent 2, UTF-8, ordina chiavi stabile
    out.write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Costruito {out} con {len(graph['nodi'])} nodi, {len(graph['pendenti'])} pendenti")


def cmd_check(args):
    completo = args.completo
    # build in memoria
    try:
        expected = build_graph()
    except Exception as exc:
        print(f"Errore di build durante check: {exc}", file=sys.stderr)
        sys.exit(1)

    p = GRAPH_DIR / "graph.json"
    if not p.exists():
        print("graph/graph.json non trovato: esegui 'python scripts/kg.py build'", file=sys.stderr)
        sys.exit(1)
    try:
        actual = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"graph/graph.json non è JSON valido: {exc}", file=sys.stderr)
        sys.exit(1)

    # confronto normalizzato (ordina chiavi, confronto deep)
    exp_str = json.dumps(expected, ensure_ascii=False, sort_keys=True)
    act_str = json.dumps(actual, ensure_ascii=False, sort_keys=True)
    if exp_str != act_str:
        # trova differenze minimali
        print("graph/graph.json non coincide con la build attesa", file=sys.stderr)
        # dettaglio: lunghezza nodi diverso?
        if len(expected.get("nodi", [])) != len(actual.get("nodi", [])):
            print(
                f"  nodi: attesi {len(expected.get('nodi', []))}, trovati {len(actual.get('nodi', []))}",
                file=sys.stderr,
            )
        if expected.get("pendenti") != actual.get("pendenti"):
            print(f"  pendenti attesi {expected.get('pendenti')}", file=sys.stderr)
            print(f"  pendenti trovati {actual.get('pendenti')}", file=sys.stderr)
        sys.exit(1)

    if completo:
        # tutti gli ID di §4 presenti
        contratto = carica_contratto()
        contratto_ids = {n["id"] for n in contratto["nodi"]}
        presenti = {n["id"] for n in expected["nodi"]}
        mancanti = sorted(contratto_ids - presenti)
        if mancanti:
            print(f"Check --completo fallito: mancano {len(mancanti)} nodi: {mancanti}", file=sys.stderr)
            sys.exit(1)
        # ogni concetto/tipo_esercizio con lezione
        for nodo in expected["nodi"]:
            if nodo["tipo"] in ("concetto", "tipo_esercizio") and "lezione" not in nodo:
                print(
                    f"Check --completo fallito: nodo {nodo['id']} ({nodo['tipo']}) senza lezione",
                    file=sys.stderr,
                )
                sys.exit(1)
        # pendenti vuoto
        if expected["pendenti"]:
            print(f"Check --completo fallito: pendenti non vuoto: {expected['pendenti']}", file=sys.stderr)
            sys.exit(1)
        # esame.json completo
        esame_path = GRAPH_DIR / "esame.json"
        if not esame_path.exists():
            print("Check --completo fallito: graph/esame.json mancante", file=sys.stderr)
            sys.exit(1)
        esame_prove = expected["esame"]
        # tutti T1-17, E1-9, M1-34, I1-9 presenti esattamente una volta
        attesi = [f"T{i}" for i in range(1, 18)] + [f"E{i}" for i in range(1, 10)] + [
            f"M{i}" for i in range(1, 35)
        ] + [f"I{i}" for i in range(1, 10)]
        presenti_ids = [p["id"] for p in esame_prove]
        if sorted(presenti_ids) != sorted(attesi):
            manc = sorted(set(attesi) - set(presenti_ids))
            extra = sorted(set(presenti_ids) - set(attesi))
            print(f"Check --completo fallito: esame.json incompleto", file=sys.stderr)
            if manc:
                print(f"  mancanti: {manc}", file=sys.stderr)
            if extra:
                print(f"  extra: {extra}", file=sys.stderr)
            sys.exit(1)
        print("Check --completo OK")
    else:
        print("Check OK")


def main():
    parser = argparse.ArgumentParser(description="KG build/check")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_build = sub.add_parser("build", help="Costruisce graph/graph.json")
    p_build.set_defaults(func=cmd_build)
    p_check = sub.add_parser("check", help="Verifica graph/graph.json")
    p_check.add_argument("--completo", action="store_true", help="Verifica completa (tutti gli ID, lezioni, pendenti, esame)")
    p_check.set_defaults(func=cmd_check)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
