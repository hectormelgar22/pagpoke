/* Descarga imágenes reales de producto (catálogo de TCGplayer) a public/productos/.
   Solo para la demo privada: son imágenes con derechos de terceros, no publicar sin permiso.
   Uso: node scripts/descargar-imagenes.mjs */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const BUSQUEDAS = {
  'charizard-ex-151-199': ['Charizard ex 199/165', 'Cards', '151'],
  'umbreon-ex-pre-161': ['Umbreon ex 161/131', 'Cards', 'Prismatic'],
  'pikachu-ex-ssp-238': ['Pikachu ex 238/191', 'Cards', 'Surging'],
  'mew-ex-151-205': ['Mew ex 205/165', 'Cards', '151'],
  'gardevoir-ex-svi-245': ['Gardevoir ex 245/198', 'Cards', 'Scarlet'],
  'iono-pal-269': ['Iono 269/193', 'Cards', 'Paldea Evolved'],
  'greninja-ex-twm-214': ['Greninja ex 214/167', 'Cards', 'Twilight'],
  'dragapult-ex-twm-200': ['Dragapult ex 200/167', 'Cards', 'Twilight'],
  'terapagos-ex-scr-170': ['Terapagos ex 170/142', 'Cards', 'Stellar'],
  'charizard-ex-obf-223': ['Charizard ex 223/197', 'Cards', 'Obsidian'],
  'lugia-v-sit-186': ['Lugia V Alternate Full Art 186/195', 'Cards', 'Silver Tempest'],
  'gardevoir-ex-svi-086': ['Gardevoir ex 086/198', 'Cards', 'Scarlet'],
  'arven-svi-166': ['Arven 166/198', 'Cards', 'Scarlet'],
  'sobre-megaevolucion': ['Mega Evolution Booster Pack', 'Sealed Products', 'Mega Evolution'],
  'sobre-rivales': ['Destined Rivals Booster Pack', 'Sealed Products', 'Destined'],
  'sobre-aventuras': ['Journey Together Booster Pack', 'Sealed Products', 'Journey'],
  'sobre-chispas': ['Surging Sparks Booster Pack', 'Sealed Products', 'Surging'],
  'sobre-151-jp': ['Pokemon Card 151 Booster Pack', 'Sealed Products', '151'],
  'display-megaevolucion': ['Mega Evolution Booster Box', 'Sealed Products', 'Mega Evolution'],
  'etb-megaevolucion': ['Mega Evolution Elite Trainer Box', 'Sealed Products', 'Mega Evolution'],
  'etb-prismaticas': ['Prismatic Evolutions Elite Trainer Box', 'Sealed Products', 'Prismatic'],
  'upc-151': ['151 Ultra Premium Collection', 'Sealed Products', '151'],
  'lata-destinos': ['Paldean Fates Tin', 'Sealed Products', 'Paldean Fates'],
  'blister-rivales': ['Destined Rivals 3 Pack Blister', 'Sealed Products', 'Destined'],
  'mazos-iniciacion': ['Scarlet Violet Trainer Battle Deck', 'Sealed Products', ''],
  'mazo-liga': ['League Battle Deck', 'Sealed Products', ''],
  'charizard-base-psa8': ['Charizard 4/102 Base Set Holo', 'Cards', 'Base Set'],
  'umbreon-vmax-psa9': ['Umbreon VMAX Alternate Art Secret 215/203', 'Cards', 'Evolving Skies'],
  'display-151-jp': ['Pokemon Card 151 Booster Box Japanese', 'Sealed Products', '151'],
  'fundas-mate': ['Ultra PRO Pokemon Deck Protector Sleeves', 'Supplies', ''],
  'archivador-9': ['Ultra PRO Pokemon 9-Pocket PRO-Binder', 'Supplies', ''],
  'deckbox': ['Ultra PRO Pokemon Deck Box', 'Supplies', ''],
  'tapete-noche': ['Ultra PRO Pokemon Playmat', 'Supplies', ''],
  'toploaders': ['Ultra PRO Toploader', 'Supplies', ''],
};

async function buscar(q, tipo, set) {
  const filtros = { productLineName: ['pokemon', 'pokemon-japan'] };
  const r = await fetch(`https://mp-search-api.tcgplayer.com/v1/search/request?q=${encodeURIComponent(q)}&isList=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ algorithm: '', from: 0, size: 12, filters: { term: filtros }, listingSearch: {}, context: { cart: {}, shippingCountry: 'US' }, settings: {} }),
  });
  const j = await r.json();
  const res = j.results?.[0]?.results ?? [];
  const ok = res.filter((x) => (!set || x.setName?.includes(set)) && (tipo === 'Supplies' || x.productTypeName === tipo || tipo === 'Cards' && /card/i.test(x.productTypeName ?? '')));
  return (ok[0] ?? res[0]) ?? null;
}

mkdirSync('public/productos', { recursive: true });
for (const [id, [q, tipo, set]] of Object.entries(BUSQUEDAS)) {
  const destino = `public/productos/${id}.webp`;
  if (existsSync(destino)) continue;
  try {
    const p = await buscar(q, tipo, set);
    if (!p) throw new Error('sin resultados');
    const img = await fetch(`https://tcgplayer-cdn.tcgplayer.com/product/${Math.round(p.productId)}_in_1000x1000.jpg`);
    if (!img.ok) throw new Error(`imagen ${img.status}`);
    const buf = Buffer.from(await img.arrayBuffer());
    await sharp(buf).resize(600, 600, { fit: 'inside' }).webp({ quality: 82 }).toFile(destino);
    console.log('OK ', id, '←', p.productName, '|', p.setName);
  } catch (e) {
    console.log('ERR', id, e.message);
  }
}
writeFileSync('public/productos/LEEME.txt', 'Imágenes de producto de TCGplayer para la demo privada. No publicar sin permiso de los titulares.\n');
