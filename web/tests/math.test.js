import { test } from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { compilaLatex, compilaLatexSicuro, renderMath, tokenizzaMatematica, testoSicuro, formulaBlock, formulaInline, devePromuovereInDisplay, formulaIsolata } from '../js/core/math.js';
import { righeDisplay } from '../js/core/riflusso.js';
import { larghezzaStimata } from '../js/core/larghezza-latex.js';

test('tokenizzaMatematica separa testo, inline $...$ e display $$...$$', () => {
  const toks = tokenizzaMatematica('costo $x=1$ e $$y=2$$ finale');
  assert.deepStrictEqual(toks.map(t => t.type), ['text', 'inline', 'text', 'display', 'text']);
  assert.strictEqual(toks[0].body, 'costo '); assert.strictEqual(toks[1].body, 'x=1');
  assert.strictEqual(toks[2].body, ' e '); assert.strictEqual(toks[3].body, 'y=2'); assert.strictEqual(toks[4].body, ' finale');
});

test('tokenizzaMatematica senza formule restituisce un solo token testo', () => {
  const toks = tokenizzaMatematica('solo testo, $ non chiuso');
  assert.deepStrictEqual(toks.map(t => t.type), ['text']); assert.strictEqual(toks.length, 1);
});

test('compilaLatex compila una formula LaTeX valida e restituisce HTML+MathML', () => {
  const html = compilaLatex('x=\\frac{1}{2}\\,\\omega');
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('class="katex"')); assert.ok(html.includes('<math')); assert.ok(html.includes('semantics'));
});

test('compilaLatex formula display con integrale', () => {
  const html = compilaLatex('\\int_{-\\infty}^{+\\infty} x(t)e^{-j\\omega t}\\,dt');
  assert.ok(html.includes('class="katex"')); assert.ok(html.includes('<math'));
});

test('compilaLatex lancia errore con throwOnError su comando inesistente', () => {
  assert.throws(() => compilaLatex('\\comandoInesistente{'), /KaTeX parse error/);
});

test('compilaLatex stringa vuota restituisce stringa vuota', () => { assert.strictEqual(compilaLatex(''), ''); });

test('compilaLatexSicuro non lancia mai eccezioni e segnala l errore in katex-err', () => {
  assert.doesNotThrow(() => compilaLatexSicuro('\\comandoInesistente{'));
  const html = compilaLatexSicuro('\\comandoInesistente{');
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('katex-err')); assert.ok(html.includes('comandoInesistente'));
  assert.strictEqual(compilaLatexSicuro(''), ''); assert.strictEqual(compilaLatexSicuro(null), '');
});

test('testoSicuro non mostra mai null, undefined o NaN', () => {
  assert.strictEqual(testoSicuro(null), ''); assert.strictEqual(testoSicuro(undefined), '');
  assert.strictEqual(testoSicuro(NaN), ''); assert.strictEqual(testoSicuro(42), '42');
  assert.strictEqual(testoSicuro(3.5), '3.5'); assert.strictEqual(testoSicuro('ciao'), 'ciao'); assert.strictEqual(testoSicuro(0), '0');
});

test('renderMath in assenza di DOM non solleva eccezioni', () => { assert.doesNotThrow(() => renderMath({})); });

test('formulaInline restituisce HTML inline con classe formula-inline (senza aria-hidden)', () => {
  const html = formulaInline('x=1');
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('class="formula-inline"')); assert.ok(!/<span[^>]*class="formula-inline"[^>]*aria-hidden/.test(html));
  assert.ok(html.includes('class="katex"'));
});

test('formulaInline contiene la punteggiatura adiacente nello stesso wrapper nowrap', () => {
  const html = formulaInline('x=1', ',');
  assert.ok(html.startsWith('<span class="formula-inline">'));
  assert.ok(html.endsWith(',</span>'));
});

test('formulaInline stringa vuota restituisce stringa vuota', () => { assert.strictEqual(formulaInline(''), ''); assert.strictEqual(formulaInline(null), ''); });

test('formulaInline mai eccezione su LaTeX invalido', () => {
  assert.doesNotThrow(() => formulaInline('\\comandoInesistente{'));
  const html = formulaInline('\\comandoInesistente{'); assert.ok(html.includes('katex-err'));
});

test('formulaBlock restituisce formula-box con scroll-x e KaTeX display', () => {
  const html = formulaBlock('\\frac{1}{2}', { variante: 'normale', etichetta: 'Etichetta' });
  assert.ok(html.includes('class="formula-box"')); assert.ok(!html.includes('formula-box--key'));
  assert.ok(html.includes('class="formula-box__label"')); assert.ok(html.includes('Etichetta'));
  assert.ok(/class=["']scroll-x["']/.test(html)); assert.ok(html.includes('tabindex="0"'));
  assert.ok(html.includes('role="region"')); assert.ok(html.includes('aria-label="Formula"'));
  assert.ok(html.includes('class="katex"'));
});

test('formulaBlock variante chiave aggiunge formula-box--key', () => {
  const html = formulaBlock('x=1', { variante: 'chiave', etichetta: 'Formula finale' });
  assert.ok(html.includes('formula-box--key')); assert.ok(html.includes('Formula finale'));
});

test('formulaBlock senza etichetta non renderisce il label', () => {
  const html = formulaBlock('x=1'); assert.ok(html.includes('formula-box')); assert.ok(!html.includes('formula-box__label'));
});

test('formulaBlock mai eccezione su LaTeX invalido', () => {
  assert.doesNotThrow(() => formulaBlock('\\comandoInesistente{'));
  const html = formulaBlock('\\comandoInesistente{'); assert.ok(html.includes('katex-err')); assert.ok(html.includes('formula-box'));
});

test('formulaBlock stringa vuota restituisce box vuoto senza eccezione', () => {
  const html = formulaBlock(''); assert.ok(html.includes('formula-box')); assert.ok(/class=["']scroll-x["']/.test(html));
});

test('devePromuovereInDisplay vero per frazione/somma/integrale/limite sopra la soglia', () => {
  assert.ok(devePromuovereInDisplay('\\frac{1}{2} + \\sum_{n=0}^{N} x_n + \\int_{0}^{T} f(t) \\, dt'));
  assert.ok(devePromuovereInDisplay('\\int_{-\\infty}^{+\\infty} x(t) e^{-j\\omega t} \\, dt'));
  assert.ok(devePromuovereInDisplay('\\lim_{\\Delta \\to 0} \\frac{1}{\\Delta} \\cdot k'));
  assert.ok(devePromuovereInDisplay('\\prod_{k=1}^{n} h_k + \\sum_{j=0}^{M} g_j \\cdot 2'));
});

test('devePromuovereInDisplay falso sotto la soglia o senza comandi display', () => {
  assert.ok(!devePromuovereInDisplay('\\omega')); assert.ok(!devePromuovereInDisplay('x = 1'));
  assert.ok(!devePromuovereInDisplay('\\frac{1}{2}')); assert.ok(!devePromuovereInDisplay(''));
});

test('formulaBlock compila in display reale, anche per formule brevi', () => {
  for (const latex of ['x', 'x=1', '\\frac{1}{2}']) {
    const html = formulaBlock(latex);
    assert.match(html, /class="katex-display"/);
    assert.match(html, /<math/);
    assert.match(html, /class="scroll-x" tabindex="0" role="region" aria-label="Formula"/);
  }
  assert.doesNotMatch(formulaInline('x'), /katex-display/);
});

test('formulaBlock crea un riflusso responsivo ai soli separatori LaTeX di primo livello', () => {
  const formula = 's_m(t) = \\sum_n c_n e^{jnt} \\qquad c_n = \\frac{a_n}{T} G(n)';
  const html = formulaBlock(formula);
  assert.match(html, /formula-box--reflow/);
  assert.match(html, /class="formula-box__reflow"/);
  assert.equal((html.match(/class="katex-display"/g) || []).length, 2);
  assert.equal(formula, 's_m(t) = \\sum_n c_n e^{jnt} \\qquad c_n = \\frac{a_n}{T} G(n)');
  const annidata = formulaBlock('\\operatorname{f(a,b)} + \\left(\\frac{a+b}{c+d}\\right) + \\sum_{n=1}^{N} x_n');
  assert.doesNotMatch(annidata, /formula-box--reflow/);
  const parentesiQuadre = formulaBlock('P_y = \\int_0^2 3\\omega^2 d\\omega = [\\omega^3]_0^2 = 8');
  assert.doesNotMatch(parentesiQuadre, /katex-err/);
});

test('righeDisplay spezza PRIMA della relazione: nessun segno di relazione chiude una riga', () => {
  const dirac = String.raw`x(t) = \lim_{\Delta \to 0} \int_{-\infty}^{+\infty} x(\tau) D(t-\tau,\Delta)\, d\tau \;\Longleftrightarrow\; x(t) = \int_{-\infty}^{+\infty} x(\tau) \delta(t-\tau)\, d\tau = x(t) * \delta(t)`;
  const righe = righeDisplay(dirac);
  assert.ok(righe.length >= 2, 'la catena deve essere spezzata');
  const coda = /(?:[=<>]|\\(?:le|ge|leq|geq|Longleftrightarrow|Longrightarrow|Leftrightarrow|to|approx))\\?;?\s*$/u;
  for (const riga of righe) assert.ok(!coda.test(riga.trim()), `relazione in coda: ${riga}`);
  assert.ok(righe.some(r => r.startsWith(String.raw`\Longleftrightarrow`)), 'la doppia implicazione apre la riga');
});

test('ogni riga di riflusso sta nella capacità stimata del box più stretto', () => {
  const formule = [
    String.raw`G_x(\omega) = \frac{1}{\pi T} |G(\omega)|^2 \left\{ \langle a_n^2 \rangle - [\langle a_n \rangle]^2 + 2 \sum_{k=1}^{\infty} \left[ \langle a_n a_{n+k} \rangle - [\langle a_n \rangle]^2 \right] \cos k\omega T \right\}`,
    String.raw`\omega_m \le \omega_s - \omega_m \;\Longrightarrow\; \omega_s \ge 2\omega_m \;\Longleftrightarrow\; f_s \ge 2 f_m \;\Longleftrightarrow\; T \le \frac{1}{2 f_m}`,
    String.raw`E = \int |x(t)|^2 dt = \frac{1}{2\pi}\int_{-\infty}^{+\infty} |X(\omega)|^2 d\omega, \qquad F[\phi(\tau)] = |X(\omega)|^2,`,
  ];
  for (const tex of formule) {
    const righe = righeDisplay(tex);
    assert.ok(righe.length >= 2, 'formula lunga non spezzata: ' + tex.slice(0, 40));
    for (const riga of righe) assert.ok(larghezzaStimata(riga) <= 8.8, `riga troppo larga (${larghezzaStimata(riga).toFixed(2)}): ${riga}`);
  }
});

test('cases largo: virgola esplicita e nessuna riga con la sola condizione', () => {
  const eta = String.raw`\eta=\begin{cases}\dfrac{WD}{C\,TT}=\dfrac{WD}{D+H+A+2IC},&WF\le C\,TT,\\[4pt]\dfrac{D}{D+H},&WF>C\,TT.\end{cases}`;
  const righe = righeDisplay(eta);
  const flat = righe.find(r => r.includes(String.raw`\begin{gathered}`));
  assert.ok(flat, 'il cases deve diventare un gathered');
  const corpo = flat.slice(flat.indexOf(String.raw`\begin{gathered}`) + 16, flat.indexOf(String.raw`\end{gathered}`));
  const righeInterne = corpo.split('\\\\').map(r => r.trim()).filter(Boolean);
  assert.equal(righeInterne.length, 3, 'il primo case usa due righe, il secondo una');
  for (const riga of righeInterne) assert.ok(larghezzaStimata(riga) <= 8.5, `riga gathered larga: ${riga}`);
  const conCondizione = righeInterne.filter(r => r.includes('WF'));
  assert.equal(conCondizione.length, 2);
  assert.ok(conCondizione[0].includes(String.raw`\dfrac{WD}{C\,TT}, \quad WF\le C\,TT,`), conCondizione[0]);
  assert.ok(conCondizione[1].includes(String.raw`\dfrac{D}{D+H}, \quad WF>C\,TT.`), conCondizione[1]);
  for (const riga of conCondizione) assert.ok(riga.includes(String.raw`\dfrac{`), `condizione orfana: ${riga}`);
  assert.doesNotMatch(formulaBlock(eta), /katex-err/);
});

test('lo spazio esplicito backslash-spazio non resta solitario in coda a una riga', () => {
  const qam = String.raw`\Delta=0\ \Longrightarrow\ (\hat{x}_1,\hat{x}_2)=(x_1,x_2)`;
  const righe = righeDisplay(qam);
  assert.ok(righe.length >= 1);
  for (const riga of righe) assert.ok(!riga.trimEnd().endsWith('\\'), `backslash solitario in coda: ${riga}`);
  assert.doesNotMatch(formulaBlock(qam), /katex-err/);
});

test('tutte le formule del grafo: riflusso senza errori KaTeX né relazioni in coda', () => {
  const graph = JSON.parse(fs.readFileSync(new URL('../graph.json', import.meta.url), 'utf8'));
  const formule = [];
  const raccogli = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(raccogli); return; }
    for (const [k, v] of Object.entries(o)) { if (k === 'formula' && typeof v === 'string') formule.push(v); else raccogli(v); }
  };
  raccogli(graph.nodi);
  assert.ok(formule.length >= 100, 'il grafo costruito deve contenere le formule');
  const coda = /(?:[=<>]|\\(?:le|ge|leq|geq|Longleftrightarrow|Longrightarrow|Leftrightarrow|to|approx|iff|imply))\\?;?\s*$/u;
  for (const tex of formule) {
    assert.doesNotMatch(formulaBlock(tex), /katex-error|katex-err/, tex.slice(0, 60));
    for (const riga of righeDisplay(tex)) {
      assert.ok(!coda.test(riga.trim()), `relazione in coda in ${tex.slice(0, 50)}: ${riga.slice(-30)}`);
      if (!riga.includes(String.raw`\begin{gathered}`)) assert.ok(larghezzaStimata(riga) <= 10.4, `riga oltre il box: ${riga.slice(0, 60)}`);
    }
  }
});

test('formula isolata riconosce spazi ma non testo o altre formule', () => {
  assert.ok(formulaIsolata(tokenizzaMatematica('$x$')));
  assert.ok(formulaIsolata(tokenizzaMatematica('  $x$  ')));
  assert.ok(!formulaIsolata(tokenizzaMatematica('testo $x$')));
  assert.ok(!formulaIsolata(tokenizzaMatematica('$x$ e $y$')));
  assert.ok(!formulaIsolata(tokenizzaMatematica('$$x$$')));
});

test('formulaBlock segnala il sorgente invalido senza HTML eseguibile', () => {
  const html = formulaBlock('\\comandoInesistente{<script>');
  assert.match(html, /class="katex-err"/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('cases del grafo: virgola e quad separano valore e condizione', () => {
  const formule = [
    [String.raw`D(t,\Delta) = \begin{cases} \dfrac{1}{\Delta} & 0 \le t \le \Delta \\ 0 & \text{altrove} \end{cases}`, [String.raw`\dfrac{1}{\Delta}`, String.raw`0 \le t \le \Delta`, '0', String.raw`\text{altrove}`]],
    [String.raw`X(\omega) = \begin{cases} T\, X_s(\omega) & |\omega| < \dfrac{\omega_s}{2} = \dfrac{\pi}{T} \\ 0 & \text{altrove} \end{cases}`, [String.raw`T\, X_s(\omega)`, String.raw`|\omega| < \dfrac{\omega_s}{2}`, '0', String.raw`\text{altrove}`, String.raw`= \dfrac{\pi}{T}`]],
    [String.raw`\int_{-\infty}^{+\infty} \operatorname{sinc}\frac{t-nT}{T}\, \operatorname{sinc}\frac{t-mT}{T}\, dt = \begin{cases} 0 & m \ne n \\ T & m = n \end{cases}`, ['0', String.raw`m \ne n`, 'T', 'm = n']],
  ];
  for (const [tex, [v1, c1, v2, c2, continuazione]] of formule) {
    const flat = righeDisplay(tex).find(r => r.includes(String.raw`\begin{gathered}`));
    assert.ok(flat, tex);
    const righe = flat.split(String.raw`\\`), separatore = String.raw`, \quad `;
    assert.ok(righe.some(r => r.includes(v1) && r.includes(c1)), flat);
    assert.ok(righe.some(r => r.includes(v2) && r.includes(c2)), flat);
    assert.ok(righe.some(r => r.includes(v1 + separatore + c1)), `separatore assente nel primo case: ${flat}`);
    assert.ok(righe.some(r => r.includes(v2 + separatore + c2)), `separatore assente nel secondo case: ${flat}`);
    if (continuazione) assert.ok(righe.some(r => r.includes(continuazione)), `continuazione assente: ${flat}`);
    assert.doesNotMatch(formulaBlock(tex), /katex-err/);
  }
});

test('sinc e il suo argomento frazionario non vengono separati dal riflusso', () => {
  const tex = String.raw`\int_{-\infty}^{+\infty} \operatorname{sinc}\frac{t-nT}{T}\, \operatorname{sinc}\frac{t-mT}{T}\, dt = \begin{cases} 0 & m \ne n \\ T & m = n \end{cases}`;
  const righe = righeDisplay(tex);
  for (const arg of ['t-nT', 't-mT']) assert.ok(righe.some(r => r.includes(String.raw`\operatorname{sinc}\frac{` + arg + '}')), righe);
  assert.ok(righe.every(r => !/\\operatorname\{sinc\}\s*$/.test(r)), righe);
});

test('funzioni con apici e spazi espliciti non si separano dall’argomento', () => {
  for (const tex of [
    String.raw`f(x) = a + b + c + d + e + \sin^{2} \frac{x}{T} + g + h`,
    String.raw`f(x) = a + b + c + d + e + \operatorname{sinc}\, \frac{x}{T} + g + h`,
  ]) {
    const righe = righeDisplay(tex);
    assert.ok(righe.length > 1, tex);
    assert.ok(righe.some(r => /\\(?:sin\^\{2\}|operatorname\{sinc\})[\s\\,]*\\frac\{x\}\{T\}/u.test(r)), righe);
    assert.doesNotMatch(formulaBlock(tex), /katex-err/);
  }
});
