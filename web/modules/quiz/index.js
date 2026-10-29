import { leggiEsiti, registraEsito } from './esiti.js';

const el = (tag, attrs = {}, text = '') => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'disabled') node.disabled = Boolean(value);
    else if (key.startsWith('aria-') || key.startsWith('data-')) node.setAttribute(key, value);
    else node[key] = value;
  }
  if (text) node.textContent = text;
  return node;
};
const RISPOSTA_ASSENTE = Symbol('risposta assente');
const listaQuiz = quiz => Array.isArray(quiz) ? quiz : (quiz?.elementi || []);
const normalize = text => String(text ?? '').trim().toLocaleLowerCase('it-IT').replace(/\s+/g, ' ');

function rispostaUtente(item, form) {
  if (item.tipo === 'scelta_multipla') return form.querySelector('input[name="risposta"]:checked')?.value ?? RISPOSTA_ASSENTE;
  if (item.tipo === 'vero_falso') return form.querySelector('input[name="risposta"]:checked')?.value ?? RISPOSTA_ASSENTE;
  const campi = [...form.querySelectorAll('input[data-buco]')];
  return campi.map(input => normalize(input.value));
}
function rispostaCorretta(item, answer) {
  if (item.tipo === 'scelta_multipla') return answer === item.corretta;
  if (item.tipo === 'vero_falso') return answer === String(item.risposta_corretta);
  return Object.entries(item.soluzioni || {}).every(([key, varianti]) => {
    const index = Number(key) - 1;
    return Array.isArray(answer) && (varianti || []).some(value => normalize(value) === answer[index]);
  });
}
function descrizioneCorretta(item) {
  if (item.tipo === 'scelta_multipla') return item.opzioni?.find(option => option.id === item.corretta)?.testo || 'Risposta corretta.';
  if (item.tipo === 'vero_falso') return item.risposta_corretta ? 'Vero.' : 'Falso.';
  return Object.entries(item.soluzioni || {}).map(([key, values]) => `${key}: ${values.join(' / ')}`).join('; ');
}
function renderQuestion(item, form) {
  form.replaceChildren();
  form.append(el('h3', {}, item.domanda || 'Quiz'));
  if (item.tipo === 'scelta_multipla') {
    item.opzioni.forEach(option => {
      const label = el('label', { className: 'quiz-option' });
      label.append(el('input', { type: 'radio', name: 'risposta', value: option.id }));
      label.append(el('span', {}, option.testo));
      form.append(label);
    });
  } else if (item.tipo === 'vero_falso') {
    form.append(el('p', {}, item.affermazione));
    for (const [value, labelText] of [['true', 'Vero'], ['false', 'Falso']]) {
      const label = el('label', { className: 'quiz-option' });
      label.append(el('input', { type: 'radio', name: 'risposta', value }));
      label.append(el('span', {}, labelText));
      form.append(label);
    }
  } else {
    const parts = String(item.testo_con_buchi || '').split(/(___\d+___)/g);
    for (const part of parts) {
      const match = part.match(/^___(\d+)___$/);
      form.append(match ? el('input', { type: 'text', 'data-buco': match[1], 'aria-label': `Risposta ${match[1]}` }) : document.createTextNode(part));
    }
  }
}

/** Monta le modalità allenamento e simulazione in un contenitore esistente. */
export function montaQuiz(radice, { quiz, graph, storage = globalThis.localStorage, renderMath = () => {}, naviga = () => {} } = {}) {
  if (!radice || typeof radice.replaceChildren !== 'function') throw new TypeError('Contenitore quiz non valido.');
  const items = listaQuiz(quiz);
  if (!items.length) {
    radice.replaceChildren(el('p', { role: 'status' }, 'Quiz non disponibile.'));
    return () => radice.replaceChildren();
  }
  let indice = 0;
  let modalita = 'allenamento';
  let risposte = [];
  let chiuso = false;
  let timerId = null;
  let secondiResidui = 0;
  const titolo = el('h2', {}, 'Banca quiz');
  const status = el('p', { 'aria-live': 'polite', className: 'quiz-status' });
  const clock = el('p', { 'aria-live': 'polite', className: 'quiz-clock' });
  const controls = el('div', { className: 'quiz-controls' });
  const training = el('button', { type: 'button' }, 'Allenamento');
  const simulation = el('button', { type: 'button' }, 'Simulazione');
  const durationLabel = el('label', {}, 'Durata simulazione (minuti, ipotesi) ');
  const durationInput = el('input', { type: 'number', min: 1, max: 180, step: 1, value: Number(radice.dataset.durataMinuti || 20), 'aria-label': 'Durata simulazione in minuti' });
  durationLabel.append(durationInput);
  const form = el('form', { className: 'quiz-form' });
  const feedback = el('section', { className: 'quiz-feedback', 'aria-live': 'polite' });
  const submit = el('button', { type: 'submit' }, 'Conferma risposta');
  const next = el('button', { type: 'button', hidden: true }, 'Prossima domanda');
  const nodeLink = el('button', { type: 'button', hidden: true }, 'Riapri il nodo');
  controls.append(training, simulation, durationLabel);
  form.append(submit);
  radice.replaceChildren(titolo, controls, status, clock, form, feedback, next, nodeLink);

  function fermaTimer() {
    if (timerId !== null) globalThis.clearInterval(timerId);
    timerId = null;
  }
  function aggiornaOrologio() {
    const minuti = Math.floor(secondiResidui / 60);
    const secondi = String(secondiResidui % 60).padStart(2, '0');
    clock.textContent = `Tempo ipotetico residuo: ${minuti}:${secondi}`;
  }
  function selectMode(mode) {
    fermaTimer();
    modalita = mode; indice = 0; risposte = []; feedback.replaceChildren(); next.hidden = true;
    submit.hidden = false; submit.disabled = false; form.hidden = false;
    clock.textContent = '';
    if (mode === 'simulazione') {
      const parsed = Number(durationInput.value);
      const mins = Number.isFinite(parsed) ? Math.min(180, Math.max(1, Math.floor(parsed))) : 20;
      durationInput.value = String(mins);
      secondiResidui = mins * 60;
      aggiornaOrologio();
      timerId = globalThis.setInterval(() => {
        secondiResidui -= 1;
        aggiornaOrologio();
        if (secondiResidui <= 0) finish();
      }, 1000);
      status.textContent = `Simulazione di allenamento: ${items.length} quesiti. Durata configurabile: ${mins} minuti (ipotesi, non durata ufficiale).`;
    }
    showQuestion();
  }
  function showQuestion() {
    if (chiuso) return;
    if (indice >= items.length) return finish();
    const item = items[indice];
    status.textContent = `${modalita === 'allenamento' ? 'Allenamento' : 'Simulazione'} · domanda ${indice + 1} di ${items.length}`;
    nodeLink.hidden = true; feedback.replaceChildren(); next.hidden = true; submit.hidden = false;
    renderQuestion(item, form); form.append(submit); renderMath(form);
  }
  function persist(item, correct, mode) {
    registraEsito(storage, { item_id: item.id, nodo_id: item.nodo_id, corretto: correct, modalita: mode, ts: new Date().toISOString() });
  }
  function showNode(item) {
    const nodes = graph?.nodi || [];
    const n = nodes.find(value => value.id === item.nodo_id);
    if (!n) return;
    nodeLink.hidden = false;
    nodeLink.onclick = () => naviga(`#${item.nodo_id}`);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const item = items[indice]; const answer = rispostaUtente(item, form);
    if (answer === RISPOSTA_ASSENTE || (Array.isArray(answer) && answer.some(value => !value))) {
      feedback.replaceChildren(el('p', { role: 'alert' }, 'Inserisci una risposta prima di continuare.')); return;
    }
    const correct = rispostaCorretta(item, answer);
    risposte.push({ item, correct, answer }); persist(item, correct, modalita);
    submit.hidden = true;
    if (modalita === 'allenamento') {
      const heading = el('strong', {}, correct ? 'Corretto.' : 'Da rivedere.');
      feedback.replaceChildren(heading, el('p', {}, item.spiegazione));
      if (!correct && item.tipo === 'scelta_multipla') {
        const rationale = item.opzioni.find(option => option.id === answer)?.perche_sbagliata;
        if (rationale) feedback.append(el('p', {}, `Perché questa scelta non funziona: ${rationale}`));
      }
      feedback.append(el('p', {}, `Risposta attesa: ${descrizioneCorretta(item)}`));
      showNode(item); next.hidden = false;
    } else {
      feedback.replaceChildren(el('p', {}, `Risposta registrata (${risposte.length} di ${items.length}). La correzione sarà mostrata alla consegna.`));
      indice += 1;
      if (indice < items.length) { next.hidden = false; next.textContent = 'Continua'; }
      else { next.hidden = false; next.textContent = 'Consegna simulazione'; }
    }
  });
  next.addEventListener('click', () => {
    if (modalita === 'allenamento') indice += 1;
    showQuestion();
  });
  function finish() {
    fermaTimer();
    const score = risposte.filter(answer => answer.correct).length;
    form.hidden = true; submit.hidden = true; next.hidden = true;
    const titoloEsito = modalita === 'simulazione' ? 'Simulazione completata' : 'Allenamento completato';
    feedback.replaceChildren(el('h3', {}, titoloEsito), el('p', {}, `Risposte corrette: ${score} su ${risposte.length}. Esito di allenamento, nessun voto ufficiale.`));
    const review = el('ol');
    risposte.forEach(({ item, correct, answer }) => {
      const entry = el('li', {}, `${item.domanda} — ${correct ? 'corretta' : 'da rivedere'}. ${item.spiegazione} Risposta attesa: ${descrizioneCorretta(item)}`);
      if (!correct && item.tipo === 'scelta_multipla') {
        const rationale = item.opzioni.find(option => option.id === answer)?.perche_sbagliata;
        if (rationale) entry.append(document.createTextNode(` Motivazione: ${rationale}`));
      }
      review.append(entry);
    });
    feedback.append(review);
    status.textContent = 'Esiti salvati nel dispositivo, se la memoria è disponibile.';
  }
  training.addEventListener('click', () => selectMode('allenamento'));
  simulation.addEventListener('click', () => selectMode('simulazione'));
  selectMode('allenamento');
  return () => { chiuso = true; fermaTimer(); radice.replaceChildren(); };
}

export { leggiEsiti };
