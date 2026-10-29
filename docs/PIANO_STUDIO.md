# Piano di studio — ordine consigliato

> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.
> Ordine topologico deterministico: priorità alta → media → bassa, poi area e id.
> Le dimostrazioni con 10 punti (T5, T11) hanno priorità alta.

Totale nodi: 56 — pendenti: 0

## Percorso consigliato

| # | ID | Titolo | Area | Tipo | Priorità | Tempo | Prerequisiti |
|---|---|---|---|---|---|---|---|

| 1 | `processo-poisson` | Processo di Poisson e tempi tra arrivi | 7 | concetto | alta | 30′ | — |
| 2 | `dim-nascita-morte-equilibrio` | Probabilità di equilibrio nascita–morte | 7 | dimostrazione | alta | 45′ | processo-poisson |
| 3 | `dim-poisson-tempo-residuo` | Tempo residuo nel processo di Poisson | 7 | dimostrazione | alta | 40′ | processo-poisson |
| 4 | `segnali-deterministici` | Segnali deterministici: classi, energia e potenza | 1 | concetto | media | 45′ | — |
| 5 | `serie-fourier` | Serie di Fourier: forma esponenziale, ampiezza e fase | 1 | concetto | media | 60′ | segnali-deterministici |
| 6 | `es-spettri-impulsi-periodici` | Successione periodica: coefficienti, armoniche e fase | 1 | tipo_esercizio | alta | 35′ | serie-fourier |
| 7 | `trasformata-fourier` | Trasformata di Fourier: definizione, spettri e proprietà | 1 | concetto | alta | 75′ | serie-fourier |
| 8 | `dim-impulso-dirac-trasformata` | Funzione impulsiva di Dirac e sua trasformata di Fourier | 1 | dimostrazione | alta | 60′ | trasformata-fourier |
| 9 | `es-antitrasformata-rettangolare` | Spettro rettangolare: antitrasformata e sinc temporale | 1 | tipo_esercizio | alta | 35′ | trasformata-fourier |
| 10 | `es-spettri-impulso-rettangolare` | Rettangolo isolato: sinc continua, zeri e fase | 1 | tipo_esercizio | alta | 35′ | trasformata-fourier |
| 11 | `sistemi-lineari-funzione-trasferimento` | Sistemi lineari: funzione di trasferimento e non distorsione | 2 | concetto | alta | 60′ | trasformata-fourier |
| 12 | `dim-risposta-impulsiva-h` | Risposta impulsiva di una rete lineare e legame con la funzione di trasferimento | 2 | dimostrazione | alta | 70′ | sistemi-lineari-funzione-trasferimento, dim-impulso-dirac-trasformata |
| 13 | `es-rete-cr` | Rete CR passa-alto: modulo, fase e pulsazione di taglio | 2 | tipo_esercizio | alta | 35′ | sistemi-lineari-funzione-trasferimento |
| 14 | `es-rete-rc` | Rete RC passa-basso: modulo, fase e pulsazione di taglio | 2 | tipo_esercizio | alta | 35′ | sistemi-lineari-funzione-trasferimento |
| 15 | `filtri-ricorrenti-trasversali` | Filtri a tempo discreto: ricorrente, trasversale e puramente ricorrente | 2 | concetto | alta | 55′ | sistemi-lineari-funzione-trasferimento |
| 16 | `dim-filtro-trasversale` | Filtro trasversale: schema a blocchi e funzione di trasferimento | 2 | dimostrazione | alta | 60′ | filtri-ricorrenti-trasversali |
| 17 | `serie-temporali-trasformata` | Serie temporali e loro trasformata: ripetizione periodica dello spettro | 3 | concetto | alta | 60′ | trasformata-fourier |
| 18 | `dim-teorema-campionamento` | Teorema del campionamento nel dominio dei tempi | 3 | dimostrazione | alta | 80′ | serie-temporali-trasformata, dim-impulso-dirac-trasformata |
| 19 | `conversione-ad-quantizzazione-pcm` | Conversione A/D, quantizzazione e PCM | 4 | concetto | alta | 60′ | dim-teorema-campionamento |
| 20 | `dim-conversione-ad` | Campionamento, quantizzazione e codifica | 4 | dimostrazione | alta | 50′ | conversione-ad-quantizzazione-pcm |
| 21 | `dim-conversione-da` | Decodifica e ricostruzione analogica | 4 | dimostrazione | alta | 50′ | dim-conversione-ad |
| 22 | `segnali-passa-banda-inviluppo-complesso` | Segnali passa-banda e inviluppo complesso | 5 | concetto | alta | 60′ | trasformata-fourier |
| 23 | `dim-quadripoli-passa-basso-equivalente` | Quadripolo ed equivalente in banda base | 5 | dimostrazione | alta | 90′ | segnali-passa-banda-inviluppo-complesso, sistemi-lineari-funzione-trasferimento |
| 24 | `modulazione-prodotto-dsb-ssb` | Modulazione a prodotto, DSB e SSB | 5 | concetto | alta | 60′ | segnali-passa-banda-inviluppo-complesso |
| 25 | `demodulazione-coerente-non-coerente` | Demodulazione coerente e non coerente | 5 | concetto | alta | 60′ | modulazione-prodotto-dsb-ssb |
| 26 | `dim-modulazione-prodotto-qam-errore-fase` | QAM ed errore di fase coerente | 5 | dimostrazione | alta | 70′ | demodulazione-coerente-non-coerente |
| 27 | `dim-spettri-modulazione-prodotto` | Spettri delle bande laterali DSB | 5 | dimostrazione | alta | 70′ | modulazione-prodotto-dsb-ssb |
| 28 | `modulazioni-angolo-pm-fm` | Modulazioni d’angolo PM e FM | 5 | concetto | alta | 60′ | segnali-passa-banda-inviluppo-complesso |
| 29 | `dim-pm-fm-trasformazione` | Trasformazione tra PM e FM | 5 | dimostrazione | alta | 45′ | modulazioni-angolo-pm-fm |
| 30 | `energia-potenza-spettri` | Energia, potenza e loro spettri: autocorrelazione e convenzione unilaterale | 1 | concetto | media | 60′ | trasformata-fourier |
| 31 | `processi-aleatori-stazionarieta-ergodicita` | Processi aleatori: medie, stazionarietà ed ergodicità | 3 | concetto | alta | 70′ | energia-potenza-spettri |
| 32 | `segnali-pam` | Segnali PAM: definizione, serie temporale e impulso formatore | 3 | concetto | alta | 55′ | serie-temporali-trasformata, energia-potenza-spettri |
| 33 | `dim-pam-due-spettri` | Segnali PAM: definizione e calcolo dei due spettri | 3 | dimostrazione | alta | 110′ | segnali-pam, processi-aleatori-stazionarieta-ergodicita |
| 34 | `es-pam-ami` | PAM AMI: correlazione a un simbolo e nulli completi | 3 | tipo_esercizio | alta | 35′ | dim-pam-due-spettri |
| 35 | `es-pam-bipolare` | PAM bipolare: media nulla e spettro sinc quadrato | 3 | tipo_esercizio | alta | 35′ | dim-pam-due-spettri |
| 36 | `criterio-nyquist-isi` | Criterio di Nyquist: condizione in frequenza per annullare l'interferenza intersimbolica | 3 | concetto | media | 65′ | serie-temporali-trasformata |
| 37 | `es-condizione-nyquist` | Condizione di Nyquist in frequenza: somma delle repliche | 3 | tipo_esercizio | alta | 35′ | criterio-nyquist-isi |
| 38 | `processi-gaussiani-funzione-errore` | Processi gaussiani e funzione errore | 3 | concetto | media | 55′ | processi-aleatori-stazionarieta-ergodicita |
| 39 | `es-derivatore-processo-gaussiano` | Derivatore gaussiano: spettro d’uscita e densità marginale | 3 | tipo_esercizio | alta | 35′ | processi-gaussiani-funzione-errore, sistemi-lineari-funzione-trasferimento |
| 40 | `collegamento-numerico-tdm-pcm` | Collegamento numerico TDM e PCM | 4 | concetto | media | 60′ | dim-conversione-ad, criterio-nyquist-isi |
| 41 | `dim-formula-carson` | Regola di Carson | 5 | dimostrazione | media | 45′ | modulazioni-angolo-pm-fm |
| 42 | `modulazioni-numeriche` | Modulazioni numeriche e costellazioni | 5 | concetto | media | 60′ | modulazione-prodotto-dsb-ssb, segnali-pam |
| 43 | `reti-concetti-introduttivi` | Concetti introduttivi delle reti | 6 | concetto | media | 25′ | — |
| 44 | `parametro-a-propagazione-trasmissione` | Parametro a: propagazione e trasmissione | 6 | concetto | alta | 25′ | reti-concetti-introduttivi |
| 45 | `accesso-multiplo-deterministico-casuale` | Accesso multiplo deterministico e casuale | 6 | concetto | alta | 35′ | parametro-a-propagazione-trasmissione |
| 46 | `dim-aloha-throughput` | Throughput di ALOHA puro e slotted | 6 | dimostrazione | alta | 45′ | accesso-multiplo-deterministico-casuale, processo-poisson |
| 47 | `dim-csma-cd-throughput` | Throughput CSMA/CD in funzione di a | 6 | dimostrazione | alta | 45′ | dim-aloha-throughput, parametro-a-propagazione-trasmissione |
| 48 | `dim-ritardo-tdma-fdma` | Ritardo medio: TDMA e FDMA | 6 | dimostrazione | alta | 40′ | accesso-multiplo-deterministico-casuale |
| 49 | `architetture-iso-osi-tcpip` | Architetture ISO/OSI e TCP/IP | 6 | concetto | media | 25′ | reti-concetti-introduttivi |
| 50 | `protocolli-linea-hdlc-sliding-window` | HDLC e protocolli a finestra scorrevole | 6 | concetto | alta | 35′ | architetture-iso-osi-tcpip |
| 51 | `dim-sliding-window-efficienza` | Efficienza della finestra scorrevole senza errori | 6 | dimostrazione | alta | 45′ | protocolli-linea-hdlc-sliding-window |
| 52 | `codici-rivelazione-errore` | Codici per la rivelazione degli errori | 6 | concetto | media | 30′ | protocolli-linea-hdlc-sliding-window |
| 53 | `commutazione-circuito-pacchetto` | Commutazione di circuito e di pacchetto | 6 | concetto | media | 25′ | reti-concetti-introduttivi |
| 54 | `lan-ieee802-ethernet` | LAN, IEEE 802 ed Ethernet | 6 | concetto | bassa | 20′ | dim-csma-cd-throughput |
| 55 | `code-mm1-little` | Code M/M/1 e legge di Little | 7 | concetto | bassa | 30′ | dim-nascita-morte-equilibrio |
| 56 | `es-teoria-traffico-extra` | Traffico extra: Little, tempi di linea e stabilità delle code | 7 | tipo_esercizio | bassa | 50′ | code-mm1-little |

## Note

- L'ordine rispetta le dipendenze: un nodo compare sempre dopo i suoi prerequisiti.
- A parità di vincoli, i nodi con priorità più alta vengono prima.
- Il tempo di studio è indicativo (minuti).
- Per la preparazione all'esame, iniziare da T5 e T11 (10 punti) con i loro prerequisiti.
