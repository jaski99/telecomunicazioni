def valida_figure(dim: dict, did: str) -> None:
    for fig in dim.get("figure", []):
        if fig["tipo"] == "grafico":
            if fig["asse_x"]["min"] >= fig["asse_x"]["max"]:
                raise ValueError(f"Dimostrazione {did}: figura {fig['id']} asse_x min >= max")
            if fig["asse_y"]["min"] >= fig["asse_y"]["max"]:
                raise ValueError(f"Dimostrazione {did}: figura {fig['id']} asse_y min >= max")
            for s in fig.get("serie", []):
                if not 1 <= len(s["punti"]) <= 800:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} serie punti fuori range")
        elif fig["tipo"] == "temporale":
            if fig["asse_t"]["min"] >= fig["asse_t"]["max"]:
                raise ValueError(f"Dimostrazione {did}: figura {fig['id']} asse_t min >= max")
            for interv in fig.get("intervalli", []):
                if interv["t0"] >= interv["t1"]:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} intervallo t0 >= t1")
            corsie_ids = {c["id"] for c in fig.get("corsie", [])}
            for interv in fig.get("intervalli", []):
                if interv["corsia"] not in corsie_ids:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} corsia inesistente")
        elif fig["tipo"] == "blocchi":
            blocchi_ids = {b["id"] for b in fig.get("blocchi", [])}
            for coll in fig.get("collegamenti", []):
                if coll["da"] not in blocchi_ids:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} collegamento da inesistente")
                if coll["a"] not in blocchi_ids:
                    raise ValueError(f"Dimostrazione {did}: figura {fig['id']} collegamento a inesistente")
