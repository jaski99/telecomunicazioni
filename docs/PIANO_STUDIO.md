# Piano di studio — ordine consigliato

> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.
> Ordine topologico deterministico: priorità alta → media → bassa, poi area e id.
> Le dimostrazioni con 10 punti (T5, T11) hanno priorità alta.

Totale nodi: 16 — pendenti: 0

## Percorso consigliato

| # | ID | Titolo | Area | Tipo | Priorità | Tempo | Prerequisiti |
|---|---|---|---|---|---|---|---|

| 1 | `segnali-deterministici` | Segnali deterministici: classi, energia e potenza | 1 | concetto | media | 45′ | — |
| 2 | `serie-fourier` | Serie di Fourier: forma esponenziale, ampiezza e fase | 1 | concetto | media | 60′ | segnali-deterministici |
| 3 | `trasformata-fourier` | Trasformata di Fourier: definizione, spettri e proprietà | 1 | concetto | alta | 75′ | serie-fourier |
| 4 | `dim-impulso-dirac-trasformata` | Funzione impulsiva di Dirac e sua trasformata di Fourier | 1 | dimostrazione | alta | 60′ | trasformata-fourier |
| 5 | `sistemi-lineari-funzione-trasferimento` | Sistemi lineari: funzione di trasferimento e non distorsione | 2 | concetto | alta | 60′ | trasformata-fourier |
| 6 | `dim-risposta-impulsiva-h` | Risposta impulsiva di una rete lineare e legame con la funzione di trasferimento | 2 | dimostrazione | alta | 70′ | sistemi-lineari-funzione-trasferimento, dim-impulso-dirac-trasformata |
| 7 | `filtri-ricorrenti-trasversali` | Filtri a tempo discreto: ricorrente, trasversale e puramente ricorrente | 2 | concetto | alta | 55′ | sistemi-lineari-funzione-trasferimento |
| 8 | `dim-filtro-trasversale` | Filtro trasversale: schema a blocchi e funzione di trasferimento | 2 | dimostrazione | alta | 60′ | filtri-ricorrenti-trasversali |
| 9 | `serie-temporali-trasformata` | Serie temporali e loro trasformata: ripetizione periodica dello spettro | 3 | concetto | alta | 60′ | trasformata-fourier |
| 10 | `dim-teorema-campionamento` | Teorema del campionamento nel dominio dei tempi | 3 | dimostrazione | alta | 80′ | serie-temporali-trasformata, dim-impulso-dirac-trasformata |
| 11 | `energia-potenza-spettri` | Energia, potenza e loro spettri: autocorrelazione e convenzione unilaterale | 1 | concetto | media | 60′ | trasformata-fourier |
| 12 | `processi-aleatori-stazionarieta-ergodicita` | Processi aleatori: medie, stazionarietà ed ergodicità | 3 | concetto | alta | 70′ | energia-potenza-spettri |
| 13 | `segnali-pam` | Segnali PAM: definizione, serie temporale e impulso formatore | 3 | concetto | alta | 55′ | serie-temporali-trasformata, energia-potenza-spettri |
| 14 | `dim-pam-due-spettri` | Segnali PAM: definizione e calcolo dei due spettri | 3 | dimostrazione | alta | 110′ | segnali-pam, processi-aleatori-stazionarieta-ergodicita |
| 15 | `criterio-nyquist-isi` | Criterio di Nyquist: condizione in frequenza per annullare l'interferenza intersimbolica | 3 | concetto | media | 65′ | serie-temporali-trasformata |
| 16 | `processi-gaussiani-funzione-errore` | Processi gaussiani e funzione errore | 3 | concetto | media | 55′ | processi-aleatori-stazionarieta-ergodicita |

## Note

- L'ordine rispetta le dipendenze: un nodo compare sempre dopo i suoi prerequisiti.
- A parità di vincoli, i nodi con priorità più alta vengono prima.
- Il tempo di studio è indicativo (minuti).
- Per la preparazione all'esame, iniziare da T5 e T11 (10 punti) con i loro prerequisiti.
