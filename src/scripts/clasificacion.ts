import { $, $$, abrir, normalizar } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import { calcularRanking, temporadaDe } from '../lib/ranking.ts';
import { podio, tablaRanking } from '../lib/vistas/torneo.ts';
import { fechaMedia } from '../lib/fechas.ts';
import { esc } from '../lib/html.ts';
import { tienda } from '../data/tienda.ts';

let temp = temporadaDe(new Date().toISOString()).id;
let filtro = '';

function pintar() {
  const e = cargar();
  const rk = calcularRanking(e.torneos, e.jugadores, temp, tienda.ranking);
  $('[data-podio]')!.innerHTML = filtro ? '' : String(podio(rk, e.jugadores));
  const visibles = filtro ? rk.filter((f) => normalizar(`${e.jugadores[f.jugadorId]?.nick} ${e.jugadores[f.jugadorId]?.nombre}`).includes(filtro)) : rk;
  const tabla = String(tablaRanking(rk, e.jugadores));
  $('[data-tabla]')!.innerHTML = rk.length ? tabla : '<p class="vacio">No hay torneos finalizados en esta temporada.</p>';
  if (filtro) for (const tr of $$<HTMLTableRowElement>('[data-tabla] tbody tr')) tr.hidden = !visibles.some((v) => v.jugadorId === tr.dataset.jugador);
}

$('[data-temporadas]')!.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-temp]');
  if (!b) return;
  temp = b.dataset.temp!;
  for (const x of $$('[data-temp]')) x.setAttribute('aria-pressed', String(x === b));
  pintar();
});
$<HTMLInputElement>('[data-buscar-jugador]')!.addEventListener('input', (ev) => {
  filtro = normalizar((ev.target as HTMLInputElement).value);
  pintar();
});

document.addEventListener('click', (ev) => {
  const fila = (ev.target as HTMLElement).closest<HTMLElement>('[data-tabla] tr[data-jugador], [data-podio] li[data-jugador]');
  if (!fila || (ev.target as HTMLElement).closest('a')) return;
  const e = cargar();
  const rk = calcularRanking(e.torneos, e.jugadores, temp, tienda.ranking);
  const i = rk.findIndex((f) => f.jugadorId === fila.dataset.jugador);
  const f = rk[i];
  const j = e.jugadores[f.jugadorId];
  $('[data-jug-pos]')!.textContent = `${i + 1}º · ${f.puntos} puntos`;
  $('[data-jug-nick]')!.textContent = `${j.nick} · ${j.nombre}`;
  $('[data-jug-cuerpo]')!.innerHTML = `<ul class="resumen-condiciones" role="list">
    <li><span>Torneos jugados</span><strong>${f.torneos}</strong></li>
    <li><span>Partidas (V-D-E)</span><strong class="cifra">${f.victorias}-${f.derrotas}-${f.empates}</strong></li>
    <li><span>Victorias</span><strong>${Math.round(f.pctVictorias * 100)} %</strong></li>
    <li><span>Títulos</span><strong>${f.titulos}</strong></li></ul>
    <p class="etiqueta">Resultados</p>
    <ul class="resultados" role="list">${f.resultados.map((r) => `<li><a href="/torneos/${r.slug}/"><span><strong>${esc(r.etiqueta)} · ${esc(r.torneo)}</strong><small>${fechaMedia(r.fecha)}</small></span></a></li>`).join('')}</ul>`;
  abrir('dlg-jugador');
});

pintar();
suscribir(pintar);
