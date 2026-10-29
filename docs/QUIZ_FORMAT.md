# Formato della banca quiz

La fonte dati è `graph/quiz.json`, oggetto versione 1 con `descrizione` ed `elementi`. Ogni elemento ha ID univoco `q-…`, area 1–7, `nodo_id` del contratto, temi di prova, domanda riformulata e spiegazione di almeno 40 caratteri. Sono presenti temi M1–M34, I1–I9 e il pool P1–P28: i riferimenti identificano l’argomento, non riproducono i testi della raccolta.

Tipi: `scelta_multipla` con 3–4 opzioni e `corretta`; ogni distrattore include `perche_sbagliata` e resta sullo stesso concetto. `vero_falso` con `affermazione` e booleano `risposta_corretta`; `completamento_formula` con segnaposto consecutivi e array di varianti accettate. Le posizioni della risposta corretta sono distribuite.

Chiave PM→FM: integratore prima del modulatore PM; FM→PM: derivatore prima del modulatore FM. Le croci della sezione CROP 7/8 non sono usate. Punteggi non dichiarati restano `NON TROVATO`. Per SSB-BC la raccolta la associa alla conversione di frequenza in salita; l’equivalenza terminologica come definizione generale è NON TROVATO.

La durata di simulazione nel modulo è configurabile ed è marcata come ipotesi, mai come tempo ufficiale.
