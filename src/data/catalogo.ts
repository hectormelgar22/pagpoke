/* CATÁLOGO DE DEMOSTRACIÓN.
   Nombres de cartas y expansiones reales (como en cualquier tienda), precios y stock de ejemplo.
   Imágenes: public/productos/<id>.webp (fotos de producto reales, solo para la demo privada).
   Precio y stock iniciales: el panel los modifica en el navegador. */

export type Categoria = 'cartas' | 'sobres' | 'cajas' | 'coleccion' | 'accesorios';
export type Rareza = 'doble-rara' | 'ultra-rara' | 'ilustracion-rara' | 'ilustracion-especial' | 'hiper-rara' | 'poco-comun' | 'graduada';
export type Idioma = 'ES' | 'EN' | 'JP';
export type Uso = 'coleccion' | 'jugar' | 'regalo' | 'empezar';
export type TipoArte =
  | 'carta' | 'slab' | 'sobre' | 'caja' | 'etb' | 'lata' | 'blister' | 'mazo'
  | 'fundas' | 'archivador' | 'deckbox' | 'tapete' | 'toploader' | 'almacen' | 'camiseta' | 'taza' | 'tote';

export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  categoria: Categoria;
  expansion: string | null;
  rareza: Rareza | null;
  idioma: Idioma | null;
  numero?: string;
  condicion?: 'NM' | 'EX' | 'GD';
  precio: number;
  stock: number;
  etiquetas: ('novedad' | 'destacado' | 'mas-buscado' | 'preventa')[];
  usos: Uso[];
  alta: number; // días desde que entró en tienda (para "recién llegado")
  resumen: string;
  detalles: [string, string][];
  arte: { tipo: TipoArte; c1: string; c2: string; marca?: string };
}

export const CATEGORIAS: { id: Categoria; nombre: string; plural: string; texto: string }[] = [
  { id: 'cartas', nombre: 'Carta suelta', plural: 'Cartas sueltas', texto: 'Ilustraciones especiales, hiper raras y cartas para tu mazo.' },
  { id: 'sobres', nombre: 'Sobre', plural: 'Sobres', texto: 'Las últimas expansiones, sobre a sobre.' },
  { id: 'cajas', nombre: 'Caja', plural: 'Cajas y colecciones', texto: 'Cajas de entrenador élite, displays, latas y mazos.' },
  { id: 'coleccion', nombre: 'Pieza de colección', plural: 'Coleccionismo', texto: 'Cartas graduadas y producto sellado difícil de encontrar.' },
  { id: 'accesorios', nombre: 'Accesorio', plural: 'Accesorios', texto: 'Fundas, archivadores, deck boxes y tapetes.' },
];

export const EXPANSIONES: { id: string; nombre: string; codigo: string; anio: number }[] = [
  { id: 'megaevolucion', nombre: 'Megaevolución', codigo: 'MEG', anio: 2025 },
  { id: 'rivales', nombre: 'Rivales Predestinados', codigo: 'DRI', anio: 2025 },
  { id: 'aventuras', nombre: 'Aventuras Compartidas', codigo: 'JTG', anio: 2025 },
  { id: 'prismaticas', nombre: 'Evoluciones Prismáticas', codigo: 'PRE', anio: 2025 },
  { id: 'chispas', nombre: 'Chispas Fulgurantes', codigo: 'SSP', anio: 2024 },
  { id: 'corona', nombre: 'Corona Estelar', codigo: 'SCR', anio: 2024 },
  { id: 'mascaras', nombre: 'Máscaras del Crepúsculo', codigo: 'TWM', anio: 2024 },
  { id: 'destinos', nombre: 'Destinos de Paldea', codigo: 'PAF', anio: 2024 },
  { id: '151', nombre: '151', codigo: 'MEW', anio: 2023 },
  { id: 'llamas', nombre: 'Llamas Obsidianas', codigo: 'OBF', anio: 2023 },
  { id: 'evoluciones-paldea', nombre: 'Evoluciones en Paldea', codigo: 'PAL', anio: 2023 },
  { id: 'escarlata-purpura', nombre: 'Escarlata y Púrpura', codigo: 'SVI', anio: 2023 },
  { id: 'tempestad', nombre: 'Tempestad Plateada', codigo: 'SIT', anio: 2022 },
  { id: 'cielos', nombre: 'Cielos Evolutivos', codigo: 'EVS', anio: 2021 },
  { id: 'basico', nombre: 'Set Básico', codigo: 'BS', anio: 1999 },
];

export const RAREZAS: Record<Rareza, { nombre: string; simbolo: string; nivel: number }> = {
  'poco-comun': { nombre: 'Poco común', simbolo: '◆', nivel: 1 },
  'doble-rara': { nombre: 'Doble rara', simbolo: '★★', nivel: 2 },
  'ultra-rara': { nombre: 'Ultra rara', simbolo: '★★', nivel: 3 },
  'ilustracion-rara': { nombre: 'Ilustración rara', simbolo: '★', nivel: 3 },
  'ilustracion-especial': { nombre: 'Ilustración rara especial', simbolo: '★★', nivel: 4 },
  'hiper-rara': { nombre: 'Hiper rara', simbolo: '★★★', nivel: 5 },
  graduada: { nombre: 'Graduada', simbolo: '▣', nivel: 5 },
};

export const IDIOMAS: Record<Idioma, string> = { ES: 'Español', EN: 'Inglés', JP: 'Japonés' };
export const CONDICIONES = { NM: 'Casi nueva (NM)', EX: 'Excelente (EX)', GD: 'Buena (GD)' } as const;

// Colores de la ilustración por tipo de energía / expansión
type Par = [string, string];
const FUEGO: Par = ['#FF7A45', '#7A1E1E'], AGUA: Par = ['#5CC8FF', '#173B8C'], RAYO: Par = ['#FFD84D', '#B4630C'], PSI: Par = ['#E28BFF', '#4A1F7A'];
const OSCURO: Par = ['#8C93C9', '#141530'], DRAGON: Par = ['#7DE3C3', '#5A3A12'], HADA: Par = ['#FFB3DD', '#7A2A5C'], INC: Par = ['#E9E3D2', '#6F6656'], AZUL: Par = ['#7FA8FF', '#20307A'];

const p = (
  id: string, nombre: string, categoria: Categoria, expansion: string | null, precio: number, stock: number,
  arte: Producto['arte'], resumen: string, extra: Partial<Producto> = {},
): Producto => ({
  id, slug: id, nombre, categoria, expansion, rareza: null, idioma: null, precio, stock, etiquetas: [], usos: [], alta: 60, resumen, detalles: [], arte, ...extra,
});
const carta = (c: [string, string], marca?: string) => ({ tipo: 'carta' as const, c1: c[0], c2: c[1], marca });

export const PRODUCTOS: Producto[] = [
  // ——— Cartas sueltas ———
  p('charizard-ex-151-199', 'Charizard ex', 'cartas', '151', 89.95, 1, carta(FUEGO, '199'),
    'La ilustración especial más buscada de 151, con Charizard en pleno vuelo.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '199/165', condicion: 'NM', etiquetas: ['destacado', 'mas-buscado'], usos: ['coleccion', 'regalo'], alta: 12 }),
  p('umbreon-ex-pre-161', 'Umbreon ex', 'cartas', 'prismaticas', 289, 1, carta(OSCURO, '161'),
    'La carta estrella de Evoluciones Prismáticas. Revisada con lupa: centrado muy bueno, sin marcas.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '161/131', condicion: 'NM', etiquetas: ['destacado', 'mas-buscado'], usos: ['coleccion'], alta: 5 }),
  p('pikachu-ex-ssp-238', 'Pikachu ex', 'cartas', 'chispas', 64.9, 2, carta(RAYO, '238'),
    'Pikachu ex en ilustración especial, una de las cartas más queridas de Chispas Fulgurantes.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '238/191', condicion: 'NM', etiquetas: ['mas-buscado'], usos: ['coleccion', 'regalo'], alta: 30 }),
  p('mew-ex-151-205', 'Mew ex', 'cartas', '151', 34.5, 3, carta(PSI, '205'),
    'Versión dorada hiper rara de Mew ex. Ideal para cerrar la colección de 151.',
    { rareza: 'hiper-rara', idioma: 'ES', numero: '205/165', condicion: 'NM', usos: ['coleccion', 'regalo'], alta: 40 }),
  p('gardevoir-ex-svi-245', 'Gardevoir ex', 'cartas', 'escarlata-purpura', 19.95, 2, carta(HADA, '245'),
    'Ilustración especial de la primera expansión de Escarlata y Púrpura. Edición en inglés.',
    { rareza: 'ilustracion-especial', idioma: 'EN', numero: '245/198', condicion: 'EX', usos: ['coleccion'], alta: 90 }),
  p('iono-pal-269', 'Iono', 'cartas', 'evoluciones-paldea', 39.95, 0, carta(AZUL, '269'),
    'La entrenadora más popular de Paldea en su versión de ilustración especial.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '269/193', condicion: 'NM', etiquetas: ['mas-buscado'], usos: ['coleccion'], alta: 120 }),
  p('greninja-ex-twm-214', 'Greninja ex', 'cartas', 'mascaras', 49.9, 1, carta(AGUA, '214'),
    'Greninja ex en ilustración especial de Máscaras del Crepúsculo.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '214/167', condicion: 'NM', usos: ['coleccion', 'jugar'], alta: 25 }),
  p('dragapult-ex-twm-200', 'Dragapult ex', 'cartas', 'mascaras', 59.95, 2, carta(DRAGON, '200'),
    'Uno de los atacantes más fuertes del formato, en su versión de ilustración especial.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '200/167', condicion: 'NM', usos: ['jugar', 'coleccion'], alta: 18 }),
  p('terapagos-ex-scr-170', 'Terapagos ex', 'cartas', 'corona', 44, 2, carta(INC, '170'),
    'La carta protagonista de Corona Estelar en ilustración especial.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '170/142', condicion: 'NM', usos: ['coleccion'], alta: 70 }),
  p('charizard-ex-obf-223', 'Charizard ex', 'cartas', 'llamas', 69.95, 0, carta(FUEGO, '223'),
    'El Charizard ex de tipo siniestro de Llamas Obsidianas, en ilustración especial.',
    { rareza: 'ilustracion-especial', idioma: 'ES', numero: '223/197', condicion: 'NM', etiquetas: ['mas-buscado'], usos: ['coleccion'], alta: 150 }),
  p('lugia-v-sit-186', 'Lugia V', 'cartas', 'tempestad', 179, 1, carta(['#DCE7FF', '#3B4A8C'], '186'),
    'Ilustración alternativa de Lugia V, una de las cartas modernas más valoradas. Edición en inglés.',
    { rareza: 'ultra-rara', idioma: 'EN', numero: '186/195', condicion: 'EX', etiquetas: ['destacado'], usos: ['coleccion'], alta: 8 }),
  p('gardevoir-ex-svi-086', 'Gardevoir ex', 'cartas', 'escarlata-purpura', 3.5, 14, carta(HADA, '086'),
    'La versión de juego de Gardevoir ex. Tenemos copias suficientes para completar tu mazo.',
    { rareza: 'doble-rara', idioma: 'ES', numero: '086/198', condicion: 'NM', usos: ['jugar'], alta: 45 }),
  p('arven-svi-166', 'Arven', 'cartas', 'escarlata-purpura', 0.8, 23, carta(['#FFC977', '#6E4A1C'], '166'),
    'Carta de Partidario imprescindible en muchos mazos de Estándar.',
    { rareza: 'poco-comun', idioma: 'ES', numero: '166/198', condicion: 'NM', usos: ['jugar', 'empezar'], alta: 45 }),

  // ——— Sobres ———
  p('sobre-megaevolucion', 'Sobre Megaevolución', 'sobres', 'megaevolucion', 4.95, 64,
    { tipo: 'sobre', c1: '#7DE3FF', c2: '#3A1C8C', marca: 'MEG' }, 'Sobre de 10 cartas de la expansión Megaevolución.',
    { idioma: 'ES', etiquetas: ['novedad'], usos: ['coleccion', 'regalo', 'empezar'], alta: 3 }),
  p('sobre-rivales', 'Sobre Rivales Predestinados', 'sobres', 'rivales', 4.95, 0,
    { tipo: 'sobre', c1: '#FF7A7A', c2: '#2A1430', marca: 'DRI' }, 'Sobre de 10 cartas de Rivales Predestinados.',
    { idioma: 'ES', etiquetas: ['mas-buscado'], usos: ['coleccion', 'regalo'], alta: 60 }),
  p('sobre-aventuras', 'Sobre Aventuras Compartidas', 'sobres', 'aventuras', 4.95, 31,
    { tipo: 'sobre', c1: '#8CF0B0', c2: '#14405A', marca: 'JTG' }, 'Sobre de 10 cartas de Aventuras Compartidas.',
    { idioma: 'ES', usos: ['coleccion', 'regalo', 'empezar'], alta: 50 }),
  p('sobre-chispas', 'Sobre Chispas Fulgurantes', 'sobres', 'chispas', 4.95, 17,
    { tipo: 'sobre', c1: '#FFE066', c2: '#7A3A0C', marca: 'SSP' }, 'Sobre de 10 cartas de Chispas Fulgurantes.',
    { idioma: 'ES', usos: ['coleccion', 'regalo'], alta: 80 }),
  p('sobre-151-jp', 'Sobre 151 (japonés)', 'sobres', '151', 7.95, 24,
    { tipo: 'sobre', c1: '#FF9BD2', c2: '#3A1F6E', marca: '151' }, 'Sobre japonés de 7 cartas de 151, muy buscado para abrir en directo.',
    { idioma: 'JP', etiquetas: ['mas-buscado'], usos: ['coleccion', 'regalo'], alta: 20 }),

  // ——— Cajas y colecciones ———
  p('display-megaevolucion', 'Caja de 36 sobres Megaevolución', 'cajas', 'megaevolucion', 159.9, 4,
    { tipo: 'caja', c1: '#7DE3FF', c2: '#3A1C8C', marca: 'MEG' }, 'Display completo con 36 sobres. Precio especial frente a comprarlos sueltos.',
    { idioma: 'ES', etiquetas: ['novedad', 'destacado'], usos: ['coleccion'], alta: 3, detalles: [['Contenido', '36 sobres de 10 cartas'], ['Precio por sobre', '4,44 €']] }),
  p('etb-megaevolucion', 'Caja de Entrenador Élite Megaevolución', 'cajas', 'megaevolucion', 59.95, 6,
    { tipo: 'etb', c1: '#7DE3FF', c2: '#3A1C8C', marca: 'MEG' }, 'Incluye 9 sobres, fundas, dados, marcadores y caja de almacenamiento.',
    { idioma: 'ES', etiquetas: ['novedad'], usos: ['regalo', 'coleccion', 'empezar'], alta: 3, detalles: [['Contenido', '9 sobres, 65 fundas, 45 energías, dados y marcadores']] }),
  p('etb-prismaticas', 'Caja de Entrenador Élite Evoluciones Prismáticas', 'cajas', 'prismaticas', 89.95, 2,
    { tipo: 'etb', c1: '#FFB3F0', c2: '#2C1F6E', marca: 'PRE' }, 'La caja más pedida de la temporada. Quedan muy pocas unidades.',
    { idioma: 'ES', etiquetas: ['mas-buscado'], usos: ['regalo', 'coleccion'], alta: 35, detalles: [['Contenido', '9 sobres, fundas, dados y marcadores']] }),
  p('upc-151', 'Colección Ultra Premium 151', 'cajas', '151', 159, 0,
    { tipo: 'caja', c1: '#FFD0F0', c2: '#4A1F7A', marca: 'UPC' }, 'Colección de lujo con 16 sobres de 151, cartas promocionales y accesorios metálicos.',
    { idioma: 'ES', usos: ['coleccion', 'regalo'], alta: 200, detalles: [['Contenido', '16 sobres, cartas promocionales, moneda y tapete']] }),
  p('lata-destinos', 'Mini lata Destinos de Paldea', 'cajas', 'destinos', 24.95, 8,
    { tipo: 'lata', c1: '#FFD84D', c2: '#5A2A10', marca: 'PAF' }, 'Mini lata con 2 sobres de Destinos de Paldea y una carta de ilustración.',
    { idioma: 'ES', usos: ['regalo'], alta: 90 }),
  p('blister-rivales', 'Blíster 3 sobres Rivales Predestinados', 'cajas', 'rivales', 17.95, 10,
    { tipo: 'blister', c1: '#FF7A7A', c2: '#2A1430', marca: 'DRI' }, 'Tres sobres, carta promocional y moneda.',
    { idioma: 'ES', usos: ['regalo', 'coleccion'], alta: 40 }),
  p('mazos-iniciacion', 'Battle Academy 2024 (3 mazos)', 'cajas', null, 19.95, 7,
    { tipo: 'mazo', c1: '#8CF0B0', c2: '#173B8C' }, 'Caja para aprender a jugar entre dos: tres mazos listos, tapete y guía paso a paso.',
    { idioma: 'ES', usos: ['empezar', 'regalo', 'jugar'], alta: 30, detalles: [['Contenido', '3 mazos de 60 cartas, tapete, guía y contadores']] }),
  p('mazo-liga', 'League Battle Deck Mega Lucario ex', 'cajas', null, 29.95, 5,
    { tipo: 'mazo', c1: '#FFB547', c2: '#3A1C8C' }, 'Mazo competitivo listo para jugar torneos, con cartas de gran nivel.',
    { idioma: 'ES', usos: ['jugar', 'empezar'], alta: 25 }),

  // ——— Coleccionismo ———
  p('charizard-base-psa8', 'Charizard holo · PSA 8', 'coleccion', 'basico', 1450, 1,
    { tipo: 'slab', c1: FUEGO[0], c2: FUEGO[1], marca: 'PSA 8' }, 'El clásico de 1999 graduado PSA 8. Certificado verificable en tienda.',
    { rareza: 'graduada', idioma: 'EN', numero: '4/102', etiquetas: ['destacado'], usos: ['coleccion'], alta: 15, detalles: [['Graduación', 'PSA 8 (Near Mint–Mint)']] }),
  p('umbreon-vmax-psa9', 'Umbreon VMAX ilustración alternativa · PSA 9', 'coleccion', 'cielos', 1290, 1,
    { tipo: 'slab', c1: OSCURO[0], c2: OSCURO[1], marca: 'PSA 9' }, 'Una de las cartas modernas más deseadas, graduada PSA 9.',
    { rareza: 'graduada', idioma: 'EN', numero: '215/203', usos: ['coleccion'], alta: 22, detalles: [['Graduación', 'PSA 9 (Mint)']] }),
  p('mew-ex-psa10', 'Mew ex hiper rara · PSA 10', 'coleccion', '151', 119, 2,
    { tipo: 'slab', c1: PSI[0], c2: PSI[1], marca: 'PSA 10' }, 'Mew ex dorado de 151 con la nota máxima.',
    { rareza: 'graduada', idioma: 'ES', numero: '205/165', usos: ['coleccion', 'regalo'], alta: 9, detalles: [['Graduación', 'PSA 10 (Gem Mint)']] }),
  p('display-151-jp', 'Caja sellada 151 (japonés)', 'coleccion', '151', 189, 3,
    { tipo: 'caja', c1: '#FF9BD2', c2: '#3A1F6E', marca: '151' }, 'Caja japonesa de 20 sobres, sellada de fábrica.',
    { idioma: 'JP', etiquetas: ['mas-buscado'], usos: ['coleccion'], alta: 20, detalles: [['Contenido', '20 sobres de 7 cartas']] }),

  // ——— Accesorios ———
  p('fundas-mate', 'Fundas Ultra PRO Mega Charizard X (65)', 'accesorios', null, 11.95, 40,
    { tipo: 'fundas', c1: '#2C2A40', c2: '#FFB547' }, 'Fundas de tamaño estándar con ilustración, válidas para torneo.',
    { usos: ['jugar', 'empezar'], alta: 60, detalles: [['Tamaño', '66 × 91 mm'], ['Cantidad', '65 fundas']] }),
  p('fundas-ajustadas', 'Fundas Ultra PRO Lillie y Clefairy (65)', 'accesorios', null, 4.5, 55,
    { tipo: 'fundas', c1: '#DDE6F7', c2: '#7FA8FF' }, 'Fundas de tamaño estándar con ilustración de Lillie y Clefairy.',
    { usos: ['coleccion', 'jugar'], alta: 60 }),
  p('archivador-9', 'Archivador PRO-Binder Charizard (9 bolsillos)', 'accesorios', null, 34.95, 9,
    { tipo: 'archivador', c1: '#1C1A2B', c2: '#FFB547' }, 'Archivador con cremallera y páginas cosidas que no dañan las cartas.',
    { usos: ['coleccion', 'regalo'], alta: 60, detalles: [['Capacidad', '360 cartas (720 a doble cara)']] }),
  p('deckbox', 'Deck box Ultra PRO Charmander', 'accesorios', null, 19.95, 12,
    { tipo: 'deckbox', c1: '#3A1C8C', c2: '#7DE3FF' }, 'Caja para unas 80 cartas enfundadas.',
    { usos: ['jugar', 'regalo'], alta: 60 }),
  p('tapete-noche', 'Tapete Ultra PRO Pikachu', 'accesorios', null, 24.95, 6,
    { tipo: 'tapete', c1: '#141530', c2: '#7DE3FF' }, 'Tapete de 60 × 35 cm con base de goma antideslizante.',
    { usos: ['jugar', 'regalo'], alta: 60 }),
  p('toploaders', 'Toploaders rígidos 3×4 (25)', 'accesorios', null, 4.95, 0,
    { tipo: 'toploader', c1: '#E8EEF8', c2: '#7FA8FF' }, 'Fundas rígidas para guardar o enviar tus mejores cartas.',
    { usos: ['coleccion'], alta: 60 }),
  p('caja-almacen', 'Caja de almacenamiento para 800 cartas', 'accesorios', null, 6.95, 30,
    { tipo: 'almacen', c1: '#F3F1F8', c2: '#6F6656' }, 'Caja de cartón resistente con separadores.',
    { usos: ['coleccion'], alta: 60 }),

];

export const productoPorId = new Map(PRODUCTOS.map((x) => [x.id, x]));
export const expansionPorId = new Map(EXPANSIONES.map((x) => [x.id, x]));
export const categoriaPorId = new Map(CATEGORIAS.map((x) => [x.id, x]));
