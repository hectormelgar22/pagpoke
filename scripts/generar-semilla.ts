/* Genera src/data/torneos.semilla.json: jugadores ficticios, torneos pasados con resultados,
   un torneo en curso y próximos torneos con inscritos.
   Es reproducible (semilla fija): ejecutarlo dos veces da exactamente el mismo archivo.
   Uso: node scripts/generar-semilla.ts */
import { writeFileSync } from 'node:fs';
import type { Inscripcion, Jugador, Partida, Torneo } from '../src/lib/tipos.ts';
import * as T from '../src/lib/torneo.ts';
import { ganador } from '../src/lib/cuadro.ts';

let s = 20261122;
const azar = () => {
  s += 0x6d2b79f5;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const elegir = <X,>(xs: X[], n: number) => {
  const c = [...xs];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, n);
};

// ——— Jugadores ficticios: nick + nombre e inicial. "nivel" solo sirve para simular resultados creíbles.
const BASE: [string, string, number, Jugador['division']?][] = [
  ['Kaiser', 'Álex R.', 92], ['LunaRoja', 'Lucía M.', 90], ['Brasa', 'Hugo P.', 86], ['Nébula', 'Marta G.', 85],
  ['Tormenta', 'Iván S.', 84], ['Pixel', 'Nerea L.', 82], ['Ghost', 'Pablo D.', 81], ['Zafiro', 'Irene C.', 80],
  ['Corsario', 'Daniel F.', 78], ['Kitsune', 'Sara V.', 77], ['Rayo', 'Javi M.', 76], ['Mistral', 'Carla N.', 75],
  ['Nómada', 'Rubén A.', 74], ['Selene', 'Paula B.', 73], ['Draco', 'Adrián T.', 72], ['Ámbar', 'Elena R.', 71],
  ['Vórtice', 'Mario H.', 70], ['Cometa', 'Andrea P.', 69], ['Titán', 'Sergio L.', 68], ['Aurora', 'Laura S.', 67],
  ['Bruma', 'Óscar G.', 66], ['Coral', 'Alba J.', 65], ['Halcón', 'Diego M.', 64], ['Menta', 'Noelia F.', 63],
  ['Quásar', 'Raúl E.', 62], ['Índigo', 'Claudia R.', 61], ['Escarcha', 'Víctor B.', 60], ['Gema', 'Julia T.', 59],
  ['Trueno', 'Manu C.', 58], ['Lince', 'Inés D.', 57], ['Orión', 'Gonzalo P.', 56], ['Sombra', 'Ainhoa V.', 55],
  ['Fénix', 'Marcos N.', 54], ['Neón', 'Lola A.', 53], ['Eco', 'Jorge S.', 52], ['Arena', 'Cris M.', 51],
  ['Topo', 'Leo G.', 64, 'junior'], ['Chispa', 'Vega R.', 62, 'junior'], ['Mochi', 'Bruno L.', 58, 'junior'],
  ['Burbuja', 'Olivia S.', 57, 'junior'], ['Rayito', 'Nico P.', 55, 'junior'], ['Kiwi', 'Martina F.', 60, 'senior'],
  ['Turbo', 'Unai C.', 66, 'senior'], ['Nova', 'Daniela H.', 63, 'senior'], ['Saeta', 'Iker M.', 61, 'senior'],
  ['Copo', 'Emma B.', 54, 'junior'],
];
const jugadores: Record<string, Jugador> = {};
const nivel: Record<string, number> = {};
BASE.forEach(([nick, nombre, n, div], i) => {
  const id = `j${String(i + 1).padStart(2, '0')}`;
  jugadores[id] = { id, nick, nombre, division: div ?? 'master' };
  nivel[id] = n;
});
const ids = Object.keys(jugadores);
const adultos = ids.filter((id) => jugadores[id].division === 'master');
const peques = ids.filter((id) => jugadores[id].division !== 'master');
const nick = (id: string) => jugadores[id].nick;

// ——— Plantillas de texto por tipo de torneo
const FAQ = [
  { p: '¿Necesito ID de jugador?', r: 'Para torneos puntuables, sí: es gratuito y te ayudamos a crearlo en tienda. Para el resto basta con tu nombre y tu nick.' },
  { p: '¿Me puedo apuntar el mismo día?', r: 'Solo si quedan plazas. Te recomendamos inscribirte aquí: las plazas se asignan por orden de inscripción.' },
  { p: '¿Y si al final no puedo venir?', r: 'Escríbenos por WhatsApp cuanto antes: liberamos tu plaza para la siguiente persona de la lista de espera.' },
];
const NORMAS = [
  'Formato y lista de cartas vigentes el día del torneo.',
  'Fundas opacas y en buen estado; el mazo debe estar registrado antes de empezar.',
  'Si llegas más de 10 minutos tarde a una ronda, pierdes esa partida.',
  'Juego limpio y respeto: la tienda puede descalificar ante conductas antideportivas.',
];
type Plantilla = Pick<Torneo, 'nombre' | 'tipo' | 'formato' | 'modalidad' | 'capacidad' | 'precio' | 'mejorDe' | 'resumen' | 'descripcion' | 'premios' | 'desarrollo' | 'tema' | 'duracionMin' | 'topCorte'>;
const PL: Record<string, Plantilla> = {
  copa: {
    nombre: 'Copa Destello', tipo: 'torneo', formato: 'eliminacion', modalidad: 'Estándar', capacidad: 16, precio: 10, mejorDe: 3, tema: 'ambar', duracionMin: 330, topCorte: 0,
    resumen: 'El torneo mensual de la tienda: eliminación directa al mejor de tres.',
    descripcion: 'La Copa Destello es nuestra cita mensual. Eliminación directa desde la primera ronda, partidas al mejor de tres y un ambiente competitivo pero cercano. Cada partida cuenta.',
    premios: ['Campeón: caja de 36 sobres y tapete de la tienda', 'Finalista: 12 sobres', 'Semifinalistas: 6 sobres', 'Todos los participantes: 1 sobre'],
    desarrollo: ['09:30 · Recepción y registro de listas', '10:00 · Primera ronda', 'Rondas de 50 minutos + 3 turnos', '≈15:30 · Final y entrega de premios'],
  },
  challenge: {
    nombre: 'League Challenge', tipo: 'torneo', formato: 'suizo', modalidad: 'Estándar', capacidad: 32, precio: 8, mejorDe: 1, tema: 'cian', duracionMin: 300, topCorte: 0,
    resumen: 'Torneo puntuable a sistema suizo: juegas todas las rondas, ganes o pierdas.',
    descripcion: 'Torneo a sistema suizo al mejor de una partida. Todos los jugadores disputan todas las rondas y la clasificación final se decide por puntos y desempates.',
    premios: ['Puntos de campeonato para los mejores clasificados', 'Sobres según la clasificación final', 'Carta promocional para todos'],
    desarrollo: ['09:30 · Recepción y listas', '10:00 · Ronda 1', 'Rondas de 30 minutos + 3 turnos', 'Clasificación publicada al terminar cada ronda'],
  },
  cup: {
    nombre: 'League Cup', tipo: 'torneo', formato: 'suizo-top', modalidad: 'Estándar', capacidad: 48, precio: 15, mejorDe: 3, tema: 'violeta', duracionMin: 540, topCorte: 8,
    resumen: 'El gran torneo de la temporada: rondas suizas y top 8 al mejor de tres.',
    descripcion: 'Nuestro evento más importante. Rondas suizas al mejor de tres y, después, los ocho primeros juegan una eliminatoria directa hasta la final.',
    premios: ['Campeón: trofeo, tapete exclusivo y caja de 36 sobres', 'Top 8: sobres y tapete de la tienda', 'Puntos de campeonato según la clasificación'],
    desarrollo: ['09:00 · Recepción y registro de listas', '09:30 · Rondas suizas (50 min + 3 turnos)', '≈16:00 · Top 8 en eliminación directa', '≈19:00 · Final y entrega de trofeo'],
  },
  presentacion: {
    nombre: 'Presentación de la nueva expansión', tipo: 'presentacion', formato: 'suizo', modalidad: 'Sellado', capacidad: 24, precio: 30, mejorDe: 1, tema: 'rosa', duracionMin: 240, topCorte: 0,
    resumen: 'Abre 6 sobres de la nueva expansión, monta tu mazo y juega antes que nadie.',
    descripcion: 'Formato sellado: recibes un kit con sobres de la nueva expansión, montas un mazo de 40 cartas en la tienda y juegas cuatro rondas. Ideal para estrenar colección.',
    premios: ['Kit de presentación con 6 sobres y carta promocional', 'Sobres extra para los cuatro primeros'],
    desarrollo: ['17:00 · Apertura de sobres y montaje del mazo', '17:45 · Cuatro rondas suizas', '≈21:00 · Premios'],
  },
  junior: {
    nombre: 'Torneo Júnior y Sénior', tipo: 'torneo', formato: 'eliminacion', modalidad: 'Estándar', capacidad: 16, precio: 5, mejorDe: 1, tema: 'verde', duracionMin: 180, topCorte: 0,
    resumen: 'Torneo para menores de 16 años, con jueces que ayudan en cada mesa.',
    descripcion: 'Un torneo pensado para jugadores jóvenes: partidas a una, ayuda con las reglas en todo momento y premios para todos. Las familias pueden quedarse a mirar.',
    premios: ['Campeón: Caja de Entrenador Élite', 'Finalista: 4 sobres', 'Todos: sobre y diploma'],
    desarrollo: ['11:00 · Recepción', '11:15 · Primera ronda', '≈14:00 · Final y premios'],
  },
  expandido: {
    nombre: 'Torneo de formato Expandido', tipo: 'torneo', formato: 'suizo', modalidad: 'Expandido', capacidad: 16, precio: 8, mejorDe: 1, tema: 'cian', duracionMin: 240, topCorte: 0,
    resumen: 'Para quienes guardan cartas de expansiones anteriores: formato Expandido a sistema suizo.',
    descripcion: 'El formato Expandido permite cartas desde Negro y Blanco. Más combinaciones, más mazos distintos. Cuatro rondas a sistema suizo.',
    premios: ['Sobres según la clasificación', 'Carta promocional para los tres primeros'],
    desarrollo: ['16:30 · Recepción', '17:00 · Cuatro rondas suizas', '≈21:00 · Premios'],
  },
  comunidad: {
    nombre: 'Gran Torneo de la Comunidad', tipo: 'especial', formato: 'eliminacion', modalidad: 'Estándar', capacidad: 32, precio: 12, mejorDe: 3, tema: 'ambar', duracionMin: 420, topCorte: 0,
    resumen: 'El torneo más grande del año en la tienda, con 32 plazas y premios especiales.',
    descripcion: 'Un día entero de competición y comunidad: eliminación directa con 32 jugadores, zona de intercambio y sorteos entre todos los asistentes.',
    premios: ['Campeón: Colección Ultra Premium y trofeo', 'Finalista: Caja de Entrenador Élite', 'Sorteo de producto entre todos los asistentes'],
    desarrollo: ['09:30 · Recepción', '10:00 · Primera ronda', 'Comida libre entre rondas', '≈17:00 · Final'],
  },
};

let numero = 0;
const torneos: Torneo[] = [];
function nuevo(clave: string, inicio: string, extra: Partial<Torneo> = {}): Torneo {
  const pl = PL[clave];
  numero++;
  const id = `t${String(numero).padStart(3, '0')}`;
  const t: Torneo = {
    ...pl, id, slug: `${clave}-${String(numero).padStart(3, '0')}`, numero, inicio,
    ubicacion: 'Destello · zona de juego', reglas: NORMAS, faq: FAQ,
    aperturaInscripciones: null, cierreInscripciones: null, inscripcionesAbiertas: true, finalizado: false,
    inscripciones: [], listaEspera: [], rondasSuizas: 0, suizo: [], cuadro: null, destacado: false, ...extra,
  };
  torneos.push(t);
  return t;
}
const semana = (w: number, dia: number, h: string) => `S${w >= 0 ? '+' : ''}${w}/${dia} ${h}`;
function inscribirTodos(t: Torneo, lista: string[], w: number, pendientes = 0) {
  t.inscripciones = lista.map((jugadorId, i): Inscripcion => ({
    id: `${t.id}-i${i + 1}`, jugadorId, estado: i >= lista.length - pendientes ? 'pendiente' : 'confirmada',
    fecha: semana(w - 1 - (i % 2), 1 + (i % 5), `${String(17 + (i % 5)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`),
    origen: 'semilla',
  }));
}
function jugar(p: Partida, mejorDe: 1 | 3, empates = false) {
  if (p.bye || !p.a || !p.b) return;
  const pa = 1 / (1 + Math.exp(-(nivel[p.a] - nivel[p.b]) / 9));
  const r = azar();
  if (empates && r > 0.95) {
    p.ga = p.gb = mejorDe === 3 ? 1 : 0;
  } else {
    const ganaA = r < pa;
    const ajustada = mejorDe === 3 && azar() < 0.4 ? 1 : 0;
    p.ga = ganaA ? (mejorDe === 3 ? 2 : 1) : mejorDe === 3 ? ajustada : 0;
    p.gb = ganaA ? (mejorDe === 3 ? ajustada : 0) : mejorDe === 3 ? 2 : 1;
  }
  p.estado = 'finalizada';
}
function completar(t: Torneo) {
  T.empezar(t, nick);
  if (t.formato === 'eliminacion') {
    for (const ronda of t.cuadro!) for (const p of ronda) if (!p.bye) T.registrarResultado(t, p.id, ...marcador(p, t.mejorDe));
  } else {
    for (let r = 0; r < t.rondasSuizas; r++) {
      if (r) T.siguienteRondaSuiza(t, nick);
      for (const p of t.suizo[r]) jugar(p, t.mejorDe, true);
    }
    if (t.formato === 'suizo-top') {
      T.generarTop(t, nick);
      for (const ronda of t.cuadro!) for (const p of ronda) if (!p.bye) T.registrarResultado(t, p.id, ...marcador(p, t.mejorDe));
    }
  }
  T.finalizar(t);
}
function marcador(p: Partida, mejorDe: 1 | 3): [number, number] {
  const copia = { ...p };
  jugar(copia, mejorDe);
  return [copia.ga!, copia.gb!];
}

// ——— Historial (semanas negativas = pasado). Dos temporadas de actividad.
const historial: [string, number, number, number][] = [
  // clave, semana, día, nº jugadores
  ['challenge', -54, 7, 18], ['copa', -50, 6, 16], ['presentacion', -46, 5, 20], ['copa', -42, 6, 16],
  ['challenge', -38, 7, 22], ['copa', -34, 6, 16], ['cup', -30, 7, 28], ['copa', -26, 6, 16],
  ['junior', -22, 6, 8], ['challenge', -18, 7, 24], ['copa', -14, 6, 16], ['presentacion', -10, 5, 22],
  ['cup', -7, 7, 30], ['copa', -4, 6, 16], ['challenge', -2, 7, 20],
];
for (const [clave, w, dia, n] of historial) {
  const pl = PL[clave];
  const h = clave === 'presentacion' ? '17:00' : clave === 'junior' ? '11:00' : '10:00';
  const t = nuevo(clave, semana(w, dia, h), { capacidad: Math.max(pl.capacidad, n) });
  inscribirTodos(t, elegir(clave === 'junior' ? peques : adultos, n), w);
  if (clave === 'presentacion') t.rondasSuizas = 4;
  if (clave === 'challenge') t.rondasSuizas = n > 20 ? 5 : 4;
  if (clave === 'cup') t.rondasSuizas = 5;
  completar(t);
}

// ——— En curso: Copa de hoy, con octavos terminados y cuartos a medias.
{
  const t = nuevo('copa', 'AHORA-180', { destacado: false });
  inscribirTodos(t, elegir(adultos, 16), 0);
  T.empezar(t, nick);
  const c = t.cuadro!;
  for (const p of c[0]) T.registrarResultado(t, p.id, ...marcador(p, 3));
  T.registrarResultado(t, c[1][0].id, ...marcador(c[1][0], 3));
  T.registrarResultado(t, c[1][1].id, ...marcador(c[1][1], 3));
  c[1][2].estado = 'en-curso';
  if (!ganador(c[1][0])) throw new Error('semilla incoherente');
}

// ——— Próximos torneos: un estado distinto cada uno.
const proximos: [string, string, number, Partial<Torneo>, number][] = [
  ['junior', semana(1, 6, '11:00'), 9, { cierreInscripciones: 'AHORA-60' }, 0], // cerradas
  ['challenge', semana(1, 7, '10:00'), 28, { rondasSuizas: 5 }, 3], // últimas plazas
  ['presentacion', semana(2, 5, '17:00'), 24, { rondasSuizas: 4 }, 2], // completo + lista de espera
  ['copa', semana(3, 6, '10:00'), 18, { capacidad: 32 }, 4], // abiertas 18/32
  ['cup', semana(4, 7, '09:30'), 31, { destacado: true, rondasSuizas: 6 }, 5], // destacado con cuenta atrás
  ['expandido', semana(5, 5, '17:00'), 7, { rondasSuizas: 4 }, 1], // abiertas
  ['comunidad', semana(8, 6, '10:00'), 0, { aperturaInscripciones: semana(2, 1, '10:00') }, 0], // próximamente
];
for (const [clave, inicio, n, extra, pend] of proximos) {
  const t = nuevo(clave, inicio, extra);
  const pool = clave === 'junior' ? peques : adultos;
  inscribirTodos(t, elegir(pool, n), 0, pend);
  if (clave === 'presentacion') {
    const fuera = adultos.filter((id) => !t.inscripciones.some((i) => i.jugadorId === id)).slice(0, 2);
    t.listaEspera = fuera.map((jugadorId, i) => ({ id: `${t.id}-e${i + 1}`, jugadorId, estado: 'pendiente', fecha: semana(-1, 4, '20:00'), origen: 'semilla' }));
  }
}

writeFileSync(new URL('../src/data/torneos.semilla.json', import.meta.url), JSON.stringify({ jugadores, torneos }));
console.log(`OK: ${Object.keys(jugadores).length} jugadores, ${torneos.length} torneos`);
