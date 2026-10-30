/**
 * Pagina #/quiz: monta il modulo quiz (web/modules/quiz/index.js) con
 * modalità Allenamento e Simulazione. Se l'import fallisce mostra un avviso.
 */

let montaQuizFn = null;
let importTentato = false;

async function ottieniMontaQuiz() {
  if (importTentato) return montaQuizFn;
  importTentato = true;
  try {
    const mod = await import('../../modules/quiz/index.js');
    montaQuizFn = mod && typeof mod.montaQuiz === 'function' ? mod.montaQuiz : null;
  } catch (_err) {
    montaQuizFn = null;
  }
  return montaQuizFn;
}

export async function render() {
  return `<h1>Quiz di allenamento</h1>
<div class="prose">
  <p>Verifica la preparazione in modalità <strong>Allenamento</strong> con spiegazione immediata oppure in <strong>Simulazione</strong> con consegna finale e durata ipotetica configurabile.</p>
</div>
<div id="quiz-root"></div>`;
}

export async function setup(container, ctx) {
  const root = container.querySelector('#quiz-root');
  if (!root) return undefined;
  const mq = await ottieniMontaQuiz();
  if (!mq) {
    const box = document.createElement('div');
    box.className = 'callout callout--warn';
    box.textContent = 'Quiz non disponibile.';
    root.replaceChildren(box);
    return undefined;
  }
  try {
    return mq(root, {
      quiz: (ctx && ctx.quiz) || { versione: 1, descrizione: '', elementi: [] },
      graph: (ctx && ctx.graph) || { versione: 1, nodi: [], esame: [], pendenti: [] },
      storage: ctx && ctx.storage,
      renderMath: (ctx && ctx.renderMath) || (() => {}),
      naviga: (hash) => { location.hash = hash; },
    });
  } catch (_err) {
    const box = document.createElement('div');
    box.className = 'callout callout--error';
    box.textContent = 'Quiz non disponibile (errore di montaggio del modulo).';
    root.replaceChildren(box);
    return undefined;
  }
}
