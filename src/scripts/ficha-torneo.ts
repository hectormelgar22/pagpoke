/* Ficha de torneo en el navegador: estado en vivo, pestañas, inscripción en 3 pasos y cuadros. */
import { $, $$, abrir, descargarIcs, mostrarErrores, toast } from './ui.ts';
import { cargar, mutar, nuevoId, suscribir } from '../lib/almacen.ts';
import { heroTorneo, fichaCuerpo } from '../lib/vistas/ficha.ts';
import { barraPlazas, rutaTorneo } from '../lib/vistas/torneo.ts';
import { esc } from '../lib/html.ts';
import { icono } from '../lib/iconos.ts';
import * as T from '../lib/torneo.ts';
import { fechaLarga, hora } from '../lib/fechas.ts';
import { enlaceWhatsApp, tienda } from '../data/tienda.ts';
import { iniciarCuadros, iniciarCuentas } from './efectos.ts';
import type { Torneo } from '../lib/tipos.ts';

const raiz = $('[data-ficha-torneo]')!;
const id = raiz.dataset.fichaTorneo || new URLSearchParams(location.search).get('id') || '';
let pestanaActiva: string | null = null;
let nuevoJugador: string | null = null;

const torneo = (): Torneo | undefined => cargar().torneos.find((t) => t.id === id);

function pintar() {
  const t = torneo();
  const e = cargar();
  const ahora = new Date();
  if (!t) {
    $('[data-ficha-hero-in]')!.innerHTML = `<h1 class="h1">Torneo no encontrado</h1><p class="entradilla">Puede que se haya borrado o que la demo se haya restablecido.</p><p style="margin-top:20px"><a class="btn btn--acento" href="/torneos/">Ver todos los torneos</a></p>`;
    $('[data-ficha-cuerpo]')!.innerHTML = '';
    return;
  }
  document.title = `${t.nombre} · ${tienda.nombre}`;
  $('[data-migas-nombre]')!.textContent = t.nombre;
  const hero = $('[data-ficha-hero]')!;
  hero.className = hero.className.replace(/tema-\w+/, `tema-${t.tema}`);
  $('[data-ficha-hero-in]')!.innerHTML = String(heroTorneo(t, ahora));
  const cuerpo = $('[data-ficha-cuerpo]')!;
  const scrollCuadro = $('.cuadro-pista', cuerpo)?.scrollLeft ?? 0;
  cuerpo.innerHTML = String(fichaCuerpo(t, e.jugadores, ahora));
  if (pestanaActiva) activar(pestanaActiva, false);
  const pista = $('.cuadro-pista', cuerpo);
  if (pista) pista.scrollLeft = scrollCuadro;
  iniciarCuadros(cuerpo);
  iniciarCuentas(cuerpo);
  if (nuevoJugador) {
    $(`.participante[data-jugador="${nuevoJugador}"]`, cuerpo)?.classList.add('participante--nuevo');
  }
}

function activar(nombre: string, foco = true) {
  pestanaActiva = nombre;
  for (const b of $$<HTMLButtonElement>('[data-pestana]')) {
    const on = b.dataset.pestana === nombre;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && foco) b.focus();
  }
  for (const p of $$('[role="tabpanel"]', raiz)) p.hidden = p.id !== `panel-${nombre}`;
}

raiz.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const tab = t.closest<HTMLElement>('[data-pestana]');
  if (tab) activar(tab.dataset.pestana!);
  const ir = t.closest<HTMLElement>('[data-ir-pestana]');
  if (ir) {
    ev.preventDefault();
    activar(ir.dataset.irPestana!);
    $('.pestanas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (t.closest('[data-inscribirme]')) abrirInscripcion(!!t.closest('[data-espera]'));
  if (t.closest('[data-ics]')) ics();
});
raiz.addEventListener('keydown', (ev) => {
  const tab = (ev.target as HTMLElement).closest<HTMLElement>('[data-pestana]');
  if (!tab || !['ArrowRight', 'ArrowLeft'].includes(ev.key)) return;
  const tabs = $$<HTMLElement>('[data-pestana]');
  const i = tabs.indexOf(tab) + (ev.key === 'ArrowRight' ? 1 : -1);
  activar(tabs[(i + tabs.length) % tabs.length].dataset.pestana!);
});

function ics() {
  const t = torneo();
  if (t) descargarIcs(`${t.nombre} · ${tienda.nombre}`, t.inicio, t.duracionMin, `${tienda.nombre}, ${tienda.direccion.calle}, ${tienda.direccion.ciudad}`, t.resumen, location.href);
}

/* ---------- Inscripción en tres pasos ---------- */
const dlg = $<HTMLDialogElement>('#dlg-inscripcion')!;
const form = $<HTMLFormElement>('#form-ins')!;
let enEspera = false;

function paso(n: 1 | 2 | 3) {
  for (const p of $$('[data-paso]', dlg)) p.hidden = p.dataset.paso !== String(n);
  $$('.pasos-ins span', dlg).forEach((s, i) => s.classList.toggle('hecho', i < n));
  $('[data-ins-paso-texto]', dlg)!.textContent = `Paso ${n} de 3 · ${['Condiciones', 'Tus datos', 'Confirmación'][n - 1]}`;
  if (n === 2) $<HTMLInputElement>('#ins-nombre')?.focus();
}

function abrirInscripcion(espera: boolean) {
  const t = torneo();
  if (!t) return;
  const est = T.estadoTorneo(t, new Date());
  if (!T.admiteInscripcion(est) && !(espera && T.admiteEspera(est))) {
    toast(`No se puede: ${T.ETIQUETA_ESTADO[est].toLowerCase()}.`, 'error');
    return;
  }
  enEspera = espera;
  const p = T.plazas(t);
  $('[data-ins-titulo]', dlg)!.textContent = espera ? `Lista de espera · ${t.nombre}` : t.nombre;
  $('[data-ins-resumen]', dlg)!.innerHTML = [
    ['Fecha', fechaLarga(t.inicio)], ['Hora', `${hora(t.inicio)} h (llega 30 min antes)`], ['Formato', `${T.ETIQUETA_FORMATO[t.formato]} · ${t.modalidad}`],
    ['Inscripción', `${T.precioTexto(t.precio)}${t.precio ? ', se paga en tienda' : ''}`], [espera ? 'Lista de espera' : 'Plazas libres', espera ? `${t.listaEspera.length} por delante` : `${p.libres} de ${t.capacidad}`],
  ].map(([a, b]) => `<li><span>${a}</span><strong>${esc(b)}</strong></li>`).join('');
  $('[data-ins-normas]', dlg)!.innerHTML = t.reglas.map((r) => `<li>${icono('check')}<span>${esc(r)}</span></li>`).join('');
  $<HTMLInputElement>('[name="aceptaNormas"]', dlg)!.checked = false;
  $('[data-error-paso1]', dlg)!.hidden = true;
  $('[data-ins-enviar]', dlg)!.textContent = espera ? 'Apuntarme a la lista' : 'Enviar inscripción';
  mostrarErrores(form, {});
  paso(1);
  abrir('dlg-inscripcion');
}

$('[data-siguiente]', dlg)!.addEventListener('click', () => {
  const ok = $<HTMLInputElement>('[name="aceptaNormas"]', dlg)!.checked;
  const err = $('[data-error-paso1]', dlg)!;
  err.hidden = ok;
  err.textContent = ok ? '' : 'Marca la casilla para continuar.';
  if (ok) paso(2);
});
$('[data-atras]', dlg)!.addEventListener('click', () => paso(1));

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
  const datos: T.DatosInscripcion = {
    nombre: d.nombre ?? '', nick: d.nick ?? '', contacto: d.contacto ?? '', division: (d.division ?? '') as T.DatosInscripcion['division'],
    idOficial: d.idOficial, aceptaNormas: $<HTMLInputElement>('[name="aceptaNormas"]', dlg)!.checked,
  };
  const r = mutar((e) => {
    const t = e.torneos.find((x) => x.id === id);
    if (!t) return { ok: false as const, errores: { general: 'El torneo ya no existe.' } };
    return T.inscribir(t, e.jugadores, datos, new Date(), { listaEspera: enEspera, origen: 'web', nuevoId: () => nuevoId('w') });
  });
  if (!r.ok) {
    mostrarErrores(form, r.errores as Record<string, string>);
    if (r.errores.aceptaNormas) paso(1);
    return;
  }
  const t = torneo()!;
  const p = T.plazas(t);
  nuevoJugador = r.jugador.id;
  $('[data-exito-titulo]', dlg)!.textContent = r.tipo === 'espera' ? '¡Estás en la lista de espera!' : '¡Solicitud enviada!';
  $('[data-exito-texto]', dlg)!.innerHTML =
    r.tipo === 'espera'
      ? `Eres el <strong>nº ${r.posicionEspera}</strong> de la lista de espera como <strong>${esc(r.jugador.nick)}</strong>. Si se libera una plaza, pasas automáticamente.`
      : `Apareces como <strong>${esc(r.jugador.nick)}</strong>, inscrito nº <strong>${p.ocupadas}</strong>. La plaza queda <strong>pendiente de confirmar</strong> por la tienda.`;
  $('[data-exito-plazas]', dlg)!.innerHTML = r.tipo === 'espera' ? '' : String(barraPlazas(t));
  $<HTMLAnchorElement>('[data-exito-wa]', dlg)!.href = enlaceWhatsApp(
    `Hola, me he inscrito en «${t.nombre}» (${fechaLarga(t.inicio)}, ${hora(t.inicio)}) como ${r.jugador.nick}${r.tipo === 'espera' ? ' en lista de espera' : ''}. ¿Me confirmáis la plaza?`,
  );
  form.reset();
  paso(3);
  toast(r.tipo === 'espera' ? 'Apuntado a la lista de espera' : `Inscrito: ${p.ocupadas} de ${t.capacidad} plazas ocupadas`);
});
dlg.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  if (t.closest('[data-ver-participantes]')) {
    dlg.close();
    activar('participantes');
    $('.pestanas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (t.closest('[data-ics]')) ics();
});

/* Torneos creados en el panel: si alguien llega con la ruta estática equivocada, lo llevamos a la buena */
const inicial = torneo();
if (inicial?.creadoEnPanel && raiz.dataset.fichaTorneo && location.pathname !== '/torneos/evento/') location.replace(rutaTorneo(inicial));

pintar();
if (location.hash === '#inscripcion') {
  const t = torneo();
  if (t && (T.admiteInscripcion(T.estadoTorneo(t, new Date())) || T.admiteEspera(T.estadoTorneo(t, new Date())))) {
    $('#inscripcion')?.scrollIntoView({ block: 'center' });
  }
}
if (location.hash === '#competicion') activar('competicion', false);
suscribir(pintar);
setInterval(() => {
  // El estado cambia solo cuando el torneo empieza (cierra inscripciones): repintar cada minuto basta
  if (!dlg.open) pintar();
}, 60000);
