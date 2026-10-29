# Telecomunicazioni — sito di studio

Knowledge graph e web app statica italiana, offline (PWA), per **Fondamenti di Telecomunicazioni** (UNIMORE, prof. Maurizio Casoni).

Obiettivo: **30 e lode nel minor tempo possibile**, con dimostrazioni nello stesso ordine e notazione del testo del docente dove verificato, altrimenti marcate come ricostruzione.

## Struttura

```
graph/meta.json ─┐
graph/parts/*.json ─┼─ scripts/kg.py build ──> graph/graph.json ──> web/build.sh ──> web/graph.json
graph/lezioni/*.json ─┤                                                           └─> web/quiz.json
graph/dimostrazioni/*.json ─┤
graph/esame.json ─┘                         scripts/gen_docs.py ──> docs/PIANO_STUDIO.md, docs/MAPPA_ESAME.md
graph/quiz.json ───────────────────────────────────────────────────────────────────────┘
```

- **Una sola fonte per l'app:** `graph/graph.json`, generato, mai modificato a mano.
- Validazione: JSON Schema Draft 2020-12 (`schema/*.schema.json`) + controlli di integrità + controlli di testo.

## Comandi

```bash
python scripts/kg.py build && python scripts/gen_docs.py build && sh web/build.sh
python scripts/kg.py check            # graph.json coincide con la build
python scripts/kg.py check --completo # integrazione: tutti gli ID presenti, pendenti vuoto, esame completo
python scripts/check_testo.py
python scripts/check_urls.py          # solo risorse, HEAD con fallback GET
npm test --prefix web                 # node --test web/tests/*.test.js
pytest -q
```

## Fonti

| Chiave | Descrizione | URL |
|---|---|---|
| `LIBRO_CI` | Calandrino, Immovilli, Schemi delle lezioni di Comunicazioni Elettriche, Pitagora | https://web.ing.unimo.it/wiki/index.php/Libro_di_Testo — edizione NON TROVATO |
| `LUCIDI_CASONI` | Lucidi Accesso multiplo, Reti | https://web.ing.unimo.it/wiki/index.php/Materiale_Didattico |
| `PROGRAMMA` | Programma PDF | http://www.dii.unimore.it/~mcasoni/telecom/programma.pdf |
| `ESSE3_2016` | Syllabus 2016/17 | ESSE3 contenuti |

Dove manca un dato si scrive **NON TROVATO**. Solo T5 e T11 valgono 10 punti; gli altri punteggi sono NON TROVATO. Nessun PDF nel repo.

## Corso e aree (1–7)

1. Segnali deterministici e trasformata di Fourier
2. Sistemi lineari e filtri
3. Campionamento, Nyquist, PAM e processi aleatori
4. Conversione A/D-D/A e trasmissione numerica
5. Modulazioni e segnali passa-banda
6. Reti, protocolli e accesso multiplo
7. Teoria del traffico e code

## Notazione canonica

`ω` per la pulsazione, `T`, `ω_s = 2π/T`, `ω_0` per la portante (da `file1`, vicina al testo). Varianti di `file3` (`m`, `f₀ = 1/T`) segnalate in `docs/NOTAZIONE.md` (W3). Dettaglio completo in `docs/CONTRACTS.md §6`.

## Qualità

- Italiano con accenti corretti (è, perché, più, già, può, così)
- Mai parole riservate isolate in testi o UI (ammesso «nulli» come plurale)
- Formule KaTeX vendorizzato (`web/vendor/katex/`) con `trust: false`
- Figure SVG generate da specifiche dichiarative (tre tipi: `grafico`, `blocchi`, `temporale`)
- CI su GitHub Actions: `kg.py check`, `web/build.sh`, `npm test`, `pytest -q` — 0 failed, 0 skipped; deploy Pages solo da `main`

## Documentazione

- [docs/DIDATTICA.md](docs/DIDATTICA.md) — principi didattici (fading, recall, interleaving)
- [docs/CONTRACTS.md](docs/CONTRACTS.md) — contratti vincolanti (schemi, ID, allowlist)
- [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) — piano di costruzione (§3 formato dimostrazione)

## Licenze web

Vendor locali con licenze in `web/vendor/` (KaTeX MIT, marked, DOMPurify).
