/* Agenda: une torneos, eventos semanales y eventos sueltos en una sola lista por fechas. */
import type { EstadoDemo, TipoEvento } from './tipos.ts';
import { EVENTOS_SEMANALES } from '../data/eventos.ts';
import { claveDia, desdeZona, dowDeClave, sumarDias } from './fechas.ts';
import { rutaTorneo } from './vistas/torneo.ts';

export interface EventoAgenda {
  id: string;
  tipo: TipoEvento;
  nombre: string;
  inicio: string;
  duracionMin: number;
  descripcion: string;
  url?: string;
  torneoId?: string;
}

/** Eventos entre dos días (claves "AAAA-MM-DD", ambos incluidos). */
export function eventosEntre(e: EstadoDemo, desde: string, hasta: string): EventoAgenda[] {
  const dentro = (iso: string) => {
    const k = claveDia(iso);
    return k >= desde && k <= hasta;
  };
  const out: EventoAgenda[] = [];
  for (const t of e.torneos) {
    if (!dentro(t.inicio)) continue;
    out.push({ id: `t-${t.id}`, tipo: t.tipo, nombre: t.nombre, inicio: t.inicio, duracionMin: t.duracionMin, descripcion: t.resumen, url: rutaTorneo(t), torneoId: t.id });
  }
  for (const ev of e.eventos) if (dentro(ev.inicio)) out.push({ ...ev });
  for (let k = desde; k <= hasta; k = sumarDias(k, 1)) {
    const dow = dowDeClave(k);
    for (const r of EVENTOS_SEMANALES) {
      if (r.dia !== dow) continue;
      const [y, m, d] = k.split('-').map(Number);
      const [h, min] = r.hora.split(':').map(Number);
      out.push({ id: `${r.id}-${k}`, tipo: r.tipo, nombre: r.nombre, inicio: desdeZona(y, m, d, h, min).toISOString(), duracionMin: r.duracionMin, descripcion: r.descripcion });
    }
  }
  return out.sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}
