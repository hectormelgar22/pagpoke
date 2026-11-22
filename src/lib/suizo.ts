/* Sistema suizo: clasificación, emparejamientos y corte a eliminatoria (top 8, top 4…). */
import type { Partida } from './tipos.ts';
import { validarMarcador } from './cuadro.ts';

export interface FilaSuiza {
  jugadorId: string;
  v: number;
  d: number;
  e: number;
  puntos: number;
  /** Porcentaje de victorias de los rivales (con suelo del 25 %), desempate habitual en Pokémon TCG. */
  rivales: number;
  /** Diferencia de juegos ganados y perdidos. */
  dif: number;
  jugadas: number;
  byes: number;
}

export const PUNTOS = { victoria: 3, empate: 1, derrota: 0 };

function vacia(id: string): FilaSuiza {
  return { jugadorId: id, v: 0, d: 0, e: 0, puntos: 0, rivales: 0, dif: 0, jugadas: 0, byes: 0 };
}

export function clasificacionSuiza(rondas: Partida[][], jugadores: string[], nickDe: (id: string) => string = (x) => x): FilaSuiza[] {
  const filas = new Map(jugadores.map((id) => [id, vacia(id)]));
  const rivalesDe = new Map<string, string[]>(jugadores.map((id) => [id, []]));
  const fila = (id: string) => {
    if (!filas.has(id)) {
      filas.set(id, vacia(id));
      rivalesDe.set(id, []);
    }
    return filas.get(id)!;
  };

  for (const ronda of rondas) {
    for (const p of ronda) {
      if (p.estado !== 'finalizada') continue;
      if (p.bye) {
        const x = fila((p.a ?? p.b)!);
        x.v++;
        x.byes++;
        x.puntos += PUNTOS.victoria;
        continue;
      }
      if (!p.a || !p.b || p.ga == null || p.gb == null) continue;
      const A = fila(p.a);
      const B = fila(p.b);
      A.jugadas++;
      B.jugadas++;
      A.dif += p.ga - p.gb;
      B.dif += p.gb - p.ga;
      rivalesDe.get(p.a)!.push(p.b);
      rivalesDe.get(p.b)!.push(p.a);
      if (p.ga > p.gb) {
        A.v++, B.d++, (A.puntos += PUNTOS.victoria);
      } else if (p.gb > p.ga) {
        B.v++, A.d++, (B.puntos += PUNTOS.victoria);
      } else {
        A.e++, B.e++, (A.puntos += PUNTOS.empate), (B.puntos += PUNTOS.empate);
      }
    }
  }

  const pct = (f: FilaSuiza) => {
    const total = f.v + f.d + f.e;
    return total ? Math.max(0.25, (f.v + f.e * 0.5) / total) : 0.25;
  };
  for (const f of filas.values()) {
    const rs = rivalesDe.get(f.jugadorId)!;
    f.rivales = rs.length ? rs.reduce((s, r) => s + pct(filas.get(r)!), 0) / rs.length : 0;
  }

  return [...filas.values()].sort(
    (x, y) =>
      y.puntos - x.puntos ||
      y.rivales - x.rivales ||
      y.dif - x.dif ||
      nickDe(x.jugadorId).localeCompare(nickDe(y.jugadorId), 'es'),
  );
}

/** Rondas recomendadas según el número de jugadores (referencia orientativa para torneos locales). */
export function rondasRecomendadas(n: number): number {
  if (n <= 8) return 3;
  if (n <= 16) return 4;
  if (n <= 32) return 5;
  if (n <= 64) return 6;
  return 7;
}

export function rondaCompleta(ronda: Partida[] | undefined): boolean {
  return !!ronda && ronda.every((p) => p.estado === 'finalizada');
}

/** Barajado reproducible: con la misma semilla, siempre el mismo orden. */
export function barajar<T>(lista: T[], semilla: string): T[] {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const azar = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...lista];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Empareja la siguiente ronda: por puntos, sin repetir rivales si es posible; el último sin bye recibe el bye. */
export function emparejarRonda(rondas: Partida[][], jugadores: string[], prefijo: string, nickDe?: (id: string) => string): Partida[] {
  if (jugadores.length < 2) throw new Error('Hacen falta al menos 2 jugadores.');
  if (rondas.length && !rondaCompleta(rondas[rondas.length - 1])) {
    throw new Error('Termina la ronda actual antes de generar la siguiente.');
  }
  const n = rondas.length + 1;
  const orden =
    n === 1
      ? barajar(jugadores, prefijo)
      : clasificacionSuiza(rondas, jugadores, nickDe).map((f) => f.jugadorId).filter((id) => jugadores.includes(id));

  const yaJugaron = new Set<string>();
  const tuvoBye = new Set<string>();
  for (const r of rondas)
    for (const p of r) {
      if (p.bye) tuvoBye.add((p.a ?? p.b)!);
      else if (p.a && p.b) yaJugaron.add([p.a, p.b].sort().join('|'));
    }

  const lista = [...orden];
  let bye: string | null = null;
  if (lista.length % 2 === 1) {
    const idx = [...lista].reverse().findIndex((id) => !tuvoBye.has(id));
    const real = idx === -1 ? lista.length - 1 : lista.length - 1 - idx;
    bye = lista.splice(real, 1)[0];
  }

  const emparejar = (resto: string[]): [string, string][] | null => {
    if (!resto.length) return [];
    const [p, ...otros] = resto;
    for (let j = 0; j < otros.length; j++) {
      if (yaJugaron.has([p, otros[j]].sort().join('|'))) continue;
      const sub = emparejar(otros.filter((_, k) => k !== j));
      if (sub) return [[p, otros[j]], ...sub];
    }
    return null;
  };
  const parejas =
    emparejar(lista) ?? Array.from({ length: lista.length / 2 }, (_, i) => [lista[2 * i], lista[2 * i + 1]] as [string, string]);

  const partidas: Partida[] = parejas.map(([a, b], i) => ({
    id: `${prefijo}-s${n}-m${i + 1}`,
    a,
    b,
    ga: null,
    gb: null,
    estado: 'pendiente',
    mesa: i + 1,
  }));
  if (bye) partidas.push({ id: `${prefijo}-s${n}-bye`, a: bye, b: null, ga: null, gb: null, estado: 'finalizada', bye: true });
  return partidas;
}

export function fijarResultadoSuizo(rondas: Partida[][], id: string, ga: number, gb: number, mejorDe: 1 | 3): void {
  for (const r of rondas) {
    const p = r.find((x) => x.id === id);
    if (!p) continue;
    if (p.bye) throw new Error('Un bye no tiene resultado.');
    const error = validarMarcador(ga, gb, mejorDe, true);
    if (error) throw new Error(error);
    p.ga = ga;
    p.gb = gb;
    p.estado = 'finalizada';
    return;
  }
  throw new Error('Partida no encontrada.');
}
