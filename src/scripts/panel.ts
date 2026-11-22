/* Panel del propietario (demo): misma fuente de datos que la web pública.
   Todo cambio pasa por mutar(), que guarda y avisa a las páginas abiertas. */
import { $, $$, abrir, mostrarErrores, toast } from './ui.ts';
import { cargar, mutar, nuevoId, restablecer, suscribir } from '../lib/almacen.ts';
import { PRODUCTOS, CATEGORIAS, productoPorId } from '../data/catalogo.ts';
import { textoStock, urlProducto, metaProducto } from '../lib/vistas/producto.ts';
import { cuadroHTML, tablaSuiza, rondasSuizas, pillEstado, rutaTorneo, numTorneo } from '../lib/vistas/torneo.ts';
import * as T from '../lib/torneo.ts';
import * as C from '../lib/cuadro.ts';
import { esc, euros } from '../lib/html.ts';
import { icono } from '../lib/iconos.ts';
import { claveDia, desdeZona, fechaCorta, fechaLarga, hora, partes } from '../lib/fechas.ts';
import { iniciarCuadros } from './efectos.ts';
import { tienda } from '../data/tienda.ts';
import type { EstadoDemo, Partida, Torneo } from '../lib/tipos.ts';

const cont = $('#panel-contenido')!;
let ruta = '';
const ui = { q: '', cat: '', soloVigilar: false, reservas: 'pendiente', consultas: 'mensajes' };
const nick = (e: EstadoDemo) => (id: string) => e.jugadores[id]?.nick ?? id;
const cuando = (iso: string) => `${fechaCorta(iso)} · ${hora(iso)}`;

function enlaceContacto(contacto: string, texto: string) {
  if (contacto.includes('@')) return `mailto:${encodeURIComponent(contacto)}?subject=${encodeURIComponent(tienda.nombre)}&body=${encodeURIComponent(texto)}`;
  let tel = contacto.replace(/\D/g, '');
  if (tel.length === 9) tel = `34${tel}`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}

/* ---------- Navegación ---------- */
function irA() {
  ruta = location.hash.slice(1) || 'resumen';
  pintar();
  cont.scrollIntoView({ block: 'start' });
  window.scrollTo({ top: 0 });
}
addEventListener('hashchange', irA);

function contadores(e: EstadoDemo) {
  const n = {
    productos: PRODUCTOS.filter((p) => e.productos[p.id].stock <= 1).length,
    reservas: e.reservas.filter((r) => r.estado === 'pendiente').length,
    consultas: e.consultas.filter((c) => !c.atendida).length + e.ventas.filter((v) => !v.atendida).length + e.alertas.filter((a) => !a.avisado).length,
    torneos: e.torneos.filter((t) => !t.finalizado).reduce((s, t) => s + T.plazas(t).pendientes, 0),
  };
  for (const [k, v] of Object.entries(n)) {
    const el = $(`[data-num="${k}"]`);
    if (el) {
      el.textContent = v ? String(v) : '';
      el.hidden = !v;
    }
  }
  return n;
}

function pintar() {
  const e = cargar();
  const seccion = ruta.split('/')[0];
  for (const a of $$('[data-seccion]')) a.setAttribute('aria-current', a.dataset.seccion === (seccion === 'torneo' ? 'torneos' : seccion) ? 'page' : 'false');
  const n = contadores(e);
  const foco = (document.activeElement as HTMLElement | null)?.dataset?.foco;
  if (seccion === 'productos') cont.innerHTML = vistaProductos(e);
  else if (seccion === 'reservas') cont.innerHTML = vistaReservas(e);
  else if (seccion === 'consultas') cont.innerHTML = vistaConsultas(e);
  else if (seccion === 'torneos') cont.innerHTML = vistaTorneos(e);
  else if (seccion === 'torneo') cont.innerHTML = vistaGestion(e, decodeURIComponent(ruta.split('/')[1] ?? ''));
  else cont.innerHTML = vistaResumen(e, n);
  iniciarCuadros(cont);
  if (foco) {
    const el = $<HTMLInputElement>(`[data-foco="${foco}"]`);
    el?.focus();
    if (el && el.type === 'search') el.setSelectionRange(el.value.length, el.value.length);
  }
}

/* ---------- Resumen ---------- */
function vistaResumen(e: EstadoDemo, n: ReturnType<typeof contadores>) {
  const ahora = new Date();
  const proximos = e.torneos.filter((t) => !t.finalizado && Date.parse(t.inicio) > ahora.getTime()).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)).slice(0, 5);
  const vigilar = PRODUCTOS.filter((p) => e.productos[p.id].stock <= 2).sort((a, b) => e.productos[a.id].stock - e.productos[b.id].stock);
  const feed = [
    ...e.reservas.map((r) => ({ f: r.fecha, ico: 'bolsa', t: `Reserva: ${productoPorId.get(r.productoId)?.nombre} × ${r.cantidad}`, s: `${r.nombre} · ${r.estado}`, url: '#reservas' })),
    ...e.consultas.map((c) => ({ f: c.fecha, ico: 'mail', t: `Mensaje: ${c.motivo}`, s: c.nombre, url: '#consultas' })),
    ...e.ventas.map((v) => ({ f: v.fecha, ico: 'intercambio', t: `Quiere ${v.operacion}: ${v.material}`, s: `${v.nombre} · ${v.fotos} fotos`, url: '#consultas' })),
    ...e.alertas.map((a) => ({ f: a.fecha, ico: 'alerta', t: `Aviso de stock: ${productoPorId.get(a.productoId)?.nombre}`, s: a.nombre, url: '#consultas' })),
    ...e.torneos.flatMap((t) => [...t.inscripciones, ...t.listaEspera].filter((i) => i.origen === 'web').map((i) => ({ f: i.fecha, ico: 'trofeo', t: `Inscripción: ${t.nombre}`, s: `${e.jugadores[i.jugadorId]?.nick} · ${i.estado}`, url: `#torneo/${t.id}` }))),
  ].sort((a, b) => Date.parse(b.f) - Date.parse(a.f)).slice(0, 8);
  const h = partes(ahora).h;
  return `<div class="panel-cab"><div><p class="etiqueta">${fechaLarga(ahora.toISOString())}</p><h1 class="h1">${h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'}.</h1></div>
    <a class="btn btn--acento" href="#torneos" data-nuevo-torneo>${icono('mas')}Crear torneo</a></div>
  <div class="kpis">
    <a class="kpi ${n.reservas ? 'kpi--aviso' : ''}" href="#reservas"><strong>${n.reservas}</strong><span>reservas por confirmar</span></a>
    <a class="kpi ${n.consultas ? 'kpi--aviso' : ''}" href="#consultas"><strong>${n.consultas}</strong><span>consultas sin atender</span></a>
    <a class="kpi ${n.torneos ? 'kpi--aviso' : ''}" href="#torneos"><strong>${n.torneos}</strong><span>inscripciones por confirmar</span></a>
    <a class="kpi ${vigilar.some((p) => e.productos[p.id].stock === 0) ? 'kpi--alerta' : ''}" href="#productos"><strong>${PRODUCTOS.filter((p) => e.productos[p.id].stock === 0).length}</strong><span>productos agotados</span></a>
    <a class="kpi" href="#consultas"><strong>${e.alertas.filter((a) => !a.avisado).length}</strong><span>clientes esperan aviso de stock</span></a>
  </div>
  <div class="rejilla-panel">
    <section class="caja"><div class="caja-cab"><h2>Últimas solicitudes</h2></div>
      ${feed.length ? `<ul class="feed" role="list">${feed.map((x) => `<li><span class="ico">${icono(x.ico)}</span><a href="${x.url}" style="text-decoration:none;flex:1"><strong>${esc(x.t)}</strong><small>${esc(x.s)} · ${cuando(x.f)}</small></a></li>`).join('')}</ul>`
        : `<div class="vacio">${icono('bolsa')}<p>Todavía no hay solicitudes. Prueba desde la web: reserva un producto, inscríbete en un torneo o envía un mensaje. Aparecerá aquí al momento.</p><a class="btn btn--fantasma" href="/catalogo/" target="_blank">Abrir la web en otra pestaña</a></div>`}
    </section>
    <div class="pila" style="--pila:18px">
      <section class="caja"><div class="caja-cab"><h2>Próximos torneos</h2><a class="enlace-flecha" href="#torneos">Gestionar ${icono('flecha')}</a></div>
        <ul class="feed" role="list">${proximos.map((t) => barraTorneo(t, ahora)).join('')}</ul></section>
      <section class="caja"><div class="caja-cab"><h2>Stock que vigilar</h2><a class="enlace-flecha" href="#productos">Ver productos ${icono('flecha')}</a></div>
        <ul class="feed" role="list">${vigilar.slice(0, 6).map((p) => { const s = e.productos[p.id]; const st = textoStock(s.stock); const al = e.alertas.filter((a) => a.productoId === p.id && !a.avisado).length; return `<li><span class="ico">${icono('cartas')}</span><span style="flex:1"><strong>${esc(p.nombre)}</strong><small>${esc(metaProducto(p))}${al ? ` · ${al} esperan aviso` : ''}</small></span><span class="estado-mini estado-mini--${st.clase}">${st.texto}</span></li>`; }).join('')}</ul></section>
    </div>
  </div>`;
}

function barraTorneo(t: Torneo, ahora: Date) {
  const p = T.plazas(t);
  const clase = p.libres === 0 ? 'llena' : p.libres <= T.umbralUltimas(t.capacidad) ? 'casi' : '';
  return `<li><span class="ico">${icono('trofeo')}</span><a href="#torneo/${t.id}" style="flex:1;text-decoration:none"><strong>${esc(t.nombre)}</strong><small>${cuando(t.inicio)} · ${p.ocupadas}/${t.capacidad}${p.pendientes ? ` · ${p.pendientes} por confirmar` : ''}</small>
    <div class="barra-mini ${clase}" style="margin-top:6px"><span style="width:${Math.round(p.pct * 100)}%"></span></div></a>${pillEstado(T.estadoTorneo(t, ahora))}</li>`;
}

/* ---------- Productos ---------- */
function vistaProductos(e: EstadoDemo) {
  const q = ui.q.toLowerCase();
  const lista = PRODUCTOS.filter((p) => (!ui.cat || p.categoria === ui.cat) && (!q || `${p.nombre} ${p.numero ?? ''} ${metaProducto(p)}`.toLowerCase().includes(q)) && (!ui.soloVigilar || e.productos[p.id].stock <= 2));
  return `<div class="panel-cab"><div><p class="etiqueta">${PRODUCTOS.length} productos</p><h1 class="h1">Productos</h1><p class="entradilla">Cambia precios y stock: la web se actualiza al instante. Los productos sin stock muestran «Avísame» en lugar de «Reservar».</p></div></div>
  <section class="caja">
    <div class="fila">
      <label class="buscador" style="flex:1 1 240px"><span class="solo-lector">Buscar producto</span>${icono('buscar')}<input class="entrada" type="search" placeholder="Buscar producto…" value="${esc(ui.q)}" data-p-q data-foco="p-q" /></label>
      <label class="solo-lector" for="p-cat">Categoría</label>
      <select class="entrada" id="p-cat" style="width:auto" data-p-cat data-foco="p-cat"><option value="">Todas las categorías</option>${CATEGORIAS.map((c) => `<option value="${c.id}" ${ui.cat === c.id ? 'selected' : ''}>${c.plural}</option>`).join('')}</select>
      <label class="casilla" style="align-items:center"><input type="checkbox" data-p-vigilar ${ui.soloVigilar ? 'checked' : ''} data-foco="p-vig" />Solo poco stock o agotados</label>
    </div>
    <div class="envoltura-tabla"><table class="tabla-panel"><caption class="solo-lector">Productos</caption>
      <thead><tr><th scope="col">Producto</th><th scope="col">Precio (€)</th><th scope="col">Stock</th><th scope="col">Estado</th><th scope="col">Avisos</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead>
      <tbody>${lista.map((p) => {
        const s = e.productos[p.id];
        const st = textoStock(s.stock);
        const al = e.alertas.filter((a) => a.productoId === p.id && !a.avisado).length;
        return `<tr><td><div class="prod-celda"><img src="/arte/${p.id}.svg" width="40" height="50" alt="" loading="lazy" /><span><strong>${esc(p.nombre)}</strong><small>${esc(metaProducto(p))}${p.numero ? ` · ${esc(p.numero)}` : ''}</small></span></div></td>
          <td><label class="solo-lector" for="pr-${p.id}">Precio de ${esc(p.nombre)}</label><input class="entrada-mini" id="pr-${p.id}" type="number" min="0" step="0.05" value="${s.precio}" data-precio-input="${p.id}" data-foco="pr-${p.id}" /></td>
          <td><div class="contador-stock"><button type="button" data-stock-delta="-1" data-id="${p.id}" aria-label="Quitar una unidad de ${esc(p.nombre)}" data-foco="sm-${p.id}">${icono('menos')}</button>
            <label class="solo-lector" for="st-${p.id}">Stock de ${esc(p.nombre)}</label><input id="st-${p.id}" type="number" min="0" step="1" value="${s.stock}" data-stock-input="${p.id}" data-foco="st-${p.id}" />
            <button type="button" data-stock-delta="1" data-id="${p.id}" aria-label="Añadir una unidad de ${esc(p.nombre)}" data-foco="sp-${p.id}">${icono('mas')}</button></div></td>
          <td><span class="estado-mini estado-mini--${st.clase}">${st.texto}</span></td>
          <td>${al ? `<a href="#consultas" data-ir-avisos>${al} ${al === 1 ? 'cliente' : 'clientes'}</a>` : '<span style="color:var(--gris)">—</span>'}</td>
          <td><div class="fila" style="--fila:6px;flex-wrap:nowrap">${s.stock > 0 ? `<button class="btn btn--suave btn--peq" type="button" data-agotar="${p.id}" data-foco="ag-${p.id}">Marcar agotado</button>` : `<button class="btn btn--suave btn--peq" type="button" data-reponer="${p.id}" data-foco="re-${p.id}">Reponer 5</button>`}
            <a class="btn-icono" href="${urlProducto(p)}" target="_blank" aria-label="Ver ${esc(p.nombre)} en la web">${icono('externo')}</a></div></td></tr>`;
      }).join('')}</tbody></table></div>
    ${lista.length ? '' : '<p class="vacio">Ningún producto coincide con la búsqueda.</p>'}
  </section>`;
}

function fijarStock(id: string, valor: number) {
  if (!Number.isInteger(valor) || valor < 0) return toast('El stock debe ser un número entero, 0 o mayor.', 'error');
  const antes = cargar().productos[id].stock;
  mutar((e) => (e.productos[id].stock = valor));
  const esperando = cargar().alertas.filter((a) => a.productoId === id && !a.avisado).length;
  if (antes === 0 && valor > 0 && esperando) toast(`Repuesto. ${esperando} ${esperando === 1 ? 'cliente espera' : 'clientes esperan'} aviso: míralo en Consultas.`);
  else toast(`Stock de ${productoPorId.get(id)?.nombre}: ${valor}`);
}

/* ---------- Reservas ---------- */
function vistaReservas(e: EstadoDemo) {
  const estados = ['pendiente', 'confirmada', 'entregada', 'cancelada'] as const;
  const lista = e.reservas.filter((r) => ui.reservas === 'todas' || r.estado === ui.reservas);
  return `<div class="panel-cab"><div><p class="etiqueta">${e.reservas.length} reservas en total</p><h1 class="h1">Reservas</h1><p class="entradilla">Al confirmar una reserva se descuenta del stock; si la cancelas, vuelve.</p></div></div>
  <div class="pestanas-panel">${[...estados, 'todas'].map((k) => `<button class="chip" type="button" data-tab-res="${k}" aria-pressed="${ui.reservas === k}">${k[0].toUpperCase() + k.slice(1)}${k === 'todas' ? '' : `s <span class="num">${e.reservas.filter((r) => r.estado === k).length}</span>`}</button>`).join('')}</div>
  <div class="lista-solicitudes">${lista.length ? lista.map((r) => {
    const p = productoPorId.get(r.productoId)!;
    const s = e.productos[r.productoId];
    return `<article class="tarjeta-solicitud"><header><strong>${esc(p.nombre)} × ${r.cantidad} · ${euros(s.precio * r.cantidad)}</strong><span class="estado-mini estado-mini--${r.estado}">${r.estado}</span></header>
      <p>${esc(r.nombre)} · ${esc(r.contacto)} · Recogida: ${esc(r.recogida.toLowerCase())}${r.nota ? ` · «${esc(r.nota)}»` : ''}</p><small>${cuando(r.fecha)} · Stock actual: ${s.stock}</small>
      <div class="fila" style="--fila:8px">
        ${r.estado === 'pendiente' ? `<button class="btn btn--acento btn--peq" type="button" data-res="${r.id}" data-accion-res="confirmar">Confirmar y apartar</button>` : ''}
        ${r.estado === 'confirmada' ? `<button class="btn btn--acento btn--peq" type="button" data-res="${r.id}" data-accion-res="entregar">Marcar entregada</button>` : ''}
        ${r.estado === 'pendiente' || r.estado === 'confirmada' ? `<button class="btn btn--suave btn--peq" type="button" data-res="${r.id}" data-accion-res="cancelar">Cancelar</button>` : ''}
        <a class="btn btn--wa btn--peq" target="_blank" rel="noopener" href="${enlaceContacto(r.contacto, `Hola ${r.nombre}, te escribimos de ${tienda.nombre} por tu reserva de ${p.nombre}.`)}">${icono(r.contacto.includes('@') ? 'mail' : 'whatsapp')}Escribir al cliente</a>
      </div></article>`;
  }).join('') : `<div class="vacio">${icono('bolsa')}<p>No hay reservas ${ui.reservas === 'todas' ? '' : `en estado «${ui.reservas}»`}. Las reservas que hagan tus clientes desde la web aparecerán aquí.</p></div>`}</div>`;
}

function accionReserva(id: string, accion: string) {
  const r = cargar().reservas.find((x) => x.id === id);
  if (!r) return;
  if (accion === 'confirmar') {
    const stock = cargar().productos[r.productoId].stock;
    if (stock < r.cantidad) return toast(`No hay stock suficiente (quedan ${stock}).`, 'error');
    mutar((e) => {
      e.productos[r.productoId].stock -= r.cantidad;
      e.reservas.find((x) => x.id === id)!.estado = 'confirmada';
    });
    toast('Reserva confirmada y producto apartado');
  } else if (accion === 'entregar') {
    mutar((e) => (e.reservas.find((x) => x.id === id)!.estado = 'entregada'));
    toast('Reserva entregada');
  } else if (accion === 'cancelar') {
    mutar((e) => {
      const x = e.reservas.find((y) => y.id === id)!;
      if (x.estado === 'confirmada') e.productos[x.productoId].stock += x.cantidad;
      x.estado = 'cancelada';
    });
    toast('Reserva cancelada');
  }
}

/* ---------- Consultas ---------- */
function vistaConsultas(e: EstadoDemo) {
  const tabs = [['mensajes', 'Mensajes', e.consultas.filter((c) => !c.atendida).length], ['ventas', 'Ventas y tasaciones', e.ventas.filter((v) => !v.atendida).length], ['avisos', 'Avisos de stock', e.alertas.filter((a) => !a.avisado).length]] as const;
  let cuerpo = '';
  if (ui.consultas === 'mensajes') {
    cuerpo = e.consultas.length ? e.consultas.map((c) => `<article class="tarjeta-solicitud ${c.atendida ? 'atendida' : ''}"><header><strong>${esc(c.motivo)}</strong><small>${cuando(c.fecha)}</small></header><p>${esc(c.mensaje)}</p><small>${esc(c.nombre)} · ${esc(c.contacto)}</small>
      <div class="fila" style="--fila:8px"><a class="btn btn--wa btn--peq" target="_blank" rel="noopener" href="${enlaceContacto(c.contacto, `Hola ${c.nombre}, te respondemos desde ${tienda.nombre}:`)}">${icono(c.contacto.includes('@') ? 'mail' : 'whatsapp')}Responder</a>
      <button class="btn btn--suave btn--peq" type="button" data-atender="consultas" data-id="${c.id}">${c.atendida ? 'Marcar como pendiente' : 'Marcar como atendida'}</button></div></article>`).join('')
      : `<div class="vacio">${icono('mail')}<p>Sin mensajes. Los que lleguen desde el formulario de contacto aparecerán aquí.</p></div>`;
  } else if (ui.consultas === 'ventas') {
    cuerpo = e.ventas.length ? e.ventas.map((v) => `<article class="tarjeta-solicitud ${v.atendida ? 'atendida' : ''}"><header><strong>Quiere ${esc(v.operacion)}: ${esc(v.material)}</strong><small>${cuando(v.fecha)}</small></header>
      <p>${esc(v.cantidad)} · estado ${esc(v.estadoCartas)} · ${v.fotos} ${v.fotos === 1 ? 'foto' : 'fotos'} adjuntas en el formulario${v.detalle ? `<br>«${esc(v.detalle)}»` : ''}</p><small>${esc(v.nombre)} · ${esc(v.contacto)}</small>
      <div class="fila" style="--fila:8px"><a class="btn btn--wa btn--peq" target="_blank" rel="noopener" href="${enlaceContacto(v.contacto, `Hola ${v.nombre}, hemos visto tu solicitud para ${v.operacion} tu colección. ¿Puedes mandarnos las fotos por aquí?`)}">${icono(v.contacto.includes('@') ? 'mail' : 'whatsapp')}Contactar</a>
      <button class="btn btn--suave btn--peq" type="button" data-atender="ventas" data-id="${v.id}">${v.atendida ? 'Marcar como pendiente' : 'Marcar como atendida'}</button></div></article>`).join('')
      : `<div class="vacio">${icono('intercambio')}<p>Sin solicitudes de venta. Las que lleguen desde «Vende tu colección» aparecerán aquí.</p></div>`;
  } else {
    cuerpo = e.alertas.length ? e.alertas.map((a) => {
      const p = productoPorId.get(a.productoId)!;
      const s = e.productos[a.productoId];
      return `<article class="tarjeta-solicitud ${a.avisado ? 'atendida' : ''}"><header><strong>${esc(p.nombre)}</strong><span class="estado-mini estado-mini--${textoStock(s.stock).clase}">${textoStock(s.stock).texto}</span></header>
        <small>${esc(a.nombre)} · ${esc(a.contacto)} · pidió aviso el ${cuando(a.fecha)}</small>
        <div class="fila" style="--fila:8px">${s.stock > 0 && !a.avisado ? `<a class="btn btn--wa btn--peq" target="_blank" rel="noopener" data-avisado="${a.id}" href="${enlaceContacto(a.contacto, `Hola ${a.nombre}, ya tenemos ${p.nombre} en ${tienda.nombre}. ¿Te lo reservamos?`)}">${icono('whatsapp')}Avisar ahora</a>` : ''}
        ${s.stock === 0 && !a.avisado ? '<small>Repón stock en Productos para poder avisar.</small>' : ''}
        <button class="btn btn--suave btn--peq" type="button" data-atender="alertas" data-id="${a.id}">${a.avisado ? 'Marcar como pendiente' : 'Marcar como avisado'}</button></div></article>`;
    }).join('') : `<div class="vacio">${icono('alerta')}<p>Nadie ha pedido aviso todavía. Cuando un producto esté agotado, tus clientes podrán pedir que les avises.</p></div>`;
  }
  return `<div class="panel-cab"><div><h1 class="h1">Consultas</h1><p class="entradilla">Mensajes, solicitudes de venta y avisos de disponibilidad. Esta demo no envía notificaciones: el aviso se hace desde aquí con un clic.</p></div></div>
  <div class="pestanas-panel">${tabs.map(([k, n, c]) => `<button class="chip" type="button" data-tab-con="${k}" aria-pressed="${ui.consultas === k}">${n}${c ? ` <span class="num">${c}</span>` : ''}</button>`).join('')}</div>
  <div class="lista-solicitudes">${cuerpo}</div>`;
}

/* ---------- Torneos ---------- */
function vistaTorneos(e: EstadoDemo) {
  const ahora = new Date();
  const orden = [...e.torneos].sort((a, b) => {
    const fa = a.finalizado ? 2 : Date.parse(a.inicio) <= ahora.getTime() ? 0 : 1;
    const fb = b.finalizado ? 2 : Date.parse(b.inicio) <= ahora.getTime() ? 0 : 1;
    return fa - fb || (fa === 2 ? Date.parse(b.inicio) - Date.parse(a.inicio) : Date.parse(a.inicio) - Date.parse(b.inicio));
  });
  return `<div class="panel-cab"><div><p class="etiqueta">${e.torneos.length} torneos</p><h1 class="h1">Torneos</h1><p class="entradilla">Crea torneos, gestiona inscritos, genera cuadros y rondas, introduce resultados y publica al campeón.</p></div>
    <button class="btn btn--acento" type="button" data-nuevo-torneo>${icono('mas')}Crear torneo</button></div>
  <section class="caja"><div class="envoltura-tabla"><table class="tabla-panel"><caption class="solo-lector">Torneos</caption>
    <thead><tr><th scope="col">Torneo</th><th scope="col">Fecha</th><th scope="col">Inscritos</th><th scope="col">Estado</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead>
    <tbody>${orden.map((t) => {
      const p = T.plazas(t);
      const clase = p.libres === 0 ? 'llena' : p.libres <= T.umbralUltimas(t.capacidad) ? 'casi' : '';
      return `<tr><td><strong>${esc(t.nombre)}</strong><br><small style="color:var(--gris)">${numTorneo(t)} · ${T.ETIQUETA_FORMATO[t.formato]}</small></td><td>${cuando(t.inicio)}</td>
        <td><span class="cifra">${p.ocupadas}/${t.capacidad}</span>${p.pendientes ? ` <small style="color:var(--acento-tinta)">(${p.pendientes} por confirmar)</small>` : ''}<div class="barra-mini ${clase}" style="margin-top:6px"><span style="width:${Math.round(p.pct * 100)}%"></span></div></td>
        <td>${pillEstado(T.estadoTorneo(t, ahora))}</td>
        <td><div class="fila" style="--fila:6px;flex-wrap:nowrap"><a class="btn btn--acento btn--peq" href="#torneo/${t.id}">Gestionar</a><a class="btn-icono" href="${rutaTorneo(t)}" target="_blank" aria-label="Ver ${esc(t.nombre)} en la web">${icono('externo')}</a></div></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}

function vistaGestion(e: EstadoDemo, id: string) {
  const t = e.torneos.find((x) => x.id === id);
  if (!t) return `<div class="vacio">${icono('alerta')}<p>Ese torneo no existe (quizá restableciste la demo).</p><a class="btn btn--acento" href="#torneos">Volver a torneos</a></div>`;
  const ahora = new Date();
  const est = T.estadoTorneo(t, ahora);
  const fase = T.fase(t);
  const empezado = !!(t.cuadro || t.suizo.length);
  const p = T.plazas(t);
  const n = nick(e);
  const pasos = t.formato === 'eliminacion' ? ['Inscripción', 'Cuadro', 'Finalizado'] : t.formato === 'suizo' ? ['Inscripción', 'Rondas suizas', 'Finalizado'] : ['Inscripción', 'Rondas suizas', `Top ${t.topCorte}`, 'Finalizado'];
  const idxFase = t.finalizado ? pasos.length - 1 : fase === 'inscripcion' ? 0 : fase === 'suizo' ? 1 : fase === 'top' || (fase === 'eliminacion' && t.formato === 'suizo-top') ? 2 : fase === 'eliminacion' ? 1 : pasos.length - 2;

  let competicion = '';
  if (t.finalizado) {
    const c = T.campeon(t, n);
    competicion = `<p>Torneo finalizado. Campeón publicado en la web: <strong>${esc(c ? n(c) : '—')}</strong>.</p><div class="fila"><a class="btn btn--acento btn--peq" target="_blank" href="${rutaTorneo(t)}#competicion">Ver en la web</a><button class="btn btn--suave btn--peq" type="button" data-reabrir>Reabrir para corregir resultados</button></div>`;
  } else if (fase === 'inscripcion') {
    competicion = `<p>${p.ocupadas < 2 ? 'Hacen falta al menos 2 inscritos para empezar.' : `Con ${p.ocupadas} inscritos: ${t.formato === 'eliminacion' ? `cuadro de ${C.tamanoCuadro(p.ocupadas)} (${C.tamanoCuadro(p.ocupadas) - p.ocupadas} pases directos)` : `${t.rondasSuizas || 'las rondas recomendadas'} rondas suizas`}. Al empezar se cierran las inscripciones y los pendientes pasan a confirmados.`}</p>
      <button class="btn btn--acento" type="button" data-empezar ${p.ocupadas < 2 ? 'disabled' : ''}>${icono('rayo')}Empezar torneo y generar ${t.formato === 'eliminacion' ? 'el cuadro' : 'la ronda 1'}</button>`;
  } else {
    const acciones: string[] = [];
    if (fase === 'suizo') {
      const r = t.suizo[t.suizo.length - 1];
      const hechas = r.filter((x) => x.estado === 'finalizada').length;
      acciones.push(`<p>Ronda ${t.suizo.length} de ${t.rondasSuizas}: ${hechas} de ${r.length} resultados.</p>`);
      if (hechas === r.length && t.suizo.length < t.rondasSuizas) acciones.push(`<button class="btn btn--acento" type="button" data-siguiente-ronda>${icono('rayo')}Generar ronda ${t.suizo.length + 1}</button>`);
    }
    if (fase === 'top') acciones.push(`<p>Rondas suizas terminadas.</p><button class="btn btn--acento" type="button" data-generar-top>${icono('rayo')}Generar top ${t.topCorte}</button>`);
    if (fase === 'terminado') acciones.push(`<p>Todos los resultados registrados. Campeón: <strong>${esc(n(T.campeon(t, n) ?? ''))}</strong>.</p><button class="btn btn--acento" type="button" data-finalizar>${icono('trofeo')}Finalizar y publicar campeón</button>`);
    if (fase === 'eliminacion') acciones.push('<p>Pulsa el lápiz de cada partida para poner el resultado. El ganador pasa solo a la siguiente ronda.</p>');
    competicion = `${acciones.join('')}<div class="panel-oscuro osc">${String(t.cuadro ? cuadroHTML(t, t.cuadro, e.jugadores, { editable: true }) : '')}
      ${t.formato !== 'eliminacion' && t.suizo.length ? `<h3 class="h3" style="margin:${t.cuadro ? '30px' : '0'} 0 12px">Emparejamientos</h3>${rondasSuizas(t, e.jugadores, { editable: true })}<h3 class="h3" style="margin:30px 0 12px">Clasificación</h3>${tablaSuiza(t, e.jugadores)}` : ''}</div>`;
  }

  const filas = t.inscripciones.map((i, k) => {
    const j = e.jugadores[i.jugadorId];
    return `<tr><td class="cifra">${k + 1}</td><td><strong>${esc(j?.nick)}</strong><br><small style="color:var(--gris)">${esc(j?.nombre)} · ${T.ETIQUETA_DIVISION[j?.division ?? 'master']}</small></td>
      <td><small>${esc(i.contacto ?? '—')}${i.idOficial ? `<br>ID ${esc(i.idOficial)}` : ''}</small></td><td><span class="estado-mini estado-mini--${i.estado}">${i.estado}</span><br><small style="color:var(--gris)">${i.origen === 'web' ? 'desde la web' : i.origen === 'panel' ? 'añadido en tienda' : 'datos demo'}</small></td>
      <td><div class="fila" style="--fila:6px;flex-wrap:nowrap">${i.estado === 'pendiente' ? `<button class="btn btn--acento btn--peq" type="button" data-confirmar-ins="${i.id}">Confirmar</button>` : ''}
      ${empezado ? '' : `<button class="btn btn--suave btn--peq" type="button" data-quitar-ins="${i.id}" aria-label="Quitar a ${esc(j?.nick)}">${icono('papelera')}</button>`}</div></td></tr>`;
  }).join('');

  return `<div class="gestion-cab osc">
    <a class="enlace-flecha" href="#torneos" style="color:var(--niebla)">${icono('atras')} Todos los torneos</a>
    <div class="fila" style="justify-content:space-between"><div><p class="etiqueta">${numTorneo(t)} · ${T.ETIQUETA_FORMATO[t.formato]} · ${cuando(t.inicio)}</p><h1 class="h1" style="font-size:clamp(1.8rem,3.6vw,2.8rem);margin-top:8px">${esc(t.nombre)}</h1></div>${pillEstado(est)}</div>
    <div class="fase">${pasos.map((x, k) => `<span class="${k === idxFase ? 'actual' : k < idxFase ? 'hecha' : ''}">${k < idxFase ? '✓ ' : ''}${x}</span>`).join('')}</div>
    <div class="fila" style="--fila:8px">
      <a class="btn btn--suave btn--peq" href="${rutaTorneo(t)}" target="_blank">${icono('externo')}Ver en la web</a>
      <button class="btn btn--suave btn--peq" type="button" data-editar-torneo>${icono('editar')}Editar datos</button>
      ${empezado || t.finalizado ? '' : `<button class="btn btn--suave btn--peq" type="button" data-toggle-ins>${t.inscripcionesAbiertas ? 'Cerrar inscripciones' : 'Abrir inscripciones'}</button>`}
      <button class="btn btn--suave btn--peq" type="button" data-borrar-torneo>${icono('papelera')}Eliminar</button>
    </div>
  </div>
  <section class="caja"><div class="caja-cab"><h2>Competición</h2></div>${competicion}</section>
  <section class="caja"><div class="caja-cab"><h2>Inscritos · ${p.ocupadas}/${t.capacidad}${p.pendientes ? ` · ${p.pendientes} por confirmar` : ''}</h2>${p.pendientes && !empezado ? '<button class="btn btn--suave btn--peq" type="button" data-confirmar-todos>Confirmar todos</button>' : ''}</div>
    ${t.inscripciones.length ? `<div class="envoltura-tabla"><table class="tabla-panel"><caption class="solo-lector">Inscritos</caption><thead><tr><th scope="col">#</th><th scope="col">Jugador</th><th scope="col">Contacto</th><th scope="col">Estado</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead><tbody>${filas}</tbody></table></div>` : '<p class="vacio">Aún no hay inscritos.</p>'}
    ${empezado ? '' : `<form class="form-rejilla" data-anadir-jugador novalidate style="padding-top:8px;border-top:1px solid var(--linea)">
      <p class="ancho" style="font-weight:700">Añadir participante (inscripción en tienda)</p>
      <div class="campo"><label for="aj-nombre">Nombre y apellido</label><input class="entrada" id="aj-nombre" name="nombre" /><p class="error-campo" data-error="nombre" hidden></p></div>
      <div class="campo"><label for="aj-nick">Nick</label><input class="entrada" id="aj-nick" name="nick" /><p class="error-campo" data-error="nick" hidden></p></div>
      <div class="campo"><label for="aj-div">División</label><select class="entrada" id="aj-div" name="division"><option value="master">Máster</option><option value="senior">Sénior</option><option value="junior">Júnior</option></select><p class="error-campo" data-error="division" hidden></p></div>
      <div class="campo"><label for="aj-contacto">Teléfono o email</label><input class="entrada" id="aj-contacto" name="contacto" /><p class="error-campo" data-error="contacto" hidden></p></div>
      <p class="error-campo ancho" data-error="general" hidden></p>
      <div class="ancho"><button class="btn btn--acento btn--peq" type="submit">${icono('mas')}Añadir</button></div></form>`}
    ${t.listaEspera.length ? `<h3 class="h3">Lista de espera</h3><ul class="feed" role="list">${t.listaEspera.map((i, k) => `<li><span class="ico cifra">E${k + 1}</span><span style="flex:1"><strong>${esc(e.jugadores[i.jugadorId]?.nick)}</strong><small>${esc(i.contacto ?? '')} · ${cuando(i.fecha)}</small></span>
      ${p.libres > 0 && !empezado ? `<button class="btn btn--acento btn--peq" type="button" data-subir="${i.id}">Pasar a inscritos</button>` : ''}<button class="btn btn--suave btn--peq" type="button" data-quitar-ins="${i.id}">Quitar</button></li>`).join('')}</ul>` : ''}
  </section>`;
}

/* ---------- Resultado de una partida ---------- */
let partidaEditando = '';
function abrirResultado(partidaId: string) {
  const e = cargar();
  const t = e.torneos.find((x) => x.id === ruta.split('/')[1])!;
  const enCuadro = t.cuadro && C.buscar(t.cuadro, partidaId);
  const p: Partida | undefined = enCuadro ? t.cuadro![enCuadro.r][enCuadro.i] : t.suizo.flat().find((x) => x.id === partidaId);
  if (!p || !p.a || !p.b) return;
  partidaEditando = partidaId;
  const A = e.jugadores[p.a].nick;
  const B = e.jugadores[p.b].nick;
  const opciones: [number, number, string][] = t.mejorDe === 3 ? [[2, 0, A], [2, 1, A], [1, 2, B], [0, 2, B]] : [[1, 0, A], [0, 1, B]];
  if (!enCuadro) opciones.push(t.mejorDe === 3 ? [1, 1, 'Empate'] : [0, 0, 'Empate']);
  $('[data-res-ronda]')!.textContent = enCuadro ? C.nombreRonda(t.cuadro!.length, enCuadro.r) : `Ronda suiza ${t.suizo.length} · mesa ${p.mesa ?? ''}`;
  $('[data-res-cuerpo]')!.innerHTML = `<p style="font-size:1.1rem"><strong>${esc(A)}</strong> contra <strong>${esc(B)}</strong> · al mejor de ${t.mejorDe}</p>
    <div class="resultado-opciones" role="group" aria-label="Elegir resultado">${opciones.map(([a, b, g]) => `<button type="button" data-marcador="${a}-${b}" aria-pressed="${p.estado === 'finalizada' && p.ga === a && p.gb === b}"><span class="cifra">${a} – ${b}</span><small>${g === 'Empate' ? 'Empate' : `Gana ${esc(g)}`}</small></button>`).join('')}</div>
    ${enCuadro && p.estado === 'finalizada' ? '<p class="nota-demo">Si cambias el ganador y ya se jugó la ronda siguiente, ese resultado se anulará para que el cuadro siga siendo coherente.</p>' : ''}
    <div class="fila" style="--fila:8px">${p.estado === 'pendiente' ? '<button class="btn btn--suave btn--peq" type="button" data-en-juego>Marcar «en juego»</button>' : ''}${p.estado === 'finalizada' ? '<button class="btn btn--suave btn--peq" type="button" data-borrar-res>Borrar resultado</button>' : ''}</div>`;
  abrir('dlg-resultado');
}

$('#dlg-resultado')!.addEventListener('click', (ev) => {
  const b = ev.target as HTMLElement;
  const idT = ruta.split('/')[1];
  try {
    const m = b.closest<HTMLElement>('[data-marcador]');
    if (m) {
      const [a, c] = m.dataset.marcador!.split('-').map(Number);
      const anuladas = mutar((e) => T.registrarResultado(e.torneos.find((x) => x.id === idT)!, partidaEditando, a, c));
      ($('#dlg-resultado') as HTMLDialogElement).close();
      toast(anuladas ? `Resultado guardado. Se anularon ${anuladas} resultados posteriores que dependían de este.` : 'Resultado guardado');
      const t = cargar().torneos.find((x) => x.id === idT)!;
      if (T.fase(t) === 'terminado') toast('¡Último resultado! Ya puedes finalizar el torneo y publicar al campeón.');
    }
    if (b.closest('[data-en-juego]')) {
      mutar((e) => {
        const t = e.torneos.find((x) => x.id === idT)!;
        const p = t.cuadro && C.buscar(t.cuadro, partidaEditando) ? t.cuadro : null;
        if (p) C.marcarEnJuego(p, partidaEditando);
        else {
          const x = t.suizo.flat().find((y) => y.id === partidaEditando);
          if (x && x.estado === 'pendiente') x.estado = 'en-curso';
        }
      });
      ($('#dlg-resultado') as HTMLDialogElement).close();
      toast('Partida marcada como «en juego»');
    }
    if (b.closest('[data-borrar-res]')) {
      const n = mutar((e) => {
        const t = e.torneos.find((x) => x.id === idT)!;
        if (t.cuadro && C.buscar(t.cuadro, partidaEditando)) return C.borrarResultado(t.cuadro, partidaEditando);
        const ultima = t.suizo[t.suizo.length - 1];
        const x = ultima?.find((y) => y.id === partidaEditando);
        if (!x || t.cuadro) throw new Error('Solo se pueden borrar resultados de la ronda en juego.');
        x.ga = x.gb = null;
        x.estado = 'pendiente';
        return 0;
      });
      ($('#dlg-resultado') as HTMLDialogElement).close();
      toast(n ? `Resultado borrado (y ${n} posteriores)` : 'Resultado borrado');
    }
  } catch (err) {
    toast((err as Error).message, 'error');
  }
});

/* ---------- Formulario de torneo (crear y editar) ---------- */
const dlgForm = $<HTMLDialogElement>('#dlg-form-torneo')!;
const formT = $<HTMLFormElement>('#form-torneo')!;
let editando: string | null = null;
function mostrarCamposFormato() {
  const f = (formT.elements.namedItem('formato') as HTMLSelectElement).value;
  $('[data-solo-suizo]', formT)!.hidden = f === 'eliminacion';
  $('[data-solo-top]', formT)!.hidden = f !== 'suizo-top';
}
(formT.elements.namedItem('formato') as HTMLSelectElement).addEventListener('change', mostrarCamposFormato);

function abrirFormulario(t?: Torneo) {
  editando = t?.id ?? null;
  formT.reset();
  mostrarErrores(formT, {});
  $('#ft-titulo')!.textContent = t ? `Editar «${t.nombre}»` : 'Nuevo torneo';
  $('[data-ft-enviar]', formT)!.textContent = t ? 'Guardar cambios' : 'Crear torneo';
  const manana = claveDia(new Date(Date.now() + 7 * 864e5));
  const v: Record<string, string> = t
    ? { nombre: t.nombre, fecha: claveDia(t.inicio), hora: hora(t.inicio), tipo: t.tipo, formato: t.formato, modalidad: t.modalidad, capacidad: String(t.capacidad), precio: String(t.precio), mejorDe: String(t.mejorDe), rondasSuizas: String(t.rondasSuizas), topCorte: String(t.topCorte || 8), resumen: t.resumen, premios: t.premios.join('\n') }
    : { fecha: manana, hora: '10:00', capacidad: '16', precio: '5', modalidad: 'Estándar', mejorDe: '3', rondasSuizas: '0', topCorte: '8' };
  for (const [k, val] of Object.entries(v)) {
    const el = formT.elements.namedItem(k) as HTMLInputElement | null;
    if (el) el.value = val;
  }
  (formT.elements.namedItem('inscripcionesAbiertas') as HTMLInputElement).checked = t ? t.inscripcionesAbiertas : true;
  (formT.elements.namedItem('destacado') as HTMLInputElement).checked = t ? t.destacado : false;
  const empezado = !!(t && (t.cuadro || t.suizo.length));
  for (const k of ['formato', 'mejorDe', 'rondasSuizas', 'topCorte']) (formT.elements.namedItem(k) as HTMLInputElement).disabled = empezado;
  mostrarCamposFormato();
  abrir('dlg-form-torneo');
}

formT.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(formT)) as Record<string, string>;
  const actual = editando ? cargar().torneos.find((x) => x.id === editando) : undefined;
  const capacidad = Math.floor(+d.capacidad);
  const precio = +d.precio;
  const fecha = d.fecha && d.hora ? desdeZona(+d.fecha.slice(0, 4), +d.fecha.slice(5, 7), +d.fecha.slice(8, 10), +d.hora.slice(0, 2), +d.hora.slice(3, 5)) : null;
  const errores: Record<string, string | undefined> = {
    nombre: (d.nombre ?? '').trim().length < 3 ? 'Ponle un nombre (mínimo 3 letras).' : undefined,
    fecha: !d.fecha ? 'Elige la fecha.' : !editando && fecha && fecha.getTime() < Date.now() ? 'La fecha ya ha pasado.' : undefined,
    hora: !d.hora ? 'Elige la hora.' : undefined,
    capacidad: !(capacidad >= 2 && capacidad <= 256) ? 'Entre 2 y 256 plazas.' : actual && capacidad < actual.inscripciones.length ? `Ya hay ${actual.inscripciones.length} inscritos: no puede ser menor.` : undefined,
    precio: !(precio >= 0) ? 'El precio no puede ser negativo.' : undefined,
  };
  if (!mostrarErrores(formT, errores)) return;
  const datos = {
    nombre: d.nombre.trim(), inicio: fecha!.toISOString(), tipo: d.tipo as Torneo['tipo'], modalidad: (d.modalidad || 'Estándar').trim(), capacidad, precio,
    resumen: (d.resumen || '').trim() || `${T.ETIQUETA_FORMATO[(d.formato ?? actual?.formato) as Torneo['formato']]} en ${tienda.nombre}.`,
    premios: (d.premios || '').split('\n').map((x) => x.trim()).filter(Boolean),
    inscripcionesAbiertas: !!d.inscripcionesAbiertas, destacado: !!d.destacado,
  };
  if (actual) {
    mutar((e) => {
      const t = e.torneos.find((x) => x.id === actual.id)!;
      Object.assign(t, datos, { descripcion: t.creadoEnPanel ? datos.resumen : t.descripcion });
      if (!(t.cuadro || t.suizo.length)) {
        t.formato = d.formato as Torneo['formato'];
        t.mejorDe = +d.mejorDe as 1 | 3;
        t.rondasSuizas = Math.max(0, Math.floor(+d.rondasSuizas || 0));
        t.topCorte = t.formato === 'suizo-top' ? +d.topCorte : 0;
      }
      if (datos.destacado) for (const x of e.torneos) if (x.id !== t.id) x.destacado = false;
    });
    dlgForm.close();
    toast('Cambios guardados: ya se ven en la web');
  } else {
    const idNuevo = nuevoId('p');
    mutar((e) => {
      const base = e.torneos.find((x) => x.reglas.length) ?? e.torneos[0];
      const numero = Math.max(0, ...e.torneos.map((x) => x.numero)) + 1;
      const formato = d.formato as Torneo['formato'];
      if (datos.destacado) for (const x of e.torneos) x.destacado = false;
      e.torneos.push({
        id: idNuevo, slug: idNuevo, numero, ...datos, formato, descripcion: datos.resumen, duracionMin: 300, ubicacion: `${tienda.nombre} · zona de juego`,
        mejorDe: +d.mejorDe as 1 | 3, reglas: [...(base?.reglas ?? [])], desarrollo: [], faq: [...(base?.faq ?? [])],
        aperturaInscripciones: null, cierreInscripciones: null, finalizado: false, inscripciones: [], listaEspera: [],
        rondasSuizas: Math.max(0, Math.floor(+d.rondasSuizas || 0)), topCorte: formato === 'suizo-top' ? +d.topCorte : 0,
        suizo: [], cuadro: null, tema: formato === 'eliminacion' ? 'ambar' : formato === 'suizo' ? 'cian' : 'violeta', creadoEnPanel: true,
      });
    });
    dlgForm.close();
    toast('Torneo creado y publicado en la web');
    location.hash = `torneo/${idNuevo}`;
  }
});

/* ---------- Acciones del panel ---------- */
function torneoActual() {
  return ruta.split('/')[1];
}
function enTorneo(fn: (t: Torneo, e: EstadoDemo) => unknown, ok?: string) {
  try {
    const r = mutar((e) => fn(e.torneos.find((x) => x.id === torneoActual())!, e));
    if (ok) toast(ok);
    return r;
  } catch (err) {
    toast((err as Error).message, 'error');
  }
}

cont.addEventListener('click', (ev) => {
  const b = ev.target as HTMLElement;
  const q = <K extends string>(s: K) => b.closest<HTMLElement>(s);
  if (q('[data-nuevo-torneo]')) {
    ev.preventDefault();
    abrirFormulario();
  }
  const delta = q('[data-stock-delta]');
  if (delta) {
    const id = delta.dataset.id!;
    fijarStock(id, Math.max(0, cargar().productos[id].stock + +delta.dataset.stockDelta!));
  }
  const ag = q('[data-agotar]');
  if (ag) fijarStock(ag.dataset.agotar!, 0);
  const re = q('[data-reponer]');
  if (re) fijarStock(re.dataset.reponer!, 5);
  const tabR = q('[data-tab-res]');
  if (tabR) {
    ui.reservas = tabR.dataset.tabRes!;
    pintar();
  }
  const accR = q('[data-accion-res]');
  if (accR) accionReserva(accR.dataset.res!, accR.dataset.accionRes!);
  const tabC = q('[data-tab-con]');
  if (tabC) {
    ui.consultas = tabC.dataset.tabCon!;
    pintar();
  }
  if (q('[data-ir-avisos]')) ui.consultas = 'avisos';
  const at = q('[data-atender]');
  if (at) {
    const lista = at.dataset.atender as 'consultas' | 'ventas' | 'alertas';
    mutar((e) => {
      const x = (e[lista] as { id: string; atendida?: boolean; avisado?: boolean }[]).find((y) => y.id === at.dataset.id);
      if (!x) return;
      if (lista === 'alertas') x.avisado = !x.avisado;
      else x.atendida = !x.atendida;
    });
  }
  const av = q('[data-avisado]');
  if (av) setTimeout(() => mutar((e) => { const x = e.alertas.find((y) => y.id === av.dataset.avisado); if (x) x.avisado = true; }), 300);
  // Torneo
  if (q('[data-editar-torneo]')) abrirFormulario(cargar().torneos.find((x) => x.id === torneoActual()));
  if (q('[data-toggle-ins]')) enTorneo((t) => (t.inscripcionesAbiertas = !t.inscripcionesAbiertas), 'Inscripciones actualizadas');
  if (q('[data-borrar-torneo]')) {
    const t = cargar().torneos.find((x) => x.id === torneoActual());
    if (t && confirm(`¿Eliminar «${t.nombre}»? Desaparecerá de la web. (Puedes recuperarlo restableciendo la demo.)`)) {
      mutar((e) => (e.torneos = e.torneos.filter((x) => x.id !== t.id)));
      toast('Torneo eliminado');
      location.hash = 'torneos';
    }
  }
  const conf = q('[data-confirmar-ins]');
  if (conf) enTorneo((t) => (t.inscripciones.find((i) => i.id === conf.dataset.confirmarIns)!.estado = 'confirmada'), 'Inscripción confirmada');
  if (q('[data-confirmar-todos]')) enTorneo((t) => t.inscripciones.forEach((i) => (i.estado = 'confirmada')), 'Todas las inscripciones confirmadas');
  const quitar = q('[data-quitar-ins]');
  if (quitar && confirm('¿Quitar a este jugador del torneo?')) {
    const sube = enTorneo((t) => T.darDeBaja(t, quitar.dataset.quitarIns!)) as ReturnType<typeof T.darDeBaja> | undefined;
    toast(sube ? `Plaza liberada: ${cargar().jugadores[sube.jugadorId]?.nick} pasa de la lista de espera a inscritos` : 'Jugador quitado');
  }
  const subir = q('[data-subir]');
  if (subir) enTorneo((t) => {
    if (T.plazas(t).libres === 0) throw new Error('No hay plazas libres.');
    const i = t.listaEspera.findIndex((x) => x.id === subir.dataset.subir);
    t.inscripciones.push(t.listaEspera.splice(i, 1)[0]);
  }, 'Pasado a inscritos');
  if (q('[data-empezar]')) {
    const t = cargar().torneos.find((x) => x.id === torneoActual())!;
    if (confirm(`¿Empezar «${t.nombre}» con ${t.inscripciones.length} jugadores? Se cerrarán las inscripciones.`)) {
      enTorneo((x, e) => T.empezar(x, nick(e)), T.ETIQUETA_FORMATO[t.formato] === 'Eliminación directa' ? 'Cuadro generado y publicado' : 'Ronda 1 generada y publicada');
    }
  }
  if (q('[data-siguiente-ronda]')) enTorneo((t, e) => T.siguienteRondaSuiza(t, nick(e)), 'Nueva ronda generada');
  if (q('[data-generar-top]')) enTorneo((t, e) => T.generarTop(t, nick(e)), 'Corte final generado');
  if (q('[data-finalizar]')) {
    const ok = enTorneo((t) => T.finalizar(t));
    if (ok !== undefined || cargar().torneos.find((x) => x.id === torneoActual())?.finalizado) celebrar();
  }
  if (q('[data-reabrir]')) enTorneo((t) => (t.finalizado = false), 'Torneo reabierto para corregir resultados');
  const ed = q('[data-editar-partida]');
  if (ed) abrirResultado(ed.dataset.editarPartida!);
  const verRonda = q('[data-ver-ronda]');
  if (verRonda) {
    const caja = verRonda.closest('[data-rondas]')!;
    for (const x of $$('[data-ver-ronda]', caja)) x.setAttribute('aria-pressed', String(x === verRonda));
    for (const r of $$('[data-ronda-suiza]', caja)) r.hidden = r.dataset.rondaSuiza !== verRonda.dataset.verRonda;
  }
});

cont.addEventListener('change', (ev) => {
  const el = ev.target as HTMLInputElement;
  if (el.dataset.precioInput) {
    const v = Math.round(+el.value * 100) / 100;
    if (!(v >= 0) || el.value === '') {
      toast('El precio debe ser un número, 0 o mayor.', 'error');
      el.value = String(cargar().productos[el.dataset.precioInput].precio);
      return;
    }
    mutar((e) => (e.productos[el.dataset.precioInput!].precio = v));
    toast(`Precio actualizado: ${euros(v)}`);
  }
  if (el.dataset.stockInput) fijarStock(el.dataset.stockInput, Number(el.value));
  if (el.matches('[data-p-cat]')) {
    ui.cat = el.value;
    pintar();
  }
  if (el.matches('[data-p-vigilar]')) {
    ui.soloVigilar = el.checked;
    pintar();
  }
});
cont.addEventListener('input', (ev) => {
  const el = ev.target as HTMLInputElement;
  if (el.matches('[data-p-q]')) {
    ui.q = el.value;
    pintar();
  }
});
cont.addEventListener('submit', (ev) => {
  const f = ev.target as HTMLFormElement;
  if (!f.matches('[data-anadir-jugador]')) return;
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
  let r: T.ResultadoInscripcion | undefined;
  try {
    r = mutar((e) => T.inscribir(e.torneos.find((x) => x.id === torneoActual())!, e.jugadores, { nombre: d.nombre, nick: d.nick, contacto: d.contacto, division: d.division as T.DatosInscripcion['division'], aceptaNormas: true }, new Date(), { origen: 'panel', nuevoId: () => nuevoId('t') }));
  } catch (err) {
    toast((err as Error).message, 'error');
    return;
  }
  if (!r.ok) {
    mostrarErrores(f, r.errores as Record<string, string>);
    return;
  }
  toast(`${r.jugador.nick} añadido al torneo`);
});

function celebrar() {
  const e = cargar();
  const t = e.torneos.find((x) => x.id === torneoActual())!;
  const c = T.campeon(t, nick(e));
  const capa = document.createElement('div');
  capa.className = 'celebracion';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-label', 'Campeón publicado');
  const colores = ['#FFB547', '#5EEAD4', '#A78BFA', '#F472B6', '#fff'];
  capa.innerHTML = `<div class="celebracion-caja"><div class="confeti" aria-hidden="true">${Array.from({ length: 34 }, (_, i) => `<i style="--x:${(i * 29) % 100}%;--d:${(i % 10) * 0.1}s;--c:${colores[i % 5]}"></i>`).join('')}</div>
    ${icono('trofeo')}<span class="etiqueta">Campeón · ${esc(t.nombre)}</span><strong>${esc(c ? e.jugadores[c].nick : '')}</strong><span style="color:var(--niebla)">${esc(c ? e.jugadores[c].nombre : '')}</span>
    <p style="color:var(--niebla)">Publicado en la web, en el historial y en la clasificación.</p>
    <div class="fila" style="justify-content:center"><a class="btn btn--acento" href="${rutaTorneo(t)}" target="_blank">Ver en la web</a><button class="btn btn--suave" type="button" data-cerrar-cele>Cerrar</button></div></div>`;
  document.body.append(capa);
  const cerrar = () => capa.remove();
  capa.addEventListener('click', (ev) => {
    if (ev.target === capa || (ev.target as HTMLElement).closest('[data-cerrar-cele]')) cerrar();
  });
  addEventListener('keydown', function esc(ev) {
    if (ev.key === 'Escape') {
      cerrar();
      removeEventListener('keydown', esc);
    }
  });
  (capa.querySelector('[data-cerrar-cele]') as HTMLElement).focus();
}

$('[data-restablecer]')!.addEventListener('click', () => {
  if (!confirm('¿Restablecer la demo? Se borran las reservas, consultas, inscripciones y cambios hechos en este navegador, y vuelven los datos de ejemplo.')) return;
  restablecer();
  toast('Demo restablecida: datos de ejemplo de nuevo');
  location.hash = 'resumen';
  pintar();
});

suscribir(() => {
  if (!dlgForm.open && !($('#dlg-resultado') as HTMLDialogElement).open) pintar();
});
irA();
