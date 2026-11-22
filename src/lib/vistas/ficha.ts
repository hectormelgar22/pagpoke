/* Ficha completa de un torneo. Misma función para la página generada y para la vista en el navegador. */
import type { Torneo } from '../tipos.ts';
import { html, raw } from '../html.ts';
import { icono } from '../iconos.ts';
import { fechaLarga, hora, fechaMedia } from '../fechas.ts';
import * as T from '../torneo.ts';
import { cuadroHTML, tablaSuiza, rondasSuizas, participantesHTML, pillEstado, barraPlazas, numTorneo, cuentaAtras, type Jugadores } from './torneo.ts';
import { tienda } from '../../data/tienda.ts';

export function heroTorneo(t: Torneo, ahora: Date) {
  const e = T.estadoTorneo(t, ahora);
  const jugadas = T.partidasJugadas(t).length;
  return html`<div class="torneo-hero-num" aria-hidden="true">${String(t.numero).padStart(3, '0')}</div>
<div class="pila" style="--pila:18px;max-width:880px">
  <div class="fila"><span class="etiqueta">${numTorneo(t)} · ${T.ETIQUETA_FORMATO[t.formato]}${t.topCorte && t.formato === 'suizo-top' ? ` ${t.topCorte}` : ''} · ${t.modalidad}</span>${pillEstado(e)}</div>
  <h1 class="h1">${t.nombre}</h1>
  <p class="entradilla">${t.resumen}</p>
</div>
<div class="torneo-datos">
  <div><span class="etiqueta">${raw(icono('calendario'))}Fecha</span><strong>${fechaLarga(t.inicio)}</strong></div>
  <div><span class="etiqueta">${raw(icono('reloj'))}Hora</span><strong class="cifra">${hora(t.inicio)} h</strong></div>
  <div><span class="etiqueta">${raw(icono('ubicacion'))}Lugar</span><strong>${t.ubicacion}</strong></div>
  <div><span class="etiqueta">${raw(icono('trofeo'))}Partidas</span><strong>Al mejor de ${t.mejorDe}</strong></div>
  <div><span class="etiqueta">${raw(icono('bolsa'))}Inscripción</span><strong>${T.precioTexto(t.precio)}${t.precio ? ' · en tienda' : ''}</strong></div>
  <div><span class="etiqueta">${raw(icono('usuarios'))}${e === 'en-curso' || e === 'finalizado' ? 'Partidas jugadas' : 'Participantes'}</span><strong class="cifra">${e === 'en-curso' || e === 'finalizado' ? `${jugadas}` : `${t.inscripciones.length} / ${t.capacidad}`}</strong></div>
</div>`;
}

export function bannerCampeon(t: Torneo, js: Jugadores) {
  if (!t.finalizado) return '';
  const c = T.campeon(t, (id) => js[id]?.nick ?? id);
  if (!c) return '';
  const colores = ['#FFB547', '#5EEAD4', '#A78BFA', '#F472B6', '#fff'];
  return html`<div class="campeon-banner" data-campeon>
  <div class="confeti" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => raw(`<i style="--x:${(i * 37) % 100}%;--d:${(i % 9) * 0.12}s;--c:${colores[i % 5]}"></i>`))}</div>
  ${raw(icono('trofeo'))}
  <div><span class="etiqueta">Campeón del torneo</span><strong>${js[c]?.nick}</strong><span style="color:var(--niebla)">${js[c]?.nombre} · ${t.inscripciones.length} participantes · ${fechaMedia(t.inicio)}</span></div>
</div>`;
}

export function panelInscripcion(t: Torneo, ahora: Date) {
  const e = T.estadoTorneo(t, ahora);
  const p = T.plazas(t);
  let accion;
  switch (e) {
    case 'abiertas':
    case 'ultimas-plazas':
      accion = html`<button class="btn btn--acento btn--bloque" type="button" data-inscribirme>Inscribirme ahora</button>
      <p class="ayuda" style="font-size:.84rem;color:var(--niebla)">${p.libres} ${p.libres === 1 ? 'plaza libre' : 'plazas libres'}. Pagas ${T.precioTexto(t.precio).toLowerCase()} en tienda el día del torneo.</p>`;
      break;
    case 'completo':
      accion = html`<button class="btn btn--fantasma btn--bloque" type="button" data-inscribirme data-espera>Apuntarme a la lista de espera</button>
      <p class="ayuda" style="font-size:.84rem;color:var(--niebla)">Si alguien se da de baja, la plaza pasa al primero de la lista.</p>`;
      break;
    case 'proximamente':
      accion = html`<p class="nota-demo">${raw(icono('calendario'))}<span>Las inscripciones abren el <strong>${fechaLarga(t.aperturaInscripciones!)}</strong> a las ${hora(t.aperturaInscripciones!)}.</span></p>`;
      break;
    case 'cerradas':
      accion = html`<p class="nota-demo">${raw(icono('info'))}<span>${t.cierreInscripciones && Date.parse(t.cierreInscripciones) <= ahora.getTime() ? `Las inscripciones cerraron el ${fechaLarga(t.cierreInscripciones)} para preparar las mesas.` : 'La tienda ha cerrado las inscripciones de este torneo.'} Pregunta en tienda si queda alguna plaza.</span></p>`;
      break;
    case 'en-curso':
      accion = html`<a class="btn btn--acento btn--bloque" href="#competicion" data-ir-pestana="competicion">Seguir el torneo</a>`;
      break;
    default:
      accion = html`<a class="btn btn--fantasma btn--bloque" href="#competicion" data-ir-pestana="competicion">Ver resultados</a>`;
  }
  const futuro = T.esFuturo(t, ahora);
  return html`<div class="fila" style="justify-content:space-between"><span class="etiqueta">Inscripción</span>${pillEstado(e)}</div>
  ${e === 'en-curso' || e === 'finalizado' ? '' : barraPlazas(t)}
  ${futuro && e !== 'proximamente' ? cuentaAtras(t.inicio) : ''}
  ${accion}
  <div class="fila" style="--fila:8px">
    ${futuro ? html`<button class="btn btn--suave btn--peq" type="button" data-ics>${raw(icono('calendario'))}Añadir al calendario</button>` : ''}
    <a class="btn btn--suave btn--peq" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`${t.nombre} en ${tienda.nombre}: ${fechaLarga(t.inicio)} a las ${hora(t.inicio)}`)}">${raw(icono('whatsapp'))}Compartir</a>
  </div>`;
}

export function pestanaInfo(t: Torneo) {
  return html`<div class="bloque-texto">
  <p style="font-size:1.06rem;color:var(--nacar)">${t.descripcion}</p>
  ${t.desarrollo.length ? html`<h3 class="h3">Cómo se desarrolla</h3><ul class="lista-marcas" role="list">${t.desarrollo.map((d) => html`<li>${raw(icono('reloj'))}<span>${d}</span></li>`)}</ul>` : ''}
  ${t.premios.length ? html`<h3 class="h3">Premios</h3><ul class="lista-marcas" role="list">${t.premios.map((d) => html`<li>${raw(icono('trofeo'))}<span>${d}</span></li>`)}</ul>` : ''}
  ${t.reglas.length ? html`<h3 class="h3">Normas básicas</h3><ul class="lista-marcas" role="list">${t.reglas.map((d) => html`<li>${raw(icono('check'))}<span>${d}</span></li>`)}</ul>` : ''}
  ${t.faq.length ? html`<h3 class="h3">Preguntas frecuentes</h3><div class="preguntas">${t.faq.map((f) => html`<details><summary>${f.p}</summary><p>${f.r}</p></details>`)}</div>` : ''}
</div>`;
}

export function pestanaCompeticion(t: Torneo, js: Jugadores, editable = false) {
  const partes = [];
  if (t.formato === 'eliminacion' && t.cuadro) partes.push(cuadroHTML(t, t.cuadro, js, { editable }));
  if (t.formato !== 'eliminacion' && t.cuadro) partes.push(html`<h3 class="h3" style="margin-bottom:14px">Top ${t.topCorte}: eliminación directa</h3>`, cuadroHTML(t, t.cuadro, js, { editable }));
  if (t.formato !== 'eliminacion' && t.suizo.length) {
    partes.push(html`<h3 class="h3" style="margin:${t.cuadro ? '36px' : '0'} 0 14px">Clasificación · ${t.suizo.length} de ${t.rondasSuizas} rondas</h3>`, tablaSuiza(t, js));
    partes.push(html`<h3 class="h3" style="margin:36px 0 14px">Emparejamientos por ronda</h3>`, rondasSuizas(t, js, { editable }));
  }
  if (!partes.length) {
    return html`<div class="vacio">${raw(icono('trofeo'))}<p><strong>${t.formato === 'eliminacion' ? 'El cuadro' : 'Los emparejamientos'} se publicarán aquí cuando empiece el torneo.</strong><br />Formato: ${T.ETIQUETA_FORMATO[t.formato]}${t.formato !== 'eliminacion' ? `, ${t.rondasSuizas || 'según inscritos'} rondas` : ''}${t.formato === 'suizo-top' ? ` y top ${t.topCorte}` : ''}. Partidas al mejor de ${t.mejorDe}.</p></div>`;
  }
  return html`${partes}`;
}

export function pestanas(t: Torneo) {
  const hayCompeticion = !!(t.cuadro || t.suizo.length);
  return html`<div class="pestanas" role="tablist" aria-label="Secciones del torneo">
  <button role="tab" id="tab-info" aria-controls="panel-info" aria-selected="${!hayCompeticion}" data-pestana="info" tabindex="${hayCompeticion ? -1 : 0}">Información</button>
  <button role="tab" id="tab-participantes" aria-controls="panel-participantes" aria-selected="false" data-pestana="participantes" tabindex="-1">Participantes<span class="num">${t.inscripciones.length}</span></button>
  <button role="tab" id="tab-competicion" aria-controls="panel-competicion" aria-selected="${hayCompeticion}" data-pestana="competicion" tabindex="${hayCompeticion ? 0 : -1}">${t.formato === 'eliminacion' ? 'Cuadro' : 'Clasificación y rondas'}</button>
</div>`;
}

export function fichaCuerpo(t: Torneo, js: Jugadores, ahora: Date) {
  const hayCompeticion = !!(t.cuadro || t.suizo.length);
  return html`${bannerCampeon(t, js)}
<div class="torneo-cuerpo${hayCompeticion ? ' torneo-cuerpo--ancho' : ''}" style="${t.finalizado ? 'margin-top:24px' : ''}">
  <div style="min-width:0">
    ${pestanas(t)}
    <div role="tabpanel" id="panel-info" aria-labelledby="tab-info" ${hayCompeticion ? raw('hidden') : ''}>${pestanaInfo(t)}</div>
    <div role="tabpanel" id="panel-participantes" aria-labelledby="tab-participantes" hidden>
      <div class="fila" style="justify-content:space-between;margin-bottom:16px"><p style="color:var(--niebla)"><strong style="color:var(--nacar)">${t.inscripciones.length}</strong> inscritos de ${t.capacidad} plazas${T.plazas(t).pendientes ? ` · ${T.plazas(t).pendientes} por confirmar` : ''}</p></div>
      ${participantesHTML(t, js)}
      <p class="ayuda-tabla">Solo mostramos el nick, el nombre y la inicial del apellido. Los datos de contacto solo los ve la tienda.</p>
    </div>
    <div role="tabpanel" id="panel-competicion" aria-labelledby="tab-competicion" ${hayCompeticion ? '' : raw('hidden')}>${pestanaCompeticion(t, js)}</div>
  </div>
  <aside class="panel-inscripcion" id="inscripcion" aria-label="Inscripción">${panelInscripcion(t, ahora)}</aside>
</div>`;
}
