# Piano di studio — ordine consigliato

> Generato automaticamente da `scripts/gen_docs.py`. Non modificare a mano.
> Ordine topologico deterministico: priorità alta → media → bassa, poi area e id.
> Le dimostrazioni con 10 punti (T5, T11) hanno priorità alta.

Totale nodi: 26 — pendenti: 1

## Percorso consigliato

| # | ID | Titolo | Area | Tipo | Priorità | Tempo | Prerequisiti |
|---|---|---|---|---|---|---|---|

| 1 | `segnali-deterministici` | Segnali deterministici: classi, energia e potenza | 1 | concetto | media | 45′ | — |
| 2 | `serie-fourier` | Serie di Fourier: forma esponenziale, ampiezza e fase | 1 | concetto | media | 60′ | segnali-deterministici |
| 3 | `es-spettri-impulsi-periodici` | Successione periodica: coefficienti, armoniche e fase | 1 | tipo_esercizio | alta | 35′ | serie-fourier |
| 4 | `trasformata-fourier` | Trasformata di Fourier: definizione, spettri e proprietà | 1 | concetto | alta | 75′ | serie-fourier |
| 5 | `dim-impulso-dirac-trasformata` | Funzione impulsiva di Dirac e sua trasformata di Fourier | 1 | dimostrazione | alta | 60′ | trasformata-fourier |
| 6 | `es-antitrasformata-rettangolare` | Spettro rettangolare: antitrasformata e sinc temporale | 1 | tipo_esercizio | alta | 35′ | trasformata-fourier |
| 7 | `es-spettri-impulso-rettangolare` | Rettangolo isolato: sinc continua, zeri e fase | 1 | tipo_esercizio | alta | 35′ | trasformata-fourier |
| 8 | `sistemi-lineari-funzione-trasferimento` | Sistemi lineari: funzione di trasferimento e non distorsione | 2 | concetto | alta | 60′ | trasformata-fourier |
| 9 | `dim-risposta-impulsiva-h` | Risposta impulsiva di una rete lineare e legame con la funzione di trasferimento | 2 | dimostrazione | alta | 70′ | sistemi-lineari-funzione-trasferimento, dim-impulso-dirac-trasformata |
| 10 | `es-rete-cr` | Rete CR passa-alto: modulo, fase e pulsazione di taglio | 2 | tipo_esercizio | alta | 35′ | sistemi-lineari-funzione-trasferimento |
| 11 | `es-rete-rc` | Rete RC passa-basso: modulo, fase e pulsazione di taglio | 2 | tipo_esercizio | alta | 35′ | sistemi-lineari-funzione-trasferimento |
| 12 | `filtri-ricorrenti-trasversali` | Filtri a tempo discreto: ricorrente, trasversale e puramente ricorrente | 2 | concetto | alta | 55′ | sistemi-lineari-funzione-trasferimento |
| 13 | `dim-filtro-trasversale` | Filtro trasversale: schema a blocchi e funzione di trasferimento | 2 | dimostrazione | alta | 60′ | filtri-ricorrenti-trasversali |
| 14 | `serie-temporali-trasformata` | Serie temporali e loro trasformata: ripetizione periodica dello spettro | 3 | concetto | alta | 60′ | trasformata-fourier |
| 15 | `dim-teorema-campionamento` | Teorema del campionamento nel dominio dei tempi | 3 | dimostrazione | alta | 80′ | serie-temporali-trasformata, dim-impulso-dirac-trasformata |
| 16 | `energia-potenza-spettri` | Energia, potenza e loro spettri: autocorrelazione e convenzione unilaterale | 1 | concetto | media | 60′ | trasformata-fourier |
| 17 | `processi-aleatori-stazionarieta-ergodicita` | Processi aleatori: medie, stazionarietà ed ergodicità | 3 | concetto | alta | 70′ | energia-potenza-spettri |
| 18 | `segnali-pam` | Segnali PAM: definizione, serie temporale e impulso formatore | 3 | concetto | alta | 55′ | serie-temporali-trasformata, energia-potenza-spettri |
| 19 | `dim-pam-due-spettri` | Segnali PAM: definizione e calcolo dei due spettri | 3 | dimostrazione | alta | 110′ | segnali-pam, processi-aleatori-stazionarieta-ergodicita |
| 20 | `es-pam-ami` | PAM AMI: correlazione a un simbolo e nulli completi | 3 | tipo_esercizio | alta | 35′ | dim-pam-due-spettri |
| 21 | `es-pam-bipolare` | PAM bipolare: media nulla e spettro sinc quadrato | 3 | tipo_esercizio | alta | 35′ | dim-pam-due-spettri |
| 22 | `criterio-nyquist-isi` | Criterio di Nyquist: condizione in frequenza per annullare l'interferenza intersimbolica | 3 | concetto | media | 65′ | serie-temporali-trasformata |
| 23 | `es-condizione-nyquist` | Condizione di Nyquist in frequenza: somma delle repliche | 3 | tipo_esercizio | alta | 35′ | criterio-nyquist-isi |
| 24 | `processi-gaussiani-funzione-errore` | Processi gaussiani e funzione errore | 3 | concetto | media | 55′ | processi-aleatori-stazionarieta-ergodicita |
| 25 | `es-derivatore-processo-gaussiano` | Derivatore gaussiano: spettro d’uscita e densità marginale | 3 | tipo_esercizio | alta | 35′ | processi-gaussiani-funzione-errore, sistemi-lineari-funzione-trasferimento |
| 26 | `es-teoria-traffico-extra` | Traffico extra: Little, tempi di linea e stabilità delle code | 7 | tipo_esercizio | bassa | 50′ | code-mm1-little |

## Nodi pendenti (in arrivo)

Questi nodi sono previsti dal contratto ma non ancora presenti nel grafo:

- `code-mm1-little`

## Note

- L'ordine rispetta le dipendenze: un nodo compare sempre dopo i suoi prerequisiti.
- A parità di vincoli, i nodi con priorità più alta vengono prima.
- Il tempo di studio è indicativo (minuti).
- Per la preparazione all'esame, iniziare da T5 e T11 (10 punti) con i loro prerequisiti.
