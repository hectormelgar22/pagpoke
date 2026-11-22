/* Modelo de datos compartido por la web pública, el panel y (en el futuro) un backend.
   Si se conecta una API, estas interfaces son el contrato de lo que debe devolver. */

export type Division = 'junior' | 'senior' | 'master';
export type TipoEvento = 'torneo' | 'liga' | 'presentacion' | 'especial' | 'casual';
/** 'doble-eliminacion' está reservado en el modelo; el motor actual implementa los otros tres. */
export type Formato = 'eliminacion' | 'suizo' | 'suizo-top' | 'doble-eliminacion';
export type EstadoPartida = 'pendiente' | 'en-curso' | 'finalizada';
export type EstadoTorneo =
  | 'proximamente'
  | 'abiertas'
  | 'ultimas-plazas'
  | 'completo'
  | 'cerradas'
  | 'en-curso'
  | 'finalizado';

export interface Jugador {
  id: string;
  nick: string;
  /** Nombre visible: nombre de pila + inicial. Nunca apellidos completos. */
  nombre: string;
  division: Division;
}

export interface Inscripcion {
  id: string;
  jugadorId: string;
  estado: 'confirmada' | 'pendiente';
  fecha: string;
  /** Solo lo ve el panel. */
  contacto?: string;
  idOficial?: string;
  origen: 'semilla' | 'web' | 'panel';
}

export interface Partida {
  id: string;
  a: string | null;
  b: string | null;
  /** Juegos ganados por a y por b. */
  ga: number | null;
  gb: number | null;
  estado: EstadoPartida;
  /** Pase directo: no hay rival. */
  bye?: boolean;
  mesa?: number;
}

export interface Torneo {
  id: string;
  slug: string;
  numero: number;
  nombre: string;
  tipo: TipoEvento;
  formato: Formato;
  modalidad: string;
  inicio: string;
  duracionMin: number;
  ubicacion: string;
  capacidad: number;
  precio: number;
  mejorDe: 1 | 3;
  resumen: string;
  descripcion: string;
  premios: string[];
  reglas: string[];
  desarrollo: string[];
  faq: { p: string; r: string }[];
  /** Si existe y es futura, el torneo aparece como "Próximamente". */
  aperturaInscripciones: string | null;
  /** Si existe y ya pasó, las inscripciones están cerradas. */
  cierreInscripciones: string | null;
  /** Interruptor manual del propietario. */
  inscripcionesAbiertas: boolean;
  finalizado: boolean;
  inscripciones: Inscripcion[];
  listaEspera: Inscripcion[];
  rondasSuizas: number;
  topCorte: number;
  suizo: Partida[][];
  cuadro: Partida[][] | null;
  destacado: boolean;
  tema: 'ambar' | 'violeta' | 'cian' | 'rosa' | 'verde';
  creadoEnPanel?: boolean;
}

export interface EventoRecurrente {
  id: string;
  tipo: TipoEvento;
  nombre: string;
  descripcion: string;
  /** 1 = lunes … 7 = domingo */
  dia: number;
  hora: string;
  duracionMin: number;
}

export interface EventoPuntual {
  id: string;
  tipo: TipoEvento;
  nombre: string;
  descripcion: string;
  inicio: string;
  duracionMin: number;
}

export interface Reserva {
  id: string;
  productoId: string;
  cantidad: number;
  nombre: string;
  contacto: string;
  recogida: string;
  nota: string;
  fecha: string;
  estado: 'pendiente' | 'confirmada' | 'entregada' | 'cancelada';
}

export interface Consulta {
  id: string;
  nombre: string;
  contacto: string;
  motivo: string;
  mensaje: string;
  fecha: string;
  atendida: boolean;
}

export interface SolicitudVenta {
  id: string;
  operacion: 'vender' | 'intercambiar' | 'valorar';
  material: string;
  cantidad: string;
  estadoCartas: string;
  detalle: string;
  fotos: number;
  nombre: string;
  contacto: string;
  fecha: string;
  atendida: boolean;
}

export interface AlertaStock {
  id: string;
  productoId: string;
  nombre: string;
  contacto: string;
  fecha: string;
  avisado: boolean;
}

export interface EstadoProducto {
  precio: number;
  stock: number;
}

export interface EstadoDemo {
  version: number;
  /** Fecha (ISO) con la que se resolvieron las fechas relativas de la demo. */
  ancla: string;
  modificado: boolean;
  jugadores: Record<string, Jugador>;
  torneos: Torneo[];
  eventos: EventoPuntual[];
  productos: Record<string, EstadoProducto>;
  reservas: Reserva[];
  consultas: Consulta[];
  ventas: SolicitudVenta[];
  alertas: AlertaStock[];
  favoritos: string[];
}
