import { $, $$ } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import { pintarPortadaTorneos, type FiltroTorneos } from '../lib/vistas/portada-torneos.ts';
import { iniciarCuadros, iniciarCuentas } from './efectos.ts';

const f: FiltroTorneos = { fecha: 'todos', formato: 'todos', estado: 'todos' };

function pintar() {
  const v = pintarPortadaTorneos(cargar(), new Date(), f);
  const poner = (sel: string, h: string) => {
    const el = $(sel);
    if (el) el.innerHTML = h;
  };
  poner('[data-marcador]', v.marcador);
  poner('[data-destacado]', v.destacado);
  const juego = $('[data-en-juego]');
  if (juego && juego.innerHTML.trim() !== v.enJuego.trim()) {
    const sl = $('.cuadro-pista', juego)?.scrollLeft ?? 0;
    juego.innerHTML = v.enJuego;
    const p = $('.cuadro-pista', juego);
    if (p) p.scrollLeft = sl;
    iniciarCuadros(juego);
  }
  poner('[data-proximos]', v.proximos);
  poner('[data-ranking]', v.ranking);
  poner('[data-historial]', v.historial);
  $('[data-anuncio]')!.textContent = `${v.total} torneos`;
  iniciarCuentas();
}

for (const grupo of $$('[data-filtro]')) {
  grupo.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-v]');
    if (!b) return;
    for (const x of $$('[data-v]', grupo)) x.setAttribute('aria-pressed', String(x === b));
    (f as unknown as Record<string, string>)[grupo.dataset.filtro!] = b.dataset.v!;
    pintar();
  });
}

iniciarCuadros();
pintar();
suscribir(pintar);
setInterval(pintar, 60000);
