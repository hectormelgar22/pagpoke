import type { APIRoute, GetStaticPaths } from 'astro';
import { PRODUCTOS, productoPorId } from '../../data/catalogo.ts';
import { arteCarta, arteProducto } from '../../lib/arte.ts';

const HERO = [
  { id: 'hero-1', c1: '#FF7A45', c2: '#5A1430', marca: '199' },
  { id: 'hero-2', c1: '#7DE3FF', c2: '#3A1C8C', marca: '238' },
  { id: 'hero-3', c1: '#FFD84D', c2: '#8C3A0C', marca: '205' },
  { id: 'hero-4', c1: '#E28BFF', c2: '#2A1450', marca: '161' },
  { id: 'hero-5', c1: '#8CF0B0', c2: '#14405A', marca: '214' },
];

export const getStaticPaths: GetStaticPaths = () => [
  ...PRODUCTOS.map((p) => ({ params: { id: p.id } })),
  ...HERO.map((h) => ({ params: { id: h.id } })),
];

export const GET: APIRoute = ({ params }) => {
  const p = productoPorId.get(params.id!);
  const h = HERO.find((x) => x.id === params.id);
  const svg = p ? arteProducto(p.id, p.arte.tipo, p.arte.c1, p.arte.c2, p.arte.marca) : arteCarta(h!.id, h!.c1, h!.c2, h!.marca);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
