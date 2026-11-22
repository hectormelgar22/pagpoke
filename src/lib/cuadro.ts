/* Eliminación directa: generación del cuadro, resultados y avance de ganadores.
   El cuadro es solo datos (rondas -> partidas); la parte visual lo dibuja a partir de aquí. */
import type { Partida } from './tipos.ts';

export function tamanoCuadro(n: number): number {
  let t = 2;
  while (t < n) t *= 2;
  return t;
}

/** Orden clásico de cabezas de serie: 1 contra el último, y 1 y 2 solo pueden cruzarse en la final. */
export function ordenSemillas(tamano: number): number[] {
  let orden = [1, 2];
  while (orden.length < tamano) {
    const n = orden.length * 2;
    orden = orden.flatMap((s) => [s, n + 1 - s]);
  }
  return orden;
}

export function ganador(p: Partida): string | null {
  if (p.bye) return p.a ?? p.b;
  if (p.estado !== 'finalizada' || p.ga == null || p.gb == null) return null;
  if (p.ga === p.gb) return null;
  return p.ga > p.gb ? p.a : p.b;
}

export function perdedor(p: Partida): string | null {
  const g = ganador(p);
  if (!g || p.bye) return null;
  return g === p.a ? p.b : p.a;
}

/** Crea el cuadro con los jugadores ordenados por cabeza de serie. Los huecos son pases directos. */
export function generarCuadro(jugadores: string[], prefijo: string): Partida[][] {
  if (jugadores.length < 2) throw new Error('Hacen falta al menos 2 jugadores para crear un cuadro.');
  const tam = tamanoCuadro(jugadores.length);
  const slots = ordenSemillas(tam).map((s) => jugadores[s - 1] ?? null);
  const rondas: Partida[][] = [];
  let enRonda = tam / 2;
  for (let r = 0; enRonda >= 1; r++, enRonda /= 2) {
    rondas.push(
      Array.from({ length: enRonda }, (_, i) => ({
        id: `${prefijo}-r${r + 1}-p${i + 1}`,
        a: r === 0 ? slots[2 * i] : null,
        b: r === 0 ? slots[2 * i + 1] : null,
        ga: null,
        gb: null,
        estado: 'pendiente' as const,
      })),
    );
  }
  for (const p of rondas[0]) {
    if (p.a === null || p.b === null) {
      p.bye = true;
      p.estado = 'finalizada';
    }
  }
  sincronizar(rondas);
  return rondas;
}

/** Coloca a cada ganador en su hueco de la ronda siguiente. Idempotente. */
export function sincronizar(rondas: Partida[][]): void {
  for (let r = 0; r < rondas.length - 1; r++) {
    rondas[r].forEach((p, i) => {
      const sig = rondas[r + 1][Math.floor(i / 2)];
      const lado = i % 2 === 0 ? 'a' : 'b';
      sig[lado] = ganador(p);
    });
  }
}

export function validarMarcador(ga: number, gb: number, mejorDe: 1 | 3, permiteEmpate = false): string | null {
  const necesarias = Math.ceil(mejorDe / 2);
  if (![ga, gb].every((x) => Number.isInteger(x) && x >= 0)) return 'El marcador no es válido.';
  if (ga === gb) return permiteEmpate ? (ga < necesarias ? null : 'El marcador no es válido.') : 'En eliminatoria no puede haber empate.';
  const max = Math.max(ga, gb);
  const min = Math.min(ga, gb);
  if (max !== necesarias || min >= necesarias) return `Al mejor de ${mejorDe}, el ganador debe llegar a ${necesarias}.`;
  return null;
}

export function buscar(rondas: Partida[][], id: string): { r: number; i: number } | null {
  for (let r = 0; r < rondas.length; r++) {
    const i = rondas[r].findIndex((p) => p.id === id);
    if (i >= 0) return { r, i };
  }
  return null;
}

/**
 * Guarda un resultado. Si cambia el ganador de una partida cuyo siguiente cruce ya se había jugado,
 * se anulan los resultados posteriores afectados (devuelve cuántos), para que el cuadro nunca sea incoherente.
 */
export function fijarResultado(rondas: Partida[][], id: string, ga: number, gb: number, mejorDe: 1 | 3): number {
  const pos = buscar(rondas, id);
  if (!pos) throw new Error('Partida no encontrada.');
  const p = rondas[pos.r][pos.i];
  if (p.bye) throw new Error('Un pase directo no tiene resultado.');
  if (!p.a || !p.b) throw new Error('Faltan jugadores en esta partida.');
  const error = validarMarcador(ga, gb, mejorDe);
  if (error) throw new Error(error);
  const antes = ganador(p);
  p.ga = ga;
  p.gb = gb;
  p.estado = 'finalizada';
  let anuladas = 0;
  if (antes && antes !== ganador(p)) anuladas = anularDesde(rondas, pos.r, pos.i);
  sincronizar(rondas);
  return anuladas;
}

function anularDesde(rondas: Partida[][], r: number, i: number): number {
  let n = 0;
  for (let rr = r + 1, ii = Math.floor(i / 2); rr < rondas.length; rr++, ii = Math.floor(ii / 2)) {
    const q = rondas[rr][ii];
    if (q.estado === 'finalizada' || q.estado === 'en-curso') {
      if (q.estado === 'finalizada') n++;
      q.ga = q.gb = null;
      q.estado = 'pendiente';
    } else break;
  }
  return n;
}

/** Deja una partida sin resultado (y anula lo que dependía de ella). */
export function borrarResultado(rondas: Partida[][], id: string): number {
  const pos = buscar(rondas, id);
  if (!pos) throw new Error('Partida no encontrada.');
  const p = rondas[pos.r][pos.i];
  if (p.bye) return 0;
  const tenia = ganador(p);
  p.ga = p.gb = null;
  p.estado = 'pendiente';
  const n = tenia ? anularDesde(rondas, pos.r, pos.i) : 0;
  sincronizar(rondas);
  return n;
}

export function marcarEnJuego(rondas: Partida[][], id: string): void {
  const pos = buscar(rondas, id);
  if (!pos) throw new Error('Partida no encontrada.');
  const p = rondas[pos.r][pos.i];
  if (!p.a || !p.b || p.estado === 'finalizada') throw new Error('Esta partida no se puede empezar todavía.');
  p.estado = 'en-curso';
}

export function campeon(rondas: Partida[][] | null): string | null {
  if (!rondas?.length) return null;
  return ganador(rondas[rondas.length - 1][0]);
}

export function completo(rondas: Partida[][] | null): boolean {
  return !!rondas && campeon(rondas) !== null;
}

export function nombreRonda(total: number, r: number): string {
  const desdeFinal = total - 1 - r;
  return (
    ['Final', 'Semifinales', 'Cuartos de final', 'Octavos de final', 'Dieciseisavos'][desdeFinal] ?? `Ronda ${r + 1}`
  );
}

/** Puesto final de cada jugador en un cuadro terminado: 1, 2, 3 (semis), 5 (cuartos), 9… */
export function puestosCuadro(rondas: Partida[][]): Map<string, number> {
  const out = new Map<string, number>();
  const total = rondas.length;
  const c = campeon(rondas);
  if (c) out.set(c, 1);
  for (let r = total - 1; r >= 0; r--) {
    const puesto = r === total - 1 ? 2 : 2 ** (total - 1 - r) + 1;
    for (const p of rondas[r]) {
      const x = perdedor(p);
      if (x && !out.has(x)) out.set(x, puesto);
    }
  }
  return out;
}
