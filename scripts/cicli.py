def detect_cycle(present_map: dict, contratto_map: dict) -> list | None:
    all_ids = set(contratto_map.keys())

    def prereqs(nid: str) -> list:
        if nid in present_map:
            return [p["id"] for p in present_map[nid].get("prerequisiti", [])]
        if nid in contratto_map:
            return contratto_map[nid].get("prerequisiti_hard", [])
        return []

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {nid: WHITE for nid in all_ids}
    cycle = None

    def dfs(u: str, stack: list):
        nonlocal cycle
        color[u] = GRAY
        stack.append(u)
        for v in prereqs(u):
            if v not in color:
                continue
            if color[v] == WHITE:
                dfs(v, stack)
                if cycle is not None:
                    return
            elif color[v] == GRAY:
                idx = stack.index(v)
                cycle = stack[idx:] + [v]
                return
        stack.pop()
        color[u] = BLACK

    for nid in list(present_map.keys()):
        if color[nid] == WHITE:
            dfs(nid, [])
            if cycle:
                return cycle
    for nid in sorted(all_ids):
        if color[nid] == WHITE:
            dfs(nid, [])
            if cycle:
                if any(c in present_map for c in cycle):
                    return cycle
                cycle = None
    return None
