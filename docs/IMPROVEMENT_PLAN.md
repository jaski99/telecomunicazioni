# Piano di costruzione — Round 1 (sintesi R1, R2, R3)

> Scritto il 29/10/2026 dal coordinatore. Fonti: `docs/research/R1-prof-programma-esame.md` (R1), `docs/research/R2-manuali-dimostrazioni.md` (R2), `docs/research/R3-analisi-materiale.md` (R3). Regola di base: ciò che R1–R3 marcano **FATTO** si può scrivere come fatto citando la fonte; **IPOTESI** va presentato come ipotesi; **NON TROVATO** non si inventa e nel sito si scrive letteralmente «NON TROVATO».
>
> Il contratto tecnico vincolante (schema dati, layout dei file, ID definitivi, scope esclusivi, interfacce) è in [CONTRACTS.md](CONTRACTS.md). In caso di contrasto vale CONTRACTS.md.

## 0. Obiettivo e decisioni già prese

1. **Prodotto:** knowledge graph (KG) + web app statica italiana, offline (PWA), per *Fondamenti di Telecomunicazioni* (UNIMORE, prof. Maurizio Casoni). Obiettivo dell'utente: 30 e lode nel minor tempo possibile.
2. **Il cuore sono le dimostrazioni.** Secondo l'utente le dimostrazioni valgono almeno metà dell'esame e il docente le vuole **con gli stessi passaggi e la stessa notazione del suo testo** (requisito riferito dall'utente, non verificato indipendentemente: R1 §5, R2 §1). Ogni dimostrazione ha una pagina dedicata nel formato di §3.
3. **Testo di riferimento:** L. Calandrino, G. Immovilli, *Schemi delle lezioni di Comunicazioni Elettriche*, Pitagora Editrice, Bologna (R1 §3, [pagina Libro di Testo](https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo)); **edizione adottata, indice e pagine: NON TROVATO**. I riferimenti «p. 2.13», «p. 3.29», … presenti in `file1` sono indizi dello studente (IPOTESI: capitolo.pagina del libro), più i lucidi del docente (Accesso multiplo, Reti di telecomunicazioni) citati come «slide N».
4. **Base principale dei contenuti:** `file3.pdf` (59 pp., dimostrazioni passo-passo di studenti, note firmate «RC»), **verificata** contro `file1.pdf` (57 pp., sviluppi con i riferimenti di pagina del testo) e, dove possibile, contro libro e lucidi. `file2.pdf` (12 pp.) = raccolta di domande d'esame (17 teoriche, 9 esercizi, 34 quiz, 9 domande introduttive sulle reti). I tre PDF **non** sono nel repo (pubblico): si allegano nella chat Arena dei worker che ne hanno bisogno (vedi §6 e CONTRACTS.md §8).
5. **Notazione canonica del sito:** quella di `file1` (la più vicina al testo del prof.: ω per la pulsazione, T, ωₛ = 2π/T, ω₀ per la portante), con le varianti di `file3` (m per la pulsazione, f₀ = 1/T) segnalate in un riquadro «varianti di notazione» (R3 §3.3). Tabella completa in CONTRACTS.md §6.
6. **Formule:** KaTeX vendorizzato in `web/vendor/katex/` (offline, nessun CDN), rendering lato client da sorgenti LaTeX nei JSON (`$…$` in linea, `$$…$$` in display), `trust: false`, output HTML+MathML (R2 §3.3, [opzioni KaTeX](https://katex.org/docs/options)). Ogni formula del grafo e della banca quiz deve compilare con `throwOnError: true` (test di W2).
7. **Grafici:** SVG **generati** da specifiche dichiarative nei JSON (tre tipi: `grafico` per spettri e forme d'onda, `blocchi` per schemi a blocchi, `temporale` per diagrammi temporali di protocolli), resi da funzioni pure della web app con `viewBox`, `<title>`/`<desc>`, assi e unità, legenda non affidata al solo colore. Niente immagini copiate dai PDF, niente SVG/HTML grezzo nei dati.
8. **Diritti:** mai pubblicare i PDF né testi integrali di PDF/quiz; le domande di `file2` si citano con un **titolo breve riformulato**; i quiz sono riformulati a parole proprie (R3 §6). Nessuna matricola o voto (R1 §3).

## 1. Cosa dice l'analisi delle prove (R3) e come diventa priorità

### 1.1 Struttura delle prove (FATTO su `file2`, R3 §3.2)

| Parte | Quantità | Punteggi | Fonte |
|---|---|---|---|
| Domande teoriche (dimostrazioni) | 17 (T1–T17) | **10 punti solo T5 e T11**; tutte le altre: **NON TROVATO** | file2 |
| Esercizi | 9 (E1–E9) | NON TROVATO | file2 |
| Risposta multipla | 34 (M1–M34) + sezione «CROP» con risposte indicate (renumerata 1–29) | NON TROVATO | file2 |
| Domande introduttive sulle reti | 9 (I1–I9) | NON TROVATO | file2 pp. 8–9 |
| Durata, soglie, lode, prove in itinere | — | NON TROVATO | R1 §2 |

Modalità storica (ESSE3 2016/17): solo scritto, con esercizi numerici, domande teoriche aperte e chiuse (R1 §3, FATTO storico; non garantisce l'assetto attuale). Gli archivi ufficiali delle prove (`Prove_esame_2019-21.zip`, 2017) sono elencati dal docente ma **non aperti** (HTTP 500): frequenze per appello **NON TROVATO**. Gli studenti dicono che «l'esame è praticamente sempre uguale» (riferito dall'utente).

### 1.2 Mappa domanda → dimostrazione → nodi (contratto; ID definitivi in CONTRACTS.md §4)

Priorità: **P0** = domanda teorica con 10 punti dichiarati o dimostrazione lunga con grafici richiesti; **P1** = altra domanda teorica; **P2** = esercizio ricorrente; **P3** = quiz/concetti; **P4** = approfondimento per la lode. Le priorità derivano dalla struttura della prova, **non** da frequenze (NON TROVATO).

| Domanda (titolo breve) | Pri. | Dimostrazione (nodo) | Fonti da verificare | Nodi prerequisito principali | Worker |
|---|---|---|---|---|---|
| T1 Teorema del campionamento nel dominio dei tempi | P1 | `dim-teorema-campionamento` | file3 pp. 1-2, file1 pp. 7-10 (p. 2.40) | `serie-temporali-trasformata`, `trasformata-fourier` | W3 |
| T2 Funzione impulsiva e sua trasformata | P1 | `dim-impulso-dirac-trasformata` | file3 pp. 3-4, file1 pp. 11-12 (p. 2.56) | `trasformata-fourier` | W3 |
| T3 Filtro trasversale: schema e H(ω) | P1 | `dim-filtro-trasversale` | file3 p. 32, file1 pp. 15-16 (p. 3.20) | `filtri-ricorrenti-trasversali` | W3 |
| T4 Risposta impulsiva e legame con H(ω) | P1 | `dim-risposta-impulsiva-h` | file3 pp. 5-6, file1 pp. 17-18 (p. 3.29) | `sistemi-lineari-funzione-trasferimento`, `dim-impulso-dirac-trasformata` | W3 |
| T5 Segnali PAM: definizione e due spettri (**10 punti**) | **P0** | `dim-pam-due-spettri` | file3 pp. 12-15, file1 pp. 19-22 (p. 4.30) | `segnali-pam`, `energia-potenza-spettri`, `processi-aleatori-stazionarieta-ergodicita` | W3 |
| T6 Spettri di ampiezza e fase della modulazione a prodotto | P1 | `dim-spettri-modulazione-prodotto` | file3 pp. 18-19, file1 pp. 28-31 (p. 6.12) | `modulazione-prodotto-dsb-ssb`, `trasformata-fourier` | W4 |
| T7 Conversione A/D in 3 passi | P1 | `dim-conversione-ad` | file3 pp. 7-9, file1 pp. 32-34 (p. 7.4) | `conversione-ad-quantizzazione-pcm`, `dim-teorema-campionamento` | W4 |
| T8 Conversione D/A e ricostruzione | P1 | `dim-conversione-da` | file3 pp. 10-11, file1 pp. 35-36 (p. 7.8) | `dim-conversione-ad` | W4 |
| T9 Trasformazione PM ↔ FM | P1 | `dim-pm-fm-trasformazione` | **assente in file1 e file3 (lacuna)**: lucidi/libro; quiz M32/M33 | `modulazioni-angolo-pm-fm` | W4 |
| T10 Modulatori/demodulatori a prodotto, QAM, errore Δ di fase | P1 | `dim-modulazione-prodotto-qam-errore-fase` | file3 pp. 23-27, file1 pp. 37-40 (pp. 9.34, 9.36) | `demodulazione-coerente-non-coerente` | W4 |
| T11 Quadripoli lineari e passa-basso equivalente (**10 punti**) | **P0** | `dim-quadripoli-passa-basso-equivalente` | file1 pp. 42-44 (p. 10.9); file3: pagina da individuare | `segnali-passa-banda-inviluppo-complesso`, `sistemi-lineari-funzione-trasferimento` | W4 |
| T12 Efficienza sliding window senza errori, diagrammi temporali | P1 | `dim-sliding-window-efficienza` | file3 pp. 29-30, file1 pp. 49-51 (slide 75 Reti) | `protocolli-linea-hdlc-sliding-window` | W5 |
| T13 Tempo residuo nel processo di Poisson | P1 | `dim-poisson-tempo-residuo` | file1 pp. 51-53 (slide 106 Reti); file3: pagina da individuare | `processo-poisson` | W5 |
| T14 Probabilità di stato all'equilibrio, nascita e morte | P1 | `dim-nascita-morte-equilibrio` | file1 pp. 54-55 (slide 110 Reti); file3: pagina da individuare | `processo-poisson` | W5 |
| T15 ALOHA: throughput normalizzato vs traffico | P1 | `dim-aloha-throughput` | file3 pp. 20-21, file1 pp. 45-46 (slide 5 Accesso multiplo) | `accesso-multiplo-deterministico-casuale`, `processo-poisson` | W5 |
| T16 CSMA/CD: S in funzione di a, grafico | P1 | `dim-csma-cd-throughput` | file3 p. 22, file1 pp. 47-48 (slide 12 Accesso multiplo) | `parametro-a-propagazione-trasmissione`, `dim-aloha-throughput` | W5 |
| T17 Ritardo medio TDMA e FDMA, confronto | P1 | `dim-ritardo-tdma-fdma` | file3 p. 31, file1 p. 48 (slide 25 Accesso multiplo) | `accesso-multiplo-deterministico-casuale` | W5 |
| Formula di Carson (quiz M12–M14; derivazione per la lode) | P3/P4 | `dim-formula-carson` | file1 p. 41 (p. 9.43), file3 p. 28: **solo enunciato**; derivazione NON TROVATA nel materiale | `modulazioni-angolo-pm-fm` | W4 |

Esercizi (W6, nodi `tipo_esercizio`, R3 §3.2.2 e §3.1):

| Esercizio | Pri. | Nodo | Fonti |
|---|---|---|---|
| E1 Spettri di successione periodica di impulsi rettangolari | P2 | `es-spettri-impulsi-periodici` | file1 p. 1 (p. 2.13), file3 pp. 36-38 |
| E2 Spettri di impulso rettangolare singolo | P2 | `es-spettri-impulso-rettangolare` | file1 p. 2 (p. 2.14), file3 pp. 36-38 |
| E3 Antitrasformata di spettro rettangolare | P2 | `es-antitrasformata-rettangolare` | file1 p. 3 (p. 2.19), file3 p. 52 |
| E4 Condizione di Nyquist in frequenza, tre casi | P2 | `es-condizione-nyquist` | file1 pp. 4-6 (p. 2.35), file3 pp. 33-35 |
| E5 Rete RC | P2 | `es-rete-rc` | file1 p. 13 (p. 3.11), file3 pp. 39-40 |
| E6 Rete CR | P2 | `es-rete-cr` | file1 p. 14 (p. 3.12), file3 pp. 39-40 |
| E7 Derivatore con ingresso gaussiano ergodico | P2 | `es-derivatore-processo-gaussiano` | file1 p. 23 (p. 5.29) |
| E8 Spettro PAM bipolare, duty cycle 1 | P2 | `es-pam-bipolare` | file1 pp. 24-25 (p. 5.43), file3 pp. 41-42 |
| E9 Spettro PAM AMI, duty cycle 0,5 | P2 | `es-pam-ami` | file1 pp. 26-27 (p. 5.45), file3 pp. 41-42 |
| Extra teoria del traffico (code, M/M/1, Little, CRC, linea, switch, terminali) | P4 | `es-teoria-traffico-extra` | file3 pp. 44, 53-57 |

Quiz (W6): 34 temi M1–M34 di file2 + pool di 28 domande di file1 pp. 56-57 / file3 pp. 58-59, **riformulati**, collegati ai nodi (R3 §3.6). Domande introduttive I1–I9: nodo `reti-concetti-introduttivi` (W5) + quiz (W6).

### 1.3 Ordine di studio consigliato (percorso d'esame, home del sito)

1. P0: T5 (PAM) e T11 (quadripoli/passa-basso equivalente) con i loro prerequisiti.
2. Blocco segnali e sistemi: T2 → T4 → T3 → T1 (+ E1–E6).
3. Blocco trasmissione numerica: T7 → T8 (+ E4, E8, E9, E7).
4. Blocco modulazioni: T6 → T10 → T9 (+ Carson).
5. Blocco reti: T15 → T16 → T17 → T12, poi T13 → T14; I1–I9.
6. Quiz misti (interleaving) e simulazione d'esame; approfondimenti P4.

L'ordine effettivo è calcolato da `scripts/topo.py` (Kahn deterministico: priorità, poi area, poi id) sui prerequisiti.

## 2. Architettura

```
graph/meta.json ─┐
graph/parts/*.json ─┼─ scripts/kg.py build ──> graph/graph.json ──> web/build.sh ──> web/graph.json ──> web app (KaTeX + SVG)
graph/lezioni/*.json ─┤                                                           └─> web/quiz.json
graph/dimostrazioni/*.json ─┤
graph/esame.json ─┘                         scripts/gen_docs.py ──> docs/PIANO_STUDIO.md, docs/MAPPA_ESAME.md
graph/quiz.json ───────────────────────────────────────────────────────────────────────┘
```

- **Una sola fonte per l'app:** `graph/graph.json`, generato, mai modificato a mano.
- **Validazione:** JSON Schema Draft 2020-12 (`schema/*.schema.json`) + controlli di integrità (ID univoci, prerequisiti, DAG, riferimenti a domande d'esame, fonti dichiarate) + controlli di testo (accenti, `null`/`undefined`, apostrofi al posto degli accenti).
- **Web app:** HTML/CSS/JS moduli ES senza bundler, vendor locali con licenze, PWA con service worker e precache versionata, chiavi `localStorage` con prefisso `tlc-kg:`.
- **CI:** GitHub Actions su ogni push (`arena/**` incluso) e PR verso `main`: `kg.py check`, test node, `pytest -q` con e2e Playwright; **0 failed, 0 skipped**; deploy GitHub Pages solo da `main`.

## 3. Formato della dimostrazione (vincolante, campi in CONTRACTS.md §3.3)

Ogni dimostrazione (`graph/dimostrazioni/<id>.json`) ha, in quest'ordine di presentazione:

1. **Domanda d'esame associata** (T1–T17) con titolo breve e punteggio solo se dichiarato (T5, T11: 10 punti; altrimenti «NON TROVATO»).
2. **Enunciato esatto** da memorizzare. Se la formulazione del libro non è disponibile: enunciato di file3/file1 verificato, marcato con la fonte.
3. **Ipotesi** (elenco): ciò che serve perché ogni passaggio sia lecito (banda limitata, linearità, stazionarietà, simboli indipendenti, ecc.).
4. **Notazione**: tabella simbolo → significato, nella notazione canonica; varianti di file3 accanto.
5. **Idea in una riga** (≤ 200 caratteri).
6. **Passaggi numerati**: ciascuno con testo breve, formula (LaTeX) e **«perché si può fare»** (proprietà, ipotesi o risultato precedente che giustifica il passaggio). Stesso ordine del testo del prof. dove verificato; altrimenti ordine di file3, segnalato.
7. **Formula finale** in evidenza.
8. **Grafico/i** (spettri, schemi a blocchi, diagrammi temporali) come specifiche SVG; obbligatori quando la domanda dice «disegnare», «schemi», «grafici», «diagrammi temporali» (T3, T4, T6, T7, T8, T10, T11, T12, T15, T16) o quando file1/file3 dicono «in figura».
9. **Cosa dire a voce**: discorso di 60–90 secondi che accompagna la scrittura alla lavagna/sul foglio.
10. **Errori frequenti** (≥ 2): errore, perché è sbagliato, correzione (inclusi gli errori noti di file1/file3, §4).
11. **Versione compatta** (≤ 8 righe) da memorizzare e riscrivere a schermo vuoto.
12. **Ricostruzione a buchi** (completion problem): testo con segnaposto `___1___`, … e soluzioni accettate (≥ 3 buchi, almeno uno su un «perché»).
13. **Recall attivo**: 3–5 domande con risposta nascosta (ipotesi, passaggio chiave, casi limite).
14. **Fonti e verifica**: `fonti` (chiavi di `meta.fonti` + riferimento di pagina) e `verifica.stato` ∈ {`verificata_testo_prof`, `verificata_file1_file3`, `solo_file3`, `ricostruzione_non_del_prof`, `da_verificare`} con `punti_aperti` espliciti. Mai dichiarare «identica al testo del prof.» senza averla confrontata col libro o coi lucidi.

Didattica (come `tecweb-knowledge-graph/docs/DIDATTICA.md`, adattata, file `docs/DIDATTICA.md` di W1): prima l'intuizione, un'idea per blocco, worked example → completion → esercizio autonomo (fading), recall attivo, interleaving, ripasso a intervalli 1-3-7-14 giorni, analogie con il loro limite, scenario ricorrente (es. «trasmettere la voce di una telefonata su un collegamento numerico»). La pagina di dimostrazione ha quattro modalità: **Studio** (passi rivelati uno alla volta, ciascuno con il suo «perché»), **A voce**, **Compatta**, **A buchi** (input con controllo), più il blocco Recall.

## 4. Punti aperti da state.md e R3 (assegnati)

Ogni punto si risolve **sulle immagini delle pagine PDF** (il testo estratto rovina le formule: renderizzare con PyMuPDF/pdftoppm) e, se possibile, sul testo del prof. Se non risolvibile: scrivere l'ipotesi, marcare `verifica.stato = "da_verificare"` e riportarlo in `punti_aperti`, mai inventare.

| # | Punto aperto | Dove guardare | Worker |
|---|---|---|---|
| A1 | Fase φₙ in D1/E1: φₙ = arg(cₙ); la forma 0/π vale solo per impulso centrato (cₙ reale); fattore e^{−jnω₀τ/2} se l'impulso parte da 0 | file1 p. 1, file3 pp. 36-38 (figura: posizione dell'impulso) | W6 (E1, E2) e W3 per la nota in `trasformata-fourier`/`serie-fourier` |
| A2 | Fattori 1/(πT) vs 1/(2πT) negli spettri PAM: convenzione unilaterale/bilaterale. IPOTESI di lavoro (verificata dal coordinatore solo algebricamente): densità **unilaterale in ω**, con P = ∫₀^∞ G(ω) dω, coerente con 1/(πT) di file1 | file1 pp. 19-22, file3 pp. 12-15 | **W3** decide e documenta in `docs/NOTAZIONE.md`; W6 la applica a E7, E8, E9 |
| A3 | D5: fattore «p·T» illeggibile in X(ω) = T·X₀(ω) nella banda; ricostruzione con sinc assente in file3 | file1 pp. 7-10, file3 pp. 1-2 | W3 |
| A4 | D9: H(ω) del filtro trasversale e dei ricorrenti, estrazione frammentata | file1 pp. 15-16, file3 p. 32 | W3 |
| A5 | E7 derivatore: R3 trascrive G_y(ω) = G₀, ma il testo estratto di file1 p. 23 mostra «ω² G₀» (coerente con \|H(ω)\|² = ω² del derivatore); varianza e fattore 1/π vs 1/(2π) dipendono da A2 | file1 p. 23 | W6 |
| A6 | Nulli dello spettro AMI con duty cycle 0,5: il fattore sin²(ωT/2) si annulla in **tutti** i multipli di 1/T (f = k/T, compresa f = 0), \|G\|² dell'impulso lungo T/2 in f = 2k/T; R3 cita solo f = 0, ±2/T: verificare e correggere | file1 pp. 26-27, file3 pp. 41-42 | W6 |
| A7 | CSMA/CD: espressione finale S(a) illeggibile (candidati R3: A/(1−A+2a) oppure 1/(1−A+2a)); definizione di slot («doppio del ritardo» in file1 vs «1/2a» in file3) e di a | file1 pp. 47-48, file3 p. 22, slide 12 Accesso multiplo | W5 |
| A8 | Sliding window, caso W·F ≤ C·TT: efficienza illeggibile (candidato R3: η = W·D/(C·TT)); definizione TT = F/C + I + ACK/C + I (file3) | file1 pp. 49-51, file3 pp. 29-30 | W5 |
| A9 | D_TDMA completa (slot T/M, attesa media; R3: ω = (M−1)T/(2M)) e confronto con D_FDMA = T | file1 p. 48, file3 p. 31 | W5 |
| A10 | ALOHA in file3 p. 20: «e^(2λtτ)» senza segno meno (refuso probabile; corretto e^{−2G}) | file3 p. 20 vs file1 pp. 45-46 | W5 |
| A11 | **Lacuna T9** PM ↔ FM: assente in file1 e file3. Ricostruire (integratore anteposto al modulatore PM → FM; derivatore anteposto al modulatore FM → PM, coerente con M32/M33 e col quiz di file1) con `verifica.stato = "ricostruzione_non_del_prof"` | lucidi «Comunicazioni elettriche» se accessibili; altrimenti NON TROVATO | W4 |
| A12 | **Derivazione di Carson**: solo enunciato B_ω = 2(Δω_max + ω_m) nel materiale; derivazione come approfondimento P4, marcata ricostruzione | file1 p. 41, file3 p. 28 | W4 |
| A13 | **9 domande introduttive reti** (file2 pp. 8-9): assenti da file1/file3; nodo con risposte riformulate dal testo di file2, senza aggiungere date o nomi non presenti; ciò che manca = NON TROVATO | file2 pp. 8-9 | W5 (nodo), W6 (quiz) |
| A14 | **Q7/Q8 CROP errate**: le croci di CROP 7/8 contraddicono M32/M33 e la teoria; non usarle come chiave. Chiave del sito: PM→FM = integratore anteposto; FM→PM = derivatore anteposto | file2 pp. 7-8 | W6 (quiz), W4 (nota in T9) |
| A15 | Pagine di file3 per T11, T13, T14 non indicate in R3 | file3 (indice per argomento) | W4 (T11), W5 (T13, T14) |
| A16 | Edizione del libro e corrispondenza «p. x.y»: NON TROVATO; archivi prove `dii.unimore.it/~mcasoni/telecom/*` HTTP 500 | — | coordinatore (ritentare download in un run successivo); nel sito: pagina Fonti con NON TROVATO |

## 5. Worker (5 + 1), scope esclusivo, ramo

Ogni chat Arena pusha **solo** sul proprio ramo di sessione `arena/<id>-telecomunicazioni` (mai `main`, mai `feat/*`, nessuna PR: le apre e mergia il coordinatore). Nessun file compare in due scope; gli scope esatti sono in CONTRACTS.md §7.

| Worker | Nome | In sintesi | PDF da allegare |
|---|---|---|---|
| **W1** | Schema, tooling, CI, test | schemi JSON, `meta.json`, `kg.py`/`topo.py`/`gen_docs.py`/`check_urls.py`/`check_testo.py`, CI con Pages, test di schema e integrità con fixture, `docs/DIDATTICA.md`, README | nessuno |
| **W2** | Web app | tutto `web/**` tranne il modulo quiz: KaTeX vendorizzato, renderer SVG, pagine dimostrazione (4 modalità), lezioni, grafo, percorso d'esame, ripasso SM-2, fonti, PWA, e2e | nessuno |
| **W3** | Segnali, sistemi, campionamento, PAM, processi | aree 1–3: T1–T5 + nodi concetto, `docs/NOTAZIONE.md` | file3.pdf + file1.pdf |
| **W4** | Conversione e modulazioni | aree 4–5: T6–T11 + Carson + nodi concetto | file3.pdf + file1.pdf |
| **W5** | Reti, accesso multiplo, traffico | aree 6–7: T12–T17 + intro reti + nodi concetto | file3.pdf + file1.pdf + file2.pdf |
| **W6** | Esercizi, mappa d'esame, quiz | E1–E9 + extra traffico, `graph/esame.json`, banca quiz e modulo web quiz | file2.pdf + file1.pdf + file3.pdf |

### W1 — Schema, tooling, CI
- Schemi `schema/node.schema.json`, `lezione.schema.json`, `dimostrazione.schema.json`, `figura.schema.json` **esattamente** come CONTRACTS.md §3 (modifiche solo col coordinatore).
- `graph/meta.json` (corso, aree 1–7, fonti di CONTRACTS.md §5, nota esame con NON TROVATO), `scripts/kg.py build|check [--completo]` (§3.6 di CONTRACTS), `scripts/topo.py`, `scripts/gen_docs.py` (`docs/PIANO_STUDIO.md`, `docs/MAPPA_ESAME.md`), `scripts/check_urls.py` (solo `risorse`, HEAD con fallback GET, < 400), `scripts/check_testo.py` (accenti, `null`/`undefined`/`NaN`, apostrofo al posto dell'accento, stringhe LaTeX con `$` sbilanciati).
- `.github/workflows/pages.yml` come il modello TecWeb: Python 3.12, Node 22, `pip install -r requirements.txt playwright`, `python -m playwright install --with-deps chromium` (su Ubuntu 24.04 non installare a mano `libasound2`), passi `kg.py check`, `sh web/build.sh`, `npm test --prefix web`, `pytest -q`, controllo «0 skipped» su node e pytest, deploy Pages solo da `main`. Finché `web/` non esiste sul ramo, i passi web hanno `if: hashFiles('web/package.json') != ''`: il coordinatore rimuove la condizione in integrazione.
- Test: `tests/test_schema.py`, `tests/test_graph.py`, `tests/test_integrita.py`, `tests/test_tooling.py`, `tests/test_ci.py` (vieta `--ignore`, `-k "not`, `skip`, `xfail`, `continue-on-error` nel workflow e in `pytest.ini`), con fixture in `tests/fixtures/**` (un nodo concetto, una dimostrazione completa, una figura per tipo).

### W2 — Web app
- Rotte hash: `#/` percorso d'esame (T1–T17, E1–E9, quiz, priorità, stato), `#/grafo`, `#/nodo/<id>`, `#/dim/<id>` (Studio/A voce/Compatta/A buchi + Recall), `#/esercizi`, `#/quiz` (monta il modulo di W6), `#/ripasso`, `#/fonti` (fonti, incertezze, NON TROVATO, avviso diritti).
- `web/vendor/katex/` (versione 0.16.x, licenza MIT in `THIRD-PARTY-LICENSES.txt`), `marked` + `DOMPurify` vendorizzati per il Markdown dei testi; test `web/tests/latex.test.js` che compila **ogni** stringa LaTeX di `web/graph.json` e `web/quiz.json` con `throwOnError: true`.
- Renderer puri `web/js/figure/grafico.js`, `blocchi.js`, `temporale.js` (spec → stringa SVG), con test node e snapshot strutturali; gestione elegante di campi opzionali assenti (mai «null», «undefined», «NaN» a schermo).
- Tolleranza: prerequisiti verso nodi non ancora presenti → etichetta «in arrivo», nessun errore; nessuna costante sul numero di nodi/aree.
- Ripasso SM-2 (1-3-7-14), stato di studio per nodo, livelli di padronanza da esiti quiz (solo tramite `leggiEsiti`, CONTRACTS.md §9.2), backup/import JSON.
- PWA (manifest, service worker con precache versionata), accessibilità (tastiera, contrasto AA, testo non solo colore).
- e2e Playwright a **390×844** e **1440×900**: nessun errore JS, nessuno scroll orizzontale, formule rese (elementi `.katex`), SVG presenti, nessun «null/undefined» visibile.

### W3 — Aree 1–3 (segnali, Fourier, sistemi lineari, campionamento, PAM, processi)
- Dimostrazioni T1–T5 complete nel formato di §3; nodi concetto della tabella di CONTRACTS.md §4 con lezione completa.
- `docs/NOTAZIONE.md`: notazione canonica, varianti file3, convenzione degli spettri (A2), con esempi.
- Punti aperti A2, A3, A4 (+ nota A1 nei concetti).

### W4 — Aree 4–5 (conversione A/D-D/A, modulazioni analogiche e numeriche)
- Dimostrazioni T6–T11 e `dim-formula-carson`; nodi concetto di CONTRACTS.md §4.
- Punti aperti A11, A12, A14 (nota), A15 (T11).

### W5 — Aree 6–7 (reti, protocolli, accesso multiplo, traffico)
- Dimostrazioni T12–T17; nodi concetto, compreso `reti-concetti-introduttivi` (I1–I9).
- Punti aperti A7, A8, A9, A10, A13, A15 (T13, T14). Diagrammi temporali obbligatori per T12, T15, T16; grafico S(a) per T16, ρ(G) per T15.

### W6 — Esercizi, mappa d'esame, quiz
- Esercizi E1–E9 + extra traffico come nodi `tipo_esercizio` con lezione (worked example con tutti i passaggi e grafici degli spettri).
- `graph/esame.json` (T1–T17, E1–E9, M1–M34, I1–I9 → nodi, punti solo T5/T11).
- Banca quiz ≥ 60 elementi riformulati su tutti i temi M1–M34 e il pool di 28 domande + I1–I9; distrattori **in tema** e plausibili, corretta non sempre in prima posizione; modulo `web/modules/quiz/**` (allenamento con feedback spiegato + simulazione), esiti secondo CONTRACTS.md §9.2.
- Punti aperti A1 (E1/E2), A2 applicata, A5, A6, A14.

## 6. Ordine di avvio e di merge

**Avvio:** tutti e sei **in parallelo** (ondata 1). Il contratto fissa campi, ID, nomi dei file e interfacce in modo che nessun worker debba aspettare: i worker di contenuti validano i propri file con test propri che controllano i campi di CONTRACTS.md §3 (senza dipendere dagli script di W1) e i riferimenti agli ID della lista JSON di CONTRACTS.md §4; W2 sviluppa su fixture conformi al contratto. Ordine di digitazione consigliato: W1, W3, W4, W5, W6, W2 (una chat alla volta, mai digitazione in parallelo).

**Merge su `main`** (CI verde dopo ogni merge prima del successivo):

1. **W1** (schemi, tooling, CI): da qui in poi tutti i rami si riallineano a `main`.
2. **W3** (aree 1–3 + NOTAZIONE: fissa la convenzione A2).
3. **W4** (aree 4–5).
4. **W5** (aree 6–7).
5. **W6** (esercizi, esame.json, quiz e modulo quiz; riallinea E7–E9 alla convenzione di W3 se diversa).
6. **W2** (web app; dopo i contenuti per e2e realistici).
7. **Integrazione (coordinatore o chat MAIN):** I-1 rigenerare i file generati (`python scripts/kg.py build && python scripts/gen_docs.py build && sh web/build.sh`), conflitti sui generati risolti **rigenerando**, mai a mano; I-2 togliere le condizioni `hashFiles` dalla CI e attivare `kg.py check --completo` (tutti gli ID del contratto presenti, nessun prerequisito pendente); I-3 suite completa 0 skipped; I-4 QA da utente vero con Playwright a 390×844 e 1440×900 sul sito pubblicato (nessun errore JS, nessuno scroll orizzontale, nessun «null/undefined», formule e grafici visibili); I-5 revisione severa (accenti, punteggi inventati, nodi duplicati, distrattori fuori tema, test saltati o e2e tolti dalla CI).

Seconda ondata (dopo l'integrazione): revisione incrociata delle dimostrazioni (un worker diverso ricontrolla ogni dimostrazione sulle immagini dei PDF), eventuale importazione delle prove ufficiali se il download riesce (A16).

## 7. Regole di qualità (tutti)

SOLID, moduli piccoli e coesi, basso accoppiamento, interfacce esplicite, test per ogni modulo, nomi coerenti, nessun codice morto, nessun refactor fuori scope. **Vietato** far passare la CI con `skip`, `xfail`, `--ignore`, `-k "not e2e"`, `continue-on-error` o rimuovendo gli e2e. Italiano con accenti corretti (è, perché, più, già, può, così). **Mai inventare** punteggi, pagine, fatti attribuiti al docente o URL: le `risorse` usano solo gli URL della allowlist di CONTRACTS.md §5 (presi da R1–R3), verificati con `python scripts/check_urls.py`; dove manca un dato si scrive «NON TROVATO». Niente testi integrali dei PDF/quiz e niente PDF nel repo. Prima del push: build, `kg.py check`, `npm test --prefix web` (se `web/` esiste), `pytest -q` con Playwright: **0 failed, 0 skipped**. Report finale: SHA, URL del ramo, file toccati, numero di test passati/saltati.
