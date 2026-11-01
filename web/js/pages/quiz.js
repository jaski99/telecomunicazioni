/** web/js/pages/quiz.js — owner E1.
 * Pagina #/quiz: monta il modulo quiz con supporto ?area= per il
 * checkpoint per capitolo (filtra gli elementi per area).
 */
import { escapeHtml } from '../core/math.js';

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

export async function render(ctx, params) {
  const area = (params && params.area) ? String(params.area) : '';
  let intro = '<p>Verifica la preparazione in modalità <strong>Allenamento</strong> con spiegazione immediata oppure in <strong>Simulazione</strong> con consegna finale e durata ipotetica configurabile.</p>';
  if (area) {
    intro = `<p>Checkpoint Capitolo ${escapeHtml(area)} — verifica la preparazione sugli argomenti di questo capitolo.</p>`;
  }
  return `<h1>Quiz di allenamento</h1>
<div class="prose">${intro}</div>
<div id="quiz-root"></div>`;
}

export async function setup(container, ctx, params) {
  const area = (params && params.area) ? String(params.area) : '';
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
  let elementi = (ctx && ctx.quiz && Array.isArray(ctx.quiz.elementi) ? ctx.quiz.elementi : []);
  if (area) {
    elementi = elementi.filter((e) => e && Number(e.area || 0) === Number(area));
  }
  const quizFiltro = { versione: 1, descrizione: ctx && ctx.quiz ? ctx.quiz.descrizione : '', elementi };
  try {
    return mq(root, {
      quiz: quizFiltro,
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
