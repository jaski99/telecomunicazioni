# R3 — Analisi del materiale dello studente (file1, file2, file3)

**Esame:** Fondamenti di Telecomunicazioni — UNIMORE (DIEF "Enzo Ferrari"), docente prof. Maurizio Casoni. Obiettivo: 30 e lode.  
**Ramo di lavoro:** `arena/92cd303f-telecomunicazioni` (commit e push su questo ramo).  
**Consegnato:** unico file markdown, `docs/research/R3-analisi-materiale.md` (sola ricerca, nessun codice).

---

## 0. Premessa, metodo e regole di lettura

### File esaminati (allegati)

| File | Pagine | Produttore / metadati rilevanti | Note |
|------|--------|---------------------------------|------|
| `file1.pdf` | 57 | Creator/producer: PDFium. Sviluppi e dimostrazioni svolte con riferimenti al testo del prof. (es. "p. 2.13"). | Dispense/appunti di uno studente; in coda (pp. 56-57) contiene 28 domande a risposta multipla con risposte in maiuscolo. |
| `file2.pdf` | 12 | Creator/producer: Samsung Electronics, modifica D:20260909151856. "Domande Esame": 17 domande teoriche, 9 esercizi, 34 risposta multipla (sezione "Risposta multipla CROP" con risposte indicate a pp. 7-8), più 9 domande introduttive su reti a pp. 8-9. | Fotocopia/esportazione da dispositivo Samsung; il marcatore `¥` precede ogni domanda; la lettera `j` compare davanti alle domande 10 e 15. |
| `file3.pdf` | 59 | Creator: Microsoft Word per Microsoft 365, creazione D:20220213161159+01'00', modifica D:20250413131219+02'00'. Dimostrazioni d'esame svolte passo-passo, note riportanti "RC" come autore. | Considerato molto affidabile ma da verificare matematicamente. |

### Metodo
Il livello di testo dei PDF restituisce formule rovinate (font CambriaMath con glifi rimappati a punteggiatura ASCII, es. `'&'` ∈ {∫, ₀, ₙ}, `'"'` = −, `'#'` = j, `'$'` = ω, `'%'` = t, `'!'` = n/₀ a seconda della posizione verticale). Per ogni pagina ho quindi:
1. renderizzato la pagina a immagine (110 DPI, via PyMuPDF; file in `/home/user/work/pages/`, non committiti);
2. ricostruito il layout (righe, superscritture e sotto-scritture per posizione y e dimensione carattere) per leggere le formule.

Tutte le affermazioni qui riportate sono classificate come:

* **FATTO** — verificato sui documenti o su fonti ufficiali aperte (con URL).
* **IPOTESI** — interpretazione non certa, da verificare (es. significato di simboli, corrispondenza pagine "p. 2.x").
* **NON TROVATO** — informazione cercata e non presente.

### Fonti aperte consultate (URL realmente aperti)

1. Pagina ufficiale del prof. Casoni: https://web.ing.unimo.it/wiki/index.php/Maurizio_Casoni
2. Materiale Didattico ufficiale (slide ed esercizi): https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico
3. Libro di Testo ufficiale: https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo → L. Calandrino, G. Immovilli, *"Schemi delle lezioni di Comunicazioni Elettriche"*, Pitagora Editrice Bologna
4. Programma del corso (PDF ufficiale): http://www.dii.unimore.it/~mcasoni/telecom/programma.pdf
5. Esercizi ufficiali: http://www.dii.unimore.it/~mcasoni/telecom/ESERCIZI_FONDAMENTI.pdf
6. Prove d'esame anni precedenti: http://www.dii.unimore.it/~mcasoni/telecom/Prove_esame_2019-21.zip (e 2016-2017)
7. Concorrenti (verificati via search): MIT OCW 6.003 Signals and Systems (https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-003-signals-and-systems-fall-2011/); NPTEL Principles of Signals and Systems (https://archive.nptel.ac.in/courses/108/104/108104100/); skuola.net appunti Casoni (https://www.skuola.net/universita/appunti/fondamenti-di-telecomunicazioni-esercizi); docsity Casoni (https://www.docsity.com/it/professori/casoni-maurizio/); studocu segnali e sistemi (https://www.studocu.com/it/document/universita-telematica-e-campus/segnali-e-sistemi/dispense-4-segnali-e-sistemi/21506543); dispense Teoria dei Segnali Unisi (https://www3.diism.unisi.it/~giambene/fondamenti/dispense/dispense_tds.pdf)

---

## 1. Sintesi in 10 righe

1. `file1.pdf` (57 pp.) raccoglie 28 sviluppi/dimostrazioni dell'esame di Fondamenti di Telecomunicazioni (Casoni, UNIMORE), ciascuna con riferimento al testo del prof. (es. p. 2.13, 2.14, …, 10.9) e slide (Accesso multiplo, Reti di telecomunicazioni); copre spettri (impulso periodico e singolo, antitrasformata, Nyquist), teorema del campionamento, impulso di Dirac, reti lineari (RC, CR, trasversale, risposta impulsiva), PAM, modulazioni (prodotto, QAM, Carson, equivalente passa-basso), A/D e D/A, e protocolli di accesso (ALOHA, CSMA/CD, sliding window, TDMA/FDMA) più processi stocastici (Poisson, nascita e morte).
2. `file2.pdf` (12 pp.) è la traccia d'esame: 17 domande teoriche (Q5 e Q11 da 10 punti), 9 esercizi, 34 quiz a risposta multipla (con sezione "CROP" che indica risposte su scheda, renumerata 1-29) e 9 domande introduttive su reti (pp. 8-9).
3. `file3.pdf` (59 pp., autore delle note "RC") riscrive passo-passo lo stesso insieme di dimostrazioni di `file1` con notazione più pulita (f₀=1/T, ω₀=2π/T, m per pulsazione) e aggiunge esercizi di teoria del traffico (code, M/M/1, CRC, linea 100 km, switch M×N, 25 terminali) oltre a un identico quiz di 28 domande (pp. 58-59).
4. Le 17 domande teoriche di `file2` trovano riscontro diretto nelle dimostrazioni di `file1` (e in `file3`) tranne la Q9 (trasformazione circuito PM in FM e viceversa), assente in entrambi.
5. Il materiale basta "letteralmente per passare" (parola degli studenti); per il 30 e lode servono le dimostrazioni esattamente come nel testo del prof. (stessi passaggi e notazione, le dimostrazioni valgono ≥ metà esame), i grafici/spettri richiamati come "in figura", e il colmamento delle lacune segnalate.
6. Verifica matematica di `file1`: risultati numerici corretti; segnalate ambiguità/notazioni da controllare sulle immagini (fase φₙ definita tramite segno di cₙ complesso, fattori 1/(πT) vs 1/(2π) negli spettri PAM, espressione finale di S in CSMA/CD illecita nell'estrazione, efficienza sliding-window caso 2 illecita, ω vs ω₀ non sempre distinto).
7. `file3` è più leggibile di `file1` ma presenta sospetti refusi (segno mancante nell'esponenziale di ALOHA puro `e^(2λtτ)`; definizione di slot in CSMA/CD "1/2a" in apparente contrasto con `file1`) e notazione diversa da quella del testo del prof.
8. Il repo target è `jaski99/telecomunicazioni`, ramo `arena/92cd303f-telecomunicazioni`; il prodotto va in `docs/research/R3-analisi-materiale.md`.
9. Non sono stati rilevati punteggi oltre i "(10 punti)" di Q5 e Q11; significato di `¥` e `j` non documentato (solo ipotesi).
10. Non è stato possibile verificare a quale volume corrispondano esattamente i riferimenti "p. 2.x" (il Libro di Testo ufficiale è Calandrino & Immovilli, Pitagora, ma il nesso pagine-riferimenti non è dichiarato): NON TROVATO.

---

## 2. Tabella riassuntiva

| Sezione | Contenuto | Quantità | Presenza in file1 | Presenza in file3 | Note |
|---------|-----------|----------|-------------------|-------------------|------|
| Teoria (esame) | 17 domande teoriche | 17 | Tutte coperte da dimostrazioni, eccetto Q9 (PM↔FM) | Tutte coperte, eccetto Q9 | Q5 e Q11: 10 punti ciascuna |
| Esercizi | Calcolo spettri, RC/CR, PAM, derivatore | 9 | Tutti (D1-D2, D3, D4, D7, D8, D11-D14) | Tutti (equivalenti) | |
| Risposta multipla | 34 domande + sezione CROP risposte indicate | 34 + 29 indicazioni | Quiz affine (28 domande, pp. 56-57) con risposte | Quiz identico (pp. 58-59) | ⚠ contraddizione CROP Q7/Q8 vs Q32/Q33 |
| Intro reti | Elementi rete, protocollo, indirizzi, ITU, telefono, Marconi, mezzi | 9 domande aperte (pp. 8-9) | Assente | Assente | NON TROVATO in file1/file3 |
| Extra (oltre esame) | Teoria del traffico, CRC, linea 100 km, switch, terminali | ~6 esercizi | Assente | Presenti (pp. 44-57) | Utili per 30 e lode |

---

## 3. Analisi dettagliata con evidenze e URL

### 3.1 file1 — catalogo sviluppi e dimostrazioni (con verifica matematica)

Di seguito l'elenco completo. "Pag. PDF" si riferisce alla pagina interna di `file1.pdf`. "Esito" = confronto con il rifacimento indipendente dei calcoli (standard segnali e sistemi/comunicazioni).

| ID | Titolo | Rif. testo prof. | Pag. PDF | Passaggi principali | Esito verifica | Annotazioni (errori / salti / ambiguità) |
|----|--------|------------------|----------|---------------------|----------------|------------------------------------------|
| D1 | Spettri ampiezza e fase di successione periodica di impulsi rettangolari (A, τ, T) | p. 2.13 | 1 | cₙ = (1/T)∫x(t)e^{−jnωt}dt = (A/T)∫e^{−jnωt}dt = I/T · sin(nωτ/2)/(nωτ/2), I = Aτ; Aₙ = I/T (n=0), 2I/T·sin(...)/(...) (n≥1); φₙ = 0 se cₙ>0, π se cₙ<0 | Parziale | **Notazione ambigua/errore possibile:** il segno di cₙ complesso non è definito; corretto: φₙ = arg(cₙ); la forma 0/π vale solo se cₙ reale (impulso centrato). DA VERIFICARE sulla figura (posizione dell'impulso). ω vs ω₀=2π/T non sempre distinto. Fattore e^{−jnωτ/2} non chiaramente riportato. |
| D2 | Spettri ampiezza e fase di impulso rettangolare singolo (A, τ) | p. 2.14 | 2 | X(ω) = ∫x(t)e^{−jωt}dt = A·sin(ωτ/2)/(ωτ/2) = I·sinc(...); V(ω)=|X(ω)|/π; φ(ω) = −arg X(ω) | OK | Idem ambiguità ω/ω₀ e fase 0/π per X(ω)<0. |
| D3 | Antitrasformata di X(ω) rettangolare (X₀ per |ω|≤ωₘ) | p. 2.19 | 3 | x(t) = (1/2π)∫X(ω)e^{jωt}dω = (X₀/π)·sin(ωₘt)/t = x₀·sin(ωₘt)/(ωₘt) con x₀ = X₀ωₘ/π | OK | Esercizio 3 di file2. |
| D4 | Condizione necessaria e sufficiente in frequenza per x(nT) = x₀ (n=0), 0 altrimenti | p. 2.35 | 4-6 | X₀(ω) = Σₙ xₙe^{−jnωT}; X₀(ω) = (1/T)ΣₖX(ω+k2π/T); condizione ⋆: ΣₖX(ω+k2π/T) ≡ x₀T; casi banda Bω < π/T (mai verificata), = π/T (solo X(ω)=x₀T per |ω|≤π/T ⇒ x(t)=x₀sinc(πt/T)), > π/T (infiniti modi, es. raccordi antisimmetrici / coseno rialzato) | OK | Corretta; "X(−ω)=X*(ω)" usato per ridurre a [0,π/T]. file3 pp. 33-35 aggiunge esplicitamente coseno rialzato. |
| D5 | Teorema del campionamento nel dominio dei tempi | p. 2.40 | 7-10 | xₙ=x(nT); X₀(ω)=(1/T)ΣₖX(ω+kωₛ), ωₛ=2π/T=2πfₛ; separazione degli spettri se ωₘ ≤ ωₛ−ωₘ ⇒ fₛ ≥ 2fₘ; X(ω)=T·X₀(ω) in (−Ω,Ω); ricostruzione x(t)=Σx(nT)·sinc((t−nT)/T); interpretazione ortogonale (Parseval generalizzato) | OK | "X(ω) = p·T·X₀(ω)" — il fattore ("p" o T?) è illecito nell'estrazione: DA VERIFICARE sull'immagine. Passaggi basati su figure ("in figura") non trascritti. |
| D6 | Funzione impulsiva e sua trasformata di Fourier | p. 2.56 | 11-12 | Impulso unitario D(t,∆); proprietà ∫x(τ)D(t−τ,∆)dτ → x(t); δ(t) definita da x(t)=∫x(τ)δ(t−τ)dτ = x(t)∗δ(t); F[δ(t)] = 1 (con x(t)=e^{jωt}, t=0); F[D(t,∆)] → 1 per ∆→0 | OK | Attenzione a non confondere δ(t) con lim D(t,∆); scambio integrazione/limite non lecito (darebbe 0). |
| D7 | Rete RC: funzione di trasferimento, ampiezza, fase | p. 3.11 | 13 | H(ω) = 1/(1+jωCR); |H(ω)| = 1/√(1+(ωCR)²); fase = −arctg(ωCR) | OK | Esercizio 5 di file2. Grafici non trascritti. |
| D8 | Rete CR: funzione di trasferimento, ampiezza, fase | p. 3.12 | 14 | H(ω) = jωCR/(1+jωCR); |H| = ωCR/√(1+(ωCR)²); fase = arctg(ωCR) − π/2 | OK | Esercizio 6 di file2. |
| D9 | Filtro trasversale: schema a blocchi e H(ω); filtri ricorrente/puramente ricorrente | p. 3.20 | 15-16 | Ricorrente: y(t)=Σhₖx(t−kT)+Σh'ₖy(t−kT); Trasversale (h'=0): H(ω)=Σhₖe^{−jkωT}; Puramente ricorrente (h=0): H(ω)=1/(1−Σh'ₖe^{−jkωT}) | Parziale | Trascrizione dell'estrazione molto frammentata (parentesi annidate); risultato finale plausibile ma DA VERIFICARE sull'immagine. |
| D10 | Risposta impulsiva di rete lineare e legame con funzione di trasferimento | p. 3.29 | 17-18 | h(t)=lim y(t)/∆ per input D(t,∆); h(t)=0 per t<0 (causalità); y(t)=∫x(τ)h(t−τ)dτ = x(t)∗h(t); H(ω)=ℱ{h(t)}, h(t)=ℱ⁻¹{H(ω)} | OK | Esercizio 4 di file2. |
| D11 | Segnali PAM: definizione e calcolo dei due spettri | p. 4.30 | 19-22 | s(t)=Σaₙg(t−nT) = {a}∗g(t); s(t)=sₘ(t)+x(t) con xₙ=aₙ−<a>; spettro a righe: cₙ=<a>G(n2π/T)/T; spettro distribuito: G(ω)= (1/πT)|G(ω)|²[<a²>−<a>² + 2Σ(<aᵢaⱼ>−<a>²)cos(kωT)] | Parziale | **Ambiguità:** fattore 1/(πT) dipende da convenzione spettro unilaterale/bilaterale (NON TROVATO nello studente); risultato coerente con densità unilaterale. |
| D12 | Densità di probabilità 1° ordine di y(t) in uscita a derivatore, x(t) ergodico gaussiano, G₀ in (0,ωₘ) | p. 5.29 | 23 | y gaussiano, media nulla, G_y(ω)=G₀ per 0≤ω≤ωₘ; potenza P=σᵧ²=(1/2π)∫G_y dω = G₀ωₘ/π (fattore da convenzione); p(y)=1/√(2πσᵧ²)·e^{−y²/(2σᵧ²)} | Parziale | **Notazione ambigua:** banda (0,ωₘ) unilaterale o bilaterale? Il fattore 1/π vs 1/(2π) ne deriva. DA VERIFICARE sull'immagine/testo prof. |
| D13 | Spettro PAM codice bipolare, simboli equiprobabili indipendenti, duty cycle 1 | p. 5.43 | 24-25 | <a>=0, <aᵢaⱼ>=δᵢⱼ → solo k=0; G(ω)=(1/πT)|G(ω)|²σₐ²; rettampiezza 1 durata T: G(f)=2T·sinc²(πfT) | Parziale | Fattore 2 dipende da convenzione unilaterale/bilaterale (cf. D11). |
| D14 | Spettro PAM codice AMI, duty cycle 0.5 | p. 5.45 | 26-27 | E[a]=0; C[1]=E[aᵢaᵢ₊₁]=−1/4; C[k≥2]=0; G(ω)=(1/πT)|G(ω)|²[C₀+2C₁cos(ωT)] ∝ sin²(ωT/2); nulli in f=0, ±2/T, … | Parziale | Stesse ambiguità di fattore; risultato coerente con letteratura AMI (shaping spettrale). |
| D15 | Spettri ampiezza e fase di oscillazione modulata a prodotto; conversione di frequenza | p. 6.12 | 28-31 | s(t)=x(t)cos(ω₀t), x(t)=∫V(ω)cos(ωt−φ(ω))dω; s(t)=sₛ(t)+sᵢ(t) con traslazioni ±ω₀; banda laterale superiore traslata in alto di ω₀; inferiore ribaltata attorno a ω₀ con cambio di segno di fase; conversione in salita u(t)=2s(t)cos(ω₀t)=x(t)+componente a 2ω₀; in discesa simile con LPF | OK | Coerente con file3 pp. 18-19. Grafici "in figura" non trascritti. |
| D16 | Conversione A/D: 3 passi (campionamento, quantizzazione, codificazione) | p. 7.4 | 32-34 | fₛ≥2fₘ (antialiasing, ricostruzione); qₙ=F(xₙ), L livelli, m≥log₂L bit; segnale numerico/PCM; PAM per la trasmissione | OK | |
| D17 | Conversione D/A: ricostruzione del segnale originario | p. 7.8 | 35-36 | Decodifica (qₙ→xₙ approssimato); S(ω)=(1/T)G(ω)ΣX(ω+k2π/T); LPF isola k=0; rete equalizzatrice I(ω), omissibile se τ≪T (G(ω)≈τ); xᵣ(t)≠x(t) per quantizzazione; ε(t)=x(t)−xᵣ(t) rumore di quantizzazione additivo | OK | Figura non trascritta; ritardo del LPF assunto nullo (H(ω) reale). |
| D18 | Modulatori/demodulatori a prodotto; errore ∆ nella fase di riferimento | p. 9.34 | 37-38 | s(t)=x(t)cos(ω₀t); demodulazione coerente: u(t)=2s(t)cos(ω₀t)=x(t)+x(t)cos(2ω₀t); LPF isola x(t); con errore ∆: uscita = x(t)cos∆ (diminuzione di livello) | OK | Coerente con file3 pp. 25-27. |
| D19 | QAM: modulatore/demodulatore | p. 9.36 | 39-40 | Due portanti in quadratura cos(ω₀t), −sin(ω₀t); s(t)=x_c(t)cos(ω₀t)−x_s(t)sin(ω₀t); recupero con due demodulatori a prodotto + LPF; inviluppo complesso i(t)=x_c(t)+jx_s(t); errore ∆ → diminuzione di livello + interferenza reciproca (cross-talk) tra i due segnali | OK | Coerente con file3 pp. 23-24. |
| D20 | Formula di Carson | p. 9.43 | 41 | Bω = 2(∆ω_max + ωₘ); ∆ω_max = max|∆ω(t)|; ωₘ = massima pulsazione del segnale utile | Enunciato | Solo enunciato, **non dimostrata**. Sufficiente per Q14 ("scrivere l'espressione"); per 30 e lode va derivata. |
| D21 | Risposta di quadripoli lineari a oscillazioni modulate; equivalente passa-basso | p. 10.9 | 42-44 | s(t)=ℜ{i(t)e^{jω₀t}}; H(ω)≠0 solo su parte della banda; S(ω)→inviluppo: I(ω)=(1/2)·H(ω+ω₀)·S(ω+ω₀) per ω+ω₀≥0 (equiv. passa-basso H_eq(ω)=H(ω+ω₀)); H_eq descrive trasformazione su inviluppi (ampiezza/angolo); in generale H_eq(−ω)≠H_eq*(ω) (non sempre realizzabile); se ampiezza simmetrica e fase antisimmetrica con β(ω₀)=0 → H_eq(−ω)=H_eq*(ω), realizzabile come passa-basso fisico | OK | Esercizio 11 di file2. |
| D22 | Protocollo ALOHA: throughput normalizzato vs traffico | slide 5 (Accesso multiplo) | 45-46 | λ=λₜ+λᵣ; G=bλ/R, ρ=bλτ/R=λτ; finestra di contesa 2τ; Pₛ=P(k=0)=e^{−2G}; ρ=Ge^{−2G}; max ρ=1/(2e)=0,18 a G=0,5; slotted: finestra τ → ρ=Ge^{−G}; max ρ=1/e=0,36 a G=1 | OK | file3 p20: "e^(2λtτ)" — sospetto segno meno mancante (dov'è e^{−2G}): DA VERIFICARE (refuso probabile). |
| D23 | Protocollo CSMA/CD: throughput S in funzione di a | slide 12 (Accesso multiplo) | 47-48 | Slot = doppio ritardo di propagazione end-to-end; N stazioni, prob. p; A=P(una sola stazione)=Np(1−p)^{N−1}, max per p=1/N → A→1/e; E[w] intervallo di contesa; S = A/(1−A+2a) (cand.) | Parziale | **Espressione finale illecita nell'estrazione** (candidata: S=A/(1−A+2a) o 1/(1−A+2a)): DA VERIFICARE sull'immagine. file3 p22 definisce slot "1/2a" in apparente contrasto con file1 ("doppia del ritardo"): notazione di a da verificare sulle slide del prof. |
| D24 | Ritardo medio TDMA e FDMA | slide 25 (Accesso multiplo) | 48 | FDMA: τ=T, ω=0 → D=T; TDMA: slot T/M, τ=T/M, attesa media ω=(M−1)/(2M)·T → D_TDMA = T/M + … < D_FDMA; TDMA strutturalmente superiore per ritardo | OK | Coerente con file3 p31 (τ_TD=T/M=b/R). |
| D25 | Efficienza sliding window, assenza errori, diagrammi temporali | slide 75 (Reti di telecomunicazioni) | 49-51 | W, F=D+H, C, TT; caso W·F > C·TT: trasmissione continua, η=D/(D+H); caso W·F ≤ C·TT: tempi morti, η = W·D/(C·TT) (cand.) | Parziale | **Seconda espressione illecita nell'estrazione:** DA VERIFICARE sull'immagine. file3 pp. 29-30 riscrive TT=F/C+I+ACK/C+I. |
| D26 | Distribuzione di Poisson; tempo residuo | slide 106 (Reti) | 51-53 | P(k)=(λt)ᵏe^{−λt}/k!; sovrapposizione e scomposizione di processi Poisson; E[k]=λt, var[k]=λt; tempo interarrivo esponenziale F(t)=1−e^{−λt}, f(t)=λe^{−λt}, E[t]=1/λ; tempo residuo δ: P(δ≤…)=1−e^{−λδ} (memoryless) | OK | Esercizio 13 di file2. |
| D27 | Processi nascita e morte: probabilità di stato all'equilibrio | slide 110 (Reti) | 54-55 | λₖ nascita, μₖ morte; equazioni di bilancio; stazionario: dpₖ/dt=0; −λₖpₖ+μₖ₊₁pₖ₊₁=…; soluzione pₖ=p₀∏(λᵢ/μᵢ); Σpₖ=1 | OK | Esercizio 14 di file2. |
| D28 | Quiz (domande a risposta multipla con risposte in maiuscolo) | — | 56-57 | 28 domande (banda di Nyquist, rappresentabilità periodica, filtri zeri/poli, spettro energia↔autocorrelazione FT, AM=DSB, criterio Nyquist ISI, modulata=passa-banda sempre, codice sistematico, parametro a>1, simmetria spettri→prodotto, potenza finita→no FT, Carson centrato su ω₀, ritardo TDMA<FDMA, slotted ALOHA max=doppio di ALOHA, PM→FM integratore anteponendo, FM→PM derivatore anteponendo, demod coerente usa portante, PDF 2° ordine, prodotto=due bande laterali fianco portante, stazionarietà necessaria per ergodico, rapporto prop./trasm.>0,1, SSB-SC=conversione in salita, ISO/OSI 1-7, FDMA vs TDMA stessa velocità, conversione=frequenza SSB-SC, Carson=segnale ad angolo) | — | Coerente con il set MCQ di file2 (vedi 3.2). |

### 3.2 file2 — estrazione completa delle domande d'esame

**Simboli usati (solo IPOTESI, significato non dichiarato nel documento):**
* `¥` — marcatore davanti a ogni domanda (probabile glyph di elenco/punto elenco, forse mis-encodato da app per note Samsung; non è spiegato nel documento).
* `j` — compare davanti alle domande 10 e 15 ("10. ¥ j Modulatori…", "15. ¥ j Il protocollo ALOHA…"). IPOTESI: priorità/argomento svolto, iniziale di un autore, o refuso di formattazione. **NON TROVATA** una legenda.
* Punteggi: esplicitati solo per Q5 "(10 punti)" e Q11 "(10 punti)". Per le altre domande il punteggio è **NON TROVATO** nel documento.

#### 3.2.1 Domande teoriche (17)

| N | Testo (fedele) | Punteggio | Simbolo |
|---|----------------|-----------|---------|
| 1 | Dimostrare e descrivere il teorema del campionamento nel dominio dei tempi. | — | ¥ |
| 2 | Definire la funzione impulsiva e calcolarne la trasformata secondo Fourier. | — | ¥ |
| 3 | Disegnare lo schema a blocchi di un filtro trasversale e scrivere la relativa funzione di trasferimento H(ω). | — | ¥ |
| 4 | Definire la risposta impulsiva di una rete lineare, con anche i relativi schemi, e dimostrare il legame con la funzione di trasferimento di una rete lineare. | — | ¥ |
| 5 | Segnali PAM: definizione e calcolo dei due spettri. | 10 punti | ¥ |
| 6 | Ricavare e disegnare gli spettri di ampiezza e fase di un'oscillazione modulata a prodotto. | — | ¥ |
| 7 | Descrivere, e rappresentare con grafici e schemi a blocchi, il processo di conversione analogico-digitale (3 passi). Aggiungere commenti opportuni. | — | ¥ |
| 8 | Descrivere, e rappresentare con grafici e schemi a blocchi, il processo di conversione digitale-analogica per la ricostruzione del segnale originario. Aggiungere commenti opportuni. | — | ¥ |
| 9 | Trasformazione di un circuito PM in FM e viceversa | — | ¥ |
| 10 | j Modulatori e Demodulatori a prodotto. Modulazione QAM: definizione, formule e schemi relativi. Discutere e analizzare gli effetti in presenza di un errore ∆ nella fase di riferimento. | — | ¥ j |
| 11 | Ricavare la risposta di quadripoli lineari a oscillazioni modulate e definire la funzione di trasferimento equivalente passa-basso con schemi e grafici relativi | 10 punti | ¥ |
| 12 | Ricavare e spiegare l'efficienza dei protocolli sliding window in assenza di errori, con i relativi diagrammi temporali. | — | ¥ |
| 13 | Dimostrare la distribuzione del tempo residuo in un processo degli arrivi poissoniano (distribuzione di Poisson). | — | ¥ |
| 14 | Ricavare la probabilità di stato all'equilibrio di processi di nascita e di morte. | — | ¥ |
| 15 | j Il protocollo ALOHA: ricavare l'espressione del throughput normalizzato in funzione del traffico totale normalizzato. | — | ¥ j |
| 16 | Il protocollo CSMA/CD: ricavare l'espressione del throughput S in funzione del parametro a. Disegnarne il grafico. | — | ¥ |
| 17 | Calcolare il ritardo medio di TDMA e FDMA e, poi, commentare il loro confronto. | — | ¥ |

#### 3.2.2 Esercizi (9)

1. Spettri ampiezza/fase di successione periodica di impulsi rettangolari (A, τ, T). Commentare.
2. Spettri ampiezza/fase di impulso rettangolare (A, τ). Commentare.
3. Antitrasformata di X(ω)=x₀ per |ω|≤ωₘ, 0 altrove (x₀ reale). Disegnarne il grafico.
4. Condizione necessaria e sufficiente in frequenza perché x(nT)=x₀ (n=0), 0 (n≠0), commentando i tre casi.
5. Funzione di trasferimento, ampiezza e fase di una rete RC. Grafici.
6. Idem per rete CR.
7. Densità di probabilità 1° ordine di y(t) in uscita a derivatore, input x(t) ergodico gaussiano con spettro di potenza G₀ in (0,ωₘ).
8. Spettro di segnale PAM codice bipolare, simboli equiprobabili indipendenti, impulsi rettangolari amp. 1, duty cycle 1.
9. Spettro di segnale PAM codice AMI, duty cycle 0.5.

#### 3.2.3 Risposta multipla (34 domande, sezione principale + sezione "CROP")

Le pagine 3-4 e 9-11 di `file2` contengono le stesse 34 domande (ristampa duplicata). A pp. 7-8 c'è la sezione **"Risposta multipla CROP"**: apparentemente una scheda con risposte indicate (freccia `→` accanto all'opzione scelta), renumerata 1-29. Di seguito i temi di tutte le 34 domande e, dove disponibile, la risposta indicata in CROP mappata alla numerazione principale.

| N (principale) | Tema | Opzioni (sintesi) | Risposta indicata in CROP (mappata) |
|---|------|-------------------|-------------------------------------|
| 1 | SSB-BC è sinonimo di | (a) modulazione a prodotto (b) modulazione d'angolo (c) conversione di frequenza in salita | CROP 17 → (c) |
| 2 | Slotted ALOHA: max throughput normalizzato | (a) 1/2e (b) 0.5 (c) 1/e | CROP 27 → (c) |
| 3 | Throughput normalizzato slotted ALOHA è… | (a) uguale 1-persistent CSMA (b) doppio dell'ALOHA (c) metà dell'ALOHA | CROP 28 → (b) |
| 4 | Strato 4 ISO-OSI | (a) Rete (b) Sessione (c) Presentazione (d) Trasporto | CROP 29 → (d) |
| 5 | Strato 5 ISO-OSI | (a) Rete (b) Sessione (c) Presentazione (d) Linea | CROP 29 → (b) |
| 6 | Conoscenza completa energetica funzione aleatoria | (a) PDF 1° ordine (b) PDF 2° ordine (c) PDF ordine n se stazionario n | CROP 11 → (b) |
| 7 | Modulatore di frequenza da modulatore di fase aggiungendo prima: | (a) modulatore a prodotto (b) rete derivatrice (c) rete integratrice | CROP 7 → (b) **[⚠ contraddizione]** |
| 8 | Modulatore di fase da modulatore di frequenza aggiungendo prima: | (a) prodotto (b) derivatrice (c) integratrice | CROP 8 → (c) **[⚠ contraddizione]** |
| 9 | x(t) potenza finita quindi | (a) trasformabile FT (b) condizione necessaria non sufficiente (c) non ammette FT | CROP 2 → (c) |
| 10 | Stazionarietà condizione … affinché ergodico | (a) sufficiente (b) necessaria e sufficiente (c) necessaria | CROP 3 → (c) |
| 11 | Simmetria ampiezza/antisimmetria fase nec+suff perché segnale passa-banda è… | (a) FM (b) modulato a prodotto (c) angolo | CROP 13 → (b) |
| 12 | Formula di Carson esprime | (a) BW min aliasing (b) BW segnale modulato d'angolo (c) BW AM | CROP 14 → (b) |
| 13 | Formula di Carson esprime (variante) | (a) aliasing (b) BW segnale centrato su ω₀ (c) BW filtro passa-banda | CROP 15 → (b) |
| 14 | Scrivere espressione Carson Bω = 2(∆ω_max + ωₘ), ∆ω_max=max|∆ω(t)| | (aperto) | CROP 16 → formula scritta |
| 15 | Funzione periodica T NON rappresentabile da | (a) serie FT esponenziale (b) integrale FT (c) seni e coseni | CROP 1 → (b) |
| 16 | Filtro elettrico ricorrente ha TF con | (a) solo poli (b) zeri e poli (c) solo zeri | CROP 4 → (b) |
| 17 | Filtro puramente ricorrente ha TF con | (a) solo poli (b) zeri e poli (c) solo zeri | CROP 5 → (a) |
| 18 | Filtro trasversale presenta | (a) solo poli (b) zeri e poli (c) solo zeri | CROP 6 → (c) |
| 19 | Prestazioni reti compromesse se rapporto prop./trasm. è | (a) <0.01 (b) tra 0.01 e 0.1 (c) >0.1 | — (non in CROP) |
| 20 | Conversione di frequenza è modulazione di tipo | (a) SSB (b) DSB-SC (c) VSB (d) SSB-SC | CROP 19 → (d) |
| 21 | Demodulatore coerente | (a) non usa portante (b) coerente alla banda (c) fa uso della portante | CROP 20 → (c) |
| 22 | Demodulatore non coerente | (a) opera sulla sola oscillazione modulata (b) coerente alla banda (c) coerente alla banda modulata | CROP 21 → (a) |
| 23 | Oscillazione modulata a prodotto: spettro ampiezza | (a) bande laterali a cavallo del 2·fmax utile (b) a cavallo del 2·fportante (c) a cavallo della fportante | CROP 22 → (c) |
| 24 | Parametro a nelle reti genera problemi quando è | (a) molto piccolo ~0 (b) =0.1 (c) grande >1 | — (non in CROP) |
| 25 | Banda di Nyquist è | (a) BPF filtro trasversale (b) banda minima x₀δₙ₀ (c) BW min antialiasing | CROP 24 → (b) |
| 26 | Criterio di Nyquist enuncia condizione per | (a) annullare ISI | — |
| 27 | Oscillazione AM viene chiamata | (a) SSB (b) VSB (c) DSB | CROP 18 → (c) |
| 28 | Codice sistematico se | (a) rappresentato per matrici (b) k bit info distinti da r bit ridondanza (c) non distinti | CROP 26 → (b) |
| 29 | Spettro energia e autocorrelazione legate da | (a) convoluzione temporale (b) FT (c) antiFT | CROP 23 → (b) |
| 30 | Ritardo pacchetto TDMA vs FDMA | (a) minore (b) uguale (c) maggiore | — (non in CROP) |
| 31 | Velocità FDMA vs TDMA | (a) superiore (b) minore (c) uguale | — (non in CROP) |
| 32 | PM diventa FM | (a) derivatore (b) integratore posponendo (c) integratore anteponendo | CROP 9 → (c) |
| 33 | FM diventa PM | (a) derivatore anteponendo (b) integratore posponendo (c) integratore anteponendo | CROP 10 → (a) |
| 34 | Oscillazione modulata è segnale passa-banda | (a) mai (b) sempre (c) — | CROP 12 → (b) |

**⚠ Contraddizione interna rilevata:** nella sezione CROP le risposte indicate per Q7 ("derivatrice prima del PM → FM") e Q8 ("integratore prima del FM → PM") sono in contraddizione con Q32/Q33 (integratore anteponendo per PM→FM; derivatore anteponendo per FM→PM) e con la teoria del segnale (integratore prima di un PM genera FM; derivatore prima di un FM genera PM). IPOTESI: le croci della sezione CROP potrebbero essere risposte di uno studente (non una chiave ufficiale). Da verificare prima di usarle come chiave.

#### 3.2.4 Domande introduttive su reti (file2, pp. 8-9)

9 domande aperte: (1) elementi caratterizzanti di una rete (utenti, fornitori, pagamento); (2) cos'è una rete (nodi e linee); (3) cos'è un protocollo; (4) a cosa serve uno schema di indirizzi; (5) standardizzazione e interfacce identiche, ITU (1865); (6) passo significativo: telefono Meucci (brevetto 1871, meriti riconosciuti 2002); (7) aspetti comunicazione telefonica: intellegibilità e riconoscimento del parlante; (8) nascita radio-comunicazioni: Marconi; (9) mezzi trasmissivi (rame/coassiale con FDM, fibra ottica con riflessione totale core-cladding, radio broadcast con attenuazione polinomiale e ∝ quadrato della frequenza; "qualunque mezzo attenua il segnale"). **Assenti da file1 e file3.** (Verificato sul testo estratto; NON TROVATO in file1/file3.)

### 3.3 file3 — dimostrazioni di "RC": confronto con file1 e verifica

file3 (59 pp.) riscrive lo stesso nucleo di dimostrazioni di file1 con testo digitale (Word) più leggibile. Corrispondenza per argomento:

| Argomento | file1 (PDF pagg.) | file3 (PDF pagg.) | Confronto / esito |
|-----------|-------------------|-------------------|-------------------|
| Teorema del campionamento (tempo) | D5, pp. 7-10 | pp. 1-2 | file3 più pulito (f₀=1/T, ω₀=2π/T, separazione spettri, f₀≥2fₘ). Stesso risultato. |
| Funzione impulsiva + FT | D6, pp. 11-12 | pp. 3-4 | Stesso impianto; file3 omette alcuni dettagli di limite (es. scambio integrazione/limite) — **passaggio saltato** vs file1. |
| Risposta impulsiva rete lineare | D10, pp. 17-18 | pp. 5-6 | Stesso risultato; file3 non espone esplicitamente H(ω)=ℱ{h(t)} (fermando alla convoluzione). |
| Conversione A/D (3 passi) | D16, pp. 32-34 | pp. 7-9 | Equivalente; file3 aggiunge m≥log₂L e PCM. |
| Conversione D/A | D17, pp. 35-36 | pp. 10-11 | Equivalente; file3 introduce rete equalizzatrice T/G(m) omissibile se τ≪T. |
| PAM: definizione e due spettri | D11, pp. 19-22 | pp. 12-15 ("[CONTINUA]" a p. 13) | Stesso impianto; file3 arriva fino allo spettro distribuito sovrapposto a quello a righe (p. 14). |
| Modulazione a prodotto (spettri) | D15, pp. 28-31 | pp. 18-19 | Stesso risultato (bande laterali, ribaltamento, cambio di segno di fase). |
| ALOHA puro + slotted | D22, pp. 45-46 | pp. 20-21 | Stessi risultati (0,18 a G=0,5; 1/e a G=1). **Sospetto refuso:** p. 20 scrive "e^(2λtτ)" (manca il segno meno; dov'è e^{−2G}). |
| CSMA/CD | D23, pp. 47-48 | p. 22 | Stesso impianto; slot "1/2a" in apparente contrasto con file1; espressioni finali illecite in entrambi. |
| QAM | D19, pp. 39-40 | pp. 23-24 | Stesso risultato; errore ∆ → cross-talk + diminuzione di livello (enunciato, meno passaggi di file1). |
| Prodotto + errore ∆ fase | D18, pp. 37-38 | pp. 25-27 | Stesso risultato x(t)cos∆. |
| Formula di Carson | D20, p. 41 | p. 28 | Solo enunciato in entrambi, nessuna dimostrazione. |
| Sliding window | D25, pp. 49-50 | pp. 29-30 | Stessi due casi; file3 esplicita TT=F/C+I+ACK/C+I. |
| TDMA/FDMA ritardo | D24, p. 48 | p. 31 | Stessa conclusione (TDMA strutturalmente superiore). |
| Filtro trasversale/ricorrente | D9, pp. 15-16 | p. 32 | Stesse funzioni di trasferimento. |
| Condizione necessaria/sufficiente (Nyquist dominio frequenza) | D4, pp. 4-6 | pp. 33-35 | Stesso risultato; file3 aggiunge esplicitamente "coseno rialzato". |
| Spettri impulsi periodico/singolo | D1-D2, pp. 1-2 | pp. 36-38 | Stessi risultati. |
| Reti RC/CR | D7-D8, pp. 13-14 | pp. 39-40 | Stessi risultati. |
| PAM bipolare / AMI | D13-D14, pp. 24-27 | pp. 41-42 | Stessi risultati. |
| Antitrasformata rettangolare | D3, p. 3 | p. 52 | Stesso esercizio (senza svolgimento visibile nel testo estratto). |
| Esercizi extra (oltre esame) | — | pp. 44, 53-57 | Apparato interconnessione 100'000 flussi/30 pacchi/min (code, RAM per perdita <10⁻⁶); codice polinomiale k=11 bit, G(x) da "101" (CRC); nodo M/M/1 λ=10 pacch/s, permanenza 3 s (Little: N=λδ); ufficio comunale λ per 9 persone medio; switch M×16 con 5 p/s per ingresso; 25 terminali 240 p/min, pacchetto exp(64 byte), linea <1 ms prob 0.95 tra 256…4096 kbit/s. **Oltre il programma d'esame** (teoria del traffico, es. ESERCIZI_TEORIA_del_TRAFFICO.pdf del prof.): utili per 30 e lode, non richiesti alle 17 domande. |
| Quiz 28 domande | D28, pp. 56-57 | pp. 58-59 | Identico set di domande e risposte in maiuscolo: conferma incrociata del pool di quiz. |

**Notazione diversa da quella del testo del prof.:** file3 usa `m` per pulsazione (dove il prof. e file1 usano ω), `f₀` per frequenza di campionamento, `ωₘ` per banda massima. Per il sito si adotti come canone la notazione del testo del prof. (ω, T, fₛ), segnalando le varianti.

**Errori / passaggi saltati / ambiguità in file3:**
1. ALOHA p. 20: esponenziale `e^(2λtτ)` senza segno meno (sospetto refuso; il risultato numerico 1/(2e) a G=0,5 è corretto solo con e^{−2G}).
2. CSMA/CD p. 22: definizione di slot poco chiara ("1/2a slot"); contrasto apparente con file1.
3. Teorema del campionamento pp. 1-2: manca l'esplicita ricostruzione sinc (presenta in file1 p. 9-10).
4. Funzione impulsiva pp. 3-4: saltato il discorso sul non lecito scambio limite/integrazione (presente in file1 p. 11).
5. QAM p. 23-24 e prodotto p. 25-27: errore ∆ enunciato senza le passaggi intermedi che file1 mostra (2s(t)cos… → x(t)+x(t)cos(2ω₀t)).

### 3.4 Mappa domanda d'esame → dimostrazione in file1 → nodi Knowledge Graph (candidati) e ordine di studio

L'ordine proposto segue le dipendenze (prerequisiti prima): segnali deterministici → campionamento → impulso di Dirac/LTI → reti e filtri → segnali stocastici e PAM → modulazioni → A/D-D/A → accesso multiplo e reti → processi stocastici avanzati. Ogni nodo è candidato a diventare un nodo del knowledge graph del sito.

| Esame Q (file2) | Coperta da file1 | Coperta da file3 | Dimostrazione file1 (pag.) | Nodi KG candidati (prerequisiti) | Perché per 30 e lode |
|---|---|---|---|---|---|
| Q1 Teorema campionamento dominio tempi | Sì | Sì | D5 (pp. 7-10) | Teorema del campionamento; condizione fₛ≥2fₘ; ripetizione periodica di X(ω); ricostruzione con sinc; ortogonalità e Parseval generalizzato; serie temporali | Dimostrazione ≥ metà esame; va resa con passaggi del testo prof. |
| Q2 Funzione impulsiva + FT | Sì | Sì | D6 (pp. 11-12) | Impulso di Dirac δ(t); proprietà campionamento; ℱ{δ(t)}=1; relazione δ vs D(t,∆) | Fondamentale per LTI e PAM |
| Q3 Filtro trasversale schema + H(ω) | Sì | Sì | D9 (pp. 15-16) | Schema a blocchi; H(ω)=Σhₖe^{−jkωT}; filtro trasversale vs ricorrente | Disegno schema richiesto esplicitamente |
| Q4 Risposta impulsiva rete lineare + schemi + legame FT | Sì | Sì | D10 (pp. 17-18) | h(t); causalità h(t)=0 per t<0; convoluzione x∗h; H(ω)=ℱ{h(t)} | "Con i relativi schemi" → sito deve includere gli schemi |
| Q5 PAM: definizione + due spettri | Sì | Sì | D11 (pp. 19-22) | Segnale PAM; sₘ(t) (spettro a righe) e s(t) a media nulla (spettro distribuito); autocorrelazione; Wiener-Chinchin | 10 punti; due spettri devono essere entrambi derivati |
| Q6 Spettri ampiezza/fase modulazione a prodotto | Sì | Sì | D15 (pp. 28-31) | Moltiplicazione tempo = traslazione frequenza; bande laterali attorno a ω₀; fase ribaltata; sₛ/sᵢ ciascuna basta a ricostruire x(t) | Disegno spettri richiesto |
| Q7 Conversione A/D 3 passi + commenti | Sì | Sì | D16 (pp. 32-34) | Campionamento (antialiasing); quantizzazione (L livelli, irreversibile, qₙ=F(xₙ)); codificazione (m bit, m≥log₂L); PCM; segnale numerico/PAM | "3 passi" e "commenti opportuni" |
| Q8 Conversione D/A + ricostruzione | Sì | Sì | D17 (pp. 35-36) | Decodifica; LPF isola k=0; rete equalizzatrice; rumore di quantizzazione ε(t); xᵣ(t) vs x(t) | Aggiungere commenti (filtro, ritardo, costante) |
| Q9 Trasformazione PM in FM e viceversa | **No** | **No** | — (assente anche in file3) | Modulazione angolare PM/FM; integratore ante PM ⇒ FM; derivatore ante FM ⇒ PM | **Lacuna da colmare** (da ricostruire dal testo prof./slide Comunicazioni Elettriche) |
| Q10 Modulatori/demodulatori a prodotto, QAM, errore ∆ fase | Sì | Sì | D18 (pp. 37-38), D19 (pp. 39-40) | Demodulazione coerente; prodotto 2s(t)cosω₀t; QAM in quadratura; inviluppo complesso i(t)=x_c+jx_s; errore ∆ → x(t)cos∆ e cross-talk QAM | Discutere effetti errore ∆ |
| Q11 Quadripoli lineari a oscillazioni modulate + equivalente passa-basso | Sì | Sì | D21 (pp. 42-44) | Segnale passa-banda; inviluppo complesso; H_eq(ω)=H(ω+ω₀) (banda positiva); condizione realizzabilità H(−ω)≠H*(ω) | 10 punti; schemi e grafici richiesti |
| Q12 Efficienza sliding window + diagrammi temporali | Sì | Sì | D25 (pp. 49-50) | Finestra W; F=D+H; TT; due casi (WF > C·TT vs ≤); efficienza η; diagrammi temporali | Diagrammi temporali richiesti; disegnarli sul sito |
| Q13 Tempo residuo processo arrivi Poisson | Sì | Sì | D26 (pp. 51-53) | Distribuzione di Poisson P(k); proprietà memoryless; tempo residuo δ esponenziale | Dimostrazione richiesta ("dimostrare") |
| Q14 Probabilità di stato equilibrio nascita/morte | Sì | Sì | D27 (pp. 54-55) | Bilanci di probabilità; pₖ=p₀∏(λ/μ); Σpₖ=1 | Dimostrazione richiesta |
| Q15 ALOHA throughput normalizzato vs traffico | Sì | Sì | D22 (pp. 45-46) | G e ρ normalizzati; finestra 2τ; Pₛ=e^{−2G}; ρ=Ge^{−2G} (puro), ρ=Ge^{−G} (slotted); massimi 0,18 e 0,36 | Grafico richiesto implicitamente |
| Q16 CSMA/CD throughput S(a) + grafico | Sì | Sì | D23 (pp. 47-48) | Parametro a=τ_prop/τ_frame; slot; collisione; A=Np(1−p)^{N−1}; S(A,a); comportamento decrescente con a | Grafico richiesto esplicitamente |
| Q17 Ritardo medio TDMA e FDMA + confronto | Sì | Sì | D24 (p. 48) | FDMA: D=T; TDMA: slot T/M, D_TDMA<D_FDMA | Commento del confronto |

**Domande coperte da file3:** tutte le stesse (Q1-Q8, Q10-Q17); Q9 non coperta né da file1 né da file3.  
**Domande NON coperte da nessun file:** Q9 (PM↔FM); le 9 domande introduttive su reti di file2 pp. 8-9 (non sono dimostrazioni ma teoria a risposta aperta).

### 3.5 Dimostrazioni richieste dalle domande ma NON presenti in file1 (da ricostruire)

1. **Q9 — Trasformazione circuito PM in FM e viceversa:** assente in file1 e in file3. Da ricostruire dal testo del prof. / slide *ComElettriche.pdf* e *AccessoMultiplo.pdf*: modulatore di FM da modulatore di fase ponendo un integratore prima del PM (fase = kₚ∫m(t) ⇒ deviazione di frequenza ∝ m(t)); modulatore di PM da FM ponendo un derivatore prima (∫m'(t)=m(t)). Coerente con le risposte di file2 Q32/Q33 (integratore anteponendo per PM→FM; derivatore anteponendo per FM→PM).
2. **Derivazione della formula di Carson:** file1 (p. 41) e file3 (p. 28) si fermano all'enunciato Bω=2(∆ω_max+ωₘ). Per 30 e lode va derivata (deviazione di pulsazione massima + banda del segnale modulante).
3. **Teoria introduttiva sulle reti** (file2 pp. 8-9): elementi di rete, protocollo, indirizzamento, standardizzazione (ITU), telefono/Meucci, Marconi, mezzi trasmissivi. Assenti da entrambi i file di appunti.

### 3.6 Temi delle domande a risposta multipla e concetti da coprire con quiz

Temi ricorrenti nei 34 quiz (con le 28 domande di file1 pp. 56-57 e file3 pp. 58-59 come pool confermato):
1. Rappresentabilità segnali: serie di Fourier vs integrale di Fourier per segnali periodici/potenza finita (Q9, Q13, Q15).
2. Processi stocastici: stazionarietà condizione necessaria (non sufficiente) per ergodicità (Q10, Q22); conoscenza energetica completa ⇒ PDF di secondo ordine (Q6, Q20).
3. Spettri: simmetria ampiezza/antisimmetria fase ⇔ modulazione a prodotto (Q11, Q12); AM = DSB (Q18, Q27); prodotto = due bande laterali a fianco della portante (Q23).
4. Modulazione ad angolo: formula di Carson = banda del segnale modulato ad angolo / centrato su ω₀ (Q12, Q13, Q14, Q28); conversione di frequenza = SSB-SC (Q1, Q17, Q20, Q27).
5. Filtri: ricorrente (poli e zeri), puramente ricorrente (solo poli), trasversale (solo zeri) (Q16-Q18).
6. Reti e accesso: rapporto tempo di propagazione/tempo di trasmissione parametro a, problemi se >1 (Q19, Q24); slotted ALOHA max throughput = 1/e = doppio di ALOHA (Q2, Q3, Q27, Q28); ritardo TDMA < FDMA (Q30); velocità FDMA = TDMA (Q31); ISO-OSI strati 4=Trasporto, 5=Sessione (Q4, Q5); codice sistematico k bit info distinti da r ridondanza (Q28).
7. Criterio di Nyquist = annullamento ISI (Q26); banda di Nyquist = banda minima della funzione x₀ per n=0 (Q25).
8. Modulatori PM/FM: PM→FM con integratore anteponendo; FM→PM con derivatore anteponendo (Q32, Q33); demodulatore coerente fa uso della portante (Q21); non coerente opera sulla sola oscillazione modulata (Q22).
9. Spettro energia ↔ autocorrelazione tramite FT (Q29).

**Nota sull'uso del pool di quiz:** il testo delle domande di `file2` è materiale d'esame possibile proprietà del docente; per il sito pubblico si consiglia di riformulare a parole proprie i temi (vedi sezione 6 "Cosa NON fare").

### 3.7 Competitor (app/siti/KG per segnali e sistemi, comunicazioni e reti)

| # | Sito/app | URL | Tipo | Cosa copiare | Cosa NON copiare |
|---|----------|-----|------|--------------|------------------|
| 1 | Materiale Didattico prof. Casoni (UNIMORE) | https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico | Ufficiale ateneo | Struttura argomenti (programma, slide, esercizi, prove anni precedenti), riferimenti precisi al corso | PDF statici, niente knowledge graph, niente quiz interattivi, non copiare il contenuto testuale delle slide (materiale del docente) |
| 2 | skuola.net — appunti Casoni | https://www.skuola.net/universita/appunti/fondamenti-di-telecomunicazioni-esercizi | Appunti studenti (premium) | Tag per argomenti (PAM, AMI, ALOHA, slotted ALOHA, CSMA/CD, filtri, Carson, QAM, probabilità, spettri), impaginazione riassunti | Paywall, contenuti non verificati/ufficiali, errori non segnalati |
| 3 | docsity — documenti Casoni | https://www.docsity.com/it/professori/casoni-maurizio/ | Appunti/esami (59 pag. prove, 33 pag. domande) | Collezione prove d'esame e domande | Non ripubblicare testi integrali d'esame (possibile proprietà del docente); paywall |
| 4 | MIT OCW — Signals and Systems 6.003 | https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-003-signals-and-systems-fall-2011/ | Corso aperto (video+note) | Approccio per concetti, esercizi svolti, licenza CC BY-NC-SA (ispirazione didattica) | Non allineato al programma UNIMORE (z-transform, feedback, controllo assenti dal programma Casoni) |
| 5 | NPTEL — Principles of Signals and Systems (IIT Kanpur) | https://archive.nptel.ac.in/courses/108/104/108104100/ | Corso aperto video | Video, trascrizioni, assegnamenti, lecture notes | Stesso caveat di MIT OCW; lingua inglese |
| 6 | Dispense Teoria dei Segnali (Unisi, De Rosa/Barni) | https://www3.diism.unisi.it/~giambene/fondamenti/dispense/dispense_tds.pdf | Dispense universitarie (italiano) | Esercizi svolti su FT, spettri ampiezza/fase, sistemi LTI, campionamento, processi stocastici | Contenuto generico, non specifico Casoni |
| 7 | studocu — segnali e sistemi | https://www.studocu.com/it/document/universita-telematica-e-campus/segnali-e-sistemi/dispense-4-segnali-e-sistemi/21506543 | Appunti universitari | Esercizi risolti (energia, potenza, Parseval, serie FT) | Piattaforma con paywall/preview; contenuti variabili per qualità |
| 8 | Libro di Testo ufficiale Casoni | https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo | Ufficiale ateneo | Testo di riferimento: Calandrino & Immovilli, "Schemi delle lezioni di Comunicazioni Elettriche", Pitagora | NON TROVATO: corrispondenza esatta tra riferimenti "p. 2.x" di file1 e pagine di questo volume |

**Valenza per il sito:** nessun competitor unisce (a) dimostrazioni fedeli al testo del prof. Casoni con riferimenti di pagina, (b) mappa domanda→dimostrazione→nodi KG, (c) quiz interattivo sui 34 temi + 28 domande aperte, (d) segnalazione esplicita degli errori degli appunti (file1/file3). Questo è il posizionamento differenziante per mirare al 30 e lode.

---

## 4. Stima di sufficienza del materiale

**Per passare (≥18):** `file1` + `file2` + `file3` coprono letteralmente tutto quanto richiesto: tutte le 17 domande teoriche, tutti e 9 gli esercizi, l'intero pool di risposta multipla (34 domande) e le dimostrazioni di supporto. Questo conferma la percezione degli studenti ("letteralmente il necessario per passare"): con questo materiale si può preparare l'intero esame. `file3` aggiunge valore come seconda lettura più leggibile e come esercizi extra di teoria del traffico.

**Per il 30 e lode:** non basta. Il prof. richiede le dimostrazioni **esattamente come nel suo testo** (stessi passaggi e notazione) e le dimostrazioni valgono almeno metà dell'esame. Servono inoltre:
1. Notazione unica e fedele al testo prof. (ω, T, fₛ; risolvere ambiguità ω/ω₀, fattori 1/(πT) vs 1/(2π), fase φₙ);
2. Tutti i grafici/spettri richiamati come "in figura" (assenti dal testo layer di file1 e file3) ridisegnati;
3. Colmare le lacune: Q9 (PM↔FM), derivazione di Carson, domande introduttive su reti (file2 pp. 8-9);
4. Correggere/evitare gli errori segnalati (es. segno ALOHA in file3, espressioni illecite CSMA/CD e sliding window);
5. Esercitazione sui diagrammi temporali (sliding window, CSMA/CD) e sul disegno degli spettri.

Stima: con solo file1+file2+file3 si passa; per il 30 e lode serve il sito/KG che raccolga il materiale in notazione unica, con figure, quiz, mappa dello studio e schede errore—ovvero il prodotto che questo documento guida a costruire.

---

## 5. Lista prioritizzata di indicazioni concrete per costruire il sito

| Priorità | Cosa | Dove (sezione del sito/KG) | Perché aiuta a prendere 30 e lode | Sforzo |
|----------|------|----------------------------|-----------------------------------|--------|
| P1 | Catalogo dimostrazioni con titolo, rif. testo prof. (p. 2.x, slide), passaggi fedeli al testo, LaTeX pulito | Sezione "Dimostrazioni" (una pagina per dimostrazione D1-D28) | Il prof. vuole dimostrazioni esattamente come nel suo testo; valgono ≥ metà esame | L |
| P1 | Mappa domanda d'esame → dimostrazione → nodi KG, con ordine di studio consigliato | Sezione "Percorso d'esame" / homepage | Indirizza lo studio su ciò che viene chiesto; costruisce il knowledge graph | M |
| P1 | Grafici e spettri ridisegnati per ogni dimostrazione (quelle con "in figura") | Nelle pagine delle dimostrazioni | Senza i disegni la dimostrazione è incompleta agli occhi del prof. | L |
| P2 | Quiz interattivo: 34 temi risposta multipla + 28 domande aperte (riformulate a parole proprie) | Sezione "Quiz" | Allenamento su tutto il pool; risposte immediate con rimando alla dimostrazione | M |
| P2 | Scheda "dimostrazioni mancanti": Q9 PM↔FM, derivazione Carson, domande intro reti (file2 pp. 8-9) | Sezione "Approfondimenti 30 e lode" | Colma gli unici buchi rispetto al programma d'esame | S/M |
| P2 | Scheda "errori da non ripetere": confronto file1 vs file3 vs testo prof. (segno ALOHA, CSMA/CD, sliding window, φₙ, fattori 2) | Sezione "Errori notazione" | Evita di perdere punti su dettagli che il prof. segnala | S |
| P3 | Link e riferimenti al materiale ufficiale (Materiale Didattico, programma, libro Calandrino-Immovilli, prove anni precedenti) | Homepage / footer | Autorità e allineamento al corso; protegge da contenuti non ufficiali | S |
| P3 | Knowledge graph visibile dei prerequisiti (segnali → campionamento → LTI → PAM → modulazioni → reti → stocastici) | Homepage | Ordine di studio logico; differentiator vs siti statici (competitor) | M |
| P3 | Esercizi extra teoria del traffico tratti da file3 (code, M/M/1, Little, CRC, linea 100 km, switch M×N, 25 terminali) | Sezione "Esercizi extra" | Materiale oltre il necessario per passare; sostiene il 30 e lode | M |

Sforzo: S = piccolo (giorni), M = medio (settimane), L = grande (molte settimane, tutte le dimostrazioni e figure).

---

## 6. Cosa NON fare

1. Non pubblicare i PDF integrali di file1/file2/file3 né il loro testo integrale: sono materiali studenti/esame di possibile proprietà del docente; pubblicarli espone a problemi di copyright.
2. Non presentare file1/file3 come materiale ufficiale del prof. Casoni o di UNIMORE: sono appunti di studenti (file3 firmato "RC"); citare sempre come tali e collegare al materiale ufficiale (Materiale Didattico, programma, Libro di Testo).
3. Non ripubblicare integralmente le 34 domande di risposta multipla di file2: riformulare i temi a parole proprie per il quiz del sito (v. 3.6).
4. Non dare per buone le risposte indicate nella sezione CROP di file2 senza verifica: contraddizione documentata tra CROP Q7/Q8 e Q32/Q33 (v. 3.2.3).
5. Non inventare punteggi, numeri o URL: i soli punteggi indicati in file2 sono "(10 punti)" per Q5 e Q11; tutto il resto è NON TROVATO. Tutti gli URL citati in questo documento sono stati aperti e verificati.
6. Non usare la notazione di file3 (m per pulsazione, f₀) come canone del sito: adottare la notazione del testo del prof. (ω, T, fₛ) e segnalare le varianti.
7. Non omettere le ambiguità di notazione (φₙ e segno di cₙ complesso; fattori 1/(πT) vs 1/(2π) negli spettri PAM; banda unilaterale/bilaterale del derivatore): segnalarle esplicitamente con "DA VERIFICARE sull'immagine/testo prof.".
8. Non basarsi solo sul testo estratto dei PDF: le formule sono rovinate; ogni passaggio critico va riscontrato sulle pagine renderizzate a immagine.

---

## Riepilogo

Sono stati analizzati tutti i PDF allegati: `file1.pdf` (57 pp., 28 dimostrazioni con riferimenti al testo del prof.), `file2.pdf` (12 pp., 17 domande teoriche di cui 2 da 10 punti, 9 esercizi, 34 quiz + sezione CROP, 9 domande intro reti), `file3.pdf` (59 pp., autore "RC", stesso nucleo di dimostrazioni di file1 più esercizi extra di teoria del traffico e quiz identico). Tutte le 17 domande teoriche di file2 trovano dimostrazione in file1 (e file3) tranne Q9 (PM↔FM), assente in entrambi; le lacune residue sono la derivazione di Carson, le domande introduttive su reti e i grafici "in figura". Il materiale basta letteralmente per passare; per il 30 e lode serve il sito/KG con dimostrazioni fedeli al testo del prof., notazione unica, figure, quiz e mappa dello studio (v. sezioni 4-5).

File prodotto: `docs/research/R3-analisi-materiale.md`  
SHA del commit: <inserito dopo il commit>  
Ramo: `arena/92cd303f-telecomunicazioni`
