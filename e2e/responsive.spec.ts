/* Sin desbordamiento horizontal en ninguna página y ancho. Guarda capturas para revisión visual. */
import { test, expect } from '@playwright/test';

const ANCHOS = [320, 360, 390, 430, 768, 1024, 1440, 1920];
const PAGINAS = [
  ['inicio', '/'], ['catalogo', '/catalogo/'], ['producto', '/catalogo/charizard-ex-151-199/'], ['torneos', '/torneos/'],
  ['torneo-en-curso', '/torneos/copa-016/'], ['torneo-suizo', '/torneos/cup-013/'], ['torneo-abierto', '/torneos/copa-020/'],
  ['clasificacion', '/torneos/clasificacion/'], ['historial', '/torneos/historial/'], ['agenda', '/agenda/'], ['tienda', '/tienda/'],
  ['vende', '/vende-tu-coleccion/'], ['contacto', '/contacto/'], ['panel', '/panel/'], ['panel-torneo', '/panel/#torneo/t016'], ['panel-productos', '/panel/#productos'],
];
const CAPTURAR = new Set([390, 1440]);

for (const ancho of ANCHOS) {
  test(`sin desbordamiento a ${ancho}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: ancho, height: ancho < 768 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const fallos: string[] = [];
    for (const [nombre, url] of PAGINAS) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const r = await page.evaluate(() => {
        const ancho = document.documentElement.clientWidth;
        const culpables = [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.right <= ancho + 1) return false;
            // ignora lo que está dentro de un contenedor con scroll horizontal propio o recortado
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
              const s = getComputedStyle(p);
              if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowX)) return false;
            }
            return true;
          })
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
        return { scroll: document.documentElement.scrollWidth, ancho, culpables };
      });
      if (r.scroll > r.ancho + 1) fallos.push(`${nombre}: ${r.scroll}px > ${r.ancho}px (${r.culpables.join(', ')})`);
      if (CAPTURAR.has(ancho)) {
        // recorre la página para que carguen las imágenes diferidas antes de la captura
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForLoadState('networkidle');
      }
      if (CAPTURAR.has(ancho)) await page.screenshot({ path: `test-results/capturas/${ancho}-${nombre}.png`, fullPage: true });
    }
    expect(fallos, fallos.join('\n')).toEqual([]);
  });
}
