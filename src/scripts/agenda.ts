import { $, abrir, descargarIcs } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import type { EventoAgenda } from '../lib/agenda.ts';
import { pintarAgenda } from '../lib/vistas/agenda.ts';
import { TIPOS_EVENTO } from '../data/eventos.ts';
import { fechaLarga, hora, partes } from '../lib/fechas.ts';
import { esc } from '../lib/html.ts';
import { icono } from '../lib/iconos.ts';
import { enlaceWhatsApp, tienda } from '../data/tienda.ts';
import type { TipoEvento } from '../lib/tipos.ts';

const hoy = partes(new Date());
let y = hoy.y;
let m = hoy.m;
const activos = new Set<TipoEvento>(Object.keys(TIPOS_EVENTO) as TipoEvento[]);
let visibles: EventoAgenda[] = [];

function pintar() {
  const v = pintarAgenda(cargar(), y, m, activos);
  visibles = v.visibles;
  $('[data-mes-titulo]')!.textContent = v.titulo;
  $('[data-calendario]')!.innerHTML = v.calendario;
  $('[data-lista]')!.innerHTML = v.lista;
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
