# Contratti del knowledge graph — Round 1

Il piano è [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md); le ricerche sono in `docs/research/` (R1, R2, R3). Questo file è **vincolante**: campi, ID, nomi dei file, scope e interfacce non si cambiano senza il coordinatore. Se un worker ritiene necessario un cambio, lo scrive nel report finale invece di applicarlo.

## 1. Layout dei file

```
README.md                         W1
requirements.txt, pytest.ini, .gitignore   W1
.github/workflows/pages.yml       W1
docs/
  IMPROVEMENT_PLAN.md, CONTRACTS.md      coordinatore
  research/R1..R3                        coordinatore (sola lettura)
  DIDATTICA.md                           W1
  NOTAZIONE.md                           W3
  QUIZ_FORMAT.md                         W6
  PIANO_STUDIO.md, MAPPA_ESAME.md        GENERATI (scripts/gen_docs.py)
schema/
  node.schema.json, lezione.schema.json, dimostrazione.schema.json, figura.schema.json   W1
  esame.schema.json, quiz.schema.json                                                   W6
graph/
  meta.json                              W1
  parts/area-N.json                      W3 (N=1,2,3), W4 (4,5), W5 (6,7)
  parts/area-N-esercizi.json             W6 (N=1,2,3,7)
  lezioni/<id>.json                      autore del nodo
  dimostrazioni/<id>.json                autore del nodo (solo tipo "dimostrazione")
  esame.json, quiz.json                  W6
  graph.json                             GENERATO (scripts/kg.py build)
scripts/
  kg.py, topo.py, gen_docs.py, check_urls.py, check_testo.py, contratto.py   W1
tests/
  conftest.py, test_schema.py, test_graph.py, test_integrita.py, test_tooling.py, test_ci.py, fixtures/**   W1
  test_contenuti_w3.py / _w4.py / _w5.py                                                                  W3 / W4 / W5
  test_esercizi.py, test_esame.py, test_quiz.py                                                           W6
web/                                     W2, tranne:
  modules/quiz/**, tests/quiz*.test.js, tests/test_e2e_quiz.py             W6
  graph.json, quiz.json                  GENERATI da web/build.sh, non versionati (.gitignore)
```

**Mai nel repo:** i PDF (`file1.pdf`, `file2.pdf`, `file3.pdf`), loro rendering a immagine, testi integrali estratti, testi integrali delle domande a risposta multipla. Test di W1: nessun `*.pdf` versionato.

**File generati** (`graph/graph.json`, `docs/PIANO_STUDIO.md`, `docs/MAPPA_ESAME.md`): ogni worker li rigenera sul proprio ramo per avere i test verdi, ma non ne è proprietario; in integrazione i conflitti si risolvono **rigenerando** da `main`, mai a mano.

## 2. Comandi

```bash
python scripts/kg.py build && python scripts/gen_docs.py build && sh web/build.sh
python scripts/kg.py check            # graph.json coincide con la build; riferimenti validi
python scripts/kg.py check --completo # solo in integrazione: tutti gli ID di §4 presenti, niente pendenti
python scripts/check_testo.py         # accenti, null/undefined/NaN, LaTeX bilanciato
python scripts/check_urls.py          # solo gli URL di "risorse"
npm test --prefix web                 # node --test web/tests/*.test.js
pytest -q                             # testpaths = tests web/tests; e2e Playwright inclusi
```

CI: **0 failed, 0 skipped** sia per node sia per pytest. Vietati `skip`, `skipif`, `xfail`, `--ignore`, `-k "not …"`, `continue-on-error`, test e2e rimossi o resi condizionali.

## 3. Schemi dei dati

Tutti gli schemi: JSON Schema Draft 2020-12, `additionalProperties: false`, codifica UTF-8, indentazione 2 spazi. **Testo**: Markdown semplice (paragrafi, elenchi, grassetto, `### sottotitoli`) con LaTeX in linea `$…$` e in display `$$…$$` (backslash raddoppiati nel JSON). I campi indicati come *LaTeX puro* contengono solo LaTeX, senza delimitatori `$`. Le etichette nelle figure SVG sono **testo Unicode semplice** (ω, τ, ₀, ², →), senza LaTeX. Nessuna stringa può valere o contenere come parola isolata `null`, `undefined`, `NaN` (la parola «nulli» è ammessa).

### 3.1 Nodo — `schema/node.schema.json` (elementi degli array in `graph/parts/*.json`)

| Campo | Tipo e vincoli | Significato |
|---|---|---|
| `id` | stringa kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 64 | Deve essere nella lista di §4, con stessi `area`, `tipo`, `worker`. |
| `titolo` | stringa 3–120 | Titolo italiano. |
| `area` | intero 1–7 | Uguale al numero del file part. |
| `tipo` | `concetto` \| `dimostrazione` \| `tipo_esercizio` | Come in §4. |
| `gruppo` | `A` \| `B` \| `C` | A = richiesto da una prova di file2 (T, E, M, I) o prerequisito diretto; B = nel programma ufficiale (R1) ma non chiesto in file2; C = approfondimento/extra. Come in §4. |
| `worker` | `W1`–`W6` | Autore. |
| `sapere` | stringa ≥ 40 | Cosa si deve sapere. |
| `saper_fare` | array ≥ 1 di stringhe | Criteri osservabili («so ricavare…», «so disegnare…»). |
| `prerequisiti` | array di `{id, forza: "hard"\|"soft", motivo}` | Deve contenere **almeno** i `prerequisiti_hard` di §4 (come `hard`); altri archi `soft` solo verso ID di §4. Niente self-loop né cicli. |
| `tempo_studio_min` | intero 5–600 | Stima, non durata d'esame. |
| `priorita` | `{livello: "alta"\|"media"\|"bassa", motivazione}` | `alta` = nodo con prova T/E diretta o prerequisito hard di una T; `media` = altro gruppo A/B; `bassa` = C. Motivazione senza punteggi non documentati (solo T5 e T11 valgono «10 punti»). |
| `fonti` | array ≥ 1 di `{chiave, rif}` | `chiave` in `meta.fonti` (§5); `rif` = pagina/slide, es. «file3 pp. 1-2», «p. 2.40 (rif. in file1 p. 7)»; se sconosciuto «NON TROVATO». |
| `risorse` | array (anche vuoto) di `{titolo, url, verificato: true}` | Solo URL della allowlist di §5. |
| `checklist_ripasso` | array di stringhe, opzionale | Spunti per il ripasso. |

`graph.json` aggiunge a ogni nodo, in build: `lezione` (da `graph/lezioni/<id>.json`, se esiste), `dimostrazione` (da `graph/dimostrazioni/<id>.json`, se esiste), `domande_esame` (ID delle prove che in `esame.json` puntano al nodo, ordinati).

### 3.2 Lezione — `schema/lezione.schema.json` (`graph/lezioni/<id>.json`)

Obbligatoria per `concetto` e `tipo_esercizio`, facoltativa per `dimostrazione`. Oggetto con `id` (= nodo) e questi 13 campi obbligatori (stile di `docs/DIDATTICA.md`):

| Campo | Contratto |
|---|---|
| `perche_ti_serve` | stringa 20–300: dove serve all'esame (ID delle prove), gruppo; punti solo se documentati. |
| `scenario` | stringa ≥ 50: scenario concreto ricorrente (es. telefonata trasmessa su un collegamento numerico). |
| `definizione_esame` | `{definizione, scopo, esempio}`, stringhe non vuote. |
| `spiegazione` | stringa ≥ 1200, a blocchi con almeno due `### ` sottotitoli e almeno una formula LaTeX. |
| `analogia` | `{testo, limite}`. |
| `worked_example` | `{titolo, problema, passi: [stringa] ≥ 3, soluzione, perche_funziona}`. |
| `completion_problem` | `{titolo, testo, passi_mancanti: [stringa] ≥ 1, soluzione}`. |
| `esercizio_autonomo` | `{titolo, testo, suggerimento, soluzione_attesa}`. |
| `errori_trappole` | array ≥ 2 di `{errore, perche_sbagliato}`. |
| `richiamo_attivo` | `{domande: [{domanda, risposta}] 3–5, spiega_con_parole_tue}`. |
| `riepilogo` | stringa 40–800, al più 5 righe. |
| `flashcard` | array 1–6 di `{fronte, retro}`. |
| `checklist` | `{so_fare: [stringa] ≥ 1, so_dire: [stringa] ≥ 1}`. |

Campo facoltativo: `figure` (array di figure §3.4).

### 3.3 Dimostrazione — `schema/dimostrazione.schema.json` (`graph/dimostrazioni/<id>.json`)

Obbligatoria per ogni nodo `tipo: "dimostrazione"`. Formato didattico in IMPROVEMENT_PLAN.md §3.

| Campo | Contratto |
|---|---|
| `id` | = nodo. |
| `titolo` | stringa 3–120. |
| `domande_esame` | array ≥ 1 di ID prova (`T1`–`T17`, `M1`–`M34`), uguale ai `domande_esame` di §4 per le T. |
| `enunciato` | stringa ≥ 40: enunciato esatto da memorizzare. |
| `ipotesi` | array ≥ 1 di stringhe. |
| `notazione` | array ≥ 2 di `{simbolo (LaTeX puro), significato}`. |
| `varianti_notazione` | array, opzionale, di `{canonica, variante, fonte}` (es. ω vs m in file3). |
| `idea` | stringa 20–200: l'idea in una riga. |
| `passi` | array ≥ 4 di `{n, testo, formula?, perche, figura?}`: `n` interi consecutivi da 1; `formula` LaTeX puro; `perche` ≥ 15 caratteri (proprietà, ipotesi o passo precedente che lo giustifica); `figura` = `id` di una figura dell'array `figure`. |
| `formula_finale` | LaTeX puro, non vuoto. |
| `figure` | array ≥ 1 di figure (§3.4). |
| `a_voce` | stringa 300–1500: cosa dire a voce (60–90 secondi). |
| `errori_frequenti` | array ≥ 2 di `{errore, perche_sbagliato, correzione}`. |
| `versione_compatta` | array 3–8 di stringhe (righe da memorizzare). |
| `a_buchi` | `{testo, soluzioni}`: `testo` con segnaposto `___1___`, `___2___`, … (≥ 3, consecutivi); `soluzioni` = oggetto `{"1": [varianti accettate ≥ 1], …}` con esattamente le stesse chiavi. |
| `richiamo_attivo` | array 3–5 di `{domanda, risposta}`. |
| `collegamenti` | array, opzionale, di ID di §4 (interleaving). |
| `fonti` | array ≥ 1 di `{chiave, rif}` (chiavi di §5). |
| `verifica` | `{stato, data, note, punti_aperti}`: `stato` ∈ `verificata_testo_prof` \| `verificata_file1_file3` \| `solo_file3` \| `ricostruzione_non_del_prof` \| `da_verificare`; `data` `YYYY-MM-DD`; `note` stringa; `punti_aperti` array di stringhe (vuoto solo se lo stato è `verificata_*`). |

### 3.4 Figura — `schema/figura.schema.json`

Campi comuni: `id` (kebab-case, univoco nel file), `tipo` ∈ `grafico` \| `blocchi` \| `temporale`, `titolo` (3–80), `descrizione` (≥ 30, testo alternativo accessibile che descrive cosa mostra la figura).

- **`grafico`** (spettri, forme d'onda, curve S(a), ρ(G)): `asse_x` e `asse_y` = `{etichetta, min, max, tacche?: [{valore, etichetta}]}` con `min < max`; `serie` array ≥ 1 di `{stile: "linea"|"tratteggio"|"righe"|"punti", punti: [[x, y], …] (1–800 coppie numeriche), etichetta?}` (`righe` = segmenti verticali da y=0, per spettri a righe); `annotazioni?` array di `{x, y, testo}`. I punti si calcolano offline (script non versionato o calcolo a mano) e vanno controllati numericamente nei test (es. massimo di ρ = G·e^{−2G} in G = 0,5).
- **`blocchi`** (schemi a blocchi, catene nascita-morte): `blocchi` array ≥ 2 di `{id, etichetta, forma: "rettangolo"|"sommatore"|"moltiplicatore"|"ritardo"|"nodo"|"ingresso"|"uscita", colonna: 0–12, riga: 0–6}`; `collegamenti` array ≥ 1 di `{da, a, etichetta?}` con `da`/`a` ID di blocchi esistenti.
- **`temporale`** (diagrammi temporali: sliding window, ALOHA, CSMA/CD, TDMA): `asse_t` `{etichetta, min, max}`; `corsie` array ≥ 1 di `{id, etichetta}`; `intervalli` array ≥ 1 di `{corsia, t0, t1, etichetta?, stile: "trasmissione"|"attesa"|"collisione"|"ack"}` con `t0 < t1`; `frecce?` array di `{da: {corsia, t}, a: {corsia, t}, etichetta?}`; `marcatori?` array di `{t, etichetta}`.

### 3.5 Mappa d'esame — `graph/esame.json` (W6; schema `schema/esame.schema.json`)

```json
{"versione": 1,
 "avvertenza": "Raccolta di studenti (file2), non prova ufficiale; frequenze e punteggi non indicati = NON TROVATO.",
 "prove": [{"id": "T5", "tipo": "teoria", "titolo": "Segnali PAM: definizione e due spettri", "punti": 10, "nodi": ["dim-pam-due-spettri"], "fonte": "FILE2"}]}
```

`id` ∈ `T1`–`T17` (`tipo: "teoria"`), `E1`–`E9` (`"esercizio"`), `M1`–`M34` (`"quiz"`), `I1`–`I9` (`"intro_reti"`); tutti presenti esattamente una volta. `titolo` = titolo breve **riformulato** (≤ 120 caratteri, mai il testo integrale dei quiz). `punti` = `10` solo per T5 e T11, altrimenti la stringa `"NON TROVATO"`. `nodi` ≥ 1, ID di §4, coerenti con i `domande_esame` di §4. `fonte` = `"FILE2"`.

### 3.6 `graph/graph.json` e `scripts/kg.py` (W1)

- `build`: legge `meta.json`, tutti i `parts/*.json` (nomi `area-N.json` o `area-N-<suffisso>.json`, N 1–7, `area` di ogni nodo = N), `lezioni/*.json`, `dimostrazioni/*.json`, `esame.json` se presente; valida con gli schemi; scrive `{versione, meta, aree, nodi, esame, pendenti}` con `nodi` ordinati per `(area, id)`, `esame` = array `prove` (o `[]`), `pendenti` = ID di §4 citati come prerequisiti ma non ancora presenti (lavoro in parallelo).
- Errori di build: ID duplicati; nodo assente da §4 o con `area`/`tipo`/`worker` diversi; prerequisito che non è in §4; ciclo (archi hard+soft, contando anche quelli verso nodi pendenti tramite §4); lezione/dimostrazione senza nodo; dimostrazione mancante per un nodo `dimostrazione` presente; `fonti.chiave` non dichiarata; URL di `risorse` fuori allowlist.
- `check`: ricostruisce in memoria e confronta con `graph/graph.json`. `check --completo`: in più tutti gli ID di §4 presenti, ogni `concetto`/`tipo_esercizio` con lezione, `pendenti` vuoto, `esame.json` completo.
- `scripts/contratto.py`: unica funzione pubblica `carica_contratto(path="docs/CONTRACTS.md") -> dict` che estrae il blocco JSON tra i marcatori di §4. I test dei worker di contenuti possono leggere direttamente lo stesso blocco (stesso algoritmo: primo blocco ```json dopo `<!-- contratto-nodi:inizio -->`) per non dipendere da W1 prima del merge.
- `gen_docs.py`: `docs/PIANO_STUDIO.md` (ordine topologico con priorità) e `docs/MAPPA_ESAME.md` (prova → nodi → stato di verifica). `topo.py`: Kahn deterministico, a parità di vincoli priorità `alta` → `media` → `bassa`, poi `(area, id)`.

## 4. ID definitivi dei nodi (contratto)

Aree: **1** Segnali deterministici e trasformata di Fourier · **2** Sistemi lineari e filtri · **3** Campionamento, Nyquist, PAM e processi aleatori · **4** Conversione A/D-D/A e trasmissione numerica · **5** Modulazioni e segnali passa-banda · **6** Reti, protocolli e accesso multiplo · **7** Teoria del traffico e code.

Il blocco seguente è letto dai test e da `scripts/contratto.py`. Le prove `T*`, `E*`, `I*` e `M*` sono quelle di file2 (R3 §3.2); il pool di 28 domande di file1/file3 si collega ai nodi tramite la banca quiz. Aggiungere un nodo richiede una modifica di questo file da parte del coordinatore.

<!-- contratto-nodi:inizio -->
```json
{"versione": 1, "nodi": [
  {"id": "segnali-deterministici", "area": 1, "tipo": "concetto", "gruppo": "B", "worker": "W3", "prerequisiti_hard": [], "domande_esame": []},
  {"id": "serie-fourier", "area": 1, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["segnali-deterministici"], "domande_esame": ["M15"]},
  {"id": "trasformata-fourier", "area": 1, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["serie-fourier"], "domande_esame": ["M9"]},
  {"id": "energia-potenza-spettri", "area": 1, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": ["M29"]},
  {"id": "dim-impulso-dirac-trasformata", "area": 1, "tipo": "dimostrazione", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": ["T2"]},
  {"id": "sistemi-lineari-funzione-trasferimento", "area": 2, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": []},
  {"id": "dim-risposta-impulsiva-h", "area": 2, "tipo": "dimostrazione", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["sistemi-lineari-funzione-trasferimento", "dim-impulso-dirac-trasformata"], "domande_esame": ["T4"]},
  {"id": "filtri-ricorrenti-trasversali", "area": 2, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["sistemi-lineari-funzione-trasferimento"], "domande_esame": ["M16", "M17", "M18"]},
  {"id": "dim-filtro-trasversale", "area": 2, "tipo": "dimostrazione", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["filtri-ricorrenti-trasversali"], "domande_esame": ["T3"]},
  {"id": "serie-temporali-trasformata", "area": 3, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": []},
  {"id": "dim-teorema-campionamento", "area": 3, "tipo": "dimostrazione", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["serie-temporali-trasformata", "dim-impulso-dirac-trasformata"], "domande_esame": ["T1"]},
  {"id": "criterio-nyquist-isi", "area": 3, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["serie-temporali-trasformata"], "domande_esame": ["M25", "M26"]},
  {"id": "processi-aleatori-stazionarieta-ergodicita", "area": 3, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["energia-potenza-spettri"], "domande_esame": ["M6", "M10"]},
  {"id": "processi-gaussiani-funzione-errore", "area": 3, "tipo": "concetto", "gruppo": "B", "worker": "W3", "prerequisiti_hard": ["processi-aleatori-stazionarieta-ergodicita"], "domande_esame": []},
  {"id": "segnali-pam", "area": 3, "tipo": "concetto", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["serie-temporali-trasformata", "energia-potenza-spettri"], "domande_esame": []},
  {"id": "dim-pam-due-spettri", "area": 3, "tipo": "dimostrazione", "gruppo": "A", "worker": "W3", "prerequisiti_hard": ["segnali-pam", "processi-aleatori-stazionarieta-ergodicita"], "domande_esame": ["T5"]},
  {"id": "conversione-ad-quantizzazione-pcm", "area": 4, "tipo": "concetto", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["dim-teorema-campionamento"], "domande_esame": []},
  {"id": "dim-conversione-ad", "area": 4, "tipo": "dimostrazione", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["conversione-ad-quantizzazione-pcm"], "domande_esame": ["T7"]},
  {"id": "dim-conversione-da", "area": 4, "tipo": "dimostrazione", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["dim-conversione-ad"], "domande_esame": ["T8"]},
  {"id": "collegamento-numerico-tdm-pcm", "area": 4, "tipo": "concetto", "gruppo": "B", "worker": "W4", "prerequisiti_hard": ["dim-conversione-ad", "criterio-nyquist-isi"], "domande_esame": []},
  {"id": "segnali-passa-banda-inviluppo-complesso", "area": 5, "tipo": "concetto", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": []},
  {"id": "modulazione-prodotto-dsb-ssb", "area": 5, "tipo": "concetto", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["segnali-passa-banda-inviluppo-complesso"], "domande_esame": ["M1", "M11", "M20", "M23", "M27", "M34"]},
  {"id": "dim-spettri-modulazione-prodotto", "area": 5, "tipo": "dimostrazione", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["modulazione-prodotto-dsb-ssb"], "domande_esame": ["T6"]},
  {"id": "demodulazione-coerente-non-coerente", "area": 5, "tipo": "concetto", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["modulazione-prodotto-dsb-ssb"], "domande_esame": ["M21", "M22"]},
  {"id": "dim-modulazione-prodotto-qam-errore-fase", "area": 5, "tipo": "dimostrazione", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["demodulazione-coerente-non-coerente"], "domande_esame": ["T10"]},
  {"id": "dim-quadripoli-passa-basso-equivalente", "area": 5, "tipo": "dimostrazione", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["segnali-passa-banda-inviluppo-complesso", "sistemi-lineari-funzione-trasferimento"], "domande_esame": ["T11"]},
  {"id": "modulazioni-angolo-pm-fm", "area": 5, "tipo": "concetto", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["segnali-passa-banda-inviluppo-complesso"], "domande_esame": ["M7", "M8", "M32", "M33"]},
  {"id": "dim-pm-fm-trasformazione", "area": 5, "tipo": "dimostrazione", "gruppo": "A", "worker": "W4", "prerequisiti_hard": ["modulazioni-angolo-pm-fm"], "domande_esame": ["T9"]},
  {"id": "dim-formula-carson", "area": 5, "tipo": "dimostrazione", "gruppo": "B", "worker": "W4", "prerequisiti_hard": ["modulazioni-angolo-pm-fm"], "domande_esame": ["M12", "M13", "M14"]},
  {"id": "modulazioni-numeriche", "area": 5, "tipo": "concetto", "gruppo": "B", "worker": "W4", "prerequisiti_hard": ["modulazione-prodotto-dsb-ssb", "segnali-pam"], "domande_esame": []},
  {"id": "reti-concetti-introduttivi", "area": 6, "tipo": "concetto", "gruppo": "A", "worker": "W5", "prerequisiti_hard": [], "domande_esame": ["I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8", "I9"]},
  {"id": "architetture-iso-osi-tcpip", "area": 6, "tipo": "concetto", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["reti-concetti-introduttivi"], "domande_esame": ["M4", "M5"]},
  {"id": "commutazione-circuito-pacchetto", "area": 6, "tipo": "concetto", "gruppo": "B", "worker": "W5", "prerequisiti_hard": ["reti-concetti-introduttivi"], "domande_esame": []},
  {"id": "protocolli-linea-hdlc-sliding-window", "area": 6, "tipo": "concetto", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["architetture-iso-osi-tcpip"], "domande_esame": []},
  {"id": "dim-sliding-window-efficienza", "area": 6, "tipo": "dimostrazione", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["protocolli-linea-hdlc-sliding-window"], "domande_esame": ["T12"]},
  {"id": "codici-rivelazione-errore", "area": 6, "tipo": "concetto", "gruppo": "B", "worker": "W5", "prerequisiti_hard": ["protocolli-linea-hdlc-sliding-window"], "domande_esame": ["M28"]},
  {"id": "parametro-a-propagazione-trasmissione", "area": 6, "tipo": "concetto", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["reti-concetti-introduttivi"], "domande_esame": ["M19", "M24"]},
  {"id": "processo-poisson", "area": 7, "tipo": "concetto", "gruppo": "A", "worker": "W5", "prerequisiti_hard": [], "domande_esame": []},
  {"id": "accesso-multiplo-deterministico-casuale", "area": 6, "tipo": "concetto", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["parametro-a-propagazione-trasmissione"], "domande_esame": ["M30", "M31"]},
  {"id": "dim-ritardo-tdma-fdma", "area": 6, "tipo": "dimostrazione", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["accesso-multiplo-deterministico-casuale"], "domande_esame": ["T17"]},
  {"id": "dim-aloha-throughput", "area": 6, "tipo": "dimostrazione", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["accesso-multiplo-deterministico-casuale", "processo-poisson"], "domande_esame": ["T15", "M2", "M3"]},
  {"id": "dim-csma-cd-throughput", "area": 6, "tipo": "dimostrazione", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["dim-aloha-throughput", "parametro-a-propagazione-trasmissione"], "domande_esame": ["T16"]},
  {"id": "lan-ieee802-ethernet", "area": 6, "tipo": "concetto", "gruppo": "C", "worker": "W5", "prerequisiti_hard": ["dim-csma-cd-throughput"], "domande_esame": []},
  {"id": "dim-poisson-tempo-residuo", "area": 7, "tipo": "dimostrazione", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["processo-poisson"], "domande_esame": ["T13"]},
  {"id": "dim-nascita-morte-equilibrio", "area": 7, "tipo": "dimostrazione", "gruppo": "A", "worker": "W5", "prerequisiti_hard": ["processo-poisson"], "domande_esame": ["T14"]},
  {"id": "code-mm1-little", "area": 7, "tipo": "concetto", "gruppo": "C", "worker": "W5", "prerequisiti_hard": ["dim-nascita-morte-equilibrio"], "domande_esame": []},
  {"id": "es-spettri-impulsi-periodici", "area": 1, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["serie-fourier"], "domande_esame": ["E1"]},
  {"id": "es-spettri-impulso-rettangolare", "area": 1, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": ["E2"]},
  {"id": "es-antitrasformata-rettangolare", "area": 1, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["trasformata-fourier"], "domande_esame": ["E3"]},
  {"id": "es-rete-rc", "area": 2, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["sistemi-lineari-funzione-trasferimento"], "domande_esame": ["E5"]},
  {"id": "es-rete-cr", "area": 2, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["sistemi-lineari-funzione-trasferimento"], "domande_esame": ["E6"]},
  {"id": "es-condizione-nyquist", "area": 3, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["criterio-nyquist-isi"], "domande_esame": ["E4"]},
  {"id": "es-derivatore-processo-gaussiano", "area": 3, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["processi-gaussiani-funzione-errore", "sistemi-lineari-funzione-trasferimento"], "domande_esame": ["E7"]},
  {"id": "es-pam-bipolare", "area": 3, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["dim-pam-due-spettri"], "domande_esame": ["E8"]},
  {"id": "es-pam-ami", "area": 3, "tipo": "tipo_esercizio", "gruppo": "A", "worker": "W6", "prerequisiti_hard": ["dim-pam-due-spettri"], "domande_esame": ["E9"]},
  {"id": "es-teoria-traffico-extra", "area": 7, "tipo": "tipo_esercizio", "gruppo": "C", "worker": "W6", "prerequisiti_hard": ["code-mm1-little"], "domande_esame": []}
]}
```
<!-- contratto-nodi:fine -->

File part per worker: W3 → `area-1.json`, `area-2.json`, `area-3.json`; W4 → `area-4.json`, `area-5.json`; W5 → `area-6.json`, `area-7.json`; W6 → `area-1-esercizi.json`, `area-2-esercizi.json`, `area-3-esercizi.json`, `area-7-esercizi.json`.

## 5. Fonti (`meta.fonti`) e allowlist degli URL

`meta.fonti` è un oggetto `chiave → {descrizione, url | null, pubblico: bool, nota}`. Chiavi ammesse:

| Chiave | Descrizione | URL (solo da R1–R3) |
|---|---|---|
| `LIBRO_CI` | Calandrino, Immovilli, *Schemi delle lezioni di Comunicazioni Elettriche*, Pitagora; edizione NON TROVATO | https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo |
| `LUCIDI_CASONI` | Lucidi del docente (Accesso multiplo, Reti di telecomunicazioni, Comunicazioni elettriche), elencati nel materiale didattico | https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico |
| `PROGRAMMA` | Programma PDF del docente (anno non indicato) | http://www.dii.unimore.it/~mcasoni/telecom/programma.pdf |
| `ESSE3_2016` | Syllabus ESSE3 2016/17 | URL «ESSE3 contenuti» di R1 §2 |
| `FILE1` | Appunti di studente, 57 pp., con riferimenti «p. x.y» (non pubblicato) | null |
| `FILE2` | Raccolta di domande d'esame di studenti, 12 pp. (non pubblicata) | null |
| `FILE3` | Dimostrazioni svolte da studenti, note «RC», 59 pp. (non pubblicato) | null |
| `RICOSTRUZIONE` | Derivazione standard non tratta dal testo del prof. (R2 §3.2) | null |

**Allowlist per `risorse`** (URL presenti in R1–R3; `check_urls.py` deve dare < 400, altrimenti non usarli):

- https://web.ing.unimo.it/wiki/index.php/Maurizio_Casoni
- https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico
- https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo
- https://www.dii.unimore.it/~mcasoni/tecnologie/LEZIONI_FONDAMENTI_TLC/
- https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)
- https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)/10%3A_Sampling_and_Reconstruction/10.02%3A_Sampling_Theorem
- https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/video_galleries/video-lectures/
- https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/video_galleries/lecture-videos/
- https://ocw.mit.edu/courses/6-263j-data-communication-networks-fall-2002/pages/syllabus/
- https://openstax.org/books/statistics/pages/5-3-the-exponential-distribution-optional
- https://www3.diism.unisi.it/~giambene/fondamenti/dispense/dispense_tds.pdf

**Non usare in `risorse`:** `archive.nptel.ac.in/…/108104100` (404 secondo la revisione del coordinatore), docsity (403 anti-bot), skuola/studocu (paywall, non ufficiali), `dii.unimore.it/~mcasoni/telecom/*` diversi da `programma.pdf` (HTTP 500 al 29/10/2026). Nessun altro URL: se serve una fonte nuova, segnalarla nel report.

## 6. Notazione canonica (dettagli e verifica in `docs/NOTAZIONE.md`, W3)

| Grandezza | Canonica (file1, vicina al testo del prof.) | Variante file3 |
|---|---|---|
| Pulsazione | $\omega$ | $m$ |
| Trasformata | $X(\omega)=\int_{-\infty}^{+\infty} x(t)e^{-j\omega t}\,dt$, inversa con $\frac{1}{2\pi}$ | idem con $m$ |
| Periodo di campionamento / di simbolo | $T$, $\omega_s = 2\pi/T$ | $f_0 = 1/T$, $\omega_0 = 2\pi/T$ |
| Pulsazione massima del segnale | $\omega_m$ | $\omega_m$ |
| Portante | $\omega_0$ | — |
| Spettro di potenza | $G(\omega)$; IPOTESI di lavoro: densità **unilaterale** ($\omega \ge 0$) con $P=\int_0^{\infty} G(\omega)\,d\omega$, coerente col fattore $\frac{1}{\pi T}$ di file1 (punto aperto A2, decide W3) | — |
| Successione PAM | $s(t)=\sum_n a_n\, g(t-nT)$, $\langle a\rangle$, $\langle a^2\rangle$ | — |

## 7. Worker e scope esclusivi

| Worker | Scope esclusivo (solo questi percorsi) |
|---|---|
| **W1** | `schema/node.schema.json`, `schema/lezione.schema.json`, `schema/dimostrazione.schema.json`, `schema/figura.schema.json`, `graph/meta.json`, `scripts/**`, `requirements.txt`, `pytest.ini`, `.gitignore`, `.github/workflows/pages.yml`, `tests/conftest.py`, `tests/test_schema.py`, `tests/test_graph.py`, `tests/test_integrita.py`, `tests/test_tooling.py`, `tests/test_ci.py`, `tests/fixtures/**`, `README.md`, `docs/DIDATTICA.md` |
| **W2** | `web/**` **tranne** `web/modules/quiz/**`, `web/tests/quiz*.test.js`, `web/tests/test_e2e_quiz.py` |
| **W3** | `graph/parts/area-1.json`, `area-2.json`, `area-3.json`; `graph/lezioni/<id>.json` e `graph/dimostrazioni/<id>.json` dei nodi W3 di §4; `docs/NOTAZIONE.md`; `tests/test_contenuti_w3.py` |
| **W4** | `graph/parts/area-4.json`, `area-5.json`; lezioni e dimostrazioni dei nodi W4; `tests/test_contenuti_w4.py` |
| **W5** | `graph/parts/area-6.json`, `area-7.json`; lezioni e dimostrazioni dei nodi W5; `tests/test_contenuti_w5.py` |
| **W6** | `graph/parts/area-1-esercizi.json`, `area-2-esercizi.json`, `area-3-esercizi.json`, `area-7-esercizi.json`; `graph/lezioni/es-*.json`; `graph/esame.json`; `graph/quiz.json`; `schema/esame.schema.json`; `schema/quiz.schema.json`; `docs/QUIZ_FORMAT.md`; `tests/test_esercizi.py`, `tests/test_esame.py`, `tests/test_quiz.py`; `web/modules/quiz/**`; `web/tests/quiz*.test.js`; `web/tests/test_e2e_quiz.py` |

Tutti possono rigenerare i file generati (§1). Nessuno tocca file fuori scope (nemmeno per «sistemare» un test altrui): segnalare nel report.

**Test dei worker di contenuti (W3–W6) prima del merge di W1:** ogni worker valida i propri file con il proprio file di test, controllando direttamente i campi di §3 (anche con `jsonschema` e uno schema locale *dentro il file di test*), gli ID/aree/tipi/prerequisiti di §4, le chiavi di §5, la allowlist, gli accenti, l'assenza di `null`/`undefined`, i delimitatori `$` bilanciati, i segnaposto di `a_buchi`, la validità delle figure e almeno un controllo numerico per ogni formula finale con numeri (es. `1/(2e) ≈ 0,184`, `1/e ≈ 0,368`). Dopo il merge di W1 valgono anche i test generici.

## 8. PDF da allegare nelle chat Arena (mai nel repo)

| Worker | Allegati | Pagine principali |
|---|---|---|
| W1, W2 | nessuno | — |
| W3 | `file3.pdf` + `file1.pdf` | file3 pp. 1-6, 12-15, 32-35; file1 pp. 1-27 |
| W4 | `file3.pdf` + `file1.pdf` | file3 pp. 7-11, 18-19, 23-28; file1 pp. 28-44 |
| W5 | `file3.pdf` + `file1.pdf` + `file2.pdf` | file3 pp. 20-22, 29-31, 44-57; file1 pp. 45-55; file2 pp. 8-9 |
| W6 | `file2.pdf` + `file1.pdf` + `file3.pdf` | file2 tutto; file1 pp. 1-6, 13-14, 23-27, 56-57; file3 pp. 36-44, 52-59 |

Il testo estratto dei PDF ha formule rovinate (R3 §0): leggere le pagine come immagini (PyMuPDF/pdftoppm, file non versionati).

## 9. Interfacce tra moduli

### 9.1 Banca quiz — `graph/quiz.json` (W6; schema `schema/quiz.schema.json`; specifica `docs/QUIZ_FORMAT.md`)

Radice `{versione: 1, descrizione, elementi}`. Elemento: `id` (`q-` + kebab-case, univoco), `tipo` ∈ `scelta_multipla` \| `vero_falso` \| `completamento_formula`, `area` 1–7, `nodo_id` (ID di §4), `temi` (array di ID di prova `M*`/`I*` o `P1`–`P28` per il pool di file1/file3, anche vuoto), `domanda` (riformulata), `spiegazione` (≥ 40). Per `scelta_multipla`: `opzioni` 3–4 `{id: "a"|"b"|"c"|"d", testo, perche_sbagliata?}`, `corretta` = id di un'opzione; ogni distrattore ha `perche_sbagliata` ed è **in tema** (stesso argomento, errore plausibile); la corretta non è sempre nella stessa posizione. Per `vero_falso`: `affermazione`, `risposta_corretta` boolean. Per `completamento_formula`: `testo_con_buchi` con `___1___`…, `soluzioni` `{"1": [varianti]}`. ≥ 60 elementi, tutte le aree 1–7, tutti i temi M1–M34 e I1–I9 coperti. Chiave PM/FM secondo il punto A14 del piano (non le croci CROP 7/8).

### 9.2 Esiti dei quiz (scritti da W6, letti da W2)

Chiave `localStorage` `tlc-kg:esiti-quiz:v1`; valore: array JSON di `{item_id, nodo_id, corretto: boolean, modalita: "allenamento"|"simulazione", ts: ISO-8601}`, al massimo 2000 voci (scarta le più vecchie). `web/modules/quiz/esiti.js` esporta `registraEsito(storage, esito)` e `leggiEsiti(storage)`; W2 importa **solo** `leggiEsiti`, con import dinamico tollerante e un doppio di test con lo stesso formato finché W6 non è su `main`.

### 9.3 Montaggio del modulo quiz (W6 → W2)

`web/modules/quiz/index.js` esporta `montaQuiz(radice, {quiz, graph, storage, renderMath, naviga}) -> smonta()`: `quiz` = contenuto di `web/quiz.json`, `graph` = `web/graph.json`, `renderMath(elemento)` fornita da W2 (`web/js/core/math.js`, KaTeX), `naviga(hash)` per i link «riapri il nodo». Modalità **allenamento** (feedback immediato spiegato) e **simulazione** (correzione a consegna, nessun voto ufficiale, durata configurabile marcata «ipotesi»). W6 fornisce `web/modules/quiz/demo.html` che monta il modulo da solo (per i propri e2e senza la web app); W2 mostra «Quiz non disponibile» se l'import fallisce. Test W6: `node --test web/tests/quiz*.test.js` e `web/tests/test_e2e_quiz.py` (server statico proprio).

### 9.4 Figure e formule (W2)

`web/js/figure/index.js` esporta `renderFigura(spec) -> string` (SVG con `viewBox`, `role="img"`, `<title>` = titolo, `<desc>` = descrizione), che smista su `grafico.js`, `blocchi.js`, `temporale.js` (funzioni pure, testabili in node). Spec non valida → `<figure>` con la sola descrizione testuale, mai eccezioni non gestite. `web/js/core/math.js` esporta `renderMath(elemento)` (auto-render KaTeX su `$…$` e `$$…$$`, `throwOnError: false` a runtime, `trust: false`) e `compilaLatex(stringa)` (usata dai test con `throwOnError: true`).

### 9.5 Chiavi `localStorage` della web app (W2)

Prefisso `tlc-kg:`: `tlc-kg:stato:v1` (stato di studio per nodo), `tlc-kg:ripasso:v1` (SM-2), `tlc-kg:dimostrazioni:v1` (progressi a buchi e recall), `tlc-kg:impostazioni:v1` (data d'esame). Backup/import JSON validato di tutte le chiavi `tlc-kg:`.

## 10. Regole di qualità e QA

- SOLID, moduli piccoli e coesi (indicativamente ≤ 200 righe per modulo JS/Python), basso accoppiamento, interfacce esplicite, test per ogni modulo, nessun codice morto, nessun refactor fuori scope.
- Push **solo** sul proprio ramo di sessione `arena/<id>-telecomunicazioni` (mai `main`, mai `feat/*`); nessuna PR aperta dal worker.
- Italiano con accenti corretti (è, perché, più, già, può, così, né): vietati `e'`, `perche'`, `piu'`, `puo'`, `gia'`.
- Mai inventare punteggi, pagine, fatti attribuiti al docente, URL: dove manca, «NON TROVATO». Ogni dimostrazione dichiara `verifica.stato` onestamente.
- Niente testi integrali dei PDF o dei quiz; nessun PDF nel repo.
- UI: mai «null», «undefined», «NaN», «[object Object]» visibili; distrattori dei quiz in tema.
- QA Playwright (W2 e integrazione): viewport **390×844** e **1440×900**, nessun errore in console, nessuno scroll orizzontale (`scrollWidth ≤ clientWidth`), formule KaTeX rese, SVG delle figure presenti, navigazione da tastiera.
- Report finale di ogni worker: SHA dell'ultimo commit, URL del ramo, file toccati, numero di test passati/saltati (pytest e node), punti aperti residui.
