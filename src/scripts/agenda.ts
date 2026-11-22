import { $, abrir, descargarIcs } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import { eventosEntre, type EventoAgenda } from '../lib/agenda.ts';
import { TIPOS_EVENTO } from '../data/eventos.ts';
import { claveDia, desdeZona, dowDeClave, fechaLarga, hora, nombreMes, partes, sumarDias } from '../lib/fechas.ts';
import { esc } from '../lib/html.ts';
import { icono } from '../lib/iconos.ts';
import { enlaceWhatsApp, tienda } from '../data/tienda.ts';
import type { TipoEvento } from '../lib/tipos.ts';

const hoy = partes(new Date());
let y = hoy.y;
let m = hoy.m;
const activos = new Set<TipoEvento>(Object.keys(TIPOS_EVENTO) as TipoEvento[]);
let visibles: EventoAgenda[] = [];
const DSEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function pintar() {
  const primero = `${y}-${String(m).padStart(2, '0')}-01`;
  const ultimo = sumarDias(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`, -1);
  const inicioRejilla = sumarDias(primero, 1 - dowDeClave(primero));
  const finRejilla = sumarDias(ultimo, 7 - dowDeClave(ultimo));
  visibles = eventosEntre(cargar(), inicioRejilla, finRejilla).filter((ev) => activos.has(ev.tipo));
  const porDia = new Map<string, EventoAgenda[]>();
  for (const ev of visibles) {
    const k = claveDia(ev.inicio);
    porDia.set(k, [...(porDia.get(k) ?? []), ev]);
  }
  $('[data-mes-titulo]')!.textContent = nombreMes(y, m);
  const hoyK = claveDia(new Date());
  let celdas = DSEM.map((d) => `<div class="cal-dsem" role="columnheader">${d}</div>`).join('');
  for (let k = inicioRejilla; k <= finRejilla; k = sumarDias(k, 1)) {
    const evs = porDia.get(k) ?? [];
    const fuera = k < primero || k > ultimo;
    celdas += `<div class="cal-dia${fuera ? ' cal-dia--fuera' : ''}${k === hoyK ? ' cal-dia--hoy' : ''}" role="gridcell" aria-label="${fechaLarga(desdeZona(+k.slice(0, 4), +k.slice(5, 7), +k.slice(8, 10), 12).toISOString())}${evs.length ? `, ${evs.length} eventos` : ''}">
      <span class="cal-num">${+k.slice(8, 10)}</span>
      ${evs.slice(0, 3).map((ev) => `<button type="button" class="cal-ev" style="--c:${TIPOS_EVENTO[ev.tipo].color}" data-ev="${esc(ev.id)}">${hora(ev.inicio)} ${esc(ev.nombre)}</button>`).join('')}
      ${evs.length > 3 ? `<button type="button" class="cal-ev" style="--c:#9ca3af" data-ev="${esc(evs[3].id)}">+${evs.length - 3} más</button>` : ''}
    </div>`;
  }
  $('[data-calendario]')!.innerHTML = celdas;
  // Lista para móvil: solo días del mes con eventos
  const dias = [...porDia.entries()].filter(([k]) => k >= primero && k <= ultimo);
  $('[data-lista]')!.innerHTML = dias.length
    ? dias.map(([k, evs]) => `<div><h3>${k === hoyK ? 'Hoy · ' : ''}${fechaLarga(evs[0].inicio)}</h3>${evs.map((ev) => `<button type="button" class="ev-fila" style="--c:${TIPOS_EVENTO[ev.tipo].color}" data-ev="${esc(ev.id)}"><span class="ev-color"></span><span class="ev-hora">${hora(ev.inicio)}</span><span><strong>${esc(ev.nombre)}</strong><small>${TIPOS_EVENTO[ev.tipo].nombre}</small></span></button>`).join('')}</div>`).join('')
    : `<div class="vacio">${icono('calendario')}<p>No hay eventos de este tipo en ${nombreMes(y, m)}.</p></div>`;
}

document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const mes = t.closest<HTMLElement>('[data-mes]');
  if (mes) {
    m += +mes.dataset.mes!;
    if (m < 1) (m = 12), y--;
    if (m > 12) (m = 1), y++;
    pintar();
  }
  if (t.closest('[data-hoy]')) {
    y = hoy.y;
    m = hoy.m;
    pintar();
  }
  const tipo = t.closest<HTMLElement>('[data-tipo]');
  if (tipo) {
    const k = tipo.dataset.tipo as TipoEvento;
    if (activos.has(k)) activos.delete(k);
    else activos.add(k);
    tipo.setAttribute('aria-pressed', String(activos.has(k)));
    pintar();
  }
  const b = t.closest<HTMLElement>('[data-ev]');
  if (b) mostrar(b.dataset.ev!);
});

function mostrar(id: string) {
  const ev = visibles.find((x) => x.id === id);
  if (!ev) return;
  const fin = new Date(Date.parse(ev.inicio) + ev.duracionMin * 60000).toISOString();
  const futuro = Date.parse(ev.inicio) > Date.now();
  const tipo = TIPOS_EVENTO[ev.tipo];
  $('[data-ev-tipo]')!.innerHTML = `<span class="pill" style="--c:${tipo.color}">${tipo.nombre}</span>`;
  $('[data-ev-nombre]')!.textContent = ev.nombre;
  $('[data-ev-cuerpo]')!.innerHTML = `<ul class="resumen-condiciones" role="list" style="background:var(--nacar)">
    <li><span>Fecha</span><strong>${fechaLarga(ev.inicio)}</strong></li><li><span>Hora</span><strong>${hora(ev.inicio)}–${hora(fin)}</strong></li>
    <li><span>Lugar</span><strong>${esc(tienda.nombre)}, ${esc(tienda.direccion.ciudad)}</strong></li></ul>
    <p style="color:var(--gris)">${esc(ev.descripcion)}</p>
    <div class="fila">
      ${ev.url ? `<a class="btn btn--acento" href="${ev.url}${futuro ? '#inscripcion' : '#competicion'}">${futuro ? 'Ver torneo e inscripción' : 'Ver resultados'}</a>` : ''}
      ${futuro ? `<button class="btn btn--suave" type="button" data-ics-ev="${esc(ev.id)}">${icono('calendario')}Añadir a mi calendario</button>` : ''}
      <a class="btn btn--wa" target="_blank" rel="noopener" href="${enlaceWhatsApp(`Hola, tengo una pregunta sobre «${ev.nombre}» del ${fechaLarga(ev.inicio)}.`)}">${icono('whatsapp')}Preguntar</a>
    </div>`;
  abrir('dlg-evento');
}
$('#dlg-evento')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ics-ev]');
  const ev = b && visibles.find((x) => x.id === b.dataset.icsEv);
  if (ev) descargarIcs(`${ev.nombre} · ${tienda.nombre}`, ev.inicio, ev.duracionMin, `${tienda.nombre}, ${tienda.direccion.calle}, ${tienda.direccion.ciudad}`, ev.descripcion, location.origin + (ev.url ?? '/agenda/'));
});

pintar();
suscribir(pintar);
