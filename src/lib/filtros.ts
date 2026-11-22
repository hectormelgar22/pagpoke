/* Búsqueda y filtros del catálogo (puros: se pueden probar y reutilizar en el asistente). */
import type { Categoria, Idioma, Producto, Rareza, Uso } from '../data/catalogo.ts';
import { expansionPorId, categoriaPorId, RAREZAS } from '../data/catalogo.ts';

export interface Filtros {
  q: string;
  categorias: Categoria[];
  expansiones: string[];
  rarezas: Rareza[];
  idiomas: Idioma[];
  soloDisponibles: boolean;
  min: number | null;
  max: number | null;
  usos: Uso[];
  orden: 'relevancia' | 'precio-asc' | 'precio-desc' | 'novedad' | 'nombre';
}

export const FILTROS_VACIOS: Filtros = {
  q: '', categorias: [], expansiones: [], rarezas: [], idiomas: [], soloDisponibles: false, min: null, max: null, usos: [], orden: 'relevancia',
};

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function textoBuscable(p: Producto): string {
  return norm(
    [p.nombre, p.numero, categoriaPorId.get(p.categoria)?.plural, p.expansion && expansionPorId.get(p.expansion)?.nombre, p.expansion && expansionPorId.get(p.expansion)?.codigo, p.rareza && RAREZAS[p.rareza].nombre, p.idioma, p.resumen]
      .filter(Boolean)
      .join(' '),
  );
}

type Estado = Record<string, { precio: number; stock: number }>;

export function filtrar(productos: Producto[], estado: Estado, f: Filtros): Producto[] {
  const palabras = norm(f.q).split(/\s+/).filter(Boolean);
  const res = productos.filter((p) => {
    const s = estado[p.id] ?? { precio: p.precio, stock: p.stock };
    if (palabras.length) {
      const t = textoBuscable(p);
      if (!palabras.every((w) => t.includes(w))) return false;
    }
    if (f.categorias.length && !f.categorias.includes(p.categoria)) return false;
    if (f.expansiones.length && (!p.expansion || !f.expansiones.includes(p.expansion))) return false;
    if (f.rarezas.length && (!p.rareza || !f.rarezas.includes(p.rareza))) return false;
    if (f.idiomas.length && (!p.idioma || !f.idiomas.includes(p.idioma))) return false;
    if (f.soloDisponibles && s.stock <= 0) return false;
    if (f.min != null && s.precio < f.min) return false;
    if (f.max != null && s.precio > f.max) return false;
    if (f.usos.length && !f.usos.some((u) => p.usos.includes(u))) return false;
    return true;
  });
  const relevancia = (p: Producto) =>
    (estado[p.id]?.stock > 0 ? 100 : 0) + (p.etiquetas.includes('destacado') ? 30 : 0) + (p.etiquetas.includes('mas-buscado') ? 20 : 0) + (p.etiquetas.includes('novedad') ? 15 : 0) - p.alta / 100;
  const precio = (p: Producto) => estado[p.id]?.precio ?? p.precio;
  const orden: Record<Filtros['orden'], (a: Producto, b: Producto) => number> = {
    relevancia: (a, b) => relevancia(b) - relevancia(a),
    'precio-asc': (a, b) => precio(a) - precio(b),
    'precio-desc': (a, b) => precio(b) - precio(a),
    novedad: (a, b) => a.alta - b.alta,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  };
  return res.sort(orden[f.orden]);
}

/** Filtros <-> URL (para compartir una búsqueda o enlazar desde otras páginas). */
export function desdeURL(params: URLSearchParams): Filtros {
  const lista = <T extends string>(k: string) => (params.get(k)?.split(',').filter(Boolean) ?? []) as T[];
  const num = (k: string) => (params.get(k) && !Number.isNaN(+params.get(k)!) ? +params.get(k)! : null);
  const orden = params.get('orden') as Filtros['orden'];
  return {
    q: params.get('q') ?? '',
    categorias: lista('categoria'),
    expansiones: lista('expansion'),
    rarezas: lista('rareza'),
    idiomas: lista('idioma'),
    soloDisponibles: params.get('disponible') === '1',
    min: num('min'),
    max: num('max'),
    usos: lista('uso'),
    orden: ['precio-asc', 'precio-desc', 'novedad', 'nombre'].includes(orden) ? orden : 'relevancia',
  };
}

export function aURL(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.categorias.length) p.set('categoria', f.categorias.join(','));
  if (f.expansiones.length) p.set('expansion', f.expansiones.join(','));
  if (f.rarezas.length) p.set('rareza', f.rarezas.join(','));
  if (f.idiomas.length) p.set('idioma', f.idiomas.join(','));
  if (f.soloDisponibles) p.set('disponible', '1');
  if (f.min != null) p.set('min', String(f.min));
  if (f.max != null) p.set('max', String(f.max));
  if (f.usos.length) p.set('uso', f.usos.join(','));
  if (f.orden !== 'relevancia') p.set('orden', f.orden);
  const s = p.toString();
  return s ? `?${s}` : '';
}
