/* Tarjetas de producto: se usan al generar la web y al filtrar en el navegador. */
import { categoriaPorId, expansionPorId, IDIOMAS, RAREZAS, type Producto } from '../../data/catalogo.ts';
import { html, euros, raw } from '../html.ts';
import { icono } from '../iconos.ts';

export function textoStock(stock: number): { texto: string; clase: 'agotado' | 'pocas' | 'ok' } {
  if (stock <= 0) return { texto: 'Agotado', clase: 'agotado' };
  if (stock === 1) return { texto: 'Última unidad', clase: 'pocas' };
  if (stock <= 3) return { texto: `Quedan ${stock}`, clase: 'pocas' };
  return { texto: 'Disponible', clase: 'ok' };
}

export const urlProducto = (p: Producto) => `/catalogo/${p.slug}/`;
export const altArte = (p: Producto) => `${p.nombre}${p.numero ? ` ${p.numero}` : ''}`;

export function metaProducto(p: Producto): string {
  return [categoriaPorId.get(p.categoria)?.nombre, p.expansion && expansionPorId.get(p.expansion)?.nombre, p.idioma]
    .filter(Boolean)
    .join(' · ');
}

export function accionProducto(p: Producto, stock: number) {
  return stock > 0
    ? html`<button class="btn btn--acento btn--peq" type="button" data-reservar="${p.id}">${raw(icono('bolsa'))}Reservar</button>`
    : html`<button class="btn btn--fantasma btn--peq" type="button" data-avisar="${p.id}">${raw(icono('alerta'))}Avísame</button>`;
}

export function rarezaHTML(p: Producto) {
  if (!p.rareza) return '';
  const r = RAREZAS[p.rareza];
  return html`<span class="rareza rareza--${r.nivel}" title="${r.nombre}"><span aria-hidden="true">${r.simbolo}</span> ${r.nombre}</span>`;
}

export function tarjetaProducto(p: Producto, estado: { precio: number; stock: number }, opciones: { cargaPrioritaria?: boolean } = {}) {
  const s = textoStock(estado.stock);
  const etiqueta = p.etiquetas.includes('novedad') ? 'Novedad' : p.etiquetas.includes('mas-buscado') ? 'Muy buscado' : '';
  return html`<article class="producto" data-id="${p.id}" style="--c1:${p.arte.c1};--c2:${p.arte.c2}">
  <div class="producto-arte">
    <img src="/productos/${p.id}.webp" width="600" height="600" alt="${altArte(p)}" loading="${opciones.cargaPrioritaria ? 'eager' : 'lazy'}" decoding="async" />
    ${etiqueta ? html`<span class="sello">${etiqueta}</span>` : ''}
    ${rarezaHTML(p)}
  </div>
  <button class="producto-fav" type="button" data-favorito="${p.id}" aria-pressed="false" aria-label="Guardar ${p.nombre} en favoritos">${raw(icono('corazon'))}</button>
  <div class="producto-info">
    <p class="producto-meta">${metaProducto(p)}</p>
    <h3 class="producto-nombre"><a href="${urlProducto(p)}">${p.nombre}</a></h3>
    ${p.numero || p.condicion ? html`<p class="producto-num mono">${[p.numero, p.condicion].filter(Boolean).join(' · ')}</p>` : ''}
    <div class="producto-pie">
      <span class="precio cifra" data-precio="${p.id}">${euros(estado.precio)}</span>
      <span class="stock stock--${s.clase}" data-stock="${p.id}">${s.texto}</span>
    </div>
    <div class="producto-accion" data-accion="${p.id}">${accionProducto(p, estado.stock)}</div>
  </div>
</article>`;
}

export function fichaResumen(p: Producto, estado: { precio: number; stock: number }) {
  return html`<div class="mini-producto">
  <img src="/productos/${p.id}.webp" width="80" height="80" alt="" />
  <div><p class="producto-meta">${metaProducto(p)}</p><p class="h3">${p.nombre}</p>
  <p class="mono" style="margin-top:4px">${euros(estado.precio)} · ${textoStock(estado.stock).texto}</p></div>
</div>`;
}

export const idiomaTexto = (p: Producto) => (p.idioma ? IDIOMAS[p.idioma] : '—');
