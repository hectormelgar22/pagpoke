# Destello · web demo para tiendas de Pokémon TCG

Web de demostración de una **tienda ficticia** de cartas Pokémon TCG («Destello», Valencia) para enseñar a tiendas reales lo que puede hacer su propia web. Todo funciona en el navegador, sin servidor: los cambios se guardan en el navegador de quien la usa.

## Verla en local

```bash
npm install
npm run dev          # http://localhost:4321 (modo desarrollo)
npm run build        # genera la web en dist/
npm run preview      # sirve dist/ en http://localhost:4321
```

## Recorrido para enseñarla en una reunión (5 minutos)

1. **Portada**: banner de la última expansión con producto real, franja con datos en vivo (abierto/cerrado, próximo torneo con plazas), categorías y el buscador de regalos.
2. **Catálogo**: busca «charizard», filtra por «solo con stock», ordena por precio. Abre una ficha y pulsa **Reservar** (prepara el WhatsApp).
3. **Torneos** → *Copa Destello (en curso)*: el cuadro eliminatorio; toca un jugador para seguir su camino.
4. **Inscripción**: abre *Copa Destello nº 020*, inscríbete y mira cómo pasa de 18/32 a 19/32.
5. **Panel del propietario** (`/panel/`, enlace en la franja superior): verás la inscripción, la reserva y el stock. Pon un resultado en el cuadro en curso y vuelve a la web: el ganador ya ha avanzado.
6. Pulsa **Restablecer datos de la demo** antes de la siguiente reunión.

## Funcionalidades

| Área | Qué hace |
|---|---|
| Catálogo | 37 productos con foto real en 5 categorías. Buscador sin tildes, filtros (categoría, expansión, rareza, idioma, stock, precio, uso), orden, filtros en la URL (se pueden compartir), estado vacío con WhatsApp. |
| Ficha de producto | Foto real, estado, rareza, idioma, stock, datos estructurados `Product`. |
| Reservas | Formulario → mensaje de WhatsApp con el producto y los datos. Valida stock. Llega al panel. |
| Favoritos | Corazón en cada producto, cajón lateral, se recuerdan al volver. «Preguntar por todos» por WhatsApp. |
| Avisos de stock | En productos agotados: «Avísame». El panel lo muestra y, al reponer, avisa de cuántos clientes esperan. No se envían notificaciones automáticas. |
| Asistente de compra | 4 preguntas (tipo, para qué, presupuesto, expansión) → productos reales del catálogo. Reglas, sin IA. |
| Búsqueda rápida | Tecla `/` o `Ctrl+K`: productos, torneos y páginas. |
| Torneos | Portada con próximo gran evento y cuenta atrás, torneo en juego con su cuadro, filtros por fecha/formato/estado, guía para principiantes. |
| Estados de inscripción | Próximamente, abiertas, últimas plazas, completo, cerradas, en curso y finalizado. Se calculan con los datos y la hora; no hay cuentas atrás de eventos pasados. |
| Inscripción | 3 pasos (condiciones → datos → confirmación). Valida campos, evita duplicados (nick, contacto o ID), lista de espera si está completo, baja con subida automática del primero de la lista. |
| Cuadros | Eliminación directa con pases directos (byes), conectores, estados por partida, ronda a ronda en móvil y «seguir a un jugador». |
| Sistema suizo | Emparejamientos sin repetir rival, bye rotatorio, clasificación por puntos y desempates, y corte a top 4/8/16. |
| Clasificación | Calculada a partir de los resultados reales (participación + victorias + puesto). Podio, temporadas, buscador y ficha de cada jugador. |
| Historial | Torneos finalizados con campeón, finalista y enlace a su cuadro. |
| Agenda | Calendario mensual (lista en móvil) con torneos, liga, presentaciones, eventos especiales y juego libre. Añadir al calendario (.ics). |
| Conoce la tienda / Vende tu colección / Contacto | Galería con visor, formulario de venta en 4 pasos con fotos (solo vista previa), bloque conceptual de CardwiseTCG, formulario de contacto. |
| Panel del propietario | Resumen, productos (precio y stock), reservas (confirmar descuenta stock), consultas, avisos y gestión completa de torneos: crear, editar, inscritos, lista de espera, empezar, rondas, resultados, top, finalizar y publicar campeón. |

## Cómo probar los torneos

- **Inscripción**: `/torneos/copa-020/` → «Inscribirme». Repite con el mismo nick o email: lo rechaza.
- **Lista de espera**: `/torneos/presentacion-019/` (24/24).
- **Cerrado**: `/torneos/junior-017/`. **Próximamente**: `/torneos/comunidad-023/`.
- **Cuadro en curso y resultados**: `/panel/#torneo/t016` → lápiz de una partida pendiente → resultado. Si cambias el ganador de una partida ya avanzada, se anulan los resultados que dependían de ella.
- **Torneo completo de principio a fin**: Panel → Torneos → Crear torneo → añade jugadores → Empezar → resultados → Finalizar. Aparece en el historial y suma en la clasificación.
- **Suizo**: crea un torneo «Sistema suizo» con 5 jugadores y 3 rondas: verás el bye rotatorio y la tabla.

## Arquitectura

- **Astro 7** (genera HTML estático para SEO) + **TypeScript** + CSS propio. Sin frameworks de interfaz ni librerías de animación.
- **Datos centralizados** en `src/data/`:
  - `tienda.ts`: nombre, contacto, dirección, horario, redes, colores, textos y reglas del ranking.
  - `catalogo.ts`: productos, categorías, expansiones y rarezas.
  - `torneos.semilla.json`: jugadores y torneos de ejemplo (se regenera con `node scripts/generar-semilla.ts`; siempre sale igual).
  - `eventos.ts`: eventos semanales y sueltos de la agenda.
  - `fotos.ts`: fotografías y textos alternativos.
- **Motor de torneos** (`src/lib/`): `cuadro.ts`, `suizo.ts`, `torneo.ts` y `ranking.ts` son funciones puras que trabajan sobre datos; las vistas (`src/lib/vistas/`) los pintan. Las mismas plantillas se usan al generar la web y en el navegador.
- **Estado de la demo** (`src/lib/almacen.ts`): datos de ejemplo + cambios del visitante en `localStorage`. Mismo estado para web pública y panel (también entre pestañas). Para un backend real basta con sustituir `cargar()`/`mutar()` por llamadas a una API con la misma forma de datos (`src/lib/tipos.ts`).
- **Fechas relativas**: en modo demo los torneos se colocan alrededor de «hoy», así la demo nunca caduca. Para una tienda real: `demo.fechasRelativas: false` y fechas ISO normales.
- **Imágenes de producto**: fotos reales de cartas, sobres, cajas y accesorios descargadas del catálogo de TCGplayer con `node scripts/descargar-imagenes.mjs` (`public/productos/<id>.webp`). **Tienen derechos de terceros: solo para la demo privada; no publicar la web sin sustituirlas o tener permiso.** Fotos de la tienda: generadas con IA (`src/assets/fotos/`).
- **Tipografía**: Barlow y Barlow Condensed.

## Calidad

```bash
npm test             # 14 pruebas del motor (cuadros, suizo, inscripciones, ranking, fechas)
npm run check        # TypeScript sin errores
npm run build && npx playwright test   # 15 flujos reales + desbordamiento en 8 anchos (usa el Chrome instalado)
bash scripts/lighthouse.sh             # con `npx astro preview --port 4322` en marcha
```

Lighthouse (22-11-2026, Lighthouse 12, Chrome 157, build de producción servida en local):
- **Escritorio**: 100 / 100 / 100 / 100 en las 10 páginas auditadas.
- **Móvil** (simulación de gama media con 4G lento): rendimiento 97–99 en 9 de 10 páginas; la ficha de producto osciló entre 81 y 99 en cuatro mediciones idénticas (variación del equipo). Accesibilidad, buenas prácticas y SEO: 100 en todas.

## Adaptarla a una tienda real

1. `src/data/tienda.ts`: nombre, contacto, WhatsApp, dirección y coordenadas, horario, redes, colores, espacios y diferenciales. Poner `demo.activa: false` y `demo.fechasRelativas: false`.
2. Logotipo: `src/components/Logo.astro` y `public/favicon.svg`.
3. Fotos: sustituir las de `src/assets/fotos/` (mismo nombre) y revisar los textos alternativos de `src/data/fotos.ts`. Imagen para redes: `public/og.jpg`. Fotos de producto en `public/productos/` (las propias de la tienda o con permiso).
4. Catálogo: `src/data/catalogo.ts` (cada producto usa `public/productos/<id>.webp`).
5. Torneos y agenda: sustituir `torneos.semilla.json` por los torneos reales (o conectar un backend) y revisar `eventos.ts`.
6. Textos legales: `src/pages/legal/[doc].astro` (plantilla, revisar con un asesor).
7. Dominio: `SITE_URL=https://dominio-de-la-tienda.es npm run build` (canonical, sitemap, robots y datos estructurados usan este dominio).
8. Para inscripciones, reservas y panel de verdad hace falta un backend (por ejemplo Supabase): autenticación del propietario, base de datos y envío de avisos. El modelo de datos ya está preparado.

## Publicar

- **Netlify**: comando `npm run build`, carpeta `dist`.
- **GitHub Pages**: subir `dist/` (o una acción que ejecute `npm run build`). Con dominio propio, configurar `SITE_URL`.

## Limitaciones conocidas

- Sin servidor: inscripciones, reservas, consultas y cambios del panel solo existen en el navegador donde se hacen. Nadie más los ve.
- El panel no tiene contraseña (es una demo; la versión real necesita autenticación).
- Las fotos de «Vende tu colección» no se suben a ningún sitio; se adjuntan después por WhatsApp.
- La doble eliminación está prevista en el modelo de datos, pero no implementada.
- El bloque de CardwiseTCG es conceptual: no hay integración ni análisis de imágenes.

## Mejoras que merecerían la pena en una versión comercial

1. Backend con login del propietario (Supabase o similar) para que inscripciones, reservas y stock sean reales y compartidos.
2. Avisos automáticos por email/WhatsApp Business (confirmación de inscripción, reserva lista, producto repuesto).
3. Check-in el día del torneo y resultados introducidos por los propios jugadores desde el móvil (con validación de la tienda).
4. Importación de stock desde Cardmarket o una hoja de cálculo.
5. Integración real con CardwiseTCG para tasar en mostrador.
