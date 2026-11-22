/* Lectura rápida del estado guardado SIN cargar los datos de torneos (para catálogo, fichas y cabecera).
   Si el visitante no ha cambiado nada, los precios y el stock son los del catálogo. */
import { PRODUCTOS } from '../data/catalogo.ts';
import type { EstadoDemo } from './tipos.ts';
import { CLAVE, EVENTO, VERSION } from './clave.ts';

const PORDEFECTO = Object.fromEntries(PRODUCTOS.map((p) => [p.id, { precio: p.precio, stock: p.stock }]));

export function guardado(): Partial<EstadoDemo> | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const e = JSON.parse(crudo) as EstadoDemo;
    return e?.version === VERSION ? e : null;
  } catch {
    return null;
  }
}

export const productosEstado = (): EstadoDemo['productos'] => ({ ...PORDEFECTO, ...(guardado()?.productos ?? {}) });
export const favoritos = (): string[] => guardado()?.favoritos ?? [];
export const alertas = (): EstadoDemo['alertas'] => guardado()?.alertas ?? [];

export function alCambiar(fn: () => void): void {
  addEventListener(EVENTO, fn);
  addEventListener('storage', (ev) => (ev.key === CLAVE || ev.key === null) && fn());
}

/** Carga el almacén completo solo cuando hay que guardar algo. */
type Almacen = typeof import('./almacen.ts');
let cargado: Almacen | null = null;
export const almacen = (): Promise<Almacen> => import('./almacen.ts').then((m) => (cargado = m));
/** Guarda en cuanto sea posible: al momento si el almacén ya está cargado (precargado al abrir un formulario). */
export function guardar(fn: (m: Almacen) => void): void {
  if (cargado) fn(cargado);
  else void almacen().then(fn);
}
