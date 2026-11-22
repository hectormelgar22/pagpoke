/* Pruebas de extremo a extremo de los flujos que se enseñan en la demo. */
import { test, expect, type Page } from '@playwright/test';

const errores: string[] = [];
test.beforeEach(async ({ page }) => {
  errores.length = 0;
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  page.on('dialog', (d) => d.accept());
  // Los enlaces de WhatsApp se abren en otra ventana: los registramos en lugar de abrirlos
  await page.addInitScript(() => {
    (window as unknown as { __abiertos: string[] }).__abiertos = [];
    window.open = ((url: string) => {
      (window as unknown as { __abiertos: string[] }).__abiertos.push(url);
      return null;
    }) as typeof window.open;
  });
});
test.afterEach(() => expect(errores, errores.join('\n')).toEqual([]));

async function limpiar(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

test('portada: hero, datos en vivo y asistente', async ({ page }) => {
  await limpiar(page);
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Megaevolución');
  await expect(page.locator('[data-proximo-torneo] [data-texto]')).toContainText(/plazas|Completo|cerradas/i);
  await page.locator('[data-asistente] label', { hasText: 'Accesorios' }).click();
  await expect(page.locator('[data-asistente-resultado]')).toContainText(/encaja/);
});

test('catálogo: búsqueda, filtros, URL y estado vacío', async ({ page }) => {
  await page.goto('/catalogo/');
  const tarjetas = page.locator('#rejilla .producto');
  const total = await tarjetas.count();
  expect(total).toBeGreaterThan(30);
  await page.fill('#q', 'charizard');
  await expect(tarjetas).toHaveCount(5); // 3 cartas + fundas y archivador de Charizard
  await expect(page).toHaveURL(/q=charizard/);
  await page.locator('[name="disponible"]').check({ force: true });
  await expect(tarjetas).toHaveCount(4);
  await page.fill('#q', 'zzzz');
  await expect(page.locator('[data-vacio]')).toBeVisible();
  await page.locator('[data-vacio] [data-limpiar]').click();
  await expect(tarjetas).toHaveCount(total);
  await page.goto('/catalogo/?categoria=sobres&orden=precio-desc');
  await expect(tarjetas.first()).toContainText('151');
});

test('favoritos se guardan y se recuperan', async ({ page }) => {
  await limpiar(page);
  await page.goto('/catalogo/');
  await page.locator('[data-favorito="mew-ex-151-205"]').first().click();
  await expect(page.locator('[data-contador-favoritos]')).toHaveText('1');
  await page.reload();
  await expect(page.locator('[data-contador-favoritos]')).toHaveText('1');
  await page.locator('[data-abrir="dlg-favoritos"]').click();
  await expect(page.locator('#lista-favoritos')).toContainText('Mew ex');
});

test('reserva por WhatsApp llega al panel y el panel descuenta stock', async ({ page }) => {
  await limpiar(page);
  await page.goto('/catalogo/pikachu-ex-ssp-238/');
  await page.locator('.ficha [data-reservar]').click();
  await page.locator('#form-reserva button[type=submit]').click();
  await expect(page.locator('#form-reserva [data-error="nombre"]')).toBeVisible();
  await page.fill('#res-nombre', 'Laura Prueba');
  await page.fill('#res-contacto', '612345678');
  await page.fill('#res-cantidad', '5');
  await page.locator('#form-reserva button[type=submit]').click();
  await expect(page.locator('#form-reserva [data-error="cantidad"]')).toContainText('Solo quedan 2');
  await page.fill('#res-cantidad', '1');
  await page.locator('#form-reserva button[type=submit]').click();
  const abiertos = await page.evaluate(() => (window as unknown as { __abiertos: string[] }).__abiertos);
  expect(decodeURIComponent(abiertos[0])).toContain('Pikachu ex');
  await page.goto('/panel/#reservas');
  await expect(page.locator('.tarjeta-solicitud')).toContainText('Laura Prueba');
  await page.getByRole('button', { name: 'Confirmar y apartar' }).click();
  await page.goto('/catalogo/pikachu-ex-ssp-238/');
  await expect(page.locator('.ficha [data-stock]')).toHaveText('Última unidad');
});

test('aviso de producto agotado y reposición desde el panel', async ({ page }) => {
  await limpiar(page);
  await page.goto('/catalogo/iono-pal-269/');
  await page.locator('.ficha [data-avisar]').click();
  await page.fill('#av-nombre', 'Hugo');
  await page.fill('#av-contacto', 'hugo@correo.es');
  await page.locator('#form-aviso button[type=submit]').click();
  await page.goto('/panel/#productos');
  await page.fill('[data-p-q]', 'iono');
  await page.locator('[data-reponer="iono-pal-269"]').click();
  await expect(page.locator('#avisos')).toContainText('espera aviso');
  await page.goto('/catalogo/iono-pal-269/');
  await expect(page.locator('.ficha [data-reservar]')).toBeVisible();
});

async function inscribir(page: Page, nick: string, contacto: string) {
  await page.locator('[data-inscribirme]').click();
  await page.locator('#dlg-inscripcion [name="aceptaNormas"]').check();
  await page.locator('[data-siguiente]').click();
  await page.fill('#ins-nombre', `Jugador ${nick}`);
  await page.fill('#ins-nick', nick);
  await page.selectOption('#ins-division', 'master');
  await page.fill('#ins-contacto', contacto);
  await page.locator('[data-ins-enviar]').click();
}

test('inscripción: suma inscritos, resta plazas y evita duplicados', async ({ page }) => {
  await limpiar(page);
  await page.goto('/torneos/copa-020/');
  await expect(page.locator('.panel-inscripcion .plazas-num')).toContainText('18 / 32');
  await inscribir(page, 'NuevaPromesa', 'nueva@correo.es');
  await expect(page.locator('[data-exito-titulo]')).toContainText('Solicitud enviada');
  await expect(page.locator('[data-exito-texto]')).toContainText('nº 19');
  await page.locator('[data-ver-participantes]').click();
  await expect(page.locator('#panel-participantes')).toContainText('NuevaPromesa');
  await expect(page.locator('.panel-inscripcion .plazas-num')).toContainText('19 / 32');
  await expect(page.locator('.panel-inscripcion .plazas-libres')).toContainText('13 plazas libres');
  // Duplicado por nick y por contacto
  await inscribir(page, 'nuevapromesa', 'otra@correo.es');
  await expect(page.locator('#form-ins [data-error="nick"]')).toBeVisible();
  await page.fill('#ins-nick', 'OtroNick');
  await page.fill('#ins-contacto', 'nueva@correo.es');
  await page.locator('[data-ins-enviar]').click();
  await expect(page.locator('#form-ins [data-error="contacto"]')).toBeVisible();
});

test('torneo completo: solo lista de espera; torneo cerrado: sin inscripción', async ({ page }) => {
  await limpiar(page);
  await page.goto('/torneos/presentacion-019/');
  await expect(page.locator('.panel-inscripcion')).toContainText('Completo');
  await expect(page.locator('[data-inscribirme]')).toHaveText(/lista de espera/i);
  await inscribir(page, 'EnEspera', 'espera@correo.es');
  await expect(page.locator('[data-exito-texto]')).toContainText('nº 3');
  await expect(page.locator('.panel-inscripcion .plazas-num')).toContainText('24 / 24');
  await page.goto('/torneos/junior-017/');
  await expect(page.locator('.panel-inscripcion')).toContainText('Inscripciones cerradas');
  await expect(page.locator('[data-inscribirme]')).toHaveCount(0);
});

test('panel: crear torneo, inscribir, jugar el cuadro, finalizar y verlo en historial y ranking', async ({ page }) => {
  await limpiar(page);
  await page.goto('/panel/#torneos');
  await page.locator('[data-nuevo-torneo]').first().click();
  await page.fill('#ft-nombre', 'Torneo de Prueba QA');
  await page.fill('#ft-capacidad', '4');
  await page.locator('[data-ft-enviar]').click();
  await expect(page.locator('.gestion-cab')).toContainText('Torneo de Prueba QA');
  for (const nick of ['Alfa', 'Beta', 'Gamma']) {
    await page.fill('#aj-nombre', `${nick} Test`);
    await page.fill('#aj-nick', nick);
    await page.fill('#aj-contacto', `${nick.toLowerCase()}@test.es`);
    await page.locator('[data-anadir-jugador] button[type=submit]').click();
    await expect(page.locator('.tabla-panel')).toContainText(nick);
  }
  // Aparece en la web pública con 3/4
  const id = decodeURIComponent(page.url().split('#torneo/')[1]);
  const publica = await page.context().newPage();
  await publica.goto(`/torneos/evento/?id=${id}`);
  await expect(publica.locator('.panel-inscripcion .plazas-num')).toContainText('3 / 4');
  await inscribir(publica, 'Delta', 'delta@test.es');
  await expect(publica.locator('.panel-inscripcion .plazas-num')).toContainText('4 / 4');
  await expect(publica.locator('.panel-inscripcion')).toContainText('Completo');
  await publica.close();
  await page.reload();
  await page.locator('[data-empezar]').click();
  await expect(page.locator('.cuadro')).toBeVisible();
  // Semifinales y final: gana siempre el primero
  for (let i = 0; i < 3; i++) {
    await page.locator('.cruce--pendiente [data-editar-partida]').first().click();
    await page.locator('#dlg-resultado [data-marcador]').first().click();
    await expect(page.locator('#dlg-resultado')).not.toBeVisible();
  }
  await expect(page.locator('.campeon-caja--si')).toBeVisible();
  await page.locator('[data-finalizar]').click();
  await expect(page.locator('.celebracion')).toBeVisible();
  const campeon = (await page.locator('.celebracion-caja strong').textContent())!.trim();
  await page.goto('/torneos/historial/');
  await expect(page.locator('.historial-tarjeta').first()).toContainText('Torneo de Prueba QA');
  await expect(page.locator('.historial-tarjeta').first()).toContainText(campeon);
  await page.goto('/torneos/clasificacion/');
  await page.locator('[data-buscar-jugador]').fill(campeon);
  await expect(page.locator('[data-tabla] tbody tr:not([hidden])')).toContainText(campeon);
});

test('panel: resultado en torneo en curso avanza al ganador en la web', async ({ page }) => {
  await limpiar(page);
  await page.goto('/panel/#torneo/t016');
  const pendiente = page.locator('.cruce--pendiente [data-editar-partida], .cruce--en-curso [data-editar-partida]').first();
  await pendiente.click();
  const ganador = (await page.locator('#dlg-resultado [data-marcador]').first().locator('small').textContent())!.replace('Gana ', '').trim();
  await page.locator('#dlg-resultado [data-marcador]').first().click();
  await page.goto('/torneos/copa-016/#competicion');
  await expect(page.locator('.cuadro-ronda[data-ronda="2"]')).toContainText(ganador);
});

test('suizo: rondas sin repetir, clasificación y finalización', async ({ page }) => {
  await limpiar(page);
  await page.goto('/panel/#torneos');
  await page.locator('[data-nuevo-torneo]').first().click();
  await page.fill('#ft-nombre', 'Suizo QA');
  await page.selectOption('#ft-formato', 'suizo');
  await page.selectOption('#ft-mejorde', '1');
  await page.fill('#ft-rondas', '3');
  await page.fill('#ft-capacidad', '8');
  await page.locator('[data-ft-enviar]').click();
  for (const nick of ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco']) {
    await page.fill('#aj-nombre', `${nick} Test`);
    await page.fill('#aj-nick', nick);
    await page.fill('#aj-contacto', `${nick.toLowerCase()}@test.es`);
    await page.locator('[data-anadir-jugador] button[type=submit]').click();
    await expect(page.locator('.tabla-panel')).toContainText(nick);
  }
  await page.locator('[data-empezar]').click();
  for (let r = 1; r <= 3; r++) {
    const ronda = page.locator(`[data-ronda-suiza="${r - 1}"]`);
    await expect(ronda.locator('.emp--bye')).toHaveCount(1);
    while ((await ronda.locator('[data-editar-partida]').count()) > 0 && (await ronda.locator('.emp--pendiente').count()) > 0) {
      await ronda.locator('.emp--pendiente [data-editar-partida]').first().click();
      await page.locator('#dlg-resultado [data-marcador]').first().click();
      await expect(page.locator('#dlg-resultado')).not.toBeVisible();
    }
    if (r < 3) await page.locator('[data-siguiente-ronda]').click();
  }
  await expect(page.locator('.tabla-suiza tbody tr')).toHaveCount(5);
  const puntos = await page.locator('.tabla-suiza tbody tr td.fuerte').allTextContents();
  expect(puntos.map(Number).reduce((a, b) => a + b, 0)).toBe(3 * 3 * 3); // 3 rondas × (2 partidas + 1 bye) × 3 puntos
  await page.locator('[data-finalizar]').click();
  await expect(page.locator('.celebracion')).toBeVisible();
});

test('restablecer la demo borra los cambios', async ({ page }) => {
  await limpiar(page);
  await page.goto('/torneos/copa-020/');
  await inscribir(page, 'Temporal', 'temporal@correo.es');
  await page.goto('/panel/');
  await page.locator('[data-restablecer]').click();
  await page.goto('/torneos/copa-020/');
  await expect(page.locator('.panel-inscripcion .plazas-num')).toContainText('18 / 32');
});

test('vende tu colección y contacto llegan al panel', async ({ page }) => {
  await limpiar(page);
  await page.goto('/vende-tu-coleccion/');
  await page.locator('[data-pv-siguiente]').click();
  await page.selectOption('#v-material', { index: 1 });
  await page.locator('[data-pv-siguiente]').click();
  await page.locator('[data-pv-siguiente]').click();
  await page.locator('[data-pv-enviar]').click();
  await expect(page.locator('#form-venta [data-error="nombre"]')).toBeVisible();
  await page.fill('#v-nombre', 'Marta Vende');
  await page.fill('#v-contacto', '600111222');
  await page.locator('#form-venta [name="privacidad"]').check();
  await page.locator('[data-pv-enviar]').click();
  await expect(page.locator('[data-venta-ok]')).toBeVisible();
  await page.goto('/contacto/');
  await page.fill('#c-nombre', 'Pepe');
  await page.fill('#c-contacto', 'pepe@correo.es');
  await page.fill('#c-mensaje', '¿Tenéis fundas mate negras?');
  await page.locator('#form-contacto [name="privacidad"]').check();
  await page.locator('#form-contacto button[type=submit]').click();
  await expect(page.locator('[data-contacto-ok]')).toBeVisible();
  await page.goto('/panel/#consultas');
  await expect(page.locator('.lista-solicitudes')).toContainText('fundas mate');
  await page.locator('[data-tab-con="ventas"]').click();
  await expect(page.locator('.lista-solicitudes')).toContainText('Marta Vende');
});

test('agenda: cambia de mes y abre un evento', async ({ page }) => {
  await page.goto('/agenda/');
  const titulo = await page.locator('[data-mes-titulo]').textContent();
  await page.locator('[data-mes="1"]').click();
  await expect(page.locator('[data-mes-titulo]')).not.toHaveText(titulo!);
  await page.locator('[data-hoy]').click();
  await page.locator('.cal-ev').first().click();
  await expect(page.locator('#dlg-evento')).toBeVisible();
});

test('búsqueda rápida encuentra productos y torneos', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  await page.fill('#buscar-rapido', 'league');
  await expect(page.locator('#resultados-rapidos')).toContainText('League Cup');
  await page.fill('#buscar-rapido', 'umbreon');
  await expect(page.locator('#resultados-rapidos')).toContainText('Umbreon ex');
});

test('enlaces internos sin errores 404', async ({ page, request }) => {
  const paginas = ['/', '/catalogo/', '/torneos/', '/torneos/clasificacion/', '/torneos/historial/', '/agenda/', '/tienda/', '/vende-tu-coleccion/', '/contacto/', '/panel/', '/legal/privacidad/'];
  const enlaces = new Set<string>();
  for (const p of paginas) {
    await page.goto(p);
    for (const h of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))) enlaces.add(h.split('#')[0]);
  }
  for (const h of enlaces) {
    const r = await request.get(h);
    expect(r.status(), h).toBe(200);
  }
  const hash = await page.locator('a[href="#"]').count();
  expect(hash).toBe(0);
});
