/* Asistente de compra: reglas sencillas sobre el catálogo real (sin IA). */
import { PRODUCTOS } from '../data/catalogo.ts';
import { filtrar, FILTROS_VACIOS, aURL, type Filtros } from './filtros.ts';
import { tarjetaProducto } from './vistas/producto.ts';
import { icono } from './iconos.ts';

export interface Respuestas {
  tipo: string;
  uso: string;
  presupuesto: string;
  expansion: string;
}
export const RESPUESTAS_INICIALES: Respuestas = { tipo: 'todo', uso: '', presupuesto: '0-99999', expansion: '' };
const CATS: Record<string, Filtros['categorias']> = { todo: [], cartas: ['cartas', 'coleccion'], sobres: ['sobres', 'cajas'], accesorios: ['accesorios', 'merch'] };

export function recomendar(d: Respuestas, productos: Record<string, { precio: number; stock: number }>): string {
  const [min, max] = d.presupuesto.split('-').map(Number);
  const base: Filtros = {
    ...FILTROS_VACIOS,
    categorias: CATS[d.tipo] ?? [],
    usos: d.uso ? [d.uso as Filtros['usos'][number]] : [],
    expansiones: d.expansion ? [d.expansion] : [],
    min: min || null,
    max: max >= 99999 ? null : max,
    soloDisponibles: true,
  };
  let res = filtrar(PRODUCTOS, productos, base);
  let aviso = '';
  if (!res.length && base.expansiones.length) {
    res = filtrar(PRODUCTOS, productos, { ...base, expansiones: [] });
    aviso = 'No tenemos nada de esa expansión con esos criterios; te enseñamos lo más parecido.';
  }
  if (!res.length && base.usos.length) {
    res = filtrar(PRODUCTOS, productos, { ...base, expansiones: [], usos: [] });
    aviso = 'No hay coincidencias exactas; te enseñamos lo más parecido dentro de tu presupuesto.';
  }
  const enlace = `/catalogo/${aURL(base)}`;
  return res.length
    ? `<div class="fila" style="justify-content:space-between"><p><strong>${res.length} ${res.length === 1 ? 'producto encaja' : 'productos encajan'}</strong>${aviso ? ` · <span style="color:var(--gris)">${aviso}</span>` : ''}</p><a class="enlace-flecha" href="${enlace}">Verlos en el catálogo ${icono('flecha')}</a></div>
       <div class="rejilla-productos">${res.slice(0, 4).map((p) => tarjetaProducto(p, productos[p.id])).join('')}</div>`
    : `<div class="vacio">${icono('lupa')}<p>Con ese presupuesto no tenemos nada en stock ahora mismo. Prueba a subirlo o pregúntanos: entra producto cada semana.</p></div>`;
}
