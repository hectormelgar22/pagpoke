import { describe, expect, it } from 'vitest';
import type { Jugador, Torneo } from '../src/lib/tipos.ts';
import * as C from '../src/lib/cuadro.ts';
import * as S from '../src/lib/suizo.ts';
import * as T from '../src/lib/torneo.ts';
import { calcularRanking, temporadaDe } from '../src/lib/ranking.ts';
import { resolverFecha, partes, claveDia } from '../src/lib/fechas.ts';

const AHORA = new Date('2026-11-23T10:00:00Z');
let n = 0;
const nuevoId = () => `x${++n}`;

function base(extra: Partial<Torneo> = {}): Torneo {
  return {
    id: 't1', slug: 't1', numero: 1, nombre: 'Prueba', tipo: 'torneo', formato: 'eliminacion', modalidad: 'Estándar',
    inicio: '2026-12-05T09:00:00Z', duracionMin: 300, ubicacion: 'Tienda', capacidad: 4, precio: 5, mejorDe: 3,
    resumen: '', descripcion: '', premios: [], reglas: [], desarrollo: [], faq: [],
    aperturaInscripciones: null, cierreInscripciones: null, inscripcionesAbiertas: true, finalizado: false,
    inscripciones: [], listaEspera: [], rondasSuizas: 0, topCorte: 0, suizo: [], cuadro: null, destacado: false, tema: 'ambar',
    ...extra,
  };
}
const datos = (nick: string, contacto = `${nick}@mail.es`) => ({ nombre: `Nombre ${nick}`, nick, contacto, division: 'master' as const, aceptaNormas: true });

describe('inscripciones', () => {
  it('suma inscritos, resta plazas y cambia de estado', () => {
    const t = base();
    const j: Record<string, Jugador> = {};
    expect(T.estadoTorneo(t, AHORA)).toBe('abiertas');
    expect(T.inscribir(t, j, datos('ana'), AHORA, { nuevoId }).ok).toBe(true);
    expect(T.plazas(t)).toMatchObject({ ocupadas: 1, libres: 3, pendientes: 1 });
    T.inscribir(t, j, datos('beto'), AHORA, { nuevoId });
    expect(T.estadoTorneo(t, AHORA)).toBe('ultimas-plazas'); // quedan 2 de 4
    T.inscribir(t, j, datos('carla'), AHORA, { nuevoId });
    T.inscribir(t, j, datos('dani'), AHORA, { nuevoId });
    expect(T.estadoTorneo(t, AHORA)).toBe('completo');
    expect(T.plazas(t).libres).toBe(0);
  });

  it('rechaza duplicados por nick, contacto e ID', () => {
    const t = base();
    const j: Record<string, Jugador> = {};
    T.inscribir(t, j, { ...datos('ana'), idOficial: '123456' }, AHORA, { nuevoId });
    const r1 = T.inscribir(t, j, datos('ANA', 'otra@mail.es'), AHORA, { nuevoId });
    const r2 = T.inscribir(t, j, datos('ana2', 'ana@mail.es'), AHORA, { nuevoId });
    const r3 = T.inscribir(t, j, { ...datos('ana3'), idOficial: '123456' }, AHORA, { nuevoId });
    expect(r1.ok || r2.ok || r3.ok).toBe(false);
    expect(t.inscripciones).toHaveLength(1);
  });

  it('valida campos', () => {
    const r = T.inscribir(base(), {}, { nombre: '', nick: '!', contacto: 'x', division: '', aceptaNormas: false }, AHORA, { nuevoId });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['aceptaNormas', 'contacto', 'division', 'nick', 'nombre']);
  });

  it('completo: no inscribe, pero admite lista de espera; una baja sube al primero', () => {
    const t = base({ capacidad: 2 });
    const j: Record<string, Jugador> = {};
    T.inscribir(t, j, datos('a1'), AHORA, { nuevoId });
    T.inscribir(t, j, datos('a2'), AHORA, { nuevoId });
    expect(T.inscribir(t, j, datos('a3'), AHORA, { nuevoId }).ok).toBe(false);
    const espera = T.inscribir(t, j, datos('a3'), AHORA, { nuevoId, listaEspera: true });
    expect(espera.ok && espera.tipo).toBe('espera');
    T.darDeBaja(t, t.inscripciones[0].id);
    expect(t.inscripciones.map((i) => j[i.jugadorId].nick)).toEqual(['a2', 'a3']);
    expect(t.listaEspera).toHaveLength(0);
  });

  it('estados por fecha y por interruptor', () => {
    expect(T.estadoTorneo(base({ inicio: '2026-11-23T09:00:00Z' }), AHORA)).toBe('en-curso');
    expect(T.estadoTorneo(base({ aperturaInscripciones: '2026-11-30T09:00:00Z' }), AHORA)).toBe('proximamente');
    expect(T.estadoTorneo(base({ inscripcionesAbiertas: false }), AHORA)).toBe('cerradas');
    expect(T.estadoTorneo(base({ cierreInscripciones: '2026-11-22T09:00:00Z' }), AHORA)).toBe('cerradas');
    expect(T.estadoTorneo(base({ finalizado: true }), AHORA)).toBe('finalizado');
    const empezado = base({ inicio: '2026-11-23T09:00:00Z' });
    expect(T.inscribir(empezado, {}, datos('z'), AHORA, { nuevoId }).ok).toBe(false);
  });
});

describe('eliminación directa', () => {
  it('6 jugadores: cuadro de 8 con 2 pases directos para las cabezas de serie', () => {
    const r = C.generarCuadro(['s1', 's2', 's3', 's4', 's5', 's6'], 'c');
    expect(r.map((x) => x.length)).toEqual([4, 2, 1]);
    expect(r[0].filter((p) => p.bye).map((p) => p.a)).toEqual(['s1', 's2']);
    expect(r[1][0].a).toBe('s1'); // el bye ya ha avanzado
  });

  it('los ganadores avanzan, la final da campeón y los puestos son coherentes', () => {
    const r = C.generarCuadro(['a', 'b', 'c', 'd'], 'c');
    // r0: a-d, b-c
    C.fijarResultado(r, r[0][0].id, 2, 1, 3);
    C.fijarResultado(r, r[0][1].id, 0, 2, 3);
    expect([r[1][0].a, r[1][0].b]).toEqual(['a', 'c']);
    expect(C.campeon(r)).toBeNull();
    C.fijarResultado(r, r[1][0].id, 1, 2, 3);
    expect(C.campeon(r)).toBe('c');
    expect(Object.fromEntries(C.puestosCuadro(r))).toEqual({ c: 1, a: 2, d: 3, b: 3 });
  });

  it('cambiar un resultado ya avanzado anula la final', () => {
    const r = C.generarCuadro(['a', 'b', 'c', 'd'], 'c');
    C.fijarResultado(r, r[0][0].id, 2, 0, 3);
    C.fijarResultado(r, r[0][1].id, 2, 0, 3);
    C.fijarResultado(r, r[1][0].id, 2, 0, 3);
    const anuladas = C.fijarResultado(r, r[0][0].id, 0, 2, 3); // ahora gana d
    expect(anuladas).toBe(1);
    expect(r[1][0]).toMatchObject({ a: 'd', estado: 'pendiente', ga: null });
    expect(C.campeon(r)).toBeNull();
  });

  it('valida marcadores', () => {
    expect(C.validarMarcador(2, 2, 3)).not.toBeNull();
    expect(C.validarMarcador(3, 0, 3)).not.toBeNull();
    expect(C.validarMarcador(2, 1, 3)).toBeNull();
    expect(C.validarMarcador(1, 0, 1)).toBeNull();
    expect(C.validarMarcador(1, 1, 3, true)).toBeNull();
  });
});

describe('sistema suizo', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];
  it('empareja sin repetir rivales y da un solo bye por jugador', () => {
    const rondas: ReturnType<typeof S.emparejarRonda>[] = [];
    for (let k = 0; k < 3; k++) {
      const r = S.emparejarRonda(rondas, ids, 'sz');
      r.filter((p) => !p.bye).forEach((p) => S.fijarResultadoSuizo([r], p.id, 2, 0, 3));
      rondas.push(r);
    }
    const parejas = rondas.flat().filter((p) => !p.bye).map((p) => [p.a, p.b].sort().join('|'));
    expect(new Set(parejas).size).toBe(parejas.length);
    const byes = rondas.flat().filter((p) => p.bye).map((p) => p.a);
    expect(new Set(byes).size).toBe(3);
    const tabla = S.clasificacionSuiza(rondas, ids);
    expect(tabla.reduce((s, f) => s + f.v, 0)).toBe(3 * 3); // 2 partidas + 1 bye por ronda
    expect(tabla[0].puntos).toBeGreaterThanOrEqual(tabla[4].puntos);
  });

  it('no genera ronda nueva con resultados pendientes', () => {
    const r = S.emparejarRonda([], ids, 'sz');
    expect(() => S.emparejarRonda([r], ids, 'sz')).toThrow();
  });

  it('suizo + top 4 de principio a fin', () => {
    const t = base({ formato: 'suizo-top', capacidad: 8, rondasSuizas: 3, topCorte: 4, mejorDe: 1 });
    const j: Record<string, Jugador> = {};
    for (let k = 1; k <= 8; k++) T.inscribir(t, j, datos(`p${k}`), AHORA, { nuevoId });
    const nick = (id: string) => j[id].nick;
    T.empezar(t, nick);
    for (let r = 0; r < 3; r++) {
      if (r) T.siguienteRondaSuiza(t, nick);
      for (const p of t.suizo[r]) if (!p.bye) T.registrarResultado(t, p.id, 1, 0);
    }
    expect(T.fase(t)).toBe('top');
    T.generarTop(t, nick);
    for (const ronda of t.cuadro!) for (const p of ronda) if (!p.bye && p.estado !== 'finalizada') T.registrarResultado(t, p.id, 1, 0);
    expect(T.fase(t)).toBe('terminado');
    T.finalizar(t);
    const puestos = T.puestosFinales(t, nick);
    expect(puestos.size).toBe(8);
    expect([...puestos.values()].filter((p) => p === 1)).toHaveLength(1);
    expect(T.campeon(t)).toBe([...puestos].find(([, p]) => p === 1)![0]);
  });
});

describe('ranking', () => {
  it('suma puntos coherentes con los resultados', () => {
    const t = base({ inicio: '2026-10-10T09:00:00Z', capacidad: 4 });
    const j: Record<string, Jugador> = {};
    for (const k of ['ja', 'jb', 'jc', 'jd']) T.inscribir(t, j, datos(k), new Date('2026-10-01'), { nuevoId });
    T.empezar(t, (id) => j[id].nick);
    const r = t.cuadro!;
    T.registrarResultado(t, r[0][0].id, 2, 0);
    T.registrarResultado(t, r[0][1].id, 2, 0);
    T.registrarResultado(t, r[1][0].id, 2, 1);
    T.finalizar(t);
    const rk = calcularRanking([t], j, temporadaDe(t.inicio).id);
    const campeon = rk[0];
    expect(j[campeon.jugadorId].nick).toBe(j[T.campeon(t)!].nick);
    expect(campeon).toMatchObject({ victorias: 2, partidas: 2, titulos: 1, puntos: 5 + 20 + 2 * 3 });
    expect(rk.reduce((s, f) => s + f.victorias, 0)).toBe(rk.reduce((s, f) => s + f.derrotas, 0));
  });
});

describe('fechas', () => {
  it('resuelve fechas relativas en hora de Madrid', () => {
    const iso = resolverFecha('S+1/6 10:00', AHORA); // lunes 23 -> sábado 5 dic
    expect(claveDia(iso)).toBe('2026-12-05');
    expect(partes(iso)).toMatchObject({ h: 10, min: 0, dow: 6 });
    const verano = resolverFecha('2026-07-04T08:00:00Z', AHORA);
    expect(partes(verano).h).toBe(10); // UTC+2
  });
});
