/** Dettaglio chiuso «Fonti, varianti e verifica»: fonti con etichette umane, varianti, stato. */
import { escapeHtml, testoSicuro } from '../../core/math.js';
import { etichettaFonte, etichettaVerifica } from './etichette.js';

const t = (v) => escapeHtml(testoSicuro(v));

function elenco(items) {
  return items.length ? `<ul class="dim-lista">${items.join('')}</ul>` : '';
}

function sezioneVerifica(verifica) {
  if (!verifica || typeof verifica !== 'object') return '';
  const aperti = Array.isArray(verifica.punti_aperti) ? verifica.punti_aperti : [];
  const note = verifica.note ? `<p>${t(verifica.note)}</p>` : '';
  const punti = aperti.length ? `<h4>Punti aperti</h4>${elenco(aperti.map((p) => `<li>${t(p)}</li>`))}` : '';
  return `<h3>Verifica</h3><p><strong>${t(etichettaVerifica(verifica.stato))}</strong></p>${note}${punti}`;
}

export function renderFonti(dim, meta) {
  const fonti = Array.isArray(dim.fonti) ? dim.fonti.filter((f) => f && typeof f === 'object') : [];
  const varianti = Array.isArray(dim.varianti_notazione) ? dim.varianti_notazione.filter((v) => v && typeof v === 'object') : [];
  const fontiHtml = fonti.map((f) => `<li><strong>${t(etichettaFonte(f.chiave, meta))}</strong>: ${t(f.rif)}</li>`);
  const variantiHtml = varianti.map((v) => `<li>Canonica: ${t(v.canonica)}. Variante: ${t(v.variante)}. Fonte: ${t(v.fonte)}.</li>`);
  return `<details class="card dim-fonti"><summary>Fonti, varianti e verifica</summary>
<h3>Fonti</h3>${elenco(fontiHtml)}
${variantiHtml.length ? `<h3>Varianti di notazione</h3>${elenco(variantiHtml)}` : ''}
${sezioneVerifica(dim.verifica)}
</details>`;
}
