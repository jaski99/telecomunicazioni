"""Test dei contenuti W3 (aree 1-3): nodi, lezioni, dimostrazioni T1-T5.

Valida direttamente i campi di docs/CONTRACTS.md §3, gli ID e i prerequisiti
del blocco JSON di §4, le chiavi di §5, la allowlist degli URL, gli accenti,
il bilanciamento di LaTeX e dollari, i segnaposto delle ricostruzioni a
buchi, la validità delle figure e controlli numerici sulle formule finali.
Usa solo la libreria standard, così gira anche prima del merge di W1.
"""

import json
import math
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
CHIAVI_FONTI = {"LIBRO_CI", "LUCIDI_CASONI", "PROGRAMMA", "ESSE3_2016",
                "FILE1", "FILE2", "FILE3", "RICOSTRUZIONE"}


# --------------------------------------------------------------------------
# Caricamento del contratto e dei contenuti
# --------------------------------------------------------------------------

def carica_contratto():
    testo = (ROOT / "docs" / "CONTRACTS.md").read_text(encoding="utf-8")
    inizio = testo.index("<!-- contratto-nodi:inizio -->")
    apertura = testo.index("```json", inizio) + len("```json")
    chiusura = testo.index("```", apertura)
    return json.loads(testo[apertura:chiusura])


def allowlist_url():
    testo = (ROOT / "docs" / "CONTRACTS.md").read_text(encoding="utf-8")
    inizio = testo.index("**Allowlist per `risorse`**")
    fine = testo.index("**Non usare in `risorse`:**")
    return set(re.findall(r"https?://\S+", testo[inizio:fine]))


CONTRATTO = carica_contratto()
TUTTI = {n["id"]: n for n in CONTRATTO["nodi"]}
W3 = {i: n for i, n in TUTTI.items() if n["worker"] == "W3"}
DIM_W3 = {i: n for i, n in W3.items() if n["tipo"] == "dimostrazione"}
CONCETTI_W3 = {i: n for i, n in W3.items() if n["tipo"] == "concetto"}


def carica_json(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


NODI = {}
for area in (1, 2, 3):
    for nodo in carica_json(f"graph/parts/area-{area}.json"):
        NODI[nodo["id"]] = (area, nodo)

def carica_file_w3(cartella):
    # Solo i file dei nodi W3 (§4, scope di W3 in §7): lezioni e dimostrazioni
    # degli altri worker sono validate dai loro test e da quelli generici.
    # Si cerca ogni ID W3, così un file W3 di troppo (es. una lezione per una
    # dimostrazione W3) resta visibile e viene rifiutato dai test di ambito.
    base = ROOT / "graph" / cartella
    return {i: carica_json((base / f"{i}.json").relative_to(ROOT))
            for i in sorted(W3) if (base / f"{i}.json").is_file()}


LEZIONI = carica_file_w3("lezioni")
DIMOSTRAZIONI = carica_file_w3("dimostrazioni")


def stringhe(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from stringhe(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from stringhe(v)


TUTTE_LE_STRINGHE = (
    [s for _, n in NODI.values() for s in stringhe(n)]
    + [s for d in LEZIONI.values() for s in stringhe(d)]
    + [s for d in DIMOSTRAZIONI.values() for s in stringhe(d)]
    + [(ROOT / "docs" / "NOTAZIONE.md").read_text(encoding="utf-8")]
)


# --------------------------------------------------------------------------
# Ambito, ID e prerequisiti (CONTRACTS §4)
# --------------------------------------------------------------------------

def test_sono_esattamente_i_16_nodi_w3_del_contratto():
    assert len(W3) == 16
    assert set(NODI) == set(W3)
    assert set(LEZIONI) == set(CONCETTI_W3), "lezione obbligatoria per ogni concetto"
    assert set(DIMOSTRAZIONI) == set(DIM_W3) == {
        "dim-teorema-campionamento", "dim-impulso-dirac-trasformata",
        "dim-filtro-trasversale", "dim-risposta-impulsiva-h", "dim-pam-due-spettri"}


def test_nessun_pdf_nel_repository():
    pdf = [p for p in ROOT.rglob("*.pdf") if ".git" not in p.parts]
    assert pdf == [], f"PDF non ammessi nel repo: {pdf}"


@pytest.mark.parametrize("id_nodo", sorted(W3))
def test_nodo_conforme_al_contratto(id_nodo):
    atteso = W3[id_nodo]
    area_file, nodo = NODI[id_nodo]
    ammessi = {"id", "titolo", "area", "tipo", "gruppo", "worker", "sapere",
               "saper_fare", "prerequisiti", "tempo_studio_min", "priorita",
               "fonti", "risorse", "checklist_ripasso"}
    assert set(nodo) <= ammessi
    assert ammessi - {"checklist_ripasso"} <= set(nodo)
    assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", nodo["id"]) and len(nodo["id"]) <= 64
    assert nodo["area"] == atteso["area"] == area_file
    assert nodo["tipo"] == atteso["tipo"]
    assert nodo["gruppo"] == atteso["gruppo"]
    assert nodo["worker"] == "W3"
    assert 3 <= len(nodo["titolo"]) <= 120
    assert len(nodo["sapere"]) >= 40
    assert len(nodo["saper_fare"]) >= 1 and all(isinstance(s, str) and s for s in nodo["saper_fare"])
    assert 5 <= nodo["tempo_studio_min"] <= 600
    hard = {p["id"] for p in nodo["prerequisiti"] if p["forza"] == "hard"}
    assert set(atteso["prerequisiti_hard"]) <= hard
    for p in nodo["prerequisiti"]:
        assert set(p) == {"id", "forza", "motivo"}
        assert p["id"] in TUTTI and p["id"] != id_nodo
        assert p["forza"] in ("hard", "soft") and p["motivo"]
    assert len(nodo["fonti"]) >= 1
    for f in nodo["fonti"]:
        assert set(f) == {"chiave", "rif"} and f["chiave"] in CHIAVI_FONTI and f["rif"]


def test_risorse_solo_dalla_allowlist():
    consentiti = allowlist_url()
    assert consentiti, "allowlist non trovata in CONTRACTS.md"
    for _, nodo in NODI.values():
        for r in nodo["risorse"]:
            assert set(r) == {"titolo", "url", "verificato"}
            assert r["url"] in consentiti, r["url"]
            assert r["verificato"] is True


def test_grafo_senza_cicli():
    # Archi: per i nodi W3 quelli dichiarati nei parts, per gli altri gli hard di §4.
    archi = {}
    for id_nodo, nodo_c in TUTTI.items():
        if id_nodo in NODI:
            archi[id_nodo] = [p["id"] for p in NODI[id_nodo][1]["prerequisiti"]]
        else:
            archi[id_nodo] = list(nodo_c["prerequisiti_hard"])
    visitati, in_pila = set(), set()

    def visita(n):
        assert n not in in_pila, f"ciclo che passa per {n}"
        if n in visitati:
            return
        in_pila.add(n)
        for m in archi[n]:
            visita(m)
        in_pila.discard(n)
        visitati.add(n)

    for n in archi:
        visita(n)


def test_regola_delle_priorita():
    nodi_t = {i for i, n in TUTTI.items()
              if any(d.startswith("T") for d in n["domande_esame"])}
    meritevoli_alta = set(nodi_t)
    for i in nodi_t:
        meritevoli_alta.update(TUTTI[i]["prerequisiti_hard"])
    meritevoli_alta.update(i for i, n in TUTTI.items()
                            if any(d.startswith(("T", "E")) for d in n["domande_esame"]))
    for id_nodo, (_, nodo) in NODI.items():
        livello = nodo["priorita"]["livello"]
        assert set(nodo["priorita"]) == {"livello", "motivazione"}
        assert livello in ("alta", "media", "bassa")
        assert (livello == "bassa") == (nodo["gruppo"] == "C")
        if livello == "alta":
            assert id_nodo in meritevoli_alta, id_nodo
        if id_nodo in nodi_t:
            assert livello == "alta", id_nodo


def test_punteggi_mai_inventati():
    # Solo T5 (e T11, non di W3) valgono 10 punti: ogni altro numero seguito
    # da "punti" è vietato; le altre prove dichiarano NON TROVATO.
    for s in TUTTE_LE_STRINGHE:
        for m in re.finditer(r"(\d+)\s*punti", s):
            assert m.group(1) == "10", s[:120]
    for id_dim, dim in DIMOSTRAZIONI.items():
        if id_dim == "dim-pam-due-spettri":
            assert "10 punti" in dim["enunciato"]
        else:
            assert "NON TROVATO" in dim["enunciato"], id_dim


# --------------------------------------------------------------------------
# Lezioni (CONTRACTS §3.2)
# --------------------------------------------------------------------------

CAMPI_LEZIONE = {"id", "perche_ti_serve", "scenario", "definizione_esame", "spiegazione",
                 "analogia", "worked_example", "completion_problem", "esercizio_autonomo",
                 "errori_trappole", "richiamo_attivo", "riepilogo", "flashcard", "checklist"}


@pytest.mark.parametrize("id_lez", sorted(LEZIONI))
def test_lezione_conforme(id_lez):
    lez = LEZIONI[id_lez]
    assert CAMPI_LEZIONE <= set(lez) <= CAMPI_LEZIONE | {"figure"}
    assert lez["id"] == id_lez
    assert 20 <= len(lez["perche_ti_serve"]) <= 300
    assert len(lez["scenario"]) >= 50
    assert set(lez["definizione_esame"]) == {"definizione", "scopo", "esempio"}
    assert all(lez["definizione_esame"].values())
    sp = lez["spiegazione"]
    assert len(sp) >= 1200 and sp.count("### ") >= 2 and "$" in sp
    assert set(lez["analogia"]) == {"testo", "limite"} and all(lez["analogia"].values())
    we = lez["worked_example"]
    assert set(we) == {"titolo", "problema", "passi", "soluzione", "perche_funziona"}
    assert len(we["passi"]) >= 3
    cp = lez["completion_problem"]
    assert set(cp) == {"titolo", "testo", "passi_mancanti", "soluzione"}
    assert len(cp["passi_mancanti"]) >= 1
    assert set(lez["esercizio_autonomo"]) == {"titolo", "testo", "suggerimento", "soluzione_attesa"}
    assert len(lez["errori_trappole"]) >= 2
    for e in lez["errori_trappole"]:
        assert set(e) == {"errore", "perche_sbagliato"}
    ra = lez["richiamo_attivo"]
    assert set(ra) == {"domande", "spiega_con_parole_tue"}
    assert 3 <= len(ra["domande"]) <= 5
    for d in ra["domande"]:
        assert set(d) == {"domanda", "risposta"} and all(d.values())
    assert 40 <= len(lez["riepilogo"]) <= 800
    assert lez["riepilogo"].count("\n") + 1 <= 5
    assert 1 <= len(lez["flashcard"]) <= 6
    for f in lez["flashcard"]:
        assert set(f) == {"fronte", "retro"}
    assert set(lez["checklist"]) == {"so_fare", "so_dire"}
    assert lez["checklist"]["so_fare"] and lez["checklist"]["so_dire"]


# --------------------------------------------------------------------------
# Dimostrazioni (CONTRACTS §3.3)
# --------------------------------------------------------------------------

CAMPI_DIM = {"id", "titolo", "domande_esame", "enunciato", "ipotesi", "notazione",
             "idea", "passi", "formula_finale", "figure", "a_voce", "errori_frequenti",
             "versione_compatta", "a_buchi", "richiamo_attivo", "fonti", "verifica"}
STATI_VERIFICA = {"verificata_testo_prof", "verificata_file1_file3", "solo_file3",
                  "ricostruzione_non_del_prof", "da_verificare"}


@pytest.mark.parametrize("id_dim", sorted(DIMOSTRAZIONI))
def test_dimostrazione_conforme(id_dim):
    dim = DIMOSTRAZIONI[id_dim]
    assert CAMPI_DIM <= set(dim) <= CAMPI_DIM | {"varianti_notazione", "collegamenti"}
    assert dim["id"] == id_dim
    assert 3 <= len(dim["titolo"]) <= 120
    assert dim["domande_esame"] == DIM_W3[id_dim]["domande_esame"]
    assert len(dim["enunciato"]) >= 40
    assert len(dim["ipotesi"]) >= 1 and all(dim["ipotesi"])
    assert len(dim["notazione"]) >= 2
    for n in dim["notazione"]:
        assert set(n) == {"simbolo", "significato"}
        assert "$" not in n["simbolo"], "il simbolo è LaTeX puro, senza delimitatori"
    for v in dim.get("varianti_notazione", []):
        assert set(v) == {"canonica", "variante", "fonte"}
    assert 20 <= len(dim["idea"]) <= 200
    id_figure = {f["id"] for f in dim["figure"]}
    assert len(dim["passi"]) >= 4
    for i, passo in enumerate(dim["passi"], start=1):
        assert {"n", "testo", "perche"} <= set(passo) <= {"n", "testo", "formula", "perche", "figura"}
        assert passo["n"] == i
        assert len(passo["perche"]) >= 15
        if "formula" in passo:
            assert "$" not in passo["formula"]
        if "figura" in passo:
            assert passo["figura"] in id_figure
    assert dim["formula_finale"] and "$" not in dim["formula_finale"]
    assert len(dim["figure"]) >= 1
    assert 300 <= len(dim["a_voce"]) <= 1500
    assert len(dim["errori_frequenti"]) >= 2
    for e in dim["errori_frequenti"]:
        assert set(e) == {"errore", "perche_sbagliato", "correzione"}
    assert 3 <= len(dim["versione_compatta"]) <= 8
    buchi = [int(x) for x in re.findall(r"___(\d+)___", dim["a_buchi"]["testo"])]
    assert buchi == list(range(1, len(buchi) + 1)) and len(buchi) >= 3
    assert set(dim["a_buchi"]["soluzioni"]) == {str(b) for b in buchi}
    for var in dim["a_buchi"]["soluzioni"].values():
        assert isinstance(var, list) and len(var) >= 1 and all(var)
    assert 3 <= len(dim["richiamo_attivo"]) <= 5
    for d in dim["richiamo_attivo"]:
        assert set(d) == {"domanda", "risposta"}
    for c in dim.get("collegamenti", []):
        assert c in TUTTI
    assert len(dim["fonti"]) >= 1
    for f in dim["fonti"]:
        assert set(f) == {"chiave", "rif"} and f["chiave"] in CHIAVI_FONTI
    ver = dim["verifica"]
    assert set(ver) == {"stato", "data", "note", "punti_aperti"}
    assert ver["stato"] in STATI_VERIFICA
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", ver["data"])
    if ver["stato"].startswith("verificata"):
        pass
    else:
        assert ver["punti_aperti"], "punti_aperti non vuoto fuori dagli stati verificata_*"
    # Onestà: nessuna dimostrazione W3 può dirsi verificata sul testo del prof.
    assert ver["stato"] == "verificata_file1_file3"
    assert "NON TROVATO" in ver["note"]


def test_verifica_non_dichiara_mai_identita_col_testo_del_prof():
    for dim in DIMOSTRAZIONI.values():
        assert dim["verifica"]["stato"] != "verificata_testo_prof"
        assert "identica al testo" not in dim["verifica"]["note"].lower()


# --------------------------------------------------------------------------
# Figure (CONTRACTS §3.4)
# --------------------------------------------------------------------------

def figure_dei(mappa):
    for nome, doc in mappa.items():
        for fig in doc.get("figure", []):
            yield nome, fig


def test_figure_valide():
    for nome, fig in list(figure_dei(DIMOSTRAZIONI)) + list(figure_dei(LEZIONI)):
        assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", fig["id"]), (nome, fig["id"])
        assert 3 <= len(fig["titolo"]) <= 80
        assert len(fig["descrizione"]) >= 30
        if fig["tipo"] == "grafico":
            for asse_ in (fig["asse_x"], fig["asse_y"]):
                assert asse_["min"] < asse_["max"]
                assert "$" not in asse_["etichetta"]
                for t in asse_.get("tacche", []):
                    assert set(t) == {"valore", "etichetta"}
            assert len(fig["serie"]) >= 1
            for s in fig["serie"]:
                assert s["stile"] in ("linea", "tratteggio", "righe", "punti")
                assert 1 <= len(s["punti"]) <= 800
                for p in s["punti"]:
                    assert len(p) == 2 and all(isinstance(v, (int, float)) for v in p)
            for a in fig.get("annotazioni", []):
                assert set(a) == {"x", "y", "testo"}
        elif fig["tipo"] == "blocchi":
            ids = set()
            assert len(fig["blocchi"]) >= 2 and len(fig["collegamenti"]) >= 1
            for b in fig["blocchi"]:
                assert b["forma"] in ("rettangolo", "sommatore", "moltiplicatore",
                                       "ritardo", "nodo", "ingresso", "uscita")
                assert 0 <= b["colonna"] <= 12 and 0 <= b["riga"] <= 6
                assert "$" not in b["etichetta"]
                ids.add(b["id"])
            for c in fig["collegamenti"]:
                assert c["da"] in ids and c["a"] in ids
        else:
            pytest.fail(f"tipo di figura non atteso nei contenuti W3: {fig['tipo']}")


def test_id_figure_univoci_in_ogni_file():
    for mappa in (DIMOSTRAZIONI, LEZIONI):
        for nome, doc in mappa.items():
            ids = [f["id"] for f in doc.get("figure", [])]
            assert len(ids) == len(set(ids)), nome


# --------------------------------------------------------------------------
# Testo: accenti, parole vietate, LaTeX e dollari bilanciati
# --------------------------------------------------------------------------

def dollari_bilanciati(s):
    i, in_linea, in_display = 0, False, False
    while i < len(s):
        if s[i:i + 2] == "$$":
            in_display = not in_display
            i += 2
        elif s[i] == "$":
            in_linea = not in_linea
            i += 1
        else:
            i += 1
    return not in_linea and not in_display


def test_testi_puliti_e_latex_bilanciato():
    vietate = re.compile(r"\b(null|undefined|NaN)\b")
    cattive = re.compile(r"(?<![A-Za-zÀ-ÿ])(perche|piu|puo|gia|cosi)(?![A-Za-zÀ-ÿ])"
                         r"|(?<![A-Za-zÀ-ÿ])e'|perche'|piu'|puo'|gia'")
    for s in TUTTE_LE_STRINGHE:
        assert not vietate.search(s), s[:120]
        assert not cattive.search(s), s[:120]
        assert dollari_bilanciati(s), s[:120]


def test_latex_puro_senza_dollari_e_con_graffe_bilanciate():
    puri = []
    for dim in DIMOSTRAZIONI.values():
        puri.append(dim["formula_finale"])
        puri += [n["simbolo"] for n in dim["notazione"]]
        puri += [p["formula"] for p in dim["passi"] if "formula" in p]
    for f in puri:
        assert "$" not in f
        assert f.count("{") == f.count("}"), f


def test_notazione_documenta_le_decisioni():
    testo = (ROOT / "docs" / "NOTAZIONE.md").read_text(encoding="utf-8")
    for attesa in ("Punto A2", "Punto A3", "Punto A4", "Nota A1",
                   "unilaterale", "NON TROVATO", "\\dfrac{1}{\\pi T}", "T\\, X_s",
                   "\\varphi_n = -\\arg(c_n)"):
        assert attesa in testo, attesa


# --------------------------------------------------------------------------
# Controlli numerici sulle formule finali e sulle figure
# --------------------------------------------------------------------------

def punti_figura(doc, id_fig):
    fig = next(f for f in doc["figure"] if f["id"] == id_fig)
    return fig


def valore_vicino(punti, x, tol=0.06):
    return min(punti, key=lambda p: abs(p[0] - x))[1]


def test_numerico_t1_sinc_e_ricostruzione():
    dim = DIMOSTRAZIONI["dim-teorema-campionamento"]
    punti = punti_figura(dim, "seno-cardinale-ricostruzione")["serie"][0]["punti"]
    assert valore_vicino(punti, 0) == pytest.approx(1.0, abs=1e-3)
    for m in (-2, -1, 1, 2):
        assert valore_vicino(punti, m) == pytest.approx(0.0, abs=2e-3)
    repliche = punti_figura(dim, "spettro-e-repliche")["serie"]
    assert max(p[1] for p in repliche[0]["punti"]) == pytest.approx(1.0, abs=1e-3)
    assert max(p[0] for p in repliche[0]["punti"]) <= 2.0

    sinc = lambda z: 1.0 if abs(z) < 1e-12 else math.sin(math.pi * z) / (math.pi * z)
    campioni = {-2: 0.5, -1: -1.0, 0: 2.0, 1: 0.25, 2: 1.5}
    for m, xm in campioni.items():
        ricostruito = sum(x * sinc(m - n) for n, x in campioni.items())
        assert ricostruito == pytest.approx(xm, abs=1e-9)
    # Condizione numerica: banda telefonica 3400 Hz -> fs minima 6800 Hz.
    assert 2 * 3400 == 6800
    assert 1 / 6800 == pytest.approx(147.06e-6, rel=1e-3)
    # T1-2 inserisce il caso aliasing: la ricostruzione è ora al passo 6.
    assert "T\\, X_s" in dim["passi"][5]["formula"]


def test_numerico_t2_impulso_e_limite():
    dim = DIMOSTRAZIONI["dim-impulso-dirac-trasformata"]
    punti = punti_figura(dim, "impulso-ausiliario-d")["serie"][0]["punti"]
    area = sum((punti[i + 1][0] - punti[i][0]) * (punti[i][1] + punti[i + 1][1]) / 2
               for i in range(len(punti) - 1))
    assert area == pytest.approx(1.0, abs=1e-9)
    ft = punti_figura(dim, "trasformata-impulso-ausiliario")["serie"][0]["punti"]
    assert valore_vicino(ft, 0) == pytest.approx(1.0, abs=1e-3)

    def modulo_ft_d(omega, delta):
        x = omega * delta / 2
        return 1.0 if x == 0 else abs(math.sin(x) / x)

    assert modulo_ft_d(10.0, 1e-3) == pytest.approx(1.0, abs=1e-4)
    assert modulo_ft_d(10.0, 0.5) < 0.32  # lontano dal limite: la curva è scesa
    assert dim["formula_finale"].rstrip().endswith("\\forall \\omega")


def test_numerico_t3_filtro_trasversale():
    dim = DIMOSTRAZIONI["dim-filtro-trasversale"]
    punti = punti_figura(dim, "ampiezza-h-trasversale-esempio")["serie"][0]["punti"]
    for w, v in punti[::20]:
        assert v == pytest.approx(math.sqrt(1.25 + math.cos(w)), abs=2e-3)
    assert valore_vicino(punti, 0) == pytest.approx(1.5, abs=1e-3)
    # Periodicità 2π con T = 1 s.
    assert valore_vicino(punti, 1.0) == pytest.approx(valore_vicino(punti, 1.0 + 2 * math.pi), abs=5e-3)

    def h_trasversale(pesi, omega, T=1.0):
        return sum(h * complex(math.cos(-k * omega * T), math.sin(-k * omega * T))
                   for k, h in enumerate(pesi))

    assert h_trasversale([1, -0.5], 0) == pytest.approx(0.5)
    assert abs(h_trasversale([1, 0.5], math.pi)) == pytest.approx(0.5)
    assert "\\sum_{k=0}^{N-1} h_k e^{-jk\\omega T}" in dim["formula_finale"]


def test_numerico_t4_risposta_impulsiva():
    dim = DIMOSTRAZIONI["dim-risposta-impulsiva-h"]
    punti = punti_figura(dim, "risposta-impulsiva-causale-esempio")["serie"][0]["punti"]
    for t, v in punti:
        if t < 0:
            assert v == 0.0
    assert valore_vicino(punti, 1.0) == pytest.approx(math.exp(-1), abs=3e-3)
    # H(0) = integrale di h: per h(t) = e^-t u(t) vale 1.
    n, passo = 20000, 10 / 20000
    integrale = sum(math.exp(-(i * passo)) for i in range(n)) * passo
    assert integrale == pytest.approx(1.0, abs=1e-3)
    assert "H(\\omega) = F[h(t)]" in dim["formula_finale"]


def test_numerico_t5_pam():
    dim = DIMOSTRAZIONI["dim-pam-due-spettri"]
    righe = punti_figura(dim, "spettro-a-righe-pam")["serie"][0]["punti"]
    for x, _ in righe:
        assert x / (2 * math.pi) == pytest.approx(round(x / (2 * math.pi)), abs=1e-3)
    dist = punti_figura(dim, "spettro-distribuito-pam")["serie"][0]["punti"]
    assert valore_vicino(dist, 0) == pytest.approx(1.0, abs=1e-3)
    for x0 in (2 * math.pi, 4 * math.pi):
        assert valore_vicino(dist, x0) == pytest.approx(0.0, abs=2e-3)

    # Caso simboli centrati e incorrelati: solo inviluppo, fattore 1/(πT).
    T, g_quadro, c0 = 0.5, 4.0, 1.0
    unilaterale = (1 / (math.pi * T)) * g_quadro * c0
    bilaterale = (1 / (2 * math.pi * T)) * g_quadro * c0
    assert unilaterale == pytest.approx(2 * bilaterale)
    assert "\\frac{1}{\\pi T}" in dim["formula_finale"]
    # Le righe spariscono con valor medio zero: c_n è proporzionale a <a_n>.
    cn = lambda media, g: media / T * g
    assert cn(0.0, 3.0) == 0.0 and cn(0.25, 3.0) == pytest.approx(1.5)


def test_numerico_figure_delle_lezioni():
    serie = punti_figura(LEZIONI["serie-fourier"], "spettro-righe-impulsi-periodici")["serie"][0]["punti"]
    verso = {int(x): y for x, y in serie}
    assert verso[0] == pytest.approx(0.25, abs=1e-3)
    assert verso[1] == pytest.approx(0.2251, abs=1e-3)
    assert verso[4] == pytest.approx(0.0, abs=1e-3)

    energia = punti_figura(LEZIONI["energia-potenza-spettri"], "densita-unilaterale-esempio")["serie"][0]["punti"]
    area = sum((energia[i + 1][0] - energia[i][0]) * (energia[i][1] + energia[i + 1][1]) / 2
               for i in range(len(energia) - 1))
    assert area == pytest.approx(2.0, abs=1e-9)

    sistemi = punti_figura(LEZIONI["sistemi-lineari-funzione-trasferimento"],
                           "passa-basso-primo-ordine")["serie"][0]["punti"]
    assert valore_vicino(sistemi, 1.0) == pytest.approx(1 / math.sqrt(2), abs=4e-3)

    gauss = punti_figura(LEZIONI["processi-gaussiani-funzione-errore"], "densita-gaussiana")["serie"][0]["punti"]
    area_g = sum((gauss[i + 1][0] - gauss[i][0]) * (gauss[i][1] + gauss[i + 1][1]) / 2
                 for i in range(len(gauss) - 1))
    assert area_g == pytest.approx(1.0, abs=2e-3)
    assert valore_vicino(gauss, 0) == pytest.approx(1 / math.sqrt(2 * math.pi), abs=2e-3)

    processi = punti_figura(LEZIONI["processi-aleatori-stazionarieta-ergodicita"],
                            "autocorrelazione-triangolare")["serie"][0]["punti"]
    assert valore_vicino(processi, 0) == pytest.approx(2.0, abs=1e-3)
    assert valore_vicino(processi, -1.6) == pytest.approx(valore_vicino(processi, 1.6), abs=2e-3)

    nyquist = punti_figura(LEZIONI["criterio-nyquist-isi"],
                           "impulso-di-nyquist-banda-minima")["serie"][0]["punti"]
    assert valore_vicino(nyquist, 0) == pytest.approx(1.0, abs=1e-3)
    assert valore_vicino(nyquist, 2) == pytest.approx(0.0, abs=2e-3)

    pam = punti_figura(LEZIONI["segnali-pam"], "forma-onda-pam")["serie"][0]["punti"]
    assert valore_vicino(pam, 1.0) < 0.05  # simbolo 0: contributo quasi assente
    assert valore_vicino(pam, 0.0) > 0.9    # simbolo 1: cresta dell'impulso


def test_controlli_numerici_citati_nelle_lezioni():
    # Derivatore gaussiano (schema di file1 p. 23): σ² = G0·ωm³/3.
    g0, wm = 3.0, 2.0
    varianza = g0 * wm ** 3 / 3
    assert varianza == pytest.approx(8.0)
    assert 1 / math.sqrt(2 * math.pi * varianza) == pytest.approx(0.1410, abs=1e-3)
    testo_gauss = json.dumps(LEZIONI["processi-gaussiani-funzione-errore"], ensure_ascii=False)
    assert "0{,}1410" in testo_gauss or "0{,}141" in testo_gauss
    # Antitrasformata dello spettro rettangolare: x(0) = X0·ωm/π.
    assert 2 * 3 / math.pi == pytest.approx(1.9099, abs=1e-3)
    testo_trasf = json.dumps(LEZIONI["trasformata-fourier"], ensure_ascii=False)
    assert "1{,}91" in testo_trasf
    # Banda di Nyquist: ritmo massimo 1/T = Bω/π con Bω = 2π·3000.
    assert 2 * math.pi * 3000 / math.pi == pytest.approx(6000.0)


# --------------------------------------------------------------------------
# Round E, aree 1-3: B1-B3, B6 e B7 (EVOLUTION_PLAN §§3-5, 8)
# --------------------------------------------------------------------------

# Snapshot completo generato UNA volta da main 0ef8a4c, prima delle modifiche.
# Per B7 le sole eccezioni ammesse sono associate agli ID del piano; G-1/G-5
# riguardano le tre rappresentazioni derivate, S1-S8 i nuovi stati e gli agganci.
ECCEZIONI_E3 = {
    "dim-teorema-campionamento": {
        "passi": "T1-1,T1-2,T1-4,T1-5,C-4,S1-S8",
        "figure": "T1-3,C-4,S1-S8",
        "richiamo_attivo": "T1-6",
        "a_buchi": "T1-7,G-1,G-5",
        "versione_compatta": "T1-1,T1-2,T1-5,G-5",
        "a_voce": "T1-1,T1-2,T1-5,G-5",
    },
    "dim-impulso-dirac-trasformata": {
        "passi": "T2-1,T2-2,T2-3,C-1,S1-S8",
        "figure": "S1-S8",
        "a_buchi": "C-1,T2-1,G-5",
        "versione_compatta": "T2-1,T2-3,C-1,G-5",
        "a_voce": "T2-1,T2-3,C-1,G-5",
    },
    "dim-filtro-trasversale": {
        "passi": "T3-1,T3-2,T3-3,T3-4,S1-S8",
        "figure": "T3-2,S1-S8",
        "formula_finale": "T3-5",
        "richiamo_attivo": "T3-6",
        "a_buchi": "G-1,G-5",
        "versione_compatta": "T3-1,T3-4,G-5",
        "a_voce": "T3-1,T3-2,T3-4,T3-6,G-5",
    },
    "dim-risposta-impulsiva-h": {
        "passi": "T4-1,T4-2,T4-3,T4-4,C-2,S1-S8",
        "figure": "T4-4,C-2,S1-S8",
        "a_buchi": "T4-2,T4-3,G-5",
        "versione_compatta": "T4-2,T4-3,G-5",
        "a_voce": "T4-1,T4-2,T4-3,C-2,G-5",
    },
    "dim-pam-due-spettri": {
        "ipotesi": "T5-1",
        "varianti_notazione": "T5-1",
        "passi": "T5-1,T5-2,T5-3,T5-4,T5-5,T5-6,S1-S8",
        "figure": "T5-5,S1-S8",
        "errori_frequenti": "T5-7",
        "a_buchi": "G-1,G-5",
        "versione_compatta": "T5-1,T5-2,T5-4,T5-6,G-5",
        "a_voce": "T5-1,T5-2,T5-4,T5-5,T5-6,G-5",
    },
}
SNAPSHOT_E3 = ROOT / "tests" / "fixtures" / "invarianti_w3.json"


def test_e3_snapshot_proviene_da_main_0ef8a4c():
    import hashlib

    data = SNAPSHOT_E3.read_bytes()
    assert hashlib.sha256(data).hexdigest() == "50c3ac37074eda07579319e5c43e7a5ec7933c28f3a7cf6b3b3f4115027db0d7"
    snap = json.loads(data)
    assert snap["commit"] == "0ef8a4c7e488853798f6410cc45aca5ec3f45c21"
    assert set(snap["dimostrazioni"]) == set(DIMOSTRAZIONI) == set(ECCEZIONI_E3)


@pytest.mark.parametrize("id_dim", sorted(ECCEZIONI_E3))
def test_e3_b7_campi_non_autorizzati_invariati(id_dim):
    originale = carica_json("tests/fixtures/invarianti_w3.json")["dimostrazioni"][id_dim]
    attuale = DIMOSTRAZIONI[id_dim]
    assert set(attuale) == set(originale)  # nessun campo aggiunto o rimosso
    for chiave in originale:
        if chiave not in ECCEZIONI_E3[id_dim]:
            assert attuale[chiave] == originale[chiave], (id_dim, chiave)
    assert attuale["id"] == originale["id"]
    assert attuale["enunciato"] == originale["enunciato"]
    assert attuale["domande_esame"] == originale["domande_esame"]

    # Le figure originali restano tutte, con sole modifiche puntuali autorizzate.
    vecchie = {f["id"]: f for f in originale["figure"]}
    nuove = {f["id"]: f for f in attuale["figure"]}
    assert set(vecchie) <= set(nuove)
    modifiche = {
        "dim-teorema-campionamento": {"spettro-e-repliche": {"descrizione", "annotazioni"}},
        "dim-filtro-trasversale": {"schema-filtro-ricorrente-semplificato": {
            "titolo", "descrizione", "blocchi", "collegamenti"}},
        "dim-risposta-impulsiva-h": {"quadripolo-ingresso-generico": {"blocchi"}},
    }.get(id_dim, {})
    for nome, prima in vecchie.items():
        dopo = nuove[nome]
        permesse = modifiche.get(nome, set())
        for campo in set(prima) | set(dopo):
            if campo not in permesse:
                assert prima.get(campo) == dopo.get(campo), (id_dim, nome, campo)
    if id_dim == "dim-risposta-impulsiva-h":
        prima = vecchie["quadripolo-ingresso-generico"]["blocchi"]
        dopo = nuove["quadripolo-ingresso-generico"]["blocchi"]
        assert dopo[0] == {**prima[0], "etichetta": "x(t)"}
        assert dopo[1:] == prima[1:]

    if id_dim in ("dim-teorema-campionamento", "dim-filtro-trasversale"):
        assert attuale["richiamo_attivo"][:-1] == originale["richiamo_attivo"]
    if id_dim == "dim-pam-due-spettri":
        assert attuale["ipotesi"][1:] == originale["ipotesi"][1:]
        assert attuale["varianti_notazione"][:-1] == originale["varianti_notazione"]
        assert attuale["errori_frequenti"][:2] == originale["errori_frequenti"][:2]
        assert {k: v for k, v in attuale["errori_frequenti"][2].items() if k != "correzione"} == {
            k: v for k, v in originale["errori_frequenti"][2].items() if k != "correzione"}


def test_e3_b7_passi_originali_con_eccezioni_puntuali():
    snapshot = carica_json("tests/fixtures/invarianti_w3.json")["dimostrazioni"]
    # Coppie (indice nel vecchio, indice nel nuovo, soli campi modificabili).
    corrispondenze = {
        "dim-teorema-campionamento": [
            (0, 0, {"testo", "figura"}), (1, 1, {"figura"}),
            (3, 4, {"n", "testo", "perche", "figura"}), (4, 5, {"n"}),
            (5, 6, {"n", "testo", "figura"}), (6, 7, {"n"}), (7, 8, {"n"})],
        "dim-impulso-dirac-trasformata": [
            (0, 0, set()), (1, 1, {"testo", "perche", "figura"}),
            (2, 2, set()), (3, 3, set()), (4, 4, set()),
            (5, 5, {"formula", "perche"}), (6, 6, set()), (7, 7, {"perche"})],
        "dim-filtro-trasversale": [
            (0, 0, {"testo", "perche", "figura"}), (1, 1, {"testo", "figura"}),
            (2, 2, set()), (4, 5, {"n", "perche"}), (5, 6, {"n", "perche"}),
            (6, 7, {"n", "testo", "formula", "perche"})],
        "dim-risposta-impulsiva-h": [
            (0, 0, {"figura"}), (1, 1, {"figura"}), (2, 2, set()),
            (3, 3, set()), (4, 4, set()), (5, 5, {"figura"}), (6, 6, {"testo"})],
        "dim-pam-due-spettri": [
            (0, 0, {"testo", "formula", "perche"}), (1, 1, set()), (2, 2, set()),
            (3, 3, set()), (7, 7, {"n"}), (9, 10, {"n", "testo", "figura"})],
    }
    for id_dim, coppie in corrispondenze.items():
        for precedente, corrente, permesse in coppie:
            vecchio = snapshot[id_dim]["passi"][precedente]
            nuovo = DIMOSTRAZIONI[id_dim]["passi"][corrente]
            for campo in set(vecchio) | set(nuovo):
                if campo not in permesse:
                    assert vecchio.get(campo) == nuovo.get(campo), (id_dim, precedente + 1, campo)


@pytest.mark.parametrize("id_dim", sorted(DIMOSTRAZIONI))
def test_e3_b3_controllo_strutturale_r6(id_dim):
    d = DIMOSTRAZIONI[id_dim]
    assert 4 <= len(d["passi"]) <= 12
    assert [p["n"] for p in d["passi"]] == list(range(1, len(d["passi"]) + 1))
    figure = [f["id"] for f in d["figure"]]
    usate = [p["figura"] for p in d["passi"] if p.get("figura")]
    assert len(figure) == len(set(figure))
    assert len(usate) == len(set(usate))  # zero figure ripetute
    assert set(figure) == set(usate)  # zero figure orfane e nessun riferimento ignoto
    for passo in d["passi"]:
        assert passo.get("formula") or passo.get("figura")
        assert len(passo.get("perche", "")) >= 40
    for varianti in d["a_buchi"]["soluzioni"].values():
        assert varianti and all(not re.search(r"[\\$^_]", variante) for variante in varianti)
    assert 300 <= len(d["a_voce"]) <= 1500
    assert len(d.get("collegamenti", [])) >= 2
    assert all(i in TUTTI for i in d["collegamenti"])


def catena_grafici(d, passi):
    stati = [punti_figura(d, d["passi"][n - 1]["figura"]) for n in passi]
    assert passi == list(range(passi[0], passi[-1] + 1))
    for f in stati:
        assert f["tipo"] == "grafico"
        assert not re.search(r"[\u0370-\u03ff\u2070-\u209f\u2200-\u22ff]", f["descrizione"])
        ax, ay = f["asse_x"], f["asse_y"]
        for serie in f["serie"]:
            assert all(ax["min"] <= x <= ax["max"] and ay["min"] <= y <= ay["max"]
                       for x, y in serie["punti"])
        for a in f.get("annotazioni", []):
            assert ax["min"] <= a["x"] <= ax["max"] and ay["min"] <= a["y"] <= ay["max"]
    for prima, dopo in zip(stati, stati[1:]):
        assert prima["asse_x"] == dopo["asse_x"] and prima["asse_y"] == dopo["asse_y"]
        assert dopo["serie"][:len(prima["serie"])] == prima["serie"]
        annotazioni = prima.get("annotazioni", [])
        assert all(a in dopo.get("annotazioni", []) for a in annotazioni)
        assert len(dopo["serie"]) + len(dopo.get("annotazioni", [])) > len(prima["serie"]) + len(annotazioni)
    return stati


def catena_blocchi(d, passi):
    stati = [punti_figura(d, d["passi"][n - 1]["figura"]) for n in passi]
    assert passi == list(range(passi[0], passi[-1] + 1))
    for prima, dopo in zip(stati, stati[1:]):
        assert prima["tipo"] == dopo["tipo"] == "blocchi"
        blocchi = {b["id"]: b for b in dopo["blocchi"]}
        assert all(blocchi[b["id"]] == b for b in prima["blocchi"])
        assert all(c in dopo["collegamenti"] for c in prima["collegamenti"])
        assert len(dopo["blocchi"]) + len(dopo["collegamenti"]) > len(prima["blocchi"]) + len(prima["collegamenti"])
        for f in (prima, dopo):
            assert not re.search(r"[\u0370-\u03ff\u2070-\u209f\u2200-\u22ff]", f["descrizione"])
    return stati


def test_e3_b1_campionamento_centrale_repliche_alias_filtro():
    d = DIMOSTRAZIONI["dim-teorema-campionamento"]
    stati = catena_grafici(d, [1, 2, 3, 4, 5])
    assert [f["id"] for f in stati] == ["spettro-solo-centrale", "spettro-centrale-e-repliche",
        "spettro-e-repliche", "spettro-aliasing", "spettro-repliche-filtro"]
    assert len(stati[0]["serie"]) == 1
    assert len(stati[1]["serie"]) >= 3  # C-4: centrale e repliche già al passo 2
    assert all("alias" not in s.get("etichetta", "").lower() for s in stati[2]["serie"])
    assert "alias" in stati[3]["serie"][-2]["etichetta"]
    assert all("filtro" not in s.get("etichetta", "").lower() for s in stati[3]["serie"])
    assert "filtro" in stati[4]["serie"][-1]["etichetta"]
    assert "due casi alternativi" in stati[3]["descrizione"]
    assert "non corregge" in stati[4]["descrizione"]
    # La replica nel secondo caso è centrata in 3 e interseca la banda [-2, 2].
    replica_alias = stati[3]["serie"][-2]["punti"]
    assert replica_alias[0][0] == 1 and replica_alias[-1][0] == 5
    assert max(replica_alias, key=lambda p: p[1]) == [3, 1]
    assert replica_alias[0][0] < max(x for x, _ in stati[0]["serie"][0]["punti"])


def test_e3_b1_pam_righe_continuo_sovrapposizione():
    d = DIMOSTRAZIONI["dim-pam-due-spettri"]
    a, b, c = catena_grafici(d, [9, 10, 11])
    assert [a["id"], b["id"], c["id"]] == ["spettro-pam-righe-progressivo",
        "spettro-pam-righe-continuo", "spettro-pam-totale"]
    assert [s["stile"] for s in a["serie"]] == ["righe", "tratteggio"]
    assert b["serie"][-1]["stile"] == "linea"
    assert c["annotazioni"][-1]["testo"] == "Righe + continuo"
    assert "normalizzate separatamente" in c["descrizione"]
    assert "incorrelati" in b["descrizione"]
    for x, _ in a["serie"][0]["punti"]:
        assert x / (2 * math.pi) == pytest.approx(round(x / (2 * math.pi)), abs=1e-3)
    assert a["serie"][0]["punti"][1][1] == pytest.approx((2 / math.pi) ** 2, abs=1e-4)


def test_e3_b2_tutte_le_cinque_schede_hanno_una_coppia_progressiva():
    catena_grafici(DIMOSTRAZIONI["dim-teorema-campionamento"], [1, 2])
    catena_grafici(DIMOSTRAZIONI["dim-impulso-dirac-trasformata"], [1, 2])
    catena_blocchi(DIMOSTRAZIONI["dim-filtro-trasversale"], [1, 2])
    catena_blocchi(DIMOSTRAZIONI["dim-risposta-impulsiva-h"], [1, 2])
    catena_grafici(DIMOSTRAZIONI["dim-pam-due-spettri"], [9, 10])


def test_e3_b6_aliasing_e_separazione():
    fm, fs = 100, 150
    fa = abs(fm - fs)
    assert fa == 50 and fs < 2 * fm
    for n in range(-5, 6):
        assert math.cos(2 * math.pi * fm * n / fs) == pytest.approx(
            math.cos(2 * math.pi * fa * n / fs), abs=1e-12)
    assert 250 > 2 * fm
    richiamo = DIMOSTRAZIONI["dim-teorema-campionamento"]["richiamo_attivo"][-1]
    assert all(n in richiamo["domanda"] + richiamo["risposta"] for n in ("100", "150", "50", "250"))


def test_e3_b6_potenza_pam_simboli_equiprobabili():
    # Rettangolo di durata T e altezza unitaria; per simboli indipendenti ±1,
    # C0 = E[a²] = 1, media zero, Gx = |G|²/(πT). Integro il semiasse.
    T = 0.7
    da = 0.05 / T
    n = 80000
    def gx(w):
        u = w * T / 2
        return T / math.pi * (1 if u == 0 else (math.sin(u) / u) ** 2)
    potenza = sum(gx((i + 0.5) * da) for i in range(n)) * da
    media_quadratica = ((+1) ** 2 + (-1) ** 2) / 2
    assert potenza == pytest.approx(media_quadratica, abs=4e-4)
    assert media_quadratica == 1
    passo = DIMOSTRAZIONI["dim-pam-due-spettri"]["passi"][-1]
    assert "2\\pi T" in passo["formula"] and "= 1" in passo["formula"]
    assert "indipendenti" in passo["testo"]


def test_e3_t2_t3_t4_casi_numerici_e_fonti():
    t2 = DIMOSTRAZIONI["dim-impulso-dirac-trasformata"]
    assert 2 * math.pi / 0.5 == pytest.approx(12.57, abs=0.01)
    assert "12{,}57" in t2["passi"][7]["perche"]
    assert "sinistro" in t2["passi"][1]["testo"]
    assert r"\delta(-\tau)=\delta(\tau)" in t2["passi"][5]["perche"]

    t3 = DIMOSTRAZIONI["dim-filtro-trasversale"]
    def h(w):
        return 1 + 0.5 * complex(math.cos(-w), math.sin(-w))
    assert h(0).real == pytest.approx(1.5)
    assert h(math.pi).real == pytest.approx(0.5)
    assert "cerchio unitario" in t3["passi"][-1]["perche"]
    schema = punti_figura(t3, "schema-filtro-ricorrente-semplificato")
    assert sum(b["forma"] == "sommatore" for b in schema["blocchi"]) == 1
    assert sum(b["forma"] == "ritardo" for b in schema["blocchi"]) >= 6
    assert {"my1", "my2", "mym", "m0", "m1", "m2", "mn"} <= {b["id"] for b in schema["blocchi"]}
    assert {c["a"] for c in schema["collegamenti"] if c["da"] == "out"} == {"ry1"}

    t4 = DIMOSTRAZIONI["dim-risposta-impulsiva-h"]
    rettangolo = punti_figura(t4, "quadripolo-ingresso-d")
    assert [b["etichetta"] for b in rettangolo["blocchi"]] == ["D(t, Δ)", "Q", "y(t)"]
    assert t4["passi"][0]["figura"] == rettangolo["id"]
    assert t4["passi"][5]["figura"] == "quadripolo-ingresso-generico"
    # h(t)=exp(-t)u(t): risposta a un rettangolo unitario per t>Δ.
    delta, t = 1e-4, 1.0
    y_delta = math.exp(-t) * math.expm1(delta) / delta
    assert y_delta == pytest.approx(math.exp(-t), rel=1e-4)
    assert r"h(t) = \lim_{\Delta \to 0} y(t)" in t4["passi"][1]["formula"]
    assert r"\lim_{\Delta\to0}F[D(t,\Delta)]=1" == t4["passi"][7]["formula"]
    assert r"\cdot1" in t4["passi"][8]["formula"]


def test_e3_t5_correzioni_limitate_e_medie():
    d = DIMOSTRAZIONI["dim-pam-due-spettri"]
    assert d["passi"][0]["formula"] in d["ipotesi"][0]
    assert "2N+1" in d["passi"][0]["formula"]
    assert "2N+1" in d["varianti_notazione"][-1]["canonica"]
    assert "2N" in d["varianti_notazione"][-1]["variante"]
    assert r"\lim_{N\to\infty}\frac{1}{2NT}" in d["passi"][5]["formula"]
    assert r"\phi[\tau-(i-n)T]" in d["passi"][6]["formula"]
    assert "int_" not in d["passi"][6]["formula"]
    assert r"\{C_k\}*\phi" in d["passi"][8]["formula"]
    assert r"C_0+2\sum" in d["passi"][9]["formula"]
    assert d["passi"][10]["figura"] == "spettro-pam-totale"
    assert "passi 5-10" in d["errori_frequenti"][2]["correzione"]
