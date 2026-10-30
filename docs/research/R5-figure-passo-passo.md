# R5 — Figure passo per passo nelle 18 dimostrazioni

Ricognizione sul commit `074d1c9c2aaa1646d721977f25e89950edba50ac`, 30 ottobre 2026. Documento di ricerca; nessun codice, schema o dato modificato.

## Sintesi in 10 righe

1. **FATTO:** 18 dimostrazioni, 116 passi, 39 figure; 35 passi hanno un riferimento a una figura.
2. **FATTO:** le figure sono 17 grafici, 16 schemi a blocchi e 6 temporali; i riferimenti non equivalgono a stati progressivi.
3. **FATTO:** Studio mostra la figura del passo quando lo rivela; le figure non richiamate sono in «Figure generali».
4. **FATTO:** campionamento, PAM e ALOHA possiedono già componenti utili, ma non una costruzione coordinata su tutti i passi chiave.
5. **FATTO:** lo schema corrente vieta proprietà aggiuntive; un nuovo campo richiede esplicita autorizzazione, non è compatibile oggi.
6. **PROPOSTA:** una figura autonoma per stato, puntata dall'esistente `passi[].figura`, è già retrocompatibile e verificabile.
7. **PROPOSTA:** usare SVG generato dai renderer esistenti, assi fissi, descrizione per stato e differenziazione non solo cromatica.
8. **PROPOSTA:** accostare finestre temporali e curve ALOHA; distinguere nello spettro PAM densità continua e masse delle righe.
9. **IPOTESI:** le priorità seguenti valutano il beneficio didattico, non frequenze d'esame o fedeltà al libro non dimostrate.
10. **NON TROVATO:** confronto diretto di tutti i disegni con l'edizione del libro del professore; serve revisione umana delle fonti.

## Metodo, evidenze e limiti

**FATTI.** Lettura di `docs/CONTRACTS.md`, `docs/DIDATTICA.md`, `docs/REDESIGN_PLAN.md`, `docs/research/R1-prof-programma-esame.md`, `R2-manuali-dimostrazioni.md`, `R3-analisi-materiale.md`; censimento dei 18 JSON in `graph/dimostrazioni/`, compresi passi, formule, figure, ipotesi e verifica; controllo dei tre renderer in `web/js/figure/`, di `web/js/pages/dimostrazione.js`, dei moduli `web/js/pages/dim/` e degli stili `web/css/`. I conteggi sono ricavati dai file, non da impressioni visive. Gli stati `verificata_file1_file3` sono 9, `da_verificare` 7, `ricostruzione_non_del_prof` 2: sono metadati del repo, non una nuova verifica indipendente del testo. Edizione e disegni originali del libro consultati direttamente in questa ricerca: **NON TROVATO**. R1 segnala che non ha consultato testo e indice; non chiamare un disegno ricostruito «del professore». Le fonti FILE1/FILE2/FILE3 sono riferimenti interni ai JSON, non URL inventati; R3 registra limiti e punti aperti. In caso di conflitto fermarsi e chiedere confronto su copia autorizzata.

**FATTI di implementazione.** `figure/index.js` cerca una figura per ID e smista a `grafico.js`, `blocchi.js`, `temporale.js`; in errore cade su testo. Il grafico converte punti in coordinate SVG, usa serie linea/tratteggio/righe/punti, annotazioni e legenda HTML: non interpreta formule né calcola funzioni. Il layout a blocchi dispone colonne/righe, collegamenti e etichette (`blocchi-layout.js`, `blocchi-forme.js`); il temporale dispone corsie, intervalli, frecce e marcatori. `helpers.js` crea `title`, `desc`, legenda e `figcaption`; controllare in assistive technology la semantica annidata `role=img` e ID duplicati quando lo stesso ID figura è renderizzato in più passi. `dim/passi.js` crea il disegno solo al primo rivelo; `studio.js` mantiene progressione/indietro/mostra tutti e `stato.js` salva il numero di passi. `dim/dati.js` considera generali solo figure non associate. `figure.css` usa scroll locale; non è un motore di stati o animazione. L'ingrandimento automatico degli assi in `grafico.js` in base ai punti e l'assegnazione della palette per indice possono far saltare scala e colori tra stati: da testare esplicitamente.

**Rischi osservati:** nel passo 1 di `dim-risposta-impulsiva-h` è collegato `quadripolo-ingresso-generico`, che descrive x e convoluzione, non D e y. In `dim-impulso-dirac-trasformata` passo 2 il testo parla di intorno destro, mentre con D(a−t,Δ) supportato su [0,Δ] l'intervallo della variabile di integrazione è [a−Δ,a]: sinistro. Segnalazioni da verificare con coordinatore e fonti prima di cambiare testo o figura. In campionamento il passo 4 richiama la catena anziché i bordi degli spettri; lo spettro già mostrato al passo 2 contiene repliche separate, benché il passo 3 discuta il caso generale. Il caso limite di Nyquist richiede precisazioni sul bordo, non va presentato come garanzia incondizionata per ogni segnale. In PAM le figure esistenti rappresentano, rispettivamente, coefficienti di Fourier e solo un inviluppo normalizzato, non automaticamente lo spettro di potenza totale nelle stesse unità.

## Censimento: fatti e progetto passo per passo

Ogni intestazione identifica esattamente `graph/dimostrazioni/<id>.json`. Colonna «Ora»: `—` significa **nessuna figura associata a quel passo**, non che manchino figure generali; altrimenti è l'ID realmente associato. Colonna «Da disegnare» è **proposta/ipotesi**: Sì = utile alla comprensione, Opz. = preferibile solo se non appesantisce. Le linee illustrative non provano il caso generale. Assi e valori sono simbolici, salvo esempi espliciti. Le figure eventualmente già disponibili ma non associate sono riportate sotto la tabella.

### dim-teorema-campionamento
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | x(nT), campioni | — | Sì: t/T e x(t), curva liscia e punti a nT, indicare T. |
| 2 | ripetizione Xs e 1/T | spettro-e-repliche | Sì: asse ω, modulo normalizzato, centrale −ωm…ωm; aggiungere repliche a ±ωs e fattore 1/T esplicito. |
| 3 | spettro e repliche | — | Sì: stessa scala; disegnare anche caso distinto sovrapposto ωs<2ωm con regione di aliasing, non sostituire la somma di spettri complessi con somma di moduli. |
| 4 | condizione non sovrapposizione | catena-campionamento-ricostruzione | Sì: confrontare ωm e ωs−ωm, tacca ωs/2; caso limite con avvertenza. |
| 5 | isolamento, guadagno T | — | Sì: repliche attenuate, finestra passa-basso ±π/T e replica centrale recuperata; etichetta T. |
| 6 | antitrasformata | — | Opz.: stessa finestra ±π/T, freccia verso dominio t; il disegno non giustifica lo scambio limite/integrale. |
| 7 | interpolazione sinc | seno-cardinale-ricostruzione | Sì: t/T e ampiezza, sinc traslate pesate e somma illustrativa; zeri ai multipli interi e campioni. |
| 8 | ortogonalità | — | Opz.: due sinc traslate e indicazione prodotto integrato zero, distinguendo zeri puntuali e ortogonalità integrale. |
Figure presenti: `spettro-e-repliche`, `seno-cardinale-ricostruzione`, `catena-campionamento-ricostruzione`.

### dim-pam-due-spettri
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | media, potenza, g e φ | — | Sì: t/T e ampiezza, impulso g esemplificativo con durata esplicita e alcuni simboli aₙ. |
| 2 | generazione s(t) | generatore-pam | Sì: associare allo schema forma d'onda con impulsi g traslati e ampiezze aₙ. |
| 3 | s=sₘ+x, centratura | — | Sì: tre tracciati allineati nel tempo: s, componente media e componente centrata; legenda e media. |
| 4 | coefficienti e righe | spettro-a-righe-pam | Sì: ω≥0, tacche k·2π/T; righe, loro pesi e valore medio, non confondere coefficienti con potenza. |
| 5 | autocorrelazione e densità | — | Opz.: assi τ,C(τ) con C(0) e freccia trasformata verso ω,Gx. |
| 6 | doppia somma | — | Sì: due copie g(t−nT), g(t+τ−iT) su asse t; evidenziare sovrapposizione, n e i. |
| 7 | autocorrelazione traslata | — | Sì: stesso disegno, traslazione τ−(i−n)T e area prodotto come φ, non semplice area di intersezione in generale. |
| 8 | i=n+k, pesi Ck | — | Sì: τ orizzontale, φ(τ−kT) centrate a kT e pesate Ck/T, con esempio dichiarato. |
| 9 | spettro distribuito | spettro-distribuito-pam | Sì: ω≥0, curva densità Gx e fattore \|G\|² separatamente; Ck=0 per k≠0 solo nell'esempio. |
| 10 | spettro totale e simboli originari | — | Sì: due pannelli con asse ω comune, densità continua e masse discrete, stessa frequenza di riferimento; non sommare visivamente altezze di unità diverse. |
Figure presenti: `generatore-pam`, `spettro-a-righe-pam`, `spettro-distribuito-pam`; il secondo grafico non è il totale.

### dim-aloha-throughput
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | τ, G e ρ | — | Opz.: asse t/τ con trama 0…1, etichette b/R e tentativi/trame riuscite. |
| 2 | finestra vulnerabile 2τ | aloha-finestra-puro | Sì: trama t…t+τ, inizi concorrenti t−τ…t+τ e collisioni precoci/tardive; confini ideali. |
| 3 | probabilità zero eventi | — | Sì: stessa finestra evidenziata, N=0 e P=e⁻²ᴳ, distinguendo eventi degli altri tentativi. |
| 4 | ρ=Ge⁻²ᴳ | — | Sì: assi G,ρ, sola curva pura, origine; massimo non anticipato. |
| 5 | slotted, ρ=Ge⁻ᴳ | aloha-finestra-slotted | Sì: slot τ e collisione nello stesso slot; poi curva slotted su stessi assi del passo 4. |
| 6 | massimi | aloha-throughput-grafico | Sì: entrambe curve, massimi (0,5; 1/2e≈0,184), (1; 1/e≈0,368), tangenti orizzontali. |
Presenti entrambe le finestre e grafico finale: mancano stati per probabilità e curva pura intermedia.

### dim-conversione-ad
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | banda e ωs | — | Sì: ω, \|X\|, bordi ±ωm e frequenza ωs>2ωm. |
| 2 | campioni x(nT) | campionamento | Sì: t, ampiezza, curva e punti nT, T. |
| 3 | quantizzazione | — | Sì: stessi campioni, livelli q₁…qL, frecce campione→livello e errore; esempio senza saturazione. |
| 4 | codifica b bit | — | Sì: tabella/etichette di esempio L=4, b=2, q₁…q₄→00,01,10,11; non universale. |
| 5 | Rb=b/T | — | Opz.: t con due parole adiacenti lunghe T e b bit/parola; nessun overhead. |
Già presenti `campionamento` e `catena` (quest'ultima generale); stato fonte `da_verificare`.

### dim-conversione-da
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | decodifica parole | — | Sì: schema parole→decoder→livelli qₙ; esempio codice dichiarato. |
| 2 | PAM quantizzato | — | Sì: t, ampiezza, impulsi g(t−nT) pesati qₙ; tacche nT. |
| 3 | PAM ideale | — | Sì: confronto qₙ con x(nT), precisare ipotesi di quantizzazione trascurata. |
| 4 | repliche pesate G/T | — | Sì: ω e modulo, repliche centrate 0, ±ωs e inviluppo G/T. |
| 5 | filtro e compensazione | repliche | Sì: banda utile ±ωm, replica centrale selezionata, indicazione T/G; G non nullo. |
| 6 | impulso breve | — | Sì: ω, G(ω)=τ sinc(ωτ/2), fascia ±ωm quasi piatta τ; esempio τ≪T. |
| 7 | errore di quantizzazione | — | Sì: t e ampiezza, x e xr illustrativi, differenza e(t) marcata. |
Presenti `catena`, `repliche`; stato `da_verificare`.

### dim-csma-cd-throughput
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | slot 2Tp, a | csma-cd-contesa | Sì: corsie A/B, istanti e 2Tp rispetto a Tf; conservare esempio Tf=1 s, Tp=0,25 s. |
| 2 | A=Np(1−p)ᴺ⁻¹ | — | Sì: slot con N stazioni e un solo tentativo, distinguere slot vuoto/collisione. |
| 3 | massimo A | — | Sì: p orizzontale, A verticale; esempio N=2, massimo p=1/2, A=1/2. |
| 4 | attese geometriche | — | Sì: sequenza i slot falliti di 2Tp poi frame riuscito, etichette 1−A e A. |
| 5 | durata ciclo e S | csma-cd-throughput-grafico | Sì: timeline media con Tf e 2Tp E[w], frazione utile; grafico finale qui non chiarisce la divisione. |
| 6 | Smax(a,N) | — | Sì: a sull'asse x da 0 a 0,5, Smax sull'asse y, N=2 e N=10, limite a=0. |
Presenti `csma-cd-contesa`, `csma-cd-throughput-grafico`; modello e interpretazione di a `da_verificare`.

### dim-filtro-trasversale
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | filtro ricorrente | schema-filtro-ricorrente-semplificato | Sì: rami ingresso/uscita, ritardi T, pesi hₖ/h′ₖ, sommatore e retroazione; segnare semplificazione. |
| 2 | equazione y | — | Sì: stesso schema, evidenziare progressivamente ciascun ramo e rispettivo termine. |
| 3 | trasformazione ritardi | — | Sì: su ogni ramo kT→e⁻ʲᵏωᵀ, X e Y etichettati. |
| 4 | rapporto H | — | Opz.: schema retroazione con numeratore e denominatore identificati; periodicità solo dove definita. |
| 5 | h′=0 | schema-filtro-trasversale | Sì: attenuare/rimuovere retroazione e mantenere prese h₀…hN−1. |
| 6 | puro ricorrente | — | Sì: h₀=1, altre prese ingresso nulle, retroazione rimasta. |
| 7 | poli/zeri | ampiezza-h-trasversale-esempio | Opz.: affiancare esempio H e distinzione poli/zeri; non dedurre poli dal solo modulo senza analisi. |
Tre figure presenti; schema ricorrente è dichiarato semplificato.

### dim-formula-carson
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | fase sinusoidale | — | Opz.: t, fase eccedente β sin ωmt; ampiezza β. |
| 2 | deviazione massima | — | Sì: t e frequenza istantanea ωi, ω₀±βωm e Δωmax. |
| 3 | righe laterali | — | Sì: ω, righe ω₀+nωm, tacche spaziate ωm, altezza dichiarata schematica. |
| 4 | ordine significativo | — | Sì: stesse righe, evidenziare \|n\|≈β+1 come stima, non taglio esatto. |
| 5 | banda approssimata | — | Sì: parentesi da ω₀−(β+1)ωm a ω₀+(β+1)ωm, Bω≈2(β+1)ωm. |
`righe-carson` è generale, ampiezze non calcolate; **ricostruzione_non_del_prof**.

### dim-impulso-dirac-trasformata
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | rettangolo area unitaria | impulso-ausiliario-d | Sì: t, D, larghezza Δ, altezza 1/Δ, area 1; esempio Δ=0,5. |
| 2 | media pesata | — | Sì: t, x(t), intervallo [a−Δ,a] e D(a−t,Δ); correggere prima incongruenza testuale segnalata sopra. |
| 3 | limite della media | — | Sì: intervalli via via più stretti e x(a), area dell'impulso sempre 1; non disegnare δ come funzione ordinaria. |
| 4 | convoluzione con δ | — | Sì: asse τ, freccia in τ=t e coefficiente x(t), spiegazione distribuzionale. |
| 5 | somma di rettangoli | — | Sì: t, x continua, rettangoli campionati con larghezza Δ e pesi x(nΔ)Δ. |
| 6 | selezione dell'esponenziale | — | Opz.: τ=0, etichetta eʲω·⁰=1; diagramma concettuale. |
| 7 | trasformata δ | — | Sì: ω orizzontale e trasformata 1, linea costante, non modulo di δ nel tempo. |
| 8 | limite trasformata rettangolo | trasformata-impulso-ausiliario | Sì: ω e modulo sinc per due Δ, linea 1; fase separata se discussa. |
Presenti impulso e modulo della trasformata, solo due stati associati.

### dim-modulazione-prodotto-qam-errore-fase
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | demodulazione DSB-SC | catena | Sì: s→moltiplicatore 2cos(ω₀t−Δ)→LPF, etichette banda base e 2ω₀. La figura `catena` descrive QAM, verificare pertinenza. |
| 2 | filtro, x cos Δ | — | Sì: ω e modulo esemplificativo, banda base conservata, termini ±2ω₀ eliminati. |
| 3 | QAM | modulatore-qam | Sì: rami x₁ cos e −x₂ sin, sommatore e s. |
| 4 | oscillatori locali | demodulatore-qam | Sì: due rami e riferimenti 2cos, −2sin, Δ esplicito. |
| 5 | prodotto-somma | — | Opz.: spettro diviso in banda base e ±2ω₀, frecce verso LPF. |
| 6 | x̂₁ | — | Sì: evidenziare ramo I, contributi x₁cosΔ e −x₂sinΔ. |
| 7 | x̂₂ | — | Sì: ramo Q, x₂cosΔ e +x₁sinΔ; rotazione nel piano I/Q con convenzione dei segni del JSON. |
| 8 | Δ=0 | — | Sì: stessi assi I/Q e vettore coincidente con originale; niente interferenza incrociata. |
Tre schemi disponibili; stato `da_verificare`.

### dim-nascita-morte-equilibrio
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | tassi transizioni | catena-nascita-morte | Sì: nodi 0,1,…,N; frecce λk verso destra, μk+1 verso sinistra; bordi. |
| 2 | bilancio in k | — | Sì: ingrandire k−1,k,k+1, frecce entranti λk−1pk−1, μk+1pk+1 e uscenti λkpk, μkpk. |
| 3 | bilancio 0 | — | Sì: soli 0↔1 con λ₀p₀=μ₁p₁. |
| 4 | flussi vicini | — | Sì: evidenziare coppia k↔k+1 e uguaglianza λkpk=μk+1pk+1; motivare induzione. |
| 5 | prodotto e normalizzazione | — | Opz.: catena di rapporti p₁/p₀, p₂/p₁, … e somma pₖ=1. |
`catena-nascita-morte` già esiste; il renderer attuale usa blocchi/frecce, non un tipo catena dedicato.

### dim-pm-fm-trasformazione
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | fase PM | — | Sì: assi t e θ, messaggio m e fase kp m su scale dichiarate. |
| 2 | fase FM | — | Sì: t, m e integrale con θ₀ evidenziato; esempio m sinusoidale. |
| 3 | integratore→PM | pm-verso-fm | Sì: blocchi integratore, guadagno kf/kp, offset θ₀/kp, PM. |
| 4 | derivatore→FM | fm-verso-pm | Sì: derivatore, guadagno kp/kf, FM, segnale derivabile. |
| 5 | fase iniziale | — | Sì: stessi assi θ(t), due curve allineate solo se θ₀=kp m(t₀), marcare t₀. |
Due catene esistenti; **ricostruzione_non_del_prof**.

### dim-poisson-tempo-residuo
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | sopravvivenza e⁻λt | poisson-distribuzione-residuo | Sì: t, P(X>t), curva decrescente 1→0; figura attuale è invece ripartizione crescente. |
| 2 | F e densità | — | Sì: t, F=1−e⁻λt e densità λe⁻λt in pannelli separati con unità. |
| 3 | condizionamento | — | Sì: linea t con 0, t₀, t₀+r, nessun evento fino a t₀ e intervallo residuo. |
| 4 | semplificazione | — | Sì: stessi istanti, etichette e⁻λ(t₀+r)/e⁻λt₀=e⁻λr. |
| 5 | CDF e media | — | Sì: r, F_R=1−e⁻λr, esempio λ=0,5 s⁻¹; a parte area sotto sopravvivenza =1/λ. |
Figura esistente `poisson-distribuzione-residuo`: CDF, non sopravvivenza.

### dim-quadripoli-passa-basso-equivalente
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | inviluppi ingresso/uscita | quadripoli | Sì: parallelo s→H→sr e i→H₀→ir; etichettare inviluppi complessi. |
| 2 | Sr=HS | — | Sì: ω, banda positiva e negativa, H e prodotto; esempio esplicitamente schematico. |
| 3 | traslazione e fattore 2 | traslazione-spettrale | Sì: pannelli ω centrato ω₀ e Ω=ω−ω₀ centrato zero, bordi ±Bω/2, fattore 2. |
| 4 | sostituzione H | — | Sì: stessa traslazione con H(ω₀+Ω) moltiplicato alla banda positiva. |
| 5 | Ir=H traslata I | — | Opz.: blocco I→H(ω₀+Ω)→Ir, dominio Ω. |
| 6 | definizione H₀ | — | Sì: asse Ω, H₀(Ω)=H(Ω+ω₀) per Ω≥−ω₀, zero altrove; indicare convenzione e banda utile. |
| 7 | applicazione equivalente | — | Sì: confronto blocchi delle due catene, limite a banda disgiunta. |
Presenti `quadripoli`, `traslazione-spettrale`.

### dim-risposta-impulsiva-h
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | risposta a D | quadripolo-ingresso-generico | Sì: D(t,Δ)→Q→y(t), area D=1; la figura associata mostra invece ingresso generico. |
| 2 | limite h | — | Sì: stessa catena, Δ→0 e y→h nel senso del corso. |
| 3 | ingresso δ | quadripolo-risposta-impulsiva | Sì: δ→Q→h, indicare simbolo distribuzionale. |
| 4 | causalità | risposta-impulsiva-causale-esempio | Sì: t,h(t), zero per t<0, esempio causale a destra; non implicare che causalità basti alla realizzabilità. |
| 5 | scomposizione ingresso | — | Sì: asse τ, x(τ)dτ e δ(t−τ) con posizione τ; rappresentazione simbolica. |
| 6 | convoluzione | — | Sì: t, contributo x(τ)h(t−τ)dτ e somma/integrale, evidenziare τ≤t in caso causale. |
| 7 | trasformata della risposta a D | — | Sì: D→Q→y e sotto F[D]→H→F[y]. |
| 8 | H=F[h] | — | Sì: δ→Q→h e 1→H→H, freccia Fourier e inverse; indicare condizioni del limite. |
Presenti `quadripolo-ingresso-generico`, `quadripolo-risposta-impulsiva`, `risposta-impulsiva-causale-esempio`.

### dim-ritardo-tdma-fdma
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | T, slot, ritardo | tdma-fdma-confronto-temporale | Sì: t/T, M=4, quattro slot TDMA e corsie FDMA, generazione iniziale; T e T/M. |
| 2 | DFD=T | — | Sì: evidenziare corsie FDMA parallele dall'inizio alla fine T, ωFD=0. |
| 3 | ωm=(m−1)T/M | — | Sì: evidenziare esempio m=3, attesa 2T/M e trasmissione T/M. |
| 4 | attesa media | — | Sì: barre d'attesa 0,T/M,…,(M−1)T/M con media T(1−1/M)/2. |
| 5 | confronto ritardi | — | Sì: barre DTD e DFD per M=4 (5T/8 e T), distinguere attesa e trasmissione. |
Figura presente: `tdma-fdma-confronto-temporale`; ipotesi sulla media e modello `da_verificare`.

### dim-sliding-window-efficienza
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | Tf e TT | finestra-con-attesa | Sì: corsie mittente/ricevitore, F/C, I, A/C, I e inizio/fine TT. |
| 2 | capacità ciclo CTT | — | Sì: stessa timeline, evidenziare TT e numero di bit CTT senza confonderlo con soli dati utili. |
| 3 | finestra insufficiente | finestra-con-attesa | Sì: esempio W=2, TT=3 s, due frame da 1 s, pausa 2…3, WD utile. |
| 4 | saturazione | finestra-continua | Sì: esempio W=4, TT=3 s, frame consecutivi e primo ACK; η=D/F. |
| 5 | minimo e A=H | — | Sì: W orizzontale, η verticale, retta WD/(CTT) e plateau D/F, soglia W=CTT/F; W intero segnato a punti. |
Presenti due timeline; stato `da_verificare`, A=H solo ipotesi dichiarata.

### dim-spettri-modulazione-prodotto
| n | Calcolo | Ora | Disegno proposto |
|---|---|---|---|
| 1 | s=x cos | — | Sì: x→moltiplicatore←cos ω₀t, uscita s, schema `catena` già generale. |
| 2 | esponenziali portante | — | Opz.: ω con righe a ±ω₀ etichettate 1/2, convenzione della trasformata da precisare per i pesi impulsivi. |
| 3 | traslazione spettri | — | Sì: ω, \|X\| in banda base e copie dimezzate centrate ±ω₀; ω₀>ωm. |
| 4 | banda superiore | — | Sì: ω₀…ω₀+ωm, evidenziare Ω>0 e ½X(Ω). |
| 5 | banda inferiore | — | Sì: ω₀−ωm…ω₀, evidenziare ½X*(Ω), riflessione. |
| 6 | ampiezze e fasi | fase | Sì: pannelli ampiezza e fase, coppie ω₀±Ω, ±φ(Ω), solo dove spettro non nullo. |
Presenti `catena`, `ampiezza`, `fase`; ultime due sono esempi schematici; stato `da_verificare`.

## Modello progressivo: proposta senza cambiare il contratto

**Decisione proposta — stati espliciti, non nuovi campi.** Ogni stato è una figura completa distinta in `figure[]`, con un ID kebab-case; il passo usa l'attuale `figura` come puntatore. Il renderer e lo schema restano quelli esistenti. Le vecchie dimostrazioni non cambiano comportamento; lo stato non associato rimane tra le figure generali. È una sequenza di istantanee statiche distribuite nei passi, non un unico canvas aggiornato: funziona oggi in avanti, indietro, «Mostra tutti» e al reload perché ogni passo usa sempre il proprio ID. Per non anticipare il risultato, gli stati futuri devono restare nei passi nascosti, non in figure generali. La scala comune e le coordinate notevoli si ripetono esplicitamente. La novità si differenzia con tratto continuo vs tratteggiato, etichette e legenda; l'attenuazione non deve abbassare contrasto e leggibilità. Non fare affidamento sul colore o su palette diverse per indice. In ogni stato `descrizione` descrive anche cosa cambia rispetto al precedente; coordinate simboliche e ipotesi si spiegano a voce.

**Alternativa futura, non autorizzata:** una figura con `stati` e un puntatore `stato_figura` nel passo può ridurre duplicazioni, ma `additionalProperties: false` in entrambi gli schemi la rifiuta. Non è un'aggiunta accettata oggi. Solo con approvazione del coordinatore: versionare `schema/figura.schema.json`, `schema/dimostrazione.schema.json` e `docs/CONTRACTS.md`, validare stato/ID/tipologia/referenze, definire fallback per JSON vecchi e client vecchi; decidere migrazione, build, precache e test. Non applicarla come parte di R5. Possibili transizioni di opacità ≤150 ms solo tra stati della stessa scala, disattivate con `prefers-reduced-motion: reduce`, senza autoplay e senza trasmettere informazioni solo col movimento. La soluzione statica è il primo rilascio; nessuna transizione è necessaria.

### Tre esempi JSON completi di figure e associazioni

Sono **fixture di progetto**, non documenti dimostrazione interi né modifiche al grafo. Ogni oggetto ha due chiavi: `figure` contiene figure complete secondo la forma attuale; `associazioni` è una mappa di istruzioni per il revisore, non un campo da inserire nel JSON della dimostrazione. Sostituire solo il valore `figura` dei passi indicati e aggiungere le figure nell'array esistente, preservando tutti gli altri campi obbligatori e le figure originali; la mappa non va salvata in `graph/`. Le coordinate sono esempi normalizzati espliciti, non nuove ipotesi generali. I tre esempi non sono stati applicati né validati come patch del grafo. Verifica eseguita in R5: i nove oggetti figura sono validi rispetto a `schema/figura.schema.json` con JSON Schema Draft 2020-12; associazioni tutte risolte nella rispettiva fixture. Non è una verifica dell’inserimento nei documenti completi né del rendering.

#### Campionamento

Esempio ωm=2, ωs=6 e ordinate normalizzate a 1/T; la prima istantanea prepara il passo 2, la ripetizione è esplicita al 3. Prima di produrre la patch, valutare se mostrare la replica già al passo 2 insieme alla centrale: il testo della formula la menziona.

```json
{
  "figure": [
    {
      "id": "camp-progressivo-1",
      "tipo": "grafico",
      "titolo": "Spettro centrale",
      "descrizione": "Esempio normalizzato: spettro triangolare centrale tra meno omega emme e omega emme. Il passo successivo aggiunge repliche; il fattore uno su T è omesso dalla scala normalizzata.",
      "asse_x": {
        "etichetta": "ω (unità normalizzate)",
        "min": -9,
        "max": 9,
        "tacche": [
          {
            "valore": -6,
            "etichetta": "−ωs"
          },
          {
            "valore": -2,
            "etichetta": "−ωm"
          },
          {
            "valore": 0,
            "etichetta": "0"
          },
          {
            "valore": 2,
            "etichetta": "ωm"
          },
          {
            "valore": 4,
            "etichetta": "ωs−ωm"
          },
          {
            "valore": 6,
            "etichetta": "ωs"
          }
        ]
      },
      "asse_y": {
        "etichetta": "Ampiezza normalizzata",
        "min": 0,
        "max": 1.3
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "Centrale, k = 0",
          "punti": [
            [-2, 0],
            [0, 1],
            [2, 0]
          ]
        }
      ]
    },
    {
      "id": "camp-progressivo-2",
      "tipo": "grafico",
      "titolo": "Repliche periodiche",
      "descrizione": "Nello stesso esempio si aggiungono le repliche tratteggiate a più e meno omega esse; tutte le altezze sono normalizzate, mentre la formula reale include uno su T.",
      "asse_x": {
        "etichetta": "ω (unità normalizzate)",
        "min": -9,
        "max": 9,
        "tacche": [
          {
            "valore": -6,
            "etichetta": "−ωs"
          },
          {
            "valore": -2,
            "etichetta": "−ωm"
          },
          {
            "valore": 0,
            "etichetta": "0"
          },
          {
            "valore": 2,
            "etichetta": "ωm"
          },
          {
            "valore": 4,
            "etichetta": "ωs−ωm"
          },
          {
            "valore": 6,
            "etichetta": "ωs"
          }
        ]
      },
      "asse_y": {
        "etichetta": "Ampiezza normalizzata",
        "min": 0,
        "max": 1.3
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "Centrale, k = 0",
          "punti": [
            [-2, 0],
            [0, 1],
            [2, 0]
          ]
        },
        {
          "stile": "tratteggio",
          "etichetta": "Replica a +ωs",
          "punti": [
            [4, 0],
            [6, 1],
            [8, 0]
          ]
        },
        {
          "stile": "tratteggio",
          "etichetta": "Replica a −ωs",
          "punti": [
            [-8, 0],
            [-6, 1],
            [-4, 0]
          ]
        }
      ]
    },
    {
      "id": "camp-progressivo-3",
      "tipo": "grafico",
      "titolo": "Bordi senza sovrapposizione",
      "descrizione": "La replica centrale finisce a omega emme, pari a due, e quella successiva inizia a omega esse meno omega emme, pari a quattro. Qui omega esse è sei e supera due omega emme; l’uguaglianza richiede cautela ai bordi.",
      "asse_x": {
        "etichetta": "ω (unità normalizzate)",
        "min": -9,
        "max": 9,
        "tacche": [
          {
            "valore": -6,
            "etichetta": "−ωs"
          },
          {
            "valore": -2,
            "etichetta": "−ωm"
          },
          {
            "valore": 0,
            "etichetta": "0"
          },
          {
            "valore": 2,
            "etichetta": "ωm"
          },
          {
            "valore": 4,
            "etichetta": "ωs−ωm"
          },
          {
            "valore": 6,
            "etichetta": "ωs"
          }
        ]
      },
      "asse_y": {
        "etichetta": "Ampiezza normalizzata",
        "min": 0,
        "max": 1.3
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "Centrale, k = 0",
          "punti": [
            [-2, 0],
            [0, 1],
            [2, 0]
          ]
        },
        {
          "stile": "tratteggio",
          "etichetta": "Replica a +ωs",
          "punti": [
            [4, 0],
            [6, 1],
            [8, 0]
          ]
        },
        {
          "stile": "tratteggio",
          "etichetta": "Replica a −ωs",
          "punti": [
            [-8, 0],
            [-6, 1],
            [-4, 0]
          ]
        }
      ],
      "annotazioni": [
        {
          "x": 2,
          "y": 0,
          "testo": "ωm = 2"
        },
        {
          "x": 4,
          "y": 0,
          "testo": "ωs − ωm = 4"
        }
      ]
    }
  ],
  "associazioni": {
    "2": "camp-progressivo-1",
    "3": "camp-progressivo-2",
    "4": "camp-progressivo-3"
  }
}
```

#### PAM: due contributi

Esempio particolare T=1 s, g rettangolare di durata T/2, media non nulla e Cₖ=0 per k≠0. Coefficienti di Fourier e densità sono normalizzati separatamente: le righe di potenza hanno masse proporzionali al quadrato dei coefficienti, non le altezze della prima figura. Il terzo stato segnala solo posizioni delle righe; non pretende di sommare grandezze di unità diverse. A k=2 il coefficiente è zero e il relativo punto indica la griglia armonica, non una massa non nulla.

```json
{
  "figure": [
    {
      "id": "pam-progressivo-righe",
      "tipo": "grafico",
      "titolo": "PAM: righe periodiche",
      "descrizione": "Esempio con T pari a un secondo, impulso rettangolare di durata T diviso due e media non nulla: modulo normalizzato dei coefficienti periodici alle armoniche non negative. Le altezze non sono densità di potenza.",
      "asse_x": {
        "etichetta": "ω (rad/s, T = 1 s)",
        "min": 0,
        "max": 19,
        "tacche": [
          {
            "valore": 0,
            "etichetta": "0"
          },
          {
            "valore": 6.2832,
            "etichetta": "2π/T"
          },
          {
            "valore": 12.5664,
            "etichetta": "4π/T"
          }
        ]
      },
      "asse_y": {
        "etichetta": "Valore normalizzato (schema)",
        "min": 0,
        "max": 1.2
      },
      "serie": [
        {
          "stile": "righe",
          "etichetta": "Coefficienti periodici, modulo schematico",
          "punti": [
            [0, 1],
            [6.2832, 0.6366],
            [12.5664, 0],
            [18.8496, 0.2122]
          ]
        }
      ]
    },
    {
      "id": "pam-progressivo-continuo",
      "tipo": "grafico",
      "titolo": "PAM: parte distribuita",
      "descrizione": "Stesso impulso e simboli centrati incorrelati tra istanti diversi: la densità continua è proporzionale a sinc quadro di omega T diviso quattro. È normalizzata e non include le righe.",
      "asse_x": {
        "etichetta": "ω (rad/s, T = 1 s)",
        "min": 0,
        "max": 19,
        "tacche": [
          {
            "valore": 0,
            "etichetta": "0"
          },
          {
            "valore": 6.2832,
            "etichetta": "2π/T"
          },
          {
            "valore": 12.5664,
            "etichetta": "4π/T"
          }
        ]
      },
      "asse_y": {
        "etichetta": "Valore normalizzato (schema)",
        "min": 0,
        "max": 1.2
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "Inviluppo continuo normalizzato",
          "punti": [
            [0.0, 1],
            [0.5, 0.9948],
            [1.0, 0.97934],
            [1.5, 0.954],
            [2.0, 0.9194],
            [2.5, 0.87639],
            [3.0, 0.82601],
            [3.5, 0.76947],
            [4.0, 0.70807],
            [4.5, 0.64323],
            [5.0, 0.57637],
            [5.5, 0.50891],
            [6.0, 0.44222],
            [6.5, 0.37759],
            [7.0, 0.31616],
            [7.5, 0.25892],
            [8.0, 0.20671],
            [8.5, 0.16012],
            [9.0, 0.11958],
            [9.5, 0.08531],
            [10.0, 0.05731],
            [10.5, 0.0354],
            [11.0, 0.01926],
            [11.5, 0.0084],
            [12.0, 0.00221],
            [
              12.5,
              3e-05
            ],
            [13.0, 0.00111],
            [13.5, 0.0047],
            [14.0, 0.01004],
            [14.5, 0.01644],
            [15.0, 0.02323],
            [15.5, 0.02984],
            [16.0, 0.0358],
            [16.5, 0.04072],
            [17.0, 0.04435],
            [17.5, 0.04652],
            [18.0, 0.04719],
            [18.5, 0.04639],
            [19.0, 0.04426]
          ]
        }
      ]
    },
    {
      "id": "pam-progressivo-totale",
      "tipo": "grafico",
      "titolo": "PAM: lettura delle due componenti",
      "descrizione": "La curva mostra solo la densità continua normalizzata. I marcatori sulla linea zero indicano le frequenze delle masse discrete: le loro altezze e unità non sono confrontabili con la densità; vedere il grafico delle righe al passo quattro.",
      "asse_x": {
        "etichetta": "ω (rad/s, T = 1 s)",
        "min": 0,
        "max": 19,
        "tacche": [
          {
            "valore": 0,
            "etichetta": "0"
          },
          {
            "valore": 6.2832,
            "etichetta": "2π/T"
          },
          {
            "valore": 12.5664,
            "etichetta": "4π/T"
          }
        ]
      },
      "asse_y": {
        "etichetta": "Valore normalizzato (schema)",
        "min": 0,
        "max": 1.2
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "Inviluppo continuo normalizzato",
          "punti": [
            [0.0, 1],
            [0.5, 0.9948],
            [1.0, 0.97934],
            [1.5, 0.954],
            [2.0, 0.9194],
            [2.5, 0.87639],
            [3.0, 0.82601],
            [3.5, 0.76947],
            [4.0, 0.70807],
            [4.5, 0.64323],
            [5.0, 0.57637],
            [5.5, 0.50891],
            [6.0, 0.44222],
            [6.5, 0.37759],
            [7.0, 0.31616],
            [7.5, 0.25892],
            [8.0, 0.20671],
            [8.5, 0.16012],
            [9.0, 0.11958],
            [9.5, 0.08531],
            [10.0, 0.05731],
            [10.5, 0.0354],
            [11.0, 0.01926],
            [11.5, 0.0084],
            [12.0, 0.00221],
            [
              12.5,
              3e-05
            ],
            [13.0, 0.00111],
            [13.5, 0.0047],
            [14.0, 0.01004],
            [14.5, 0.01644],
            [15.0, 0.02323],
            [15.5, 0.02984],
            [16.0, 0.0358],
            [16.5, 0.04072],
            [17.0, 0.04435],
            [17.5, 0.04652],
            [18.0, 0.04719],
            [18.5, 0.04639],
            [19.0, 0.04426]
          ]
        },
        {
          "stile": "punti",
          "etichetta": "Posizioni delle righe, non altezze",
          "punti": [
            [0, 0],
            [6.2832, 0],
            [12.5664, 0],
            [18.8496, 0]
          ]
        }
      ]
    }
  ],
  "associazioni": {
    "4": "pam-progressivo-righe",
    "9": "pam-progressivo-continuo",
    "10": "pam-progressivo-totale"
  }
}
```

#### ALOHA: throughput

Il passo 5 usa già `aloha-finestra-slotted`: il contratto consente una sola figura per passo. La fixture dà priorità alla curva e non risolve da sola la contemporanea presenza della finestra; mantenerla tra le figure generali e cambiare la UX per mostrarla lì senza anticipazioni, oppure chiedere autorizzazione a una composizione multi-figura per passo. Non presentare lo slotted come modello di stabilità delle code.

```json
{
  "figure": [
    {
      "id": "aloha-progressivo-puro",
      "tipo": "grafico",
      "titolo": "ALOHA puro",
      "descrizione": "Curva del throughput puro, G per esponenziale di meno due G, da zero a tre tentativi per durata di trama. La curva slotted non è ancora mostrata.",
      "asse_x": {
        "etichetta": "Traffico G",
        "min": 0,
        "max": 3
      },
      "asse_y": {
        "etichetta": "Throughput ρ",
        "min": 0,
        "max": 0.42
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "ALOHA puro",
          "punti": [
            [0.0, 0.0],
            [0.1, 0.081873],
            [0.2, 0.134064],
            [0.3, 0.164643],
            [0.4, 0.179732],
            [0.5, 0.18394],
            [0.6, 0.180717],
            [0.7, 0.172618],
            [0.8, 0.161517],
            [0.9, 0.148769],
            [1.0, 0.135335],
            [1.1, 0.121883],
            [1.2, 0.108862],
            [1.3, 0.096556],
            [1.4, 0.085134],
            [1.5, 0.074681],
            [1.6, 0.06522],
            [1.7, 0.056735],
            [1.8, 0.049183],
            [1.9, 0.042504],
            [2.0, 0.036631],
            [2.1, 0.031491],
            [2.2, 0.02701],
            [2.3, 0.023119],
            [2.4, 0.019751],
            [2.5, 0.016845],
            [2.6, 0.014343],
            [2.7, 0.012195],
            [2.8, 0.010354],
            [2.9, 0.00878],
            [3.0, 0.007436]
          ]
        }
      ]
    },
    {
      "id": "aloha-progressivo-slot",
      "tipo": "grafico",
      "titolo": "Confronto con slotted",
      "descrizione": "Aggiunta tratteggiata la curva slotted G per esponenziale di meno G, sopra la curva del puro per G positivo.",
      "asse_x": {
        "etichetta": "Traffico G",
        "min": 0,
        "max": 3
      },
      "asse_y": {
        "etichetta": "Throughput ρ",
        "min": 0,
        "max": 0.42
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "ALOHA puro",
          "punti": [
            [0.0, 0.0],
            [0.1, 0.081873],
            [0.2, 0.134064],
            [0.3, 0.164643],
            [0.4, 0.179732],
            [0.5, 0.18394],
            [0.6, 0.180717],
            [0.7, 0.172618],
            [0.8, 0.161517],
            [0.9, 0.148769],
            [1.0, 0.135335],
            [1.1, 0.121883],
            [1.2, 0.108862],
            [1.3, 0.096556],
            [1.4, 0.085134],
            [1.5, 0.074681],
            [1.6, 0.06522],
            [1.7, 0.056735],
            [1.8, 0.049183],
            [1.9, 0.042504],
            [2.0, 0.036631],
            [2.1, 0.031491],
            [2.2, 0.02701],
            [2.3, 0.023119],
            [2.4, 0.019751],
            [2.5, 0.016845],
            [2.6, 0.014343],
            [2.7, 0.012195],
            [2.8, 0.010354],
            [2.9, 0.00878],
            [3.0, 0.007436]
          ]
        },
        {
          "stile": "tratteggio",
          "etichetta": "Slotted ALOHA",
          "punti": [
            [0.0, 0.0],
            [0.1, 0.090484],
            [0.2, 0.163746],
            [0.3, 0.222245],
            [0.4, 0.268128],
            [0.5, 0.303265],
            [0.6, 0.329287],
            [0.7, 0.34761],
            [0.8, 0.359463],
            [0.9, 0.365913],
            [1.0, 0.367879],
            [1.1, 0.366158],
            [1.2, 0.361433],
            [1.3, 0.354291],
            [1.4, 0.345236],
            [1.5, 0.334695],
            [1.6, 0.323034],
            [1.7, 0.310562],
            [1.8, 0.297538],
            [1.9, 0.28418],
            [2.0, 0.270671],
            [2.1, 0.257158],
            [2.2, 0.243767],
            [2.3, 0.230595],
            [2.4, 0.217723],
            [2.5, 0.205212],
            [2.6, 0.193111],
            [2.7, 0.181455],
            [2.8, 0.170268],
            [2.9, 0.159567],
            [3.0, 0.149361]
          ]
        }
      ]
    },
    {
      "id": "aloha-progressivo-massimi",
      "tipo": "grafico",
      "titolo": "Massimi delle due curve",
      "descrizione": "Massimo puro a G uguale a mezzo con throughput uno su due e, circa zero virgola 184; massimo slotted a G uguale a uno con throughput uno su e, circa zero virgola 368.",
      "asse_x": {
        "etichetta": "Traffico G",
        "min": 0,
        "max": 3
      },
      "asse_y": {
        "etichetta": "Throughput ρ",
        "min": 0,
        "max": 0.42
      },
      "serie": [
        {
          "stile": "linea",
          "etichetta": "ALOHA puro",
          "punti": [
            [0.0, 0.0],
            [0.1, 0.081873],
            [0.2, 0.134064],
            [0.3, 0.164643],
            [0.4, 0.179732],
            [0.5, 0.18394],
            [0.6, 0.180717],
            [0.7, 0.172618],
            [0.8, 0.161517],
            [0.9, 0.148769],
            [1.0, 0.135335],
            [1.1, 0.121883],
            [1.2, 0.108862],
            [1.3, 0.096556],
            [1.4, 0.085134],
            [1.5, 0.074681],
            [1.6, 0.06522],
            [1.7, 0.056735],
            [1.8, 0.049183],
            [1.9, 0.042504],
            [2.0, 0.036631],
            [2.1, 0.031491],
            [2.2, 0.02701],
            [2.3, 0.023119],
            [2.4, 0.019751],
            [2.5, 0.016845],
            [2.6, 0.014343],
            [2.7, 0.012195],
            [2.8, 0.010354],
            [2.9, 0.00878],
            [3.0, 0.007436]
          ]
        },
        {
          "stile": "tratteggio",
          "etichetta": "Slotted ALOHA",
          "punti": [
            [0.0, 0.0],
            [0.1, 0.090484],
            [0.2, 0.163746],
            [0.3, 0.222245],
            [0.4, 0.268128],
            [0.5, 0.303265],
            [0.6, 0.329287],
            [0.7, 0.34761],
            [0.8, 0.359463],
            [0.9, 0.365913],
            [1.0, 0.367879],
            [1.1, 0.366158],
            [1.2, 0.361433],
            [1.3, 0.354291],
            [1.4, 0.345236],
            [1.5, 0.334695],
            [1.6, 0.323034],
            [1.7, 0.310562],
            [1.8, 0.297538],
            [1.9, 0.28418],
            [2.0, 0.270671],
            [2.1, 0.257158],
            [2.2, 0.243767],
            [2.3, 0.230595],
            [2.4, 0.217723],
            [2.5, 0.205212],
            [2.6, 0.193111],
            [2.7, 0.181455],
            [2.8, 0.170268],
            [2.9, 0.159567],
            [3.0, 0.149361]
          ]
        }
      ],
      "annotazioni": [
        {
          "x": 0.5,
          "y": 0.18394,
          "testo": "1/(2e)"
        },
        {
          "x": 1,
          "y": 0.367879,
          "testo": "1/e"
        }
      ]
    }
  ],
  "associazioni": {
    "4": "aloha-progressivo-puro",
    "5": "aloha-progressivo-slot",
    "6": "aloha-progressivo-massimi"
  }
}
```

## Tecniche offline e scelta

**FATTI:** [MDN SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) descrive SVG come formato vettoriale testuale integrabile con CSS, DOM e JS. Il repository ha già un renderer deterministico SVG per ciascuno dei tre tipi. [JSXGraph](https://jsxgraph.org/home/) offre grafici matematici interattivi e rendering SVG/canvas; [repository JSXGraph](https://github.com/jsxgraph/jsxgraph) ne rende disponibile il codice. [D3](https://github.com/d3/d3) è una libreria open source di visualizzazione, con codice e bundle nel repository. Le pagine sono state aperte per questa ricerca. Queste fonti non attestano la correttezza dei contenuti matematici del corso.

**Valutazione/proposta:** SVG manuale già esistente vince per poche dipendenze, test unitari, output testuale e offline; richiede però lavoro su layout, testi e stabilità delle scale. JSXGraph può essere utile per manipolazioni matematiche future, ma introduce un secondo motore, revisione di accessibilità e distribuzione locale; non necessario per fotogrammi statici. D3 è flessibile ma richiederebbe bundle/versione/licenza fissati e vendorizzati, precache e verifica offline; non introduce valore necessario al primo rilascio. Nessun CDN per il runtime. Per entrambe le librerie alternative: dimensione esatta del bundle adottato e compatibilità della versione scelta con la build corrente **NON TROVATO**, non assumere che siano già precacheate.

**Accessibilità:** ogni stato ha titolo e descrizione alternativa specifici, con assi, unità, elementi, novità e conclusione; per grafici complessi usare anche spiegazione visibile nella didascalia, come raccomanda il [W3C WAI per immagini complesse](https://www.w3.org/WAI/tutorials/images/complex/). Evitare annunci ripetuti quando si rivela un passo: focus e testo di progresso già esistono, provare lettori di schermo; generare ID SVG unici per istanza e verificare il nome/descrizione accessibile effettivo, non solo presenza di `<desc>`. Linee tratteggiate/punti/etichette oltre al colore; testo e legenda con contrasto adeguato. Su schermi stretti usare scroll locale accessibile da tastiera, non ridurre i caratteri. [MDN sulla media query prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) documenta la preferenza: in modalità ridotta disabilitare ogni transizione, senza cambiare informazioni o navigazione.

## Modifiche concrete prioritarie (proposte, non eseguite)

Stime: S = fino a 0,5 giornata, M = 1–2 giornate, L = 3–5 giornate; indicazioni di ordine di grandezza per un worker, esclusa verifica del libro e integrazione. Ogni intervento su dati o contratto richiede il coordinatore e revisione didattica; l'assegnazione finale non cambia la proprietà esistente in CONTRACTS/REDESIGN_PLAN.

| Priorità | Cosa e file proposti | Perché aiuta | Sforzo | Accettazione misurabile |
|---|---|---|---|---|
| P0 | Revisione dei disallineamenti in `graph/dimostrazioni/dim-impulso-dirac-trasformata.json`, `dim-risposta-impulsiva-h.json`, `dim-poisson-tempo-residuo.json`, con fonti e `verifica` | Non fissare un diagramma che contraddice la formula; prevenire errori di memoria. | M | Revisore documenta intervallo [a−Δ,a], figura D→Q→y e sopravvivenza decrescente al passo 1; nessuno stato di verifica promosso senza fonte. |
| P1 | Campionamento `graph/dimostrazioni/dim-teorema-campionamento.json` | Repliche, bordi e filtro rendono visibile la causa del vincolo di Nyquist. | M | Passi 2–5 hanno stati corrispondenti; punti ±ωm, ±ωs e ωs−ωm verificati; esempio separato e caso sovrapposto distinti, fattore 1/T spiegato. |
| P2 | PAM `graph/dimostrazioni/dim-pam-due-spettri.json` | La separazione media/parte centrata rende memorizzabili le due componenti. | L | Passi 2–4 e 6–10 con visualizzazione o rinvio esplicito: nessuna somma di densità e masse con unità uguali presunte; test dei valori per l'esempio, impulso e ipotesi coerenti. |
| P3 | ALOHA `graph/dimostrazioni/dim-aloha-throughput.json` | Finestra vulnerabile → probabilità → curve → massimi è una catena causale. | M | Almeno 2 finestre e 3 stati delle curve; massimi con tolleranza 10⁻³. È necessaria una modifica UX senza cambiare dati o, in alternativa, un contratto approvato per più figure per passo; senza essa questo criterio non è realizzabile integralmente. |
| P4 | Stati e qualità rendering in `web/js/figure/{index,helpers,grafico,blocchi-layout,blocchi-forme,blocchi,temporale}.js`, `web/css/figure.css` | Scale stabili e testi leggibili rendono confrontabili i fotogrammi. | L | Snapshot SVG deterministici per 3 tipi e piloti; etichette ≥12 px effettivi e non tagliate a 360/390/768/1440; nessuna informazione solo nel colore; niente movimento con preferenza ridotta. |
| P5 | `web/js/pages/dim/{passi,studio,dati,finale}.js`, `web/tests/dim-passi.test.js`, `web/tests/test_e2e_dim.py` | Più passi espliciti senza anticipazioni, navigazione conservata e descrizioni affidabili. | M | Avanti/indietro, mostra tutti, reload e tastiera mantengono ciascuno stato giusto; nessun duplicato ID DOM, nessuna figura futura in generali, nomi accessibili verificati. |
| P6 | A/D, D/A, finestra e TDMA nei quattro JSON corrispondenti in `graph/dimostrazioni/` | Collegare il calcolo a tempi, livelli e flussi, non a formule isolate. | L | Per ogni sequenza tutte le righe Sì della relativa tabella hanno figura o giustificazione tracciata; valori numerici di esempio controllati e stati `da_verificare` invariati finché non confermati. |
| P7 | Filtro, QAM, nascita-morte e CSMA/CD nei quattro JSON omonimi | Rami, retroazione e bilanci sono più chiari con evidenziazione locale. | L | Nei passi di bilancio e di filtraggio ogni freccia o ramo citato è etichettato e orientato; ipotesi del modello in didascalia. |
| P8 | Carson, PM/FM, Poisson, quadripoli e spettri prodotto nei relativi JSON | Separare approssimazioni e traslazioni dai casi esatti. | L | Etichetta «esempio» o «stima» dove pertinente, convenzioni di segno e fase iniziale esplicite; nessuna attribuzione non verificata. |

**Collaudo trasversale proposto.** Aggiornare `web/tests/figure.test.js` e i test dimostrazione, aggiungere `web/tests/test_e2e_figure_progressive.py` e fixture piccole in `web/tests/` secondo la proprietà concordata. Verificare validazione degli esempi innestati in copie complete dei tre JSON tramite `python scripts/kg.py build`, `python scripts/kg.py check`, `python scripts/check_testo.py`, `npm test --prefix web`, `pytest -q` (contratto: zero failed e zero skipped); verificare che le figure preesistenti restino valide e i riferimenti siano risolti. Assert numerici su coordinate e unità, non soltanto screenshot: Nyquist e 1/T, PAM coefficienti vs potenza, ALOHA ρ(0,5)=1/(2e), ρ(1)=1/e. Snapshot dell'SVG serializzato normalizzato, per ogni stato pilota e almeno un temporale e uno schema; approvare modifiche snapshot solo dopo revisione. Playwright alle quattro viewport previste da REDESIGN_PLAN, anche dopo «Mostra tutti» e con `reducedMotion: reduce`: controllare dimensione **resa** dei `svg text` ≥12 CSS px, tutti i bounding box dentro il viewBox e gli antenati non scrollabili, assenza sovrapposizioni delle etichette e accesso da tastiera alla regione scrollabile. Questa soglia proposta è più severa degli 11 px minimi A10 del piano; non abbassare altri criteri A1–A22. Confrontare nome/descrizione accessibile di ogni stato tramite accessibility tree e controllo manuale con screen reader; contrasto testo ≥4,5:1; differenziazione anche in scala di grigi. Verificare network offline dopo prima installazione e ricarica con cache popolata, senza 404, controllando `web/build.sh` e `web/sw.js`. Le figure nei passi nascosti non devono essere esposte o generare contenuto anticipato. Questi sono **test da implementare**, non risultati ottenuti da R5.

## Cosa NON fare

- Non aggiungere proprietà a JSON o schemi senza accordo sul contratto, né cambiare ID, notazione, ipotesi, `a_voce` o `a_buchi` incidentalmente.
- Non spacciare esempi schematici, approssimazioni, ricostruzioni o disegni creati qui per trascrizioni del libro o slide del docente; non inferire frequenza d'esame e punteggi.
- Non sommare moduli come se fossero spettri complessi; non presentare righe discrete e densità continue come se avessero le stesse unità.
- Non nascondere la cautela sul caso limite Nyquist, l'errore di quantizzazione, le ipotesi del traffico o la convenzione dei segni QAM.
- Non usare animazioni obbligatorie, soli colori, autoplay, scale che cambiano silenziosamente, SVG illeggibili o etichette tagliate. Non diminuire soglie/test esistenti.
- Non vendorizzare librerie non necessarie né scaricare asset da CDN a runtime; non versionare PDF, rendering dei PDF o screenshot.

## Ordine delle figure mancanti per valore didattico e divisione in worker

Graduatoria **IPOTESI**, basata sul numero di passaggi causali resi visibili, non su frequenze d'esame. Stime per singola dimostrazione, oltre alla base tecnica; sono stime e non impegni.

1. Campionamento: spettro→repliche→aliasing→bordi→filtro→sinc, **M**.
2. PAM: serie→componente periodica e centrata→due spettri, **L**.
3. ALOHA: finestre→probabilità→curve e massimi, **M**.
4. Impulso di Dirac: area, media e limite, **M**; correggere prima il disallineamento segnalato.
5. Risposta impulsiva: D→Q→y, δ→Q→h e convoluzione, **M**.
6. Conversione A/D: campioni→livelli→parole, **M**.
7. Conversione D/A: PAM→repliche→filtro/equalizzatore, **M**.
8. Sliding window: frame, ACK, attesa e saturazione, **M**.
9. Nascita-morte: flussi entranti/uscenti e bilancio, **M**.
10. TDMA/FDMA: attese e ritardi medi, **M**.
11. Filtro trasversale: prese, retroazione e specializzazioni, **L**.
12. Spettri modulazione prodotto: traslazioni e bande laterali, **M**.
13. QAM e fase: due rami e rotazione, **L**.
14. CSMA/CD: contesa e durata media ciclo, **M**.
15. Equivalente passa-basso: traslazione e H₀, **M**.
16. Poisson: sopravvivenza, intervallo condizionato, CDF, **M**.
17. PM/FM: integratore/derivatore e fase iniziale, **M**.
18. Carson: righe e stima di banda, **S**.

**Divisione proposta con file esclusivi, subordinata al coordinatore:**
- **F1, motore/accessibilità:** `web/js/figure/**`, `web/css/figure.css`, `web/tests/figure.test.js`, nuovo `web/tests/test_e2e_figure_progressive.py`; eventuali nuovi moduli precacheati tramite modifica di `web/build.sh` assegnata esclusivamente a F1.
- **F2, UX passi:** `web/js/pages/dim/**`, `web/tests/dim*.test.js`, `web/tests/test_e2e_dim.py`; si coordina con F1 sull'interfaccia pubblica di rendering. Non tocca `figure/**`.
- **F3, segnali di base:** solo `graph/dimostrazioni/dim-teorema-campionamento.json`, `dim-impulso-dirac-trasformata.json`, `dim-risposta-impulsiva-h.json`, `dim-filtro-trasversale.json`, `dim-pam-due-spettri.json`.
- **F4, conversione/modulazioni:** solo `dim-conversione-ad.json`, `dim-conversione-da.json`, `dim-formula-carson.json`, `dim-modulazione-prodotto-qam-errore-fase.json`, `dim-pm-fm-trasformazione.json`, `dim-quadripoli-passa-basso-equivalente.json`, `dim-spettri-modulazione-prodotto.json` nella stessa directory.
- **F5, reti/traffico:** solo `dim-aloha-throughput.json`, `dim-csma-cd-throughput.json`, `dim-nascita-morte-equilibrio.json`, `dim-poisson-tempo-residuo.json`, `dim-ritardo-tdma-fdma.json`, `dim-sliding-window-efficienza.json` nella stessa directory.
- **Coordinatore:** solo eventuali `docs/CONTRACTS.md`, `schema/*.json`, integrazione e rigenerazione dei file generati. Prima F1 definisce renderer/test, F2 integra l'interfaccia, F3–F5 preparano dati in parallelo senza toccare gli stessi file; revisione matematica e accessibilità indipendente prima del merge. Se si adotta la soluzione statica corrente, non occorrono cambi agli schemi. Nessun worker modifica i generati a mano.
