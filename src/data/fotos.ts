/* FOTOGRAFÍAS. Imágenes de demostración generadas con IA para esta demo (sin marcas ni personajes).
   Para una tienda real: sustituir los archivos de src/assets/fotos/ por fotos propias con el mismo nombre
   (o cambiar los imports) y revisar los textos alternativos. */
import tienda from '../assets/fotos/tienda.jpg';
import vitrina from '../assets/fotos/vitrina.jpg';
import zonaJuego from '../assets/fotos/zona-juego.jpg';
import torneo from '../assets/fotos/torneo.jpg';
import comunidad from '../assets/fotos/comunidad.jpg';
import archivador from '../assets/fotos/archivador.jpg';
import sobres from '../assets/fotos/sobres.jpg';
import tasacion from '../assets/fotos/tasacion.jpg';
import trofeo from '../assets/fotos/trofeo.jpg';

export const FOTOS = {
  tienda: { src: tienda, alt: 'Interior de la tienda con vitrinas iluminadas y la zona de juego al fondo' },
  vitrina: { src: vitrina, alt: 'Cartas graduadas expuestas en la vitrina de coleccionista' },
  zonaJuego: { src: zonaJuego, alt: 'Zona de juego con mesas numeradas preparadas para un torneo' },
  torneo: { src: torneo, alt: 'Jugadores durante una ronda de torneo en la tienda' },
  comunidad: { src: comunidad, alt: 'Un grupo de amigos intercambiando cartas con sus archivadores' },
  archivador: { src: archivador, alt: 'Archivador de coleccionista con cartas holográficas' },
  sobres: { src: sobres, alt: 'Sobres holográficos recién abiertos sobre una mesa' },
  tasacion: { src: tasacion, alt: 'El dependiente revisa una carta con lupa en el mostrador' },
  trofeo: { src: trofeo, alt: 'Trofeo de campeón junto a sobres y una caja de mazo' },
} as const;
