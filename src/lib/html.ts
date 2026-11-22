/* Plantillas HTML seguras: todo lo interpolado se escapa salvo que se marque con raw().
   Las mismas funciones pintan en el servidor (al generar la web) y en el navegador. */

const SEGURO = Symbol('html-seguro');
export interface Seguro {
  [SEGURO]: true;
  valor: string;
  toString(): string;
}

export const raw = (valor: string): Seguro => ({ [SEGURO]: true, valor, toString: () => valor });

export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function pieza(v: unknown): string {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(pieza).join('');
  if (typeof v === 'object' && SEGURO in (v as object)) return (v as Seguro).valor;
  return esc(v);
}

export function html(partes: TemplateStringsArray, ...valores: unknown[]): Seguro {
  let out = partes[0];
  valores.forEach((v, i) => (out += pieza(v) + partes[i + 1]));
  return raw(out);
}

export const euros = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
