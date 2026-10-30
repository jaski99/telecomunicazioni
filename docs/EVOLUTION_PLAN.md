# Evoluzione da manuale e figure passo per passo — Round E

Motivo: dopo il Round D il sito è leggibile, ma non è ancora un **manuale**. L'utente vuole grafica e UX da manuale o da enciclopedia coinvolgente, dimostrazioni spiegate passo per passo e soprattutto **grafici che si costruiscono passo per passo**. Le basi sono tre ricerche già su `main`: [R4](research/R4-design-manuali.md) (design dei manuali, P1-P14), [R5](research/R5-figure-passo-passo.md) (censimento delle figure delle 18 dimostrazioni e modello progressivo) e [R6](research/R6-audit-dimostrazioni.md) (audit didattico delle 18 schede, confrontate con `file1`/`file3` e con i lucidi del docente). Il piano è stato scritto dal coordinatore il 30/10/2026 su `main` `0ef8a4c`. È **vincolante** per i worker E1-E5 e si affianca a [CONTRACTS.md](CONTRACTS.md) e a [REDESIGN_PLAN.md](REDESIGN_PLAN.md): dati, ID, comandi, regole CI e criteri A1-A22 restano validi.

**Vincolo assoluto:** le specifiche e i contenuti didattici in `graph/` restano **invariati**. Fanno eccezione solo:
- (a) le correzioni elencate al §5, ciascuna con la fonte e la pagina che la dimostrano;
- (b) le nuove figure-stato del §4 e il loro aggancio con `passi[].figura`.

Nessun altro campo cambia. Restano fuori `docs/CONTRACTS.md` e gli schemi in `schema/`. Per `graph/graph.json`, `graph/quiz.json`, `web/graph.json`, `web/quiz.json`, `docs/PIANO_STUDIO.md` e `docs/MAPPA_ESAME.md` vale una regola sola: si **rigenerano** e non si modificano mai a mano. Un conflitto su questi file si risolve rigenerando da `main`.

## 1. Punto di partenza (audit sintetico)

| # | Difetto | Fonte | Causa |
|---|---|---|---|
| M1 | Le figure dei passi sono «istantanee scollegate»: 116 passi, 35 con figura, solo 5 coppie consecutive con figura e **0** con assi identici | R4 §4.2, R5 | Ogni figura è disegnata da sola e il passo successivo non riparte da quella precedente |
| M2 | Il renderer `grafico` allarga gli assi dichiarati quando i punti escono dai limiti (`estensione()` in `web/js/figure/grafico.js`). Il colore delle serie dipende dalla posizione nell'elenco (`PALETTE[si]`). | R5, lettura del codice | La scala e i colori non sono stabili da uno stato al successivo |
| M3 | Manca un registro da manuale: non ci sono un box «da ricordare», una tassonomia dei blocchi, numeri di figura, un indice del nodo, una copertina di capitolo, la navigazione sequenziale né il foglio di stampa | R4 §5-§7 (P2-P14) | Il Round D ha costruito il design system ma non il registro editoriale |
| M4 | Nelle schede: 5 figure orfane in 4 file, 1 figura ripetuta, 2 passi senza formula né figura; delle 142 varianti a buchi, 36 non sono digitabili (27 con `$` o `\`, 9 con sole `_`/`^`) | R6 §3.2 | Scrittura dei contenuti nel Round C |
| M5 | Ci sono errori di aggancio e di testo emersi da R5: Dirac p2, Poisson p1, risposta impulsiva p1 e il pilota del campionamento | §5.2 | Vedi §5.2 |
| M6 | Residui noti del Round D | §6 | Vedi §6 |

## 2. Design da manuale (specifica)

Si estendono i token di `web/css/tokens.css`, senza sostituirli. La regola del Round D resta valida: niente px o rem sciolti fuori da `tokens.css` (salvo `0`, `1px` dei bordi e `100%`).

### 2.1 Token nuovi (owner E1)

| Token | Valore | Uso |
|---|---|---|
| `--margin-col` | `220px` | colonna delle note a margine da 1200 px in su |
| `--measure-wide` | `82ch` | larghezza di figure e tabelle (la prosa resta a `--measure`) |
| `--fs-lead` | un gradino sopra `--fs-body` | frase d'apertura di nodo e capitolo |
| `--fs-caption` | `0.9375rem` | didascalie numerate |
| `--fs-num` | come `--fs-small`, cifre tabellari | numeri di passo, figura e sezione |
| `--figure-max` | larghezza massima delle figure | tetto unico per tutte le pagine |
| `--rule` | `1px solid` sul colore del bordo | filetti editoriali |
| colori semantici `--c-idea`, `--c-def`, `--c-example`, `--c-attenzione`, `--c-errore`, `--c-verifica` (ognuno con `-bg`) | contrasto ≥ 4.5:1 sul proprio sfondo (A9) | tassonomia del §2.2 |

### 2.2 Tassonomia dei blocchi (classi pubbliche in `components.css`, owner E1)

| Classe | Ruolo | Dove compare |
|---|---|---|
| `.chiave` | «Da ricordare»: una frase e al massimo una formula | nodo (prima riga di `in_breve` o `formule_chiave[0]`), dimostrazione (`idea`) |
| `.definizione` | definizione formale | nodo |
| `.esempio` | worked example | nodo, esercizi |
| `.scenario` | apertura narrativa (dove serve) | copertina di capitolo |
| `.analogia` | analogia dichiarata come tale | nodo |
| `.attenzione` | ipotesi o trappola | dimostrazione (ipotesi), nodo |
| `.errore` | errore frequente | nodo, dimostrazione |
| `.verifica` e `.verifica-domanda` | autoverifica e checkpoint | fine sezione, quiz |

C'è **una sola** `.formula-gruppo`, in `components.css`: le copie in `pages/nodo.css` e `pages/esercizi.css` si eliminano (§6, R-3). I blocchi usano solo i dati che già esistono: nessun testo nuovo nei contenuti.

### 2.3 Pattern di pagina (R4 §5.3)

| Pagina | Pattern | Owner |
|---|---|---|
| Home | mappa a 7 capitoli; per ciascuno titolo, numero di nodi, dimostrazioni e prove in `<details>` chiusi; «Riprendi da qui» dallo `store` | E1 |
| Copertina di capitolo `#/area/<n>` (rotta nuova) | titolo, `--fs-lead` dall'area, elenco ordinato dei nodi, dimostrazioni e criteri presi da `saper_fare` (≥ 3 in totale, 0 testo inventato) | E1 |
| Nodo | sezioni numerate (`1.`, `2.`, …), indice in testa, `.chiave` in apertura, figure numerate «Figura n.m», note a margine da 1200 px in su, ancore `?sezione=` | E1 |
| Dimostrazione | i 4 innesti di R4 (`.chiave` dall'`idea`, figure progressive, numeri di figura, fine pagina con «prossima dimostrazione»), più `?passo=n` e note a margine | E2 |
| Esercizi, ripasso, fonti, grafo | i blocchi del §2.2, nessun cambiamento di contenuto | E1 |
| Quiz | checkpoint per capitolo con `?area=` | E1 |
| Tutte | navigazione sequenziale «precedente/successivo» nell'ordine del piano di studio (`web/js/layout/sequenza.js`); un solo modulo indice (`web/js/layout/indice.js`) usato da nodo e dimostrazione | E1 (moduli), E2 (uso nella dimostrazione) |
| Stampa | `web/css/print.css` con `@media print`: tutte le sezioni aperte via markup (attributo `open` impostato dal JS prima di `window.print`, oppure regole senza `!important`), nessuna navigazione, URL dei link stampati | E1 |

`prefers-reduced-motion: reduce` disattiva ogni transizione. Non ci sono animazioni oltre i 600 ms.

## 3. Dimostrazioni passo per passo (regole di granularità)

Valgono per tutte le 18 schede e sono le regole G-1…G-6 di R6 §5.1, che si recepiscono così come sono:
1. Un passo è **una idea**, con **una formula o una figura** (G-3). Una scheda ha al massimo 12 passi (R6 §6 punto 8).
2. Il `perche` di ogni passo ha almeno 40 caratteri (T6: almeno 60).
3. Passi, `compatta`, `a_voce` (da 300 a 1500 caratteri) e `a_buchi` si aggiornano **nello stesso commit** (G-5). Nessun campo cita passi che non esistono.
4. Le soluzioni a buchi sono digitabili: niente `$`, `\`, `^` o `_` (G-1). Una risposta che è una formula lunga non è un buco: va tolta o trasformata in richiamo attivo.
5. Ogni figura è agganciata al passo che illustra: 0 orfane e 0 ripetute (G-2).
6. I lucidi del docente si citano come `LUCIDI_CASONI` dove R6 li ha aperti (G-4: T15, T16, T17). Ogni dimostrazione ha almeno 2 `collegamenti` a nodi esistenti (G-6).

## 4. Figure progressive: modello dati retrocompatibile

**Decisione:** niente campi nuovi e nessuna modifica a `schema/` o a CONTRACTS. Si adotta il modello di R5, «stati espliciti, non nuovi campi»: ogni stato è una **figura autonoma** in `figure[]`, puntata dal campo che esiste già, `passi[n].figura`. Il campo `stati[]` di R4 è vietato senza l'ok del coordinatore. Lo stesso vale per i «pannelli» (R6 T11-7): i quattro pannelli diventano quattro figure-stato su passi consecutivi.

### 4.1 Regole dei dati (owner dei contenuti: E3, E4, E5)

Una **catena progressiva** è una sequenza di passi consecutivi `n, n+1, …` le cui figure soddisfano tutte le condizioni seguenti.
- **S1, stesso tipo:** tutte le figure hanno lo stesso `tipo`.
- **S2, assi identici:**
  - `grafico`: `asse_x` e `asse_y` sono uguali in modo profondo (`etichetta`, `min`, `max`, `tacche`);
  - `temporale`: sono identici `asse_t` e `corsie`;
  - `blocchi`: le `colonna` e `riga` dei blocchi comuni non cambiano.
- **S3, inclusione:** lo stato `k` contiene lo stato `k-1`.
  - `grafico`: ogni serie di `k-1` compare **identica** (`stile`, `punti`, `etichetta`) e **nello stesso ordine in testa** all'elenco di `k`. Le serie nuove vanno in coda, così il colore per indice resta stabile. Le annotazioni di `k-1` sono un sottoinsieme di quelle di `k`.
  - `blocchi`: i blocchi (per `id`) e i collegamenti di `k-1` sono un sottoinsieme di quelli di `k`.
  - `temporale`: `intervalli`, `frecce` e `marcatori` di `k-1` sono un sottoinsieme di quelli di `k`.
- **S4, crescita:** lo stato `k` aggiunge almeno un elemento (serie, annotazione, blocco, collegamento, intervallo, freccia o marcatore).
- **S5, punti entro gli assi:** tutti i punti stanno dentro `[min, max]` degli assi dichiarati, così il renderer non deve allargare la scala.
- **S6, nessuna anticipazione:** nessuno stato mostra un risultato che il testo non ha ancora introdotto. La figura finale non compare nelle «Figure generali» (che con 0 orfane restano vuote).
- **S7, descrizione autosufficiente:** la `descrizione` di ogni stato dice che cosa è **nuovo** rispetto al passo precedente, in prosa, senza Unicode matematico (R6 §6 punto 12).
- **S8, ID:** gli `id` delle figure-stato sono nuovi e descrittivi (per esempio `spettro-e-repliche` → `spettro-solo-centrale`, `spettro-e-repliche`, `spettro-repliche-filtro`). Gli `id` esistenti non si rinominano se sono già agganciati; si possono rinominare solo quelli orfani, nello stesso commit dell'aggancio.

**Retrocompatibilità:** una figura-stato è una figura come le altre e passa lo schema attuale. Un renderer che ignora le catene la mostra comunque correttamente al suo passo.

### 4.2 Rendering e UX (owner E2)

- **Pattern A** (obbligatorio): modulo puro `web/js/figure/progressione.js`, con `progressione(prec, corr)` → `{ compatibile, nuovi }`. Applica le regole S1-S4 e restituisce gli indici o gli id degli elementi nuovi. Nella dimostrazione, se il passo precedente ha una figura compatibile:
  - gli elementi ereditati si disegnano attenuati (opacità da token);
  - i nuovi si disegnano pieni, con `data-nuovo="true"`;
  - la didascalia è «Figura n.m — nuovo in questo passo: …», dove l'elenco viene dalle etichette, mai inventato.
- **Scala stabile:** in `grafico.js` la scala usa **solo** gli assi dichiarati e i punti fuori scala vengono ritagliati con `clipPath`, senza allargare. La regola S5 rende il ritaglio un caso limite, coperto da test.
- **Pattern B** (obbligatorio, solo UI): il pulsante «Confronta con il passo precedente» mostra i due stati affiancati da 768 px in su e uno sotto l'altro sotto i 768 px. Il pulsante non compare se il passo precedente non ha una figura compatibile.
- **Pattern C** (facoltativo): una transizione CSS ≤ 600 ms sugli elementi `data-nuovo`, disattivata con `prefers-reduced-motion`.
- **Testo delle figure:** ≥ 11 px resi a 360/390 (A10 invariato). Nelle figure a blocchi le parole non si spezzano: se un'etichetta non entra, il blocco si allarga o l'etichetta va a capo **fra parole** (§6, R-4).
- **Accessibilità:** ogni SVG ha `role="img"` e `aria-label` dalla `descrizione`. Il confronto è raggiungibile da tastiera.

### 4.3 Pilota e copertura minima (vedi §7, B1-B3)

Le catene pilota, in ordine di valore didattico secondo R5, sono:
- campionamento, passi 2-5: spettro centrale → repliche → caso di aliasing → filtro di ricostruzione;
- PAM: righe, poi continuo, poi sovrapposizione (T5-5);
- ALOHA: curva puro → curva slotted → massimi annotati;
- conversione A/D: catena a blocchi che si allunga blocco per blocco;
- nascita-morte: catena degli stati con i tagli;
- TDMA/FDMA: corsie temporali che si riempiono.

Il JSON pilota di R5 per il campionamento usa `ωm=2`, `ωs=6` e **non si copia così com'è**: al passo 2 mostra solo lo spettro centrale, ma la formula del passo 2 è già la ripetizione periodica (correzione C-4, §5.2).

## 5. Correzioni ai passi (le uniche modifiche di contenuto ammesse)

### 5.1 Da R6 (si applicano con gli ID e i criteri di R6 §3.1 e §5)

| Scheda | ID R6 | Fonte e pagina (come in R6) | Worker |
|---|---|---|---|
| T1 teorema-campionamento | T1-1 … T1-7 (formula al passo 3, nuovo passo sull'aliasing, agganci) | `file1` pp. 7-10 (p. 9 come immagine); `file3` pp. 1-2 | E3 |
| T2 impulso-dirac-trasformata | T2-1 … T2-3 (parità dell'impulso dichiarata) | `file1` p. 11 come immagine, p. 12 | E3 |
| T3 filtro-trasversale | T3-1 … T3-6 (spezzare il passo 4, schema del prof, formula al passo 7) | `file1` p. 15 come immagine; `file3` p. 32; NOTAZIONE §A4 | E3 |
| T4 risposta-impulsiva-h | T4-1 … T4-4 (frase monca, limite isolato `h(t)=\lim_{\Delta\to0}y(t)` senza divisione per `\Delta`, didascalia) | `file1` pp. 17-18 come immagine | E3 |
| **T5 pam-due-spettri (10 punti)** | T5-1 … T5-7 (media `1/(2N+1)`, limite della finestra, serie di `{C_k}`, figura `spettro-pam-totale`, controllo di potenza, stringa «passi 6-9») | `file1` pp. 19-22 come immagine; `file3` p. 13; NOTAZIONE §A2 | E3 |
| **T6 spettri-modulazione-prodotto** | T6-1 … T6-7 (riscrittura in 10 passi con `V(\omega)` e `\varphi(\omega)`; **non** copiare il segno sbagliato di `file1` p. 29: in `s_i` va `+\varphi`) | `file1` pp. 28-29 come immagine; NOTAZIONE riga 22 | E4 (prima di T10) |
| T7 conversione-ad | T7-1 … T7-7 (`f_0=1/T\ge2f_m`, intervallo `(-M,M)`, quantizzazione irreversibile, segnale numerico) | `file1` p. 32 come immagine | E4 |
| T8 conversione-da | T8-1 … T8-6 (rete equalizzatrice `1/G(\omega)`, `\varepsilon=x_r-x`, `\tau\ll T`) | `file1` pp. 35-36 come immagine; `file3` p. 10 | E4 |
| T9 pm-fm-trasformazione (P3) | T9-1 … T9-4 (ipotesi di linearità dichiarata, ricostruzione) | nessuna pagina: `RICOSTRUZIONE` | E4 |
| T10 qam-errore-fase | T10-1 … T10-6 (fattore 2, lettura vettoriale, figura della rotazione, numeri `0,9848`/`0,1736`/`-15,1 dB`) | `file1` p. 40 come immagine; `file3` p. 24 | E4 (dopo T6) |
| **T11 quadripoli (10 punti)** | T11-1 … T11-8 (realizzabilità `H_0(-\omega)\neq H_0^*(\omega)`, condizione con `\beta(\omega)=-\arg H(\omega)`, fusione dei passi 5 e 7, quattro pannelli come figure-stato del §4) | `file1` pp. 42-44 come immagine (p. 44: «β(ω) = − arg H(ω)») | E4 |
| Carson (P3) | C-1 … C-6 (`\beta`, figura agganciata, numero: Carson 6 kHz) | `file1` p. 41 e `file3` p. 28 solo testo estratto: la forma esatta della formula resta da verificare | E4 |
| T12 sliding-window | T12-1 … T12-6 (figura del regime insufficiente, `2IC`, esempio `0,76`/`0,95`) | `file1` pp. 49-50 e `file3` pp. 29-30 come immagine | E5 |
| T13 poisson-tempo-residuo | T13-1 … T13-5 (assenza di memoria, paradosso, numeri `0,6065`/`2 ms`) | `file1` p. 53 come immagine | E5 |
| T14 nascita-morte | T14-1 … T14-6 (equilibrio esplicito `dp_k/dt=0`, taglio, numeri `(0,25;0,5;0,25)`) | `file1` pp. 54-55 e `file3` p. 48 come immagine | E5 |
| T15 aloha | T15-1 … T15-6 (massimi `0,1839` e `0,3679`, `\lambda_t=\lambda+\lambda_r`, fonte `LUCIDI_CASONI`) | `file1` pp. 45-46; `file3` p. 20; `AccessoMultiplo.pdf` (lucidi del docente) | E5 |
| T16 csma-cd | T16-1 … T16-5 (precisazione su `1/(2a)` citando i lucidi, contesto del protocollo, `verifica` aggiornata; l'asse esteso è IPOTESI; **nessun valore numerico attribuito ai lucidi**, perché le loro Figure 1 e 4 sono solo immagini) | `file1` p. 47; `file3` p. 22; `AccessoMultiplo.pdf` | E5 |
| T17 ritardo-tdma-fdma | T17-1 … T17-7 (simbolo `w` al posto di `\omega`, `D=w+\tau`, conclusione «TDMA strutturalmente superiore a FDMA dal punto di vista del ritardo», numeri `1 s`/`0,625 s`) | `file1` p. 48; `file3` p. 31; `AccessoMultiplo.pdf` | E5 |

I controlli numerici sono quelli di R6 §7.3 e diventano asserzioni nei test di area (§7, B6).

### 5.2 Correzioni emerse da R5 (verificate dal coordinatore sulle fonti)

| # | Scheda e passo | Oggi | Correzione | Fonte | Worker |
|---|---|---|---|---|---|
| C-1 | `dim-impulso-dirac-trasformata`, passo 2 | Il testo dice «l'impulso seleziona un intorno **destro** di `a`», ma la formula integra `x(a-t)` per `t\in[0,\Delta]`, cioè valuta `x` su `[a-\Delta,a]` | «intorno **sinistro** di `a`, l'intervallo `[a-\Delta,a]`». La formula non cambia | `file1` p. 11 (catena `\lim\int x(a-t)D(t,\Delta)dt=\lim\frac1\Delta\int_0^\Delta x(a-t)dt=x(a)`) | E3 |
| C-2 | `dim-risposta-impulsiva-h`, passo 1 | Il passo sollecita `Q` con `D(t,\Delta)`, ma è agganciato alla figura `quadripolo-ingresso-generico` (ingresso `x(t)`, uscita convoluzione) | Nuova figura `blocchi` `quadripolo-ingresso-d` con `D(t,\Delta)` → `Q` → `y(t)`, agganciata al passo 1; `quadripolo-ingresso-generico` resta al passo dell'ingresso generico | `file1` p. 17 («Sollecitiamo a tal fine la rete con un impulso, come mostrato in figura»; «`h(t)=\lim_{\Delta\to0}y(t)`») | E3 |
| C-3 | `dim-poisson-tempo-residuo`, passo 1 | Il passo ricava la **sopravvivenza** `P(X>t)=e^{-\lambda t}`, ma la figura `poisson-distribuzione-residuo` è una **funzione di ripartizione** del tempo residuo | Al passo 1 va una figura della sopravvivenza `e^{-\lambda t}`, sugli stessi assi della CDF; la CDF passa al passo in cui si ricava `F(\delta)=1-e^{-\lambda\delta}`, come catena progressiva (sopravvivenza → CDF) | `file1` p. 53 (`F(\delta)=P(t\le t_0+\delta\mid t>t_0)=1-e^{-\lambda\delta}`, «priva di memoria») | E5 |
| C-4 | pilota campionamento (R5), passo 2 | Il JSON di R5 mostra al passo 2 solo lo spettro centrale | Il passo 2 enuncia `X_s(\omega)=\frac1T\sum_k X(\omega+k\omega_s)` e quindi mostra spettro centrale **più repliche**. Lo spettro centrale da solo va al passo 1 (o al primo stato della catena) | `file1` pp. 7-10; formula del passo 2 nel JSON attuale | E3 |

## 6. Residui noti da chiudere

| # | Residuo | Dove | Owner | Criterio |
|---|---|---|---|---|
| R-1 | Punteggiatura orfana a inizio riga dopo una formula inline | campionamento 360, qam-errore-fase 360, spettri-modulazione-prodotto 360, poisson-tempo-residuo 768, filtro-trasversale 1440, quadripoli-passa-basso 1440 | E2 (`math.js`: formula inline e punteggiatura che la segue in un solo contenitore `white-space: nowrap`) | B9 |
| R-2 | I moduli `web/js/pages/dim/*.js` sono fuori dalla precache di `web/build.sh`; oggi li copre l'hack `web/js/pages/dim/cache.js` | `build.sh`, `sw.js`, `pages/dim/cache.js` | E1 (precache generata da glob di `js/**` e `css/**`), E2 (rimozione di `cache.js` e `dim-cache.test.js` dopo il merge di E1) | B10 |
| R-3 | `.formula-gruppo` duplicata | `web/css/pages/nodo.css:146`, `web/css/pages/esercizi.css:34` | E1 | B11 |
| R-4 | Parole spezzate nelle etichette delle figure a blocchi | `web/js/figure/blocchi-layout.js`, `blocchi-forme.js` | E2 | B12 |
| R-5 | R6 §7.3 cita il percorso `/home/user/work/pages/` della sandbox di R6, che non esiste altrove | R6 | nessuno: i worker leggono le pagine come immagini dai PDF allegati in chat | — |

## 7. Difetti di R4 e R5 da NON seguire

1. **R4 P6, riga 671:** il residuo di bozza «≥ 1 criterio per nodo? no —» non è un criterio. Vale solo «≥ 3 criteri totali presi da `saper_fare` e 0 testo inventato».
2. **R4 riga 591:** il mockup di stampa con `.step__corpo { display: block !important; }` contraddice il §8 di R4 stesso. In `print.css` non si usa `!important`: le sezioni si aprono via markup (§2.3).
3. **R4 righe 58 e 792:** il link a *Think DSP* in `http://` (`http://greenteapress.com/thinkdsp/html/thinkdsp002.html`) non si porta nel sito. Nel sito vanno solo URL della allowlist di CONTRACTS §5, e mai URL non verificati.
4. **R4 Pattern A (serie precedente ritrasformata in «tratteggio»):** non si cambia lo `stile` delle serie ereditate, perché romperebbe S3 e la stabilità della legenda. L'attenuazione la fa il renderer (§4.2). Il criterio P1 di R4 basato su `stroke-dasharray` diventa B4 (`data-nuovo`).
5. **R4 P1, «nessuna modifica al renderer»:** è smentito dal codice (M2), quindi il renderer va cambiato (§4.2).
6. **R5, pilota del campionamento, passo 2:** non si copia (C-4).
7. **R5, ALOHA con più figure per passo:** non si introduce un contratto nuovo. Si usano catene di stati su passi consecutivi.
8. **R4 `stati[]`** e **R6 «pannelli»:** vietati senza l'ok del coordinatore (§4).

**Cosa NON fare (tutti):** valgono R6 §6 (12 punti) e R4 §8. In particolare:
- niente punteggi oltre ai 10 di T5 e T11;
- niente attribuzioni al libro (Calandrino-Immovilli non è stato consultato) e niente `verificata_testo_prof`;
- nessuna figura copiata dai PDF;
- niente `\omega` per indicare un tempo;
- niente Unicode matematico in prosa;
- nessun `id` rinominato;
- nessuna modifica a CONTRACTS o agli schemi;
- nessun indice duplicato: c'è un solo `web/js/layout/indice.js`.

## 8. Criteri di accettazione misurabili e test (tutti obbligatori)

I criteri A1-A22 di REDESIGN_PLAN §9 restano in vigore e i loro test non si indeboliscono. I criteri nuovi sono:

| ID | Criterio | Soglia | Test | Owner |
|---|---|---|---|---|
| B1 | Catene pilota del §4.3 | campionamento ≥ 4 stati; PAM, ALOHA, A/D, nascita-morte e TDMA/FDMA ≥ 3 stati; tutti conformi a S1-S6 | `tests/test_contenuti_w3.py`, `w4`, `w5` (ciascuno per le proprie schede) | E3, E4, E5 |
| B2 | Copertura | ≥ 14 dimostrazioni su 18 con almeno una coppia progressiva; le eccezioni vanno nel report con il motivo | test di area più controllo di integrazione del coordinatore | E3-E5 |
| B3 | Struttura (script di R6 §7.3) | tutte le 18 righe `OK`: 0 orfane, 0 ripetute, 0 passi senza formula né figura, `perche` ≥ 40, 0 buchi non digitabili, `a_voce` da 300 a 1500, numerazione consecutiva | asserzione nei test di area | E3-E5 |
| B4 | Rendering progressivo | sul passo 4 del campionamento: ≥ 1 elemento `[data-nuovo="true"]`, elementi ereditati con opacità < 1, didascalia con «nuovo in questo passo» | `web/tests/test_e2e_figure_progressive.py` | E2 |
| B5 | Scala stabile | due stati consecutivi di una catena hanno lo stesso `viewBox` e le stesse posizioni in pixel delle tacche; punti fuori scala ritagliati | `web/tests/progressione.test.js`, `figure.test.js` | E2 |
| B6 | Numeri di R6 §7.3 | T1 `50 Hz`; T5 `1`; T6 `0,054`/`0,837`; T7 `b=8`, `R_b=64k`; T8 `125≈42 dB`; T10 `0,9848`/`0,1736`/`-15,1 dB`; T12 `0,76`/`0,95`; T13 `0,6065`/`2 ms`; T14 `(0,25;0,5;0,25)`; T15 `0,1839`/`0,3679`; T16 `S(0)=1`, `S(0,5;N=2)=0,5`; T17 `1 s`/`0,625 s`; Carson `6 kHz` | test di area | E3-E5 |
| B7 | Invarianza | per ogni dimostrazione, `id`, `domande_esame`, `enunciato` e i campi non citati dal §5 sono uguali a `main` `0ef8a4c`. Snapshot in `tests/fixtures/invarianti_<area>.json`, generato una volta da `0ef8a4c`; le eccezioni sono elencate per ID di correzione. Fuori da `graph/dimostrazioni/` ci sono 0 diff in `graph/` (salvo i file generati) | test di area più `git diff --stat origin/main -- graph/` nel report | E3-E5 |
| B8 | Overflow orizzontale | `scrollWidth ≤ clientWidth` su tutte le rotte (comprese `#/area/<n>` e le 18 dimostrazioni con `?passo=`) a 360, 390, 768 e 1440 | `test_e2e_layout.py` | E1 (rotte), E2 (dimostrazioni) |
| B9 | Punteggiatura | 0 righe che iniziano con `,`, `.`, `;`, `:` o `)` dopo una formula, sulle 6 dimostrazioni di R-1 alle 4 larghezze | `test_e2e_formule.py` | E2 |
| B10 | Precache | ogni file servito sotto `web/js/**` e `web/css/**` è nella precache generata; `pages/dim/cache.js` non esiste più | `pages.test.js` (E1, lista generata) e `test_e2e_shell.py` (avvio offline) | E1, E2 |
| B11 | CSS unico | `.formula-gruppo` è definita solo in `components.css` | `ui.test.js` | E1 |
| B12 | Parole intere | nelle figure a blocchi nessun `<tspan>` termina o inizia a metà parola (confronto con le parole dell'etichetta) | `figure.test.js` | E2 |
| B13 | Manuale | `.chiave` presente su nodo e dimostrazione; indice del nodo con ≥ 2 voci e ancore funzionanti; figure numerate «Figura n.m» in ordine; `#/area/1…7` risponde con ≥ 3 criteri da `saper_fare`; «precedente/successivo» coerenti con l'ordine del piano di studio; `?passo=n` apre il passo n | `test_e2e_manuale.py` (E1), `test_e2e_dim.py` (E2) | E1, E2 |
| B14 | Stampa | con `page.emulate_media(media="print")` tutte le sezioni sono visibili e la nav è nascosta; 0 `!important` in `web/css/**` | `test_e2e_stampa.py`, `ui.test.js` | E1 |
| B15 | Movimento | con `reducedMotion="reduce"` la durata delle transizioni calcolata è 0 | `test_e2e_figure_progressive.py` | E2 |
| B16 | Suite | `pytest -q` (e2e Playwright con **Chromium reale**) e `npm test --prefix web` con 0 failed e 0 skipped; 0 `skip`/`skipif`/`xfail`/`.only`/`{ only: true }`/`todo` nel repository; 0 errori JS in console | CI «CI e Pages» verde | tutti |

## 9. Worker, file esclusivi, ordine

| Worker | Scope (file che può toccare: tutto il resto è in sola lettura) | Dipende da |
|---|---|---|
| **E1** registro da manuale e shell | `web/index.html`, `web/css/tokens.css`, `base.css`, `layout.css`, `components.css`, nuovo `web/css/print.css`, `web/js/app.js`, `web/js/router.js` (rotta `#/area/<n>`, `?sezione=`), `web/js/ui.js`, `web/js/core/store.js` (solo «riprendi da qui»), `web/js/layout/**` (nuovi `sequenza.js` e `indice.js`), `web/js/pages/{home,grafo,nodo,esercizi,quiz,ripasso,fonti}.js`, nuovi `web/js/pages/area.js` e `web/js/pages/nodo/**`, `web/modules/quiz/**`, `web/css/pages/{home,grafo,nodo,esercizi,quiz,ripasso,fonti}.css`, nuovo `web/css/pages/area.css`, `web/sw.js`, `web/build.sh` (precache da glob), test `web/tests/{ui,layout,router,store,pages,quiz}.test.js`, nuovi `sequenza.test.js` e `indice.test.js`, `web/tests/e2e_helpers.py`, `conftest.py`, `test_e2e.py`, `test_e2e_shell.py`, `test_e2e_quiz.py`, `test_e2e_layout.py`, nuovi `test_e2e_manuale.py` e `test_e2e_stampa.py`. Criteri: §2, §2.3 (tranne la riga della dimostrazione), R-2 (parte di E1), R-3, B8 (rotte), B10, B11, B13, B14 | — |
| **E2** figure progressive, formule, pagina dimostrazione | `web/js/figure/**` (nuovo `progressione.js`), `web/css/figure.css`, `web/js/core/math.js`, `web/css/math.css`, `web/js/pages/dimostrazione.js`, `web/js/pages/dim/**` (rimozione di `cache.js`), `web/css/pages/dimostrazione.css`, `web/tests/{figure,math,latex}.test.js`, `web/tests/dim-*.test.js` (rimozione di `dim-cache.test.js`), nuovo `web/tests/progressione.test.js`, `test_e2e_dim.py`, `test_e2e_formule.py`, nuovo `test_e2e_figure_progressive.py`. Criteri: §4.2, la riga della dimostrazione del §2.3 (usa `layout/indice.js` e `sequenza.js` di E1), R-1, R-2 (parte di E2), R-4, B4, B5, B8 (dimostrazioni), B9, B12, B13 (dimostrazione), B15 | parte subito su figure e formule; `git merge origin/main` dopo E1 per i moduli condivisi e la precache |
| **E3** contenuti aree 1-3 | `graph/dimostrazioni/` di `dim-teorema-campionamento`, `dim-impulso-dirac-trasformata`, `dim-filtro-trasversale`, `dim-risposta-impulsiva-h`, `dim-pam-due-spettri`; `tests/test_contenuti_w3.py`; nuovo `tests/fixtures/invarianti_w3.json`. Correzioni T1-T5, C-1, C-2, C-4; catene campionamento e PAM; B1-B3, B6, B7 per le proprie schede | — (parte subito) |
| **E4** contenuti aree 4-5 | `graph/dimostrazioni/` di `dim-conversione-ad`, `dim-conversione-da`, `dim-spettri-modulazione-prodotto`, `dim-modulazione-prodotto-qam-errore-fase`, `dim-quadripoli-passa-basso-equivalente`, `dim-pm-fm-trasformazione`, `dim-formula-carson`; `tests/test_contenuti_w4.py`; nuovo `tests/fixtures/invarianti_w4.json`. Correzioni T6 (**prima di T10**), T7-T11, Carson; catena A/D; B1-B3, B6, B7 | — (parte subito) |
| **E5** contenuti aree 6-7 | `graph/dimostrazioni/` di `dim-aloha-throughput`, `dim-csma-cd-throughput`, `dim-ritardo-tdma-fdma`, `dim-sliding-window-efficienza`, `dim-poisson-tempo-residuo`, `dim-nascita-morte-equilibrio`; `tests/test_contenuti_w5.py`; nuovo `tests/fixtures/invarianti_w5.json`. Correzioni T12-T17, C-3; catene ALOHA, nascita-morte e TDMA/FDMA; B1-B3, B6, B7 | — (parte subito) |

La verifica delle regole S1-S5 nei test Python di area è una funzione di poche righe in ciascun file di area. È una duplicazione tollerata per rispettare l'esclusività; il coordinatore la unifica in integrazione, se serve. I file generati li rigenera ogni worker sul proprio ramo (`python scripts/kg.py build`) e non li modifica mai a mano.

**Allegati in chat** (mai nel repo): E3, E4 ed E5 ricevono `file1.pdf` e `file3.pdf` e leggono le pagine come immagini; i lucidi `AccessoMultiplo.pdf` sono raggiungibili dal materiale didattico in allowlist. E1 ed E2 non ricevono allegati.

**Ordine di avvio e merge:** tutti e cinque partono subito in parallelo (gli scope sono disgiunti). Il merge avviene nell'ordine **E1 → E2 → E3 → E4 → E5**:
- E2 fa `git merge origin/main` dopo il merge di E1;
- prima del report finale, ogni worker di contenuto fa `git merge origin/main` e rigenera i file generati.

Segue l'integrazione:
- controllo B2 globale e script di R6 §7.3 su tutte le 18 schede;
- `pytest -q` e `npm test --prefix web` completi;
- CI verde;
- controllo visivo del coordinatore sul sito pubblicato a 390 e 1440.

**Comandi** (dalla radice): `python scripts/kg.py check`, `python scripts/kg.py build`, `sh web/build.sh`, `npm test --prefix web`, `pytest -q` (con `playwright install chromium`).

**Regole per tutti:**
- **Codice:** SOLID, moduli piccoli e coesi (< 150 righe per file JS, < 250 per CSS), basso accoppiamento, interfacce esplicite, test per ogni modulo, nessun codice morto, nessun refactor fuori scope.
- **Test:** vietati `skip`, `skipif`, `xfail`, `.only`, `todo`, `--ignore`, `-k "not …"`, test resi condizionali o soglie abbassate. `pytest -q` e `npm test --prefix web` vanno con 0 failed e 0 skipped, e con 0 errori JS.
- **Repository:** niente PDF né screenshot nel repo; push solo sul proprio ramo di sessione `arena/*`, niente PR (le apre il coordinatore).
- **Report:** deve contenere SHA, numero di test node e pytest **con l'output finale incollato**, l'elenco degli ID di correzione applicati (§5) e l'elenco degli screenshot salvati in `/tmp`.
