# Redesign UX e formule — Round D

Motivo: l'utente giudica il sito illeggibile (formule brutte, testo appiccicato e accavallato, nessuna armonia). Audit completo con screenshot: fatto dal coordinatore il 29/10/2026 su main `c253f44` (sintesi in §1). Questo piano è **vincolante** per i worker D1–D4 (e D5 se attivato) e si affianca a [CONTRACTS.md](CONTRACTS.md), che resta valido per dati, ID, comandi e regole CI.

**Vincolo assoluto:** D1–D4 non cambiano i contenuti didattici in `graph/` (né `web/graph.json`, `web/quiz.json`, che sono generati). Si cambia solo *come* sono mostrati.

## 1. Difetti da eliminare (audit)

| # | Difetto | Causa |
|---|---|---|
| F1 | Formule dei passi e formula finale in stile inline: frazioni minuscole, limiti di somma/integrale a lato, niente centratura | `dimostrazione.js` avvolge i campi *LaTeX puro* con `$…$` invece di renderli in display |
| F2 | Formule spezzate a metà riga su mobile | inline KaTeX va a capo dopo `=` |
| F3 | Formule e colonne di tabella tagliate e irraggiungibili | `html, body { overflow-x: hidden }` in `app.css`; tabelle senza wrapper |
| F4 | Frazioni inline nella prosa accavallano le righe | `line-height` 1.6 + `\frac` inline |
| F5 | Nessuna formula chiave evidenziata | manca un componente "box formula" |
| L1 | Testo e card a 0 px dal bordo; a 1440 px righe da ~190 caratteri | `main#app` senza container né larghezza di lettura |
| L2 | Corpo 16 px, secondari 12–14 px, titoli quasi uguali al testo, margini 2–19 px casuali | nessun design system |
| L3 | Header doppio (283 px su 844 senza contenuto) | `index.html` + `navHTML()` |
| L4 | Pagina dimostrazione: modalità a 2270 px su 2817, passi in fondo, ID e valori grezzi (`ricostruzione_non_del_prof`, `W3`, `tipo_esercizio`) | ordine delle sezioni, nessuna mappa etichette |
| L5 | "Figura non disponibile" in 35 passi | `passo.figura` è un ID di `dimostrazione.figure[]` ma viene passato come spec |
| L6 | Figure: testo a 7 px su mobile, SVG 1440×872 su desktop, etichette tagliate, testo bianco su grigio chiaro | viewBox fisso 760×460, nessun tetto di larghezza, margini interni stretti |
| L7 | Quiz con controlli nativi senza stile, opzioni sulla stessa riga; esercizi/grafo come elenchi grezzi | nessun componente |
| L8 | Tap target 20–37 px (113/190 sotto 44 px in home mobile) | padding dei link/chip |
| T1 | I test e2e passano nonostante tutto questo | controllano solo `scrollWidth` (mascherato da `overflow-x:hidden`) e contano `.katex` |

Fuori scope web, segnalato: ~440 stringhe di testo in `graph/` scrivono formule in Unicode semplice (`x(t)=1/(2π)∫₋ωm^ωm X₀eʲωᵗdω`) invece di `$…$`, contro CONTRACTS §3. Correggerle è compito di **D5** (solo notazione, §7), da attivare solo con l'ok del coordinatore.

## 2. Design system (token in `web/css/tokens.css`, owner D1)

Tutti i valori di stile usano questi token (`var(--…)`): **vietati** px/rem sciolti fuori da `tokens.css`, salvo `0`, `1px` dei bordi e `100%`.

- **Spaziatura (base 4 px):** `--s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px`.
- **Tipografia fluida:** `--fs-body: clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)` (17→19 px), `--fs-small: 0.9375rem` (minimo 15 px, solo meta), `--fs-h1: clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)`, `--fs-h2: clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)`, `--fs-h3: clamp(1.1875rem, 1.1rem + 0.4vw, 1.375rem)`; `--lh-body: 1.7`, `--lh-tight: 1.25` (titoli). Font: stack di sistema (`system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`), niente CDN.
- **Ritmo verticale:** titolo h2 `margin: var(--s-7) 0 var(--s-3)`, h3 `var(--s-6) 0 var(--s-2)`, paragrafi e liste `0 0 var(--s-4)`, sezioni `gap: var(--s-6)` mobile / `var(--s-7)` desktop.
- **Larghezza di lettura:** `--measure: 70ch` per `.prose` (testo, passi, callout); il contenitore pagina `--page-max: 1200px`; padding laterale `--gutter: 16px` (<600 px), `24px` (600–1023), `32px` (≥1024).
- **Colori (tema chiaro, AA verificato):** `--c-bg #ffffff`, `--c-surface #f6f8fb`, `--c-surface-2 #eef2f8`, `--c-border #d4dbe6`, `--c-text #17202e` (16:1), `--c-text-muted #4a5568` (7.4:1), `--c-primary #1d4ed8` (6.7:1 su bianco), `--c-primary-weak #eaf0ff`, `--c-formula-bg #f4f7ff`, `--c-formula-border #b9c9f5`, `--c-ok #15803d`/`--c-ok-bg #ecfdf3`, `--c-warn #92400e`/`--c-warn-bg #fff8e6`, `--c-danger #b42318`/`--c-danger-bg #fef3f2`, `--c-focus #2563eb` (anello 3 px). Tema scuro: token alternativi sotto `@media (prefers-color-scheme: dark)` **facoltativo** in questo round; se fatto, deve superare gli stessi test di contrasto.
- **Forme:** `--radius: 10px`, `--radius-sm: 6px`, `--shadow-1: 0 1px 2px rgb(16 24 40 / .06), 0 1px 3px rgb(16 24 40 / .1)`.
- **Tap target:** `--tap: 44px` (altezza minima di bottoni, link di navigazione, chip cliccabili, opzioni quiz, input).

### Componenti (classi pubbliche, owner D1 salvo dove indicato)

| Classe | Uso | Regole |
|---|---|---|
| `.page` | contenitore di ogni pagina | `max-width: var(--page-max)`, `padding-inline: var(--gutter)`, `margin-inline: auto` |
| `.prose` | blocchi di testo | `max-width: var(--measure)`, font/lh del corpo |
| `.card` (+ `.card__title`, `.card__body`) | gruppi di contenuto | padding `--s-4` mobile / `--s-5` desktop, bordo `--c-border`, `--radius`, separazione `--s-4` |
| `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--sm` | azioni | min-height `--tap`, padding `0 var(--s-4)`, font ≥ 16 px |
| `.chip`, `.chip--ok/--warn/--danger/--info` | stato e metadati | testo ≥ 14 px, padding `var(--s-1) var(--s-3)`; se cliccabile min-height `--tap` |
| `.callout`, `.callout--tip/--warn/--error` (+ `.callout__title`) | "Perché si può fare", errori frequenti, avvisi | bordo sinistro 4 px, padding `--s-4`, titolo in grassetto, icona testuale opzionale |
| `.progress` (`<div class="progress" role="progressbar" aria-valuenow aria-valuemax>` + `.progress__bar`) | passi rivelati, quiz | altezza 8 px, testo "Passo 3 di 10" accanto |
| `.tabs` (`role="tablist"`, figli `role="tab"` + `aria-selected`) | modalità della dimostrazione, allenamento/simulazione quiz | scorrono in orizzontale su mobile dentro `.scroll-x`, mai 5 barre a tutta larghezza |
| `.scroll-x` | **unico** modo consentito per contenuti più larghi dello schermo (tabelle, formule lunghe, figure) | `overflow-x: auto`, `tabindex="0"`, `role="region"`, `aria-label`, ombra sfumata ai bordi quando c'è overflow |
| `.table` dentro `.scroll-x` | tabelle | su <600 px le pagine possono usare invece `.stack-list` (card per riga) |
| `.formula-box`, `.formula-box--key` (owner **D2**) | formula in display; `--key` per formula finale/chiave | vedi §3 |
| `.figure` (owner **D2**) | figure SVG | vedi §4 |
| `.step` (owner **D3**) | passo della dimostrazione | vedi §5 |

`app.css` viene sostituito da file per livello, caricati in quest'ordine da `index.html` (owner D1): `tokens.css`, `base.css`, `layout.css`, `components.css`, `math.css` (D2), `figure.css` (D2), `pages/dimostrazione.css` (D3), `pages/home.css`, `pages/grafo.css`, `pages/nodo.css`, `pages/quiz.css`, `pages/esercizi.css`, `pages/ripasso.css`, `pages/fonti.css` (D4). D1 crea **tutti** questi file (vuoti, con una riga di commento sull'owner) così nessun link dà 404; ogni owner riempie solo i propri. Nessun `!important` (eccetto `[hidden]`), nessun `overflow-x: hidden` su `html`, `body`, `main` o contenitori di pagina.

## 3. Regole per le formule (owner D2)

1. **Motore:** KaTeX 0.16 vendorizzato (già presente), font locali woff2; `index.html` precarica `KaTeX_Main-Regular`, `KaTeX_Math-Italic`, `KaTeX_Size1-Regular`, `KaTeX_Size2-Regular` (`<link rel="preload" as="font" type="font/woff2" crossorigin>`), `math.css` aggiunge `font-display: swap` sovrascrivendo le `@font-face` di KaTeX. Il service worker precacha tutti i font (verifica in `web/build.sh`/precache). Pre-render a build-time **non** richiesto in questo round.
2. **API nuova in `web/js/core/math.js`** (resta tutto il resto, `renderMath` compreso):
   - `formulaBlock(latex, { variante = 'normale' | 'chiave', etichetta = '' }) -> string` HTML: `<div class="formula-box[ formula-box--key]"><div class="formula-box__label">etichetta</div><div class="scroll-x" tabindex="0" role="region" aria-label="Formula">…KaTeX displayMode…</div></div>`; mai eccezioni, errori mostrati come sorgente in `<code class="katex-err">`.
   - `formulaInline(latex) -> string` HTML inline.
   - In `renderMath`: un token `$…$` nella prosa che contiene `\frac`, `\dfrac`, `\sum`, `\int`, `\prod`, `\lim` **e** supera 40 caratteri di sorgente viene reso in display dentro `.formula-box` (promozione automatica); gli altri inline. `$$…$$` sempre in `.formula-box`.
3. **Campi LaTeX puro** (`passo.formula`, `formula_finale`, formule di esercizi/lezioni indicate come LaTeX puro da CONTRACTS) **sempre** con `formulaBlock`; `formula_finale` con `variante: 'chiave'` ed etichetta "Formula finale". I simboli di `notazione` restano inline ma a grandezza piena.
4. **Dimensioni:** inline `.katex { font-size: 1.1em }` (corpo 17–19 px → 18.7–20.9 px); display `.formula-box .katex-display > .katex { font-size: 1.25em }` a ≥600 px e `1.15em` sotto (minimo 19.5 px reali); `.formula-box--key` `1.35em`/`1.2em`. Display centrato, `margin: 0`, padding del box `var(--s-4) var(--s-4)`; colore del testo pieno (`--c-text`), mai grigio.
5. **Mai tagliate:** una formula più larga del box scorre orizzontalmente dentro il suo `.scroll-x` (con sfumatura che indica lo scorrimento); la pagina non scorre. Nessuna formula inline va a capo lasciando un `=` o un operatore a fine riga *dentro i campi LaTeX puro* (sono tutti in display).
6. **Prosa con matematica inline:** `line-height` del corpo 1.7; `.katex .mfrac` e `\sqrt` in inline non devono toccare la riga sopra/sotto (vedi test A7).
7. **Accessibilità:** output `htmlAndMathml` (già), `aria-label` sul region; contrasto testo formula ≥ 7:1.

## 4. Regole per le figure SVG (owner D2)

- Contenitore `<figure class="figure">` con `max-width: 720px` centrato, `<figcaption>` HTML sotto (titolo in grassetto + descrizione in `--fs-small`, mai sotto 15 px).
- Legende fuori dal disegno, in HTML sotto il grafico (`.figure__legend`, voci con campione colore).
- Font del testo SVG calcolato rispetto alla larghezza resa: il testo nel disegno deve risultare **≥ 12 px reali a 360 px** e **≤ 20 px a 1440 px**. Strada consigliata: viewBox più stretti (≈ 560×340) con font 18–20 unità, margine sinistro calcolato dalla lunghezza dell'etichetta più lunga; sotto 480 px di contenitore, il disegno ha `min-width: 480px` dentro `.scroll-x` invece di rimpicciolirsi.
- Nessuna etichetta né forma fuori dal viewBox; testo su barre colorate con contrasto ≥ 4.5:1 (testo scuro su colori chiari).
- La funzione `renderFigura(spec)` accetta anche un **ID** (stringa) più un elenco di figure: nuova firma `renderFigura(specOId, figureDisponibili = [])`; se è una stringa cerca `id` in `figureDisponibili`. "Figura non disponibile" solo se l'ID non esiste (test: 0 casi nel grafo attuale).

## 5. Pagina dimostrazione (owner D3) — UX di studio

**Ordine (mobile e desktop):**
1. Testata: titolo (h1), riga di chip leggibili (tipo, domande d'esame `T5`, "10 punti" se dichiarato, stato verifica con etichetta umana: `verificata_file1_file3` → "Verificata su file1 e file3", `ricostruzione_non_del_prof` → "Ricostruzione: non dal testo del prof"; mappa in un modulo `etichette.js` con test), link "Torna al concetto" come bottone ghost (non `float`, non ID grezzo).
2. `.tabs` delle 5 modalità (Studio, A voce, Compatta, A buchi, Recall) **subito sotto la testata**, sticky in cima su scroll (sotto la barra di navigazione), deep-link `#/dim/<id>?modo=abuchi` facoltativo.
3. Modalità **Studio**: card "Enunciato" (`.prose`), "Ipotesi" (elenco), "Notazione" (lista simbolo–significato a due colonne su desktop), "Idea" (`.callout--tip`), poi i **passi**, poi la **formula finale** (`.formula-box--key`), poi "Errori frequenti" (`.callout--error`, uno per errore: Errore / Perché è sbagliato / Correzione), poi Figure generali, infine "Fonti, varianti e verifica" chiuse in `<details>`.
4. **Passo** (`.step`): numero in cerchio (32 px), testo `.prose`, `formulaBlock(p.formula)`, figura risolta per ID (`renderFigura(p.figura, dim.figure)`), `.callout--tip` "Perché si può fare". Distanza tra passi `--s-5`; passo non ancora rivelato = segnaposto compatto "Passo 4 — nascosto" (non sparisce del tutto, così si vede quanti ne mancano).
5. **Controlli di studio**: barra `.progress` "Passo k di N" + bottoni "Indietro", "Prossimo passo", "Mostra tutti", "Ricomincia"; su mobile in una barra fissa in basso (altezza ≥ 56 px, con `padding-bottom: env(safe-area-inset-bottom)`), su desktop sticky nella sidebar. Tastiera: `→`/`Spazio` prossimo, `←` indietro (solo quando il focus non è in un input). Dopo "Prossimo" il nuovo passo scorre in vista e riceve il focus.
6. **Desktop ≥ 1024 px:** griglia a 2 colonne: sidebar sinistra sticky 260 px con indice dei passi (link ai passi rivelati, stato) + progress + controlli; colonna contenuto `max-width: var(--measure)` + formule fino a 820 px.
7. **A voce:** testo `.prose` con paragrafi; **Compatta:** elenco di formule chiave (ogni voce LaTeX in `formulaBlock` se è formula) — se il dato è Unicode semplice va mostrato com'è (D5 lo sistemerà); **A buchi:** input inline altezza ≥ 44 px, larghezza ≥ 8ch, `inputmode="text"`, esito `.callout--ok/--error` con elenco dei buchi sbagliati; **Recall:** card con domanda, bottone "Mostra risposta" (`aria-expanded`), risposta in `.callout`.
8. `dimostrazione.js` (231 righe) va diviso in moduli < 150 righe: `pages/dim/index.js` (render/setup), `testata.js`, `studio.js`, `modalita.js` (a voce/compatta), `abuchi.js`, `recall.js`, `etichette.js`; ognuno con test node.

## 6. Altre pagine (owner D4)

- **Navigazione** (markup e stile della shell sono di D1, le pagine di D4): vedi §8.
- **Home "Percorso d'esame":** intestazione con breve testo `.prose`, poi "Da dove partire" (2–3 card: T5, T11, esercizi), poi le prove d'esame: `.stack-list` di card su < 768 px (Prova, titolo, punti, link nodi come chip ≥ 44 px, stato) e `.table` in `.scroll-x` da 768 px.
- **Grafo:** raggruppato per area (sezioni con titolo e conteggio), ogni nodo una card compatta (titolo come link, tipo con etichetta umana, n. prerequisiti, chip "dimostrazione"); filtro per area e ricerca testuale; facoltativo: mappa SVG a livelli (prerequisiti → dipendenti) se leggibile secondo §4. Mai ID interni (`W3`, `A`, `tipo_esercizio`) a schermo: usare etichette umane.
- **Nodo:** colonna `.prose`, sezioni con ritmo verticale del §2, criteri come checklist, prerequisiti come chip, link alla dimostrazione come `.btn--primary`.
- **Quiz** (`web/modules/quiz/**` + `pages/quiz.js` + `pages/quiz.css`): `.tabs` Allenamento/Simulazione, campo durata con label sopra, `.progress` "Domanda 1 di 79", opzioni come `label.quiz-option` a tutta larghezza (≥ 48 px, radio a sinistra, stato selezionato evidente), feedback in `.callout--ok/--error` con spiegazione, bottoni `.btn--primary`.
- **Esercizi:** card per esercizio con titolo, prova (`E3`), difficoltà come chip testuale ("Difficoltà 1/3"), link.
- **Ripasso:** card per nodo su mobile (stato, prossimo ripasso, bottoni di valutazione ≥ 44 px), tabella in `.scroll-x` su desktop.
- **Fonti:** `.stack-list` su mobile, URL con `overflow-wrap: anywhere`, tabella in `.scroll-x` su desktop.

## 7. D5 (facoltativo, solo con ok del coordinatore): notazione LaTeX nei contenuti

Solo `graph/lezioni/*.json`, `graph/dimostrazioni/*.json`, `graph/parts/*.json`, `graph/esame.json`, `graph/quiz.json` + file generati rigenerati. Converte la matematica scritta in Unicode semplice nei campi di testo in `$…$` (es. `x(t)=1/(2π)∫₋ωm^ωm X₀eʲωᵗdω` → `$x(t)=\frac{1}{2\pi}\int_{-\omega_m}^{\omega_m} X_0 e^{j\omega t}\,d\omega$`), **senza cambiare significato, parole o numeri**; non tocca le etichette delle figure (restano Unicode per CONTRACTS §3). Test: script che elenca le stringhe con pseudo-matematica Unicode fuori da `$…$` (deve scendere a 0 nei campi di testo, escluse etichette e `url`), `latex.test.js` verde, `check_testo.py` verde, diff solo di notazione (revisione a campione del coordinatore).

## 8. Shell e layout (owner D1)

- Un solo header: barra superiore 56 px con "TLC Studio" (link home) e, da 768 px, la nav orizzontale (link ≥ 44 px, stato attivo con sottolineatura 3 px `--c-primary` e `aria-current="page"`). Tagline solo in home (dentro la pagina, non nell'header).
- Sotto 768 px: **barra di navigazione in basso** fissa (Percorso, Grafo, Esercizi, Quiz, Ripasso; ognuna ≥ 44×44, etichetta di testo ≥ 13 px), "Fonti" nel footer; `main` con `padding-bottom` pari all'altezza della barra + safe area. Header mobile ≤ 64 px.
- `main#app` contiene la pagina in `.page`; skip-link "Vai al contenuto"; focus ring visibile su tutto.
- Le classi di pagina del vecchio `app.css` (`.passo`, `.tabella`, `.toolbar`, `.badge`, `.flashcard`, `.richiamo`, `.buco` …) passano in un file temporaneo `web/css/legacy.css` riscritto con i token, così le pagine restano usabili finché D3/D4 non le rifanno; D4 lo elimina nel suo ultimo commit (D3 non lo modifica, smette solo di usarne le classi).
- Rimuovere `overflow-x: hidden` globale; se qualcosa sborda è un bug da correggere nel suo componente.
- `navHTML()` esce da `app.js` in `web/js/layout/shell.js` (funzioni pure con test node); `app.js` resta solo bootstrap/routing.
- `web/tests/e2e_helpers.py` (owner D1): fixture server statico su porta libera, elenco viewport `[(360,780),(390,844),(768,1024),(1440,900)]`, elenco rotte (tutte le pagine + tutti i `#/nodo/<id>` e `#/dim/<id>` dal grafo), e funzioni JS di misura riusabili (§9): `overflow_report`, `tap_targets`, `font_sizes`, `contrasto`, `katex_report`, `svg_text_report`, `console_errors`. D2–D4 le importano.

## 9. Criteri di accettazione misurabili (test e2e Playwright, tutti obbligatori)

Viewport: 360×780, 390×844, 768×1024, 1440×900 (DPR 1). Rotte: tutte (6 pagine + 56 `#/nodo` + 18 `#/dim`; per i `#/dim` anche dopo "Mostra tutti" e in ciascuna delle 5 modalità).

| ID | Criterio | Soglia | Owner test |
|---|---|---|---|
| A1 | Nessuno scroll orizzontale della pagina | `scrollingElement.scrollWidth <= innerWidth` **e** nessun elemento visibile con `rect.right > innerWidth + 1` o `rect.left < -1` che non sia dentro un `.scroll-x` | D1 (helper), D4 (suite globale) |
| A2 | Niente `overflow-x: hidden` su html/body/main/.page | `getComputedStyle` ≠ `hidden`/`clip` | D1 |
| A3 | Corpo del testo | `font-size` di `p`, `li` in `main` ≥ 17 px a ≤ 767 px, ≥ 17 px e ≤ 20 px a 1440; `line-height` ≥ 1.6× | D1 |
| A4 | Testi secondari | nessun testo visibile in `main` sotto 14 px (escluse sole etichette SVG, vedi A10) | D1 / D4 |
| A5 | Larghezza di lettura | ogni `p` in `.prose` ≤ 75ch (misura: larghezza ≤ 75 × larghezza media di un carattere `0` del font) e ≥ 280 px | D1 |
| A6 | Formule display | in tutte le `#/dim`: `.formula-box .katex-display` ≥ numero di `passi` con `formula` + 1 (finale); `font-size` reso di `.katex-display > .katex` ≥ 1.15 × corpo (mobile) e ≥ 1.2 × corpo (≥ 600 px); ogni `.katex-display` interamente visibile **oppure** dentro `.scroll-x` con `scrollWidth > clientWidth` (mai tagliata da un antenato non scrollabile); 0 `.katex-error`/`.katex-err` | D2 |
| A7 | Formule inline non accavallate | per ogni `p`/`li`: nessuna coppia di `.katex` inline su righe adiacenti con rettangoli sovrapposti, e nessun `.katex` inline più alto di 2.4 × font-size | D2 |
| A8 | Formula finale evidenziata | ogni `#/dim` ha esattamente una `.formula-box--key` visibile in Studio dopo "Mostra tutti" | D3 |
| A9 | Figure | 0 `.figura-non-disponibile` su tutte le rotte; nessun `svg` reso più largo di 760 px; ogni `text` SVG con bbox dentro il bbox dell'`svg` | D2 |
| A10 | Testo nelle figure | altezza resa di ogni `svg text` ≥ 11 px a 360/390 (dentro `.scroll-x` se serve) e ≤ 24 px a 1440 | D2 |
| A11 | Spaziature | `padding-inline` effettivo del contenuto (distanza testo–bordo viewport) ≥ 16 px a 360/390 e ≥ 24 px a ≥ 768; padding interno di `.card`, `.step`, `.callout`, `.formula-box` ≥ 16 px (≥ 24 px per `.card` a 1440); distanza verticale tra due `.step`/`.card` consecutive ≥ 16 px; nessuna coppia di elementi fratelli in `main` con rettangoli sovrapposti | D1 (helper), D3/D4 |
| A12 | Valori dalla scala | tutti i `margin`/`padding`/`gap` calcolati in `main` sono multipli di 4 px (tolleranza 0.5 px), eccetto 0, 1 px, 2 px | D1 |
| A13 | Tap target | ogni `a`, `button`, `input`, `select`, `[role=tab]`, `label.quiz-option` visibile e fuori dalla prosa: altezza ≥ 44 px e larghezza ≥ 44 px (link dentro paragrafi esclusi) | D1 (helper), D4 |
| A14 | Contrasto | testo/sfondo di ogni elemento con testo visibile in `main`, header, nav, footer, callout, chip, bottoni e `svg text`: ≥ 4.5:1 (≥ 3:1 per testo ≥ 24 px o 18.66 px bold) | D1 (helper), D4 |
| A15 | Header | altezza totale di header + nav sopra il contenuto ≤ 64 px a 390 e ≤ 72 px a 1440; "TLC Studio" compare una sola volta | D1 |
| A16 | Dimostrazione: modalità | `.tabs` visibile nel primo viewport (top < 844 px a 390, < 900 a 1440) in tutte le 18 `#/dim`; click su ogni tab mostra solo la sua sezione | D3 |
| A17 | Dimostrazione: studio | "Prossimo passo" incrementa `.progress` (`aria-valuenow`) e porta il nuovo passo nel viewport; `→` da tastiera fa lo stesso; "Indietro" decrementa; stato salvato in localStorage e ripristinato al reload | D3 |
| A18 | Nessun ID/valore grezzo | nel testo visibile non compaiono `_` dentro parole (`ricostruzione_non_del_prof`, `tipo_esercizio`), né i badge `W1`–`W6` | D3 / D4 |
| A19 | Nessun errore | 0 errori console/pageerror, 0 richieste 404, nessun `null`/`undefined`/`NaN` a schermo, su tutte le rotte e viewport | D4 |
| A20 | Quiz | opzioni come `label.quiz-option` a tutta larghezza, una per riga (top diversi), ≥ 48 px; feedback in `.callout` dopo "Conferma" | D4 |
| A21 | Tabelle | ogni `table` visibile è dentro `.scroll-x` oppure sostituita da `.stack-list` sotto 768 px | D4 |
| A22 | Screenshot | la suite salva screenshot di tutte le pagine principali e di 3 `#/dim` a 390 e 1440 in `/tmp/tlc-shots/` (mai nel repo) | D4 |

Unit test node per ogni nuovo modulo JS (funzioni pure: `formulaBlock`, promozione inline→display, risoluzione figura per ID, etichette umane, shell/nav, stato studio, rendering card). I test e2e esistenti (`web/tests/test_e2e.py`, `test_e2e_quiz.py`) vanno aggiornati, non indeboliti.

## 10. Worker, scope esclusivi, ordine

| Worker | Scope (file che può toccare — tutto il resto è in sola lettura) | Dipende da |
|---|---|---|
| **D1** design system + shell | `web/index.html`, `web/css/tokens.css`, `base.css`, `layout.css`, `components.css`, creazione stub di tutti i `web/css/**` del §2, rimozione `web/css/app.css`, `web/js/app.js` (solo bootstrap/routing), nuovo `web/js/layout/**`, `web/js/ui.js` (helper componenti), `web/sw.js` e `web/build.sh` (solo precache nuovi file), `web/tests/e2e_helpers.py`, `web/tests/conftest.py`, `web/tests/test_e2e_shell.py`, `web/tests/ui.test.js`, `web/tests/layout.test.js` | — |
| **D2** formule + figure | `web/js/core/math.js`, `web/css/math.css`, `web/js/figure/**`, `web/css/figure.css`, `web/vendor/katex/**` (solo se serve aggiornare 0.16.x), `web/tests/math.test.js`, `latex.test.js`, `figure.test.js`, `web/tests/test_e2e_formule.py` | contratti §3–4 (può partire subito; usa `e2e_helpers.py` dopo il merge di D1, prima con un fixture locale nel proprio file) |
| **D3** pagina dimostrazione | `web/js/pages/dimostrazione.js` (diventa re-export di `pages/dim/index.js`), nuovo `web/js/pages/dim/**`, `web/css/pages/dimostrazione.css`, `web/tests/dim*.test.js`, `web/tests/test_e2e_dim.py` | D1 + D2 su main |
| **D4** altre pagine + QA globale | `web/js/pages/{home,grafo,nodo,esercizi,quiz,ripasso,fonti}.js`, `web/modules/quiz/**`, `web/css/pages/{home,grafo,nodo,quiz,esercizi,ripasso,fonti}.css`, `web/tests/pages*.test.js`, `web/tests/quiz*.test.js`, `web/tests/test_e2e.py`, `web/tests/test_e2e_quiz.py`, eliminazione finale di `web/css/legacy.css` e del suo `<link>` in `index.html` (unica eccezione allo scope di D1), nuovo `web/tests/test_e2e_layout.py` (A1, A4, A11, A13, A14, A18–A22 su tutte le rotte) | D1 + D2 su main (D3 prima del suo report finale) |
| **D5** (facoltativo) notazione | §7 | — |

**Ordine di avvio e merge:** D1 e D2 (e D5 se approvato) partono subito in parallelo → merge **D1 → D2** → D3 e D4 partono (o fanno `git merge origin/main` se già avviati) → merge **D3 → D4** → integrazione: rigenerare i generati, `pytest -q` e `npm test` completi, CI verde, controllo visivo del coordinatore sul sito pubblicato a 390 e 1440. D5 si mergia prima del report finale di D4.

**Regole per tutti:** SOLID, moduli piccoli e coesi (< 150 righe per file JS, < 250 per CSS), basso accoppiamento, interfacce esplicite, test per ogni modulo, nessun codice morto, nessun refactor fuori scope; **vietati** `skip`, `skipif`, `xfail`, `--ignore`, `-k "not …"`, test resi condizionali o soglie abbassate; `pytest -q` e `npm test --prefix web` con 0 failed e 0 skipped; 0 errori JS; niente PDF né screenshot nel repo; push solo sul proprio ramo di sessione `arena/*`; il report deve contenere SHA, numero di test node e pytest **con l'output finale incollato**, e l'elenco degli screenshot salvati in `/tmp`.
