# R2 — Manuali e didattica delle dimostrazioni

Ricerca del 28 ottobre 2026. Solo ricerca; nessun contenuto qui è certificato come trascrizione della dimostrazione richiesta all'esame.

## 1. Sintesi in 10 righe

1. **Fatto:** la pagina didattica di Casoni rimanda a un libro di testo e a materiali distinti.
2. Il libro indicato è *Schemi delle lezioni di Comunicazioni Elettriche*, di L. Calandrino e G. Immovilli, Pitagora; non risulta scritto da Casoni.
3. Casoni ha anche materiali propri per reti, comunicazioni e accesso multiplo; l'indice dei capitoli del libro non è stato trovato.
4. Il significato e la corrispondenza delle pagine 2.13, 3.29 e 9.36 sono da verificare sull'edizione effettiva.
5. I passaggi seguenti sono ricostruzioni standard, **non** le prove del testo e non una promessa di conformità all'esame.
6. Baraniuk e MIT Oppenheim aiutano a visualizzare campionamento, Fourier e sistemi LTI.
7. Un programma MIT indica Bertsekas–Gallager e Tanenbaum come riferimenti per le reti, senza provare la corrispondenza delle singole pagine.
8. Per ogni formula di rete vanno dichiarati modello, normalizzazione e componenti del ritardo.
9. Le registrazioni Casoni sono elencate dalla sua pagina; accesso e contenuto effettivo non sono stati verificati.
10. Priorità: acquisire legalmente libro ed edizione, trascrivere la scaletta autorizzata e validarla col docente prima di chiamarla «fedele».

## 2. Tabella riassuntiva

Le voci A/D e D/A sono separate per ottenere 17 schede: la lista originale le raggruppa in una sola voce. «Fonte» indica un punto di partenza verificato, non necessariamente una dimostrazione completa dell'identico risultato.

| # | Tema | Punto di partenza verificato | Corrispondenza col testo d'esame |
|---|---|---|---|
| 1 | Campionamento | [B §10.2](#fonti) | NON TROVATO |
| 2 | Impulso e trasformata | [B cap. 1, 8](#fonti) | NON TROVATO |
| 3 | Filtro trasversale | [B cap. 4, 9](#fonti) | NON TROVATO |
| 4 | Risposta impulsiva, H | [B cap. 3, 8](#fonti) | NON TROVATO |
| 5 | PAM, due spettri | [B §10.2](#fonti), [V](#fonti) | NON TROVATO; definizione dei due spettri da accertare |
| 6 | Modulazione a prodotto | [V](#fonti), lezione 13 | NON TROVATO |
| 7 | Conversione A/D | [V2](#fonti), lezione 22 | NON TROVATO |
| 8 | Conversione D/A | [B §10.2](#fonti), [V](#fonti), lezione 17 | NON TROVATO |
| 9 | PM–FM | [U](#fonti), programma di confronto | NON TROVATO |
| 10 | Prodotto e QAM | [U](#fonti), [V](#fonti) | NON TROVATO |
| 11 | Quadripoli, equivalente passa-basso | [U](#fonti), reti lineari e modulazione | NON TROVATO |
| 12 | Sliding window | [R](#fonti), ambito protocolli di linea | NON TROVATO |
| 13 | Residuo Poisson | [E](#fonti), §5.3 | NON TROVATO |
| 14 | Nascita-morte | [R](#fonti), ambito code | NON TROVATO |
| 15 | ALOHA | [R](#fonti), ambito LAN | NON TROVATO |
| 16 | CSMA/CD e a | [R](#fonti), ambito LAN | NON TROVATO |
| 17 | Ritardo TDMA/FDMA | [R](#fonti), ambito reti e code | NON TROVATO |

## 3. Analisi dettagliata e evidenze

### 3.1 Fonti e limiti <a id="fonti"></a>

- **[C] FATTO:** [materiale didattico del docente](https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico): elenca «Libro di Testo», materiali su reti, comunicazioni elettriche, LAN, accesso multiplo, esercizi e registrazioni 2020–21. La [pagina libro](https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo) identifica L. Calandrino, G. Immovilli, *Schemi delle lezioni di Comunicazioni Elettriche*, Pitagora Editrice Bologna. Non indica edizione, indice o pagine. I PDF collegati non sono stati aperti con successo in questa ricerca: non attribuire loro formule specifiche. La pagina delle registrazioni è collegata da C ma il contenuto video non è stato verificato.
- **[C2] FATTO:** [catalogo BiblioMo](https://www.bibliomo.it/SebinaOpac/resource/lezioni-di-tecniche-di-interconnessione/MOD00899032) cataloga un altro libro, *Lezioni di tecniche di interconnessione*, Maurizio Casoni, Pitagora, 2006, consultabile presso biblioteca di ingegneria. Non è dimostrato che sia il testo con pagine indicate dallo studente.
- **[U] FATTO:** [programma UNIBO 2010/11](https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2010/323120), altro docente e altro corso, accosta Calandrino–Immovilli a Fourier, LTI, campionamento, PM, FM, QAM. È indizio di pertinenza, non indice del libro né prova del programma Casoni.
- **[B] FATTO:** Baraniuk et al., [*Signals and Systems*, indice online](https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)); [§10.2 campionamento e dimostrazione](https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Signal_Processing_and_Modeling/Signals_and_Systems_(Baraniuk_et_al.)/10%3A_Sampling_and_Reconstruction/10.02%3A_Sampling_Theorem), figura 10.2.1: repliche e aliasing. Numeri qui sono sezioni online, non pagine del libro d'esame.
- **[V] FATTO:** MIT OCW, Alan Oppenheim, [indice delle video-lezioni *Signals and Systems*](https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/video_galleries/video-lectures/): lezioni 4–5 convoluzione/LTI, 8–9 Fourier, 13–14 modulazione, 16–17 campionamento/interpolazione. Aperto l'indice, non verificata la riproduzione di ogni video. **[V2]** [MIT OCW, Dennis Freeman, indice video](https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/video_galleries/lecture-videos/), lezioni 21–24 campionamento, quantizzazione, modulazione; stessa limitazione.
- **[R] FATTO:** [syllabus MIT *Data Communication Networks*](https://ocw.mit.edu/courses/6-263j-data-communication-networks-fall-2002/pages/syllabus/) indica Bertsekas e Gallager, *Data Networks*, 2ª edizione, e Tanenbaum, *Computer Networks*, 4ª edizione, come testo e riferimento. Il syllabus dichiara protocolli di linea, code e LAN; non verifica pagine o singole dimostrazioni.
- **[E] FATTO:** [OpenStax *Statistics* §5.3](https://openstax.org/books/statistics/pages/5-3-the-exponential-distribution-optional): esponenziale, assenza di memoria e relazione con Poisson.
- **[K] FATTO:** [opzioni KaTeX](https://katex.org/docs/options): modalità display e output HTML+MathML, quest'ultimo predefinito; `trust` predefinito false.

**NON TROVATO:** indice dei capitoli del libro d'esame, edizione usata, pagine interne e collocazione delle 17 prove. Le pagine 2.13, 3.29, 9.36 sono indizi forniti dall'utente, interpretati come capitolo.pagina: **IPOTESI**, non attribuzione verificata a Calandrino–Immovilli o a un testo di Casoni. Non avendo i materiali dello studente non si può controllare. Richiedere frontespizio, indice e pagine pertinenti, oppure consultare una copia legale e concordare con il docente. Il peso delle dimostrazioni e la richiesta di identica notazione sono **contesto riferito dall'utente**, non verifica indipendente.

**Altri manuali richiesti:** Haykin, Lathi, Carlson, Proakis, Papoulis, Benedetto–Biglieri, Stallings: **NON TROVATO** un luogo nella specifica edizione aperto e verificato che dimostri l'identica prova. Non attribuire loro capitoli o pagine per plausibilità. Oppenheim è verificato come docente della serie V, non come pagina di manuale. Bertsekas–Gallager e Tanenbaum sono identificati in R, ma le pagine delle prove sono **NON TROVATO**. Prima di un confronto puntuale servono edizione, indice e pagina consultata.

### 3.2 Schede: scalette standard provvisorie

Notazione di lavoro, non Casoni: trasformata $X(\omega)=\int x(t)e^{-j\omega t}dt$, inversa con $1/(2\pi)$; $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$. Le scalette sono derivazioni indipendenti: se non sostenute direttamente dal paragrafo indicato vanno intese come **ricostruzioni da verificare**, non come contenuto localizzato nella fonte. Ogni riferimento rinvia a §3.1. Le idee grafiche marcate «proposta» sono nostre, non attribuite alla fonte.

#### 1. Teorema del campionamento nel tempo
**Enunciato e ipotesi.** Segnale di energia finita, banda $|f|\le B$, campioni ideali equispaziati, $f_s>2B$: ricostruzione ideale esatta; al limite occorre trattare gli estremi e le ipotesi funzionali.
1. Moltiplicare $x(t)$ per il pettine $\sum_n\delta(t-nT)$.
2. Trasformare: $X_s(\omega)=T^{-1}\sum_k X(\omega-k\omega_s)$.
3. Mostrare che le repliche non si sovrappongono; isolare quella centrale con passa-basso di guadagno $T$.
4. Antitrasformare: $x(t)=\sum_n x(nT)\operatorname{sinc}(t/T-n)$.
**Dove/didattica:** B §10.2 ha prova alternativa basata sui coefficienti di Fourier e figura con aliasing; V lezioni 16–17. Pagina d'esame NON TROVATO. **Errori:** confondere Hz e rad/s, omettere $1/T$, presentare il filtro ideale come realizzabile senza ritardo.

#### 2. Impulso e trasformata
**Enunciato/ipotesi:** $\delta$ è distribuzione di Dirac, $\int\delta(t)\varphi(t)dt=\varphi(0)$; con la convenzione dichiarata $\mathcal F\{\delta(t)\}=1$.
1. Definire l'azione sulla funzione di prova, non un valore infinito ordinario.
2. Applicare la proprietà di selezione all'esponenziale della trasformata.
3. Per $\delta(t-t_0)$ ottenere $e^{-j\omega t_0}$.
**Dove/didattica:** B indice cap. 1 e 8; V lezioni 8–9, copertura generale, pagina esatta NON TROVATO. Proposta: rettangoli di area unitaria che si restringono. **Errori:** confondere area e altezza, perdere la fase del ritardo.

#### 3. Filtro trasversale e $H(\omega)$
**Enunciato/ipotesi:** somma finita di copie ritardate: $y(t)=\sum_{k=0}^{N}a_kx(t-kT)$; componenti lineari ideali.
1. Identificare ogni ramo, ritardo e peso.
2. Trasformare i rami: $Y=X\sum_k a_ke^{-j\omega kT}$.
3. Quindi $H(\omega)=\sum_k a_ke^{-j\omega kT}$; in discreto sostituire $\omega T$ con frequenza normalizzata.
**Dove/didattica:** B cap. 4 e 9, analisi discreta; U menziona FIR. Proposta: schema a linea di ritardo con somme. Pagina e specifica prova NON TROVATO. **Errori:** segno dell'esponente, scambiare indice del ramo e tempo.

#### 4. Risposta impulsiva e $H(\omega)$
**Enunciato/ipotesi:** sistema lineare tempo-invariante, rappresentabile per convoluzione: $y=x*h$, $H=\mathcal F\{h\}$.
1. Decomporre $x$ come integrale di impulsi pesati.
2. Tempo-invarianza: la risposta a impulso traslato è $h(t-\tau)$.
3. Linearità porta alla convoluzione; Fourier trasforma la convoluzione nel prodotto $Y=HX$.
**Dove/didattica:** B cap. 3 e 8; V lezioni 4–5 e 9. Proposta: sovrapporre risposte a impulsi traslati. Pagina d'esame NON TROVATO. **Errori:** usare il risultato per sistemi non LTI; dimenticare le condizioni di esistenza o il senso distribuzionale.

#### 5. PAM e due spettri
**Enunciato/ipotesi:** qui «due spettri» è interpretato come campionamento impulsivo e PAM a mantenimento; la formulazione d'esame è **NON TROVATO**. Campioni ideali e impulso $p$ fissato.
1. $x_s=\sum_nx(nT)\delta(t-nT)$ e $X_s=T^{-1}\sum_k X(\omega-k\omega_s)$.
2. Generare PAM a impulsi sagomati $s=x_s*p$.
3. $S=P X_s$: lo spettro replica $X$ ed è pesato dall'inviluppo $P$; per un rettangolo compare una sinc con fase dipendente dalla posizione.
**Dove/didattica:** B §10.2 verifica il primo spettro, non la definizione dei due del testo; V 16–17. Proposta: repliche prima/dopo inviluppo, confrontare flat-top e campionamento naturale. **Errori:** confondere spettro di energia, potenza e trasformata del segnale; chiamare equivalente ogni forma PAM.

#### 6. Spettri della modulazione a prodotto
**Enunciato/ipotesi:** $s(t)=m(t)\cos\omega_ct$, $m$ trasformabile: $S(\omega)=\tfrac12[M(\omega-\omega_c)+M(\omega+\omega_c)]$.
1. Espandere il coseno in esponenziali.
2. Applicare traslazione di frequenza.
3. Disegnare entrambe le repliche, con fattore $1/2$; discutere la separazione se $m$ è limitato in banda.
**Dove/didattica:** V lezione 13; U conferma l'argomento nel programma di confronto, pagina NON TROVATO. Proposta: far scorrere la portante sul grafico. **Errori:** dimenticare banda negativa e metà ampiezza, confondere spettro del prodotto con suo modulo.

#### 7. A/D: tre passi
**Enunciato/ipotesi:** conversione schematica mediante campionamento, quantizzazione, codifica; eventuali filtri e sample-and-hold sono stadi fisici aggiuntivi.
1. Limitare la banda con filtro anti-alias e prelevare campioni.
2. Arrotondare ciascun campione a un livello ammissibile.
3. Codificare l'indice del livello in parole binarie; distinguere errore di quantizzazione e aliasing.
**Dove/didattica:** V2 lezione 22; U rappresentazione numerica, pagina NON TROVATO. Proposta: traccia a gradini e soglie. **Errori:** definire la quantizzazione come campionamento; assumere errore uniforme indipendente senza ipotesi.

#### 8. D/A
**Enunciato/ipotesi:** da codici a livelli analogici e ricostruzione; l'esattezza ideale riguarda campioni non quantizzati di un segnale limitato in banda.
1. Decodificare ciascuna parola in un livello.
2. Generare impulsi o livelli mantenuti, il cui spettro è pesato dalla risposta del mantenimento.
3. Filtrare le immagini spettrali e compensare se necessario la distorsione di apertura.
**Dove/didattica:** B §10.2 ricostruzione sinc; V lezione 17. Proposta: gradini, sinc e filtro. Pagina d'esame NON TROVATO. **Errori:** affermare che la ricostruzione elimina la perdita della quantizzazione.

#### 9. Trasformazione PM–FM
**Enunciato/ipotesi:** fase PM $\theta=\omega_ct+k_pm(t)$; fase FM $\theta=\omega_ct+k_f\int^t m(u)du$; costanti e inizializzazione dichiarate.
1. Derivare la fase istantanea: $\omega_i=\dot\theta$.
2. Per ottenere FM con un modulatore PM, integrare il messaggio e adeguare il guadagno.
3. Per ottenere PM con FM, derivare il messaggio e adeguare guadagno e fase iniziale.
**Dove/didattica:** U menziona PM e FM, non questa prova. Pagina esatta NON TROVATO. Proposta: messaggio, fase e frequenza su assi allineati. **Errori:** confondere fase e frequenza, ignorare costante d'integrazione, $2\pi$ tra Hz e rad/s.

#### 10. Modulatori/demodulatori a prodotto e QAM con errore di fase
**Enunciato/ipotesi:** canali I/Q limitati in banda, portanti ortogonali, filtro passa-basso ideale che elimina termini a $2\omega_c$.
1. Porre $s=I\cos\omega_ct-Q\sin\omega_ct$ e generare le due componenti con moltiplicatori.
2. Demodulare con $2\cos(\omega_ct+\phi)$ e $-2\sin(\omega_ct+\phi)$.
3. Dopo il filtro ottenere $\hat I=I\cos\phi+Q\sin\phi$, $\hat Q=Q\cos\phi-I\sin\phi$: rotazione e interferenza incrociata.
**Dove/didattica:** U include QAM e modulazione a prodotto; V lezione 13 per modulazione continua. Formula specifica e pagina NON TROVATO. Proposta: costellazione prima/dopo rotazione. **Errori:** cambiare segni senza dichiarare convenzione; omettere il fattore 2 o il filtro.

#### 11. Quadripoli lineari, oscillazioni modulate ed equivalente passa-basso
**Enunciato/ipotesi:** per sistema LTI reale e segnale a banda stretta attorno a $\omega_c>0$, $x=\Re\{u e^{j\omega_ct}\}$; con bande positive e negative separate, $v$ soddisfa $V(\Omega)=H(\omega_c+\Omega)U(\Omega)$.
1. Separare il segnale analitico dalla sua parte reale.
2. Applicare la risposta LTI nella banda positiva.
3. Traslare a frequenza base e definire $H_{bb}(\Omega)=H(\omega_c+\Omega)$; ricostruire $y=\Re\{v e^{j\omega_ct}\}$.
**Dove/didattica:** U elenca reti lineari e modulazione; dimostrazione specifica NON TROVATO. Proposta: coppie di spettri traslate con assi $\omega$ e $\Omega$. **Errori:** fattori 2 del segnale analitico, applicare l'equivalente a sistema tempo-variante o a bande sovrapposte.

#### 12. Efficienza sliding window
**Enunciato/ipotesi:** modello ideale senza errori, traffico sempre disponibile, ACK senza costo di trasmissione, finestra $W$, frame di durata $T_f$, propagazione unidirezionale $T_p$, elaborazione nulla: $\eta=\min\{1,W/(1+2T_p/T_f)\}$.
1. Disegnare trasmissione della prima trama e arrivo del relativo ACK dopo $T_f+2T_p$.
2. In tale ciclo si possono inviare al più $W$ trame, per tempo utile $WT_f$.
3. Dividere per il tempo di ciclo e saturare a 1; con header, ACK non nullo, errori o altre definizioni il risultato cambia.
**Dove/didattica:** R segnala protocolli di linea, non questa espressione. Pagina/prova C NON TROVATO. Proposta: timeline mittente/ricevitore e finestra mobile. **Errori:** doppio conteggio del RTT, dimenticare saturazione o overhead.

#### 13. Tempo residuo di un processo di Poisson
**Enunciato/ipotesi:** processo di Poisson omogeneo di tasso $\lambda>0$; da un istante deterministico il tempo al prossimo evento è esponenziale con media $1/\lambda$.
1. $P(R>r)=P(N(t+r)-N(t)=0)=e^{-\lambda r}$ per incrementi stazionari e indipendenti.
2. Derivare la densità $\lambda e^{-\lambda r}$.
3. Integrare la sopravvivenza: $E[R]=1/\lambda$; equivalentemente applicare l'assenza di memoria.
**Dove/didattica:** E §5.3 spiega memoria tramite tempo atteso tra clienti; R contesto code. Pagina d'esame NON TROVATO. **Errori:** estendere la proprietà a distribuzioni generiche o tassi variabili; confondere intervallo contenente l'osservazione con residuo.

#### 14. Probabilità di stato nascita-morte
**Enunciato/ipotesi:** catena continua su $0,1,\ldots$ con soli salti adiacenti, tassi $\lambda_n,\mu_n$, $\mu_0=0$, catena irriducibile non esplosiva e somma di normalizzazione finita.
1. In stazionarietà porre il flusso attraverso ogni frontiera uguale nei due sensi: $\pi_n\lambda_n=\pi_{n+1}\mu_{n+1}$.
2. Ricorrere: $\pi_n=\pi_0\prod_{k=0}^{n-1}\lambda_k/\mu_{k+1}$.
3. Determinare $\pi_0$ imponendo somma 1; verificare convergenza e condizioni per il limite.
**Dove/didattica:** R contesto code; localizzazione della derivazione NON TROVATO. Proposta: diagramma degli stati con frecce e flussi. **Errori:** usare la formula stazionaria come transitoria; normalizzare una serie divergente.

#### 15. Throughput ALOHA
**Enunciato/ipotesi:** tentativi complessivi, incluse ritrasmissioni, Poisson con carico $G$ per durata trama; trame uguali e collisione distruttiva. Puro: $S=Ge^{-2G}$; slotted sincronizzato: $S=Ge^{-G}$.
1. Individuare finestra vulnerabile: due durate nel puro, uno slot nello slotted.
2. Probabilità di nessun altro tentativo nella finestra: rispettivamente $e^{-2G}$ e $e^{-G}$.
3. Moltiplicare per il carico e derivare rispetto a $G$: massimi $1/(2e)$ e $1/e$.
**Dove/didattica:** R segnala reti locali, derivazione puntuale NON TROVATO. Proposta: timeline con finestre vulnerabili. **Errori:** chiamare $G$ solo traffico nuovo, dimenticare retransmissioni, ignorare stabilità del backlog.

#### 16. Throughput CSMA/CD in funzione di $a$
**Enunciato/ipotesi:** $a=T_p/T_f$; la produttività dipende anche da modello di contesa, numero di stazioni, persistenza, collisioni e carico. Una formula universale soltanto in funzione di $a$ **NON TROVATO**.
1. Definire ciclo rinnovante: trasmissione riuscita, contesa/collisioni, eventuali tempi morti.
2. Calcolare, sotto un modello esplicito, probabilità di successo per tentativo e numero medio di tentativi; ricavare durata media di contesa.
3. Dividere tempo utile per durata media del ciclo e sostituire $T_p=aT_f$; verificare i limiti e l'approssimazione scelta.
**Dove/didattica:** R ambito LAN; formula esatta, versione d'esame e fonte puntuale NON TROVATO. Proposta: timeline delle collisioni e grafico parametrico etichettato col modello. **Errori:** usare senza giustificazione una formula di efficienza massima come throughput a qualsiasi carico; confondere $T_p$ e RTT.

#### 17. Ritardo medio TDMA e FDMA
**Enunciato/ipotesi:** non esiste un valore unico senza modello di arrivo, numero di utenti, assegnazione, frame, distribuzione delle lunghezze e definizione del ritardo. Formula specifica del testo **NON TROVATO**.
1. Definire per entrambi i sistemi capacità totale, quota per utente e traffico; separare attesa, servizio, propagazione.
2. TDMA: calcolare attesa della prossima opportunità dalla distribuzione della fase di arrivo, poi aggiungere servizio e coda; ipotesi uniforme dà mezzo periodo di ciclo, solo per attesa residua senza backlog.
3. FDMA: calcolare servizio alla capacità della sottobanda e tempo di coda col modello scelto; confrontare a parità di traffico e risorse, includendo overhead.
**Dove/didattica:** R ambito code/reti; derivazione esatta NON TROVATO. Proposta: timeline slot contro bande e tabella di bilancio del ritardo. **Errori:** trascurare coda o servizio, applicare metà ciclo a ogni regime, confrontare larghezze di banda differenti.

### 3.3 Video e resa grafica

Video italiani: **NON TROVATO** un video il cui contenuto sia stato aperto e verificato; C elenca registrazioni italiane ma destinazione e visione non verificate. In inglese V e V2 offrono indici di lezioni universitarie: usarli per intuizione dopo la prova canonica, non come sostituti della notazione d'esame. La disponibilità effettiva di ciascun filmato non è stata verificata.

**Proposta tecnica, non codice:** formule KaTeX inline per simboli e display per ogni passaggio; mantenere HTML+MathML e controllare formule strette su mobile; isolare macro per scheda e lasciare `trust` disabilitato per input non fidati [K]. SVG originali con `viewBox`, testo/descrizione accessibile, assi e unità, legenda non affidata solo al colore. Spettri: repliche, supporti e scala; blocchi: direzioni, pesi e ritardi; timeline: istanti e intervalli espliciti. Mostrare un'alternativa testuale e non incorporare figure protette senza permesso.

## 4. Indicazioni concrete prioritarie

1. **Acquisizione e validazione — scheda fonti e nodo prova — S:** reperire libro, edizione, indice e pagine, confrontare con dispense/registrazioni e chiedere conferma al docente. Aiuta a evitare una prova corretta ma non conforme; non garantisce il voto.
2. **Provenienza per ogni prova — knowledge graph — M:** memorizzare fonte, edizione, pagina, ipotesi, simboli, ordine, grado di verifica e data; etichettare «NON VERIFICATA» finché manca il confronto. Evita falsi richiami al testo.
3. **Percorso dimostrazione — pagina di studio — M:** enunciato, prerequisiti, passi progressivi, giustificazione di ogni uguaglianza, verifica finale e prova a schermo vuoto; dopo validazione rispettare l'ordine originale. Favorisce l'esposizione orale autonoma.
4. **Confronto notazionale — a lato della prova — M:** mappa $f/\omega$, trasformate, segni I/Q, definizioni di carico e tempi; distinguere alternative standard dal percorso canonico. Riduce errori di conversione e segno.
5. **Grafici accessibili — schede campionamento, modulazione e rete — L:** SVG di repliche, blocchi e timeline sincronizzati ai passaggi; descrizione testuale e KaTeX accessibile. Rende visibili ipotesi e fattori critici.
6. **Autoverifica — grafo e quiz — M:** domande su ipotesi, passaggio mancante, errori e casi limite; ripasso dei prerequisiti prima della ripetizione. Allena la ricostruzione anziché il solo riconoscimento.
7. **Modelli di rete espliciti — schede 12–17 — M:** parametri modificabili, unità, ipotesi e limiti; non mescolare varianti CSMA/CD e TDMA/FDMA. Aiuta a motivare la formula in sede d'esame.

## 5. Cosa NON fare

- Non presentare queste scalette standard come identiche al libro o alle lezioni Casoni, né inventare pagine e capitoli.
- Non sostenere che il libro di Calandrino–Immovilli sia opera di Casoni, o che *Lezioni di tecniche di interconnessione* sia certamente il testo dell'esame.
- Non pubblicare lunghi estratti o scansioni senza diritti; fornire rimandi e spiegazioni originali.
- Non applicare formule di throughput o ritardo senza ipotesi, normalizzazioni, unità e condizioni di stabilità.
- Non sacrificare dimostrazione e accessibilità a animazioni decorative, quiz di sola memoria o risultati senza passaggi.
