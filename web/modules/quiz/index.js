import { leggiEsiti, registraEsito } from './esiti.js';
import { RISPOSTA_ASSENTE, el, listaQuiz, rispostaUtente, rispostaCorretta, renderDomanda } from './logica.js';
import { costruisciStrutturaQuiz, mostraEsitoAllenamento, mostraRiepilogoFinale } from './vista.js';

/** Monta le modalità allenamento e simulazione in un contenitore esistente. */
export function montaQuiz(radice, { quiz, graph, storage = globalThis.localStorage, renderMath = () => {}, naviga = () => {} } = {}) {
  if (!radice || typeof radice.replaceChildren !== 'function') throw new TypeError('Contenitore quiz non valido.');
  const items = listaQuiz(quiz);
  if (!items.length) {
    radice.replaceChildren(el('div', { className: 'callout callout--warn', role: 'status' }, 'Quiz non disponibile.'));
    return () => radice.replaceChildren();
  }
  let indice = 0; let modalita = 'allenamento'; let risposte = []; let chiuso = false; let timerId = null; let secondiResidui = 0;
  const ui = costruisciStrutturaQuiz(radice, items.length);

  const fermaTimer = () => { if (timerId !== null) globalThis.clearInterval(timerId); timerId = null; };
  const aggiornaOrologio = () => {
    ui.clock.textContent = `Tempo ipotetico residuo: ${Math.floor(secondiResidui / 60)}:${String(secondiResidui % 60).padStart(2, '0')}`;
  };

  function concludi() {
    fermaTimer();
    ui.form.hidden = true; ui.submit.hidden = true; ui.next.hidden = true; ui.nodeLink.hidden = true;
    mostraRiepilogoFinale(ui.feedback, modalita, risposte, renderMath);
    ui.status.textContent = 'Esiti salvati nel dispositivo, se la memoria è disponibile.';
  }

  function mostraDomanda() {
    if (chiuso) return;
    if (indice >= items.length) { concludi(); return; }
    const val = Math.min(Math.max(indice + 1, 1), items.length);
    ui.status.textContent = `${modalita === 'allenamento' ? 'Allenamento' : 'Simulazione'} · domanda ${val} di ${items.length}`;
    ui.progress.setAttribute('aria-valuenow', String(val));
    ui.progressBar.style.width = `${Math.round((val / items.length) * 100)}%`;
    ui.nodeLink.hidden = true; ui.feedback.hidden = true; ui.feedback.replaceChildren();
    ui.next.hidden = true; ui.next.textContent = 'Prossima domanda'; ui.submit.hidden = false; ui.form.hidden = false;
    renderDomanda(items[indice], ui.corpoDomanda);
    renderMath(ui.corpoDomanda);
  }

  function selezionaModalita(mode) {
    fermaTimer();
    modalita = mode; indice = 0; risposte = []; ui.clock.textContent = '';
    ui.tabAllenamento.setAttribute('aria-selected', String(mode === 'allenamento'));
    ui.tabSimulazione.setAttribute('aria-selected', String(mode === 'simulazione'));
    ui.tabAllenamento.classList.toggle('quiz-tab--attiva', mode === 'allenamento');
    ui.tabSimulazione.classList.toggle('quiz-tab--attiva', mode === 'simulazione');
    if (mode === 'simulazione') {
      const parsed = Number(ui.durataInput.value);
      const mins = Number.isFinite(parsed) ? Math.min(180, Math.max(1, Math.floor(parsed))) : 20;
      ui.durataInput.value = String(mins); secondiResidui = mins * 60; aggiornaOrologio();
      timerId = globalThis.setInterval(() => { secondiResidui -= 1; aggiornaOrologio(); if (secondiResidui <= 0) concludi(); }, 1000);
    }
    mostraDomanda();
  }

  ui.form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const item = items[indice]; const answer = rispostaUtente(item, ui.form);
    if (answer === RISPOSTA_ASSENTE || (Array.isArray(answer) && answer.some((v) => !v))) {
      ui.feedback.hidden = false; ui.feedback.className = 'callout callout--error quiz-feedback';
      ui.feedback.replaceChildren(el('p', { role: 'alert' }, 'Inserisci una risposta prima di continuare.')); return;
    }
    const correct = rispostaCorretta(item, answer);
    risposte.push({ item, correct, answer });
    registraEsito(storage, { item_id: item.id, nodo_id: item.nodo_id, corretto: correct, modalita, ts: new Date().toISOString() });
    ui.submit.hidden = true;
    if (modalita === 'allenamento') {
      mostraEsitoAllenamento(ui.feedback, item, correct, answer, renderMath);
      if ((graph?.nodi || []).some((n) => n && n.id === item.nodo_id)) {
        ui.nodeLink.hidden = false; ui.nodeLink.onclick = () => naviga(`#/nodo/${item.nodo_id}`);
      }
      ui.next.hidden = false;
    } else {
      ui.feedback.hidden = false; ui.feedback.className = 'callout quiz-feedback';
      ui.feedback.replaceChildren(el('p', {}, `Risposta registrata (${risposte.length} di ${items.length}). La correzione sarà mostrata alla consegna.`));
      indice += 1; ui.next.hidden = false; ui.next.textContent = indice < items.length ? 'Continua' : 'Consegna simulazione';
    }
  });
  ui.next.addEventListener('click', () => { if (modalita === 'allenamento') indice += 1; mostraDomanda(); });
  ui.tabAllenamento.addEventListener('click', () => selezionaModalita('allenamento'));
  ui.tabSimulazione.addEventListener('click', () => selezionaModalita('simulazione'));
  selezionaModalita('allenamento');
  return () => { chiuso = true; fermaTimer(); radice.replaceChildren(); };
}

export { leggiEsiti };
