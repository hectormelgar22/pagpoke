/* Clasificación de la comunidad: se calcula a partir de los torneos finalizados.
   No hay números guardados aparte, así que nunca contradice los cuadros ni las tablas. */
import type { Jugador, Torneo } from './tipos.ts';
import { partes } from './fechas.ts';
import { etiquetaPuesto, partidasJugadas, puestosFinales } from './torneo.ts';

/** Reglas de puntuación (editables en src/data/tienda.ts si la tienda quiere otras). */
export interface ReglasRanking {
  participacion: number;
  victoria: number;
  bonusPuesto: { hasta: number; puntos: number }[];
}

export const REGLAS_POR_DEFECTO: ReglasRanking = {
  participacion: 5,
  victoria: 3,
  bonusPuesto: [
    { hasta: 1, puntos: 20 },
    { hasta: 2, puntos: 12 },
    { hasta: 4, puntos: 8 },
    { hasta: 8, puntos: 4 },
  ],
};

export interface Temporada {
  id: string;
  nombre: string;
}

/** Temporada de septiembre a agosto, como el calendario competitivo. */
export function temporadaDe(iso: string): Temporada {
  const p = partes(iso);
  const y = p.m >= 9 ? p.y : p.y - 1;
  return { id: `${y}-${String((y + 1) % 100).padStart(2, '0')}`, nombre: `Temporada ${y}-${String((y + 1) % 100).padStart(2, '0')}` };
}

export function temporadas(torneos: Torneo[]): Temporada[] {
  const mapa = new Map<string, Temporada>();
  for (const t of torneos) if (t.finalizado) mapa.set(temporadaDe(t.inicio).id, temporadaDe(t.inicio));
  return [...mapa.values()].sort((a, b) => b.id.localeCompare(a.id));
}

export interface ResultadoJugador {
  torneoId: string;
  torneo: string;
  slug: string;
  fecha: string;
  puesto: number;
  etiqueta: string;
}

export interface FilaRanking {
  jugadorId: string;
  puntos: number;
  torneos: number;
  victorias: number;
  derrotas: number;
  empates: number;
  partidas: number;
  pctVictorias: number;
  titulos: number;
  resultados: ResultadoJugador[];
}

export function calcularRanking(
  torneos: Torneo[],
  jugadores: Record<string, Jugador>,
  temporadaId: string | 'todas',
  reglas: ReglasRanking = REGLAS_POR_DEFECTO,
): FilaRanking[] {
  const nickDe = (id: string) => jugadores[id]?.nick ?? id;
  const filas = new Map<string, FilaRanking>();
  const fila = (id: string) => {
    let f = filas.get(id);
    if (!f) {
      f = { jugadorId: id, puntos: 0, torneos: 0, victorias: 0, derrotas: 0, empates: 0, partidas: 0, pctVictorias: 0, titulos: 0, resultados: [] };
      filas.set(id, f);
    }
    return f;
  };

  const validos = torneos
    .filter((t) => t.finalizado && (temporadaId === 'todas' || temporadaDe(t.inicio).id === temporadaId))
    .sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));

  for (const t of validos) {
    const puestos = puestosFinales(t, nickDe);
    for (const [id, puesto] of puestos) {
      const f = fila(id);
      f.torneos++;
      f.puntos += reglas.participacion + (reglas.bonusPuesto.find((b) => puesto <= b.hasta)?.puntos ?? 0);
      if (puesto === 1) f.titulos++;
      f.resultados.push({ torneoId: t.id, torneo: t.nombre, slug: t.slug, fecha: t.inicio, puesto, etiqueta: etiquetaPuesto(puesto, t.formato) });
    }
    for (const p of partidasJugadas(t)) {
      const A = fila(p.a!);
      const B = fila(p.b!);
      A.partidas++;
      B.partidas++;
      if (p.ga! > p.gb!) {
        A.victorias++;
        B.derrotas++;
      } else if (p.gb! > p.ga!) {
        B.victorias++;
        A.derrotas++;
      } else {
        A.empates++;
        B.empates++;
      }
    }
  }

  for (const f of filas.values()) {
    f.puntos += f.victorias * reglas.victoria;
    f.pctVictorias = f.partidas ? f.victorias / f.partidas : 0;
  }

  return [...filas.values()].sort(
    (a, b) => b.puntos - a.puntos || b.pctVictorias - a.pctVictorias || b.torneos - a.torneos || nickDe(a.jugadorId).localeCompare(nickDe(b.jugadorId), 'es'),
  );
}
