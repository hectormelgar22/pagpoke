import { $, $$, mueve } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import { recomendar, type Respuestas } from '../lib/asistente.ts';
import { guardado, productosEstado } from '../lib/estado-ligero.ts';
import { claveDia } from '../lib/fechas.ts';
import { destacado, tarjetaTorneo, podio, textoProximo, proximoConPlazas, rutaTorneo } from '../lib/vistas/torneo.ts';
import { calcularRanking, temporadaDe } from '../lib/ranking.ts';
import { iniciarCuentas } from './efectos.ts';
import { pintarProductos } from './app.ts';

/* Torneos con el estado guardado (inscripciones hechas en esta demo) */
function pintarTorneos() {
  const e = cargar();
  const ahora = new Date();
  const proximos = e.torneos.filter((t) => !t.finalizado && Date.parse(t.inicio) > ahora.getTime()).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const grande = proximos.find((t) => t.destacado) ?? proximos[0];
  const cont = $('[data-inicio-torneos]');
  if (cont) {
    cont.innerHTML = `${grande ? destacado(grande, ahora) : ''}<div class="rejilla-torneos">${proximos
      .filter((t) => t !== grande)
      .slice(0, 3)
      .map((t) => tarjetaTorneo(t, ahora))
      .join('')}</div>`;
    iniciarCuentas(cont);
  }
  const pod = $('[data-inicio-podio]');
  if (pod) pod.innerHTML = String(podio(calcularRanking(e.torneos, e.jugadores, temporadaDe(ahora.toISOString()).id), e.jugadores));
  const sig = $('[data-proximo-torneo]');
  const t = proximoConPlazas(proximos, ahora);
  if (sig && t) {
    sig.setAttribute('href', rutaTorneo(t));
    $('[data-texto]', sig)!.textContent = textoProximo(t, ahora);
  }
}
// El HTML ya viene con los torneos y el asistente calculados para el día en que se generó la web.
// Solo se repinta si hay cambios guardados en este navegador o si la web se generó otro día.
const ceder = () => new Promise<void>((r) => setTimeout(r, 0));
const generado = document.body.dataset.generado;
(async () => {
  iniciarCuentas();
  if (!guardado() && generado === claveDia(new Date())) return;
  await ceder();
  pintarTorneos();
  await ceder();
  pintarAsistente();
})();
suscribir(pintarTorneos);
setInterval(pintarTorneos, 60000);

/* Escaparate: pestañas y flechas del carrusel */
const carrusel = $('[data-carrusel]');
if (carrusel) {
  const pistaActiva = () => $$('[data-panel]', carrusel).find((p) => !p.hidden)!;
  const flechas = () => {
    const p = pistaActiva();
    const [a, s] = $$<HTMLButtonElement>('[data-mover]', carrusel);
    a.disabled = p.scrollLeft < 8;
    s.disabled = p.scrollLeft + p.clientWidth >= p.scrollWidth - 8;
  };
  carrusel.addEventListener('click', (ev) => {
    const tab = (ev.target as HTMLElement).closest<HTMLElement>('[data-lista]');
    if (tab) {
      for (const b of $$('[data-lista]', carrusel)) {
        const on = b === tab;
        b.setAttribute('aria-selected', String(on));
      }
      for (const p of $$('[data-panel]', carrusel)) p.hidden = p.dataset.panel !== tab.dataset.lista;
      pistaActiva().scrollLeft = 0;
      flechas();
    }
    const mover = (ev.target as HTMLElement).closest<HTMLElement>('[data-mover]');
    if (mover) {
      const p = pistaActiva();
      p.scrollBy({ left: +mover.dataset.mover! * p.clientWidth * 0.9, behavior: mueve() ? 'smooth' : 'auto' });
    }
  });
  for (const p of $$('[data-panel]', carrusel)) p.addEventListener('scroll', flechas, { passive: true });
  flechas();
}


/* Asistente de compra: reglas sencillas sobre el catálogo real */
const form = $<HTMLFormElement>('[data-asistente]');
const salida = $('[data-asistente-resultado]');
function pintarAsistente() {
  if (!form || !salida) return;
  salida.innerHTML = recomendar(Object.fromEntries(new FormData(form)) as unknown as Respuestas, productosEstado());
  pintarProductos();
}
form?.addEventListener('change', pintarAsistente);
form?.addEventListener('submit', (ev) => ev.preventDefault());
suscribir(pintarAsistente);
