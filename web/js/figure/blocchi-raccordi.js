/* Evita che un'uscita da un blocco coincida con la punta di una freccia entrante. */
export function separaRaccordi(frecce, collegamenti, perId) {
  const punte = frecce.filter(f => !f.senzaPunta).map(f => f.fine);
  for (const nodo of perId.values()) {
    if (nodo.forma !== 'uscita') continue;
    if (nodo.verticale) punte.push({ x: nodo.x, y: nodo.y + (nodo.verso === 'su' ? -16 : 16) });
    else punte.push({ x: nodo.x + (nodo.verso === 'sinistra' ? -16 : 16), y: nodo.y });
  }
  const coincide = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 0.1;
  for (const f of frecce) {
    if (!punte.some(p => coincide(p, f.inizio))) continue;
    const nodo = perId.get(String(collegamenti[f.indice].da));
    if (!nodo || nodo.forma === 'ingresso') continue;
    const candidati = nodo.forma === 'uscita' ? [{ x: nodo.x, y: nodo.y }] : [
      { x: nodo.x - nodo.w / 2, y: nodo.y }, { x: nodo.x + nodo.w / 2, y: nodo.y },
      { x: nodo.x, y: nodo.y - nodo.h / 2 }, { x: nodo.x, y: nodo.y + nodo.h / 2 },
    ];
    const liberi = candidati.filter(p => !punte.some(z => coincide(p, z)));
    if (!liberi.length) continue;
    liberi.sort((a, b) => Math.hypot(a.x - f.fine.x, a.y - f.fine.y) - Math.hypot(b.x - f.fine.x, b.y - f.fine.y));
    f.inizio = liberi[0];
    const dx = f.fine.x - f.inizio.x, dy = f.fine.y - f.inizio.y, lunghezza = Math.hypot(dx, dy) || 1;
    const ux = dx / lunghezza, uy = dy / lunghezza;
    f.base = { x: f.fine.x - ux * 8, y: f.fine.y - uy * 8 };
    f.ali = [{ x: f.base.x - uy * 4, y: f.base.y + ux * 4 }, { x: f.base.x + uy * 4, y: f.base.y - ux * 4 }];
  }
}
