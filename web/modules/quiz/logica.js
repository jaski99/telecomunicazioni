/**
 * Logica pura e costruzione DOM sicura (senza innerHTML) per il modulo quiz.
 */

export const RISPOSTA_ASSENTE = Symbol('risposta assente');

export function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'disabled' || key === 'hidden') node[key] = Boolean(value);
    else if (key === 'for') node.setAttribute('for', String(value));
    else if (key.startsWith('aria-') || key.startsWith('data-') || key === 'role' || key === 'tabindex' || key === 'inputmode') {
      node.setAttribute(key, String(value));
    } else node[key] = value;
  }
  if (text) node.textContent = text;
  return node;
}

export function listaQuiz(quiz) {
  return Array.isArray(quiz) ? quiz : ((quiz && quiz.elementi) || []);
}

export function normalizzaTesto(text) {
  return String(text ?? '').trim().toLocaleLowerCase('it-IT').replace(/\s+/g, ' ');
}

export function rispostaUtente(item, form) {
  if (item.tipo === 'scelta_multipla' || item.tipo === 'vero_falso') {
    const selezionato = form.querySelector('input[name="risposta"]:checked');
    return selezionato ? selezionato.value : RISPOSTA_ASSENTE;
  }
  const campi = [...form.querySelectorAll('input[data-buco]')];
  return campi.map((input) => normalizzaTesto(input.value));
}

export function rispostaCorretta(item, answer) {
  if (item.tipo === 'scelta_multipla') return answer === item.corretta;
  if (item.tipo === 'vero_falso') return answer === String(item.risposta_corretta);
  return Object.entries(item.soluzioni || {}).every(([key, varianti]) => {
    const index = Number(key) - 1;
    return Array.isArray(answer) && (varianti || []).some((v) => normalizzaTesto(v) === answer[index]);
  });
}

export function descrizioneCorretta(item) {
  if (item.tipo === 'scelta_multipla') {
    const opz = (item.opzioni || []).find((o) => o.id === item.corretta);
    return (opz && opz.testo) || 'Risposta corretta.';
  }
  if (item.tipo === 'vero_falso') return item.risposta_corretta ? 'Vero.' : 'Falso.';
  return Object.entries(item.soluzioni || {}).map(([k, v]) => `${k}: ${v.join(' / ')}`).join('; ');
}

export function renderDomanda(item, contenitore) {
  contenitore.replaceChildren();
  contenitore.append(el('h3', { className: 'quiz-domanda' }, item.domanda || 'Quesito'));
  if (item.tipo === 'scelta_multipla') {
    const gruppo = el('div', { className: 'quiz-opzioni' });
    for (const option of item.opzioni || []) {
      const label = el('label', { className: 'quiz-option' });
      label.append(
        el('input', { type: 'radio', name: 'risposta', value: option.id }),
        el('span', { className: 'quiz-option__testo' }, option.testo)
      );
      gruppo.append(label);
    }
    contenitore.append(gruppo);
  } else if (item.tipo === 'vero_falso') {
    contenitore.append(el('p', { className: 'quiz-affermazione' }, item.affermazione || ''));
    const gruppo = el('div', { className: 'quiz-opzioni' });
    for (const [val, txt] of [['true', 'Vero'], ['false', 'Falso']]) {
      const label = el('label', { className: 'quiz-option' });
      label.append(
        el('input', { type: 'radio', name: 'risposta', value: val }),
        el('span', { className: 'quiz-option__testo' }, txt)
      );
      gruppo.append(label);
    }
    contenitore.append(gruppo);
  } else {
    const riga = el('div', { className: 'quiz-completamento' });
    for (const part of String(item.testo_con_buchi || '').split(/(___\d+___)/g)) {
      const m = part.match(/^___(\d+)___$/);
      riga.append(m
        ? el('input', { type: 'text', className: 'quiz-buco', inputmode: 'text', 'data-buco': m[1], 'aria-label': `Risposta ${m[1]}` })
        : document.createTextNode(part));
    }
    contenitore.append(riga);
  }
}
