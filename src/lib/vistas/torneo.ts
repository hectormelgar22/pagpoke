/* Vistas de torneos: tarjetas, barra de plazas, cuadro eliminatorio, suizo, participantes y ranking.
   Todo se pinta a partir de los datos: el mismo código sirve para la web pública y para el panel. */
import type { EstadoTorneo, Jugador, Partida, Torneo } from '../tipos.ts';
import { html, raw, type Seguro } from '../html.ts';
import { icono } from '../iconos.ts';
import { fechaCorta, fechaLarga, hora, diaNumero, mesCorto, relativa } from '../fechas.ts';
import * as T from '../torneo.ts';
import { ganador, nombreRonda } from '../cuadro.ts';
import { clasificacionSuiza } from '../suizo.ts';
import type { FilaRanking } from '../ranking.ts';

export type Jugadores = Record<string, Jugador>;
const nickDe = (js: Jugadores) => (id: string) => js[id]?.nick ?? '—';

/** Torneos de la semilla tienen página propia; los creados en el panel usan la página genérica. */
export const rutaTorneo = (t: Torneo) => (t.creadoEnPanel ? `/torneos/evento/?id=${encodeURIComponent(t.id)}` : `/torneos/${t.slug}/`);
export const numTorneo = (t: Torneo) => `Nº ${String(t.numero).padStart(3, '0')}`;

export function pillEstado(e: EstadoTorneo, extra = '') {
  return html`<span class="pill pill--${e} ${extra}">${T.ETIQUETA_ESTADO[e]}</span>`;
}

export function barraPlazas(t: Torneo, compacta = false) {
  const p = T.plazas(t);
  const lleno = p.libres === 0;
  return html`<div class="plazas${compacta ? ' plazas--compacta' : ''}" data-plazas="${t.id}">
  <p class="plazas-num"><strong class="cifra">${p.ocupadas}</strong><span class="cifra"> / ${t.capacidad}</span> participantes</p>
  <div class="barra${lleno ? ' barra--llena' : p.libres <= T.umbralUltimas(t.capacidad) ? ' barra--casi' : ''}" role="progressbar" aria-label="Plazas ocupadas" aria-valuemin="0" aria-valuemax="${t.capacidad}" aria-valuenow="${p.ocupadas}">
    <span style="--p:${p.pct.toFixed(3)}"></span>
  </div>
  <p class="plazas-libres">${lleno ? (t.listaEspera.length ? `Completo · ${t.listaEspera.length} en lista de espera` : 'Completo') : `${p.libres} ${p.libres === 1 ? 'plaza libre' : 'plazas libres'}`}${p.pendientes ? ` · ${p.pendientes} por confirmar` : ''}</p>
</div>`;
}

function botonPrincipal(t: Torneo, e: EstadoTorneo) {
  const url = rutaTorneo(t);
  if (T.admiteInscripcion(e)) return html`<a class="btn btn--acento btn--peq" href="${url}#inscripcion">Inscribirme</a>`;
  if (T.admiteEspera(e)) return html`<a class="btn btn--fantasma btn--peq" href="${url}#inscripcion">Lista de espera</a>`;
  if (e === 'en-curso' || e === 'finalizado') return html`<a class="btn btn--fantasma btn--peq" href="${url}#competicion">${e === 'en-curso' ? 'Seguir el cuadro' : 'Ver resultados'}</a>`;
  return '';
}

export function portadaTorneo(t: Torneo) {
  return html`<div class="tt-portada tema-${t.tema}" aria-hidden="true">
  <span class="tt-portada-num">${String(t.numero).padStart(3, '0')}</span>
  <span class="tt-portada-mod">${t.modalidad}</span>
  ${raw(icono(t.tipo === 'presentacion' ? 'cartas' : t.formato === 'eliminacion' ? 'trofeo' : 'usuarios', 'tt-portada-ico'))}
</div>`;
}

export function tarjetaTorneo(t: Torneo, ahora: Date) {
  const e = T.estadoTorneo(t, ahora);
  return html`<article class="torneo-tarjeta tema-${t.tema}" data-torneo="${t.id}" data-estado="${e}" data-formato="${t.formato}" data-inicio="${t.inicio}">
  ${portadaTorneo(t)}
  <div class="tt-cuerpo">
    <div class="tt-cab"><span class="mono tt-num">${numTorneo(t)}</span>${pillEstado(e)}</div>
    <h3 class="tt-nombre"><a href="${rutaTorneo(t)}">${t.nombre}</a></h3>
    <ul class="tt-datos" role="list">
      <li>${raw(icono('calendario'))}<span><time datetime="${t.inicio}">${fechaCorta(t.inicio)}</time> · ${hora(t.inicio)} <small>(${relativa(t.inicio, ahora)})</small></span></li>
      <li>${raw(icono('trofeo'))}<span>${T.ETIQUETA_FORMATO[t.formato]} · ${t.modalidad}</span></li>
      <li>${raw(icono('ubicacion'))}<span>${t.ubicacion} · ${T.precioTexto(t.precio)}</span></li>
    </ul>
    ${e === 'en-curso' || e === 'finalizado' ? resumenCompeticion(t) : barraPlazas(t, true)}
    <div class="tt-acciones"><a class="btn btn--suave btn--peq" href="${rutaTorneo(t)}">Ver torneo</a>${botonPrincipal(t, e)}</div>
  </div>
</article>`;
}

function resumenCompeticion(t: Torneo) {
  const jugadas = T.partidasJugadas(t).length;
  const total = [...t.suizo.flat(), ...(t.cuadro?.flat() ?? [])].filter((p) => !p.bye).length;
  return html`<div class="plazas plazas--compacta"><p class="plazas-num"><strong class="cifra">${jugadas}</strong><span class="cifra"> / ${total}</span> partidas jugadas</p>
  <div class="barra barra--vivo"><span style="--p:${total ? (jugadas / total).toFixed(3) : 0}"></span></div><p class="plazas-libres">${t.inscripciones.length} jugadores</p></div>`;
}

/** Bloque grande para el próximo gran evento, con cuenta atrás (solo si es futuro). */
export function destacado(t: Torneo, ahora: Date) {
  const e = T.estadoTorneo(t, ahora);
  const futuro = T.esFuturo(t, ahora);
  return html`<article class="destacado tema-${t.tema}" data-torneo="${t.id}">
  <div class="destacado-texto">
    <div class="fila"><span class="etiqueta">${raw(icono('destello'))}Próximo gran evento · ${numTorneo(t)}</span>${pillEstado(e)}</div>
    <h3 class="h2">${t.nombre}</h3>
    <p class="entradilla">${t.resumen}</p>
    <ul class="destacado-datos" role="list">
      <li><span class="etiqueta">Fecha</span><strong>${fechaLarga(t.inicio)}</strong></li>
      <li><span class="etiqueta">Hora</span><strong class="cifra">${hora(t.inicio)}</strong></li>
      <li><span class="etiqueta">Formato</span><strong>${T.ETIQUETA_FORMATO[t.formato]}${t.topCorte ? ` ${t.topCorte}` : ''}</strong></li>
      <li><span class="etiqueta">Inscripción</span><strong>${T.precioTexto(t.precio)}</strong></li>
    </ul>
    ${barraPlazas(t)}
    <div class="fila">${botonPrincipal(t, e)}<a class="btn btn--fantasma btn--peq" href="${rutaTorneo(t)}">Ver todos los detalles</a></div>
  </div>
  ${futuro ? cuentaAtras(t.inicio) : ''}
</article>`;
}

export function cuentaAtras(iso: string) {
  return html`<div class="cuenta-atras" data-cuenta-atras="${iso}" aria-label="Tiempo hasta el inicio">
  ${(['dias', 'horas', 'min', 'seg'] as const).map((k) => html`<div><span class="cifra" data-u="${k}">--</span><small>${{ dias: 'días', horas: 'horas', min: 'min', seg: 'seg' }[k]}</small></div>`)}
</div>`;
}

/* ---------- Cuadro eliminatorio ---------- */
function filaJugador(p: Partida, lado: 'a' | 'b', js: Jugadores, semillas: Map<string, number>) {
  const id = p[lado];
  const g = ganador(p);
  const marc = lado === 'a' ? p.ga : p.gb;
  if (!id) {
    return html`<div class="cj cj--vacio"><span class="cj-seed"></span><span class="cj-nick">${p.bye ? 'Pase directo' : 'Por decidir'}</span><span class="cj-marc"></span></div>`;
  }
  const clase = g ? (g === id ? ' cj--gana' : ' cj--pierde') : '';
  return html`<div class="cj${clase}" data-jugador="${id}"><span class="cj-seed cifra">${semillas.get(id) ?? ''}</span><span class="cj-nick">${js[id]?.nick ?? '—'}</span><span class="cj-marc cifra">${p.bye ? '' : marc ?? ''}</span></div>`;
}

export interface OpcionesCuadro {
  editable?: boolean;
  titulo?: string;
}

export function cuadroHTML(t: Torneo, rondas: Partida[][], js: Jugadores, op: OpcionesCuadro = {}): Seguro {
  // Cabeza de serie = orden de entrada al cuadro (inscripción, o clasificación suiza en un top)
  const orden =
    t.formato === 'eliminacion' ? T.participantes(t) : clasificacionSuiza(t.suizo, T.participantes(t), nickDe(js)).map((f) => f.jugadorId);
  const semillas = new Map(orden.map((id, i) => [id, i + 1]));
  const total = rondas.length;
  const campeonId = ganador(rondas[total - 1][0]);
  return html`<div class="cuadro${op.editable ? ' cuadro--editable' : ''}" style="--rondas:${total}" data-cuadro>
  <div class="cuadro-nav" role="group" aria-label="Elegir ronda">
    ${rondas.map((_, r) => html`<button type="button" class="chip" data-ir-ronda="${r}" aria-pressed="${r === 0}">${nombreRonda(total, r)}</button>`)}
    <button type="button" class="chip" data-ir-ronda="${total}" aria-pressed="false">Campeón</button>
  </div>
  <div class="cuadro-pista" tabindex="0" aria-label="Cuadro de ${t.nombre}">
    ${rondas.map(
      (ronda, r) => html`<section class="cuadro-ronda" data-ronda="${r}" aria-label="${nombreRonda(total, r)}">
      <h4 class="cuadro-titulo">${nombreRonda(total, r)}<span>${ronda.filter((p) => p.estado === 'finalizada' && !p.bye).length}/${ronda.filter((p) => !p.bye).length}</span></h4>
      <ol class="cuadro-partidas" role="list">
        ${ronda.map(
          (p) => html`<li class="cruce cruce--${p.bye ? 'bye' : p.estado}" data-partida="${p.id}" data-jugadores="${[p.a, p.b].filter(Boolean).join(' ')}">
          <div class="cruce-caja">
            ${filaJugador(p, 'a', js, semillas)}${filaJugador(p, 'b', js, semillas)}
            <span class="cruce-estado">${p.bye ? 'Pase directo' : p.estado === 'en-curso' ? 'En juego' : p.estado === 'finalizada' ? 'Finalizada' : 'Pendiente'}</span>
            ${op.editable && !p.bye && p.a && p.b ? html`<button type="button" class="cruce-editar" data-editar-partida="${p.id}" aria-label="Resultado: ${js[p.a]?.nick} contra ${js[p.b]?.nick}">${raw(icono('editar'))}</button>` : ''}
          </div>
        </li>`,
        )}
      </ol>
    </section>`,
    )}
    <section class="cuadro-ronda cuadro-final" data-ronda="${total}" aria-label="Campeón">
      <h4 class="cuadro-titulo">Campeón</h4>
      <div class="campeon-caja${campeonId ? ' campeon-caja--si' : ''}">
        ${raw(icono('trofeo', 'campeon-trofeo'))}
        ${campeonId ? html`<p class="campeon-nick">${js[campeonId]?.nick}</p><p class="campeon-nombre">${js[campeonId]?.nombre}</p>` : html`<p class="campeon-nombre">Por decidir</p>`}
      </div>
    </section>
  </div>
  <p class="cuadro-ayuda">${raw(icono('info'))}Toca un jugador para seguir su camino en el cuadro.</p>
</div>`;
}

/* ---------- Sistema suizo ---------- */
export function tablaSuiza(t: Torneo, js: Jugadores) {
  const filas = clasificacionSuiza(t.suizo, T.participantes(t), nickDe(js));
  const corte = t.formato === 'suizo-top' ? t.topCorte : 0;
  if (!t.suizo.length) return html`<p class="vacio">La clasificación aparecerá cuando empiece la primera ronda.</p>`;
  return html`<div class="tabla-envoltura"><table class="tabla tabla-suiza">
  <caption class="solo-lector">Clasificación tras ${t.suizo.length} rondas</caption>
  <thead><tr><th scope="col">Pos.</th><th scope="col">Jugador</th><th scope="col" class="num">V-D-E</th><th scope="col" class="num">Puntos</th><th scope="col" class="num col-opc" title="Porcentaje de victorias de los rivales (desempate)">Rivales</th><th scope="col" class="num col-opc">Dif.</th></tr></thead>
  <tbody>${filas.map(
    (f, i) => html`<tr class="${corte && i < corte ? 'en-corte' : ''}${corte && i === corte - 1 ? ' linea-corte' : ''}" data-jugador="${f.jugadorId}">
    <td class="cifra pos">${i + 1}</td><th scope="row"><span class="jug-nick">${js[f.jugadorId]?.nick}</span><span class="jug-nombre">${js[f.jugadorId]?.nombre}</span></th>
    <td class="num cifra">${f.v}-${f.d}-${f.e}</td><td class="num cifra fuerte">${f.puntos}</td><td class="num cifra col-opc">${(f.rivales * 100).toFixed(1)} %</td><td class="num cifra col-opc">${f.dif > 0 ? '+' : ''}${f.dif}</td></tr>`,
  )}</tbody></table></div>
  ${corte ? html`<p class="ayuda-tabla">Los ${corte} primeros pasan al top ${corte} en eliminación directa. Desempate: puntos, porcentaje de victorias de los rivales y diferencia de juegos.</p>` : html`<p class="ayuda-tabla">3 puntos por victoria, 1 por empate. Desempate: porcentaje de victorias de los rivales y diferencia de juegos.</p>`}`;
}

export function rondasSuizas(t: Torneo, js: Jugadores, op: { editable?: boolean } = {}) {
  if (!t.suizo.length) return '';
  const ultima = t.suizo.length - 1;
  return html`<div class="rondas-suizas" data-rondas>
  <div class="chips" role="group" aria-label="Elegir ronda">${t.suizo.map((_, r) => html`<button type="button" class="chip" data-ver-ronda="${r}" aria-pressed="${r === ultima}">Ronda ${r + 1}</button>`)}</div>
  ${t.suizo.map(
    (ronda, r) => html`<div class="ronda-suiza" data-ronda-suiza="${r}" ${r === ultima ? '' : raw('hidden')}>
    <ul class="emparejamientos" role="list">${ronda.map((p) => {
      const g = ganador(p);
      const empate = p.estado === 'finalizada' && !p.bye && p.ga === p.gb;
      return html`<li class="emp emp--${p.bye ? 'bye' : p.estado}" data-jugadores="${[p.a, p.b].filter(Boolean).join(' ')}">
      <span class="emp-mesa mono">${p.bye ? 'Bye' : `Mesa ${p.mesa ?? ''}`}</span>
      <span class="emp-j${g && g === p.a ? ' gana' : ''}">${js[p.a ?? '']?.nick ?? '—'}</span>
      <span class="emp-res cifra">${p.bye ? 'Pase' : p.estado === 'finalizada' ? (empate ? `${p.ga}-${p.gb} (empate)` : `${p.ga}-${p.gb}`) : p.estado === 'en-curso' ? 'En juego' : 'vs'}</span>
      <span class="emp-j emp-j--b${g && g === p.b ? ' gana' : ''}">${p.bye ? '' : js[p.b ?? '']?.nick ?? '—'}</span>
      ${op.editable && !p.bye && r === ultima && !t.cuadro && !t.finalizado ? html`<button type="button" class="btn-icono" data-editar-partida="${p.id}" aria-label="Resultado de la mesa ${p.mesa}">${raw(icono('editar'))}</button>` : ''}
    </li>`;
    })}</ul></div>`,
  )}
</div>`;
}

/* ---------- Participantes ---------- */
export function participantesHTML(t: Torneo, js: Jugadores) {
  const p = T.plazas(t);
  const libres = Math.min(p.libres, 8);
  return html`<ol class="participantes" role="list">
  ${t.inscripciones.map((i, n) => {
    const j = js[i.jugadorId];
    return html`<li class="participante${i.estado === 'pendiente' ? ' participante--pend' : ''}" data-jugador="${i.jugadorId}">
      <span class="part-num cifra">${String(n + 1).padStart(2, '0')}</span>
      <span class="part-avatar" aria-hidden="true" style="--h:${(hash(j?.nick ?? '') % 360)}">${(j?.nick ?? '?').slice(0, 2)}</span>
      <span class="part-texto"><strong>${j?.nick ?? '—'}</strong><small>${j?.nombre ?? ''} · ${T.ETIQUETA_DIVISION[j?.division ?? 'master']}</small></span>
      ${i.estado === 'pendiente' ? html`<span class="part-estado">Por confirmar</span>` : ''}
    </li>`;
  })}
  ${Array.from({ length: libres }, (_, k) => html`<li class="participante participante--libre"><span class="part-num cifra">${String(t.inscripciones.length + k + 1).padStart(2, '0')}</span><span class="part-texto"><strong>Plaza libre</strong></span></li>`)}
  ${p.libres > libres ? html`<li class="participante participante--libre participante--resto"><span class="part-texto"><strong>+${p.libres - libres} plazas libres</strong></span></li>` : ''}
</ol>
${t.listaEspera.length ? html`<h4 class="h3" style="margin-top:28px">Lista de espera</h4><ol class="participantes participantes--espera" role="list">${t.listaEspera.map((i, n) => html`<li class="participante"><span class="part-num cifra">E${n + 1}</span><span class="part-texto"><strong>${js[i.jugadorId]?.nick}</strong><small>${js[i.jugadorId]?.nombre}</small></span></li>`)}</ol>` : ''}`;
}

export function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/* ---------- Ranking ---------- */
export function podio(filas: FilaRanking[], js: Jugadores) {
  const top = filas.slice(0, 3);
  if (!top.length) return '';
  const orden = [top[1], top[0], top[2]].filter(Boolean);
  return html`<ol class="podio" role="list">${orden.map((f) => {
    const pos = filas.indexOf(f) + 1;
    const j = js[f.jugadorId];
    return html`<li class="podio-${pos}" data-jugador="${f.jugadorId}">
      <span class="podio-avatar" style="--h:${hash(j?.nick ?? '') % 360}" aria-hidden="true">${(j?.nick ?? '').slice(0, 2)}</span>
      <p class="podio-nick">${j?.nick}</p><p class="podio-nombre">${j?.nombre}</p>
      <p class="podio-puntos cifra"><strong>${f.puntos}</strong> pts</p>
      <div class="podio-base"><span class="podio-pos">${pos}</span><small>${f.titulos ? `${f.titulos} ${f.titulos === 1 ? 'título' : 'títulos'}` : `${f.torneos} torneos`}</small></div>
    </li>`;
  })}</ol>`;
}

export function filasRanking(filas: FilaRanking[], js: Jugadores, desde = 0, hasta = filas.length) {
  return filas.slice(desde, hasta).map((f, k) => {
    const i = desde + k;
    const j = js[f.jugadorId];
    return html`<tr data-jugador="${f.jugadorId}" class="${i < 3 ? `top top-${i + 1}` : ''}">
    <td class="cifra pos">${i + 1}</td>
    <th scope="row"><span class="jug-nick">${j?.nick}</span><span class="jug-nombre">${j?.nombre}</span></th>
    <td class="num cifra fuerte">${f.puntos}</td>
    <td class="num cifra col-opc">${f.torneos}</td>
    <td class="num cifra col-opc">${f.victorias}</td>
    <td class="num cifra">${Math.round(f.pctVictorias * 100)} %</td>
    <td class="ultimos col-opc">${f.resultados.slice(0, 5).map((r) => html`<a href="/torneos/${r.slug}/" class="res res--${r.puesto === 1 ? 'oro' : r.puesto <= 2 ? 'plata' : r.puesto <= 4 ? 'bronce' : 'otro'}" title="${r.torneo} · ${fechaCorta(r.fecha)}">${r.etiqueta}</a>`)}</td>
  </tr>`;
  });
}

export function tablaRanking(filas: FilaRanking[], js: Jugadores, limite?: number) {
  return html`<div class="tabla-envoltura"><table class="tabla tabla-ranking">
  <caption class="solo-lector">Clasificación de jugadores</caption>
  <thead><tr><th scope="col">Pos.</th><th scope="col">Jugador</th><th scope="col" class="num">Puntos</th><th scope="col" class="num col-opc">Torneos</th><th scope="col" class="num col-opc">Victorias</th><th scope="col" class="num">% vict.</th><th scope="col" class="col-opc">Últimos resultados</th></tr></thead>
  <tbody>${filasRanking(filas, js, 0, limite ?? filas.length)}</tbody></table></div>`;
}

/* ---------- Historial ---------- */
export function tarjetaHistorial(t: Torneo, js: Jugadores) {
  const puestos = T.puestosFinales(t, nickDe(js));
  const c = [...puestos].find(([, p]) => p === 1)?.[0];
  const f = [...puestos].find(([, p]) => p === 2)?.[0];
  return html`<article class="historial-tarjeta tema-${t.tema}" data-formato="${t.formato}" data-inicio="${t.inicio}">
  <div class="ht-fecha"><span class="ht-dia cifra">${diaNumero(t.inicio)}</span><span class="ht-mes">${mesCorto(t.inicio)}</span></div>
  <div class="ht-cuerpo">
    <p class="mono ht-num">${numTorneo(t)} · ${T.ETIQUETA_FORMATO[t.formato]} · ${t.inscripciones.length} jugadores</p>
    <h3 class="h3"><a href="${rutaTorneo(t)}">${t.nombre}</a></h3>
    <p class="ht-campeon">${raw(icono('trofeo'))}<span><small>Campeón</small><strong>${c ? js[c]?.nick : '—'}</strong></span></p>
    ${f ? html`<p class="ht-finalista"><small>Finalista</small> ${js[f]?.nick}</p>` : ''}
  </div>
</article>`;
}
