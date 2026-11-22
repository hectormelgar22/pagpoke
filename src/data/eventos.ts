/* Agenda: eventos que se repiten cada semana y eventos sueltos.
   Los torneos con inscripción están en torneos.semilla.json (o se crean desde el panel). */
import type { EventoPuntual, EventoRecurrente, TipoEvento } from '../lib/tipos.ts';

export const TIPOS_EVENTO: Record<TipoEvento, { nombre: string; color: string }> = {
  torneo: { nombre: 'Torneo', color: '#FFB547' },
  liga: { nombre: 'Liga', color: '#5EEAD4' },
  presentacion: { nombre: 'Presentación', color: '#F472B6' },
  especial: { nombre: 'Evento especial', color: '#A78BFA' },
  casual: { nombre: 'Juego libre', color: '#93C5FD' },
};

export const EVENTOS_SEMANALES: EventoRecurrente[] = [
  {
    id: 'liga-jueves', tipo: 'liga', nombre: 'Liga Pokémon', dia: 4, hora: '18:00', duracionMin: 180,
    descripcion: 'Partidas de liga con puntos de temporada. Entrada libre: ven con tu mazo o te prestamos uno.',
  },
  {
    id: 'libre-viernes', tipo: 'casual', nombre: 'Tarde de juego libre', dia: 5, hora: '17:30', duracionMin: 240,
    descripcion: 'Mesas abiertas para jugar, probar mazos e intercambiar cartas. Sin inscripción.',
  },
  {
    id: 'aprende-sabado', tipo: 'casual', nombre: 'Aprende a jugar', dia: 6, hora: '12:00', duracionMin: 90,
    descripcion: 'Sesión para principiantes de cualquier edad. Te enseñamos con mazos de la tienda.',
  },
];

/** Fechas relativas al día de hoy (ver resolverFecha en src/lib/fechas.ts). */
export const EVENTOS_PUNTUALES: EventoPuntual[] = [
  {
    id: 'intercambio', tipo: 'especial', nombre: 'Noche de intercambio', inicio: 'S+1/5 19:30', duracionMin: 150,
    descripcion: 'Trae tus carpetas: mesas de intercambio, tasación rápida en mostrador y un sorteo entre asistentes.',
  },
  {
    id: 'taller-estado', tipo: 'especial', nombre: 'Taller: cómo valorar el estado de tus cartas', inicio: 'S+3/3 19:00', duracionMin: 90,
    descripcion: 'Aprende a distinguir NM, EX o GD, a revisar centrado y bordes, y a guardar bien tu colección.',
  },
  {
    id: 'cierre-liga', tipo: 'liga', nombre: 'Cierre de liga y entrega de premios', inicio: 'S+6/4 19:00', duracionMin: 120,
    descripcion: 'Última jornada de la liga de temporada y premios para los primeros clasificados.',
  },
];
