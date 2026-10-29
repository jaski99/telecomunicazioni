# Piano di studio — ordine consigliato

> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.
> Ordine topologico deterministico: priorità alta → media → bassa, poi area e id.
> Le dimostrazioni con 10 punti (T5, T11) hanno priorità alta.

Totale nodi: 23 — pendenti: 5

## Percorso consigliato

| # | ID | Titolo | Area | Tipo | Priorità | Tempo | Prerequisiti |
|---|---|---|---|---|---|---|---|

| 1 | `dim-conversione-ad` | Descrivere i tre passi della conversione A/D e il segnale numerico ottenuto | 4 | dimostrazione | alta | 50′ | conversione-ad-quantizzazione-pcm |
| 2 | `dim-conversione-da` | Descrivere la conversione D/A e la ricostruzione tramite filtro passa-basso | 4 | dimostrazione | alta | 50′ | dim-conversione-ad |
| 3 | `dim-modulazione-prodotto-qam-errore-fase` | Ricavare la demodulazione a prodotto e la QAM con errore di fase | 5 | dimostrazione | alta | 70′ | demodulazione-coerente-non-coerente |
| 4 | `dim-pm-fm-trasformazione` | Trasformazione tra PM e FM | 5 | dimostrazione | alta | 45′ | modulazioni-angolo-pm-fm |
| 5 | `dim-spettri-modulazione-prodotto` | Ricavare gli spettri di ampiezza e fase di una modulazione a prodotto | 5 | dimostrazione | alta | 70′ | modulazione-prodotto-dsb-ssb |
| 6 | `segnali-deterministici` | Segnali deterministici: classi, energia e potenza | 1 | concetto | media | 45′ | — |
| 7 | `serie-fourier` | Serie di Fourier: forma esponenziale, ampiezza e fase | 1 | concetto | media | 60′ | segnali-deterministici |
| 8 | `trasformata-fourier` | Trasformata di Fourier: definizione, spettri e proprietà | 1 | concetto | alta | 75′ | serie-fourier |
| 9 | `dim-impulso-dirac-trasformata` | Funzione impulsiva di Dirac e sua trasformata di Fourier | 1 | dimostrazione | alta | 60′ | trasformata-fourier |
| 10 | `sistemi-lineari-funzione-trasferimento` | Sistemi lineari: funzione di trasferimento e non distorsione | 2 | concetto | alta | 60′ | trasformata-fourier |
| 11 | `dim-risposta-impulsiva-h` | Risposta impulsiva di una rete lineare e legame con la funzione di trasferimento | 2 | dimostrazione | alta | 70′ | sistemi-lineari-funzione-trasferimento, dim-impulso-dirac-trasformata |
| 12 | `filtri-ricorrenti-trasversali` | Filtri a tempo discreto: ricorrente, trasversale e puramente ricorrente | 2 | concetto | alta | 55′ | sistemi-lineari-funzione-trasferimento |
| 13 | `dim-filtro-trasversale` | Filtro trasversale: schema a blocchi e funzione di trasferimento | 2 | dimostrazione | alta | 60′ | filtri-ricorrenti-trasversali |
| 14 | `serie-temporali-trasformata` | Serie temporali e loro trasformata: ripetizione periodica dello spettro | 3 | concetto | alta | 60′ | trasformata-fourier |
| 15 | `dim-teorema-campionamento` | Teorema del campionamento nel dominio dei tempi | 3 | dimostrazione | alta | 80′ | serie-temporali-trasformata, dim-impulso-dirac-trasformata |
| 16 | `dim-quadripoli-passa-basso-equivalente` | Quadripoli lineari ed equivalente passa-basso | 5 | dimostrazione | alta | 90′ | segnali-passa-banda-inviluppo-complesso, sistemi-lineari-funzione-trasferimento |
| 17 | `energia-potenza-spettri` | Energia, potenza e loro spettri: autocorrelazione e convenzione unilaterale | 1 | concetto | media | 60′ | trasformata-fourier |
| 18 | `processi-aleatori-stazionarieta-ergodicita` | Processi aleatori: medie, stazionarietà ed ergodicità | 3 | concetto | alta | 70′ | energia-potenza-spettri |
| 19 | `segnali-pam` | Segnali PAM: definizione, serie temporale e impulso formatore | 3 | concetto | alta | 55′ | serie-temporali-trasformata, energia-potenza-spettri |
| 20 | `dim-pam-due-spettri` | Segnali PAM: definizione e calcolo dei due spettri | 3 | dimostrazione | alta | 110′ | segnali-pam, processi-aleatori-stazionarieta-ergodicita |
| 21 | `criterio-nyquist-isi` | Criterio di Nyquist: condizione in frequenza per annullare l'interferenza intersimbolica | 3 | concetto | media | 65′ | serie-temporali-trasformata |
| 22 | `processi-gaussiani-funzione-errore` | Processi gaussiani e funzione errore | 3 | concetto | media | 55′ | processi-aleatori-stazionarieta-ergodicita |
| 23 | `dim-formula-carson` | Regola di Carson | 5 | dimostrazione | media | 45′ | modulazioni-angolo-pm-fm |

## Nodi pendenti (in arrivo)

Questi nodi sono previsti dal contratto ma non ancora presenti nel grafo:

- `conversione-ad-quantizzazione-pcm`
- `demodulazione-coerente-non-coerente`
- `modulazione-prodotto-dsb-ssb`
- `modulazioni-angolo-pm-fm`
- `segnali-passa-banda-inviluppo-complesso`

## Note

- L'ordine rispetta le dipendenze: un nodo compare sempre dopo i suoi prerequisiti.
- A parità di vincoli, i nodi con priorità più alta vengono prima.
- Il tempo di studio è indicativo (minuti).
- Per la preparazione all'esame, iniziare da T5 e T11 (10 punti) con i loro prerequisiti.
