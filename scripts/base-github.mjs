/* Para publicar en una subcarpeta (GitHub Pages de proyecto: usuario.github.io/<repo>/).
   Reescribe las rutas internas que empiezan por "/" en el HTML y JS generados.
   Uso: BASE_PATH=/pagpoke node scripts/base-github.mjs  (después de "astro build" con el mismo BASE_PATH) */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (!base) throw new Error('Falta BASE_PATH, por ejemplo /pagpoke');
const SECCIONES = 'catalogo|torneos|agenda|tienda|vende-tu-coleccion|contacto|panel|productos|legal|og\\.jpg|favicon\\.svg|sitemap-index\\.xml';
// "/seccion..." dentro de comillas, comillas invertidas o paréntesis, y los enlaces a la portada href="/"
const rutas = new RegExp(`(["'\`(])/(?!/)(?=(?:${SECCIONES})\\b)`, 'g');
const portada = /(href=["'])\/(["'])/g;
// URLs absolutas (canonical, Open Graph, datos para Google, sitemap): https://dominio/... -> https://dominio/<base>/...
const origen = (process.env.SITE_URL || '').replace(/\/$/, '');
const absolutas = origen ? new RegExp(`${origen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(?!${base.slice(1)}/)`, 'g') : null;

let n = 0;
function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (/\.(html|js|xml|txt)$/.test(f)) {
      const s = readFileSync(p, 'utf8');
      let t = s.replace(rutas, `$1${base}/`).replace(portada, `$1${base}/$2`);
      if (absolutas) t = t.replace(absolutas, `${origen}${base}/`);
      if (t !== s) {
        writeFileSync(p, t);
        n++;
      }
    }
  }
}
recorrer('dist');
writeFileSync('dist/.nojekyll', ''); // GitHub Pages ignora carpetas que empiezan por "_" (como _astro) sin este archivo
console.log(`Rutas adaptadas a ${base}/ en ${n} archivos`);
