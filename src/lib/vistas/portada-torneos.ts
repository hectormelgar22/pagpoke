/* Bloques de la portada de torneos (servidor y navegador). */
import type { EstadoDemo, Torneo } from '../tipos.ts';
import { html, raw } from '../html.ts';
import { icono } from '../iconos.ts';
import { estadoTorneo, partidasJugadas } from '../torneo.ts';
import { calcularRanking, temporadaDe } from '../ranking.ts';
import { destacado, tarjetaTorneo, tablaRanking, tarjetaHistorial, cuadroHTML, tablaSuiza, rutaTorneo, numTorneo } from './torneo.ts';

export interface FiltroTorneos {
  fecha: 'todos' | '7' | '30';
  formato: 'todos' | Torneo['formato'];
  estado: 'todos' | 'abiertas' | 'completo' | 'proximamente' | 'cerradas';
}

export function proximos(e: EstadoDemo, ahora: Date) {
  return e.torneos.filter((t) => !t.finalizado && Date.parse(t.inicio) > ahora.getTime()).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

export function filtrarProximos(lista: Torneo[], f: FiltroTorneos, ahora: Date) {
  return lista.filter((t) => {
    if (f.fecha !== 'todos' && Date.parse(t.inicio) - ahora.getTime() > +f.fecha * 864e5) return false;
    if (f.formato !== 'todos' && t.formato !== f.formato) return false;
    const est = estadoTorneo(t, ahora);
    if (f.estado === 'abiertas' && est !== 'abiertas' && est !== 'ultimas-plazas') return false;
    if (f.estado !== 'todos' && f.estado !== 'abiertas' && est !== f.estado) return false;
    return true;
  });
}

export function pintarPortadaTorneos(e: EstadoDemo, ahora: Date, f: FiltroTorneos = { fecha: 'todos', formato: 'todos', estado: 'todos' }) {
  const temp = temporadaDe(ahora.toISOString()).id;
  const deTemporada = e.torneos.filter((t) => t.finalizado && temporadaDe(t.inicio).id === temp);
  const jugadores = new Set(deTemporada.flatMap((t) => t.inscripciones.map((i) => i.jugadorId)));
  const partidas = deTemporada.reduce((s, t) => s + partidasJugadas(t).length, 0);
  const prox = proximos(e, ahora);
  const grande = prox.find((t) => t.destacado);
  const enCurso = e.torneos.filter((t) => estadoTorneo(t, ahora) === 'en-curso');
  const lista = filtrarProximos(prox.filter((t) => t !== grande || f.fecha !== 'todos' || f.formato !== 'todos' || f.estado !== 'todos'), f, ahora);
  const rk = calcularRanking(e.torneos, e.jugadores, temp);
  const pasados = e.torneos.filter((t) => t.finalizado).sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));

  return {
    marcador: String(html`<div><strong>${deTemporada.length}</strong><span>torneos esta temporada</span></div>
      <div><strong>${jugadores.size}</strong><span>jugadores distintos</span></div>
      <div><strong>${partidas}</strong><span>partidas registradas</span></div>
      <div><strong>${prox.length}</strong><span>torneos en el calendario</span></div>`),
    destacado: grande ? String(destacado(grande, ahora)) : '',
    enJuego: enCurso.length
      ? String(html`<div class="cab-seccion"><div><p class="etiqueta"><span class="punto-vivo abierto"></span>En juego ahora</p><h2 class="h2">${enCurso[0].nombre}</h2>
          <p class="entradilla">${numTorneo(enCurso[0])} · ${partidasJugadas(enCurso[0]).length} partidas jugadas. Los resultados los publica la tienda al terminar cada partida.</p></div>
          <a class="btn btn--acento" href="${rutaTorneo(enCurso[0])}#competicion">Abrir el torneo ${raw(icono('flecha'))}</a></div>
          ${enCurso[0].cuadro ? cuadroHTML(enCurso[0], enCurso[0].cuadro, e.jugadores) : tablaSuiza(enCurso[0], e.jugadores)}`)
      : '',
    proximos: lista.length
      ? lista.map((t) => String(tarjetaTorneo(t, ahora))).join('')
      : String(html`<div class="vacio" style="grid-column:1/-1">${raw(icono('calendario'))}<p>No hay torneos con esos filtros. Prueba con otras fechas o mira la agenda completa.</p><a class="btn btn--fantasma" href="/agenda/">Ver agenda</a></div>`),
    ranking: rk.length ? String(tablaRanking(rk, e.jugadores, 8, true)) : '<p class="vacio">Aún no hay torneos finalizados esta temporada.</p>',
    historial: pasados.slice(0, 3).map((t) => String(tarjetaHistorial(t, e.jugadores))).join(''),
    total: lista.length,
  };
}
