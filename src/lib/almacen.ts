/* Estado de la demo: datos de ejemplo + cambios hechos desde la web y el panel.
   En esta versión se guarda en el navegador (localStorage): NO es una base de datos y nadie más lo ve.
   Para una tienda real, sustituir cargar/guardar por llamadas a una API manteniendo la misma forma de datos. */
import type { EstadoDemo, Torneo } from './tipos.ts';
import semilla from '../data/torneos.semilla.json';
import { EVENTOS_PUNTUALES } from '../data/eventos.ts';
import { PRODUCTOS } from '../data/catalogo.ts';
import { tienda } from '../data/tienda.ts';
import { claveDia, desdeZona, partes, resolverFecha, sumarDias } from './fechas.ts';

const VERSION = 3;
const CLAVE = tienda.demo.claveAlmacen;
const EVENTO = 'destello:estado';

function mapearFechasTorneo(t: Torneo, f: (iso: string) => string): Torneo {
  return {
    ...t,
    inicio: f(t.inicio),
    aperturaInscripciones: t.aperturaInscripciones && f(t.aperturaInscripciones),
    cierreInscripciones: t.cierreInscripciones && f(t.cierreInscripciones),
    inscripciones: t.inscripciones.map((i) => ({ ...i, fecha: f(i.fecha) })),
    listaEspera: t.listaEspera.map((i) => ({ ...i, fecha: f(i.fecha) })),
  };
}

/** Estado de partida con las fechas de ejemplo colocadas alrededor de `ahora`. */
export function estadoInicial(ahora = new Date()): EstadoDemo {
  const datos = structuredClone(semilla) as unknown as { jugadores: EstadoDemo['jugadores']; torneos: Torneo[] };
  const f = (v: string) => resolverFecha(v, ahora);
  return {
    version: VERSION,
    ancla: ahora.toISOString(),
    modificado: false,
    jugadores: datos.jugadores,
    torneos: datos.torneos.map((t) => mapearFechasTorneo(t, f)),
    eventos: EVENTOS_PUNTUALES.map((e) => ({ ...e, inicio: f(e.inicio) })),
    productos: Object.fromEntries(PRODUCTOS.map((p) => [p.id, { precio: p.precio, stock: p.stock }])),
    reservas: [],
    consultas: [],
    ventas: [],
    alertas: [],
    favoritos: [],
  };
}

/** Mueve las fechas de la demo N días manteniendo la hora local (por si se reabre otro día). */
function desplazar(e: EstadoDemo, dias: number, ahora: Date): EstadoDemo {
  const f = (iso: string) => {
    const p = partes(iso);
    const [y, m, d] = sumarDias(`${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`, dias).split('-').map(Number);
    return desdeZona(y, m, d, p.h, p.min).toISOString();
  };
  return {
    ...e,
    ancla: ahora.toISOString(),
    torneos: e.torneos.map((t) => mapearFechasTorneo(t, f)),
    eventos: e.eventos.map((x) => ({ ...x, inicio: f(x.inicio) })),
  };
}

let memoria: EstadoDemo | null = null;
let persistente = true;

function leer(): EstadoDemo | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const e = JSON.parse(crudo) as EstadoDemo;
    return e && e.version === VERSION && Array.isArray(e.torneos) ? e : null;
  } catch {
    persistente = false;
    return null;
  }
}

function escribir(e: EstadoDemo): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
    persistente = true;
  } catch {
    persistente = false;
  }
}

export function cargar(ahora = new Date()): EstadoDemo {
  if (memoria) return memoria;
  let e = leer();
  if (e && tienda.demo.fechasRelativas) {
    const dias = Math.round((Date.parse(claveDia(ahora)) - Date.parse(claveDia(e.ancla))) / 86400000);
    if (dias !== 0) e = e.modificado ? desplazar(e, dias, ahora) : null;
  }
  memoria = e ?? estadoInicial(ahora);
  return memoria;
}

/** ¿Se están guardando los cambios? (false en navegación privada estricta o sin espacio). */
export const seGuarda = () => persistente;

/** Aplica un cambio, lo guarda y avisa a la página (y a otras pestañas abiertas). */
export function mutar<R>(cambio: (e: EstadoDemo) => R): R {
  const e = cargar();
  const resultado = cambio(e);
  e.modificado = true;
  escribir(e);
  window.dispatchEvent(new CustomEvent(EVENTO));
  return resultado;
}

/** Cambios que no cuentan como "la demo ha sido modificada" (p. ej. favoritos). */
export function mutarLigero<R>(cambio: (e: EstadoDemo) => R): R {
  const e = cargar();
  const r = cambio(e);
  escribir(e);
  window.dispatchEvent(new CustomEvent(EVENTO));
  return r;
}

export function restablecer(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: basta con olvidar la memoria */
  }
  memoria = null;
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export function suscribir(fn: () => void): () => void {
  const local = () => fn();
  const otraPestana = (ev: StorageEvent) => {
    if (ev.key === CLAVE || ev.key === null) {
      memoria = null;
      fn();
    }
  };
  window.addEventListener(EVENTO, local);
  window.addEventListener('storage', otraPestana);
  return () => {
    window.removeEventListener(EVENTO, local);
    window.removeEventListener('storage', otraPestana);
  };
}

export const nuevoId = (prefijo = 'n') => `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
