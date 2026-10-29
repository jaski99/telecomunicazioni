# Didattica — Fondamenti di Telecomunicazioni

> Adattata dal modello TecWeb `docs/DIDATTICA.md`. Principi identici, esempi per telecomunicazioni.
> Formato della dimostrazione: vedi `IMPROVEMENT_PLAN.md §3`.

## 1. Obiettivo

Portare lo studente al **30 e lode** esponendo ogni dimostrazione **con gli stessi passaggi e la stessa notazione del testo del prof.** dove verificato, altrimenti marcando lo stato di verifica e i punti aperti. Nessun passaggio è dato per scontato: ogni uguaglianza ha il suo «perché».

## 2. Principi

### 2.1 Prima l'intuizione, poi il formalismo

Ogni scheda apre con uno **scenario concreto** ricorrente (es. «trasmettere la voce di una telefonata su un collegamento numerico») che ancòra il concetto a un problema d'esame. L'analogia introduce l'idea in linguaggio naturale e ne dichiara subito il **limite**, per evitare generalizzazioni errate.

### 2.2 Un'idea per blocco

La **spiegazione** è divisa in blocchi con `###` sottotitoli, ciascuno con una sola idea. Almeno una formula LaTeX per blocco mantiene il legame tra intuizione e formalismo. La notazione canonica (`ω`, `T`, `ω_s = 2π/T`) è usata ovunque; le varianti di `file3` (`m`, `f₀`) compaiono solo nel riquadro «varianti di notazione».

### 2.3 Fading: worked example → completion → autonomo

- **Worked example** (esempio totalmente svolto, ≥ 3 passi): mostra la procedura completa con giustificazione.
- **Completion problem** (passi mancanti): lo studente completa i buchi guidati.
- **Esercizio autonomo**: lo studente risolve da solo con solo un suggerimento.

Questo gradiente riduce il carico cognitivo e allena la ricostruzione, non il solo riconoscimento.

### 2.4 Recall attivo

Ogni lezione ha **3–5 domande** con risposta nascosta + un invito a «spiegare con parole tue». Ogni dimostrazione ha inoltre:

- **Recall attivo**: 3–5 domande su ipotesi, passaggio chiave, casi limite.
- **Ricostruzione a buchi**: testo con `___1___`, `___2___` … e soluzioni accettate.
- **Versione compatta** (≤ 8 righe) da riscrivere a schermo vuoto.

Il ripasso segue intervalli **1-3-7-14 giorni** (SM-2).

### 2.5 Interleaving e collegamenti

I nodi `collegamenti` e le prove `E`/`M` mescolano argomenti diversi (es. PAM ↔ filtraggio ↔ modulazione) per allenare la scelta dello strumento giusto. La pagina quiz propone modalità **allenamento** (feedback immediato spiegato) e **simulazione** (correzione a consegna).

### 2.6 Errori come materiale didattico

Ogni scheda elenca **≥ 2 errori frequenti** con perché è sbagliato e correzione, includendo gli errori noti di `file1`/`file3` (es. fase `φₙ` come 0/π solo per impulso centrato, fattore `1/(πT)` vs `1/(2πT)` legato a densità unilaterale, segno `e^(−2G)` in ALOHA, definizione di `a` e slot in CSMA/CD). Imparare a riconoscere l'errore vale quanto imparare la soluzione corretta.

## 3. Formato della dimostrazione (vincolante)

Ogni dimostrazione (`graph/dimostrazioni/<id>.json`) ha, in ordine di presentazione:

1. **Domanda d'esame** (T1–T17) con titolo breve e punteggio solo se dichiarato (T5, T11: 10 punti; altrimenti NON TROVATO).
2. **Enunciato esatto** da memorizzare, con fonte.
3. **Ipotesi** (elenco).
4. **Notazione**: tabella simbolo → significato, nella canonica; varianti accanto.
5. **Idea in una riga** (≤ 200 caratteri).
6. **Passaggi numerati**: testo breve, formula LaTeX e **«perché si può fare»** (≥ 15 caratteri).
7. **Formula finale** in evidenza.
8. **Grafico/i** come specifiche SVG; obbligatori quando la domanda dice «disegnare», «schemi», «grafici», «diagrammi temporali».
9. **Cosa dire a voce**: 60–90 secondi, 300–1500 caratteri.
10. **Errori frequenti** (≥ 2): errore, perché sbagliato, correzione.
11. **Versione compatta** (≤ 8 righe).
12. **Ricostruzione a buchi** (≥ 3 buchi, almeno uno sul «perché»).
13. **Recall attivo**: 3–5 domande.
14. **Fonti e verifica**: chiavi di `meta.fonti` + `verifica.stato` ∈ {verificata_testo_prof, verificata_file1_file3, solo_file3, ricostruzione_non_del_prof, da_verificare} con `punti_aperti` espliciti.

Mai dichiarare «identica al testo del prof.» senza confronto col libro o coi lucidi.

## 4. Pagina di studio

La web app mostra la dimostrazione in quattro modalità:

- **Studio**: passi rivelati uno alla volta, ciascuno con il suo «perché».
- **A voce**: discorso continuo da accompagnare alla lavagna.
- **Compatta**: versione memorizzabile.
- **A buchi**: input con controllo immediato.

Più il blocco **Recall** con domande a risposta nascosta. Le formule usano KaTeX vendorizzato (`trust: false`, output HTML+MathML). Le figure sono SVG con `viewBox`, `<title>`/`<desc>`, assi e unità, legenda non solo colore.

## 5. Valutazione e ripasso

- **Stati di studio** per nodo (localStorage `tlc-kg:stato:v1`) e **ripasso SM-2** (`tlc-kg:ripasso:v1`) con backup/import JSON.
- **Esiti quiz** (`tlc-kg:esiti-quiz:v1`) letti solo tramite `leggiEsiti` (CONTRACTS §9.2).
- Checklist di ripasso per nodo e flashcard fronte/retro.
- Grafici delle dipendenze e percorso d'esame ordinato topologicamente (Kahn deterministico: priorità, poi area, poi id).

## 6. Cosa non fare

- Non pubblicare testi integrali di PDF/quiz né PDF nel repo.
- Non inventare punteggi (solo T5 e T11 valgono 10), pagine, fatti attribuiti al docente o URL fuori allowlist (CONTRACTS §5).
- Non usare la notazione di `file3` come canonica senza segnalarla.
- Non presentare come «fedele al testo» una dimostrazione con `verifica.stato` diverso da `verificata_testo_prof`.
- Non sacrificare accessibilità: contrasto AA, navigazione da tastiera, testo alternativo per ogni figura, nessuna parola riservata isolata visibile in UI.

## 7. Riferimenti

- `docs/CONTRACTS.md §3` — schemi vincolanti
- `docs/IMPROVEMENT_PLAN.md §3` — formato dimostrazione
- `docs/NOTAZIONE.md` (W3) — notazione canonica e varianti
- `docs/research/R2-manuali-dimostrazioni.md` — didattica delle dimostrazioni (KaTeX, SVG)
