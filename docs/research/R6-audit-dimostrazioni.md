# R6 — Audit didattico delle 18 dimostrazioni

> Documento di sola ricerca. Non modifica né `graph/` né il codice: elenca le modifiche da fare, con il testo e il LaTeX proposti, perché altri worker le applichino.
> Autore: worker di ricerca R6. Data: 2026-10-30. Ambito: `graph/dimostrazioni/*.json` (18 file), confrontati con `file1.pdf`, `file3.pdf`, i lucidi del docente raggiungibili online e i documenti `docs/R1`–`docs/R3`, `docs/CONTRACTS.md`, `docs/DIDATTICA.md`, `docs/NOTAZIONE.md`.
> Convenzione: **FATTO** = verificato da me su un'immagine di pagina, su un file del repository o su una pagina web aperta; **IPOTESI** = deduzione mia, dichiarata; **NON TROVATO** = cercato e non disponibile.

---

## 1. Metodo, fonti e limiti (che cosa ho davvero guardato)

### 1.1 Come ho letto le fonti

1. **Testo estratto** dei due PDF (`/home/user/work/file1.txt`, `file3.txt`, marcatori `===== PAGE n =====`): usato **solo per la prosa**. È inaffidabile per le formule, perché i glifi sono rimappati (`!` per il pedice `n`, `&` per il segno di integrale, `2` per `π`, `"` per il meno). Coerente con R3 §0.
2. **Immagini di pagina** a 110 dpi (`/home/user/work/pages/file1-NN.png`, `file3-NN.png`): **fonte primaria** per formule, figure e segni. Pagine lette come immagine in questa sessione (FATTO):
   - `file1`: 9, 11, 15, 17, 18, 19, 20, 21, 22, 28, 29, 32, 35, 36, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50, 53, 54, 55;
   - `file3`: 7, 13, 20, 22, 24, 29, 30, 31, 32, 48.
   Le altre pagine citate nelle schede sono state lette **solo nel testo estratto**: lo dico scheda per scheda, perché una formula non confermata a immagine non può fondare una correzione.
3. **Codice di rendering** (sola lettura): `web/js/pages/dim/{index,dati,passi,finale,abuchi,studio}.js`, `web/js/core/math.js`, `web/tests/{latex,math}.test.js`, `web/tests/dim-abuchi.test.js`, `tests/test_contenuti_w{3,4,5}.py`.
4. **Pagine web aperte** (contenuto effettivamente scaricato, vedi §1.2).

### 1.2 Fonti esterne: che cosa esiste e che cosa manca

| Fonte | Stato | Che cosa contiene di utile per questo audit |
|---|---|---|
| Calandrino–Immovilli, *Schemi delle lezioni di Comunicazioni Elettriche*, Pitagora | **NON TROVATO** online | Indicato come libro di testo del corso nella pagina del wiki del corso `https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo` (**aperta**). Il **contenuto non è disponibile**: non posso verificare nessuna formula sul libro, né l'edizione, né la corrispondenza dei riferimenti «p. x.y» scritti dallo studente in `file1`. **Nessuna affermazione di questo documento è attribuita al libro.** |
| `http://www.dii.unimore.it/~mcasoni/telecom/AccessoMultiplo.pdf` | **APERTO** (3 blocchi di testo) | Lucidi del docente su accesso multiplo: ALOHA, slotted ALOHA, CSMA/CD, FDMA/TDMA. **Verifica diretta di T15, T16, T17.** |
| `http://www.dii.unimore.it/~mcasoni/telecom/ComElettriche.pdf` | **APERTO** (solo le prime pagine) | Fondamenti (serie e integrale di Fourier, spettri di ampiezza e fase, segnali passa-banda). Conferma la convenzione `V(ω)=\lvert X(\omega)\rvert/π`, `x(t)=∫V(ω)cos[ωt−φ(ω)]dω`. Il lettore PDF si ferma a 30 pagine: PAM, modulazioni angolari e Carson **non raggiunti** → **NON TROVATO** lì. |
| `https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico` | **APERTO** | Elenco dei lucidi; conferma che `AccessoMultiplo.pdf` e `ComElettriche.pdf` sono materiale del corso. I lucidi di Reti (`lucidi_new.pdf`, dove stanno le slide 75 e 106 citate da `file1`) **non sono stati letti**: le domande di area 6-7 restano verificate solo su `file1`/`file3`, tranne T15-T17 dove i lucidi di accesso multiplo bastano. |
| `file2` (prove d'esame) | **non allegato** al repository | I punteggi delle domande restano **NON TROVATO**, tranne i due dichiarati (T5 e T11 = 10 punti). |

### 1.3 Limiti dichiarati

- **Nessun PDF e nessuna immagine di pagina è versionato** (CONTRACTS §1): questo documento cita pagine e riporta solo formule brevi, non trascrizioni.
- Le immagini a 110 dpi permettono di leggere formule e segni, **non** di distinguere con certezza un pedice dall'altro in espressioni molto fitte: dove ho avuto dubbi lo scrivo.
- I lucidi del docente sono **lucidi**, non il libro: quando li cito dico «lucidi», mai «libro».

---

## 2. Sintesi in dieci righe

1. Le 18 dimostrazioni sono **strutturalmente sane**: 116 passi, 39 figure, nessun errore di calcolo nei risultati finali; le formule finali tornano tutte, ricalcolate a mano e, dove serve, numericamente.
2. I difetti veri sono **tre famiglie**: (a) passi troppo densi o concettuali senza formula; (b) figure che illustrano un passo ma non vi sono agganciate (5 orfane in 4 file, 1 figura ripetuta due volte); (c) modalità «a buchi» con soluzioni **non digitabili** (36 varianti su 142 contengono `$`, `_`, `^` o `\`).
3. La dimostrazione **peggiore** è T6 (`dim-spettri-modulazione-prodotto`): 6 passi di una riga, 2 figure orfane su 3, e la domanda del prof («spettri di ampiezza e fase») **non è svolta**: manca tutta la via `V(ω)`, `s_s`, `s_i`, ribaltamento della fase.
4. T6 ha anche un **conflitto di notazione**: la sua `φ` è l'argomento di `X`, mentre NOTAZIONE.md (punto A1) fissa `φ = −arg X`. Il segno va corretto, non la fonte: con la `φ` canonica l'argomento di `S` cambia segno nella banda laterale inferiore, che è esattamente la conclusione di file1 p. 29.
5. Ho trovato **un errore di segno nella fonte**: `file1` p. 29 stampa `s_i(t)=½∫V cos[(ω₀−ω)t − φ]`; il segno corretto è `+φ` (controesempio numerico in T6). Va **non copiato**, e la conclusione del prof resta giusta.
6. **T11** (10 punti) è corretta ma **incompleta sul punto che fa perdere punti**: la condizione di realizzabilità `H₀(−ω)=H₀*(ω)` è solo enunciata in `errori_frequenti`, mai derivata come passo; mancano la condizione sufficiente di `file1` p. 44 (ampiezza simmetrica rispetto a `ω₀`, fase antisimmetrica con `β(ω₀)=0`) e la distinzione fra modello matematico e rete fisica.
7. **T5** (10 punti) è la più completa, ma sbaglia un dettaglio di definizione (`1/(2N)` invece di `1/(2N+1)` di file1 p. 19), salta il passaggio finestra finita → integrale su tutto l'asse e non mostra la serie di Fourier di `{C_k}` come passo autonomo.
8. **T15, T16, T17 sono ora verificabili sui lucidi del docente**: T15 conferma `1/(2e)≈0,18` a `G=0,5` e `1/e≈0,36` a `G=1`, e distingue `λ_t=λ+λ_r` da `λ` come il sito; T16 ha **la stessa formula** del sito (`S=1/[1+2a(1-A)/A]`); T17 conferma «TDMA strutturalmente superiore a FDMA dal punto di vista del ritardo» (la parola mancante in `file3` p. 31 è un refuso). Le tabelle numeriche delle Figure 1 e 4 dei lucidi sono immagini e non le ho lette: **NON TROVATO** il loro contenuto.
9. Due passi in tutta la collezione non hanno **né formula né figura** (`filtro-trasversale` 7, `teorema-campionamento` 3): sono passi concettuali che senza immagine non si ricordano; la regola «una sola idea, una sola riga di calcolo» va precisata in «formula **oppure** figura».
10. Il lavoro si chiude con **tre worker** su file esclusivi (aree 1-3, 4-5, 6-7), T5 e T11 per primi, e un criterio di accettazione per ogni modifica: nessuna modifica di significato, nessun punto d'esame inventato.

---

## 3. Quadro d'insieme

### 3.1 Tabella delle 18 schede

Legenda: `P0` = intervento da fare per primo (T5 e T11 valgono 10 punti); `P1` = buco didattico vero; `P2` = rifinitura che aiuta a ricordare; `P3` = solo se resta tempo. Sforzo: **S** ≤ mezz'ora, **M** ≤ 2 ore, **L** > 2 ore (stima mia, IPOTESI).

| # | file (`graph/dimostrazioni/`) | prova | passi | fig. | orfane | stato `verifica` | priorità | sforzo |
|---|---|---|---|---|---|---|---|---|
| 1 | `teorema-campionamento` | T1 | 8 | 3 | 0 | verificata_file1_file3 | P1 | M |
| 2 | `impulso-dirac-trasformata` | T2 | 8 | 2 | 0 | verificata_file1_file3 | P2 | S |
| 3 | `filtro-trasversale` | T3 | 7 | 3 | 0 | verificata_file1_file3 | P1 | M |
| 4 | `risposta-impulsiva-h` | T4 | 8 | 3 | 0 | verificata_file1_file3 | P2 | S |
| 5 | `pam-due-spettri` | **T5** | 10 | 3 | 0 | verificata_file1_file3 | **P0** | L |
| 6 | `spettri-modulazione-prodotto` | T6 | 6 | 3 | **2** | da_verificare | **P1** | L |
| 7 | `conversione-ad` | T7 | 5 | 2 | **1** | da_verificare | P1 | M |
| 8 | `conversione-da` | T8 | 7 | 2 | **1** | da_verificare | P1 | M |
| 9 | `pm-fm-trasformazione` | T9 | 5 | 2 | 0 | ricostruzione_non_del_prof | P3 | S |
| 10 | `modulazione-prodotto-qam-errore-fase` | T10 | 8 | 3 | 0 | da_verificare | P1 | M |
| 11 | `quadripoli-passa-basso-equivalente` | **T11** | 7 | 2 | 0 | verificata_file1_file3 | **P0** | L |
| 12 | `sliding-window-efficienza` | T12 | 5 | 2 | 0 (1 ripetuta) | da_verificare | P1 | M |
| 13 | `poisson-tempo-residuo` | T13 | 5 | 1 | 0 | verificata_file1_file3 | P2 | S |
| 14 | `nascita-morte-equilibrio` | T14 | 5 | 1 | 0 | verificata_file1_file3 | P2 | M |
| 15 | `aloha-throughput` | T15 | 6 | 3 | 0 | verificata_file1_file3 | P2 | S |
| 16 | `csma-cd-throughput` | T16 | 6 | 2 | 0 | da_verificare | P1 | S |
| 17 | `ritardo-tdma-fdma` | T17 | 5 | 1 | 0 | da_verificare | P2 | S |
| 18 | `formula-carson` | M12-M14 | 5 | 1 | **1** | ricostruzione_non_del_prof | P3 | M |
| — | **totale** | — | **116** | **39** | **5 in 4 file** | 9 verificate, 7 da verificare, 2 ricostruzioni | — | — |

### 3.2 Scansioni meccaniche (FATTI, ricalcolati oggi sui JSON)

- **Figure orfane** (presenti in `figure[]`, mai usate in `passi[].figura`): `catena` di `conversione-ad`, `catena` di `conversione-da`, `righe-carson` di `formula-carson`, `catena` e `ampiezza` di `spettri-modulazione-prodotto`. In questi casi il renderer le mostra nella sezione **«Figure generali»** (`figureGenerali` in `web/js/pages/dim/dati.js`): non sono perse, ma fuori dal passo che illustrano. Nota: in `spettri-modulazione-prodotto` è agganciata solo `fase`, quindi **ampiezza** resta orfana mentre la sua gemella è agganciata — segno che lo spezzone è stato montato a metà.
- **Figura ripetuta**: `finestra-con-attesa` è agganciata sia al passo 1 sia al passo 3 di `sliding-window-efficienza`.
- **Passi senza formula**: 5 (`filtro-trasversale` 1 e 7, `risposta-impulsiva-h` 1 e 3, `teorema-campionamento` 3). Di questi, **2 non hanno nemmeno una figura** (`filtro-trasversale` 7, `teorema-campionamento` 3).
- **Soluzioni «a buchi» non digitabili**: 142 varianti totali, **36** contengono caratteri che lo studente non può digitare in modo naturale. Scomposizione esatta: **27 contengono `$` o `\`** (21 con `$`, 13 con `\`, alcune entrambi) e sono **irrecuperabili** — non vengono resi e non sono digitabili; **9 contengono solo `_` o `^`** (sul totale delle 36: 14 contengono `_` e 10 contengono `^`, comprese quelle già contate sopra) e sono **ambigue** (si possono digitare, ma `2^b`, `2b`, `2**b` sono tutti modi diversi di scrivere la stessa cosa). Causa nel codice: `valutaBuchi` confronta la stringa normalizzata (solo `trim` + minuscole, `web/js/pages/dim/abuchi.js`) e la soluzione non passa da KaTeX, quindi `$…$` e `\omega` restano testo letterale.
- **Prosa dei passi** (`testo` e `perche`): **zero** lettere greche o simboli matematici Unicode fuori dai blocchi `$…$` (verificato sugli intervalli Unicode 0370-03FF, 2200-22FF, 2190-21FF, più `≠ ≤ ≥`). I simboli sono già in LaTeX: coerente con la regola di notazione. Restano solo le lettere accentate italiane, che sono corrette.
- **`varianti_notazione`**: campo **opzionale** (CONTRACTS §3.3) — manca del tutto in `formula-carson` e `pm-fm-trasformazione`, ed è **presente ma vuoto** (`[]`) in `poisson-tempo-residuo`, `nascita-morte-equilibrio`, `aloha-throughput`. Non è un errore di schema, ma in quei cinque file le differenze di simbolo rispetto alle fonti non sono dichiarate.
- **`collegamenti`**: campo opzionale, **assente** in `conversione-ad`, `conversione-da`, `spettri-modulazione-prodotto`, `modulazione-prodotto-qam-errore-fase`.
- **Riferimenti incrociati ai numeri di passo**: uno solo in tutto il repository — `pam-due-spettri` → `errori_frequenti[2].correzione` contiene «Mostrare i passi 6-9: …». **Va aggiornato** se si inserisce un passo prima del 6 (vedi T5, modifica T5-6).
- **Campi obbligatori**: tutti presenti e non vuoti nei 18 file (`a_voce` 623-1133 caratteri, dentro il vincolo 300-1500 di CONTRACTS §3.3; `versione_compatta` 3-6 voci, dentro «≤ 8 righe»).

### 3.3 Come leggere le schede

Ogni scheda segue i sette assi richiesti e chiude con una **tabella di modifiche** in forma meccanica: dove (passo o campo), che cosa fare, che testo/LaTeX mettere, come si verifica. I `\` del LaTeX andranno **raddoppiati** nel JSON (`\\omega`), come già fanno i file esistenti.

---

## 4. Analisi con evidenze, scheda per scheda

Le schede sono raggruppate per area di lavoro (la stessa divisione dei worker di CONTRACTS §7), così ogni file ha un proprietario solo.

### 4.1 Area 1-3 — campionamento, impulso, filtri, risposta impulsiva, PAM

---

#### T1 — `dim-teorema-campionamento.json` (8 passi, 3 figure)

**Esito in una riga:** dimostrazione corretta e ben condotta; il difetto è che il **caso di aliasing non è né disegnato né calcolato** e che la figura della catena è agganciata al passo sbagliato.

**Evidenza:** `file1` pp. 7-10 (p. 9 letta come immagine; 7-8 e 10 solo testo estratto), `file3` pp. 1-2 (solo testo estratto). Punto aperto già dichiarato dal JSON: in `file3` la formula di ricostruzione col seno cardinale è assente.

| asse | esito | fatto / ipotesi |
|---|---|---|
| 1. granularità | **da correggere** | Il passo 3 («si disegna… in generale diverso») contiene **due idee** (disegno dello spettro replicato + compenetrazione) e non ha né formula né figura. Il passo 5 compie tre operazioni (isolamento della replica, moltiplicazione per `T`, filtro ideale). |
| 2. perché e ipotesi | ok | Ogni passo ha un `perche` che nomina l'ipotesi usata (separazione delle repliche, banda finita). |
| 3. notazione | ok | `f_s ≥ 2f_m` e `ω_s = 2π/T` coincidono con `file1` p. 9 (`f₀ = 1/T`) con variante dichiarata. |
| 4. passaggi assenti | **sì, uno** | Manca il controesempio `ω_s < 2ω_m`: `file1` p. 9-10 lo mostra a parole, il JSON no. |
| 5. errori | nessuno | Ricontrollata la catena: antitrasformata del rettangolo → `sinc`, e l'ortogonalità `∫sinc·sinc = Tδ_{mn}` del passo 8 è esatta (Parseval su spettri rettangolari disgiunti). |
| 6. dove si blocca | **nota mancante** | Lo studente non sa *quanto* male va con `f_s` insufficiente (non ha un numero). |
| 7. coerenza | **incoerenza con T7** | Qui la condizione è `f_s ≥ 2f_m` (≥); in `dim-conversione-ad` passo 1 è `ω_s > 2ω_m` (**stretto**): due disuguaglianze diverse per lo stesso teorema. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio di accettazione |
|---|---|---|---|---|
| T1-1 | passo 3 | dare una formula al passo (oggi nessuna) | `\lvert X_s(\omega)\rvert = \frac{1}{T}\sum_{k}\lvert X(\omega+k\omega_s)\rvert` | il passo 3 non è più nell'elenco «senza formula»; il test accetta formula **o** figura per ogni passo |
| T1-2 | dopo il passo 3 | **nuovo passo** (diventa 4, rinumerare i successivi): il caso di aliasing | testo: «Se la separazione non c'è, la stessa pulsazione riceve contributi da due repliche: la frequenza `f_m` compare anche come replica di ordine 1, spostata di `f_s`.» formula: `\omega_s < 2\omega_m \;\Longrightarrow\; \omega_s-\omega_m<\omega_m,\qquad f_a = \lvert f_m - f_s\rvert` | esiste il passo con quella formula; la figura `spettro-aliasing` è agganciata **solo** a lui |
| T1-3 | figura nuova | disegnare il caso vietato | `spettro-aliasing`, tipo `grafico`: asse `ω` in `[-\omega_s-\omega_m,\ \omega_s+\omega_m]`, due triangoli centrati in `0` e `\omega_s` **sovrapposti**, zona di sovrapposizione tratteggiata, etichetta `\omega_s-\omega_m<\omega_m` sul bordo | il file `figure[]` contiene `spettro-aliasing` e `passi[].figura` la referenzia |
| T1-4 | passo 2 → passo 3 | spostare l'aggancio | la figura `spettro-e-repliche` va dal passo 2 al passo 3 (è il passo che *disegna*) | passo 2 senza figura, passo 3 con `spettro-e-repliche` |
| T1-5 | passo 4 | spostare l'aggancio errato | `catena-campionamento-ricostruzione` (schema a blocchi campionatore → filtro → ricostruzione) va agganciata al passo della ricostruzione (dopo la rinumerazione: il passo del `sinc`), non alla condizione di Nyquist | la condizione di Nyquist non ha figura; il passo della ricostruzione ha la catena **e** il seno cardinale |
| T1-6 | `richiamo_attivo` | aggiungere l'esempio numerico che sblocca | domanda: «Con `f_m = 100\ \mathrm{Hz}` e `f_s = 150\ \mathrm{Hz}` che cosa si osserva?» risposta: «Le repliche si compenetrano: la riga a `100\ \mathrm{Hz}` viene confusa con quella a `150-100 = 50\ \mathrm{Hz}` (aliasing). Con `f_s = 250\ \mathrm{Hz}` le bande restano separate.» | il richiamo contiene i tre numeri; nessun altro dato inventato |
| T1-7 | `a_buchi.soluzioni["2"]` | rendere digitabili le varianti | oggi c'è solo `omega_s >= 2 omega_m`: aggiungere `ω_s ≥ 2ω_m`, `f_s >= 2 f_m`, `fs>=2fm` | nessuna variante contiene `$`, `_`, `^`, `\` |

*(La variante `ω_s ≥ 2ω_m` è digitabile solo se lo studente ha la tastiera greca: per questo vanno accettate anche le forme latinizzate. Vale per tutte le schede: vedi §5.1, modifica globale G-1.)*

---

#### T2 — `dim-impulso-dirac-trasformata.json` (8 passi, 2 figure)

**Esito in una riga:** solida e fedele a `file1` p. 11-12; serve solo l'ipotesi di **parità** dell'impulso, che il passo 6 usa senza dichiararla.

**Evidenza:** `file1` p. 11 letta come immagine (p. 12 solo testo estratto); `file3` pp. 3-4 solo testo estratto.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | Un'idea per passo; il passo 8 (conferma indipendente con `F[D(t,\Delta)]`) è un buon «secondo modo», non una ridondanza. |
| 2. perché | **lacuna** | Il passo 6 scrive `∫e^{j\omega\tau}\delta(-\tau)d\tau` e passa al valore in `t=0` usando la selezione del passo 4, che vale per `\delta(+\cdot)`: il passaggio `\delta(-\tau)=\delta(\tau)` non è dichiarato. |
| 3. notazione | ok | `D(t,\Delta)`, `\delta(t)`, `F[\delta]=1`: identici a `file1` p. 11-12. |
| 4. passaggi assenti | no | `file1` p. 11-12 non ha nulla di assente qui; il JSON aggiunge la conferma del passo 8, dichiarata come tale. |
| 5. errori | nessuno | `F[D(t,\Delta)] = \frac{\sin(\omega\Delta/2)}{\omega\Delta/2}e^{-j\omega\Delta/2}` è corretta per il rettangolo da `0` a `\Delta` (ritardo `\Delta/2`, area 1). |
| 6. dove si blocca | lieve | Lo studente può chiedersi perché si valuta l'esponenziale in `t=0` e non in `\tau`: una riga lo chiarisce. |
| 7. coerenza | ok | `a_voce` e `versione_compatta` seguono i passi senza contraddizioni. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T2-1 | passo 6 `perche` | dichiarare la parità | aggiungere: «l'impulso ausiliario è pari nel limite, `\delta(-\tau)=\delta(\tau)`, quindi il ribaltamento non cambia l'integrale» | il `perche` del passo 6 contiene `\delta(-\tau)=\delta(\tau)` |
| T2-2 | passo 6 `formula` | rendere esplicito il ribaltamento | `\int_{-\infty}^{+\infty} e^{j\omega\tau}\,\delta(-\tau)\,d\tau = \int_{-\infty}^{+\infty} e^{-j\omega t}\,\delta(t)\,dt = 1` | la formula contiene entrambi i membri; compila con KaTeX |
| T2-3 | passo 8 `perche` | aggiungere il «ricorda che» sul limite | «prima dello zero a `\omega = 2\pi/\Delta`, cioè a `\Delta = 0{,}5\ \mathrm{s}` → `12{,}57\ \mathrm{rad/s}`: al tendere di `\Delta` a zero lo zero va all'infinito e la trasformata tende a 1 su ogni pulsazione fissata» | il testo contiene un valore numerico coerente (`12{,}57\ \mathrm{rad/s}`) |

---

#### T3 — `dim-filtro-trasversale.json` (7 passi, 3 figure)

**Esito in una riga:** la formula generale e le due specializzazioni sono corrette e coincidono con `file1` p. 15 e con NOTAZIONE.md punto A4; lo **schema a blocchi** però non è quello del prof, il passo 7 è un passo «a parole» senza formula né figura, e il passo 4 fa tre cose in una.

**Evidenza:** `file1` p. 15 letta come immagine; `file3` p. 32 solo testo estratto (il sommario di R3 la riporta come «Filtro ricorrente / trasversale / puramente ricorrente»); NOTAZIONE.md §A4.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **da correggere** | Il passo 4 (raccogliere `Y`, dividere per `X`, osservare la periodicità in `\omega`) contiene tre idee: due righe di algebra **e** un commento. Va spezzato. |
| 2. perché | ok | Il passo 2 spiega perché la seconda somma parte da `k=1` e la prima da `k=0`: è la domanda tipica. |
| 3. notazione | **differenza** | `file1` p. 15 usa `h_k` (`k=0..N-1`) e `h'_k` (`k=1..M`) — identico al JSON. `file3` p. 32 usa le stesse due famiglie ma chiama il caso `h'_k=0` «trasversale» e il caso `h_k=0, h_0=1` «puramente ricorrente»: identico. Nessuna differenza di simboli; **differisce il disegno** (vedi T3-2). |
| 4. passaggi assenti | **sì** | Manca il caso **generale stabile** (poli dentro il cerchio unitario: `\lvert e^{-j\omega T}\rvert` non basta, la condizione è sui poli in `z`), che il prof non chiede ma che il passo 7 sfiora. Ipotesi: non va aggiunto come passo, va solo chiarito (T3-4). |
| 5. errori | nessuno | `H(\omega)=\sum h_k e^{-jk\omega T}` e la forma con denominatore sono corrette; il passaggio al caso trasversale è esatto. |
| 6. dove si blocca | **figura sbagliata** | Lo studente deve *disegnare lo schema* (la domanda chiede «grafici e schemi a blocchi»): lo schema del sito (`schema-filtro-ricorrente-semplificato`) è una semplificazione, non quello a due linee di ritardo con le due serie di prese del prof. |
| 7. coerenza | ok | `formula_finale` riporta sia il caso trasversale sia quello generale, coerente con i passi 5-6. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T3-1 | passo 4 | **spezzare** in due passi | 4a algebra: `Y(\omega)\left[1-\sum_{k=1}^{M}h'_k e^{-jk\omega T}\right] = X(\omega)\sum_{k=0}^{N-1}h_k e^{-jk\omega T}` (perché: si raccoglie `Y(\omega)`, che compare in entrambe le somme); 4b rapporto: `H(\omega)=\dfrac{\sum_{k=0}^{N-1}h_k e^{-jk\omega T}}{1-\sum_{k=1}^{M}h'_k e^{-jk\omega T}}` (perché: `H` è definita come rapporto `Y/X` per `X\neq0`). Spostare nel `perche` di 4b la periodicità `H(\omega+2\pi/T)=H(\omega)` | due passi distinti, ognuno con **una** formula; la periodicità non è più nella formula |
| T3-2 | figura `schema-filtro-ricorrente-semplificato` | **rifare** lo schema secondo `file1` p. 15 | due linee di ritardo affiancate (ingresso in alto, uscita in basso), celle marcate `T`, prese `h_0,\dots,h_{N-1}` sulla linea di ingresso e `h'_1,\dots,h'_M` sulla linea di uscita, **un solo sommatore** a valle, freccia `y(t)` in uscita | la descrizione della figura nomina le due serie di pesi e il sommatore unico; `web/tests/figure.test.js` verde |
| T3-3 | passo 7 | dare formula **o** figura | proposta: agganciare una figura `poli-zeri-cerchio-unitario` (tipo `grafico`: piano `z`, cerchio unitario, 3 poli di esempio dentro e 2 fuori, etichetta «stabile se tutti i poli sono dentro») **oppure** aggiungere la formula `H(z)=\dfrac{\sum h_k z^{-k}}{1-\sum h'_k z^{-k}},\quad z=e^{j\omega T}` | il passo 7 non è più nell'elenco dei passi senza formula **e** senza figura |
| T3-4 | passo 7 `perche` | correggere l'implicazione | scrivere: «il denominatore si annulla dove `\sum h'_k e^{-jk\omega T}=1`: sono i poli in `z=e^{j\omega T}`; la stabilità chiede che stiano dentro il cerchio unitario, non che `H` sia periodica» | il `perche` non lascia intendere che `\lvert e^{-j\omega T}\rvert` decida la stabilità |
| T3-5 | `formula_finale` | semplificare la lettura | tenere la forma generale come **unica** formula finale (già c'è) e togliere dal testo la parentesi ridondante `(trasversale; …)` | `formula_finale` compila e contiene una sola espressione |
| T3-6 | `richiamo_attivo` | esempio numerico di lettura | domanda: «Con `h_0=1`, `h_1=0{,}5` e `T` qualunque, quanto vale `H` a `\omega=0` e a `\omega=\pi/T`?» risposta: `H(0)=1{,}5`; `H(\pi/T)=1-0{,}5=0{,}5` | il richiamo contiene `1{,}5` e `0{,}5`, coerenti con la formula |

---

#### T4 — `dim-risposta-impulsiva-h.json` (8 passi, 3 figure)

**Esito in una riga:** è la scheda più fedele della collezione (`file1` p. 17-18 riga per riga); servono solo lo spezzone del limite finale e due correzioni di testo.

**Evidenza:** `file1` pp. 17 **e** 18 lette come immagine; `file3` pp. 5-6 solo testo estratto. **Correzione a R3 (FATTO):** la riga D10 di `docs/research/R3-analisi-materiale.md` (riga 86) riassume il passaggio come «`h(t)=lim y(t)/∆` per input `D(t,∆)`». Su `file1` p. 17-18 si legge invece `h(t)=\lim_{\Delta\to0}y(t)`, **senza divisione per `\Delta`**: `D(t,\Delta)` ha area unitaria, quindi `y` ha già le dimensioni di `h` e dividere per `\Delta` le cambierebbe. Il JSON segue l'immagine, quindi è corretto; **va corretto R3**, non il JSON.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **denso** | Il passo 8 contiene tre cose: il limite a sinistra (`y\to h`), il limite a destra (`F[D]\to1`) e **due** formule finali (la coppia `H=F[h]`, `h=F^{-1}[H]`). |
| 2. perché | ok | I passi 6 e 8 nominano linearità, permanenza, e i risultati di T2. |
| 3. notazione | ok | `h(t)`, `D(t,\Delta)`, `H(\omega)=F[h(t)]`: identici a `file1` p. 17-18. |
| 4. passaggi assenti | **uno** | `file1` p. 18 scrive esplicitamente `\lim_{\Delta\to0}F[D(t,\Delta)]=1`: il JSON lo usa («risultato di T2») ma non lo isola come riga. |
| 5. errori | nessuno | `y(t)=\int_{-\infty}^{t}x(\tau)h(t-\tau)d\tau` è corretta per rete causale (limite superiore `t`). |
| 6. dove si blocca | **testo rotto** | Il passo 7 comincia con «Nota `h(t)` si determina…»: frase monca che confonde (sembra un'annotazione su `h(t)` invece di «Nota: nota `h(t)`…»). Va riscritto. |
| 7. coerenza | ok | `a_voce` ripercorre i passi; `a_buchi` chiede solo grandezze presenti nei passi. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T4-1 | passo 7 `testo` | correggere la frase monca | «Nota la risposta impulsiva, l'uscita per un ingresso qualunque si ottiene operando nel solo dominio dei tempi; ora si cerca il legame con la caratterizzazione in frequenza.» | il testo non inizia con «Nota `h(t)` si determina» |
| T4-2 | dopo il passo 7 | **nuovo passo**: isolare il limite dell'impulso | testo: «Al tendere di `\Delta` a zero l'impulso ausiliario tende all'impulso unitario, quindi la sua trasformata tende a uno.» formula: `\lim_{\Delta\to0}F[D(t,\Delta)] = 1` | esiste un passo con questa formula; il passo successivo (oggi 8) la richiama con `\cdot 1` |
| T4-3 | passo 8 | **spezzare** la coppia di formule | 8a: `H(\omega)=F[h(t)]=\int_{-\infty}^{+\infty}h(t)e^{-j\omega t}\,dt` (perché: si passa al limite nei due membri dell'uguaglianza `F[y]=H\,F[D]`); 8b: `h(t)=F^{-1}[H(\omega)]=\dfrac{1}{2\pi}\int_{-\infty}^{+\infty}H(\omega)e^{j\omega t}\,d\omega` (perché: `H` e `h` sono una coppia di trasformate, quindi vale anche l'inversa) | due passi, una formula ciascuno |
| T4-4 | figura `quadripolo-ingresso-generico` | allineare descrizione e passo | oggi la descrizione parla di «convoluzione» ma è agganciata al passo 1 (sollecitazione con `D(t,\Delta)`): o si riscrive la descrizione («ingresso generico `x(t)`, uscita `y(t)`»), o si sposta l'aggancio al passo 6 | descrizione e passo raccontano la stessa cosa |

---

#### T5 — `dim-pam-due-spettri.json` (10 passi, 3 figure) — **P0, vale 10 punti**

**Esito in una riga:** è la dimostrazione più completa e la più vicina alle fonti, ma per una prova da 10 punti ha **tre buchi meccanici** (definizione della media, transizione finestra finita → asse intero, serie di Fourier di `{C_k}`) e **due occasioni di controllo** non sfruttate (potenza totale, sovrapposizione righe/continuo).

**Evidenza:** `file1` pp. 19, 20, 21, 22 lette come immagine (p. 23 solo testo estratto); `file3` p. 13 letta come immagine (pp. 12, 14, 15 solo testo estratto); NOTAZIONE.md punto A2.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **tre passi densi** | Il passo 9 fa tre operazioni (convoluzione → prodotto, `F[\phi]=\lvert G\rvert^2`, accoppiamento `\pm k`). Il passo 6→7 salta il passaggio al limite `N\to\infty`. Il passo 4 (righe) compie serie di Fourier + valutazione in `n2\pi/T` in un colpo solo. |
| 2. perché | ok ma **una lacuna** | Il passo 7 dice «per `N` grande gli impulsi che contano sono dentro la finestra» e poi **usa** l'integrale su tutto l'asse: è l'ipotesi non dichiarata (coda trascurabile) che serve a chiudere il limite. |
| 3. notazione | **una differenza** | `\langle a_n^2\rangle` è definita nel JSON (ipotesi 1 e passo 1) come `\lim \frac{1}{2N}\sum_{-N}^{N}`; su **file1 p. 19** la stessa media è scritta `\frac{1}{2N+1}\sum_{-N}^{+N}`. La differenza non cambia il limite (IPOTESI: entrambe convergono alla stessa media temporale), ma va allineata. `G_x=F[C]/\pi` è conforme ad A2. |
| 4. passaggi assenti | **due** | (a) La serie di Fourier della successione `{C_k}`: `\sum_k C_k e^{-jk\omega T}=C_0+2\sum_{k\ge1}C_k\cos k\omega T` non è un passo. (b) Il controllo di potenza `\int_0^\infty G_x\,d\omega=\langle a_n^2\rangle` per impulso di Nyquist. |
| 5. errori | **nessuno nel risultato** | Ricalcolata la formula finale: `G_x=\frac{1}{\pi T}\lvert G\rvert^2[\langle a^2\rangle-\langle a\rangle^2+2\sum_{k\ge1}(\langle a_na_{n+k}\rangle-\langle a\rangle^2)\cos k\omega T]` coincide con `file1` p. 22. Fattore `1/T` del passo 8: corretto (`2NT=T\cdot2N`). |
| 6. dove si blocca | **due punti** | (a) Perché il divisore `\pi` e non `2\pi` (A2): il `perche` del passo 5 lo dice, ma non c'è un controllo numerico che lo renda memorabile. (b) Perché il continuo «si sovrappone» alle righe: `file3` p. 14 lo dice a parole, il JSON lo mette solo in coda al passo 10, senza figura. |
| 7. coerenza | **da aggiornare** | `errori_frequenti[2].correzione` contiene «Mostrare i passi 6-9»: se si inseriscono passi prima del 6, quella stringa diventa falsa. `a_voce` (1014 caratteri) e `versione_compatta` (6 voci) non citano numeri di passo: si aggiornano solo se cambia il contenuto dei passi. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T5-1 | `ipotesi[0]` e passo 1 `formula` | allineare la definizione di media a `file1` p. 19 | `\langle a_n^2\rangle=\lim_{N\to\infty}\frac{1}{2N+1}\sum_{n=-N}^{+N}a_n^2<+\infty` e, in `varianti_notazione`, la voce: canonica `1/(2N+1)` — variante `1/(2N)` (usata in `file1` p. 21 per i coefficienti `C_k`), con nota «il limite non cambia» | la formula dell'ipotesi e quella del passo 1 sono identiche fra loro e contengono `2N+1`; esiste la voce di variante |
| T5-2 | dopo il passo 6 | **nuovo passo**: passaggio al limite sull'asse intero | testo: «La finestra di osservazione va all'infinito: per un impulso a energia finita i contributi di coda sono `O(1/N)` e restano solo gli integrali su tutto l'asse.» formula: `\lim_{N\to\infty}\frac{1}{2NT}\int_{-NT}^{NT}\!\!\sum_{n}\sum_{i}x_nx_i\,g(t-nT)g(t+\tau-iT)\,dt=\frac{1}{T}\sum_{n}\sum_{i}x_nx_i\,\phi[\tau-(i-n)T]` | esiste il passo; il successivo (oggi 7) parte da `\frac{1}{T}\sum_n x_n\sum_i x_i\phi[\cdot]` senza integrali |
| T5-3 | passo 7 | snellire | lasciare al passo 7 solo il cambio di variabile nell'integrale dell'impulso e l'identificazione con `\phi` (una riga), togliendo il riferimento al limite (spostato in T5-2) | il passo 7 ha una sola idea |
| T5-4 | passo 9 | **spezzare** in due | 9a: `F[C(\tau)]=\frac{1}{T}F[\{C_k\}*\phi]=\frac{1}{T}F[\{C_k\}]\cdot\lvert G(\omega)\rvert^2` (perché: teorema della convoluzione e `F[\phi]=\lvert G\rvert^2`); 9b: `F[\{C_k\}]=\sum_{k}C_k e^{-jk\omega T}=C_0+2\sum_{k\ge1}C_k\cos k\omega T` (perché: `C_{-k}=C_k` per simboli reali) | due passi; in 9b compare la serie di Fourier della successione (T5-4 è la modifica che chiude il buco 4a) |
| T5-5 | passo 10 | figura della **sovrapposizione** | nuova figura `spettro-pam-totale` (tipo `grafico`): righe verticali alle pulsazioni `n2\pi/T` (con inviluppo tratteggiato) **più** la curva continua `\lvert G\rvert^2` dello stesso inviluppo; didascalia «le righe nascono dal valor medio, il continuo dalla parte a media zero» | la figura esiste, è agganciata al passo 10, e la descrizione contiene entrambe le componenti |
| T5-6 | dopo il passo 10 | **nuovo passo di controllo**: potenza | testo: «Controllo: con impulso rettangolare di durata `T` e ampiezza 1 l'inviluppo è `\lvert G\rvert^2`; integrando lo spettro unilaterale si ritrova la potenza media dei simboli.» formula: `\int_{-\infty}^{+\infty}\lvert G\rvert^2d\omega=2\pi\!\int g^2dt=2\pi T \;\Longrightarrow\; \int_0^{\infty}G_x(\omega)\,d\omega=\langle a_n^2\rangle` | il passo esiste; il valore numerico `2\pi T` è esatto per il rettangolo unitario; il test `tests/test_contenuti_w3.py` contiene l'asserzione `P=⟨a_n²⟩` (esempio: simboli `\pm1` equiprobabili → `P=1`) |
| T5-7 | `errori_frequenti[2].correzione` | aggiornare il riferimento | «Mostrare i passi 6-9» → il nuovo intervallo dopo le inserzioni (con T5-2 e T5-4 diventa «passi 6-11»; verificare a fine lavoro) | la stringa cita un intervallo che contiene davvero doppia somma, limite, cambio di indice, trasformata e accoppiamento `\pm k` |
| T5-8 | `a_buchi` | varianti digitabili | il buco 1 ha `a_n` (**con `_`: da togliere**) e `a con pedice n` (da tenere); il buco 6 ha `1/(πT)` e `uno diviso pi greco T`: bene; per il buco 3 aggiungere `2 pi/T` e `2pigreco/T` | 0 varianti con `$`, `_`, `^`, `\` in questo file |
| T5-9 | `varianti_notazione` | dichiarare l'uso doppio di `G` | già dichiarato in `ipotesi[4]`: portarlo anche in `varianti_notazione` (canonica `G_x(\omega)` per lo spettro di potenza — variante `G(\omega)` per lo spettro di energia dell'impulso, `file1` p. 21) | esiste la voce; nessun simbolo usato con due significati senza variante |

### 4.2 Area 4-5 — conversioni, modulazioni, quadripoli equivalenti, Carson

---

#### T6 — `dim-spettri-modulazione-prodotto.json` (6 passi, 3 figure) — **la scheda più debole**

**Esito in una riga:** la domanda del prof chiede **gli spettri di ampiezza e di fase**; il JSON dimostra soltanto la traslazione della trasformata bilaterale, non nomina mai `V(\omega)` né `\varphi(\omega)`, non costruisce `s_s` e `s_i`, e lascia **due figure orfane su tre**. Va **riscritta**, non ritoccata.

**Evidenza:** `file1` pp. 28 e 29 lette come immagine (25-27 solo testo estratto; la p. 29 è quella con `s_s(t)`, `s_i(t)`, i due spettri e la frase sul ribaltamento); `file3` pp. 18-19 **solo testo estratto**. `docs/NOTAZIONE.md` riga 22 (convenzione `V(\omega)`, `\varphi(\omega)`).

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **troppo fine e insieme incompleta** | Sei passi da una riga, con `perche` fra **30 e 89 caratteri** (media 64): il più povero è il passo 2, «Segue dalla formula di Eulero.» (30 caratteri), gli altri spiegano male il *perché* (il passo 3 dice «la moltiplicazione per un esponenziale trasla la trasformata» senza l'ipotesi di linearità). Il difetto vero non è la lunghezza: è che tre passi su sei non nominano l'ipotesi usata. Manca del tutto la metà «ampiezza e fase». |
| 2. perché e ipotesi | **debole** | Nessun passo dichiara che le bande sono disgiunte (serve al passo 4), né che `x` è reale (serve al passo 5). Il passo 3 non dice perché la moltiplicazione per un esponenziale trasla. |
| 3. notazione | **conflitto** | Il JSON definisce `\phi(\Omega)` = «argomento di `X(\Omega)`». NOTAZIONE.md (A1, riga 22 e §3) fissa invece `\varphi(\omega) = -\arg X(\omega)`: **segno opposto e glifo diverso**. Con la `\varphi` canonica l'argomento di `S` cambia segno nella banda laterale inferiore (vedi T6-4). |
| 4. passaggi assenti | **quasi tutti** | Assenti rispetto a `file1` pp. 28-29: la rappresentazione `x(t)=\int V\cos[\omega t-\varphi]d\omega`; `s_s(t)`; `s_i(t)`; `s(t)=s_s+s_i`; lo spettro di `s_s` (traslazione in alto); lo spettro di `s_i` (traslazione + **ribaltamento** attorno a `\omega_0` e **cambio di segno** della fase); la sovrapposizione; la conseguenza «ciascuna banda contiene tutto `x(t)`» → filtro passa-banda. |
| 5. errori | **uno nella fonte, zero nel JSON** | Il JSON è corretto. `file1` p. 29 **stampa un segno sbagliato** in `s_i` (vedi riquadro). Attenzione: **non copiarlo**. |
| 6. dove si blocca | **il punto esatto** | Senza la figura dei due spettri affiancati e senza una nota sul «cambio di segno della fase», il ribaltamento resta una frase da mandare a memoria. |
| 7. coerenza | **da rifare in blocco** | Cambiando i passi cambiano `a_voce` (826 caratteri), `versione_compatta` (4 voci), `a_buchi`, `richiamo_attivo` e `formula_finale`: non sono allineabili «a pezzi». |

**Riquadro — errore di segno in `file1` p. 29 (FATTO, ricalcolato)**

`file1` p. 29 stampa:

```
s_s(t) = ½ ∫ V(ω) cos[(ω₀+ω)t − φ(ω)] dω
s_i(t) = ½ ∫ V(ω) cos[(ω₀−ω)t − φ(ω)] dω      ← il segno di φ è sbagliato
```

Da `cos a cos b = ½cos(a+b) + ½cos(a−b)` con `a = ω₀t` e `b = ωt − φ(ω)` si ottiene `a − b = (ω₀−ω)t + φ(ω)`: nel termine inferiore **φ va sommata**, non sottratta. Controesempio numerico (IPOTESI di verifica, conti miei): `x(t)=\cos(\omega_m t-\pi/2)=\sin t`, `\omega_m=1`, `\omega_0=10`, `t=0{,}1\ \mathrm{s}`:

- valore vero `x\cos(\omega_0t) = 0{,}0998\cdot0{,}5403 = 0{,}0539`;
- con **+φ** (corretto): `½[\cos(1{,}1-\pi/2)+\cos(0{,}9+\pi/2)] = ½[0{,}8912-0{,}7833] = 0{,}0540` ✔;
- con **−φ** (come stampato): `½[0{,}8912+0{,}7833] = 0{,}8373` ✘.

La **conclusione** di `file1` p. 29 resta giusta («solo per quanto concerne lo spettro di fase, un cambiamento di segno»): con la convenzione `\varphi=-\arg X` si ha `\arg S(\omega_0+\Omega)=-\varphi(\Omega)` e `\arg S(\omega_0-\Omega)=+\varphi(\Omega)`, cioè `\varphi_s(\omega_0+\Omega)=\varphi(\Omega)` e `\varphi_i(\omega_0-\Omega)=-\varphi(\Omega)`. Ma la riga stampata non permette di ricavarla: è esattamente il punto in cui lo studente si blocca.

**Passi proposti (sostituzione completa di `passi`, 10 passi)**

| n | testo (sintesi) | formula | figura |
|---|---|---|---|
| 1 | Si moltiplica il messaggio per la portante. | `s(t)=x(t)\cos(\omega_0t)`, con `x(t)` reale a banda limitata | `catena` (oggi orfana: catena modulatore → canale → demodulatore) |
| 2 | Si scrive il messaggio nella forma ampiezza-fase adottata in tutto il sito. | `x(t)=\int_{\omega_i}^{\omega_m}V(\omega)\cos[\omega t-\varphi(\omega)]\,d\omega,\quad V=\frac{\lvert X\rvert}{\pi},\ \varphi=-\arg X` | nuova `spettro-ingresso` (grafico: `V(\omega)` triangolare e `\varphi(\omega)` crescente fra `\omega_i` e `\omega_m`) |
| 3 | Prodotto di coseni. | `\cos a\cos b=\tfrac12\cos(a+b)+\tfrac12\cos(a-b)` | — |
| 4 | Banda laterale **superiore**. | `s_s(t)=\frac12\int V(\omega)\cos[(\omega_0+\omega)t-\varphi(\omega)]\,d\omega` | — |
| 5 | Banda laterale **inferiore**: attenzione al segno. | `s_i(t)=\frac12\int V(\omega)\cos[(\omega_0-\omega)t+\varphi(\omega)]\,d\omega` | — |
| 6 | Somma delle due. | `s(t)=s_s(t)+s_i(t)` | — |
| 7 | Spettro di `s_s`: **traslazione in alto** di `\omega_0`. | `V_s(\omega_0+\Omega)=\tfrac12V(\Omega),\quad \varphi_s(\omega_0+\Omega)=\varphi(\Omega)` | `ampiezza` (oggi orfana) |
| 8 | Spettro di `s_i`: traslazione in alto **più ribaltamento** attorno a `\omega_0`; **solo la fase cambia segno**. | `V_i(\omega_0-\Omega)=\tfrac12V(\Omega),\quad \varphi_i(\omega_0-\Omega)=-\varphi(\Omega)` | `fase` |
| 9 | Sovrapposizione: si sommano i due disegni. | `V(\omega_0\pm\Omega)=\tfrac12V(\Omega)` sulle due bande | nuova `spettri-sovrapposti` |
| 10 | Ogni banda da sola contiene tutte le caratteristiche di `x(t)`: si può estrarne una con un filtro passa-banda (SSB). | — (chiude a parole; la formula è quella del passo 9) | — |

Verifica alternativa bilaterale, da tenere come **ultimo passo facoltativo** con simbolo `\psi` (non `\varphi`): `S(\omega)=\frac12[X(\omega-\omega_0)+X(\omega+\omega_0)]`, `\psi(\Omega)=\arg X(\Omega) \Rightarrow \arg S(\omega_0\pm\Omega)=\mp\varphi(\Omega)`.

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T6-1 | `passi` | **riscrivere** secondo la tabella qui sopra | 10 passi, una formula ciascuno (il 10 può chiudere a parole, come `idea` estesa) | 10 passi; nessun passo con più di una formula; `perche` ≥ 60 caratteri |
| T6-2 | `formula_finale` | sostituire | `V_s(\omega_0+\Omega)=\tfrac12V(\Omega),\ \varphi_s(\omega_0+\Omega)=\varphi(\Omega),\qquad V_i(\omega_0-\Omega)=\tfrac12V(\Omega),\ \varphi_i(\omega_0-\Omega)=-\varphi(\Omega)` | `formula_finale` contiene **entrambi** i cambi (ampiezza e fase) e compila |
| T6-3 | `notazione` | aggiungere i simboli usati | `V(\omega)` (ampiezza unilaterale, `\lvert X\rvert/\pi`), `\varphi(\omega)` (fase, `=-\arg X`), `s_s`, `s_i`, `V_s,\varphi_s,V_i,\varphi_i`; **cancellare** `\phi(\Omega)` = «argomento di `X`» o rinominarlo `\psi(\Omega)` con la nota «`=\arg X`, quindi `\psi=-\varphi`» | nessun simbolo ridefinito con significato diverso da NOTAZIONE.md |
| T6-4 | `errori_frequenti` | aggiungere l'errore che la fonte induce | errore: «Scrivere `\cos[(\omega_0-\omega)t-\varphi(\omega)]` per la banda inferiore»; perché sbagliato: «`\cos(a-b)` con `b=\omega t-\varphi` dà `+ \varphi`; con il meno il segnale ricostruito non è `x\cos\omega_0t` (controesempio: `\varphi=\pi/2`, `t=0{,}1\ \mathrm{s}` → 0,837 invece di 0,054)»; correzione: «scrivere `+\varphi` e ricavare da lì il cambio di segno della **fase** dello spettro» | l'errore cita il controesempio numerico ed è verificabile a mano |
| T6-5 | figure | chiudere le orfane | `catena` → passo 1; `ampiezza` → passo 7; `fase` → passo 8; nuove `spettro-ingresso` e `spettri-sovrapposti` | 0 figure orfane nel file; ogni figura agganciata a un passo che la descrive |
| T6-6 | `a_voce`, `versione_compatta`, `a_buchi`, `richiamo_attivo` | riscrivere **nello stesso commit** dei passi | `a_voce` 300-1500 caratteri che nomini `V_s/V_i` e il ribaltamento della fase; `versione_compatta` ≤ 8 righe con le due coppie; `a_buchi` con buchi solo su risposte brevi (es. `½`, `\omega_0`, «ribaltamento», «cambia segno») | i quattro campi non citano passi inesistenti; `a_buchi.soluzioni` digitabili |
| T6-7 | `verifica` | nuovo stato e nuova data | `stato: da_verificare` finché non si confrontano le immagini di `file3` pp. 18-19 (oggi lette solo nel testo estratto); `note` deve dire che `file1` p. 29 contiene l'errore di segno e che il JSON non lo copia | `note` cita la pagina e l'errore |

---

#### T7 — `dim-conversione-ad.json` (5 passi, 2 figure)

**Esito in una riga:** i cinque passi giusti ci sono tutti, ma la scheda **non dice il segnale numerico che la domanda chiede** («e il segnale numerico ottenuto»), non nomina l'intervallo `(-M,M)` né l'errore di quantizzazione, e ha la figura della catena orfana.

**Evidenza:** `file1` p. 32 letta come immagine (**confermato**: «la frequenza di campionamento `f_0=1/T` viene presa superiore al doppio della massima frequenza `f_m`», `f_0 = 1/T \ge 2f_m`; quantizzazione su `(-M,M)` diviso in `L` intervalli con valori `q_n`; «l'operazione di quantizzazione è evidentemente irreversibile», con figure della caratteristica a una e due dimensioni); `file3` p. 7 letta come immagine (**confermato il refuso**: «superiore alla massima frequenza», senza «doppio» — il JSON lo dichiara già in `errori_frequenti`).

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 5 passi, uno per operazione; la domanda chiede esattamente «i 3 passi», quindi la struttura è giusta. |
| 2. perché | ok | Ogni passo ha il suo. |
| 3. notazione | **due problemi** | (a) `file1` p. 32 usa `f_0 = 1/T` e `f_0 \ge 2f_m`: la variante **è dichiarata** in `varianti_notazione` (canonica `\omega_s=2\pi/T`, variante `f_0=1/T`) ✔, ma **`f_s`, `\omega_s`, `\omega_m` e `M` non sono in `notazione`** pur essendo usati nei passi 1, 3 e 5 (l'elenco si ferma a `x(t), T, x_n, q_n, L, b`). (b) La disuguaglianza dei passi è **stretta** (`\omega_s > 2\omega_m`), mentre `file1` p. 32 la dà non stretta (`f_0 \ge 2f_m`). |
| 4. passaggi assenti | **tre** | (a) `(-M,M)` e `L` intervalli (c'è solo `q_n\in\{q_1,\dots,q_L\}`); (b) l'errore di quantizzazione `\varepsilon_n=q_n-x_n` (che `file1` p. 32 rende con l'irreversibilità e che `dim-conversione-da` poi usa); (c) il **segnale numerico** (la forma d'onda dei bit) e il tempo di bit `T_b=T/b`. |
| 5. errori | nessuno di calcolo | `b=\lceil\log_2L\rceil`, `R_b=bf_s`: corretti. La disuguaglianza stretta è però un errore di **coerenza** con T1. |
| 6. dove si blocca | **manca la figura del quantizzatore** | Il passo chiave della domanda (la caratteristica a scalini) è presente in `file1` p. 32 in **due** versioni (1D e 2D) e assente nel sito. |
| 7. coerenza | **sì, una** | `f_s > 2f_m` (qui) contro `f_s \ge 2f_m` (T1, T5): da allineare. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T7-1 | passo 1 `formula` | correggere la disuguaglianza | `\omega_s=\frac{2\pi}{T}\ \ge\ 2\omega_m \quad\Longleftrightarrow\quad f_s\ge 2f_m` | identica alla condizione di T1 (confronto testuale fra i due file) |
| T7-2 | `notazione` | aggiungere i simboli usati e non dichiarati | voci per `f_s` (frequenza di campionamento, `=1/T`), `\omega_s=2\pi f_s`, `\omega_m` (massima pulsazione del segnale), `M` (semiampiezza dell'intervallo di variabilità); lasciare la variante `f_0=1/T` già presente in `varianti_notazione` | nessun simbolo usato nei passi è assente da `notazione` |
| T7-3 | figura `catena` | agganciare | `catena` (campionatore → quantizzatore → codificatore) va al passo 1 | 0 figure orfane |
| T7-4 | passo 3 | **arricchire** con i dettagli di `file1` p. 32 | testo: «L'intervallo di variabilità `(-M,M)` è diviso in `L` intervalli; a ogni campione si sostituisce il livello `q_n` dell'intervallo che lo contiene: l'operazione è irreversibile.» formula: `q_n=Q(x_n),\quad x_n\in(-M,M),\quad q_n\in\{q_1,\dots,q_L\},\quad \varepsilon_n=q_n-x_n` | il passo contiene `(-M,M)`, `L`, `q_n` ed `\varepsilon_n` |
| T7-5 | figura nuova | il quantizzatore a scalini | `caratteristica-quantizzatore`, tipo `grafico`: asse `x` su `(-M,M)`, asse `q` con `L=8` scalini, retta tratteggiata a 45° per confronto, doppia freccia verticale lunga `\Delta` che mostra `\varepsilon_n` | la figura esiste, è agganciata al passo 3, e la descrizione nomina `L`, `(-M,M)`, `\varepsilon` |
| T7-6 | dopo il passo 4 | **nuovo passo**: il segnale numerico | testo: «Ogni livello diventa una parola di `b` bit; emessi uno dopo l'altro al tempo di bit `T_b=T/b`, i bit formano il segnale numerico che si trasmette.» formula: `T_b=\frac{T}{b},\qquad R_b=\frac{b}{T}=\frac{1}{T_b}` | esiste il passo e il suo `R_b` coincide con quello del passo della velocità binaria (ex 5) |
| T7-7 | `verifica.punti_aperti` | dichiarare che manca la forma d'onda | aggiungere: «La forma d'onda del segnale numerico (codifica di linea) non è stata confrontata con `file1` pp. 33-34, lette solo nel testo estratto: **NON TROVATO**». Non inventare NRZ/AMI ecc. | il punto aperto esiste e nomina le pagine non lette |

---

#### T8 — `dim-conversione-da.json` (7 passi, 2 figure)

**Esito in una riga:** la catena (decodifica → PAM → passa-basso → equalizzazione → errore) è corretta e fedele a `file1` pp. 35-36; mancano il **nome** della rete equalizzatrice, la condizione `\tau\ll T` portata fino in fondo e la figura della catena è orfana.

**Evidenza:** `file1` pp. 35 **e** 36 lette come immagine (PAM `\sum x(nT)g(t-nT)`; passa-basso di ricostruzione; rete equalizzatrice `1/G(\omega)`; rumore di quantizzazione `\varepsilon=x_r-x`); `file3` p. 10 solo testo estratto.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **un passo denso** | Il passo 5 fa due cose: isola la replica **e** moltiplica per `T/G(\omega)`. Il passo 6 dice che `G\approx\tau` ma non conclude `T/G\approx T/\tau` (guadagno costante). |
| 2. perché | ok | Il passo 5 nomina la non sovrapposizione delle repliche e `G\neq0`. |
| 3. notazione | **tre problemi** | (a) Il JSON chiama `e(t)` l'errore; `file1` p. 36 usa `\varepsilon` (e `x_r-x`). (b) `s_q(t)` e `X_r(\omega)` sono usati nei passi ma **non** sono in `notazione` (che elenca `q_n`, `g(t)`, `G(\omega)`, `\omega_s`, `X(\omega)`). (c) `g(t)` e `G(\omega)` sono invece dichiarati correttamente ✔. |
| 4. passaggi assenti | **due** | (a) la **rete equalizzatrice** come blocco, con il nome; (b) il caso in cui l'equalizzatore è inutile (`\tau\ll T`), con la conseguenza numerica. |
| 5. errori | nessuno | `S(\omega)=\frac{G(\omega)}{T}\sum_kX(\omega-k\omega_s)` è esatta; `X_r=X` in banda utile è esatta. |
| 6. dove si blocca | **il fattore `T`** | Perché moltiplicare per `T/G` e non per `1/G`? Il `perche` non lo dice: viene dalla formula di campionamento (`X_s` ha il fattore `1/T`). |
| 7. coerenza | ok | `formula_finale` riassume correttamente il caso ideale. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T8-1 | passo 5 | **spezzare** | 5a: `X_r(\omega)=\frac{T}{G(\omega)}\,S(\omega)=X(\omega)` per `\lvert\omega\rvert\le\omega_m` (perché: nella banda utile `S` contiene solo la replica centrale e il fattore `1/T` della formula di campionamento si compensa con `T`); 5b: «il blocco `T/G(\omega)` è la **rete equalizzatrice** del filtro di ricostruzione» | due passi; la parola «equalizzatrice» compare nel testo |
| T8-2 | passo 6 | completare la conclusione | `G(\omega)\approx\tau \;\Longrightarrow\; \frac{T}{G(\omega)}\approx\frac{T}{\tau}` per `\lvert\omega\rvert\le\omega_m`, con la nota: «con `T/\tau = 125` l'equalizzatore è un guadagno di circa `42\ \mathrm{dB}`» | il passo contiene il rapporto `T/\tau` e il valore numerico |
| T8-3 | passo 7 | rinominare l'errore | `\varepsilon(t)=x_r(t)-x(t)`, dichiarando in `varianti_notazione` la variante `e(t)` del JSON attuale | il simbolo coincide con `file1` p. 36 (o la variante è dichiarata) |
| T8-4 | figura `catena` | agganciare | `catena` (decodificatore → generatore PAM → passa-basso → equalizzatore) al passo 2 | 0 figure orfane |
| T8-5 | passo 5 `perche` | il filtro di ricostruzione | aggiungere: «il passa-basso ideale ha banda `\omega_s/2`, non `\omega_m`: deve eliminare la prima replica, non solo la coda della banda utile» | il `perche` nomina `\omega_s/2` |
| T8-6 | `richiamo_attivo` | esempio numerico | «Con `T=1\ \mathrm{ms}` e `\tau=8\ \mathrm{\mu s}` quanto vale l'equalizzatore?» → `T/\tau = 125` (≈ 42 dB), quindi un guadagno costante: si può ometterlo | il richiamo contiene `125` |

---

#### T9 — `dim-pm-fm-trasformazione.json` (5 passi, 2 figure) — **P3**

**Esito in una riga:** corretta e autosufficiente; è una **ricostruzione** (nessuna pagina di `file1`/`file3` la contiene, secondo R3 e le fonti del JSON) e come tale è dichiarata. Da migliorare solo la dichiarazione dell'ipotesi di linearità e il caso degenere.

**Evidenza:** nessuna pagina letta come immagine: `fonti` = `RICOSTRUZIONE` + `FILE2` pp. 7-8 (documento **non allegato**). Ho verificato solo la matematica.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 5 passi, una formula ciascuno. |
| 2. perché | **una lacuna** | Il passo 4 (derivatore prima della FM) non dice perché si passa dall'ingresso della **FM** e non della PM: è la sorgente dell'errore tipico. |
| 3. notazione | ok | `\theta_{PM}=k_pm`, `\theta_{FM}=k_f\int m+\theta_0`: forma standard, coerente con l'uso di `\theta` nel resto del sito. |
| 4. passaggi assenti | **uno** | La condizione di validità: la catena è esatta solo se si può scegliere `\theta_0` (il passo 5 lo fa, ma non dice che è un'ipotesi). |
| 5. errori | nessuno | Verificato: `PM\{\frac{k_f}{k_p}\int m+\frac{\theta_0}{k_p}\}=k_f\int m+\theta_0` ✔; `FM\{\frac{k_p}{k_f}m'\}=k_p(m(t)-m(t_0))+\theta_0`, uguale a `k_pm(t)` se `\theta_0=k_pm(t_0)` ✔. |
| 6. dove si blocca | lieve | Manca un esempio numerico/minimo (`k_p`, `k_f`, `m=\cos`). |
| 7. coerenza | **una** | `formula_finale` scrive `\mathrm{PM}\{\cdot\}=\mathrm{FM}\{m\}`: notazione `PM\{·\}` non spiegata in `notazione` (non c'è la voce). |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T9-1 | passo 4 `perche` | dichiarare dove si inserisce il blocco | «il derivatore va **all'ingresso della FM**: cercavamo `u` con `k_f\int u=k_pm`, quindi `u=\frac{k_p}{k_f}m'`» | il `perche` nomina «ingresso della FM» |
| T9-2 | `notazione` | spiegare `PM\{·\}`, `FM\{·\}` e `\theta` | «`\mathrm{PM}\{u\}` è il segnale PM di modulante `u`; `u` può essere un integrale o una derivata di `m`»; aggiungere `\theta_{PM}`, `\theta_{FM}` (fase eccedente) e `\theta_0` (fase iniziale), oggi **assenti** dall'elenco (`m, k_p, k_f, \omega_0`) | tutti i simboli usati nei passi sono in `notazione` |
| T9-3 | passo 5 | dichiarare l'ipotesi | `\theta_0` regolabile a piacere (è un parametro del modulatore), altrimenti resta un offset costante `k_p(m(t_0))` | il `perche` dice «ipotesi: fase iniziale regolabile» |
| T9-4 | `richiamo_attivo` | esempio minimo | «Con `m(t)=A\cos\omega_mt`, `k_p=1`, `k_f=\omega_m`: che cosa entra nella PM?» → `u=A\sin\omega_mt` (a meno di costante) | il richiamo è verificabile a mano in due righe |

---

#### T10 — `dim-modulazione-prodotto-qam-errore-fase.json` (8 passi, 3 figure)

**Esito in una riga:** la catena demodulazione → QAM → matrice di rotazione è **corretta e completa nel risultato** (matrice verificata), ma non spiega il **fattore 2** dell'oscillatore locale, non dà la **lettura vettoriale** che rende la matrice una rotazione, e non ha nessuna figura dell'errore di fase.

**Evidenza:** `file1` p. 40 letta come immagine (uscite `x_1\cos\Delta-x_2\sin\Delta`, `x_2\cos\Delta+x_1\sin\Delta`; schema modulatore con `M_p`, sfasatore `\pi/2`, sommatore; inviluppo `s(t)=\operatorname{Re}\{[x_1+jx_2]e^{j\omega_0t}\}`); `file3` p. 24 letta come immagine; `file1` pp. 37-39 solo testo estratto.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 8 passi, uno per operazione; il passo 5 (identità prodotto-somma) è un richiamo legittimo. |
| 2. perché | **una lacuna** | Il passo 1 usa `2\cos\cdot\cos` senza dire **perché 2**: senza il 2 resterebbe `\frac12x\cos\Delta`. |
| 3. notazione | ok | `\Delta` con la convenzione `\cos(\omega_0t-\Delta)`: conforme a `file1` p. 40. `\omega_0` vs `m_0` di `file3` dichiarato. |
| 4. passaggi assenti | **due** | (a) la rappresentazione complessa `s=\operatorname{Re}\{(x_1+jx_2)e^{j\omega_0t}\}` e la moltiplicazione per `e^{-j\Delta}`; (b) il caso `\Delta=\pi/2` (i due canali si scambiano), che è la verifica più istruttiva. |
| 5. errori | nessuno | Verificato ramo per ramo: `2s\cos(\omega_0t-\Delta)` filtrato → `x_1\cos\Delta-x_2\sin\Delta` ✔; `-2s\sin(\omega_0t-\Delta)` → `x_2\cos\Delta+x_1\sin\Delta` ✔; matrice = rotazione di `+\Delta` ✔ (coerente con `formula_finale`). |
| 6. dove si blocca | **due punti** | (a) il segno `-` davanti a `\sin` nel ramo 2 (perché `-2\sin`?); (b) quanto vale l'errore per `\Delta` piccolo: senza numeri non si ricorda. |
| 7. coerenza | ok | `errori_frequenti` e `richiamo_attivo` coerenti con i passi. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T10-1 | passo 1 `perche` | spiegare il fattore 2 | «si moltiplica per `2\cos(\omega_0t-\Delta)` perché `2\cos a\cos b=\cos(a-b)+\cos(a+b)`: il 2 lascia `x\cos\Delta` in banda base, senza il fattore `\frac12`» | il `perche` contiene `2\cos a\cos b` e la parola «banda base» |
| T10-2 | dopo il passo 7 | **nuovo passo**: lettura vettoriale | `s(t)=\operatorname{Re}\{(x_1+jx_2)e^{j\omega_0t}\},\qquad \hat{x}_1+j\hat{x}_2=e^{j\Delta}(x_1+jx_2)` | esiste il passo; la formula coincide con `file1` p. 40 |
| T10-3 | figura nuova | disegnare la rotazione | `rotazione-assi`, tipo `grafico`: piano `(x_1,x_2)`, vettore `(x_1,x_2)` e vettore ruotato di `\Delta`, archi con `\Delta`, tratteggio delle proie sugli assi ruotati | la figura esiste ed è agganciata al passo nuovo |
| T10-4 | `richiamo_attivo` | esempio numerico | «Con `\Delta=10^\circ`: `\cos\Delta=0{,}9848`, `\sin\Delta=0{,}1736`; con `x_1=1`, `x_2=0` l'uscita è `(0{,}9848;\ 0{,}1736)`, cioè un disturbo pari a `-15{,}1\ \mathrm{dB}`» | il richiamo contiene `0{,}9848`, `0{,}1736`, `-15{,}1` |
| T10-5 | passo 5 | agganciare una figura o nulla | il passo 5 (identità prodotto-somma) resta senza figura: è accettabile, ma va **escluso** dal conteggio «passi senza formula» perché ha la formula | test: ogni passo ha formula **o** figura |
| T10-6 | `errori_frequenti` | aggiungere il caso `\Delta=\pi/2` | errore: «Applicare la matrice senza accorgersi che a `\Delta=\pi/2` i canali si scambiano (`\hat{x}_1=-x_2`, `\hat{x}_2=x_1`)» | l'errore cita il caso degenere con le formule |

---

#### T11 — `dim-quadripoli-passa-basso-equivalente.json` (7 passi, 2 figure) — **P0, vale 10 punti**

**Esito in una riga:** la derivazione `I_r=H_0I` con `H_0(\omega)=H(\omega+\omega_0)` è corretta e i due passi finali 5-7 si ripetono; **manca interamente la parte sulla realizzabilità fisica**, che è il punto in cui la domanda da 10 punti distingue chi ha capito: la condizione c'è solo in `errori_frequenti` e `richiamo_attivo`, mai come passo con la formula.

**Evidenza:** `file1` pp. 42, 43 **e** 44 lette come immagine; `file3` pp. 50-51 solo testo estratto. Ho inoltre verificato `file1` pp. 43-44 nel testo estratto, che riporta le stesse frasi delle immagini.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **ridondanza** | I passi 5 e 7 dicono la stessa cosa (`I_r=H_0I`): il 5 la ricava dal confronto, il 7 la ripete applicando la definizione. Si può chiudere in un passo. |
| 2. perché | ok fino al passo 7 | Il fattore 2 del passo 3 è spiegato (parte reale, bande disgiunte) — è il punto che `file1` p. 42-43 mette in evidenza. |
| 3. notazione | **una differenza** | `file1` p. 43-44 chiama `H_0(\omega)` la funzione equivalente: identico ✔. Per la fase di `H` usa `\beta(\omega)` con `\beta(\omega_0)=0`, simbolo **assente** dal JSON: se si aggiunge la parte sulla realizzabilità, va aggiunto anche `\beta`, dichiarando che è `-\arg H` (in `file1` p. 44, figure, si legge `H=\lvert H\rvert e^{-j\beta}`): è **la stessa convenzione** di `\varphi=-\arg X`. |
| 4. passaggi assenti | **due, decisivi** | (a) `H_0(-\omega)\neq H_0^*(\omega)` in generale → **non** è una rete fisica (p. 43); (b) condizione sufficiente: ampiezza **simmetrica** rispetto a `\omega_0` e fase **antisimmetrica** con `\beta(\omega_0)=0` → `H_0(-\omega)=H_0^*(\omega)` → rete fisica (p. 44). Entrambe sono sull'immagine, quindi sono FATTI, non mie deduzioni. |
| 5. errori | nessuno | Verificata anche la condizione (b) in algebra, con la convenzione di `file1` p. 44 (`\beta=-\arg H`, quindi `H=\lvert H\rvert e^{-j\beta}`): ampiezza pari rispetto a `\omega_0` (`\lvert H(\omega_0-\omega)\rvert=\lvert H(\omega_0+\omega)\rvert`) e `\beta` dispari (`\beta(\omega_0-\omega)=-\beta(\omega_0+\omega)`) danno `H_0(-\omega)=H_0^*(\omega)` ✔. |
| 6. dove si blocca | **sì** | Lo studente sa scrivere `H_0=H(\omega+\omega_0)` ma non sa dire **quando** quel modello è realizzabile: è la metà dei punti. |
| 7. coerenza | **una** | `punti_aperti` dice «verifica della realizzabilità fisica completa: NON TROVATO», ma la condizione è su `file1` p. 44 (letta a immagine): il punto aperto va **chiuso** con il riferimento, non lasciato aperto. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T11-1 | dopo il passo 7 (o al posto del 7, se si fonde con il 5) | **nuovo passo**: il modello non è sempre fisico | testo: «L'operatore `H_0` non è sempre la funzione di trasferimento di una rete fisicamente realizzabile: in generale manca la simmetria coniugata.» formula: `H_0(-\omega)\neq H_0^{*}(\omega)` | esiste il passo con la disuguaglianza; il `perche` cita «modello matematico, non fisico» |
| T11-2 | subito dopo | **nuovo passo**: quando lo è | testo: «Se la rete passa-banda ha ampiezza simmetrica rispetto a `\omega_0` e fase antisimmetrica con `\beta(\omega_0)=0`, allora la simmetria coniugata vale e `H_0` è realizzabile.» formula: `\lvert H(\omega_0-\omega)\rvert=\lvert H(\omega_0+\omega)\rvert,\ \ \beta(\omega_0-\omega)=-\beta(\omega_0+\omega)\ \Longrightarrow\ H_0(-\omega)=H_0^{*}(\omega)` | esiste il passo; la formula è verificabile per sostituzione (test T11-6) |
| T11-3 | `notazione` | aggiungere `\beta` con il segno di `file1` p. 44 | `\beta(\omega)=-\arg H(\omega)`, cioè `H=\lvert H\rvert e^{-j\beta}` (corretto in revisione: `file1` p. 44, figure, usa il **meno**), con la nota: «stessa convenzione di `\varphi=-\arg X`, **non** `\arg H`» | il simbolo è definito con il segno di `file1` p. 44; nessun `\arg H` senza segno |
| T11-4 | `verifica.punti_aperti` | chiudere il punto | togliere «verifica della realizzabilità fisica completa: NON TROVATO» e sostituirlo con «realizzabilità verificata su `file1` p. 44 (immagine); resta NON TROVATO il confronto con il libro» | il punto aperto non afferma più il contrario di quanto ora dimostrato |
| T11-5 | passo 5 e passo 7 | **fondere** | un solo passo finale: `I_r(\omega)=H_0(\omega)I(\omega)` sul supporto di `I` (perché: la definizione `H_0=H(\omega+\omega_0)` coincide con il risultato del confronto nella banda utile) | i passi passano da 7 a 8 ma nessuno ripete la stessa formula finale due volte |
| T11-6 | test (in `tests/test_contenuti_w4.py`) | asserzione numerica | con `H(\omega)=H_{LP}(\omega-\omega_0)` (LP reale) si deve avere `H_0=H_{LP}` e `H_0(-\omega)=H_0^*(\omega)`: asserire su 3 pulsazioni di esempio | il test passa e fallisce se si inverte un segno |
| T11-7 | figura `traslazione-spettrale` | **portare a quattro pannelli** | (1) `\lvert S\rvert` con le due bande a cavallo di `\pm\omega_0`; (2) `\lvert H\rvert` e `\beta` nella banda positiva; (3) `\lvert I\rvert` e `\lvert H_0\rvert` in banda base; (4) schema I/Q (due rami con sfasatore `\pi/2`) che realizza il filtro complesso | la descrizione della figura nomina i quattro pannelli; `figure.test.js` verde |
| T11-8 | figura `quadripoli` | aggiungere la nota della fonte | in coda alla descrizione: «come in `file1` p. 43, il ramo in basso è un **modello matematico**, non un modello fisico» | la descrizione contiene la distinzione modello/fisico |

---

#### Carson — `dim-formula-carson.json` (5 passi, 1 figura) — **P3 (gruppo B, M12-M14)**

**Esito in una riga:** la regola è giusta e ben motivata sul caso sinusoidale, ma è dichiarata come ricostruzione (le fonti danno la formula, non la derivazione), ha la figura orfana e non ha mai un numero.

**Evidenza:** `file1` p. 41 e `file3` p. 28 **solo testo estratto** (non lette a immagine in questa sessione): non posso confermare né la forma esatta della formula né se `\beta` vi sia definito. Il JSON dichiara `stato: ricostruzione_non_del_prof`.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 5 passi, una formula ciascuno. |
| 2. perché | ok | Le ipotesi (stima, non supporto esatto) sono dichiarate in `ipotesi`. |
| 3. notazione | **ambiguità** | `\beta` è in `notazione` ma **senza la definizione operativa** `\beta=\Delta\omega_{\max}/\omega_m`; senza di essa il passo 2 (`\Delta\omega_{\max}=\beta\omega_m`) è circolare (IPOTESI: la definizione c'è nelle fonti, ma non l'ho verificata a immagine). |
| 4. passaggi assenti | **uno** | Lo sviluppo in funzioni di Bessel `J_n(\beta)`, che è ciò che rende vera la frase «righe laterali di ampiezza decrescente»: **NON TROVATO** nelle fonti (le fonti danno la formula, non la derivazione) → si può aggiungere solo dichiarandolo ricostruzione. |
| 5. errori | nessuno | `\Delta\omega_{\max}=\beta\omega_m` ✔, `n_{\max}\approx\beta+1` ✔, `B_\omega\approx 2(\beta+1)\omega_m` ✔; con `\beta=2`, `f_m=1\ \mathrm{kHz}` → `6\ \mathrm{kHz}` ✔. |
| 6. dove si blocca | **manca il numero** | È l'unica scheda senza alcun valore numerico: la regola senza un esempio non si ricorda. |
| 7. coerenza | ok | `a_voce` e compatta coerenti con i passi. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| C-1 | `notazione` | definire `\beta` | `\beta=\dfrac{\Delta\omega_{\max}}{\omega_m}` (indice di modulazione), con la variante `m_f` se compare nelle fonti (da verificare a immagine) | la definizione c'è; il passo 2 non è più circolare |
| C-2 | figura `righe-carson` | agganciare | al passo 3 (le righe laterali) | 0 figure orfane |
| C-3 | dopo il passo 5 | **nuovo passo**: il numero | `\beta=2,\ f_m=1\ \mathrm{kHz}\ \Rightarrow\ n_{\max}\approx3,\ B\approx2(3)(1\ \mathrm{kHz})=6\ \mathrm{kHz}` | esiste il passo con `6\ \mathrm{kHz}` |
| C-4 | passo 4 `perche` | dire che è una regola sulle ampiezze | «le righe oltre `n_{\max}` hanno ampiezza trascurabile ma non nulla: Carson è una stima di banda, non un limite» | il `perche` contiene «stima, non limite» |
| C-5 | `verifica.punti_aperti` | dichiarare i limiti di lettura | «`file1` p. 41 e `file3` p. 28 lette solo nel testo estratto: forma esatta della formula e definizione di `\beta` **NON TROVATO** a immagine» | il punto aperto esiste |
| C-6 | `varianti_notazione` | creare l'array (assente) | `\beta` canonico — variante `m_f` o `m` se le fonti usano altro (da confermare) | il campo esiste (oggi manca del tutto) |

### 4.3 Area 6-7 — protocolli a finestra, processi aleatori, accesso multiplo

---

#### T12 — `dim-sliding-window-efficienza.json` (5 passi, 2 figure)

**Esito in una riga:** la formula a due regimi è corretta e coerente con `file1` p. 49 (che dà entrambi i casi, con `A=H`); mancano il **perché del `2IC`**, un **esempio numerico** e la figura del regime a finestra insufficiente è la stessa del regime continuo.

**Evidenza:** `file1` pp. 49 **e** 50 lette come immagine; `file3` pp. 29 **e** 30 lette come immagine (p. 30 riporta `\eta=\frac{D}{D+H}`, il solo regime saturo).

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 5 passi; il passo 5 chiude con la formula unica `\eta=\frac{D}{F}\min(1,\frac{WF}{C\,TT})`, che è la forma più memorizzabile. |
| 2. perché | **una lacuna** | Nessun passo spiega perché il ciclo contiene `2IC` (andata del dato **e** ritorno dell'ACK): è la domanda che si sente sempre. |
| 3. notazione | **differenza dichiarata a metà** | Il JSON usa `A` con la variante di **nome** `ACK` dichiarata ✔; ma il denominatore abbreviato `D+2H+2IC` di `file1` p. 49 presuppone `A=H`, ipotesi che il JSON mette in `ipotesi[3]` e nel passo 5 ✔. Il simbolo `TT` (dall'inizio del frame alla ricezione dell'ACK) è conforme. Manca invece la variante per `H` (intestazione) se le fonti usano un altro simbolo: non verificato. |
| 4. passaggi assenti | **due** | (a) la condizione di saturazione in forma di soglia `W^{*}=C\,TT/F` (numero di trame che satura la finestra); (b) il controllo `\eta\le1`. |
| 5. errori | nessuno | Verificato: `\eta=\frac{D}{F}\min(1,\frac{WF}{C\,TT})` dà `\frac{WD}{C\,TT}` sotto soglia e `D/F` sopra ✔; `C\,TT=F+A+2IC` ✔ (i due ritardi `I` compaiono due volte: dato e ACK). |
| 6. dove si blocca | **il regime** | Senza un numero lo studente non sa «quanta» finestra serve: la soglia `W^{*}` risolve. |
| 7. coerenza | **figura ripetuta** | `finestra-con-attesa` è agganciata **due volte** (passi 1 e 3): il passo 3 è il regime *insufficiente*, che merita un disegno diverso. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T12-1 | figura nuova | disegno del regime insufficiente | `finestra-insufficiente`, tipo `temporale`: `W=2` trame in volo, il trasmettitore si **ferma** (tratteggio) fino all'ACK della prima, asse con `T_f`, `I`, `I`, `T_{ACK}` | la figura esiste ed è agganciata solo al passo 3; `finestra-con-attesa` resta al passo 1 |
| T12-2 | passo 1 `perche` | spiegare il doppio `I` | aggiungere: «`2I` perché il ritardo si paga due volte: andata del dato e ritorno dell'ACK; il trasmettitore può avanzare la finestra solo quando l'ACK è arrivato» | il `perche` contiene «due volte» e «ACK» |
| T12-3 | dopo il passo 4 | **nuovo passo**: soglia di saturazione | `W^{*}=\frac{C\,TT}{F},\qquad \eta=\frac{D}{F}\ \text{per}\ W\ge W^{*}` | esiste il passo; `W^{*}` è coerente con il passo 5 |
| T12-4 | `richiamo_attivo` | esempio numerico completo | «`C=10\ \mathrm{kbit/s}`, `D=950\ \mathrm{bit}`, `H=50\ \mathrm{bit}`, `A=50\ \mathrm{bit}`, `I=10\ \mathrm{ms}`: `T_f=0{,}1\ \mathrm{s}`, `TT=0{,}125\ \mathrm{s}`, `C\,TT=1250\ \mathrm{bit}`; con `W=1` si ha `\eta=0{,}76`, con `W\ge2` `\eta=0{,}95`» | i cinque numeri sono coerenti fra loro e con la formula del passo 5 (verificabile a mano) |
| T12-5 | passo 5 `perche` | dichiarare `\eta\le1` | aggiungere: «il minimo garantisce `\eta\le1`: non si può consegnare più della frazione utile di una trama» | il `perche` contiene `\eta\le1` |
| T12-6 | `verifica.note` | dire cosa dà `file3` | aggiungere: «`file3` p. 30 (immagine) riporta solo il regime saturo `\eta=\frac{D}{D+H}`; il regime limitato dalla finestra segue `file1` p. 49» | la nota distingue le due fonti |

---

#### T13 — `dim-poisson-tempo-residuo.json` (5 passi, 1 figura)

**Esito in una riga:** corretta e ben ordinata (sopravvivenza → densità → condizionamento → semplificazione → media); mancano la **frase che dà senso a tutto** (l'assenza di memoria) e i numeri.

**Evidenza:** `file1` p. 53 letta come immagine; `file3` p. 47 solo testo estratto (il JSON cita «p. 40 della numerazione stampata»).

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 5 passi, una formula ciascuno. |
| 2. perché | ok | Ogni passo giustifica con l'ipotesi giusta (incrementi indipendenti, eventi disgiunti). |
| 3. notazione | **differenza non dichiarata** | Il JSON usa `\lambda` per il tasso; `file1` (slide di Reti) usa anche `\lambda_t` nella formula della probabilità di successo. Il campo `varianti_notazione` **esiste ma è vuoto** (`[]`): la variante non è dichiarata. |
| 4. passaggi assenti | **uno, concettuale** | Il risultato `P(R>r\mid X>t_0)=P(X>r)` **è** l'assenza di memoria: va detto esplicitamente, con la conseguenza `E[R\mid X>t_0]=1/\lambda` **indipendente da `t_0`**. |
| 5. errori | nessuno | `F_X=1-e^{-\lambda t}`, `f_X=\lambda e^{-\lambda t}`, condizionamento e semplificazione ✔; `E[R]=\int_0^\infty e^{-\lambda r}dr=1/\lambda` ✔. |
| 6. dove si blocca | **il paradosso** | Lo studente si aspetta che, avendo già aspettato `t_0`, il residuo medio sia minore: va detto che non è così. |
| 7. coerenza | ok | `a_buchi` e compatta coerenti. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T13-1 | dopo il passo 4 | **nuovo passo**: assenza di memoria | testo: «La probabilità condizionata non dipende da `t_0`: il tempo già trascorso non cambia la legge del residuo. È l'assenza di memoria della distribuzione esponenziale.» formula: `P(R>r\mid X>t_0)=P(X>r)=e^{-\lambda r}` | esiste il passo e contiene «assenza di memoria» |
| T13-2 | passo 5 `perche` | esplicitare il paradosso | aggiungere: «il valore medio `1/\lambda` non dipende da `t_0`: chi ha già atteso non attende meno» | il `perche` contiene «non dipende da `t_0`» |
| T13-3 | `richiamo_attivo` | esempio numerico | «Con `\lambda=500\ \mathrm{s^{-1}}`: `E[R]=2\ \mathrm{ms}` e `P(R>1\ \mathrm{ms})=e^{-0{,}5}=0{,}6065`» | i tre numeri sono esatti (`0{,}6065`) |
| T13-4 | figura `poisson-distribuzione-residuo` | rendere visibile il condizionamento | la figura deve mostrare **due** curve: `f_X(t)` dall'origine e la stessa densità traslata a partire da `t_0` (tratteggio), con la nota «la coda è identica» | la descrizione nomina le due curve e `t_0` |
| T13-5 | `varianti_notazione` | riempire l'array (oggi `[]`) | canonica `\lambda` — variante `\lambda_t` (`file1`, slide di Rete); se le fonti usano solo `\lambda`, dichiararlo esplicitamente con la fonte | l'array non è vuoto |

---

#### T14 — `dim-nascita-morte-equilibrio.json` (5 passi, 1 figura)

**Esito in una riga:** i bilanci e la soluzione prodotto sono corretti, ma il passaggio «equilibrio ⇒ derivate nulle ⇒ bilancio» è **saltato** (il passo 3 comincia già «allo stato zero e in equilibrio») e non c'è esempio numerico.

**Evidenza:** `file1` pp. 54 **e** 55 lette come immagine; `file3` p. 48 letta come immagine.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | **un salto** | Fra il passo 2 (`dp_k/dt=\dots`) e il passo 3 (bilancio allo stato 0) manca la riga `dp_k/dt=0\ \forall k`: è il passaggio che dà senso a tutto il resto. |
| 2. perché | **uno debole** | Il passo 4 dice «il flusso netto è costante tra frontiere»: il motivo (sommando le equazioni da `0` a `k` i termini interni si cancellano) non è mostrato. |
| 3. notazione | ok | `\lambda_k,\mu_k,p_k`: conforme a `file1` p. 54-55 (che usa `P_k` maiuscolo: **variante da dichiarare**). |
| 4. passaggi assenti | **due** | (a) la condizione di equilibrio esplicita; (b) il taglio/frontiera come stratagemma di calcolo. |
| 5. errori | nessuno | `P_k=P_0\prod_{i=0}^{k-1}\lambda_i/\mu_{i+1}` e `P_0=(1+\sum_{k\ge1}\prod\dots)^{-1}` ✔; con `N` finito la serie è finita ✔. |
| 6. dove si blocca | **due punti** | Perché proprio il prodotto dei rapporti, e che cosa cambia con `N` finito (`\lambda_N=0`). |
| 7. coerenza | ok | `ipotesi` dichiara `\mu_0=0`, `\lambda_N=0`; i passi li usano. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T14-1 | fra i passi 2 e 3 | **nuovo passo**: l'equilibrio | testo: «All'equilibrio le probabilità non dipendono dal tempo: tutte le derivate sono nulle e ogni stato ha bilancio nullo fra ingressi e uscite.» formula: `\frac{dp_k}{dt}=0\ \ \forall k\ \Longrightarrow\ \lambda_{k-1}p_{k-1}+\mu_{k+1}p_{k+1}=(\lambda_k+\mu_k)p_k` | esiste il passo; il passo 3 (oggi) ne è la specializzazione a `k=0` |
| T14-2 | passo 4 `perche` | mostrare il taglio | aggiungere: «sommando le equazioni di bilancio da `0` a `k` i termini interni si cancellano e resta `\lambda_kp_k=\mu_{k+1}p_{k+1}`: è il flusso netto attraverso il taglio fra `k` e `k+1`» | il `perche` contiene l'argomento della somma telescopica |
| T14-3 | figura nuova | il taglio | `taglio-flussi`, tipo `blocchi`: catena `0—1—…—k` / `k+1—…—N` con frecce `\lambda_k` a destra e `\mu_{k+1}` a sinistra attraverso la linea di taglio | la figura esiste ed è agganciata al passo 4 |
| T14-4 | `richiamo_attivo` | esempio numerico a 3 stati | «Con `\lambda_0=2\mu_1` e `\lambda_1=\frac12\mu_2` si ottiene `P_0=0{,}25`, `P_1=0{,}5`, `P_2=0{,}25`» | i tre valori sommano a 1 e soddisfano `P_1/P_0=2`, `P_2/P_1=\frac12` |
| T14-5 | `varianti_notazione` | dichiarare `P_k`/`p_k` | canonica `p_k` — variante `P_k` (`file1` pp. 54-55) | esiste la voce |
| T14-6 | passo 5 `perche` | il caso `N` finito | aggiungere: «con `N` finito e `\lambda_N=0` la catena è chiusa: la somma che definisce `P_0` è finita e non serve alcuna condizione ulteriore» | il `perche` contiene `\lambda_N=0` |

---

#### T15 — `dim-aloha-throughput.json` (6 passi, 3 figure)

**Esito in una riga:** è la scheda **meglio verificabile** della collezione: i lucidi del docente confermano `\rho=Ge^{-2G}` con massimo `1/(2e)\approx0{,}18` a `G=0{,}5` e `\rho=Ge^{-G}` con massimo `1/e\approx0{,}36` a `G=1`. Manca solo l'ultimo numero: il **valore** dei massimi.

**Evidenza:** `file1` pp. 45-46 lette come immagine; `file3` p. 20 letta come immagine (il refuso `e^{2\lambda_t\tau}` è reale); **`AccessoMultiplo.pdf` aperto**: contiene «ALOHA puro `ρ=Ge^{-2G}`, massimo `1/(2e)=0,18` a `G=0,5`» e «slotted `ρ=Ge^{-G}`, massimo `1/e=0,36` a `G=1`».

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 6 passi, una formula ciascuno; il passo 6 fa la derivata di entrambe le curve in una riga: legittimo perché è la stessa operazione. |
| 2. perché | ok | Finestra vulnerabile `2\tau` spiegata geometricamente. |
| 3. notazione | **conforme** (corretto in revisione) | I lucidi definiscono `\lambda_t=\lambda+\lambda_r` (successi più ritrasmissioni), `\rho=\lambda\tau`, `G=\lambda_t\tau` e `\rho=G e^{-2G}`: **la stessa distinzione del JSON** ✔. Manca solo `\lambda_r` in `notazione`. |
| 4. passaggi assenti | **uno** | Il valore dei massimi `\rho_{\max}=1/(2e)\approx0{,}1839` e `1/e\approx0{,}3679`: il passo 6 trova solo i punti `G=1/2` e `G=1`. |
| 5. errori | nessuno | Derivate e punti stazionari ✔; `0{,}1839` e `0{,}3679` ricalcolati ✔; il refuso di `file3` p. 20 è dichiarato ✔. |
| 6. dove si blocca | **il numero** | Chi deve «calcolare il massimo» deve saper dire 0,18 e 0,36, non solo `G=0,5` e `G=1`. |
| 7. coerenza | ok | `a_voce`, compatta e buchi allineati. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T15-1 | passo 6 | **aggiungere le ordinate** | dopo i punti stazionari: `\rho_{\max}=\frac{1}{2e}\approx0{,}1839\ (G=\tfrac12),\qquad \rho_{\mathrm{slot},\max}=\frac1e\approx0{,}3679\ (G=1)` | le due ordinate compaiono nel passo o in `formula_finale` |
| T15-2 | `formula_finale` | allineare | includere i due massimi (oggi la formula finale contiene solo le curve) | `formula_finale` contiene `1/(2e)` e `1/e` |
| T15-3 | `notazione` | aggiungere `\lambda_r` | voce: `\lambda_r` = tasso delle ritrasmissioni, con `\lambda_t=\lambda+\lambda_r`, fonte `LUCIDI_CASONI`: i lucidi **confermano** la distinzione del JSON, quindi non serve nessuna variante | il simbolo è in `notazione` e la fonte è citata |
| T15-4 | `fonti` | aggiungere i lucidi | `{chiave: "LUCIDI_CASONI", rif: "AccessoMultiplo.pdf, slide ALOHA puro e slotted ALOHA"}` | la chiave è fra quelle ammesse da CONTRACTS §5 e il test `test_contenuti_w5.py` la accetta |
| T15-5 | `verifica` | aggiornare note e stato | note: «numeri e massimi confermati sui lucidi del corso oltre che su `file1` pp. 45-46»; stato: **proposta** `verificata_testo_prof` (i lucidi sono materiale del docente) — se il coordinatore riserva quello stato al libro, lasciare `verificata_file1_file3` | la nota non afferma nulla che non sia nei lucidi |
| T15-6 | `richiamo_attivo` | confronto in una riga | «A parità di traffico `G=0{,}5`: ALOHA puro vale `0{,}184`, slotted `0{,}303`; il massimo slotted (`0{,}368`) si ha a `G=1`, dove il puro vale `0{,}135`» | i quattro valori sono calcolati dalla formula del passo 4-5 (verificabili: `0{,}5e^{-1}=0{,}1839`, `0{,}5e^{-0{,}5}=0{,}3033`, `1e^{-2}=0{,}1353`) |

---

#### T16 — `dim-csma-cd-throughput.json` (6 passi, 2 figure)

**Esito in una riga:** la formula del sito **coincide con quella dei lucidi del docente**: i lucidi scrivono `S=\frac{1/2a}{1/2a+\frac{1-A}{A}}` e il sito `S=\frac{1}{1+2a\frac{1-A}{A}}`, che sono la **stessa espressione**; identici anche `A=Np(1-p)^{N-1}`, `p=1/N` ed `E[w]=\frac{1-A}{A}`. La dimostrazione è corretta e **non c'è nessuna divergenza da documentare**: restano una **precisazione** sul rapporto `1/(2a)`, il **contesto del protocollo** e la variante di notazione per `a`.

**Evidenza:** `file1` p. 47 letta come immagine; `file3` p. 22 letta come immagine; **`AccessoMultiplo.pdf` aperto e leggibile nel testo** (le tre funzioni di CSMA/CD; `A`; `E[w]`; `S`; `a=\frac{Rd}{VL}`; la frase «intervallo di trasmissione di durata `1/2a` slot, assumendo unitario il tempo di trasmissione di un frame»). **NON TROVATO:** il contenuto delle **Figure 1 e 4** del PDF, che sono immagini e che non ho letto come immagine; quindi in questa scheda **non è citato nessun valore numerico dei lucidi**.

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 6 passi, una formula ciascuno. |
| 2. perché | **precisazione, non errore** (corretto in revisione) | Passo 1: «`1/(2a)` è una durata misurata in numero di slot». I lucidi hanno «l'intervallo di trasmissione di **durata `1/2a` slot**»: la frase del JSON è **compatibile** con la fonte. Conviene solo aggiungere che `1/(2a)=T_f/T_{\mathrm{slot}}` è un **rapporto fra due durate** e citare i lucidi. |
| 3. notazione | **una variante da dichiarare** | I lucidi: `a=\frac{Rd}{VL}=\frac{propagation\ time}{transmission\ time}`; il JSON: `a=T_p/T_f`. Stessa grandezza: va dichiarata la variante. |
| 4. passaggi assenti | **uno** | Le tre funzioni del protocollo — *carrier sensing*, *multiple access*, *collision detection* con segnalazione di `jamming` e ritrasmissione dopo back-off — che il testo dei lucidi elenca e che il JSON non nomina: senza di esse `2T_p` e lo slot restano numeri senza origine. |
| 5. errori | nessuno | `A`, `p=1/N`, `A_{\max}=(1-1/N)^{N-1}`, `E[w]=(1-A)/A`, `S` ricalcolati; `S(a=0{,}5;N=2)=0{,}5` ✔ (conto mio sulla formula del sito, non un dato dei lucidi). |
| 6. dove si blocca | **l'asse del grafico — solo IPOTESI** | Il JSON si limita a `0<a\le1/2`, che è il limite **fisico** (la collisione va rilevata entro la trama). Se la domanda chiede «il grafico in funzione di `a`», un asse esteso oltre `1/2` mostrerebbe perché il protocollo richiede `a` piccolo. **IPOTESI**: non ho letto le Figure 1 e 4, quindi non so che intervallo usi il docente. |
| 7. coerenza | **sì, una** | `ipotesi[3]` dice `0<a\le1/2` ma la figura e la formula non hanno limite: dichiarare che è un limite **fisico**, non matematico. |
| 8. modello | **conforme** | La formula dei lucidi è algebricamente **identica** a quella del sito: nessuna divergenza, nessun valore da riconciliare. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T16-1 | passo 1 `perche` | **precisazione** (non correzione) | aggiungere: «come nei lucidi, `1/2a` slot è la durata dell'intervallo di trasmissione quando il frame vale un tempo unitario: `T_f/T_{\mathrm{slot}}=1/(2a)` è un rapporto fra due durate» | il `perche` cita i lucidi e contiene `T_f/T_{\mathrm{slot}}`; nessuna affermazione che la frase attuale sia sbagliata |
| T16-2 | `idea` o `ipotesi` | aggiungere il contesto del protocollo | una riga: «CSMA/CD: *carrier sensing*, *multiple access*, *collision detection* con segnalazione di `jamming` e ritrasmissione dopo un back-off casuale» | la riga esiste e ogni elemento è citabile dal testo dei lucidi |
| T16-3 | figura `csma-cd-throughput-grafico` | **allargare l'asse — solo IPOTESI** | asse `a` da `0` a `10`, curve per `N=2` e `N=10`, zona `a>1/2` tratteggiata con didascalia «oltre `1/2` la collisione non è più rilevabile entro la trama» | si applica **solo se** il coordinatore accetta l'IPOTESI; il criterio è che la descrizione della figura nomini l'intervallo effettivamente scelto |
| T16-4 | `fonti` e `varianti_notazione` | lucidi e variante di `a` | fonte `LUCIDI_CASONI` (`AccessoMultiplo.pdf`, sezione CSMA/CD); variante: canonica `a=T_p/T_f` — variante `a=\frac{Rd}{VL}` | la fonte è presente; la variante cita i lucidi |
| T16-5 | `verifica` | aggiornare stato e note | da `da_verificare` a `verificata_file1_file3` (o `verificata_testo_prof` se il coordinatore accetta i lucidi come testo del docente); `note`: «la formula coincide con quella dei lucidi; le Figure 1 e 4 non sono state lette» | lo stato non è più `da_verificare` senza motivo; la nota non cita valori numerici dei lucidi |

*(Nota di revisione: la prima versione attribuiva ai lucidi una tabella numerica di throughput e ne deduceva un modello diverso dal sito. L'attribuzione è stata **rimossa**: quei numeri stanno in figure che non ho letto come immagine, mentre la formula leggibile nel testo è identica a quella del sito.)*

---

#### T17 — `dim-ritardo-tdma-fdma.json` (5 passi, 1 figura)

**Esito in una riga:** la formula è corretta (`D_{TD}=T(M+1)/(2M)=D_{FD}-\frac{T}{2}(1-\frac1M)`, ricalcolata) e **l'ambiguità sulla conclusione è risolta dai lucidi**: «TDMA strutturalmente superiore a FDMA dal punto di vista del ritardo». Resta un problema di **simbolo**: il JSON usa `\omega` (che nel resto del sito è la pulsazione) dove i lucidi usano **`w`**.

**Evidenza:** `file1` p. 48 letta come immagine; `file3` p. 31 letta come immagine (manca la parola dopo «a FDMA»); **`AccessoMultiplo.pdf` aperto e leggibile nel testo**: `R_{FD}=Mb/T`, `R_{TD}=b/(T/M)`, `D=w+\tau` con `w_{FD}=0` e `w_{TD}=\frac{T}{2}(1-\frac1M)`, `D_{TD}=D_{FD}-\frac{T}{2}(1-\frac1M)` e la frase «TDMA è strutturalmente superiore a FDMA dal punto di vista del ritardo».

| asse | esito | fatto |
|---|---|---|
| 1. granularità | ok | 5 passi; il passo 4 (media delle attese) è il cuore e ha la giustificazione giusta (`M(M-1)/2`). |
| 2. perché | **una lacuna, ma l'ipotesi è della fonte** | L'ipotesi che rende discreta la media (pacchetti generati **all'inizio del ciclo**) è in `ipotesi[1]` ma il passo 3 la cita solo di sfuggita. I lucidi la contengono esplicitamente («il pacchetto `S_{mk}` comincerà ad essere trasmesso `(m-1)T/M` s dopo la sua generazione»): `ipotesi[1]` **non è più una ricostruzione** e va riformulata citando i lucidi. |
| 3. notazione | **simbolo diverso dal docente** (corretto in revisione) | I lucidi scrivono `D=w+\tau`, con `w` tempo di attesa medio, `w_{FD}=0` e `w_{TD}=\frac{1}{M}\sum_{m=1}^{M}(m-1)\frac{T}{M}=\frac{T}{2}(1-\frac1M)`: il simbolo del docente è **`w`**. Il JSON usa `\omega`, che nel resto del sito è la **pulsazione**: in `D=\omega+\tau` si legge «pulsazione più tempo». Va rinominato `w`. |
| 4. passaggi assenti | **uno** (corretto in revisione) | (a) nessuna assenza di sostanza: il JSON scrive `D_{TD}=D_{FD}-\frac{b}{2R}(M-1)`, che è **una delle due forme dei lucidi** ✔ (i lucidi danno anche `D_{FD}-\frac{T}{2}(1-\frac1M)`), e conviene riportare entrambe; (b) la frase-conclusione del confronto come passo. |
| 5. errori | nessuno | Verificato: `\frac{T(M+1)}{2M}=T-\frac{T}{2}(1-\frac1M)` ✔ e `\frac{T(M+1)}{2M}=D_{FD}-\frac{b}{2R}(M-1)` con `T=Mb/R` ✔. |
| 6. dove si blocca | **due punti** | Il valore numerico e la frase da scrivere in fondo («il TDMA è superiore per `M>1`»). |
| 7. coerenza | ok | `a_voce` (663 caratteri) e compatta coerenti. |

**Modifiche**

| # | dove | azione | contenuto proposto | criterio |
|---|---|---|---|---|
| T17-1 | `notazione`, `passi`, `formula_finale`, `a_voce`, `a_buchi` | **rinominare** il tempo di attesa in `w` | `w` al posto di `\omega` (es. `D=w+\tau`, `w_{FD}=0`, `w_{TD}=\frac{T}{2}(1-\frac1M)`), come nei lucidi; in `varianti_notazione` la voce «canonica `w`» — la variante tipografica si aggiunge **solo** se l'immagine di `file3` p. 31 mostra un altro simbolo (non verificato) | nessuna occorrenza di `\omega` come tempo; `w` coincide con il simbolo dei lucidi |
| T17-2 | passo 5 `formula` | riportare **entrambe** le forme dei lucidi | `D_{TD}=\frac{T}{2}\left(1-\frac1M\right)+\frac{T}{M}=D_{FD}-\frac{T}{2}\left(1-\frac1M\right)=\frac{T(M+1)}{2M}` (e, se serve, `=D_{FD}-\frac{b}{2R}(M-1)`) | la formula contiene la forma con `T/2` e quella con `b/(2R)` |
| T17-3 | dopo il passo 5 | **nuovo passo**: la conclusione | testo: «Per `M>1` il TDMA ha ritardo medio minore; per `M=1` i due sistemi coincidono. Il vantaggio viene dall'attesa nulla dell'utente 1 e massima dell'utente `M`, mediata.» formula: `D_{TD}<D_{FD}\ \text{per}\ M>1,\qquad D_{TD}=D_{FD}\ \text{per}\ M=1` | esiste il passo con la disuguaglianza e il caso `M=1` |
| T17-4 | `richiamo_attivo` | esempio numerico | «`M=4`, `b=1000\ \mathrm{bit}`, `R=4\ \mathrm{kbit/s}` → `T=1\ \mathrm{s}`, `D_{FD}=1\ \mathrm{s}`, `D_{TD}=0{,}625\ \mathrm{s}`, differenza `0{,}375\ \mathrm{s}`» | i quattro valori sono coerenti (`T=Mb/R=1`) |
| T17-5 | `fonti` e `ipotesi[1]` | aggiungere i lucidi e correggere la qualifica dell'ipotesi | fonte `LUCIDI_CASONI` (`AccessoMultiplo.pdf`, sezione «FDMA vs. TDMA: ritardo medio»); `ipotesi[1]` non è più «IPOTESI di ricostruzione»: i lucidi danno la derivazione di `w_{TD}`, quindi va riformulata come ipotesi **della fonte** | la fonte è presente e `ipotesi[1]` non si presenta più come ricostruzione del sito |
| T17-6 | `verifica` | chiudere l'ambiguità | note: «La conclusione del sito (TDMA superiore) coincide con i lucidi del corso; la parola mancante in `file3` p. 31 è un refuso»; stato → `verificata_file1_file3` (o `verificata_testo_prof` con i lucidi) | il `punti_aperti` non contiene più la contraddizione |
| T17-7 | passo 3 `perche` | dichiarare l'ipotesi della media | «la media è discreta e uniforme **perché** ogni utente genera all'inizio del ciclo: è l'ipotesi che rende `w_m` multiplo intero di `T/M`» | il `perche` contiene «ipotesi» e «inizio del ciclo» |

---

## 5. Lista prioritaria delle modifiche

### 5.1 Modifiche globali (valgono per tutti i file, prima delle singole)

| # | modifica | dove | perché aiuta a capire e ricordare | sforzo | criterio misurabile |
|---|---|---|---|---|---|
| **G-1** | rendere **digitabili** le soluzioni «a buchi» | 12 file su 18 (`aloha`, `conversione-ad`, `csma-cd`, `filtro-trasversale`, `nascita-morte`, `pam`, `poisson`, `ritardo-tdma`, `sliding-window`, `teorema-campionamento`): **36** varianti su 142, di cui **27 con `$` o `\`** (irrecuperabili) e **9 con sole `_`/`^`** (ambigue) | la modalità «a buchi» è quella che si usa per l'autoverifica: se la soluzione non è digitabile, la modalità è **rotta** e lo studente la abbandona | S per file | `re.compile(r"[\\$^_]")` non trova nulla in nessuna variante; le forme latinizzate (`omega_s >= 2 omega_m`, `1/(2e)`) sono accettate accanto a quelle con simboli |
| **G-2** | agganciare le **figure orfane** | 5 orfane in 4 file (`conversione-ad`, `conversione-da`, `formula-carson`, `spettri-modulazione-prodotto`×2) e 1 figura ripetuta (`sliding-window`) | una figura che illustra un passo deve stare **a quel passo**: oggi finisce in «Figure generali» e il legame si perde | S | il controllo di §7.3 non segnala orfane né ripetizioni |
| **G-3** | precisare la regola dei passi: «**una formula _o_ una figura** per passo» | 18 file | due passi (`filtro-trasversale` 7, `teorema-campionamento` 3) non hanno né formula né figura: sono i due che nessuno ricorda | S | nessun passo privo di entrambi; il test accetta `formula` **o** `figura` |
| **G-4** | aggiungere i **lucidi del docente** come fonte dove li ho aperti | `aloha`, `csma-cd`, `ritardo-tdma` (chiave `LUCIDI_CASONI`, `AccessoMultiplo.pdf`) | sono l'unica verifica **del docente** disponibile: T15 conferma i massimi e la distinzione `\lambda_t/\lambda`, T17 chiude la contraddizione, T16 conferma la formula | S | `fonti` contiene la chiave; la `note` di `verifica` dice che cosa conferma |
| **G-5** | aggiornare **passi + compatta + a voce + buchi nello stesso commit** | 18 file | le quattro rappresentazioni sono la stessa dimostrazione: se si toccano i passi e non `a_voce`, lo studente sente raccontare una cosa che non vede | S per file | `git show --stat` di ogni commit di area tocca un file per volta con tutti i campi; nessun campo cita passi inesistenti (rinominare i passi di T5 rompe la stringa «passi 6-9» in `errori_frequenti`) |
| **G-6** | colmare i `collegamenti` mancanti | `conversione-ad`, `conversione-da`, `spettri-modulazione-prodotto`, `qam-errore-fase` (campo **opzionale** ma utile all'interleaving) | collega la dimostrazione ai nodi di teoria e alle altre dimostrazioni: è ciò che rende il ripasso «a rete» e non «a lista» | S | ogni dimostrazione ha almeno 2 collegamenti a nodi esistenti; `tests/test_graph.py` non segnala ID inesistenti |

### 5.2 Ordine di priorità

**P0 — T5 e T11 (10 punti ciascuna).** Sono le uniche due con punteggio dichiarato: il rapporto valore/sforzo è massimo.

| # | modifica | file | perché | sforzo |
|---|---|---|---|---|
| P0-1 | T5-1 (media `1/(2N+1)`), T5-2 e T5-3 (limite alla finestra infinita), T5-4 (serie di Fourier di `{C_k}`), T5-5 (figura righe + continuo), T5-6 (controllo di potenza), T5-7 (stringa «passi 6-9») | `pam-due-spettri` | sono i quattro anelli mancanti della catena: senza, la formula finale resta «un atto di fede» (parole dell'`errori_frequenti` del file stesso) | L |
| P0-2 | T11-1 e T11-2 (realizzabilità: `H_0(-\omega)\neq H_0^*(\omega)` e condizione sufficiente con `\beta`), T11-3 (`\beta` in notazione), T11-4 (chiudere il punto aperto), T11-5 (fondere 5 e 7), T11-7 (figura a 4 pannelli), T11-8 (modello matematico ≠ fisico) | `quadripoli-passa-basso-equivalente` | è la metà «da 10 punti» della domanda: la condizione è su `file1` p. 44 e nel sito non è mai un passo | L |

**P1 — i buchi didattici veri e le schede da precisare** (T6 da riscrivere; T7, T8, T10, T1, T3, T12, T16 da completare o precisare, più i «numeri che mancano»).

| # | modifica | file | perché | sforzo |
|---|---|---|---|---|
| P1-1 | T6-1 ÷ T6-7 (riscrittura completa, 10 passi, figure, controesempio sul segno) | `spettri-modulazione-prodotto` | la domanda chiede ampiezza **e** fase: il file fa un'altra cosa | L |
| P1-2 | T16-1 ÷ T16-5 (precisazione sul rapporto `1/(2a)` citando i lucidi, contesto del protocollo, variante di `a`, aggiornamento di `verifica`; l'asse esteso è **IPOTESI**) | `csma-cd-throughput` | la formula è già identica a quella dei lucidi: mancano solo il contesto del protocollo e le citazioni | S |
| P1-3 | T7-1 ÷ T7-7 (disuguaglianza `\ge`, catena, caratteristica del quantizzatore, segnale numerico) | `conversione-ad` | la domanda chiede il segnale numerico: oggi non c'è | M |
| P1-4 | T8-1 ÷ T8-6 (spezzare, equalizzatore, `\varepsilon`, catena, esempio `T/\tau`) | `conversione-da` | il fattore `T` è il punto in cui tutti sbagliano il conto | M |
| P1-5 | T10-1 ÷ T10-6 (fattore 2, lettura vettoriale, figura della rotazione, numeri) | `modulazione-prodotto-qam-errore-fase` | la matrice è giusta ma resta una formula da imparare a memoria senza figura | M |
| P1-6 | T1-1 ÷ T1-7 (aliasing disegnato e numerico, agganci sistemati) | `teorema-campionamento` | l'aliasing è la prima cosa che si chiede di spiegare | M |
| P1-7 | T3-1 ÷ T3-6 (spezzare il passo 4, schema del prof, passo 7) | `filtro-trasversale` | la domanda chiede **lo schema**: quello del sito non è quello del prof | M |
| P1-8 | T12-1 ÷ T12-6 (figura del regime insufficiente, `2IC`, soglia, esempio) | `sliding-window-efficienza` | due regimi senza disegno diverso si confondono | M |

**P2 — rifiniture che fanno ricordare** (T15, T17, T13, T14, T2, T3 residui, G-6).

| # | modifica | file | perché | sforzo |
|---|---|---|---|---|
| P2-1 | T15-1 ÷ T15-6 (massimi `0,1839`/`0,3679`, fonti, confronto) | `aloha-throughput` | «calcolare il massimo» richiede il valore, non solo il punto | S |
| P2-2 | T17-1 ÷ T17-7 (rinomina `w`, forme della fonte, conclusione, numeri) | `ritardo-tdma-fdma` | `w` è il simbolo dei lucidi; `\omega` come tempo è una trappola di lettura | S |
| P2-3 | T13-1 ÷ T13-5 (assenza di memoria, paradosso, numeri, figura) | `poisson-tempo-residuo` | il risultato senza il nome «assenza di memoria» non si collega a nulla | S |
| P2-4 | T14-1 ÷ T14-6 (equilibrio esplicito, taglio, numeri) | `nascita-morte-equilibrio` | il salto `dp_k/dt=0` è il punto in cui si perde il filo | M |
| P2-5 | T2-1 ÷ T2-3 (parità dell'impulso, numero dello zero) | `impulso-dirac-trasformata` | un solo passaggio non dichiarato | S |
| P2-6 | T4-1 ÷ T4-4 (frase monca, limite isolato, coppia spezzata, didascalia) | `risposta-impulsiva-h` | rifinitura di testo | S |

**P3 — solo se resta tempo:** T9-1 ÷ T9-4 (`pm-fm`, ricostruzione dichiarata), C-1 ÷ C-6 (Carson: `\beta`, figura, numero).

---

## 6. Cosa NON fare

1. **Non cambiare il significato** di nessuna dimostrazione e nessun risultato finale: questo audit propone solo aggiunte, spezzoni e chiarimenti. Se un risultato va cambiato, è un errore mio da segnalare, non una libertà del worker.
2. **Non aggiungere punteggi.** Solo T5 e T11 valgono 10 punti; per tutte le altre il punteggio resta **NON TROVATO** finché `file2` non è disponibile. Non scrivere «5 punti», «6 punti» né «vale molto all'esame».
3. **Non attribuire nulla al libro.** Calandrino-Immovilli non è stato consultato e non è disponibile: nessuna nota del tipo «come dice il libro a p. x». I riferimenti «p. x.y» di `file1` restano IPOTESI (capitolo.pagina).
4. **Non copiare le figure dei PDF** (e nemmeno i ritagli): CONTRACTS §1 vieta di versionare il PDF e le sue immagini. Le figure proposte qui vanno **ridisegnate** in SVG dal worker, con la descrizione che ho dato.
5. **Non copiare l'errore di segno di `file1` p. 29** in `s_i`: la formula corretta ha `+\varphi`.
6. **Non usare `\omega` per un tempo** (T17): il simbolo è già la pulsazione in tutto il sito.
7. **Non mettere LaTeX nelle soluzioni dei buchi** (`$…$`): non viene reso e non è digitabile. Se una risposta è una formula lunga, **non è un buco**: va tolta dal testo a buchi o trasformata in richiamo attivo.
8. **Non aumentare il numero di passi per «completezza»**: la regola è *un passo = una idea*; se un passo nuovo non toglie un blocco, non va aggiunto. Nessuna scheda deve superare i 12 passi.
9. **Non rinominare gli `id` delle dimostrazioni né dei nodi**: sono referenziati da `graph.json`, dal quiz e dai collegamenti.
10. **Non toccare `docs/CONTRACTS.md`** per far passare una proposta: se serve un campo nuovo (per esempio `figure[]` con «pannelli»), si scrive nel report del worker e decide il coordinatore.
11. **Non dichiarare `verificata_testo_prof`** una dimostrazione solo perché ho aperto i lucidi di accesso multiplo: la scelta va fatta dal coordinatore, e vale solo per T15-T17.
12. **Non «abbellire» la prosa con simboli Unicode** (α, ω, ≥): la notazione passa da KaTeX, e il testo in prosa usa le parole («pulsazione», «maggiore o uguale»).

---

## 7. Ordine di lavoro, worker e file esclusivi

### 7.1 Sequenza consigliata (5 fasi)

1. **Fase 0 — globali meccaniche (G-1, G-2, G-3, G-6).** Nessuna decisione didattica: si può fare in parallelo su tutti i file. Chiude subito il difetto più fastidioso per lo studente (i buchi non digitabili).
2. **Fase 1 — P0: T11 e T5.** Due worker diversi, in parallelo, perché sono i due file da 10 punti e non si toccano.
3. **Fase 2 — P1.** T6 per primo (è una riscrittura e va fatta con calma), poi T16, T7, T8, T10, T1, T3, T12.
4. **Fase 3 — P2 e P3.** T15, T17, T13, T14, T2, T4, T9, Carson.
5. **Fase 4 — revisione.** Il coordinatore esegue i controlli di §7.3 su tutto, verifica che nessun campo citi passi inesistenti e chiude i punti aperti.

Vincolo di dipendenza: **T6 va riscritto prima di T10** (T10 usa la modulazione a prodotto: i simboli `V`, `\varphi` devono essere già fissati in T6); **T5 va fatto prima di T1/T8** solo se si decide di cambiare le convenzioni di `G` (non è necessario: la convenzione A2 è già fissata).

### 7.2 Worker e file esclusivi (nessuna sovrapposizione)

| worker | area (CONTRACTS §7) | file `graph/dimostrazioni/` | test di cui è proprietario | schede |
|---|---|---|---|---|
| **WA** | aree 1-3 | `teorema-campionamento`, `impulso-dirac-trasformata`, `filtro-trasversale`, `risposta-impulsiva-h`, `pam-due-spettri` | `tests/test_contenuti_w3.py` | T1, T2, T3, T4, **T5** |
| **WB** | aree 4-5 | `conversione-ad`, `conversione-da`, `spettri-modulazione-prodotto`, `modulazione-prodotto-qam-errore-fase`, `quadripoli-passa-basso-equivalente`, `pm-fm-trasformazione`, `formula-carson` | `tests/test_contenuti_w4.py` | T6, T7, T8, T9, T10, **T11**, Carson |
| **WC** | aree 6-7 | `aloha-throughput`, `csma-cd-throughput`, `ritardo-tdma-fdma`, `sliding-window-efficienza`, `poisson-tempo-residuo`, `nascita-morte-equilibrio` | `tests/test_contenuti_w5.py` | T12, T13, T14, T15, T16, T17 |
| **WD** | coordinatore | **nessun file di contenuto**: solo `docs/research/` e i controlli | `tests/test_schema.py`, `tests/test_integrita.py`, `tests/test_kg_build.py`, `web/tests/latex.test.js` | revisione di tutte le schede |

Perché questa divisione e non «una scheda a testa»: i file esclusivi sono la regola del repository, e le aree 1-3 / 4-5 / 6-7 hanno già test dedicati che conoscono le convenzioni (per esempio `test_contenuti_w3.py` controlla i segnaposto dei buchi e i controlli numerici delle formule finali). Un worker che tocca un file di un'altra area rompe quel patto.

### 7.3 Controlli e criteri di accettazione comuni

**Stato di partenza misurato** (FATTO, oggi): `sh web/build.sh` e poi `cd web && node --test tests/latex.test.js` → **3 test su 3 passati**: tutte le formule del grafo compilano con KaTeX e nessuna formula contiene segnaposto. `pytest` non è installato in questa sandbox, quindi i test Python non sono stati eseguiti: la CI li esegue.

Ogni worker, prima di chiudere, deve avere:

1. `node --test tests/latex.test.js` verde **dopo** `sh web/build.sh` (le formule nuove compilano).
2. Il controllo strutturale qui sotto con **tutte le righe `OK`** (è il criterio di G-1, G-2, G-3, G-5): ogni riga che non è `OK` elenca i problemi da chiudere. Va eseguito dalla radice del repository; non è un file da versionare, è uno strumento di verifica da incollare in una shell:

```python
import glob, json, re
NON_DIGITABILE = re.compile(r"[\\$^_]")
for f in sorted(glob.glob("graph/dimostrazioni/*.json")):
    d = json.load(open(f, encoding="utf-8"))
    problemi = []
    ids = {x["id"] for x in d["figure"]}
    usate = [p["figura"] for p in d["passi"] if p.get("figura")]
    ripetute = {u for u in usate if usate.count(u) > 1}
    if ripetute:
        problemi.append(f"figura ripetuta: {sorted(ripetute)}")
    for orfana in sorted(ids - set(usate)):
        problemi.append(f"figura orfana: {orfana}")
    for p in d["passi"]:
        if not p.get("formula") and not p.get("figura"):
            problemi.append(f"passo {p['n']}: ne formula ne figura")
        if len(p.get("perche", "")) < 40:
            problemi.append(f"passo {p['n']}: perche corto ({len(p['perche'])} caratteri)")
    for chiave, varianti in d["a_buchi"]["soluzioni"].items():
        for v in varianti:
            if NON_DIGITABILE.search(v):
                problemi.append(f"buco {chiave}: variante non digitabile {v!r}")
    if not 300 <= len(d["a_voce"]) <= 1500:
        problemi.append(f"a_voce fuori range: {len(d['a_voce'])}")
    if [p["n"] for p in d["passi"]] != list(range(1, len(d["passi"]) + 1)):
        problemi.append("numerazione dei passi non consecutiva")
    print(d["id"], "OK" if not problemi else problemi)
```

3. **Test numerici per scheda** (da aggiungere in `tests/test_contenuti_wX.py` del proprio worker, come asserzioni pure senza dipendenze):

| scheda | asserzione | valore atteso |
|---|---|---|
| T1 | con `f_m=100\ \mathrm{Hz}`, `f_s=150\ \mathrm{Hz}` l'alias è `\lvert f_m-f_s\rvert` | `50\ \mathrm{Hz}` |
| T5 | `\int_0^\infty G_x\,d\omega` per rettangolo unitario e simboli `\pm1` | `1` (= `\langle a_n^2\rangle`) |
| T6 | `s_s+s_i` con `\varphi=\pi/2`, `\omega_m=1`, `\omega_0=10`, `t=0{,}1` | `0{,}054` (con `-\varphi`: `0{,}837`) |
| T7 | `L=256` → `b`, e `R_b` con `f_s=8\ \mathrm{kHz}` | `b=8`, `R_b=64\ \mathrm{kbit/s}` |
| T8 | `T/\tau` con `T=1\ \mathrm{ms}`, `\tau=8\ \mathrm{\mu s}` | `125` (≈ `42\ \mathrm{dB}`) |
| T10 | `\cos10^\circ`, `\sin10^\circ`, diafonia `20\log_{10}(\sin/\cos)` | `0{,}9848`, `0{,}1736`, `-15{,}1\ \mathrm{dB}` |
| T11 | `H_0(-\omega)=H_0^*(\omega)` per `H=H_{LP}(\omega-\omega_0)` | vero su 3 pulsazioni |
| T12 | esempio del richiamo: `W=1` e `W\ge2` | `0{,}76` e `0{,}95` |
| T13 | `\lambda=500`, `r=1\ \mathrm{ms}` | `e^{-0{,}5}=0{,}6065`, `E[R]=2\ \mathrm{ms}` |
| T14 | `\lambda_0=2\mu_1`, `\lambda_1=\mu_2/2` | `P=(0{,}25;0{,}5;0{,}25)` |
| T15 | massimi | `0{,}1839` e `0{,}3679` |
| T16 | proprietà della formula del sito: `S(a=0)=1`; `S` decrescente in `a`; `S(a=0{,}5;N=2)=0{,}5` | `1`; monotonia; `0{,}5` |
| T17 | `M=4`, `b=1000`, `R=4\ \mathrm{kbit/s}` | `D_{FD}=1\ \mathrm{s}`, `D_{TD}=0{,}625\ \mathrm{s}` |
| Carson | `\beta=2`, `f_m=1\ \mathrm{kHz}` | `6\ \mathrm{kHz}` |

4. **Ispezione a occhio di tre pagine per scheda** (le immagini sono in `/home/user/work/pages/`): chi applica una modifica che nasce da una mia osservazione deve rileggere **la pagina citata** prima di scrivere. Se la pagina non conferma, la modifica non si fa e si scrive perché.

---

## 8. Punti aperti e NON TROVATO

| # | punto | stato |
|---|---|---|
| 1 | Contenuto del libro Calandrino-Immovilli, edizione, corrispondenza dei riferimenti «p. x.y» | **NON TROVATO** (il libro non è online; la pagina del corso lo elenca soltanto) |
| 2 | Punteggi delle domande diverse da T5 e T11 | **NON TROVATO** (`file2` non è allegato al repository) |
| 3 | Lucidi di Reti (`lucidi_new.pdf`, slide 75 e 106 citate da `file1`): T13 e T14 | **NON LETTI**: il PDF non è scaricabile da questa sandbox e il lettore di pagine web si ferma a 30 pagine |
| 4 | `ComElettriche.pdf` oltre le prime pagine (PAM, modulazioni angolari, Carson) | **NON TROVATO** nello spezzone leggibile |
| 5 | Contenuto numerico delle Figure 1 e 4 dei lucidi CSMA/CD (tabelle di throughput) | **NON TROVATO**: sono immagini e non le ho lette come immagine; la formula leggibile nel testo è identica a quella del sito (T16) |
| 6 | Pagine di `file1` lette **solo nel testo estratto** e rilevanti per le schede | p. 12 (T2), pp. 25-27 e 30-31 (T6), pp. 33-34 (T7), pp. 37-39 (T10), p. 41 (Carson), pp. 51-52 (T13) |
| 7 | Pagine di `file3` lette **solo nel testo estratto** e rilevanti | pp. 1-2 (T1), 3-4 (T2), 5-6 (T4), 8-12 (T7-T8), 14-15 (T5), 18-19 (T6: **da rileggere a immagine prima di riscrivere T6**), 21 (T15), 23 e 25-28 (T10, Carson), 33-35, 41-44 (T11: le immagini di `file1` bastano, `file3` no), 47 (T13), 49-51 |
| 8 | Forma esatta della formula di Carson e definizione di `\beta` nelle fonti | **NON TROVATO a immagine** (solo testo estratto) |
| 9 | ~~Simbolo del tempo di attesa in TDMA~~ | **CHIUSO in revisione**: i lucidi scrivono `D=w+\tau` con `w_{FD}=0` e `w_{TD}=\frac{T}{2}(1-\frac1M)`, quindi il simbolo del docente è `w` (l'azione è T17-1). Resta NON TROVATO il solo simbolo tipografico di `file3` p. 31, che è un'immagine |

---

## 9. Riepilogo

- **Che cosa ho confrontato:** le 18 dimostrazioni (116 passi, 39 figure) con `file1` (27 pagine lette come immagine), `file3` (10 pagine), i lucidi `AccessoMultiplo.pdf` e `ComElettriche.pdf` aperti sul sito del corso, e i documenti R1-R3, CONTRACTS, DIDATTICA, NOTAZIONE.
- **Errori di matematica trovati nelle dimostrazioni: nessuno.** Tutte le formule finali tornano (ricalcolate a mano e, dove serve, numericamente). Un errore di segno c'è, ma è **nella fonte studentesca** (`file1` p. 29) e il documento dice come non copiarlo.
- **Difetti veri:** 5 figure orfane e 1 ripetuta, 2 passi senza formula né figura, 36 varianti di buchi non digitabili, 1 stringa che cita numeri di passo, e soprattutto **due dimostrazioni incomplete** (T6) o **incomplete sul punto decisivo** (T11). La formula di T16, invece, **coincide** con quella dei lucidi: nessuna divergenza da correggere.
- **Conferme nuove dai lucidi del docente:** T15 (massimi `1/(2e)` e `1/e`; `\lambda_t=\lambda+\lambda_r`), T17 («TDMA strutturalmente superiore a FDMA»; `D=w+\tau` con `w_{TD}=\frac{T}{2}(1-\frac1M)`), T16 (formula identica a quella del sito). **NON TROVATO:** le tabelle numeriche delle figure dei lucidi, che sono immagini.
- **Il libro del docente resta NON TROVATO:** nessuna affermazione di questo documento gli è attribuita.
