/* Efectos reutilizables: cuentas atrás, inclinación holográfica y seguimiento de jugadores en cuadros. */
import { $$, mueve } from './ui.ts';
import { cuentaAtras } from '../lib/fechas.ts';

let reloj: number | undefined;
export function iniciarCuentas(raiz: ParentNode = document) {
  const cajas = $$('[data-cuenta-atras]', raiz);
  const pintar = () => {
    for (const c of $$('[data-cuenta-atras]')) {
      const r = cuentaAtras(c.dataset.cuentaAtras!, new Date());
      if (!r) {
        c.hidden = true; // nunca se muestra una cuenta atrás de algo que ya ha empezado
        continue;
      }
      for (const k of ['dias', 'horas', 'min', 'seg'] as const) {
        const el = c.querySelector(`[data-u="${k}"]`);
        if (el) el.textContent = String(r[k]).padStart(2, '0');
      }
    }
  };
  pintar();
  if (cajas.length && !reloj) reloj = window.setInterval(pintar, 1000);
}
iniciarCuentas();

/** Cuadros: navegación por rondas en móvil y "seguir a un jugador". */
export function iniciarCuadros(raiz: ParentNode = document) {
  for (const c of $$('[data-cuadro]', raiz)) {
    const pista = c.querySelector<HTMLElement>('.cuadro-pista')!;
    c.addEventListener('click', (ev) => {
      const t = ev.target as HTMLElement;
      const ir = t.closest<HTMLElement>('[data-ir-ronda]');
      if (ir) {
        const col = c.querySelector<HTMLElement>(`[data-ronda="${ir.dataset.irRonda}"]`);
        if (col) pista.scrollTo({ left: col.offsetLeft - pista.offsetLeft - 4, behavior: mueve() ? 'smooth' : 'auto' });
        return;
      }
      if (t.closest('[data-editar-partida]')) return;
      const j = t.closest<HTMLElement>('.cj[data-jugador]');
      if (!j) return;
      const id = j.dataset.jugador!;
      const ya = c.classList.contains('siguiendo') && c.dataset.sigue === id;
      c.classList.toggle('siguiendo', !ya);
      c.dataset.sigue = ya ? '' : id;
      for (const cr of $$('.cruce', c)) cr.classList.toggle('camino', !ya && (cr.dataset.jugadores ?? '').split(' ').includes(id));
      for (const x of $$('.cj', c)) x.classList.toggle('seguido', !ya && x.dataset.jugador === id);
    });
    // Marca la ronda visible en la navegación móvil
    const chips = $$<HTMLElement>('[data-ir-ronda]', c);
    pista.addEventListener('scroll', () => {
      const cols = $$<HTMLElement>('.cuadro-ronda', c);
      const x = pista.scrollLeft + 10;
      let activa = 0;
      cols.forEach((col, i) => {
        if (col.offsetLeft - pista.offsetLeft <= x) activa = i;
      });
      chips.forEach((ch, i) => ch.setAttribute('aria-pressed', String(i === activa)));
    }, { passive: true });
  }
}
