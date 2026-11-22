/* =====================================================================
   DATOS DE LA TIENDA — punto único de personalización.
   Para adaptar la web a una tienda real, cambia este archivo, el catálogo
   (catalogo.ts), los torneos (torneos.semilla.json / eventos.ts) y las fotos.
   Todo lo marcado como DEMO es ficticio y debe sustituirse antes de publicar.
   ===================================================================== */
import type { ReglasRanking } from '../lib/ranking.ts';
import { REGLAS_POR_DEFECTO } from '../lib/ranking.ts';

export const tienda = {
  nombre: 'Destello',
  nombreCompleto: 'Destello · Cartas y torneos',
  lema: 'Cartas y torneos en Valencia',
  descripcionCorta: 'Tienda especializada en Pokémon TCG: cartas sueltas, producto sellado, accesorios y torneos semanales.',
  descripcionSeo:
    'Tienda de cartas Pokémon TCG en Valencia: cartas sueltas, sobres y cajas, accesorios, compra de colecciones y torneos con inscripción online.',
  desde: 2017,

  /** Modo demostración: muestra avisos y hace que las fechas de ejemplo se muevan con el día actual. */
  demo: {
    activa: true,
    aviso: 'Demostración · tienda ficticia',
    fechasRelativas: true,
    claveAlmacen: 'destello-demo-v1',
  },

  contacto: {
    telefono: '+34 600 000 000', // DEMO
    telefonoEnlace: '+34600000000', // DEMO
    whatsapp: '34600000000', // DEMO: solo números, con prefijo
    email: 'hola@destello.example', // DEMO
  },

  direccion: {
    calle: 'Calle de la Demostración, 12', // DEMO
    cp: '46001',
    ciudad: 'Valencia',
    provincia: 'Valencia',
    pais: 'ES',
    lat: 39.4699,
    lng: -0.3763,
    comoLlegar: 'Metro Colón (líneas 3, 5 y 9) a 6 minutos andando. Parking público a 200 m.',
  },

  /** Horario: una lista de tramos por día. Día cerrado = []. */
  horario: {
    1: [['17:00', '21:00']],
    2: [['10:30', '14:00'], ['17:00', '21:00']],
    3: [['10:30', '14:00'], ['17:00', '21:00']],
    4: [['10:30', '14:00'], ['17:00', '22:00']],
    5: [['10:30', '14:00'], ['17:00', '22:00']],
    6: [['10:00', '14:30'], ['16:30', '21:30']],
    7: [],
  } as Record<number, [string, string][]>,

  redes: [
    { red: 'Instagram', url: 'https://www.instagram.com/' }, // DEMO: cambiar por el perfil real
    { red: 'TikTok', url: 'https://www.tiktok.com/' },
    { red: 'Discord', url: 'https://discord.com/' },
  ],

  /** Colores de marca. El resto de la paleta se deriva en global.css. */
  colores: {
    acento: '#FFCB05',
    noche: '#14264F',
    nacar: '#F2F4F7',
  },

  espacios: [
    { titulo: 'Zona de juego', dato: '32 plazas', texto: 'Mesas numeradas, tapetes y buena luz para jugar cómodo cualquier día.' },
    { titulo: 'Vitrina de coleccionista', dato: '+400 cartas', texto: 'Cartas sueltas y graduadas ordenadas por expansión, con precio visible.' },
    { titulo: 'Mostrador de tasación', dato: 'Sin cita', texto: 'Revisamos tu colección contigo, carta a carta, y te explicamos el precio.' },
  ],

  diferenciales: [
    { titulo: 'Precio claro', texto: 'Todas las cartas llevan precio y estado. Sin sorpresas en el mostrador.' },
    { titulo: 'Estado revisado', texto: 'Cada carta suelta se revisa con lupa antes de entrar en la vitrina.' },
    { titulo: 'Torneos cada semana', texto: 'Liga los jueves, torneos los sábados y una comunidad que te recibe aunque empieces hoy.' },
    { titulo: 'Te reservamos lo que quieras', texto: 'Pídelo por WhatsApp y te lo guardamos 48 horas en tienda.' },
  ],

  ranking: REGLAS_POR_DEFECTO as ReglasRanking,

  /** Opcional: herramienta de tasación para la tienda. No está conectada en esta demo. */
  cardwise: {
    mostrar: true,
    url: 'https://cardwisetcg.com',
  },
};

export type Tienda = typeof tienda;

export const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const direccionCompleta = `${tienda.direccion.calle}, ${tienda.direccion.cp} ${tienda.direccion.ciudad}`;
export const enlaceMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${tienda.direccion.lat},${tienda.direccion.lng}`,
)}`;
export const enlaceWhatsApp = (texto = `Hola, os escribo desde la web de ${tienda.nombre}.`) =>
  `https://wa.me/${tienda.contacto.whatsapp}?text=${encodeURIComponent(texto)}`;
