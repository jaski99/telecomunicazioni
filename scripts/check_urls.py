#!/usr/bin/env python3
"""Verifica che gli URL in 'risorse' siano nella allowlist e rispondano <400."""

import argparse
import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
GRAPH_DIR = ROOT / "graph"

from scripts.allowlist import ALLOWLIST


def _collect_urls() -> list:
    urls = []
    # da graph.json se esiste
    gj = GRAPH_DIR / "graph.json"
    if gj.exists():
        data = json.loads(gj.read_text(encoding="utf-8"))
        for nodo in data.get("nodi", []):
            for r in nodo.get("risorse", []):
                urls.append((r.get("url"), f"nodo {nodo.get('id')}"))
    # da parts direttamente (per intercettare errori prima del build)
    parts_dir = GRAPH_DIR / "parts"
    if parts_dir.exists():
        for f in parts_dir.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    for nodo in data:
                        for r in nodo.get("risorse", []):
                            urls.append((r.get("url"), f"nodo {nodo.get('id')} in {f.name}"))
            except Exception as e:
                print(f"FAIL {f}: JSON illeggibile ({e})", file=sys.stderr)
                sys.exit(1)
    # dedup mantendo provenienza
    seen = {}
    for url, prov in urls:
        if url not in seen:
            seen[url] = prov
    return list(seen.items())


def _check_url(url: str, timeout: int = 10) -> tuple[bool, str]:
    """HEAD con fallback GET, ritorna (ok, messaggio)."""
    if url not in ALLOWLIST:
        return False, f"URL non in allowlist: {url}"

    # Prova HEAD
    for method in ("HEAD", "GET"):
        try:
            req = Request(url, method=method, headers={"User-Agent": "telecomunicazioni-check/1.0"})
            with urlopen(req, timeout=timeout) as resp:
                code = resp.getcode()
                if code < 400:
                    return True, f"{code}"
                return False, f"HTTP {code}"
        except HTTPError as e:
            if method == "HEAD" and e.code in (405, 501):
                continue  # fallback a GET
            return False, f"HTTP {e.code} {e.reason}"
        except URLError as e:
            return False, f"URLError {e.reason}"
        except Exception as e:
            return False, str(e)
    return False, "fallito HEAD e GET"


def main():
    parser = argparse.ArgumentParser(description="Verifica URL risorse")
    parser.add_argument("--offline", action="store_true", help="Salta verifica rete, controlla solo allowlist")
    args = parser.parse_args()

    pairs = _collect_urls()
    if not pairs:
        print("Nessuna risorsa da verificare")
        return

    errori = []
    for url, prov in pairs:
        if args.offline:
            if url not in ALLOWLIST:
                errori.append(f"{prov}: {url} non in allowlist")
                print(f"FAIL {url} ({prov}) — non in allowlist")
            else:
                print(f"OK {url} ({prov}) — allowlist (offline)")
            continue

        ok, msg = _check_url(url)
        if ok:
            print(f"OK {url} — {msg} ({prov})")
        else:
            print(f"FAIL {url} — {msg} ({prov})", file=sys.stderr)
            errori.append(f"{url}: {msg}")

    if errori:
        print(f"\n{len(errori)} URL con errori", file=sys.stderr)
        sys.exit(1)
    print(f"\nTutti gli URL verificati ({len(pairs)})")


if __name__ == "__main__":
    main()
