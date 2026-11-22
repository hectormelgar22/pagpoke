# Web demo para tiendas de cartas TCG

Demo de una tienda ficticia (**Mazo & Mesa**, Zaragoza) para enseñar a tiendas de cartas sin web.
HTML, CSS y JS estático: sin servidor ni base de datos. Se publica gratis en Netlify o GitHub Pages.

## Páginas
- `index.html`: portada con carta holográfica de la tienda, abierto/cerrado en directo, próximos torneos, cartas destacadas, horario, mapa y WhatsApp.
- `torneos.html`: calendario (eventos semanales + especiales) con filtro por juego e inscripción por WhatsApp.
- `vitrina.html`: cartas sueltas con buscador, filtro y botón "Reservar por WhatsApp".
- `vende.html`: "Vende tu colección" con pasos, formulario a WhatsApp y preguntas frecuentes.

## Personalizar para una tienda real
Todo está en **`config.js`**: nombre, logo, colores, teléfono/WhatsApp, dirección y coordenadas, horario, torneos, cartas y condiciones de compra.

1. Copia la carpeta (sin `prospeccion/`) y cambia los datos de `config.js`.
2. Logo: guarda la imagen en `img/` y pon la ruta en `logo`. Fotos de cartas: campo `foto` de cada carta (fotos propias de la tienda, nunca imágenes oficiales).
3. Borra el texto de `aviso` para quitar la franja "Web de demostración".
4. Cambia el dominio `https://mazoymesa.es` en `robots.txt` y `sitemap.xml`.
5. Comprueba los datos para Google en https://search.google.com/test/rich-results.

Los títulos de las páginas dicen "Mazo & Mesa" y "Zaragoza"; el código los cambia solo por el nombre y la ciudad de `config.js`. Para el mejor resultado en Google, haz también buscar y reemplazar en los cuatro `.html`.

## Probar en local
```
python -m http.server 8123
```
y abre http://localhost:8123. Comprobación de la lógica (horario y calendario): `node test.js`.

## Limitaciones conocidas
- Inscripciones y reservas llegan por WhatsApp: no hay base de datos de inscritos.
- La vitrina se actualiza a mano en `config.js`.
- Los eventos para Google usan la hora de invierno (+01:00).
