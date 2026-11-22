/* Ilustraciones propias de producto en SVG (sin arte ni logotipos oficiales).
   Se generan a partir de los datos del catálogo: si cambias colores o tipo, la imagen cambia sola.
   Para una tienda real se sustituyen por fotos (campo opcional en el catálogo). */
import type { TipoArte } from '../data/catalogo.ts';

const ESTRELLA = 'M0-30C2.4-10 10-2.4 30 0 10 2.4 2.4 10 0 30-2.4 10-10 2.4-30 0-10-2.4-2.4-10 0-30Z';
const HOLO = ['#5EEAD4', '#A78BFA', '#F472B6', '#FFB547', '#5EEAD4'];

function defs(id: string, c1: string, c2: string): string {
  return `<defs>
<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="${id}h" x1="0" y1="0" x2="1" y2=".6">${HOLO.map((c, i) => `<stop offset="${i / (HOLO.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}r" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".45" stop-color="${c1}" stop-opacity=".35"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}s"><stop offset="0" stop-color="#0B0A14" stop-opacity=".45"/><stop offset="1" stop-color="#0B0A14" stop-opacity="0"/></radialGradient>
</defs>`;
}

const sombra = (id: string, cx = 200, cy = 452, rx = 120) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="18" fill="url(#${id}s)"/>`;
const estrella = (x: number, y: number, s: number, fill = '#fff', op = 1) =>
  `<path d="${ESTRELLA}" transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity="${op}"/>`;
const texto = (x: number, y: number, t: string, tam: number, color = '#fff', anchor = 'middle', peso = 700) =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${tam}" font-weight="${peso}" text-anchor="${anchor}" letter-spacing="1.5">${t}</text>`;

/** Cara de carta: marco, ventana de ilustración abstracta y lámina holográfica. */
function cartaCara(id: string, x: number, y: number, w: number, h: number, marca = ''): string {
  const ix = x + w * 0.08, iy = y + h * 0.12, iw = w * 0.84, ih = h * 0.5;
  const cx = ix + iw / 2, cy = iy + ih / 2;
  const rayos = Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6;
    return `<path d="M${cx} ${cy}L${cx + Math.cos(a) * iw} ${cy + Math.sin(a) * iw}" stroke="#fff" stroke-opacity=".14" stroke-width="${k % 2 ? 2 : 6}"/>`;
  }).join('');
  return `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.06}" fill="#1B1930"/>
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${w * 0.045}" fill="url(#${id}g)"/>
<rect x="${x + w * 0.08}" y="${y + h * 0.045}" width="${w * 0.6}" height="${h * 0.045}" rx="3" fill="#fff" opacity=".85"/>
<circle cx="${x + w * 0.86}" cy="${y + h * 0.067}" r="${h * 0.025}" fill="#fff" opacity=".85"/>
<svg x="${ix}" y="${iy}" width="${iw}" height="${ih}" viewBox="${ix} ${iy} ${iw} ${ih}"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#${id}g)"/>${rayos}<circle cx="${cx}" cy="${cy}" r="${ih * 0.42}" fill="url(#${id}r)"/><circle cx="${cx}" cy="${cy}" r="${ih * 0.3}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>${estrella(cx, cy, ih / 130)}<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#${id}h)" opacity=".28"/></svg>
<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
${[0, 1, 2].map((k) => `<rect x="${x + w * 0.1}" y="${y + h * (0.68 + k * 0.075)}" width="${w * (k === 2 ? 0.5 : 0.8)}" height="${h * 0.028}" rx="2" fill="#fff" opacity=".55"/>`).join('')}
${marca ? texto(x + w * 0.88, y + h * 0.95, marca, h * 0.04, '#fff', 'end') : ''}
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${w * 0.045}" fill="url(#${id}h)" opacity=".22"/>
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${w * 0.045}" fill="url(#${id}b)"/>
</g>`;
}

function sobre(id: string, marca = ''): string {
  const dientes = (y: number, dir: number) =>
    Array.from({ length: 23 }, (_, k) => `${110 + k * 8.2} ${y + (k % 2 ? dir * 7 : 0)}`).join(' L');
  return `${sombra(id, 200, 455, 110)}
<g transform="rotate(-4 200 250)">
<path d="M110 70 L${dientes(70, -1)} L290 70 L290 430 L${dientes(430, 1).split(' L').reverse().join(' L')} L110 430Z" fill="url(#${id}g)"/>
<rect x="110" y="70" width="180" height="22" fill="#000" opacity=".18"/><rect x="110" y="408" width="180" height="22" fill="#000" opacity=".18"/>
<rect x="110" y="92" width="180" height="316" fill="url(#${id}h)" opacity=".3"/>
<circle cx="200" cy="230" r="70" fill="url(#${id}r)"/>${estrella(200, 230, 1.6)}
<path d="M110 300 L290 180 L290 230 L110 350Z" fill="#fff" opacity=".12"/>
${texto(200, 370, marca, 22)}
<rect x="110" y="92" width="180" height="316" fill="url(#${id}b)"/>
</g>`;
}

function caja(id: string, marca = '', alta = false): string {
  const h = alta ? 230 : 170, top = alta ? 120 : 170;
  return `${sombra(id, 200, 440, 150)}
<path d="M70 ${top} L230 ${top - 40} L340 ${top} L180 ${top + 40}Z" fill="url(#${id}g)"/>
<path d="M70 ${top} L230 ${top - 40} L340 ${top} L180 ${top + 40}Z" fill="#fff" opacity=".25"/>
<path d="M70 ${top} L180 ${top + 40} L180 ${top + 40 + h} L70 ${top + h}Z" fill="url(#${id}g)"/>
<path d="M180 ${top + 40} L340 ${top} L340 ${top + h} L180 ${top + 40 + h}Z" fill="url(#${id}g)"/>
<path d="M180 ${top + 40} L340 ${top} L340 ${top + h} L180 ${top + 40 + h}Z" fill="#000" opacity=".28"/>
<path d="M70 ${top} L180 ${top + 40} L180 ${top + 40 + h} L70 ${top + h}Z" fill="url(#${id}h)" opacity=".25"/>
${alta ? `<path d="M70 ${top + 50} L180 ${top + 90} L340 ${top + 50}" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>` : ''}
${estrella(125, top + h / 2 + 22, 1.1)}
<g transform="skewY(-14) translate(0 ${top * 0.25 + 50})">${texto(262, top + h / 2 + 28, marca, 26)}</g>`;
}

function lata(id: string, marca = ''): string {
  return `${sombra(id, 200, 440, 130)}
<rect x="85" y="130" width="230" height="290" rx="26" fill="url(#${id}g)"/>
<rect x="85" y="130" width="230" height="290" rx="26" fill="url(#${id}h)" opacity=".25"/>
<rect x="78" y="118" width="244" height="50" rx="18" fill="#D9DCE6"/><rect x="78" y="118" width="244" height="50" rx="18" fill="url(#${id}b)"/>
<circle cx="200" cy="290" r="72" fill="url(#${id}r)"/>${estrella(200, 290, 1.7)}
${texto(200, 395, marca, 22)}<rect x="85" y="168" width="230" height="252" rx="26" fill="url(#${id}b)" opacity=".6"/>`;
}

function blister(id: string, marca = ''): string {
  const pack = (x: number, r: number) =>
    `<g transform="rotate(${r} ${x + 45} 260)"><rect x="${x}" y="150" width="90" height="210" rx="6" fill="url(#${id}g)"/><rect x="${x}" y="150" width="90" height="210" rx="6" fill="url(#${id}h)" opacity=".35"/>${estrella(x + 45, 245, 0.8)}</g>`;
  return `${sombra(id)}<rect x="70" y="70" width="260" height="360" rx="16" fill="#1B1930"/><rect x="70" y="70" width="260" height="360" rx="16" fill="url(#${id}g)" opacity=".35"/>
<circle cx="200" cy="96" r="10" fill="#0B0A14"/>${pack(95, -10)}${pack(155, 0)}${pack(215, 10)}
<rect x="80" y="130" width="240" height="250" rx="22" fill="#fff" opacity=".14"/>${texto(200, 410, marca, 20)}`;
}

function mazo(id: string): string {
  const box = (x: number, y: number, o: number) =>
    `<g opacity="${o}"><rect x="${x}" y="${y}" width="120" height="180" rx="10" fill="url(#${id}g)"/><rect x="${x}" y="${y}" width="120" height="44" rx="10" fill="#000" opacity=".25"/>${estrella(x + 60, y + 112, 1)}<rect x="${x}" y="${y}" width="120" height="180" rx="10" fill="url(#${id}b)"/></g>`;
  return `${sombra(id, 200, 440, 140)}${box(95, 200, 1)}${box(185, 230, 1)}`;
}

function fundas(id: string): string {
  const capas = Array.from({ length: 6 }, (_, k) => `<rect x="${110 + k * 6}" y="${110 - k * 6}" width="170" height="250" rx="10" fill="url(#${id}g)" opacity="${0.55 + k * 0.08}" stroke="#fff" stroke-opacity=".25"/>`).join('');
  return `${sombra(id)}${capas}<rect x="140" y="80" width="170" height="250" rx="10" fill="url(#${id}h)" opacity=".2"/>
<rect x="100" y="300" width="220" height="130" rx="10" fill="#1B1930"/><rect x="100" y="300" width="220" height="40" rx="10" fill="url(#${id}g)"/>${estrella(210, 382, 0.9)}`;
}

function archivador(id: string): string {
  return `${sombra(id, 200, 450, 140)}<rect x="80" y="70" width="250" height="360" rx="18" fill="url(#${id}g)"/>
<rect x="80" y="70" width="250" height="360" rx="18" fill="url(#${id}b)" opacity=".5"/>
<rect x="72" y="80" width="14" height="340" rx="7" fill="#C9C6D6"/>
${Array.from({ length: 9 }, (_, k) => `<rect x="${118 + (k % 3) * 64}" y="${120 + Math.floor(k / 3) * 92}" width="54" height="78" rx="5" fill="url(#${id}h)" opacity=".45" stroke="#fff" stroke-opacity=".3"/>`).join('')}`;
}

function deckbox(id: string): string {
  return `${sombra(id, 200, 440, 110)}<rect x="120" y="120" width="160" height="300" rx="14" fill="url(#${id}g)"/>
<path d="M120 134a14 14 0 0 1 14-14h132a14 14 0 0 1 14 14v96H120Z" fill="#000" opacity=".3"/><rect x="185" y="222" width="30" height="14" rx="6" fill="#fff" opacity=".7"/>
${estrella(200, 320, 1.2)}<rect x="120" y="120" width="160" height="300" rx="14" fill="url(#${id}b)"/>`;
}

function tapete(id: string): string {
  const zonas = [130, 180, 230, 280].map((x) => `<rect x="${x - 18}" y="292" width="36" height="50" rx="4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-dasharray="5 4"/>`).join('');
  return `${sombra(id, 200, 430, 175)}<path d="M40 380 L95 210 L305 210 L360 380Z" fill="url(#${id}g)"/>
<path d="M40 380 L95 210 L305 210 L360 380Z" fill="url(#${id}h)" opacity=".18"/>${estrella(200, 250, 1.1, '#fff', 0.9)}${zonas}
<path d="M40 380 L360 380 L360 392 L40 392Z" fill="#000" opacity=".4"/>`;
}

function toploader(id: string): string {
  return `${sombra(id, 200, 450, 100)}<rect x="110" y="60" width="180" height="380" rx="10" fill="#E8EEF8" opacity=".55" stroke="#fff"/>
${cartaCara(id, 125, 95, 150, 210)}<rect x="110" y="60" width="180" height="22" fill="#fff" opacity=".5"/><rect x="110" y="60" width="180" height="380" rx="10" fill="url(#${id}b)"/>`;
}

function almacen(id: string): string {
  return `${sombra(id, 200, 430, 170)}<path d="M50 230 L270 190 L350 220 L130 262Z" fill="#E6D9BE"/>
<path d="M50 230 L130 262 L130 380 L50 345Z" fill="#CDBB95"/><path d="M130 262 L350 220 L350 335 L130 380Z" fill="#DCCBA6"/>
${estrella(240, 300, 0.9, '#6F6656', 0.8)}`;
}

function slab(id: string, marca = ''): string {
  return `${sombra(id, 200, 455, 120)}<rect x="95" y="40" width="210" height="400" rx="14" fill="#E9EDF5" opacity=".7" stroke="#fff" stroke-width="2"/>
<rect x="110" y="55" width="180" height="58" rx="6" fill="#fff"/><rect x="110" y="55" width="6" height="58" fill="#C2261F"/>
${texto(282, 92, marca, 20, '#15131F', 'end', 800)}<rect x="126" y="70" width="70" height="8" rx="2" fill="#15131F" opacity=".5"/><rect x="126" y="86" width="50" height="8" rx="2" fill="#15131F" opacity=".3"/>
${cartaCara(id, 122, 128, 156, 220)}<rect x="95" y="40" width="210" height="400" rx="14" fill="url(#${id}b)"/>`;
}

function textil(id: string, tipo: 'camiseta' | 'taza' | 'tote'): string {
  if (tipo === 'camiseta')
    return `${sombra(id, 200, 445, 150)}<path d="M150 80 L110 95 L50 150 L90 200 L120 180 L120 420 L280 420 L280 180 L310 200 L350 150 L290 95 L250 80 C240 105 160 105 150 80Z" fill="url(#${id}g)"/>
${estrella(200, 230, 1.5, 'url(#' + id + 'h)')}${texto(200, 300, 'DESTELLO', 18, '#F3F1F8')}`;
  if (tipo === 'taza')
    return `${sombra(id, 190, 430, 120)}<path d="M290 200 h20 a50 50 0 0 1 0 110 h-20" fill="none" stroke="url(#${id}g)" stroke-width="18"/>
<path d="M100 140 h190 v240 a30 30 0 0 1 -30 30 h-130 a30 30 0 0 1 -30 -30Z" fill="url(#${id}g)"/><ellipse cx="195" cy="140" rx="95" ry="14" fill="#0B0A14" opacity=".5"/>
${estrella(195, 270, 1.2, 'url(#' + id + 'h)')}`;
  return `${sombra(id, 200, 445, 140)}<path d="M150 150 C150 60 250 60 250 150" fill="none" stroke="#0B0A14" stroke-width="10"/>
<path d="M90 150 h220 l20 280 h-260Z" fill="url(#${id}g)"/>${estrella(200, 290, 1.4, '#0B0A14')}${texto(200, 370, 'DESTELLO', 18, '#0B0A14')}`;
}

export function arteProducto(id: string, tipo: TipoArte, c1: string, c2: string, marca = ''): string {
  const k = id.replace(/[^a-z0-9]/gi, '').slice(0, 12);
  let cuerpo: string;
  switch (tipo) {
    case 'carta': cuerpo = `${sombra(k, 200, 452, 110)}<g transform="rotate(-3 200 250)">${cartaCara(k, 90, 80, 220, 308, marca)}</g>`; break;
    case 'slab': cuerpo = slab(k, marca); break;
    case 'sobre': cuerpo = sobre(k, marca); break;
    case 'caja': cuerpo = caja(k, marca); break;
    case 'etb': cuerpo = caja(k, marca, true); break;
    case 'lata': cuerpo = lata(k, marca); break;
    case 'blister': cuerpo = blister(k, marca); break;
    case 'mazo': cuerpo = mazo(k); break;
    case 'fundas': cuerpo = fundas(k); break;
    case 'archivador': cuerpo = archivador(k); break;
    case 'deckbox': cuerpo = deckbox(k); break;
    case 'tapete': cuerpo = tapete(k); break;
    case 'toploader': cuerpo = toploader(k); break;
    case 'almacen': cuerpo = almacen(k); break;
    default: cuerpo = textil(k, tipo);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">${defs(k, c1, c2)}${cuerpo}</svg>`;
}

/** Carta suelta para composiciones (hero): solo la cara, sin sombra. */
export function arteCarta(id: string, c1: string, c2: string, marca = ''): string {
  const k = id.replace(/[^a-z0-9]/gi, '').slice(0, 12);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350" width="250" height="350">${defs(k, c1, c2)}${cartaCara(k, 0, 0, 250, 350, marca)}</svg>`;
}
