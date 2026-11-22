/* Comportamiento común a todas las páginas: menús, diálogos, favoritos, reservas,
   avisos de stock, búsqueda rápida y animaciones de entrada. */
import { $, $$, abrir, contactoValido, mostrarErrores, normalizar, toast } from './ui.ts';
import { productosEstado, favoritos, alertas, alCambiar, almacen, guardar, guardado } from '../lib/estado-ligero.ts';
import type { Torneo } from '../lib/tipos.ts';
import { PRODUCTOS, productoPorId } from '../data/catalogo.ts';
import { accionProducto, fichaResumen, metaProducto, textoStock, urlProducto } from '../lib/vistas/producto.ts';
import { euros, esc } from '../lib/html.ts';
import { icono } from '../lib/iconos.ts';
import { enlaceWhatsApp, tienda } from '../data/tienda.ts';
import { estadoTorneo, ETIQUETA_ESTADO } from '../lib/torneo.ts';
import { fechaCorta, partes } from '../lib/fechas.ts';
import { estadoApertura } from '../lib/horario.ts';
import { rutaTorneo } from '../lib/vistas/torneo.ts';

/* ---------- Diálogos ---------- */
document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const abre = t.closest<HTMLElement>('[data-abrir]');
  if (abre) {
    abrir(abre.dataset.abrir!);
    return;
  }
  if (t.closest('[data-cerrar]')) t.closest('dialog')?.close();
  if (t instanceof HTMLDialogElement) {
    const r = t.getBoundingClientRect();
    const e = ev as MouseEvent;
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) t.close();
  }
});
document.addEventListener('keydown', (ev) => {
  const escribiendo = /INPUT|TEXTAREA|SELECT/.test((ev.target as HTMLElement).tagName);
  if ((ev.key === '/' && !escribiendo) || (ev.key.toLowerCase() === 'k' && (ev.metaKey || ev.ctrlKey))) {
    ev.preventDefault();
    abrir('dlg-buscar');
  }
});

/* ---------- Animaciones de entrada ---------- */
const revelar = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) if (e.isIntersecting) {
      e.target.classList.add('visible');
      revelar.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
);
export function observarRevelados(raiz: ParentNode = document) {
  for (const el of $$('[data-revela]:not(.visible)', raiz)) revelar.observe(el);
}
observarRevelados();

/* ---------- WhatsApp flotante: se esconde al bajar, vuelve al subir ---------- */
const flotante = $('.wa-flotante');
let ultimoY = scrollY;
addEventListener('scroll', () => {
  if (!flotante) return;
  const y = scrollY;
  flotante.classList.toggle('oculto', y > ultimoY && y > 400);
  ultimoY = y;
}, { passive: true });

/* ---------- Productos: precio, stock y favoritos según el estado guardado ---------- */
function pintarProductos(forzar = false) {
  if (!forzar && !guardado()) return;
  const e = { productos: productosEstado(), favoritos: favoritos() };
  for (const el of $$('[data-precio]')) {
    const s = e.productos[el.dataset.precio!];
    if (s) el.textContent = euros(s.precio);
  }
  for (const el of $$('[data-stock]')) {
    const s = e.productos[el.dataset.stock!];
    if (!s) continue;
    const st = textoStock(s.stock);
    el.textContent = st.texto;
    el.className = el.className.replace(/stock--\w+/, `stock--${st.clase}`);
  }
  for (const el of $$('[data-accion]')) {
    const p = productoPorId.get(el.dataset.accion!);
    const s = e.productos[el.dataset.accion!];
    if (p && s) el.innerHTML = String(accionProducto(p, s.stock));
  }
  for (const b of $$('[data-favorito]')) b.setAttribute('aria-pressed', String(e.favoritos.includes(b.dataset.favorito!)));
  const c = $('[data-contador-favoritos]');
  if (c) {
    c.textContent = String(e.favoritos.length);
    c.hidden = e.favoritos.length === 0;
  }
}
pintarProductos();
alCambiar(() => pintarProductos(true));
export { pintarProductos };

document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const fav = t.closest<HTMLElement>('[data-favorito]');
  if (fav) {
    ev.preventDefault();
    const id = fav.dataset.favorito!;
    const ahora = !favoritos().includes(id);
    for (const b of $$(`[data-favorito="${id}"]`)) b.setAttribute('aria-pressed', String(ahora));
    guardar((m) =>
      m.mutarLigero((e) => {
        const i = e.favoritos.indexOf(id);
        if (ahora && i < 0) e.favoritos.push(id);
        if (!ahora && i >= 0) e.favoritos.splice(i, 1);
      }),
    );
    fav.classList.remove('late');
    void fav.offsetWidth;
    if (ahora) fav.classList.add('late');
    toast(ahora ? 'Guardado en favoritos' : 'Quitado de favoritos');
  }
  const res = t.closest<HTMLElement>('[data-reservar]');
  if (res) abrirReserva(res.dataset.reservar!);
  const av = t.closest<HTMLElement>('[data-avisar]');
  if (av) abrirAviso(av.dataset.avisar!);
});

/* Favoritos (panel lateral) */
const dlgFav = $<HTMLDialogElement>('#dlg-favoritos');
dlgFav?.addEventListener('abierto', pintarFavoritos);
alCambiar(() => dlgFav?.open && pintarFavoritos());
function pintarFavoritos() {
  const cont = $('#lista-favoritos');
  if (!cont) return;
  const e = { productos: productosEstado(), favoritos: favoritos() };
  const items = e.favoritos.map((id) => productoPorId.get(id)).filter((p) => !!p);
  if (!items.length) {
    cont.innerHTML = `<div class="vacio">${icono('corazon')}<p>Aún no has guardado nada. Pulsa el corazón de cualquier producto para tenerlo aquí la próxima vez.</p><a class="btn btn--acento" href="/catalogo/">Ir al catálogo</a></div>`;
    return;
  }
  const total = items.reduce((s, p) => s + e.productos[p.id].precio, 0);
  const texto = `Hola, me interesan estos productos de vuestra web:\n${items.map((p) => `· ${p.nombre} (${euros(e.productos[p.id].precio)})`).join('\n')}\n¿Están disponibles?`;
  cont.innerHTML = `<ul class="lista-fav" role="list">${items
    .map((p) => `<li><a href="${urlProducto(p)}">${String(fichaResumen(p, e.productos[p.id]))}</a><button class="btn-icono" type="button" data-favorito="${p.id}" aria-label="Quitar ${esc(p.nombre)} de favoritos">${icono('papelera')}</button></li>`)
    .join('')}</ul>
    <p class="fila" style="justify-content:space-between"><span>Total orientativo</span><strong class="cifra">${euros(total)}</strong></p>
    <a class="btn btn--wa btn--bloque" target="_blank" rel="noopener" href="${enlaceWhatsApp(texto)}">${icono('whatsapp')}Preguntar por todos</a>`;
}

/* ---------- Reservas ---------- */
let reservando = '';
function abrirReserva(id: string) {
  const p = productoPorId.get(id);
  if (!p) return;
  reservando = id;
  void almacen(); // se precarga mientras se rellena el formulario
  const e = { productos: productosEstado() };
  $('#res-producto')!.innerHTML = String(fichaResumen(p, e.productos[id]));
  const cant = $<HTMLInputElement>('#res-cantidad')!;
  cant.max = String(e.productos[id].stock);
  cant.value = '1';
  mostrarErrores($('#form-reserva')!, {});
  abrir('dlg-reserva');
}
$('#form-reserva')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = ev.currentTarget as HTMLFormElement;
  const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
  const e = { productos: productosEstado() };
  const stock = e.productos[reservando]?.stock ?? 0;
  const cantidad = Math.floor(+d.cantidad);
  const errores = {
    nombre: d.nombre.trim().length < 2 ? 'Escribe tu nombre.' : undefined,
    contacto: !contactoValido(d.contacto) ? 'Escribe un teléfono o un email válido.' : undefined,
    cantidad: !(cantidad >= 1) ? 'Indica al menos 1 unidad.' : cantidad > stock ? `Solo quedan ${stock}.` : undefined,
  };
  if (!mostrarErrores(f, errores)) return;
  const p = productoPorId.get(reservando)!;
  const reserva = { productoId: p.id, cantidad, nombre: d.nombre.trim(), contacto: d.contacto.trim(), recogida: d.recogida, nota: d.nota.trim(), fecha: new Date().toISOString(), estado: 'pendiente' as const };
  guardar((m) => m.mutar((x) => x.reservas.unshift({ id: m.nuevoId('r'), ...reserva })));
  const msg = `Hola, soy ${d.nombre.trim()}. Me gustaría reservar:\n· ${p.nombre}${p.numero ? ` (${p.numero})` : ''} × ${cantidad} — ${euros(e.productos[p.id].precio)}\nPasaría: ${d.recogida.toLowerCase()}.${d.nota.trim() ? `\nNota: ${d.nota.trim()}` : ''}`;
  window.open(enlaceWhatsApp(msg), '_blank', 'noopener');
  f.reset();
  f.closest('dialog')?.close();
  toast('Reserva preparada: confírmala en WhatsApp');
});

/* ---------- Avisos de disponibilidad ---------- */
let avisando = '';
function abrirAviso(id: string) {
  const p = productoPorId.get(id);
  if (!p) return;
  avisando = id;
  void almacen();
  $('#av-producto')!.innerHTML = String(fichaResumen(p, productosEstado()[id]));
  mostrarErrores($('#form-aviso')!, {});
  abrir('dlg-aviso');
}
$('#form-aviso')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = ev.currentTarget as HTMLFormElement;
  const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
  const errores = {
    nombre: d.nombre.trim().length < 2 ? 'Escribe tu nombre.' : undefined,
    contacto: !contactoValido(d.contacto) ? 'Escribe un teléfono o un email válido.' : undefined,
  };
  if (!mostrarErrores(f, errores)) return;
  const repetido = alertas().some((a) => a.productoId === avisando && a.contacto.trim().toLowerCase() === d.contacto.trim().toLowerCase() && !a.avisado);
  if (repetido) {
    mostrarErrores(f, { contacto: 'Ya nos pediste aviso para este producto con este contacto.' });
    return;
  }
  const alerta = { productoId: avisando, nombre: d.nombre.trim(), contacto: d.contacto.trim(), fecha: new Date().toISOString(), avisado: false };
  guardar((m) => m.mutar((x) => x.alertas.unshift({ id: m.nuevoId('a'), ...alerta })));
  f.reset();
  f.closest('dialog')?.close();
  toast('Hecho: la tienda te avisará cuando vuelva');
});

/* ---------- Búsqueda rápida ---------- */
const entrada = $<HTMLInputElement>('#buscar-rapido');
let torneosBusqueda: Torneo[] = [];
const zona = $('#resultados-rapidos');
const PAGINAS = [
  ['Torneos', '/torneos/'], ['Clasificación de jugadores', '/torneos/clasificacion/'], ['Historial de torneos', '/torneos/historial/'],
  ['Agenda de eventos', '/agenda/'], ['Vende o tasa tu colección', '/vende-tu-coleccion/'], ['Conoce la tienda', '/tienda/'], ['Horario y contacto', '/contacto/'],
];
function buscarRapido() {
  if (!zona || !entrada) return;
  const q = normalizar(entrada.value);
  const e = { productos: productosEstado(), torneos: torneosBusqueda };
  const ahora = new Date();
  if (!q) {
    const sugeridos = PRODUCTOS.filter((p) => p.etiquetas.includes('mas-buscado')).slice(0, 4);
    zona.innerHTML = `<p class="etiqueta">Lo más buscado</p>${lista(sugeridos.map((p) => [p.nombre, metaProducto(p), urlProducto(p)]))}`;
    return;
  }
  const palabras = q.split(/\s+/);
  const coincide = (txt: string) => palabras.every((w) => normalizar(txt).includes(w));
  const prods = PRODUCTOS.filter((p) => coincide(`${p.nombre} ${metaProducto(p)} ${p.numero ?? ''}`)).slice(0, 6);
  const torneos = e.torneos
    .filter((t) => coincide(`${t.nombre} ${t.modalidad} torneo`) && (!t.finalizado || Date.parse(t.inicio) > ahora.getTime() - 90 * 864e5))
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
    .slice(0, 4);
  const paginas = PAGINAS.filter(([n]) => coincide(n));
  if (!prods.length && !torneos.length && !paginas.length) {
    zona.innerHTML = `<div class="vacio">${icono('buscar')}<p>No encontramos «${esc(entrada.value)}». Pregúntanos: puede que lo tengamos fuera de la web.</p><a class="btn btn--wa" target="_blank" rel="noopener" href="${enlaceWhatsApp(`Hola, ¿tenéis ${entrada.value}?`)}">${icono('whatsapp')}Preguntar por WhatsApp</a></div>`;
    return;
  }
  zona.innerHTML = [
    prods.length && `<p class="etiqueta">Productos</p>${lista(prods.map((p) => [p.nombre, `${metaProducto(p)} · ${euros(e.productos[p.id].precio)} · ${textoStock(e.productos[p.id].stock).texto}`, urlProducto(p)]))}`,
    torneos.length && `<p class="etiqueta">Torneos</p>${lista(torneos.map((t) => [t.nombre, `${fechaCorta(t.inicio)} · ${ETIQUETA_ESTADO[estadoTorneo(t, ahora)]}`, rutaTorneo(t)]))}`,
    paginas.length && `<p class="etiqueta">Páginas</p>${lista(paginas.map(([n, u]) => [n, tienda.nombre, u]))}`,
  ].filter(Boolean).join('');
}
const lista = (items: string[][]) =>
  `<ul class="resultados" role="list">${items.map(([t, s, u]) => `<li><a href="${u}"><span><strong>${esc(t)}</strong><small>${esc(s)}</small></span>${icono('flecha')}</a></li>`).join('')}</ul>`;
entrada?.addEventListener('input', buscarRapido);
$('#dlg-buscar')?.addEventListener('abierto', () => {
  buscarRapido();
  entrada?.focus();
  almacen().then((m) => {
    torneosBusqueda = m.cargar().torneos;
    buscarRapido();
  });
});

/* ---------- Horario: día de hoy y abierto/cerrado en directo ---------- */
function pintarHorario() {
  const hoy = partes(new Date()).dow;
  for (const tr of $$('[data-dia-semana]')) tr.classList.toggle('hoy', +tr.dataset.diaSemana! === hoy);
  const e = estadoApertura(tienda.horario);
  for (const el of $$('[data-estado-tienda]')) el.textContent = e.texto;
  for (const el of $$('[data-punto-tienda]')) el.classList.toggle('abierto', e.abierto);
}
pintarHorario();
setInterval(pintarHorario, 60000);
