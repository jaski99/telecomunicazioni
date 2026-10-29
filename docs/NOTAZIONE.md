# Notazione canonica del sito (aree 1-3) e convenzione degli spettri

> Documento di W3, previsto da `docs/CONTRACTS.md` §6. Fissa la notazione usata in tutti i nodi delle aree 1-3, registra le varianti presenti negli appunti di studenti (file1 e file3, mai pubblicati in questo repository) e decide i punti aperti A2, A3, A4 del piano, più la nota A1 sulla fase. Le pagine citate sono state lette sulle **immagini** delle pagine dei PDF, non sul testo estratto. I riferimenti «p. x.y» sono quelli scritti dallo studente in file1: che corrispondano a «capitolo.pagina» del libro di Calandrino e Immovilli è una **IPOTESI**; edizione e pagine effettive del libro sono **NON TROVATO** e nessuna formula di questo sito è dichiarata identica al testo del docente senza quel confronto.

## 1. Regole generali

- La notazione canonica è quella di file1, ritenuta la più vicina al testo del docente (R3 §3.3): $\omega$ per la pulsazione, $T$ per periodo di campionamento o di simbolo, $\omega_s = 2\pi/T$ per la pulsazione di campionamento, $\omega_0$ riservata alla portante (aree 4-5).
- In file3 la pulsazione generica è spesso scritta $m$ e la frequenza di campionamento $f_0 = 1/T$; in file1 la pulsazione di campionamento è scritta $\omega_0 = 2\pi/T$. Sono **varianti**: nei nodi compaiono solo nel campo `varianti_notazione`, mai nelle formule da memorizzare.
- Attenzione alla collisione più pericolosa: negli appunti sul campionamento $\omega_0$ è la pulsazione di **campionamento**, mentre nelle modulazioni (aree 4-5, fuori dallo scope di W3) $\omega_0$ è la **portante**. Nel sito la prima è sempre $\omega_s$.
- Le formule nei JSON usano LaTeX ($…$ in linea, $$…$$ in display); le etichette delle figure sono testo Unicode semplice (ω, τ, π, pedici come ₀), senza LaTeX.

## 2. Trasformata di Fourier e spettri di ampiezza e fase

Convenzione unica per tutto il sito (è quella di file1 pp. 2-3 e di CONTRACTS §6):

$$X(\omega) = F[x(t)] = \int_{-\infty}^{+\infty} x(t) e^{-j\omega t}\, dt, \qquad x(t) = F^{-1}[X(\omega)] = \frac{1}{2\pi} \int_{-\infty}^{+\infty} X(\omega) e^{j\omega t}\, d\omega.$$

Il fattore $1/(2\pi)$ sta **solo** nell'antitrasformata. Controllo rapido: $X(0) = \int x(t)\, dt$ è l'area del segnale; per l'impulso rettangolare di ampiezza $A$ e durata $\tau$ vale $X(0) = I = A\tau$ (file1 p. 2).

Per disegnare gli spettri di un segnale reale gli appunti usano gli spettri **unilaterali** definiti per $\omega \ge 0$ (file1 p. 2):

$$V(\omega) = \frac{|X(\omega)|}{\pi}, \qquad \varphi(\omega) = -\arg X(\omega), \qquad \omega \ge 0,$$

coerenti con la rappresentazione del segnale tramite i soli coseni a pulsazione positiva. Il fattore $1/\pi$ ha la stessa origine di quello dello spettro di potenza (§5): il contributo delle pulsazioni negative viene raccolto in quelle positive.

Coppie fondamentali delle aree 1-3, con $I = A\tau$:

| Segnale | Trasformata | Fonte |
|---|---|---|
| Impulso rettangolare centrato, ampiezza $A$, durata $\tau$ | $X(\omega) = I\, \dfrac{\sin(\omega\tau/2)}{\omega\tau/2}$, zeri in $\omega = 2\pi k/\tau$ | file1 p. 2 |
| Spettro rettangolare $X_0$ per $\|\omega\| \le \omega_m$ | $x(t) = \dfrac{X_0}{\pi}\, \dfrac{\sin \omega_m t}{t}$, con $x(0) = X_0\omega_m/\pi$ | file1 p. 3 |
| Funzione impulsiva $\delta(t)$ | $F[\delta(t)] = 1$ per ogni $\omega$ | file1 pp. 11-12, file3 pp. 3-4 (dimostrazione T2) |
| Impulso ausiliario $D(t,\Delta)$ | $F[D(t,\Delta)] = \dfrac{\sin(\omega\Delta/2)}{\omega\Delta/2}\, e^{-j\omega\Delta/2} \to 1$ per $\Delta \to 0$ | file1 p. 12, file3 p. 4 |

Definizione del seno cardinale (file1 p. 9): $\operatorname{sinc} z = \dfrac{\sin \pi z}{\pi z}$, con $\operatorname{sinc}(0) = 1$ e zeri negli interi non zero. Altri testi usano $\sin z / z$: chi cambia definizione deve cambiare anche la scrittura delle formule di ricostruzione.

## 3. Segnali periodici e nota A1 sulla fase $\varphi_n$

Per un segnale periodico di periodo $T$ si usa la forma esponenziale con pulsazione fondamentale $\Omega = 2\pi/T$ (scritta $\omega_0$ in file1: altra occorrenza della variante da non confondere con la portante):

$$x(t) = \sum_{n} c_n e^{jn\Omega t}, \qquad c_n = \frac{1}{T} \int_{-T/2}^{T/2} x(t) e^{-jn\Omega t}\, dt, \qquad 2c_n = A_n e^{-j\varphi_n} \;\; (n \ge 1).$$

Ne segue $A_n = 2|c_n|$ e **$\varphi_n = -\arg(c_n)$** (modulo $2\pi$); il segno meno viene dalla scrittura $e^{-j\varphi_n}$ di file1 p. 1 e va dichiarato, perché altri testi definiscono la fase con il segno opposto.

**Nota A1 (decisa).** La forma compatta degli appunti, $\varphi_n = 0$ se $c_n > 0$ e $\varphi_n = \pi$ se $c_n < 0$, ha senso solo quando i coefficienti sono **reali**. Ciò accade per la successione periodica di impulsi rettangolari **centrati in zero** (fra $-\tau/2$ e $\tau/2$, come nella figura di file1 p. 1), dove il segnale è reale e pari e

$$c_n = \frac{I}{T}\, \frac{\sin(n\Omega\tau/2)}{n\Omega\tau/2} \in \mathbb{R}, \qquad A_0 = \frac{I}{T}, \qquad A_n = \frac{2I}{T} \left| \frac{\sin(n\Omega\tau/2)}{n\Omega\tau/2} \right|.$$

Se l'impulso parte da $0$ e dura $\tau$ (centro in $\tau/2$), i coefficienti acquistano il fattore di ritardo:

$$c_n = \frac{I}{T}\, \frac{\sin(n\Omega\tau/2)}{n\Omega\tau/2}\, e^{-jn\Omega\tau/2}, \qquad \varphi_n = \frac{n\Omega\tau}{2} \; (+\pi \text{ dove il fattore reale è negativo}),$$

cioè una fase che cresce linearmente con $n$ più eventuali salti di $\pi$: non più solo i valori $0$ e $\pi$. Nei nodi `serie-fourier` e `trasformata-fourier` questa nota è riportata per esteso; lo stesso discorso vale in continuo per $\varphi(\omega)$ quando $X(\omega)$ non è reale.

## 4. Serie temporali, campionamento (A3) e banda di Nyquist

Simboli canonici:

| Simbolo | Significato | Varianti negli appunti |
|---|---|---|
| $x_n = x(nT)$ | campioni agli istanti $t_n = nT$; la successione è la serie temporale | $t_n$ generico prima di fissare l'origine (file1 p. 7) |
| $T$, $f_s = 1/T$, $\omega_s = 2\pi/T$ | intervallo, frequenza e pulsazione di campionamento | $f_0 = 1/T$ e $\omega_0 = 2\pi/T$ (file1 pp. 7-9, file3 pp. 1-2); $m_0$ in file3 |
| $X_s(\omega) = \sum_n x_n e^{-jn\omega T}$ | trasformata della serie temporale, periodica in $\omega$ di periodo $\omega_s$ | stessa scrittura in file1 p. 9 |
| $\omega_m$, $f_m = \omega_m/(2\pi)$ | massima pulsazione e frequenza a cui lo spettro del segnale è apprezzabile | $m_m$ in file3 |
| $\pi/T = \omega_s/2$ | banda di Nyquist $B_\omega$ nel criterio in frequenza (nodo `criterio-nyquist-isi`) | $B_\omega$ in file1 pp. 4-6 |

Relazione chiave (repliche): $X_s(\omega) = \dfrac{1}{T} \sum_{k} X(\omega + k\omega_s)$. Nella scrittura con il segno più, il termine $k = 1$ è centrato in $-\omega_s$ e quello $k = -1$ in $+\omega_s$, come nelle figure di file1 p. 8 e file3 p. 2.

**Punto A3 (deciso sulle immagini).** In file1 p. 9 si legge senza ambiguità:

$$X(\omega) = \begin{cases} T\, X_s(\omega) & |\omega| < \dfrac{\omega_s}{2} = \dfrac{\pi}{T} \\ 0 & \text{altrove} \end{cases} \qquad\Longrightarrow\qquad x(t) = \sum_{n} x(nT)\, \operatorname{sinc}\frac{t-nT}{T}.$$

Quindi il fattore «illeggibile» segnalato in R3 è proprio $T$: compensa il fattore $1/T$ della ripetizione, e la scelta della banda di ricostruzione è $\Omega = \omega_s/2$, punto centrale dell'intervallo ammesso $(\omega_m, \omega_s - \omega_m)$ (file1 p. 9). La ricostruzione con il seno cardinale è presente in file1 pp. 9-10 e **assente** in file3 pp. 1-2, che si ferma alla condizione di separazione $f_s \ge 2 f_m$: nella dimostrazione T1 il passo di ricostruzione è attribuito al solo file1.

La condizione di campionamento si scrive nelle tre forme equivalenti: $\omega_s \ge 2\omega_m$, $f_s \ge 2 f_m$, $T \le 1/(2 f_m)$.

## 5. Energia, potenza e la convenzione degli spettri (A2 deciso)

### 5.1 Energia

Per i segnali di energia: $\phi(\tau)$ è l'autocorrelazione, $F[\phi(\tau)] = |X(\omega)|^2$ è lo spettro di energia e $\phi(0) = E = \dfrac{1}{2\pi}\int_{-\infty}^{+\infty} |X(\omega)|^2\, d\omega$ (tema di quiz M29). In T5 questa relazione è applicata all'impulso formatore $g(t)$: $F[\phi(\tau)] = |G(\omega)|^2$, dove $G(\omega) = F[g(t)]$.

### 5.2 Potenza: decisione

**Punto A2 (deciso).** La densità spettrale di potenza del sito è **unilaterale in $\omega$**:

$$G(\omega) = \frac{1}{\pi}\, F[C(\tau)] \qquad (\omega \ge 0), \qquad P = C(0) = \int_{0}^{+\infty} G(\omega)\, d\omega,$$

dove $C(\tau) = \langle x(t) x(t+\tau) \rangle$ è l'autocorrelazione (media temporale, o statistica per i processi stazionari). Evidenze lette sulle immagini:

1. file1 p. 21 (e file3 pp. 13-14): $G_x(\omega) = \dfrac{F[C(\tau)]}{\pi} = \dfrac{1}{\pi T} |G(\omega)|^2 \left[ C_0 + 2\sum_{k\ge1} C_k \cos k\omega T \right]$ nel calcolo dello spettro PAM;
2. file1 p. 23: la potenza in uscita da un derivatore è calcolata come $P_y = G_0 \int_0^{\omega_m} \omega^2\, d\omega = \dfrac{G_0 \omega_m^3}{3}$, integrale sulle **sole pulsazioni positive** senza fattori aggiuntivi;
3. coerenza con gli spettri di ampiezza unilaterali $V(\omega) = |X(\omega)|/\pi$ per $\omega \ge 0$ di file1 p. 2.

Verifica algebrica: per segnali reali $F[C(\tau)]$ è reale e pari, quindi $C(0) = \dfrac{1}{2\pi}\int_{-\infty}^{+\infty} F[C]\, d\omega = \dfrac{1}{\pi}\int_0^{+\infty} F[C]\, d\omega = \int_0^{+\infty} G(\omega)\, d\omega$. Il fattore è $\pi$ e non $2\pi$ perché l'antitrasformata porta $1/(2\pi)$ e la parità raddoppia il semiasse positivo.

### 5.3 Conversione con la densità bilaterale (perché altrove compare $1/(2\pi T)$)

Chi definisce la densità bilaterale per radiante $\mathcal{S}(\omega) = \dfrac{1}{2\pi} F[C(\tau)]$ su tutto l'asse, con $P = \int_{-\infty}^{+\infty} \mathcal{S}(\omega)\, d\omega$, ha $\mathcal{S}(\omega) = G(\omega)/2$ per $\omega > 0$ (estesa pari per $\omega < 0$). Ne consegue che la formula dello spettro PAM di T5 si scrive:

- unilaterale (sito, file1 e file3): $G_x(\omega) = \dfrac{1}{\pi T} |G(\omega)|^2 \{ \dots \}$, $\omega \ge 0$;
- bilaterale per radiante: $\mathcal{S}_x(\omega) = \dfrac{1}{2\pi T} |G(\omega)|^2 \{ \dots \}$, $-\infty < \omega < +\infty$.

Non sono due risultati diversi: è la stessa potenza spalmata in modo diverso. L'errore da evitare è mescolare le definizioni (fattore dell'una, integrale dell'altra). Le densità in frequenza $f$ (hertz) non sono usate nei nodi W3; se servissero a valle, la conversione richiede inoltre $d\omega = 2\pi\, df$.

Attraverso una rete lineare vale, nella stessa convenzione in ingresso e in uscita, $G_y(\omega) = |H(\omega)|^2 G_x(\omega)$; per il derivatore $H(\omega) = j\omega$ e dunque $G_y(\omega) = \omega^2 G_0$ in $(0, \omega_m)$, come in file1 p. 23 (il punto A5 sull'esercizio E7, che applica questa stessa riga, è di W6).

## 6. Sistemi lineari e filtri (A4 deciso)

Quadripolo lineare permanente: $Y(\omega) = H(\omega) X(\omega)$ in frequenza e $y(t) = x(t) * h(t)$ nel tempo, con la coppia dimostrata in T4:

$$H(\omega) = F[h(t)] = \int_{-\infty}^{+\infty} h(t) e^{-j\omega t}\, dt, \qquad h(t) = F^{-1}[H(\omega)], \qquad h(t) \equiv 0 \;\; (t < 0) \text{ se la rete è causale},$$

dove $h(t) = \lim_{\Delta \to 0} y_\Delta(t)$ è la risposta all'impulso ausiliario $D(t,\Delta)$ di intensità unitaria (file1 pp. 17-18, file3 pp. 5-6).

**Punto A4 (deciso sulle immagini).** Per il filtro a linee di ritardo con celle da $T$, pesi $h_k$ ($k = 0, \dots, N-1$) sulle prese della linea di ingresso e pesi $h'_k$ ($k = 1, \dots, M$) su quelle della linea di uscita, file1 p. 15 e la pagina di file3 sullo stesso argomento (p. 32 nel sommario di R3, pagina a stampa 29) concordano su:

$$y(t) = \sum_{k=0}^{N-1} h_k\, x(t-kT) + \sum_{k=1}^{M} h'_k\, y(t-kT), \qquad H(\omega) = \frac{\sum_{k=0}^{N-1} h_k e^{-jk\omega T}}{1 - \sum_{k=1}^{M} h'_k e^{-jk\omega T}},$$

con $H(\omega)$ periodica in $\omega$ di periodo $2\pi/T$ (nota leggibile in entrambe le fonti). Casi particolari: **trasversale** ($h'_k = 0$ per ogni $k$): $H(\omega) = \sum_{k=0}^{N-1} h_k e^{-jk\omega T}$, solo zeri; **puramente ricorrente** ($h_0 = 1$, $h_k = 0$ per $k \ge 1$): solo il denominatore, solo poli; **ricorrente** in generale: zeri e poli (temi M16-M18). La distinzione fra gli indici iniziali delle due somme ($0$ contro $1$) è parte della formula, non un dettaglio tipografico.

## 7. Simboli dei PAM e dei processi aleatori

| Simbolo | Significato | Note |
|---|---|---|
| $s(t) = \sum_n a_n g(t-nT) = \{a_n\} * g(t)$ | segnale PAM | $\{a_n\} * g(t)$ è la convoluzione fra serie temporale e funzione tempo-continua (file1 p. 19) |
| $\langle a_n \rangle$, $\langle a_n^2 \rangle$, $\langle a_n a_{n+k} \rangle$ | medie temporali dei simboli e dei loro prodotti a distanza $k$ | $\langle a_n^2 \rangle = \lim_{N\to\infty} \frac{1}{2N}\sum_{-N}^{N} a_n^2 < \infty$ negli appunti (con $2N$ o $2N+1$ termini a seconda della pagina: il limite è lo stesso) |
| $x_n = a_n - \langle a_n \rangle$ | simboli centrati, a valor medio zero | esistono i limiti $C_k = \langle x_n x_{n+k} \rangle$ (ipotesi di parziale coerenza) |
| $s_m(t) = \langle a_n \rangle \sum_n g(t-nT)$ | componente periodica del PAM | spettro a righe con $c_n = \dfrac{\langle a_n \rangle}{T} G\!\left(\dfrac{2\pi n}{T}\right)$ |
| $C(\tau) = \langle x(t) x(t+\tau) \rangle$ | autocorrelazione della componente a media zero | $C(\tau) = \dfrac{1}{T} \{C_k\} * \phi(\tau)$ in T5 |
| $G(\omega)$ in $\|G(\omega)\|^2$ | trasformata $F[g(t)]$ dell'impulso formatore | attenzione: è **omonima** ma distinta dallo spettro di potenza $G_x(\omega)$; il contesto (con o senza pedice) le distingue, come in file1 |
| $E[\cdot]$, $\langle \cdot \rangle$ | media statistica e media temporale | coincidono per le grandezze dichiarate sotto l'ipotesi di ergodicità |
| $p_1(y)$, $\sigma^2$ | densità di probabilità del primo ordine e varianza | per i gaussiani $p_1(y) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-(y-m)^2/(2\sigma^2)}$ |
| $\operatorname{erf}(z) = \frac{2}{\sqrt{\pi}} \int_0^z e^{-u^2} du$ | funzione degli errori | definizione **standard** qui dichiarata; la forma adottata nel testo del docente è NON TROVATO nel materiale verificato |

## 8. Tabella riassuntiva delle varianti (canonica contro appunti)

| Grandezza | Canonica del sito | file1 | file3 |
|---|---|---|---|
| Pulsazione generica | $\omega$ | $\omega$ | spesso $m$ |
| Trasformata | $F[\cdot]$, $1/(2\pi)$ solo nell'inversa | idem | idem, con simbolo calligrafico |
| Pulsazione di campionamento | $\omega_s = 2\pi/T$, $f_s = 1/T$ | $\omega_0 = 2\pi/T$, $f_0 = 1/T$ | $f_0 = 1/T$, $m_0 = 2\pi/T$ |
| Pulsazione fondamentale (serie) | $\Omega = 2\pi/T$ | $\omega_0$ | — |
| Portante (aree 4-5) | $\omega_0$ | $\omega_0$ in quel contesto | — |
| Massima pulsazione del segnale | $\omega_m$ | $\omega_m$ | $\omega_m$ |
| Spettro di ampiezza (energia) | $V(\omega) = \|X(\omega)\|/\pi$, $\omega \ge 0$ | idem, p. 2 | — |
| Spettro di potenza | $G(\omega) = F[C]/\pi$, $\omega \ge 0$, $P = \int_0^{\infty} G$ | idem, pp. 21-23 | idem, pp. 13-14 |
| Trasformata della serie temporale | $X_s(\omega)$ | $X_s(\omega)$ | $X_s$ con $m$ come variabile |
| Pesi di retroazione dei filtri | $h'_k$ | $h'_k$ | $h'_k$ |
| Seno cardinale | $\operatorname{sinc} z = \sin(\pi z)/(\pi z)$ | idem, p. 9 | — |

## 9. Esempi di controllo (da rifare se cambia una convenzione)

1. **Potenza unilaterale.** Se $G(\omega) = 0{,}5$ per $0 \le \omega \le 4\ \mathrm{rad/s}$ e zero oltre, allora $P = 0{,}5 \cdot 4 = 2$. La densità bilaterale equivalente vale $0{,}25$ su $(-4, 4)$ e dà la stessa $P$ integrando su tutto l'asse.
2. **Fattore $T$ di ricostruzione.** Con $T = 0{,}001\ \mathrm{s}$ la ripetizione porta il fattore $1/T = 1000$; in banda $X_s(\omega) = X(\omega)/T$ e serve moltiplicare per $T$ per riottenere $X(\omega)$: dimenticarlo scala il segnale ricostruito di un fattore $1000$.
3. **PAM con simboli centrati e incorrelati.** Se $\langle a_n \rangle = 0$ e $C_k = 0$ per $k \ne 0$, la formula di T5 si riduce a $G_x(\omega) = \dfrac{1}{\pi T} |G(\omega)|^2 \langle a_n^2 \rangle$ per $\omega \ge 0$; nella convenzione bilaterale lo stesso risultato è scritto con $1/(2\pi T)$. Le righe sono assenti perché il valor medio è zero.
4. **Filtro trasversale in continua.** In $\omega = 0$ ogni $e^{-jk\omega T}$ vale $1$, quindi $H(0) = \sum_k h_k$: primo controllo numerico su qualunque $H(\omega)$ della famiglia.

## 10. Punti aperti residui sulle convenzioni

- Edizione del libro di Calandrino e Immovilli e corrispondenza dei riferimenti «p. x.y»: **NON TROVATO** (punto A16 del coordinatore). Finché manca il confronto con il libro, gli stati di verifica delle dimostrazioni restano `verificata_file1_file3` e non «identica al testo del docente».
- La definizione della funzione errore nel testo del docente è NON TROVATO: nel nodo `processi-gaussiani-funzione-errore` è usata e dichiarata la definizione standard, marcata come ricostruzione nelle fonti.
- Se il confronto con il libro imponesse la densità bilaterale, la decisione A2 va ribaltata in un solo punto (definizione in §5.2, fattore in T5 e negli esercizi E7-E9 di W6): la tabella di conversione in §5.3 è scritta per rendere quel cambio meccanico e verificabile dai test numerici.
