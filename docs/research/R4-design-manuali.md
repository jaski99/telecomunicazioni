# R4 — Design di manuali ed enciclopedie: come si spiega matematica e ingegneria in modo coinvolgente

Ricerca del **30 ottobre 2026**, worker **R4** (design di manuali ed enciclopedie). Repo `jaski99/telecomunicazioni`, ramo di sessione `arena/1d9539ae-telecomunicazioni`, commit di partenza `074d1c9` («D4: redesign pagine, QA e2e, rimozione legacy.css»).
**Questo documento è solo ricerca: nessun file di codice e nessun file di `graph/` è stato modificato.** Le proposte qui non cambiano `docs/CONTRACTS.md`, gli schemi, gli ID né i contenuti didattici: cambiano **come** vengono presentati.

Legenda epistemica usata in tutto il file:

- **[FATTO]** = l'ho visto aprendo davvero la pagina indicata (URL in §9), oppure l'ho misurato sul repo con i comandi citati.
- **[IPOTESI]** = mia interpretazione o mia proposta di design, non verificata su un sito né autorizzata dal coordinatore.
- **NON TROVATO** = ho cercato e non ho trovato (paywall, 404, pagina non accessibile dal sandbox).

---

## 1. Sintesi in 10 righe

1. **FATTO:** i siti che spiegano meglio la matematica usano **tre leve insieme**: (a) un'**idea chiave dichiarata subito** (Wikipedia: lead accessibile; Better Explained: «la definizione da cavernicolo prima del DNA»), (b) **un solo concetto per blocco** con ritmo visivo costante (Think DSP, Tufte CSS), (c) **segmentazione interattiva**: si rivela un pezzo per volta e il lettore governa il ritmo (Distill: controllo `Step`; Ciechanowski: play/pausa per figura; 3Blue1Brown: `Check`/`Reveal`).
2. **FATTO:** la **costruzione progressiva del disegno** è il pattern più potente per le dimostrazioni: su Distill ogni pannello porta scritti i suoi parametri («Perplexity: 30, Step: 5.000»), su Ciechanowski ogni figura è una sequenza di stati con slider, su 3Blue1Brown il grafico si «avvolge» passo dopo passo. Il lettore non vede mai il risultato finito prima del ragionamento.
3. **FATTO:** i manuali veri (Lathi, Oppenheim) non si distinguono per la grafica ma per la **densità di esempi svolti dichiarata dall'editore** («over 200 fully worked-through examples», Lathi 5ª ed.) e per la **numerazione capitolo.sezione** con indice analitico.
4. **FATTO:** le enciclopedie di qualità curano **la navigazione laterale e i riferimenti**: Stacks Project dà a ogni risultato un **permalink** (`tag 0001`), MIT OCW una **colonna indice** sempre presente, Wikipedia un **hatnote** («Not to be confused with…») e note numerate.
5. **FATTO:** Tufte/Tufte CSS mostrano l'unica vera alternativa tipografica al nostro layout: **note a margine** al posto delle note a piè di pagina, scala di grigi per il testo, colore riservato alle figure, **due soli livelli di titolo**.
6. **FATTO (audit):** il nostro sito ha già quasi tutti i **dati** di un manuale (`perche_ti_serve`, `scenario`, `analogia`, `riepilogo`, `errori_trappole`, `richiamo_attivo`, `checklist`) ma li presenta come **18 sezioni piatte**, senza numerazione, senza indice interno, senza copertina di capitolo.
7. **FATTO (audit, il punto centrale):** su 18 dimostrazioni e 116 passi, **35 passi hanno una figura** e esistono solo **5 coppie di passi consecutivi entrambi con figura**, **nessuna con assi identici**. Quindi **nessun grafico oggi «si costruisce»**: il disegno appare come istantanea isolata.
8. **FATTO (audit):** **80 passi con formula non hanno figura** e **5 figure della raccolta non sono collegate ad alcun passo** (appaiono solo in fondo): sono il lavoro di contenuti da fare, non un problema di CSS.
9. **FATTO (audit):** la home mostra **69 prove**, di cui **67 con «NON TROVATO»** ripetuto: un manuale curato metterebbe quella tabella in secondo piano e in prima pagina il **percorso per capitoli**.
10. **NON TROVATO:** screenshot Playwright a 390/1440 px: il sandbox non può scaricare i browser (rete in allowlist), quindi le misure di questo report sono **derivate dai token CSS e dal DOM del sito live** (testo renderizzato), non osservate a schermo (§0.2). Haykin e Proakis: nessuna pagina verificata con impaginazione interna.

---

## 2. Metodo, fonti aperte e limiti

### 2.1 Cosa ho letto nel repo (prima della ricerca)

`docs/CONTRACTS.md` (tutto, in particolare §3.4 figure, §9.4 renderer, §10 QA), `docs/DIDATTICA.md`, `docs/REDESIGN_PLAN.md` (§1 difetti, §2 token, §3 formule, §4 figure, §5 pagina dimostrazione, §9 criteri A1–A22), `docs/research/R1`, `R2`, `R3` (sintesi), poi `web/css/tokens.css`, `base.css`, `components.css`, `layout.css`, `figure.css`, `pages/dimostrazione.css`, `pages/nodo.css`, `pages/home.css`, `web/js/router.js`, `web/js/pages/nodo.js`, `home.js`, `grafo.js`, `pages/dim/{index,testata,passi,studio,controlli}.js`, `web/js/figure/index.js`, e 3 dimostrazioni di esempio (`dim-pam-due-spettri`, `dim-teorema-campionamento`, `dim-formula-carson`).

### 2.2 Cosa ho aperto davvero sul web (30 ottobre 2026)

| Fonte | URL aperto | Esito |
|---|---|---|
| Khan Academy — unità «Signals and systems» | https://www.khanacademy.org/science/electrical-engineering/ee-signals | aperto, elenco lezioni |
| Khan Academy — lista unità Fourier series (esiste) | https://www.khanacademy.org/science/electrical-engineering/ee-signals/ee-fourier-series | aperto, solo intestazione (contenuto caricato via JS) |
| Una URL Khan sbagliata (404) | `…/ee-fourier-series/v/ee-fourier-series-intuition` | 404: **non** è una fonte |
| Brilliant — catalogo | https://brilliant.org/courses/ | aperto (catalogo); `…/courses/signals-and-systems/` **redirige** al catalogo: lezione singola **NON TROVATA** (paywall) |
| Distill — saggio | https://distill.pub/2016/misread-tsne/ | aperto |
| Distill — about | https://distill.pub/about/ | aperto |
| 3Blue1Brown — lezione Fourier | https://www.3blue1brown.com/lessons/fourier-transforms | aperto |
| Manim Community | https://www.manim.community/ | aperto |
| Feynman Lectures, Vol. I cap. 1 | https://www.feynmanlectures.caltech.edu/I_01.html | aperto |
| Wikipedia — linea guida Matematica | https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Mathematics | aperto |
| Wikipedia — voce «Fourier transform» | https://en.wikipedia.org/wiki/Fourier_transform | aperto |
| Stacks Project — sezione con tag | https://stacks.math.columbia.edu/tag/0001 | aperto |
| MIT OCW — 6.003 lecture notes | https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/pages/lecture-notes/ | aperto |
| Ciechanowski — «Gears» | https://ciechanow.ski/gears/ | aperto |
| Better Explained | https://betterexplained.com/articles/developing-your-intuition-for-math/ | aperto (la pagina Fourier dà HTTP 500) |
| Tufte CSS | https://edwardtufte.github.io/tufte-css/ | aperto |
| Tufte, *Beautiful Evidence* (pagina prodotto) | https://www.edwardtufte.com/book/beautiful-evidence/ | aperto (solo pagina commerciale, nessuna pagina interna) |
| Lathi–Ding, *Modern Digital and Analog Communication Systems*, 5ª ed. | https://global.oup.com/academic/product/modern-digital-and-analog-communication-9780190686864 | aperto (descrizione + indice) |
| Oppenheim–Willsky–Nawab, *Signals and Systems*, Pearson Int. Ed. | https://www.pearson.com/en-gb/subject-catalog/p/signals-and-systems-pearson-new-international-edition/P200000005151/9781292025902 | aperto (descrizione + indice) |
| Downey, *Think DSP* (libro libero) | https://greenteapress.com/wp/think-dsp/ e http://greenteapress.com/thinkdsp/html/thinkdsp002.html | aperti |
| Haykin, *Communication Systems* | tentata pagina Wiley | **NON TROVATO**: l'URL tentato restituisce un **altro** libro (Ziemer–Tranter). Non cito Haykin. |
| Proakis, *Digital Communications* | — | **NON TROVATO** |
| Sito nostro, live | https://jaski99.github.io/telecomunicazioni/ , `#/nodo/trasformata-fourier`, `#/dim/dim-teorema-campionamento`, `#/quiz` | aperti, testo renderizzato letto |

### 2.3 Limite dichiarato: niente screenshot né misure in pixel [FATTO]

Il compito chiedeva un audit a 390 e 1440 px con Playwright, salvando screenshot in `/tmp`. **Non è stato possibile.** Ho installato Playwright in una venv (`/tmp/pwenv`), ma il download dei browser è bloccato dalla rete in allowlist del sandbox:

```
Failed to install browsers
Error: Failed to download Chrome for Testing 156.0.8078.4 (playwright chromium v1248),
caused by: Error: Download failure, code=1
```

Nessun Chromium/Firefox di sistema è presente (`which chromium chromium-browser google-chrome firefox` → vuoto). Quindi:

- **NON TROVATO:** screenshot a 390×844 e 1440×900, misure di `scrollWidth`, bbox, contrasto effettivo, tap target.
- **FATTO:** lettura del **testo renderizzato** delle rotte live (il fetch esegue JS) e dei **token CSS**; quando scrivo «a 1440 px la colonna è ~665 px» intendo **derivato** da `--measure: 70ch` × corpo 19 px, non misurato.
- Conseguenza: i criteri di accettazione del §6 sono scritti in modo **eseguibile dalla CI con Playwright**, così chi implementa può verificarli davvero.

---

## 3. Analisi con evidenze

### 3.1 Khan Academy — il modello «unità → lezioni → pratica»

**[FATTO]** L'unità 6 «Signals and systems» si apre con un riquadro «About this unit» di tre righe che dice **che cosa copre e come** («We present the basic concepts for continuous-time and discrete-time signals in the time and frequency domains. Time and frequency are related by the Fourier transform»), poi elenca le lezioni sotto l'etichetta **«Learn»** una per riga, con link e icona «opens a modal». La sotto-unità «Fourier series» ha **10 voci**: introduzione, integrale di seno e coseno, integrale seno×coseno, prodotti di seni, prodotti di coseni, primo termine, coefficienti del coseno, coefficienti del seno, coefficiente dell'onda quadra, visualizzazione dello sviluppo.

Lezioni di design:

- **L'unità dichiara l'obiettivo prima dell'elenco**: noi sulla pagina nodo mettiamo «Cosa si deve sapere» ma non diciamo mai *dove siamo* nel capitolo né *quanto manca*.
- **Le voci sono azioni, non sostantivi** («Integral of sin(mt) and cos(mt)», «Visualizing the Fourier expansion of a square wave»): la sequenza si legge come una scaletta di lavoro.
- **Progress/mastery**: **[NON TROVATO]** — la percentuale di padronanza non è visibile senza account, non la cito.

### 3.2 Brilliant — il catalogo come «mappa di livelli»

**[FATTO]** La pagina https://brilliant.org/courses/ etichetta ogni corso con un **livello dichiarato** («GRADES 4–7», «GRADES 7–9», «ADVANCED», «FOUNDATIONAL», «INTERMEDIATE») e una **promessa di una riga** («Dive into key ideas in derivatives, integrals, vectors, and beyond»). Le lezioni vere e proprie sono dietro registrazione: **[NON TROVATO]** il dettaglio di una lezione Brilliant, quindi non posso descriverne i passi.

Lezione di design **[IPOTESI basata sul solo catalogo]**: dichiarare il livello e la promessa in una riga sopra ogni capitolo riduce l'ansia («questo è per me?»). Noi abbiamo `gruppo A/B/C` e `priorita` ma li mostriamo come chip tecnici («Priorità alta»), non come promessa.

### 3.3 Distill.pub — la segmentazione esplicita e parametrizzata

**[FATTO]** In «How to Use t-SNE Effectively» (https://distill.pub/2016/misread-tsne/) ogni figura interattiva ha, sopra: `play_arrow`/`pause`/`refresh` e un **contatore `Step:`**; sotto: **i parametri scritti in chiaro** («Perplexity: 2 — Step: 5,000», «Perplexity: 30 — Step: 10»), più un comando `expand_less` per comprimere. Le figure sono **famiglie di varianti** di uno stesso esperimento (5 valori di perplessità, 5 stadi di convergenza), con un elenco laterale di 18 configurazioni (Grid, Two Clusters, …, Uniform Distribution). Il testo dice esplicitamente al lettore cosa guardare: «The images above show five different runs at perplexity 30. The first four were stopped before stability».

Dall'«about» (https://distill.pub/about/): la rivista (2016-2021, ora in pausa) esisteva per articoli «native to the Web», con **diagrammi reattivi** e **playground** al posto del PDF; il nemico dichiarato è il «research debt», cioè il debito di chiarezza.

Lezioni di design:

- **Il parametro sotto la figura è didattica**: ci insegna a dire «Passo 4 di 10 — spettro prima del filtraggio» sotto il disegno, non solo nel testo.
- **La variante è più istruttiva del caso singolo**: 5 pannelli con parametri diversi, non uno. Da noi: mai due stati dello stesso grafico affiancati.
- **Il lettore deve sapere che cosa è stato fermato prima**: cioè cosa manca ancora al disegno. È l'equivalente del nostro «Passo 4 — nascosto».

### 3.4 3Blue1Brown e Manim — la verifica dentro il testo

**[FATTO]** La lezione «But what is the Fourier Transform? A visual introduction» (https://www.3blue1brown.com/lessons/fourier-transforms) è una **trascrizione con adattamento testuale dichiarato** («Lesson by Grant Sanderson — Text Adaption by James Schloss — Interactives by River Way») e link al **sorgente Python** (`_2018/fourier.py`). Struttura osservata:

- apertura che dice **cosa saprai fare alla fine** («the goal is for you to understand how it represents the inner workings of the Fourier transform»);
- **figura interattiva** con etichetta «Frequencies» e toggle **`Image` / `Video`** per la stessa scena;
- formule in blocco `math` (`\hat g(f) = \int …`), non immagini;
- **domanda di verifica contestuale** con quattro opzioni, pulsante **`Check`** e, sotto, un secondo pulsante di rivelazione («What could it be…»):
  «*We have a wave which oscillates once every 3 seconds and another which oscillates once every 5 seconds. When we add them together, how often will the highest peak appear?* → Once every 6 / 15 / 24 / 33 seconds»;
- **analogia citata con la fonte** («Or as Kalid Azad nicely phrased it… “Given a smoothie, it finds the recipe”»).

**[FATTO]** Manim (https://www.manim.community/) è la libreria con cui quei video sono prodotti: la home mostra 5 scene con **codice + video renderizzato** fianco a fianco, ed è «originally written by Grant Sanderson», licenza MIT. Cioè: **le animazioni sono un artefatto di produzione, non un formato di lettura**. È una distinzione importante per noi: non serve Manim, serve la *sequenza di stati*.

Lezioni di design: la verifica va **dentro** il flusso (una domanda dove serve), non solo in una scheda «quiz» separata; e ogni analogia deve dichiarare la fonte o il limite.

### 3.5 Feynman Lectures online — i comandi di lettura

**[FATTO]** https://www.feynmanlectures.caltech.edu/I_01.html ha un **pannello di navigazione** fisso con: frecce `◄ ▲ ►` (capitolo precedente/su/successivo), tre pulsanti **`A A A`** per la dimensione del testo, un pulsante «slide» (presentazione), un pulsante **dark mode**, un pulsante «stretch» (giustificazione/larghezza), l'**audio della lezione originale**, il **sommario del capitolo** («Feynman's Summary of the most important points in this lecture») e l'indice. Il corpo è organizzato in sezioni numerate `1–1`, `1–2`, con figure numerate `f01-00` e didascalie; la pagina **richiede JavaScript per il rendering delle formule** (MathJax) e, senza JS, mostra un avviso esplicito.

Lezioni di design:

- **Il lettore regola la lettura** (dimensione, tema, larghezza, audio) senza uscire dalla pagina: a noi manca del tutto, ed è un bisogno reale per una pagina da 2.000 parole.
- **Sommario del capitolo separato dal corpo**, con icona sua: cioè un blocco «riepilogo» riconoscibile, non un callout qualunque.
- **Navigazione capitolo precedente/successivo sempre visibile**: noi non abbiamo né «prossimo nodo» né «capitolo precedente» (`grep` su `web/js/pages/*` non trova alcun link di sequenza).

### 3.6 Wikipedia — la linea guida più citabile per la struttura

**[FATTO]** `Wikipedia:Manual_of_Style/Mathematics` (https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Mathematics) prescrive, in ordine:

1. **Lead** breve che «describe and define the subject, provide context, summarize the most important points», accessibile a un lettore generale, **senza formule nel primo paragrafo se possibile**;
2. **motivazione storica**, **introduzione informale** dichiarata come informale, **analogia o diagramma** se aiutano;
3. **corpo**: se la notazione è molta, una lista o una sezione «Notation»; la **definizione esatta** dopo la motivazione («perhaps in a “Definition” section after section(s) of motivation»).

**[FATTO]** La voce «Fourier transform» (https://en.wikipedia.org/wiki/Fourier_transform) applica il modello: **hatnote** «Not to be confused with Fourier method…», **immagine di testa con didascalia esplicativa** (l'accordo di do maggiore al pianoforte, con la spiegazione dei picchi), lead con **analogia dichiarata** («The Fourier transform is analogous to decomposing the sound of a musical chord into the intensities of its constituent pitches»), **note numerate** `[note 1]`…`[note 4]` e sezione **«Definition»** subito dopo.

Lezioni di design, tutte compatibili con i nostri contratti:

- **hatnote**: «Non confondere con…» è esattamente ciò che serve tra `serie-fourier` e `trasformata-fourier`, e tra `sinc` normalizzata e non (noi lo diciamo solo dentro `errori_frequenti`).
- **definizione dopo la motivazione**: nel nostro `nodo.js` l'ordine è «Cosa si deve sapere → Criteri → Prerequisiti → Contesto → Scenario → Definizione»: la motivazione c'è, ma è **dopo** due blocchi amministrativi.
- **nota numerata** invece di nota a piè di pagina: nella versione web non esiste salto di pagina, la nota deve stare **accanto** (vedi §3.11).

### 3.7 Stacks Project — l'enciclopedia con permalink

**[FATTO]** https://stacks.math.columbia.edu/tag/0001 mostra: indicatore **«Typesetting math: 100%»** (il lettore sa che la matematica è pronta), titolo con **numero di sezione + tag permanente** («Section 1.1 (0001): Overview»), testo con riferimenti interni cliccabili, **commenti in fondo alla stessa sezione** (8 commenti, con risposta dell'autore e commit GitHub citato), «next section», «View Section 1.1 as pdf», e un **editor di commento con anteprima** (`Markdown` + `$…$`, pulsante a forma di occhio) protetto da un captcha che chiede «scrivi il nome del tag corrente» (cioè ti obbliga a sapere dove sei).

Lezioni di design:

- **Ogni unità ha un indirizzo stabile e leggibile**: da noi `#/dim/dim-teorema-campionamento` esiste, ma non esiste `#/dim/…/passo-4`: non posso mandare a un compagno «guarda il passo 4» se non a parole. **[IPOTESI]** aggiungere `?passo=4` e `id` sui passi (già presenti: `id="passo-4"` in `passi.js`) renderebbe il sito citabile come un'enciclopedia.
- **Il feedback sta accanto al contenuto** (commenti per sezione), non in una pagina «contatti».
- **Stato di caricamento visibile** («100%»): noi non abbiamo nessuno stato per le formule/figura.

### 3.8 MIT OpenCourseWare — l'indice laterale come infrastruttura

**[FATTO]** https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/pages/lecture-notes/ presenta: colonna **«Browse Course Material»** apribile, blocco **Course Info** (docente, dipartimento, anno, livello), blocco **Learning Resource Types** con icone testuali (Exam Solutions, Exams, Lecture Notes, Lecture Videos, Problem Set Solutions, Problem Sets), pulsante **Download Course**, e la tabella `SES # | LECTURE NOTES` con link ai PDF e **peso del file** («PDF - 2.0MB»).

Lezioni di design:

- **Il tipo di risorsa è un'informazione di primo livello**: nella nostra scheda nodo, «Figura», «Formula», «Testo», «Esercizio» sono tutti uguali visivamente.
- **Il peso/forma del materiale è dichiarato** («2.0MB»): l'equivalente nostro è «10 passi · 3 figure · 7 min», che oggi non mostriamo in testa.
- **Una sola colonna indice, sempre**: la nostra sidebar esiste **solo** nella pagina dimostrazione e **solo** da 1024 px (`@media (min-width:1024px) .dim-indice{display:block}`).

### 3.9 Ciechanowski — animazione controllata dal lettore

**[FATTO]** https://ciechanow.ski/gears/ apre dicendo **come si legge** la pagina: «most of the visualizations are animated – you can play and pause them by clicking/tapping on the button in their bottom left corner… if you find them distracting, or you want to save power, you can **globally pause** all animations». Poi, per ogni figura: **slider** per la velocità angolare, **slider del tempo** per «andare avanti e indietro» nella traccia lasciata dai punti, **frecce** che rappresentano la velocità lineare, formule in linea isolate (`v = ω · r`, `ωout = ωin · rin/rout`), e il testo che **dice cosa osservare** («Observe how the two discs rotate in different directions…»).

Lezioni di design:

- **L'animazione è opt-in e reversibile**: pulsante per figura + interruttore globale. Le nostre specifiche A22/A9 non prevedono nulla del genere; se aggiungiamo animazioni, questo è il modello di riferimento (e va rispettato `prefers-reduced-motion`).
- **Lo slider del tempo è il «mostra il prossimo passo» continuo**: da noi il passo è discreto (bene, meno carico cognitivo), ma manca la possibilità di **tornare indietro di un passo dentro un grafico**.
- **Ogni figura è un esperimento con parametri nominati**: il lettore può dire «cosa succede se cambio T?» — noi abbiamo `T` solo come simbolo.

### 3.10 Better Explained — l'ordine dell'intuizione

**[FATTO]** https://betterexplained.com/articles/developing-your-intuition-for-math/ argomenta con un esempio: la definizione «da cavernicolo» («A furry animal with claws…»), quella evolutiva e quella «moderna» (DNA) — e sostiene che **si deve partire dalla prima**, perché «initial exposure to an idea shapes our intuition». Poi dà una **strategia in 3 passi**: 1) trova il tema centrale (spesso nella storia), 2) spiega un fatto con il tema (traduci l'equazione in italiano semplice), 3) esplora le proprietà con lo stesso tema. Applica la strategia a `e` (interesse composto), con immagini-didascalia «Definitions of e» e «Definitions of a circle», e la frase chiave: «math is about *ideas* — formulas are just a way to express them».

Lezioni di design: il nostro `analogia` esiste già **con il suo limite** (ottima pratica, migliore di Better Explained); quello che manca è la **posizione**: nel `nodo.js` l'analogia arriva **dopo** la spiegazione, quando l'intuizione dovrebbe precederla.

### 3.11 Tufte / Tufte CSS — note a margine e sobrietà

**[FATTO]** https://edwardtufte.github.io/tufte-css/ (implementazione open source delle idee di Tufte) dichiara:

- **Sidenotes**: «like footnotes, except they don't force the reader to jump their eye to the bottom of the page, but instead display off to the side in the margin». Su viewport piccoli «elements that would go in the margin are hidden until the user toggles them into view». Meccanismo: `label.margin-toggle` + checkbox, quindi **senza JavaScript**.
- **Due soli livelli di titolo**: cita il fatto che «the Feynman lectures (3 volumes) write about all of physics in 1800 pages, using only 2 levels of hierarchical headings».
- **Tipografia**: fondo `#fffff8` e testo `#111111` (contrasto ammorbidito), font **ETBook** con **file separati per grassetto e corsivo** (non sintetizzati dal browser), link **dello stesso colore del testo** e sottolineati (definisce il blu dei link «crass and distracting»).
- **`newthought`**: a inizio sezione, piccolo spazio e **prime parole in maiuscoletto** invece di un ennesimo titolo; epigrafi con citazioni e fonte.
- Avvertenza onesta degli autori: «the goal is not to say websites should look like this… It should be a starting point, not a design goal».

Sul libro *Beautiful Evidence* ho aperto solo la pagina commerciale (https://www.edwardtufte.com/book/beautiful-evidence/): **NON TROVATO** l'interno del libro; non cito quindi dettagli di impaginazione non visti.

Lezioni di design: le nostre «varianti di notazione», i «punti aperti» di `verifica` e i «perché si può fare» sono **note per definizione**: oggi sono tutti callout a tutta larghezza, cioè rubano il ritmo del testo. A 1440 px abbiamo **spazio laterale inutilizzato** (§4.3) e nessuna nota a margine.

### 3.12 Manuali di segnali e comunicazioni

**[FATTO] Lathi–Ding, 5ª ed. (OUP)**: la scheda dell'editore dice «**over 200 fully worked-through examples** incorporating current technology, an expansive amount of illustrations throughout the book, MATLAB codes throughout, and a full review of key signals and systems concepts». L'indice è numerato **capitolo.sezione con pagina**: `1 INTRODUCTION 1`, `1.1 COMMUNICATION SYSTEMS 2`, …, `5.1 SAMPLING THEOREM 255`, `5.2 PULSE CODE MODULATION (PCM) 270`, `5.3 DIGITAL TELEPHONY: PCM IN T1 SYSTEMS 282`. La 4ª ed. è descritta come stile «consistently superb pedagogical style… explains complex subjects and concepts clearly, **using both mathematics and heuristics**», «user-friendliness and high readability».

**[FATTO] Oppenheim–Willsky–Nawab (Pearson)**: la scheda dice che il testo «develops continuous-time and discrete-time concepts/methods **in parallel** — highlighting the similarities and differences», è «relatively self-contained» e assume «no prior experience with system analysis, convolution, Fourier analysis». Indice: 1 Signals and Systems … 7 Sampling, 8 Communication Systems, 9 Laplace, 10 Z.

**[FATTO] Downey, *Think DSP*** (libro libero, https://greenteapress.com/wp/think-dsp/): la premessa è **top-down**: «most books present the material bottom-up… With a programming-based approach, I can go top-down, which means I can present the most important ideas right away. By the end of the first chapter, you can decompose a sound into its harmonics». In pagina (http://greenteapress.com/thinkdsp/html/thinkdsp002.html) si vede il ritmo:

- capitolo `Chapter 1 Sounds and signals`, sezioni `1.1`, `1.2`, `1.3`;
- **esempio concreto prima della teoria** (campana, violino, A4 439 Hz);
- **figure numerate con didascalia** («Figure 1.1: Segment from a recording of a bell.») e **richiami nel testo** («Figure 1.2 shows…»);
- definizioni in linea mentre servono («The duration of each cycle, called the **period**, is about 2.3 ms»);
- note a piè `[1]` e link esterni per i prerequisiti («If you are not familiar with “scientific pitch notation”…»).

Lezioni di design: **figura numerata + richiamo nel testo** è il minimo per poter dire «guarda il grafico del passo 4». Noi non numeriamo le figure (`.figure` ha titolo e descrizione, nessun contatore) e non le richiamiamo mai per numero.

**Haykin, Proakis:** **NON TROVATO** — nessuna pagina verificata con impaginazione o indice. Non attribuisco loro nulla.

### 3.13 I dodici pattern che ricorrono (e il nostro stato)

| # | Pattern | Dove l'ho visto [FATTO] | Da noi oggi (evidenza nel repo) |
|---|---|---|---|
| 1 | Idea chiave dichiarata prima | Wikipedia lead, Better Explained, Think DSP, 3b1b | `L.idea` esiste ma è **dopo** enunciato+ipotesi+notazione (`studio.js`) |
| 2 | Un concetto per blocco, ritmo costante | Tufte CSS, Think DSP | fatto bene: token di spaziatura e `--measure` |
| 3 | Segmentazione con controllo del lettore | Distill `Step`, Ciechanowski play/pausa, 3b1b `Check` | fatto: 5 modalità, `Prossimo passo`, tastiera; **manca** il passo dentro il grafico |
| 4 | Figura numerata + richiami | Think DSP («Figure 1.2»), Wikipedia didascalie | **manca**: nessun contatore, nessun «vedi fig.» |
| 5 | Costruzione progressiva del disegno | Distill (5 stadi), Ciechanowski (slider tempo), 3b1b (avvolgimento) | **manca**: 5 coppie consecutive, 0 assi coerenti (§4.2) |
| 6 | Nota a margine invece di nota a piè | Tufte CSS | **manca**: nessun token/colonna margine; note = callout in linea |
| 7 | Indice laterale permanente | MIT OCW «Browse Course Material», Stacks, 3b1b | solo `#/dim` da 1024 px (`dim-indice`) |
| 8 | Numero/permalink per citare | Stacks `tag 0001`, Think DSP `§1.2` | nessuna numerazione di sezione; `#/dim/x` sì, `passo-4` non linkabile in UI |
| 9 | Colore = tipo di elemento, non decorazione | Tufte (grigi + colore solo figure), Wikipedia (nessun colore semantico) | 4 toni (`primary/ok/warn/danger`) usati in modo intercambiabile |
| 10 | Riepilogo di fine capitolo riconoscibile | Feynman «Summary», manuali (Chapter Summary) | `riepilogo` esiste come callout generico, in mezzo ad altre 6 sezioni |
| 11 | Domanda di verifica contestuale | 3b1b (`Check`), Khan (esercizi per unità) | solo nelle modalità «A buchi»/«Recall», mai dentro il passo |
| 12 | Comandi di lettura (font, tema, stampa) | Feynman (`A A A`, dark, stretch) | **mancano**; nessun foglio di stile `@media print` (grep: 0 occorrenze) |

---

## 4. Audit dello stato attuale

### 4.1 Che cosa c'è già (e va conservato)

- **Design system coerente**: `tokens.css` con scala 4 px, tipografia fluida (`--fs-body` 17→19 px), `--measure: 70ch`, `--page-max: 1200px`, `--tap: 44px`, palette AA. [FATTO: letto]
- **Pagina dimostrazione** con 5 modalità, `Prossimo passo` + `Indice` + tastiera (`→`, `Spazio`, `←`), progresso persistito, formula finale nascosta finché non si arriva in fondo. [FATTO: `pages/dim/*`]
- **Figure SVG** accessibili (`role="img"`, `<title>`, `<desc>`), legenda in HTML, fallback testuale. [FATTO: `figure/index.js`]
- **Dati didattici ricchi**: `perche_ti_serve`, `scenario`, `analogia.limite`, `worked_example` con giustificazione, `completion_problem`, `errori_trappole`, `richiamo_attivo`, `flashcard`, `checklist`, `riepilogo`. [FATTO: `graph/lezioni/trasformata-fourier.json`]
- **Grafo con sezioni per area e conteggi** (`grafo.js`: «Area 3 — … 11 nodi»), filtro e ricerca. [FATTO]

### 4.2 I numeri del corpus (misurati oggi sul repo)

Comando usato: lettura di `graph/dimostrazioni/*.json` con uno script Python monouso (non versionato).

| Dimostrazione | Passi | Passi con figura | Coppie consecutive con figura | Coppie con assi identici |
|---|---|---|---|---|
| dim-pam-due-spettri (T5) | 10 | 3 | 0 | 0 |
| dim-teorema-campionamento (T1) | 8 | 3 | 0 | 0 |
| dim-impulso-dirac-trasformata | 8 | 2 | 0 | 0 |
| dim-risposta-impulsiva-h | 8 | 3 | 1 | 0 |
| dim-modulazione-prodotto-qam-errore-fase | 8 | 3 | 1 | 0 |
| dim-conversione-da | 7 | 1 | 0 | 0 |
| dim-quadripoli-passa-basso-equivalente (T11) | 7 | 2 | 0 | 0 |
| dim-filtro-trasversale | 7 | 3 | 0 | 0 |
| dim-aloha-throughput | 6 | 3 | 1 | 0 |
| dim-csma-cd-throughput | 6 | 2 | 0 | 0 |
| dim-spettri-modulazione-prodotto | 6 | 1 | 0 | 0 |
| dim-conversione-ad (T7) | 5 | 1 | 0 | 0 |
| dim-formula-carson | 5 | **0** | 0 | 0 |
| dim-nascita-morte-equilibrio | 5 | 1 | 0 | 0 |
| dim-pm-fm-trasformazione | 5 | 2 | 1 | 0 |
| dim-poisson-tempo-residuo | 5 | 1 | 0 | 0 |
| dim-ritardo-tdma-fdma | 5 | 1 | 0 | 0 |
| dim-sliding-window-efficienza | 5 | 3 | 1 | 0 |
| **Totale** | **116** | **35** | **5** | **0** |

Altri numeri:

- **80 passi** hanno una formula ma **nessuna figura** (candidati naturali al «grafico che si costruisce»); es. `dim-pam-due-spettri` passi 1,3,5,6,7,8,10; `dim-conversione-da` 6 passi su 7.
- **5 figure** non sono collegate ad alcun passo e compaiono solo in «Figure generali»: `catena` (in `dim-conversione-ad` e `dim-conversione-da`), `righe-carson` (`dim-formula-carson`), `catena`/`ampiezza` (`dim-spettri-modulazione-prodotto`).
- **39 figure** in totale per 18 dimostrazioni; 56 nodi; 7 aree con 8, 6, 11, 4, 10, 12, 5 nodi.
- **69 prove** in `graph/esame.json`, **67** con `punti: "NON TROVATO"`; la home le elenca tutte.
- **0** occorrenze di `@media print` in `web/`; **0** rotte `#/area/…`; **0** riferimenti «prossimo nodo / nodo precedente» nelle pagine.
- Pseudo-matematica Unicode fuori da `$…$`: **0 occorrenze nei campi di prosa**; le 185 occorrenze trovate sono **tutte** in etichette/descrizioni di figure e in `a_buchi.soluzioni`, dove il contratto le ammette. (Il punto aperto D5 del REDESIGN_PLAN non è più un problema per la prosa.)

### 4.3 Difetti di presentazione rilevati (e perché contano)

| # | Rilievo | Evidenza | Perché conta per un manuale |
|---|---|---|---|
| N1 | **Nessuna copertina di capitolo**: si passa da «Grafo degli argomenti» (elenco) a una scheda singola | `router.js` ha 8 rotte, nessuna `#/area/<n>` | Un manuale si orienta per capitoli: cosa copre, perché, in che ordine |
| N2 | **18 sezioni piatte** nella scheda nodo, senza numerazione né indice | `nodo.js`: Cosa si deve sapere, Criteri, Prerequisiti, Contesto, Scenario, Definizione, Spiegazione, Figure, Analogia, Esempio svolto, Completamento, Esercizio, Errori, Richiamo, Riepilogo, Flashcard, Checklist, Fonti | Impossibile dire «rivedi §6» o «salta alle fonti»; la pagina non è mappabile in memoria |
| N3 | **Motivazione e analogia dopo l'amministrazione** | ordine in `nodo.js`: «Cosa si deve sapere» → «Criteri osservabili» → «Prerequisiti» → «Contesto e obiettivo» (`perche_ti_serve`) → … → «Analogia» dopo la «Spiegazione» | MOS:Mathematics e Better Explained mettono motivazione e intuizione **prima** del formalismo |
| N4 | **«Perché ti serve» non è un box**: è un paragrafo sotto un h2 generico | `nodo.js` `renderLezione` | È la leva motivazionale più forte che abbiamo e non si vede |
| N5 | **Nessuna numerazione delle figure, nessun richiamo** | `figure/index.js` non emette contatori; `passi.js` non ha «vedi fig.» | Il testo non può rimandare al disegno; il disegno resta decorazione |
| N6 | **Nessuna figura progressiva** | 5 coppie consecutive, 0 assi coerenti (§4.2) | È esattamente il punto 3 della richiesta utente: il grafico deve costruirsi |
| N7 | **Spazio laterale sprecato a 1440 px** | `--page-max: 1200px` + `--measure: 70ch` (≈ 665 px a 19 px) → ~500 px liberi; nessun token di colonna margine | È lo spazio naturale per le note a margine (Tufte) e per l'indice (MIT OCW) |
| N8 | **Sidebar solo su `/dim`** | `dimostrazione.css` `@media (min-width:1024px) .dim-indice{display:block}` | La scheda nodo (la più lunga) non ha indice |
| N9 | **Colore non semantico**: 4 toni per 8 tipi di blocco | `components.css`: `.callout` unico, `--tip` definito localmente in `dimostrazione.css` | Il lettore non impara «verde = idea, ambra = attenzione, rosso = errore» |
| N10 | **Home = tabella di 69 prove** con 67 «NON TROVATO» | `home.js` + conteggio su `esame.json` | In un manuale la prima pagina è la mappa, non l'elenco delle prove |
| N11 | **Nessun comando di lettura né stampa** | grep `@media print` = 0; nessun controllo di tema/dimensione (a parte `prefers-color-scheme` facoltativo) | Uno studente stampa le dimostrazioni; senza foglio di stampa escono tagliate e con i passi nascosti |
| N12 | **Nessuna navigazione sequenziale tra nodi** | grep «prossimo/precedente»: solo tastiera di `/dim` | Un manuale si legge in sequenza: dopo T1 si va a T3, non «torna al grafo» |
| N13 | **Micro-difetto di flusso nella prosa**: una congiunzione isolata tra due formule | nel testo live di `#/nodo/trasformata-fourier`, tra le due formule di `definizione` compare una riga con la sola «e» | Rompe il ritmo e sembra un errore di battitura: è `renderProsaMarkdown` che spezza il paragrafo attorno ai blocchi formula |
| N14 | **Doppia lettura delle figure per gli screen reader** | `figure/index.js` emette `<title>`+`<desc>` **e** `figuraSVG` una `<figcaption>` con lo stesso titolo/descrizione: nel testo renderizzato la descrizione compare due volte | Ridondanza per chi usa lettore di schermo; da decidere: `<desc>` breve + didascalia lunga, oppure `aria-hidden` sulla didascalia |

**Onestà sui limiti dell'audit:** N13 e N14 li ho dedotti dal **testo renderizzato** e dal codice, non da uno screenshot; un bug puramente visivo (sovrapposizioni, tagli) non è verificabile senza browser (§2.3). I difetti F1–F8 e L1–L8 del precedente audit risultano **risolti** almeno nel codice (formule in display via `formulaBlock`, `overflow-x` non nascosto, `--measure`, `--tap`): le misure finali restano da rifare sul campo.

---

## 5. Specifica concreta per il nostro sito

Regola generale **[IPOTESI di lavoro]**: si aggiunge **solo presentazione**; i nuovi testi visibili sono **derivati dai dati esistenti** (titoli, conteggi, `saper_fare`, `riepilogo`, `verifica`) oppure sono etichette di interfaccia. Nessun fatto nuovo, nessun punteggio nuovo.

### 5.1 Nuovi token (`web/css/tokens.css`)

```css
:root {
  /* colonna margine (note a margine e indice) */
  --margin-col: 220px;              /* 200–240 px: sta in 1200-665-32*2 */
  --measure-wide: 82ch;             /* per tabelle e figure, mai per la prosa */
  --gap-col: var(--s-6);

  /* gerarchia tipografica "da manuale" */
  --fs-lead: clamp(1.125rem, 1.05rem + 0.35vw, 1.3125rem);  /* sommario/lead */
  --fs-caption: 0.9375rem;          /* didascalie: mai sotto 15 px */
  --fs-num: 0.8125rem;              /* numeri di sezione/figura */

  /* colori semantici (uno per tipo di blocco) */
  --c-idea: #0f766e;        --c-idea-bg: #ecfdf5;      /* idea chiave */
  --c-def: #6d28d9;         --c-def-bg: #f5f3ff;       /* definizione */
  --c-example: #1d4ed8;     --c-example-bg: #eef2ff;   /* esempio svolto */
  --c-attenzione: #92400e;  --c-attenzione-bg: #fff8e6;/* attenzione */
  --c-errore: #b42318;      --c-errore-bg: #fef3f2;    /* errore frequente */
  --c-verifica: #334155;    --c-verifica-bg: #f1f5f9;  /* fonte/verifica (freddo, basso) */

  /* stampa e figure */
  --figure-max: 720px;      /* già usato con fallback in figure.css */
  --rule: 1px solid var(--c-border);
}
```

Contrasto: i valori `--c-idea #0f766e` e `--c-def #6d28d9` su fondo bianco sono ≥ 4.5:1 (verifica obbligatoria in e2e A14, che già esiste).

### 5.2 Tassonomia dei blocchi (il «colore = tipo»)

| Blocco | Campo dati che lo alimenta | Classe | Forma |
|---|---|---|---|
| Idea chiave | `dimostrazione.idea`, `lezione.spiegazione` (primo blocco) | `.chiave` | bordo pieno 2 px + sfondo `--c-idea-bg`, testo 1.15× corpo |
| Definizione d'esame | `lezione.definizione_esame` | `.definizione` | etichetta «Definizione» in maiuscoletto, sfondo `--c-def-bg` |
| Esempio svolto | `lezione.worked_example` | `.esempio` | numerazione dei passi `1)`, `2)`, «Soluzione» in evidenza |
| Scenario / storia | `lezione.scenario` | `.scenario` | testo corsivo, nessun bordo, filetto sinistro sottile |
| Analogia | `lezione.analogia` (+ `.limite`) | `.analogia` | due parti: «Funziona così» / «Ma non oltre» (limite sempre visibile, mai in `<details>`) |
| Attenzione | `errori_trappole[].errore` (metà) | `.attenzione` | ambra |
| Errore frequente | `errori_frequenti` (3 campi) | `.errore` | rosso, con tre righe etichettate |
| Verifica | `verifica.stato`, `punti_aperti`, `fonti` | `.verifica` | grigio-freddo, corpo ridotto, sempre in fondo |
| Domanda di verifica | `richiamo_attivo`, `a_buchi` | `.verifica-domanda` | domanda + bottone «Mostra risposta» (`aria-expanded`) |

### 5.3 Pattern di pagina

**a) Home / percorso d'esame** — dal «catalogo» alla «mappa»:

1. testata: h1 + una riga di promessa (già c'è) + «56 argomenti · 18 dimostrazioni · 79 domande» (derivato);
2. **griglia dei 7 capitoli** (numero, titolo, `n` argomenti, `m` dimostrazioni, tempo totale dichiarato dai nodi): è il vero indice del manuale;
3. «Da dove partire» (3 card, già esistenti);
4. **stato di studio** per capitolo, letto da `tlc-kg:stato:v1` (dato già disponibile);
5. `<details><summary>Tutte le 69 prove d'esame</summary>` con la tabella attuale: **collassata**, così «NON TROVATO» non domina la prima pagina.

**b) Copertina di capitolo** — nuova rotta `#/area/<n>`:

- numero grande, titolo dell'area (da `graph.meta.aree`), conteggio nodi/tempo;
- **«Che cosa saprai fare»**: 3 voci scelte dai `saper_fare` dei nodi dell'area (testo già scritto e verificato dai worker di contenuti — nessuna invenzione);
- **«Da dove cominciare»**: il nodo senza prerequisiti hard;
- elenco dei nodi in ordine topologico con tipo e stato;
- link «capitolo precedente / successivo».

**c) Nodo-concetto (scheda di manuale)** — ordine nuovo:

`h1` → chip minimi (area, tipo) → **`.chiave` «Perché ti serve»** (da `perche_ti_serve`) → **`.scenario`** → **`.analogia`** con limite → indice interno a destra (sticky ≥1024, `<details>` sotto) → sezioni **numerate** `1 Definizione`, `2 Spiegazione` (sotto-sezioni `2.1`, `2.2` dai `###` del markdown), `3 Esempio svolto`, `4 Prova tu` (completamento+autonomo), `5 Errori da non fare`, `6 Verifica` (richiamo + flashcard), `7 Riepilogo` (box `.riepilogo-fine`) → `8 Fonti e stato di verifica` (piccolo, `.verifica`) → navigazione «precedente / successivo».

Le sezioni amministrative attuali («Criteri osservabili», «Prerequisiti») si spostano **dopo** la definizione, dentro `<details>` con titolo «Prerequisiti e criteri»: restano (contratto), non interrompono.

**d) Dimostrazione** — si conserva l'impianto D3, con quattro innesti:

1. **`.chiave` con `idea` subito sotto l'h1** (spostamento, non nuovo contenuto);
2. **numero di figura** in ogni didascalia («Figura 3 — Spettro a righe del PAM») e possibilità di richiamarla;
3. **grafico progressivo** (§5.4);
4. **`.riepilogo-fine`**: «In 3 righe» (`versione_compatta`), «Sei pronto?» (`richiamo_attivo`, 2 domande), «Prossimo passo» (regola deterministica, §6/P14).

**e) Esercizio guidato**: tre colonne su desktop (`Testo | Svolgimento guidato | Suggerimento`), con «Mostra il prossimo passaggio» che rivela i passi di `worked_example.passi` uno alla volta (stesso meccanismo di Studio, riusato: nessun nuovo componente).

**f) Quiz**: le domande diventano **«checkpoint»** richiamabili da un capitolo: `#/quiz?area=3` filtra per area (dato `quiz.elementi[].area` già presente), intestazione «Capitolo 3 · 12 domande». Resta la modalità allenamento/simulazione.

**g) Ripasso**: invariato nella sostanza; aggiungere in testa la **«scheda da stampare»** (link a `#/dim/x?stampa=1` che apre la modalità compatta con `@media print`), perché il ripasso a 1-3-7-14 giorni si fa anche su carta.

### 5.4 Il punto centrale: il grafico che si costruisce passo per passo

Vincolo: `CONTRACTS.md` §3.4 **non** prevede livelli, stati o animazioni nella figura, e il §3.3 lega un passo a **una** figura per ID. Quindi **non** si può introdurre un campo `stati[]`. Tre pattern conformi, in ordine di priorità:

**Pattern A — figura cumulativa per passo (contenuti; nessun cambio di schema).**
Per ogni passo che introduce un elemento grafico si aggiunge una figura **con gli stessi assi della figura finale** e due serie: la serie già costruita con `stile: "tratteggio"` (stato precedente) e la serie nuova con `stile: "linea"`. Esempio illustrativo per T1 (assi e punti sono un segnaposto da calcolare, non valori verificati dal libro):

```json
{"tipo": "grafico", "id": "spettro-repliche-sovrapposte",
 "titolo": "Passo 4 — le repliche si sovrappongono",
 "asse_x": {"etichetta": "ω (rad/s)", "min": -3, "max": 3},
 "asse_y": {"etichetta": "|X_s(ω)|", "min": 0, "max": 2},
 "serie": [
   {"stile": "tratteggio", "etichetta": "spettro del segnale (passo 3)", "punti": [[-1,0],[0,1],[1,0]]},
   {"stile": "linea", "etichetta": "replica traslata di ω_s", "punti": [[-3,0],[-2,1],[-1,0]]}
 ],
 "annotazioni": [{"x": 1.5, "y": 1.2, "testo": "sovrapposizione"}]}
```

Il lettore, arrivando al passo 4, vede **il disegno del passo 3 in grigio tratteggiato** e **la novità in pieno**: il grafico «si costruisce» senza una sola riga di JavaScript nuovo.
*Costo:* solo contenuti (W3/W4/W5). *Accettazione:* vedi P1.

**Pattern B — componente `.figura-progressiva` (solo UI).**
Il renderer numera le figure della pagina («Fig. 4 · 2/3») e, quando il passo `n` e il passo `n-1` hanno entrambi una figura, mostra sotto il disegno un pulsante **«Confronta con il passo 3»** che affianca (≥1024) o alterna (mobile) le due figure **già presenti nei dati**. Funzione pura `confrontoFigure(dim, n) -> {prima, dopo} | null` in `web/js/pages/dim/figure.js`: testabile in node, zero dati nuovi.

**Pattern C — micro-animazione del «nuovo» (opzionale, CSS).**
La serie marcata `nuova` (attributo `data-nuova="true"` emesso dal renderer per l'ultima serie) si disegna con `stroke-dasharray` in ≤ 600 ms; `@media (prefers-reduced-motion: reduce)` la disattiva; nessun loop, nessun autoplay. Modello di riferimento: Ciechanowski (pausa per figura) e Distill (`Step`), ma **senza** controlli di riproduzione, che qui sarebbero rumore.

Sequenza di lavoro consigliata **[IPOTESI]**, per massimo effetto didattico per unità di sforzo:

1. `dim-teorema-campionamento` (T1): 8 passi, oggi 3 figure isolate; servono i passi 3→4→5 (repliche che si sovrappongono, poi filtro) — è il cuore del corso;
2. `dim-pam-due-spettri` (T5, 10 punti): passi 4 e 9 (righe → spettro continuo);
3. `dim-conversione-ad` (T7) e `dim-conversione-da` (T8): catena a blocchi che si illumina blocco per blocco (tipo `blocchi`, non serve un grafico);
4. `dim-aloha-throughput` / `dim-csma-cd-throughput`: curva G·e^{−2G} che cresce al variare dello scenario (serie cumulative);
5. `dim-poisson-tempo-residuo`, `dim-nascita-morte-equilibrio`, `dim-ritardo-tdma-fdma`: diagrammi temporali che si popolano (tipo `temporale`: aggiungere `intervalli`/`frecce` a ogni passo);
6. `dim-formula-carson`: 5 passi con **zero** figure — la figura `righe-carson` esiste già e va solo agganciata al passo giusto.

---

## 6. Mockup testuali (HTML/CSS)

Sono **schizzi** da adattare ai token reali: servono a fissare struttura, classi e comportamento responsive. Numeri e testi dentro i mockup sono **segnaposto** (es. «11 argomenti», «4 h 20 min»): nell'implementazione vanno calcolati dal grafo. **[IPOTESI]**

### 6.1 Copertina di capitolo (`#/area/3`)

```html
<section class="capitolo">
  <p class="capitolo__occhiello">Capitolo 3</p>
  <h1 class="capitolo__titolo">Campionamento, Nyquist, PAM e processi aleatori</h1>
  <p class="capitolo__lead">11 argomenti · 3 dimostrazioni · 4 h 20 min stimati</p>

  <div class="capitolo__griglia">
    <div class="chiave">
      <p class="chiave__etichetta">In una frase</p>
      <p>Da uno spettro limitato in banda si ricostruisce tutto il segnale: è la ragione per cui la voce diventa numeri.</p>
    </div>
    <div class="card">
      <h2 class="card__title">Che cosa saprai fare</h2>
      <ul class="checklist">
        <li>so enunciare la condizione di Nyquist in ω e in f</li>
        <li>so disegnare le repliche e riconoscere l'aliasing</li>
        <li>so separare i due spettri di un segnale PAM</li>
      </ul>
    </div>
  </div>

  <h2>Da dove cominciare</h2>
  <ol class="percorso">
    <li><a href="#/nodo/serie-temporali-trasformata">Serie temporali e trasformata</a>
        <span class="percorso__meta">nessun prerequisito</span></li>
    <li><a href="#/nodo/dim-teorema-campionamento">Teorema del campionamento · T1</a>
        <span class="percorso__meta">dimostrazione · 8 passi</span></li>
  </ol>

  <nav class="capitolo__nav" aria-label="Capitoli">
    <a class="btn btn--ghost" href="#/area/2">← Capitolo 2</a>
    <a class="btn btn--ghost" href="#/area/4">Capitolo 4 →</a>
  </nav>
</section>
```

```css
.capitolo__occhiello { font-size: var(--fs-num); letter-spacing: .08em;
  text-transform: uppercase; color: var(--c-text-muted); margin: 0; }
.capitolo__titolo { margin: var(--s-2) 0 var(--s-3); text-wrap: balance; }
.capitolo__lead { font-size: var(--fs-lead); color: var(--c-text-muted);
  max-width: var(--measure); margin: 0 0 var(--s-6); }
.capitolo__griglia { display: grid; gap: var(--s-5); }
@media (min-width: 900px) { .capitolo__griglia { grid-template-columns: 1fr 1fr; } }
.percorso__meta { display: block; font-size: var(--fs-small); color: var(--c-text-muted); }
```

### 6.2 Scheda nodo con indice, sezioni numerate e nota a margine

```html
<div class="scheda">
  <article class="scheda__corpo prose">
    <p class="scheda__occhiello">Capitolo 1 · Argomento 3</p>
    <h1>Trasformata di Fourier</h1>

    <aside class="chiave" aria-labelledby="chiave-1">
      <p class="chiave__etichetta" id="chiave-1">Perché ti serve</p>
      <p>Prerequisito diretto di T2 e, a cascata, di T1, T3, T4, T5;
         tema di quiz M9. Senza la trasformata non esiste il teorema del campionamento.</p>
    </aside>

    <h2 id="s1"><span class="sezione__num">1</span> Definizione</h2>
    <div class="formula-box"><!-- formulaBlock(...) --></div>

    <h2 id="s2"><span class="sezione__num">2</span> Che cosa significa</h2>
    <p>Quando il periodo cresce senza limite, le righe si infittiscono…
      <label for="n1" class="nota-toggle" aria-label="Mostra nota 1">1</label>
    </p>
    <aside class="nota-margine" id="n1" role="note">
      <p class="nota-margine__titolo">Nota 1 — variante di notazione</p>
      <p>Canonica <span class="math">ω</span>=2π/T; in file3 compare <span class="math">f₀</span>=1/T.</p>
    </aside>

    <h2 id="s7"><span class="sezione__num">7</span> Riepilogo</h2>
    <div class="riepilogo-fine">
      <ul><li>diretta senza fattore, inversa con 1/2π;</li>
          <li>rettangolo → sinc, sinc → rettangolo;</li>
          <li>ritardo → fattore di fase.</li></ul>
    </div>
    <nav class="scheda__nav" aria-label="Argomenti">
      <a class="btn btn--ghost" href="#/nodo/serie-fourier">← Serie di Fourier</a>
      <a class="btn btn--primary" href="#/dim/dim-impulso-dirac-trasformata">Dimostrazione T2 →</a>
    </nav>
  </article>

  <nav class="scheda__indice" aria-label="In questa scheda">
    <p class="scheda__indice-titolo">In questa scheda</p>
    <ol>
      <li><a href="#s1">Definizione</a></li>
      <li><a href="#s2">Che cosa significa</a></li>
      <li><a href="#s7">Riepilogo</a></li>
    </ol>
  </nav>
</div>
```

```css
.scheda { display: grid; gap: var(--s-6); align-items: start; }
@media (min-width: 1024px) {
  .scheda { grid-template-columns: minmax(0, var(--measure)) var(--margin-col); }
  .scheda__indice { position: sticky; top: calc(var(--header-height) + var(--s-4));
    font-size: var(--fs-small); border-left: var(--rule); padding-left: var(--s-4); }
}
.sezione__num { font-variant-numeric: tabular-nums; color: var(--c-text-muted);
  font-weight: 600; margin-right: var(--s-2); }
/* nota a margine: sul desktop esce dalla colonna di lettura, sul mobile è un blocco sotto */
.nota-margine { font-size: var(--fs-small); color: var(--c-text-muted);
  border-top: var(--rule); padding-top: var(--s-2); margin: var(--s-3) 0 var(--s-5); }
@media (min-width: 1024px) {
  .nota-margine { grid-column: 2; margin-top: 0; }
}
```

### 6.3 Passo con grafico progressivo e didascalia numerata

```html
<li class="step step--rivelato" id="passo-4">
  <h3 class="step__titolo"><span class="step__num">4</span>Passo 4</h3>
  <div class="step__corpo">
    <div class="prose"><p>Le repliche, traslate di ω<sub>s</sub>, invadono la banda del segnale:</p></div>
    <div class="formula-box"><!-- formulaBlock(...) --></div>

    <figure class="figure figura-progressiva" data-fig-num="4" data-fig-tot="6">
      <!-- svg con serie tratteggiata (passo 3) + serie piena (novità del passo 4) -->
      <figcaption>
        <span class="figure__caption-title">
          <span class="figure__num">Figura 4</span> — Le repliche si sovrappongono
        </span>
        <span class="figure__caption-desc">Tratteggio: lo spettro isolato del passo 3.
          Linea piena: la replica centrata in ω<sub>s</sub>; dove si toccano, la ricostruzione è ambigua.</span>
      </figcaption>
      <p class="figura-progressiva__stato">Costruzione: 2 di 3 elementi</p>
      <button class="btn btn--ghost btn--sm js-confronta" type="button" aria-expanded="false">
        Confronta con il passo 3
      </button>
    </figure>

    <aside class="callout callout--tip"><p class="callout__title">Perché si può fare</p>
      <p>Vale la periodicità della trasformata della serie temporale…</p></aside>
  </div>
</li>
```

```css
.figure__num { font-weight: 700; font-variant-numeric: tabular-nums; }
.figura-progressiva__stato { font-size: var(--fs-num); color: var(--c-text-muted); margin: 0 var(--s-4) var(--s-2); }
.figure svg [data-nuova="true"] { stroke-dasharray: var(--len);
  animation: traccia .5s ease-out 1 both; }
@keyframes traccia { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .figure svg [data-nuova="true"] { animation: none; stroke-dasharray: none; }
}
@media print {
  .figura-progressiva__stato, .js-confronta { display: none; }
  .step__corpo { display: block !important; }   /* in stampa tutti i passi sono visibili */
  .figure, .formula-box { break-inside: avoid; }
  .site-header, .nav-principale, .dim-controlli, .dim-tabs { display: none; }
}
```

### 6.4 Chiusura di pagina (riepilogo + verifica + prossimo)

```html
<section class="fine-pagina">
  <h2>Che cosa porti a casa</h2>
  <div class="riepilogo-fine"><ol>
    <li>Ogni campione sopra 2f<sub>m</sub> non aggiunge informazione.</li>
    <li>La ricostruzione è una serie di sinc traslate, ortogonali.</li>
    <li>Il filtro di ricostruzione è ideale: modello, non circuito.</li>
  </ol></div>

  <div class="verifica-domanda card">
    <p><strong>Verifica veloce.</strong> Che cosa succede se f<sub>s</sub> = f<sub>m</sub>?</p>
    <button class="btn btn--ghost" aria-expanded="false" aria-controls="r1">Mostra risposta</button>
    <div class="callout callout--info" id="r1" hidden><p>Le repliche si toccano: la banda di ricostruzione diventa ambigua…</p></div>
  </div>

  <nav class="fine-pagina__nav" aria-label="Argomenti">
    <a class="btn btn--ghost" href="#/nodo/serie-temporali-trasformata">← Serie temporali</a>
    <a class="btn btn--primary" href="#/dim/dim-pam-due-spettri">Prossimo: PAM e due spettri (T5) →</a>
  </nav>
</section>
```

---

## 7. Lista PRIORITIZZATA di modifiche

Ordinata per **impatto sulla comprensione/memoria diviso sforzo**. Sforzo: **S** ≤ mezza giornata, **M** 1–2 giorni, **L** ≥ 3 giorni. Le colonne «dove» indicano file/paths reali del repo; il worker di riferimento è indicato tra parentesi quando il file è di scope esclusivo.

### P1 — Grafico cumulativo passo per passo (Pattern A) — sforzo **L**

- **Cosa:** ogni passo che introduce un elemento grafico riceve una figura con **gli stessi assi** della figura finale e una serie tratteggiata (stato precedente) + una serie piena (novità), con `annotazioni` per il fenomeno nuovo. Partire dalle 6 dimostrazioni di §5.4.
- **Dove:** `graph/dimostrazioni/*.json` (contenuti, W3/W4/W5); nessuna modifica necessaria a schemi o renderer.
- **Perché aiuta:** è il pattern che tutti i riferimenti usano per far *vedere* il ragionamento (Distill 5 stadi, Ciechanowski sequenze, 3b1b). Oggi il disegno arriva come verità rivelata: lo studente lo memorizza senza capire da dove esce. Col tratteggio «questo c'era già» + «questo è nuovo», il passo diventa una **differenza visibile**, che è ciò che si ricorda all'esame.
- **Criterio di accettazione:**
  1. per almeno **12 delle 18** dimostrazioni esiste **≥ 1 coppia di passi consecutivi** con figura, e per ogni coppia `asse_x` e `asse_y` sono **identici** (uguaglianza JSON); la figura del passo successivo ha **≥ 1 serie o annotazione in più**;
  2. **0** figure non collegate ad alcun passo (oggi 5);
  3. test node nuovo `web/tests/dim-progressivo.test.js`: legge `web/graph.json`, applica la regola 1 e fallisce elencando le coppie mancanti;
  4. e2e: in `#/dim/dim-teorema-campionamento` dopo «Mostra tutti» il passo 4 contiene un `<svg>` con **≥ 2** `<path data-serie>` di cui **almeno uno** con `stroke-dasharray` calcolato ≠ `none`.

### P2 — «Idea chiave» in testa e «Perché ti serve» come box — sforzo **S**

- **Cosa:** spostare `dimostrazione.idea` e `lezione.perche_ti_serve` in un blocco `.chiave` **subito sotto l'h1**; `scenario` e `analogia` (con limite visibile) salgono prima della «Spiegazione».
- **Dove:** `web/js/pages/dim/studio.js` + `sezioni.js`, `web/js/pages/nodo.js`, `web/css/components.css` (`.chiave`), `web/css/pages/{dimostrazione,nodo}.css`.
- **Perché aiuta:** MOS:Mathematics (lead accessibile prima dei dettagli), Better Explained (intuizione prima del formalismo), Think DSP (idea importante subito). Oggi la motivazione arriva **dopo** due blocchi amministrativi (N3, N4): è l'errore più costoso in rapporto allo sforzo.
- **Criterio di accettazione:** test node sull'ordine del DOM: in ogni `#/dim` l'elemento `.chiave` precede `#studio-enunciato`; in ogni `#/nodo` `.chiave` precede il primo `<h2>`; e2e: `.chiave` è interamente visibile nel primo viewport a 390×844 e a 1440×900 su 3 rotte campione; contrasto (A14) verde.

### P3 — Indice interno e sezioni numerate sulla scheda nodo — sforzo **M**

- **Cosa:** numerazione `1…n` delle sezioni (`2.1`, `2.2` per i `###`), indice laterale sticky ≥1024 px, `<details>` «In questa scheda» sotto; spostare «Criteri osservabili» e «Prerequisiti» dentro `<details>` dopo la definizione.
- **Dove:** `web/js/pages/nodo.js` → nuovo `web/js/pages/nodo/{index,sezioni,indice}.js` (SOLID: file < 150 righe), `web/css/pages/nodo.css`.
- **Perché aiuta:** MIT OCW e Tufte CSS: un indice laterale è ciò che rende un testo lungo «consultabile»; la numerazione crea **ancore mentali** (lo studente dice «§5, errori») e riduce il costo di ritrovare un pezzo. Oggi 18 sezioni senza gerarchia (N2).
- **Criterio di accettazione:** ogni `#/nodo` ha `.scheda__indice` con **≥ 6** voci; ogni voce punta a un `id` esistente (test: `document.getElementById(href.slice(1)) !== null` per tutte); a 1440 l'indice è sticky (top costante dopo 400 px di scroll, tolleranza 2 px) e la sua bbox è a destra del `.prose` senza sovrapposizioni; a 390 l'indice è in `<details>` chiuso e la pagina non ha scroll orizzontale (A1).

### P4 — Numerazione delle figure e richiami nel testo — sforzo **S**

- **Cosa:** contatore per pagina nelle didascalie («Figura 4 — …»), `data-fig-num`, e possibilità di scrivere nel testo «(fig. 4)» con uno stile che non si rompa.
- **Dove:** `web/js/figure/helpers.js` (`figuraSVG`), `web/css/figure.css`, `web/tests/figure.test.js`.
- **Perché aiuta:** Think DSP richiama «Figure 1.2» nel testo; senza numero il disegno non entra nel discorso e non è citabile. È il presupposto perché il passo-successivo possa dire «come in figura 3».
- **Criterio di accettazione:** in `#/dim/dim-pam-due-spettri` le figure visibili hanno numeri progressivi `1,2,3` **senza buchi e senza duplicati**; il numero compare in `.figure__num` con `font-variant-numeric: tabular-nums`; test node: `numeriFigure(specs)` restituisce `[1..n]` e ignora le figure non renderizzate.

### P5 — Home come mappa dei capitoli, tabella prove collassata — sforzo **M**

- **Cosa:** griglia dei 7 capitoli con conteggi e stato di studio; le 69 prove dentro `<details>` chiuso; «Da dove partire» resta.
- **Dove:** `web/js/pages/home.js`, `web/css/pages/home.css`.
- **Perché aiuta:** Brilliant dichiara livello e promessa per corso; MIT OCW mette il percorso prima dei materiali. La tabella con 67 «NON TROVATO» è **rumore** che nasconde la struttura (N10).
- **Criterio di accettazione:** nel primo viewport a 390×844 compaiono h1, i 3 link «Da dove partire» e **tutti e 7** i capitoli; la stringa `NON TROVATO` compare **≤ 3 volte** nel testo visibile della pagina; il `<details>` delle prove è chiuso al primo caricamento (`open === false`); e2e: 7 card capitolo cliccabili verso `#/area/<n>`.

### P6 — Copertina di capitolo (rotta `#/area/<n>`) — sforzo **M**

- **Cosa:** nuova pagina per area con numero, titolo (da `graph.meta.aree`), conteggi, «Che cosa saprai fare» (3 voci dai `saper_fare`), «Da dove cominciare» (nodo senza prerequisiti hard), elenco in ordine topologico, nav capitolo precedente/successivo. Link da home, grafo e breadcrumb della scheda nodo.
- **Dove:** nuovo `web/js/pages/area.js` + `web/css/pages/area.css`, `web/js/app.js` (rotta), `web/js/pages/grafo.js` (titolo area cliccabile), `web/sw.js`/`web/build.sh` (precache, owner D1).
- **Perché aiuta:** è la «copertina di capitolo» che manca (N1): dà il **contesto** prima dei dettagli, che è ciò che MOS:Mathematics chiama motivazione e che i manuali fanno con la pagina di apertura.
- **Criterio di accettazione:** 7 rotte rispondono; ogni pagina mostra **≥ 1** criterio per nodo? no — mostra **≥ 3** criteri totali presi dai `saper_fare` e **0** testo inventato (test: ogni frase di «Che cosa saprai fare» è contenuta in un `saper_fare` del grafo); elenco nodi = esattamente i nodi di quell'area (confronto con `graph.json`); nessun link a `#/nodo/<id>` inesistente.

### P7 — Tassonomia dei blocchi e colore semantico — sforzo **S**

- **Cosa:** nuovi token di §5.1 e classi di §5.2; `errori_frequenti` reso con tre righe etichettate (Errore / Perché è sbagliato / Correzione) invece di un callout unico; `.verifica` piccolo e in fondo.
- **Dove:** `web/css/tokens.css`, `web/css/components.css`, `web/js/pages/{nodo,dim}/*`.
- **Perché aiuta:** Tufte riserva il colore alle figure e usa i grigi per il testo; noi abbiamo 4 toni per 8 tipi (N9), quindi il colore non insegna nulla. Con 6 tipi distinti il lettore riconosce il **tipo di informazione** a colpo d'occhio, e può decidere di saltare.
- **Criterio di accettazione:** in ogni scheda nodo compaiono **≥ 4** tipi di blocco distinti con sfondi calcolati diversi; ogni coppia testo/sfondo ha contrasto ≥ 4.5:1 (A14 verde); test node `classificaBlocco(campo)` mappa 1:1 campo → classe.

### P8 — Chiusura di pagina: riepilogo, verifica, prossimo passo — sforzo **S/M**

- **Cosa:** blocco `.fine-pagina` in fondo a ogni nodo e ogni dimostrazione: 3 righe (`riepilogo` o `versione_compatta`), 2 domande (`richiamo_attivo`), nav «precedente / prossimo».
- **Dove:** `web/js/pages/nodo.js`, `web/js/pages/dim/finale.js`, nuovo helper puro `web/js/layout/sequenza.js` (`prossimoNodo(graph, id)` e `nodoPrecedente`).
- **Perché aiuta:** Feynman ha il «Summary» separato; i manuali hanno il «Chapter Summary»; la ricerca su ripasso attivo (già in `DIDATTICA.md` §2.4) dice che chiudere con recall batte il rileggere. Oggi il riepilogo è un callout fra altri sei (N10/N12).
- **Criterio di accettazione:** regola deterministica documentata in `docs/` (nessun ordine «a occhio»): successore = primo nodo, in ordine `(priorita alta→media→bassa, area, id)`, che ha il nodo corrente fra i prerequisiti **hard**; se non esiste, successore = successivo dell'elenco topologico di `docs/PIANO_STUDIO.md`. Test: funzione pura con fixture (nessun ciclo, nessun nodo irraggiungibile dai 56); e2e: 0 pagine senza nav; il link «prossimo» di `dim-teorema-campionamento` punta a un nodo esistente.

### P9 — Note a margine per varianti di notazione e punti aperti — sforzo **M**

- **Cosa:** `.nota-margine` + `label.nota-toggle` (meccanismo Tufte, senza JS); contenuti **solo** da campi esistenti: `varianti_notazione` e `verifica.punti_aperti`.
- **Dove:** `web/css/components.css`, `web/js/pages/dim/sezioni.js` e `fonti.js`, `web/css/pages/{dimostrazione,nodo}.css`.
- **Perché aiuta:** Tufte: le note non devono far saltare l'occhio a fondo pagina; a 1440 px abbiamo ~500 px di margine inutilizzato (N7). Le varianti (`ω` vs `m`, `1/(πT)` vs `1/(2πT)`) sono precisamente il tipo di informazione che va **accanto** al punto in cui serve, non in un blocco finale.
- **Criterio di accettazione:** a 1440 px la nota ha bbox a destra della colonna di lettura e non si sovrappone ad alcun elemento (rect check); a 390 px la nota è **in linea** sotto il paragrafo (l'etichetta `nota-toggle` è `display:none` e il contenuto visibile); funziona con JS disabilitato (e2e con `java_script_enabled=False`); le note sono `<aside role="note">` raggiungibili da tastiera quando visibili.

### P10 — Foglio di stile per la stampa — sforzo **S/M**

- **Cosa:** `web/css/print.css` collegato con `media="print"`: nascondere header/nav/tabs/controlli, **mostrare tutti i passi**, `break-inside: avoid` su figure e formule, `@page { margin: 16mm }`, niente `position: fixed`, link con URL visibile solo se utile.
- **Dove:** nuovo `web/css/print.css`, `web/index.html`, `web/build.sh` (precache), `web/tests/test_e2e_stampa.py`.
- **Perché aiuta:** lo studente stampa le dimostrazioni per ripassare fuori casa; oggi stamperebbe una pagina con i passi nascosti e la barra fissa in basso su ogni foglio. Nessun riferimento lo fa esplicitamente, ma è la pratica quotidiana dei manuali di ingegneria.
- **Criterio di accettazione:** e2e con `page.emulate_media(media="print")` su 2 `#/dim`: `header`, `.nav-principale`, `.dim-controlli` hanno `display:none`; **tutti** i `.step__corpo` sono visibili (`offsetHeight > 0`) anche senza aver premuto «Mostra tutti»; nessun elemento con `position: fixed`; `@media print` presente nel CSS caricato.

### P11 — Checkpoint di capitolo verso il quiz — sforzo **M**

- **Cosa:** su ogni copertina di capitolo, 3 domande campione dell'area (da `web/quiz.json`, campo `area`) e link `#/quiz?area=<n>` che filtra la banca.
- **Dove:** `web/js/pages/area.js` (nuovo), `web/js/pages/quiz.js`, `web/modules/quiz/**` (W6), `web/css/pages/quiz.css`.
- **Perché aiuta:** 3b1b mette la domanda **dentro** il flusso; Khan organizza la pratica per unità. Oggi la verifica vive in una pagina separata e non è collegata al capitolo.
- **Criterio di accettazione:** `#/quiz?area=3` mostra solo elementi con `area === 3` (conteggio verificato contro `quiz.json`); le 3 domande in copertina hanno la risposta **non presente** nel DOM prima del click (test: nessun elemento con la soluzione finché `aria-expanded="false"`); 0 domande di aree diverse.

### P12 — Comandi di lettura (dimensione testo, tema, stampa) — sforzo **M** *(facoltativo, valutare)*

- **Cosa:** tre controlli discreti nel footer o nell'header: `A− / A / A+` (varia `--fs-body` su `<html>` con persistenza in `tlc-kg:impostazioni:v1`), tema chiaro/scuro già previsto da `prefers-color-scheme`, link «Stampa».
- **Dove:** `web/js/layout/shell.js`, `web/js/core/store.js`, `web/css/tokens.css` (classe `html[data-tema]`).
- **Perché aiuta:** Feynman offre esattamente `A A A` + dark + stretch: chi legge 2.000 parole su schermo regola la lettura. Costo contenuto, beneficio reale ma non didattico: da fare solo dopo P1–P8.
- **Criterio di accettazione:** la dimensione scelta persiste al reload e resta entro i limiti A3 (17–20 px); il tema scuro supera A14 su tutte le rotte; nessun layout shift > 0.1 (CLS misurato in e2e).

### P13 — Permalink ai passi e alle sezioni — sforzo **S**

- **Cosa:** `#/dim/<id>?passo=4` apre la modalità Studio con i passi fino al 4 rivelati e porta in vista il passo; `#/nodo/<id>#s2` funziona (gli `id` esistono già). Un pulsante «copia link» accanto a ogni passo.
- **Dove:** `web/js/pages/dim/stato.js` + `index.js`, `web/js/pages/nodo.js`, `web/js/router.js`.
- **Perché aiuta:** Stacks Project costruisce l'intera enciclopedia su permalink stabili; poter dire «rifai il passo 4 di T1» trasforma il sito in materiale condivisibile (studio di gruppo).
- **Criterio di accettazione:** aprendo `#/dim/dim-teorema-campionamento?passo=4` `aria-valuenow` del `.progress` vale 4 e `#passo-4` ha il focus; il parametro **non** altera il salvataggio dello stato se non richiesto; test node su `parsePasso(query)` (0, 1, n, fuori range → clamp).

### P14 — Navigazione sequenziale visibile (capitolo precedente/successivo) — sforzo **S**

- **Cosa:** barra in fondo a ogni nodo e dimostrazione (già prevista in P8) **più** frecce in testa alla copertina di capitolo, con numeri («Capitolo 2 di 7»).
- **Dove:** `web/js/layout/sequenza.js` (nuovo), pagine.
- **Perché aiuta:** Feynman `◄ ▲ ►`; un manuale si legge in sequenza. Oggi ogni pagina è un vicolo cieco con un solo «Torna al concetto».
- **Criterio di accettazione:** 0 pagine senza nav sequenziale; l'ordine usato è **lo stesso** di `docs/PIANO_STUDIO.md` (test che confronta la sequenza calcolata con il documento generato).

### Cosa manca per «sembrare un manuale curato» — riepilogo richiesta utente

| Elemento chiesto | Stato oggi | Voce |
|---|---|---|
| Copertina di capitolo | **assente** | P6 |
| Numerazione | assente su sezioni e figure | P3, P4 |
| «Perché ti serve» | il dato esiste, non è un box e sta dopo l'amministrazione | P2 |
| Storia / scenario | `scenario` esiste ma è sotto «Contesto e obiettivo» | P2 |
| Analogie | `analogia` + `limite` esistono, arrivano **dopo** la spiegazione | P2 |
| Riepilogo a fine pagina | esiste come callout indistinto, in mezzo ad altre sezioni | P8 |
| Indice laterale | solo su `/dim`, solo ≥1024 px | P3 |
| Progress | buono su `/dim` (barra + indice passi), **assente** su nodo/area | P3, P6 |
| Grafici passo per passo | **assenti** (5 coppie, 0 assi coerenti) | **P1** |

---

## 8. Cosa NON fare

1. **Non cambiare gli schemi** (`schema/*.json`) né aggiungere campi a `figure` o `passi` per ottenere l'animazione: il Pattern A (§5.4) ottiene lo stesso effetto con i campi esistenti. Un `stati[]` sarebbe un cambio di contratto e va chiesto al coordinatore, non applicato.
2. **Non introdurre Manim, video o GIF**: le animazioni di 3b1b sono un artefatto di produzione audiovisiva. Qui servono **stati discreti** e testo; un video non è ricercabile, non è stampabile, non è accessibile e pesa. Se si anima, solo CSS ≤ 600 ms, una volta, con `prefers-reduced-motion`.
3. **Non imitare Tufte in tutto**: Tufte CSS dichiara sé stesso «a starting point, not a design goal». Due livelli di titolo e note a margine sì; eliminare i colori di stato, il tema scuro o i chip di accessibilità no (i nostri test A14/A13 li richiedono).
4. **Non spostare le note fuori dallo schermo su mobile**: su 390 px le note a margine devono tornare inline (Tufte le nasconde dietro un toggle; per noi sarebbe una perdita, perché le nostre note contengono varianti di notazione **d'esame**).
5. **Non aggiungere testo didattico nuovo inventato**: ogni frase visibile nuova deve derivare da un campo esistente o essere un'etichetta di interfaccia. Niente «storie» del tipo «nel 1876 Bell…» senza fonte: i fatti storici del corso stanno in `reti-concetti-introduttivi` e non vanno duplicati altrove.
6. **Non rendere `NON TROVATO` invisibile**: la correttezza è un requisito (CONTRACTS §10). Si può **collassare** (P5) ma non eliminare o abbellire: è un'informazione onesta, va solo tolta dalla prima pagina.
7. **Non mettere il grafico finale come «anteprima» all'inizio**: annulla l'effetto del P1. Il disegno completo si vede solo alla fine; al massimo una silhouette con «10 passi».
8. **Non usare `!important`, `overflow-x: hidden` o maschere** per far passare i test di layout: REDESIGN_PLAN §2 lo vieta esplicitamente e i test A1/A2 lo verificano.
9. **Non duplicare l'indice**: se P3 introduce `.scheda__indice` e D3 ha già `.dim-indice`, vanno unificati in **un** componente (`web/js/layout/indice.js`) invece di due implementazioni divergenti.
10. **Non fare «dark mode» prima di P1–P8**: è la voce a costo/beneficio peggiore e riapre tutti i test di contrasto.

---

## 9. Domande aperte per il coordinatore

1. **P1 richiede lavoro di contenuti** (W3/W4/W5) su file di `graph/dimostrazioni/*.json`: è lavoro didattico, non di design. Va assegnato esplicitamente; il criterio di accettazione (assi identici tra passi consecutivi) è già scrivibile come test e non cambia gli schemi.
2. **P6 introduce una rotta nuova** (`#/area/<n>`) e quindi un file `web/js/pages/area.js` + `area.css` + precache: serve l'ok del coordinatore perché tocca `web/build.sh` e `web/sw.js` (owner D1).
3. **P11 tocca `web/modules/quiz/**`** (scope W6): serve accordo con W6 sul parametro `?area=`.
4. **P12 (comandi di lettura)** va deciso: utile ma non didattico, e tocca i test di tipografia.
5. **N14 (doppia lettura delle figure)**: decidere la convenzione — `<title>`/`<desc>` brevi + didascalia lunga in HTML (raccomandato) oppure didascalia `aria-hidden`. Riguarda W2/T2 (D2).

---

## 10. Fonti (URL aperti il 30 ottobre 2026)

Tutti gli URL elencati sono stati **aperti**; quelli non accessibili sono dichiarati nel §2.2.

1. Khan Academy — *Signals and systems* (unità 6): https://www.khanacademy.org/science/electrical-engineering/ee-signals
2. Khan Academy — sotto-unità *Fourier series*: https://www.khanacademy.org/science/electrical-engineering/ee-signals/ee-fourier-series
3. Brilliant — catalogo corsi: https://brilliant.org/courses/
4. Distill — Wattenberg, Viégas, Johnson, *How to Use t-SNE Effectively* (2016): https://distill.pub/2016/misread-tsne/
5. Distill — *About*: https://distill.pub/about/
6. 3Blue1Brown — *But what is the Fourier Transform? A visual introduction*: https://www.3blue1brown.com/lessons/fourier-transforms
7. Manim Community: https://www.manim.community/
8. Feynman Lectures on Physics, Vol. I, cap. 1: https://www.feynmanlectures.caltech.edu/I_01.html
9. Wikipedia — *Manual of Style/Mathematics*: https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Mathematics
10. Wikipedia — *Fourier transform*: https://en.wikipedia.org/wiki/Fourier_transform
11. Stacks Project — sezione 1.1, tag 0001: https://stacks.math.columbia.edu/tag/0001
12. MIT OpenCourseWare — 6.003 *Signals and Systems*, Lecture Notes: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/pages/lecture-notes/
13. Bartosz Ciechanowski — *Gears*: https://ciechanow.ski/gears/
14. Better Explained — *Developing Your Intuition For Math*: https://betterexplained.com/articles/developing-your-intuition-for-math/
15. Dave Liepmann / Edward Tufte — *Tufte CSS*: https://edwardtufte.github.io/tufte-css/
16. Edward Tufte — *Beautiful Evidence* (pagina prodotto): https://www.edwardtufte.com/book/beautiful-evidence/
17. B. P. Lathi, Zhi Ding — *Modern Digital and Analog Communication Systems*, 5ª ed. (OUP): https://global.oup.com/academic/product/modern-digital-and-analog-communication-9780190686864
18. A. V. Oppenheim, A. S. Willsky, S. H. Nawab — *Signals and Systems* (Pearson New International Edition): https://www.pearson.com/en-gb/subject-catalog/p/signals-and-systems-pearson-new-international-edition/P200000005151/9781292025902
19. Allen B. Downey — *Think DSP*: https://greenteapress.com/wp/think-dsp/ ; capitolo 1 in HTML: http://greenteapress.com/thinkdsp/html/thinkdsp002.html
20. Sito del corso (verifica dello stato attuale): https://jaski99.github.io/telecomunicazioni/

**NON TROVATO (dichiarato):** lezione singola Brilliant (paywall); pagine interne di Haykin *Communication Systems* e Proakis *Digital Communications*; interno dei libri di Tufte; screenshot e misure Playwright (§2.3).
