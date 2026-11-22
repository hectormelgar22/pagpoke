/* Horario de la tienda: abierto/cerrado en directo (hora de la tienda) y textos. */
import { partes } from './fechas.ts';

export type Horario = Record<number, [string, string][]>;
const min = (h: string) => +h.slice(0, 2) * 60 + +h.slice(3, 5);
const NOMBRES = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export function estadoApertura(h: Horario, ahora = new Date()): { abierto: boolean; texto: string } {
  const p = partes(ahora);
  const m = p.h * 60 + p.min;
  const hoy = h[p.dow] ?? [];
  const tramo = hoy.find(([a, c]) => m >= min(a) && m < min(c));
  if (tramo) return { abierto: true, texto: `Abierto · cierra a las ${tramo[1]}` };
  const luego = hoy.find(([a]) => m < min(a));
  if (luego) return { abierto: false, texto: `Cerrado · abre hoy a las ${luego[0]}` };
  for (let k = 1; k <= 7; k++) {
    const d = ((p.dow - 1 + k) % 7) + 1;
    if (h[d]?.length) return { abierto: false, texto: `Cerrado · abre ${k === 1 ? 'mañana' : `el ${NOMBRES[d]}`} a las ${h[d][0][0]}` };
  }
  return { abierto: false, texto: 'Cerrado' };
}

export const tramosTexto = (t: [string, string][]) => (t.length ? t.map(([a, c]) => `${a}–${c}`).join(' · ') : 'Cerrado');

/** Para schema.org: "Mo 17:00-21:00" etc. */
export function horarioSchema(h: Horario) {
  const dias = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return Object.entries(h).flatMap(([d, tramos]) =>
    tramos.map(([opens, closes]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dias[+d], opens, closes })),
  );
}
