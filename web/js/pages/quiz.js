/**
 * Pagina #/quiz: monta il modulo quiz di W6 (web/modules/quiz/index.js)
 * con import dinamico tollerante. Se W6 non e' ancora disponibile (o
 * l'import fallisce), mostra 'Quiz non disponibile' senza mai interrompere
 * l'app.
 */

let montaQuiz = null;
let importTentato = false;
let smontaQuiz = null;

async function ottieniMontaQuiz() {
  if (importTentato) return montaQuiz;
  importTentato = true;
  try {
    const mod = await import('../../modules/quiz/index.js');
    montaQuiz = mod && typeof mod.montaQuiz === 'function' ? mod.montaQuiz : null;
  } catch (_err) {
    montaQuiz = null; // W6 non ancora su questo ramo: degradazione elegante
  }
  return montaQuiz;
}

export async function render(ctx) {
  const mq = await ottieniMontaQuiz();
  if (!mq) {
    return `<h1>Quiz</h1>
<p class="avviso"><strong>Quiz non disponibile.</strong> Il modulo quiz (W6) non è ancora stato importato in questo ramo. Quando sarà disponibile, questa pagina lo montarà qui.</p>`;
  }
  return `<h1>Quiz</h1><div id="quiz-root"></div>`;
}

export async function setup(container, ctx) {
  const mq = await ottieniMontaQuiz();
  if (!mq) return;
  const root = container.querySelector('#quiz-root');
  if (!root) return;
  try {
    smontaQuiz = mq(root, {
      quiz: ctx.quiz || { versione: 1, descrizione: '', elementi: [] },
      graph: ctx.graph || { versione: 1, nodi: [], esame: [], pendenti: [] },
      storage: ctx.storage,
      renderMath: ctx.renderMath,
      naviga: (hash) => { location.hash = hash; },
    });
  } catch (_err) {
    root.innerHTML = `<p class="avviso">Quiz non disponibile (errore di montaggio del modulo).</p>`;
  }
}

export function smonta() {
  if (typeof smontaQuiz === 'function') {
    try { smontaQuiz(); } catch (_err) { /* ignora */ }
    smontaQuiz = null;
  }
}
