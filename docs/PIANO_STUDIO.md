# Piano di studio — ordine consigliato

> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.
> Ordine topologico deterministico: priorità alta → media → bassa, poi area e id.
> Le dimostrazioni con 10 punti (T5, T11) hanno priorità alta.

Totale nodi: 32 — pendenti: 0

## Percorso consigliato

| # | ID | Titolo | Area | Tipo | Priorità | Tempo | Prerequisiti |
|---|---|---|---|---|---|---|---|

| 1 | `processo-poisson` | Processo di Poisson e tempi tra arrivi | 7 | concetto | alta | 30′ | — |
| 2 | `dim-nascita-morte-equilibrio` | Probabilità di equilibrio nascita–morte | 7 | dimostrazione | alta | 45′ | processo-poisson |
| 3 | `dim-poisson-tempo-residuo` | Tempo residuo nel processo di Poisson | 7 | dimostrazione | alta | 40′ | processo-poisson |
| 4 | `segnali-deterministici` | Segnali deterministici: classi, energia e potenza | 1 | concetto | media | 45′ | — |
| 5 | `serie-fourier` | Serie di Fourier: forma esponenziale, ampiezza e fase | 1 | concetto | media | 60′ | segnali-deterministici |
| 6 | `trasformata-fourier` | Trasformata di Fourier: definizione, spettri e proprietà | 1 | concetto | alta | 75′ | serie-fourier |
| 7 | `dim-impulso-dirac-trasformata` | Funzione impulsiva di Dirac e sua trasformata di Fourier | 1 | dimostrazione | alta | 60′ | trasformata-fourier |
| 8 | `sistemi-lineari-funzione-trasferimento` | Sistemi lineari: funzione di trasferimento e non distorsione | 2 | concetto | alta | 60′ | trasformata-fourier |
| 9 | `dim-risposta-impulsiva-h` | Risposta impulsiva di una rete lineare e legame con la funzione di trasferimento | 2 | dimostrazione | alta | 70′ | sistemi-lineari-funzione-trasferimento, dim-impulso-dirac-trasformata |
| 10 | `filtri-ricorrenti-trasversali` | Filtri a tempo discreto: ricorrente, trasversale e puramente ricorrente | 2 | concetto | alta | 55′ | sistemi-lineari-funzione-trasferimento |
| 11 | `dim-filtro-trasversale` | Filtro trasversale: schema a blocchi e funzione di trasferimento | 2 | dimostrazione | alta | 60′ | filtri-ricorrenti-trasversali |
| 12 | `serie-temporali-trasformata` | Serie temporali e loro trasformata: ripetizione periodica dello spettro | 3 | concetto | alta | 60′ | trasformata-fourier |
| 13 | `dim-teorema-campionamento` | Teorema del campionamento nel dominio dei tempi | 3 | dimostrazione | alta | 80′ | serie-temporali-trasformata, dim-impulso-dirac-trasformata |
| 14 | `energia-potenza-spettri` | Energia, potenza e loro spettri: autocorrelazione e convenzione unilaterale | 1 | concetto | media | 60′ | trasformata-fourier |
| 15 | `processi-aleatori-stazionarieta-ergodicita` | Processi aleatori: medie, stazionarietà ed ergodicità | 3 | concetto | alta | 70′ | energia-potenza-spettri |
| 16 | `segnali-pam` | Segnali PAM: definizione, serie temporale e impulso formatore | 3 | concetto | alta | 55′ | serie-temporali-trasformata, energia-potenza-spettri |
| 17 | `dim-pam-due-spettri` | Segnali PAM: definizione e calcolo dei due spettri | 3 | dimostrazione | alta | 110′ | segnali-pam, processi-aleatori-stazionarieta-ergodicita |
| 18 | `criterio-nyquist-isi` | Criterio di Nyquist: condizione in frequenza per annullare l'interferenza intersimbolica | 3 | concetto | media | 65′ | serie-temporali-trasformata |
| 19 | `processi-gaussiani-funzione-errore` | Processi gaussiani e funzione errore | 3 | concetto | media | 55′ | processi-aleatori-stazionarieta-ergodicita |
| 20 | `reti-concetti-introduttivi` | Concetti introduttivi delle reti | 6 | concetto | media | 25′ | — |
| 21 | `parametro-a-propagazione-trasmissione` | Parametro a: propagazione e trasmissione | 6 | concetto | alta | 25′ | reti-concetti-introduttivi |
| 22 | `accesso-multiplo-deterministico-casuale` | Accesso multiplo deterministico e casuale | 6 | concetto | alta | 35′ | parametro-a-propagazione-trasmissione |
| 23 | `dim-aloha-throughput` | Throughput di ALOHA puro e slotted | 6 | dimostrazione | alta | 45′ | accesso-multiplo-deterministico-casuale, processo-poisson |
| 24 | `dim-csma-cd-throughput` | Throughput CSMA/CD in funzione di a | 6 | dimostrazione | alta | 45′ | dim-aloha-throughput, parametro-a-propagazione-trasmissione |
| 25 | `dim-ritardo-tdma-fdma` | Ritardo medio: TDMA e FDMA | 6 | dimostrazione | alta | 40′ | accesso-multiplo-deterministico-casuale |
| 26 | `architetture-iso-osi-tcpip` | Architetture ISO/OSI e TCP/IP | 6 | concetto | media | 25′ | reti-concetti-introduttivi |
| 27 | `protocolli-linea-hdlc-sliding-window` | HDLC e protocolli a finestra scorrevole | 6 | concetto | alta | 35′ | architetture-iso-osi-tcpip |
| 28 | `dim-sliding-window-efficienza` | Efficienza della finestra scorrevole senza errori | 6 | dimostrazione | alta | 45′ | protocolli-linea-hdlc-sliding-window |
| 29 | `codici-rivelazione-errore` | Codici per la rivelazione degli errori | 6 | concetto | media | 30′ | protocolli-linea-hdlc-sliding-window |
| 30 | `commutazione-circuito-pacchetto` | Commutazione di circuito e di pacchetto | 6 | concetto | media | 25′ | reti-concetti-introduttivi |
| 31 | `lan-ieee802-ethernet` | LAN, IEEE 802 ed Ethernet | 6 | concetto | bassa | 20′ | dim-csma-cd-throughput |
| 32 | `code-mm1-little` | Code M/M/1 e legge di Little | 7 | concetto | bassa | 30′ | dim-nascita-morte-equilibrio |

## Note

- L'ordine rispetta le dipendenze: un nodo compare sempre dopo i suoi prerequisiti.
- A parità di vincoli, i nodi con priorità più alta vengono prima.
- Il tempo di studio è indicativo (minuti).
- Per la preparazione all'esame, iniziare da T5 e T11 (10 punti) con i loro prerequisiti.
