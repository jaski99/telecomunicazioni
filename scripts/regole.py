import re

from scripts.allowlist import ALLOWLIST


def valida_nodi(nodi: list, contratto_map: dict, contratto_ids: set, meta: dict, validator) -> None:
    seen = {}
    for nodo in nodi:
        nid = nodo.get("id")
        if not nid:
            raise ValueError(f"Nodo senza id in {nodo.get('_source')}")
        if nid in seen:
            raise ValueError(f"ID duplicato: {nid} in {nodo.get('_source')} e {seen[nid]}")
        seen[nid] = nodo.get("_source")

    for nodo in nodi:
        clean = {k: v for k, v in nodo.items() if not k.startswith("_")}
        errors = list(validator.iter_errors(clean))
        if errors:
            raise ValueError(f"Nodo {nodo.get('id')} non valido: {'; '.join(e.message for e in errors)}")

        nid = nodo["id"]
        if nid not in contratto_map:
            raise ValueError(f"Nodo {nid} non è nella lista di CONTRACTS §4")
        c = contratto_map[nid]
        for campo in ("area", "tipo", "worker"):
            if nodo[campo] != c[campo]:
                raise ValueError(f"Nodo {nid}: campo '{campo}' diverso dal contratto")
        prereq_ids = [p["id"] for p in nodo.get("prerequisiti", [])]
        if nid in prereq_ids:
            raise ValueError(f"Nodo {nid} ha self-loop")
        for p in nodo.get("prerequisiti", []):
            if p["id"] not in contratto_ids:
                raise ValueError(f"Nodo {nid}: prerequisito {p['id']} non è in CONTRACTS §4")
        hard_contratto = set(c.get("prerequisiti_hard", []))
        hard_nodo = {p["id"] for p in nodo.get("prerequisiti", []) if p["forza"] == "hard"}
        if hard_contratto - hard_nodo:
            raise ValueError(f"Nodo {nid}: mancano prerequisiti hard {hard_contratto - hard_nodo}")
        for f in nodo.get("fonti", []):
            if f["chiave"] not in meta["fonti"]:
                raise ValueError(f"Nodo {nid}: fonte {f['chiave']} non in meta.fonti")
        for r in nodo.get("risorse", []):
            if r.get("url") not in ALLOWLIST:
                raise ValueError(f"Nodo {nid}: URL risorsa non in allowlist: {r.get('url')}")


def valida_lezioni(lezioni: dict, present_map: dict, validator) -> None:
    for lid, lec in lezioni.items():
        if lid not in present_map:
            raise ValueError(f"Lezione {lid} senza nodo corrispondente")
        errors = list(validator.iter_errors(lec))
        if errors:
            raise ValueError(f"Lezione {lid} non valida: {'; '.join(e.message for e in errors)}")
        spieg = lec.get("spiegazione", "")
        if spieg.count("### ") < 2:
            raise ValueError(f"Lezione {lid}: spiegazione deve contenere almeno due '### '")
        if "$" not in spieg:
            raise ValueError(f"Lezione {lid}: spiegazione deve contenere almeno una formula LaTeX")
        riepilogo = lec.get("riepilogo", "")
        if len(riepilogo.splitlines()) > 5:
            raise ValueError(f"Lezione {lid}: riepilogo deve avere al più 5 righe")


def valida_dimostrazioni(dims: dict, present_map: dict, contratto_ids: set, meta: dict, validator, contratto_map: dict) -> None:
    for did, dim in dims.items():
        if did not in present_map:
            raise ValueError(f"Dimostrazione {did} senza nodo corrispondente")
        errors = list(validator.iter_errors(dim))
        if errors:
            raise ValueError(f"Dimostrazione {did} non valida: {'; '.join(e.message for e in errors)}")
        passi = dim.get("passi", [])
        ns = [p["n"] for p in passi]
        if ns != list(range(1, len(ns) + 1)):
            raise ValueError(f"Dimostrazione {did}: passi n devono essere consecutivi da 1")
        figure_ids = {f["id"] for f in dim.get("figure", [])}
        for p in passi:
            if "figura" in p and p["figura"] not in figure_ids:
                raise ValueError(f"Dimostrazione {did}: passo {p['n']} figura inesistente")
        a_buchi = dim.get("a_buchi", {})
        testo_buchi = a_buchi.get("testo", "")
        placeholders = re.findall(r"___(\d+)___", testo_buchi)
        if len(placeholders) < 3:
            raise ValueError(f"Dimostrazione {did}: a_buchi deve contenere almeno 3 segnaposto")
        nums = sorted(int(x) for x in placeholders)
        if nums != list(range(1, len(nums) + 1)):
            raise ValueError(f"Dimostrazione {did}: segnaposto non consecutivi da 1")
        sol_keys = set(a_buchi.get("soluzioni", {}).keys())
        expected_keys = {str(i) for i in nums}
        if sol_keys != expected_keys:
            raise ValueError(f"Dimostrazione {did}: chiavi soluzioni non coincidono")
        verifica = dim.get("verifica", {})
        stato = verifica.get("stato")
        punti_aperti = verifica.get("punti_aperti", [])
        if stato in ("solo_file3", "ricostruzione_non_del_prof", "da_verificare") and not punti_aperti:
            raise ValueError(f"Dimostrazione {did}: con stato {stato} punti_aperti non può essere vuoto")
        for f in dim.get("fonti", []):
            if f["chiave"] not in meta["fonti"]:
                raise ValueError(f"Dimostrazione {did}: fonte {f['chiave']} non in meta.fonti")
        for cid in dim.get("collegamenti", []):
            if cid not in contratto_ids:
                raise ValueError(f"Dimostrazione {did}: collegamento {cid} non in contratto")


def valida_esame(prove: list, contratto_ids: set) -> None:
    for prova in prove:
        pid = prova.get("id")
        if pid not in [f"T{i}" for i in range(1, 18)] + [f"E{i}" for i in range(1, 10)] + [f"M{i}" for i in range(1, 35)] + [f"I{i}" for i in range(1, 10)]:
            raise ValueError(f"Prova {pid} id non valido")
        for nid in prova.get("nodi", []):
            if nid not in contratto_ids:
                raise ValueError(f"Prova {pid}: nodo {nid} non in contratto")
        punti = prova.get("punti")
        if pid in ("T5", "T11"):
            if punti != 10:
                raise ValueError(f"Prova {pid} deve valere 10")
        elif punti != "NON TROVATO":
            raise ValueError(f"Prova {pid} deve essere NON TROVATO")
