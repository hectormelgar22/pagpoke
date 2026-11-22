/* Calendario mensual y lista de la agenda (se generan en el servidor y se actualizan en el navegador). */
import type { EstadoDemo, TipoEvento } from '../tipos.ts';
import { eventosEntre, type EventoAgenda } from '../agenda.ts';
import { TIPOS_EVENTO } from '../../data/eventos.ts';
import { claveDia, dowDeClave, fechaLarga, hora, nombreMes, sumarDias } from '../fechas.ts';
import { esc } from '../html.ts';
import { icono } from '../iconos.ts';

const DSEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function pintarAgenda(e: EstadoDemo, y: number, m: number, activos: Set<TipoEvento>, ahora = new Date()) {
  const primero = `${y}-${String(m).padStart(2, '0')}-01`;
  const ultimo = sumarDias(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`, -1);
  const inicio = sumarDias(primero, 1 - dowDeClave(primero));
  const fin = sumarDias(ultimo, 7 - dowDeClave(ultimo));
  const visibles: EventoAgenda[] = eventosEntre(e, inicio, fin).filter((ev) => activos.has(ev.tipo));
  const porDia = new Map<string, EventoAgenda[]>();
  for (const ev of visibles) {
    const k = claveDia(ev.inicio);
    porDia.set(k, [...(porDia.get(k) ?? []), ev]);
  }
  const hoyK = claveDia(ahora);
  const boton = (ev: EventoAgenda) =>
    `<button type="button" class="cal-ev" style="--c:${TIPOS_EVENTO[ev.tipo].color}" data-ev="${esc(ev.id)}">${hora(ev.inicio)} ${esc(ev.nombre)}</button>`;
  let calendario = DSEM.map((d) => `<div class="cal-dsem">${d}</div>`).join('');
  for (let k = inicio; k <= fin; k = sumarDias(k, 1)) {
    const evs = porDia.get(k) ?? [];
    const fuera = k < primero || k > ultimo;
    calendario += `<div class="cal-dia${fuera ? ' cal-dia--fuera' : ''}${k === hoyK ? ' cal-dia--hoy' : ''}"><span class="cal-num">${+k.slice(8, 10)}</span>${evs.slice(0, 3).map(boton).join('')}${
      evs.length > 3 ? `<button type="button" class="cal-ev" style="--c:#9ca3af" data-ev="${esc(evs[3].id)}">+${evs.length - 3} más</button>` : ''
    }</div>`;
  }
  const dias = [...porDia.entries()].filter(([k]) => k >= primero && k <= ultimo);
  const lista = dias.length
    ? dias
        .map(
          ([k, evs]) =>
            `<div><h3>${k === hoyK ? 'Hoy · ' : ''}${fechaLarga(evs[0].inicio)}</h3>${evs
              .map((ev) => `<button type="button" class="ev-fila" style="--c:${TIPOS_EVENTO[ev.tipo].color}" data-ev="${esc(ev.id)}"><span class="ev-color"></span><span class="ev-hora">${hora(ev.inicio)}</span><span><strong>${esc(ev.nombre)}</strong><small>${TIPOS_EVENTO[ev.tipo].nombre}</small></span></button>`)
              .join('')}</div>`,
        )
        .join('')
    : `<div class="vacio">${icono('calendario')}<p>No hay eventos de este tipo en ${nombreMes(y, m)}.</p></div>`;
  return { titulo: nombreMes(y, m), calendario, lista, visibles };
}
