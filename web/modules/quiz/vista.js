/**
 * Costruzione dei nodi DOM e dei pannelli di feedback per il modulo quiz.
 */
import { el, descrizioneCorretta } from './logica.js';

export function costruisciStrutturaQuiz(radice, totaleDomande) {
  const tabsWrap = el('div', { className: 'scroll-x', tabindex: '0', role: 'region', 'aria-label': 'Modalità quiz' });
  const tablist = el('div', { className: 'tabs quiz-tabs', role: 'tablist', 'aria-label': 'Modalità quiz' });
  const tabAllenamento = el('button', { type: 'button', role: 'tab', className: 'btn btn--ghost quiz-tab', 'aria-selected': 'true' }, 'Allenamento');
  const tabSimulazione = el('button', { type: 'button', role: 'tab', className: 'btn btn--ghost quiz-tab', 'aria-selected': 'false' }, 'Simulazione');
  tablist.append(tabAllenamento, tabSimulazione);
  tabsWrap.append(tablist);

  const durataBox = el('div', { className: 'quiz-durata' });
  const durataLabel = el('label', { className: 'quiz-durata__label', for: 'quiz-durata-minuti' }, 'Durata simulazione in minuti (ipotesi)');
  const durataInput = el('input', {
    id: 'quiz-durata-minuti',
    className: 'quiz-durata__input',
    type: 'number',
    min: 1,
    max: 180,
    step: 1,
    value: Number((radice.dataset && radice.dataset.durataMinuti) || 20),
    'aria-label': 'Durata simulazione in minuti',
  });
  durataBox.append(durataLabel, durataInput);

  const controls = el('div', { className: 'quiz-controls' });
  controls.append(tabsWrap, durataBox);

  const statusRow = el('div', { className: 'quiz-avanzamento' });
  const statusHead = el('div', { className: 'quiz-avanzamento__testa' });
  const status = el('div', { 'aria-live': 'polite', className: 'quiz-status' });
  const clock = el('div', { 'aria-live': 'polite', className: 'quiz-clock' });
  const progress = el('div', { className: 'progress', role: 'progressbar', 'aria-label': 'Avanzamento quiz', 'aria-valuemin': '1', 'aria-valuenow': '1', 'aria-valuemax': String(totaleDomande) });
  const progressBar = el('div', { className: 'progress__bar' });
  progress.append(progressBar);
  statusHead.append(status, clock);
  statusRow.append(statusHead, progress);

  const form = el('form', { className: 'card quiz-form' });
  const corpoDomanda = el('div', { className: 'quiz-corpo' });
  const submit = el('button', { type: 'submit', className: 'btn btn--primary' }, 'Conferma risposta');
  const formAzioni = el('div', { className: 'quiz-azioni' });
  formAzioni.append(submit);
  form.append(corpoDomanda, formAzioni);

  const feedback = el('section', { className: 'callout quiz-feedback', 'aria-live': 'polite', hidden: true });
  const postAzioni = el('div', { className: 'quiz-azioni' });
  const next = el('button', { type: 'button', className: 'btn btn--primary', hidden: true }, 'Prossima domanda');
  const nodeLink = el('button', { type: 'button', className: 'btn btn--ghost', hidden: true }, 'Riapri il nodo');
  postAzioni.append(next, nodeLink);
  radice.replaceChildren(controls, statusRow, form, feedback, postAzioni);

  return { tabAllenamento, tabSimulazione, durataInput, status, clock, progress, progressBar, form, corpoDomanda, submit, feedback, next, nodeLink };
}

export function mostraEsitoAllenamento(feedback, item, correct, answer, renderMath) {
  feedback.hidden = false;
  feedback.className = `callout ${correct ? 'callout--ok' : 'callout--error'} quiz-feedback`;
  feedback.replaceChildren(
    el('div', { className: 'callout__title' }, correct ? 'Corretto.' : 'Da rivedere.'),
    el('p', {}, item.spiegazione)
  );
  const rat = !correct && item.tipo === 'scelta_multipla' && (item.opzioni || []).find((o) => o.id === answer)?.perche_sbagliata;
  if (rat) feedback.append(el('p', {}, `Perché questa scelta non funziona: ${rat}`));
  feedback.append(el('p', {}, `Risposta attesa: ${descrizioneCorretta(item)}`));
  renderMath(feedback);
}

export function mostraRiepilogoFinale(feedback, modalita, risposte, renderMath) {
  const score = risposte.filter((a) => a.correct).length;
  feedback.hidden = false;
  feedback.className = 'callout callout--ok quiz-feedback';
  feedback.replaceChildren(
    el('div', { className: 'callout__title' }, modalita === 'simulazione' ? 'Simulazione completata' : 'Allenamento completato'),
    el('p', {}, `Risposte corrette: ${score} su ${risposte.length}. Esito di allenamento, nessun voto ufficiale.`)
  );
  const review = el('ol', { className: 'quiz-riepilogo' });
  for (const { item, correct, answer } of risposte) {
    const li = el('li', {}, `${item.domanda} — ${correct ? 'corretta' : 'da rivedere'}. ${item.spiegazione} Risposta attesa: ${descrizioneCorretta(item)}`);
    const rat = !correct && item.tipo === 'scelta_multipla' && (item.opzioni || []).find((o) => o.id === answer)?.perche_sbagliata;
    if (rat) li.append(document.createTextNode(` Motivazione: ${rat}`));
    review.append(li);
  }
  feedback.append(review);
  renderMath(feedback);
}
