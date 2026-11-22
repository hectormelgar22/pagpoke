/* Reglas de un torneo: estado, plazas, inscripciones, competición y resultados finales.
   Todas las funciones reciben los datos y la hora actual: no dependen del navegador. */
import type { EstadoTorneo, Inscripcion, Jugador, Partida, Torneo, Division } from './tipos.ts';
import * as cuadro from './cuadro.ts';
import * as suizo from './suizo.ts';

export const ETIQUETA_ESTADO: Record<EstadoTorneo, string> = {
  proximamente: 'Próximamente',
  abiertas: 'Inscripciones abiertas',
  'ultimas-plazas': 'Últimas plazas',
  completo: 'Completo',
  cerradas: 'Inscripciones cerradas',
  'en-curso': 'En curso',
  finalizado: 'Finalizado',
};

export const ETIQUETA_FORMATO: Record<Torneo['formato'], string> = {
  eliminacion: 'Eliminación directa',
  suizo: 'Sistema suizo',
  'suizo-top': 'Suizo + top',
  'doble-eliminacion': 'Doble eliminación',
};

export const ETIQUETA_DIVISION: Record<Division, string> = { junior: 'Júnior', senior: 'Sénior', master: 'Máster' };

export function plazas(t: Torneo) {
  const ocupadas = t.inscripciones.length;
  const libres = Math.max(0, t.capacidad - ocupadas);
  const pendientes = t.inscripciones.filter((i) => i.estado === 'pendiente').length;
  return { ocupadas, libres, pendientes, pct: t.capacidad ? Math.min(1, ocupadas / t.capacidad) : 0 };
}

export function umbralUltimas(capacidad: number): number {
  return Math.max(2, Math.round(capacidad * 0.15));
}

export function estadoTorneo(t: Torneo, ahora: Date): EstadoTorneo {
  if (t.finalizado) return 'finalizado';
  if (Date.parse(t.inicio) <= ahora.getTime()) return 'en-curso';
  if (t.aperturaInscripciones && Date.parse(t.aperturaInscripciones) > ahora.getTime()) return 'proximamente';
  if (!t.inscripcionesAbiertas) return 'cerradas';
  if (t.cierreInscripciones && Date.parse(t.cierreInscripciones) <= ahora.getTime()) return 'cerradas';
  const { libres } = plazas(t);
  if (libres === 0) return 'completo';
  if (libres <= umbralUltimas(t.capacidad)) return 'ultimas-plazas';
  return 'abiertas';
}

export const admiteInscripcion = (e: EstadoTorneo) => e === 'abiertas' || e === 'ultimas-plazas';
export const admiteEspera = (e: EstadoTorneo) => e === 'completo';
export const esFuturo = (t: Torneo, ahora: Date) => Date.parse(t.inicio) > ahora.getTime();

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
const normContacto = (s: string) => (s.includes('@') ? s.trim().toLowerCase() : s.replace(/\D/g, '').replace(/^34(?=\d{9}$)/, ''));

export interface DatosInscripcion {
  nombre: string;
  nick: string;
  contacto: string;
  division: Division | '';
  idOficial?: string;
  aceptaNormas: boolean;
}

export type ErroresInscripcion = Partial<Record<keyof DatosInscripcion | 'general', string>>;

export function validarDatos(d: DatosInscripcion): ErroresInscripcion {
  const e: ErroresInscripcion = {};
  if (d.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre.';
  if (!/^[\p{L}\p{N}_.\- ]{2,20}$/u.test(d.nick.trim())) e.nick = 'Entre 2 y 20 caracteres: letras, números, punto o guion.';
  const c = d.contacto.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
  const tel = c.replace(/\D/g, '').length >= 9 && /^[+\d\s().-]+$/.test(c);
  if (!email && !tel) e.contacto = 'Escribe un email o un teléfono válido.';
  if (!d.division) e.division = 'Elige tu división.';
  if (d.idOficial && !/^\d{4,10}$/.test(d.idOficial.trim())) e.idOficial = 'Solo números (entre 4 y 10).';
  if (!d.aceptaNormas) e.aceptaNormas = 'Tienes que aceptar las normas del torneo.';
  return e;
}

export type ResultadoInscripcion =
  | { ok: true; tipo: 'inscrito' | 'espera'; inscripcion: Inscripcion; jugador: Jugador; posicionEspera?: number }
  | { ok: false; errores: ErroresInscripcion };

/** Inscribe (o apunta en lista de espera) comprobando estado, plazas y duplicados. Modifica `t` y `jugadores`. */
export function inscribir(
  t: Torneo,
  jugadores: Record<string, Jugador>,
  d: DatosInscripcion,
  ahora: Date,
  opciones: { listaEspera?: boolean; origen?: Inscripcion['origen']; nuevoId: () => string } ,
): ResultadoInscripcion {
  const errores = validarDatos(d);
  if (Object.keys(errores).length) return { ok: false, errores };

  const estado = estadoTorneo(t, ahora);
  const desdePanel = opciones.origen === 'panel';
  if (!desdePanel && !admiteInscripcion(estado) && !(admiteEspera(estado) && opciones.listaEspera)) {
    const motivo = admiteEspera(estado)
      ? 'El torneo está completo. Puedes apuntarte a la lista de espera.'
      : `No se admiten inscripciones: ${ETIQUETA_ESTADO[estado].toLowerCase()}.`;
    return { ok: false, errores: { general: motivo } };
  }
  if (t.cuadro || t.suizo.length) return { ok: false, errores: { general: 'La competición ya ha empezado.' } };
  if (desdePanel && plazas(t).libres === 0) return { ok: false, errores: { general: 'No quedan plazas. Amplía la capacidad o usa la lista de espera.' } };

  const todas = [...t.inscripciones, ...t.listaEspera];
  const nick = normalizar(d.nick);
  for (const i of todas) {
    const j = jugadores[i.jugadorId];
    if (j && normalizar(j.nick) === nick) return { ok: false, errores: { nick: 'Ya hay alguien inscrito con ese nick en este torneo.' } };
    if (i.contacto && normContacto(i.contacto) === normContacto(d.contacto))
      return { ok: false, errores: { contacto: 'Ese email o teléfono ya tiene una inscripción en este torneo.' } };
    if (d.idOficial && i.idOficial === d.idOficial.trim())
      return { ok: false, errores: { idOficial: 'Ese ID de jugador ya está inscrito en este torneo.' } };
  }

  let jugador = Object.values(jugadores).find((j) => normalizar(j.nick) === nick);
  if (!jugador) {
    const partes = d.nombre.trim().split(/\s+/);
    const visible = partes.length > 1 ? `${partes[0]} ${partes[1][0].toUpperCase()}.` : partes[0];
    jugador = { id: opciones.nuevoId(), nick: d.nick.trim(), nombre: visible, division: d.division as Division };
    jugadores[jugador.id] = jugador;
  }

  const inscripcion: Inscripcion = {
    id: opciones.nuevoId(),
    jugadorId: jugador.id,
    estado: desdePanel ? 'confirmada' : 'pendiente',
    fecha: ahora.toISOString(),
    contacto: d.contacto.trim(),
    idOficial: d.idOficial?.trim() || undefined,
    origen: opciones.origen ?? 'web',
  };
  if (admiteEspera(estado) && !desdePanel) {
    t.listaEspera.push(inscripcion);
    return { ok: true, tipo: 'espera', inscripcion, jugador, posicionEspera: t.listaEspera.length };
  }
  t.inscripciones.push(inscripcion);
  return { ok: true, tipo: 'inscrito', inscripcion, jugador };
}

/** Quita una inscripción; si había lista de espera y el torneo no ha empezado, sube el primero. */
export function darDeBaja(t: Torneo, inscripcionId: string): Inscripcion | null {
  const enLista = t.listaEspera.findIndex((i) => i.id === inscripcionId);
  if (enLista >= 0) {
    t.listaEspera.splice(enLista, 1);
    return null;
  }
  const idx = t.inscripciones.findIndex((i) => i.id === inscripcionId);
  if (idx < 0) return null;
  if (t.cuadro || t.suizo.length) throw new Error('El torneo ya ha empezado: no se pueden quitar inscritos.');
  t.inscripciones.splice(idx, 1);
  if (t.listaEspera.length && t.inscripciones.length < t.capacidad) {
    const sube = t.listaEspera.shift()!;
    t.inscripciones.push(sube);
    return sube;
  }
  return null;
}

export const participantes = (t: Torneo) => t.inscripciones.map((i) => i.jugadorId);

export type Fase = 'inscripcion' | 'suizo' | 'top' | 'eliminacion' | 'terminado';

/** En qué punto de la competición está el torneo, según sus datos. */
export function fase(t: Torneo): Fase {
  if (t.formato === 'eliminacion') {
    if (!t.cuadro) return 'inscripcion';
    return cuadro.completo(t.cuadro) ? 'terminado' : 'eliminacion';
  }
  if (!t.suizo.length) return 'inscripcion';
  const suizoAcabado = t.suizo.length >= t.rondasSuizas && suizo.rondaCompleta(t.suizo[t.suizo.length - 1]);
  if (t.formato === 'suizo') return suizoAcabado ? 'terminado' : 'suizo';
  if (!suizoAcabado) return 'suizo';
  if (!t.cuadro) return 'top';
  return cuadro.completo(t.cuadro) ? 'terminado' : 'eliminacion';
}

/** Arranca la competición: cuadro (eliminación) o primera ronda (suizo). */
export function empezar(t: Torneo, nickDe: (id: string) => string): void {
  const ids = participantes(t);
  if (ids.length < 2) throw new Error('Hacen falta al menos 2 inscritos.');
  if (t.formato === 'doble-eliminacion') throw new Error('La doble eliminación aún no está disponible.');
  if (t.cuadro || t.suizo.length) throw new Error('La competición ya ha empezado.');
  t.inscripcionesAbiertas = false;
  for (const i of t.inscripciones) i.estado = 'confirmada';
  t.listaEspera = [];
  if (t.formato === 'eliminacion') {
    t.cuadro = cuadro.generarCuadro(ids, t.id);
  } else {
    if (!t.rondasSuizas) t.rondasSuizas = suizo.rondasRecomendadas(ids.length);
    t.suizo = [suizo.emparejarRonda([], ids, t.id, nickDe)];
  }
}

export function siguienteRondaSuiza(t: Torneo, nickDe: (id: string) => string): void {
  if (fase(t) !== 'suizo') throw new Error('No toca generar una ronda suiza.');
  if (t.suizo.length >= t.rondasSuizas) throw new Error('Ya se han jugado todas las rondas.');
  t.suizo.push(suizo.emparejarRonda(t.suizo, participantes(t), t.id, nickDe));
}

export function generarTop(t: Torneo, nickDe: (id: string) => string): void {
  if (fase(t) !== 'top') throw new Error('El corte se genera al terminar las rondas suizas.');
  const tabla = suizo.clasificacionSuiza(t.suizo, participantes(t), nickDe);
  const n = Math.min(t.topCorte || 8, tabla.length);
  t.cuadro = cuadro.generarCuadro(tabla.slice(0, n).map((f) => f.jugadorId), `${t.id}-top`);
}

/** Guarda el resultado de una partida (de suizo o de cuadro). Devuelve cuántos resultados posteriores se anularon. */
export function registrarResultado(t: Torneo, partidaId: string, ga: number, gb: number): number {
  if (t.finalizado) throw new Error('El torneo está finalizado. Reábrelo para cambiar resultados.');
  if (t.cuadro && cuadro.buscar(t.cuadro, partidaId)) return cuadro.fijarResultado(t.cuadro, partidaId, ga, gb, t.mejorDe);
  const r = t.suizo.findIndex((ronda) => ronda.some((p) => p.id === partidaId));
  if (r < 0) throw new Error('Partida no encontrada.');
  if (r !== t.suizo.length - 1 || t.cuadro) throw new Error('Solo se pueden cambiar resultados de la ronda en juego.');
  suizo.fijarResultadoSuizo(t.suizo, partidaId, ga, gb, t.mejorDe);
  return 0;
}

export function campeon(t: Torneo, nickDe?: (id: string) => string): string | null {
  if (t.cuadro) return cuadro.campeon(t.cuadro);
  if (t.formato === 'suizo' && fase(t) === 'terminado') return suizo.clasificacionSuiza(t.suizo, participantes(t), nickDe)[0]?.jugadorId ?? null;
  return null;
}

export function finalizar(t: Torneo): void {
  if (fase(t) !== 'terminado') throw new Error('Faltan resultados por registrar.');
  t.finalizado = true;
}

/** Puesto final de cada participante (1 = campeón). Combina corte final y clasificación suiza. */
export function puestosFinales(t: Torneo, nickDe?: (id: string) => string): Map<string, number> {
  const out = new Map<string, number>();
  if (t.formato === 'eliminacion') return t.cuadro ? cuadro.puestosCuadro(t.cuadro) : out;
  const tabla = suizo.clasificacionSuiza(t.suizo, participantes(t), nickDe);
  if (t.cuadro) for (const [id, p] of cuadro.puestosCuadro(t.cuadro)) out.set(id, p);
  tabla.forEach((f, i) => {
    if (!out.has(f.jugadorId)) out.set(f.jugadorId, i + 1);
  });
  return out;
}

export function etiquetaPuesto(p: number, formato: Torneo['formato']): string {
  if (p === 1) return '1º';
  if (p === 2) return '2º';
  if (formato === 'suizo') return `${p}º`;
  if (p <= 4) return 'Top 4';
  if (p <= 8) return 'Top 8';
  if (p <= 16) return 'Top 16';
  return `${p}º`;
}

/** Todas las partidas jugadas (sin byes), para estadísticas. */
export function partidasJugadas(t: Torneo): Partida[] {
  return [...t.suizo.flat(), ...(t.cuadro?.flat() ?? [])].filter((p) => !p.bye && p.estado === 'finalizada' && p.a && p.b);
}

export const precioTexto = (precio: number) =>
  precio === 0 ? 'Gratis' : precio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: precio % 1 ? 2 : 0 });
