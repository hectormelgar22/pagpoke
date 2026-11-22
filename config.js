/* =====================================================================
   DATOS DE LA TIENDA — el único archivo que hay que tocar para cada cliente.
   Cambia los textos entre comillas y guarda. No hace falta tocar nada más.
   ===================================================================== */
window.TIENDA = {
  nombre: "Mazo & Mesa",
  nombreCorto: "Mazo & Mesa",
  iniciales: "M&M",            // se usan si no hay logo
  logo: "",                    // ruta a la imagen del logo, p. ej. "img/logo.png" (vacío = monograma)
  eslogan: "Liga Pokémon cada jueves, cartas sueltas en vitrina y compra de colecciones. Ven a jugar o escríbenos.",
  descripcion: "Tienda de cartas coleccionables en Zaragoza: Pokémon, Magic, One Piece y Lorcana. Liga Pokémon todos los jueves, cartas sueltas y compra de colecciones.",
  desde: 2016,
  aviso: "Web de demostración · tienda ficticia",   // vacío para quitar la franja de aviso

  // Colores de marca (cualquier color en hexadecimal)
  colores: {
    principal: "#2B3A8C",   // tapete: cabecera, enlaces, bloques oscuros
    acento: "#FFC93C",      // botones principales
    tinta: "#161936",       // texto
    fondo: "#F2F3F9"        // fondo general
  },

  // Contacto
  telefono: "+34 600 000 000",    // como se muestra
  whatsapp: "34600000000",        // solo números, con prefijo 34
  email: "hola@mazoymesa.es",
  instagram: "https://instagram.com/",
  web: "https://mazoymesa.es",    // dominio final (para Google)

  // Ubicación
  direccion: {
    calle: "Calle de Delicias 48",
    barrio: "Delicias",
    cp: "50017",
    ciudad: "Zaragoza",
    provincia: "Zaragoza",
    lat: 41.6505,
    lng: -0.9127
  },
  comoLlegar: "Bus 21, 33 y 51 (parada Delicias). Tranvía: parada Plaza de Europa, a 8 minutos andando.",

  // Valoración de Google (se muestra en la portada; pon 0 para ocultarla)
  valoracion: 4.8,
  resenas: 241,

  // Horario. Cada día: lista de tramos ["abre", "cierra"]. Día cerrado: [].
  zonaHoraria: "Europe/Madrid",
  horario: {
    lunes:     [["17:00", "21:00"]],
    martes:    [["10:30", "13:30"], ["17:00", "21:00"]],
    miercoles: [["10:30", "13:30"], ["17:00", "21:00"]],
    jueves:    [["10:30", "13:30"], ["17:00", "22:00"]],
    viernes:   [["10:30", "13:30"], ["17:00", "22:00"]],
    sabado:    [["10:30", "14:00"], ["16:30", "21:30"]],
    domingo:   []
  },

  // Juegos que se ven en filtros y etiquetas
  juegos: {
    pokemon:  { nombre: "Pokémon",   color: "#F6C744" },
    magic:    { nombre: "Magic",     color: "#C9773B" },
    onepiece: { nombre: "One Piece", color: "#D9443A" },
    lorcana:  { nombre: "Lorcana",   color: "#6C63D9" }
  },

  // TORNEOS
  torneos: {
    semanasVista: 6,   // cuántas semanas se muestran de los eventos que se repiten
    // Eventos que se repiten cada semana
    semanales: [
      { juego: "pokemon", nombre: "Liga Pokémon", dia: "jueves", hora: "18:00",
        formato: "Estándar · Liga oficial", precio: "Gratis", plazas: 24,
        texto: "Partidas de liga con puntos y premios de temporada. Ven con tu mazo o te dejamos uno." },
      { juego: "pokemon", nombre: "Liga Pokémon Juniors", dia: "sabado", hora: "11:00",
        formato: "Para menores de 12 años", precio: "Gratis", plazas: 16,
        texto: "Aprende a jugar con ayuda. Las familias pueden quedarse a mirar." },
      { juego: "magic", nombre: "Viernes de Commander", dia: "viernes", hora: "18:30",
        formato: "Commander · mesas de 4", precio: "5 €", plazas: 20,
        texto: "Partidas casuales. El precio incluye un sobre." },
      { juego: "onepiece", nombre: "Torneo semanal One Piece", dia: "miercoles", hora: "18:00",
        formato: "Suizo · 3 rondas", precio: "6 €", plazas: 16,
        texto: "Premios en sobres según la clasificación." }
    ],
    // Eventos con fecha concreta (AAAA-MM-DD)
    especiales: [
      { fecha: "2026-11-29", hora: "10:00", juego: "pokemon", nombre: "League Challenge de noviembre",
        formato: "Estándar · puntos oficiales", precio: "10 €", plazas: 32,
        texto: "Trae tu ID de jugador. Inscripciones hasta el viernes anterior." },
      { fecha: "2026-12-13", hora: "10:00", juego: "pokemon", nombre: "League Cup de invierno",
        formato: "Estándar · 5 rondas + top 8", precio: "15 €", plazas: 48,
        texto: "Torneo con puntos para el campeonato. Lista de mazo obligatoria." },
      { fecha: "2026-12-19", hora: "17:00", juego: "lorcana", nombre: "Torneo de Navidad Lorcana",
        formato: "Constructed · 4 rondas", precio: "8 €", plazas: 24, texto: "" },
      { fecha: "2027-01-17", hora: "10:00", juego: "pokemon", nombre: "Presentación de la nueva expansión",
        formato: "Sellado · 6 sobres", precio: "30 €", plazas: 32,
        texto: "Abres sobres, montas mazo y juegas. Incluye carta promocional." }
    ]
  },

  // VITRINA de cartas sueltas. estado: NM (casi nueva), EX, GD...
  // tipo (solo para el color de la ilustración): fuego, agua, planta, rayo, psiquico, lucha, oscuro, metal, dragon, incoloro
  // foto (opcional): ruta a una foto propia de la carta, p. ej. "img/cartas/charizard.jpg". Sin foto se dibuja una ilustración de color.
  cartas: [
    { juego: "pokemon", nombre: "Charizard ex", expansion: "Llamas Obsidianas", codigo: "223/197", rareza: "Rara Secreta", estado: "NM", precio: 84.95, tipo: "fuego", foil: true },
    { juego: "pokemon", nombre: "Pikachu ex", expansion: "Chispas Fulgurantes", codigo: "238/191", rareza: "Rara Especial Ilustración", estado: "NM", precio: 64.90, tipo: "rayo", foil: true },
    { juego: "pokemon", nombre: "Mew ex", expansion: "151", codigo: "205/165", rareza: "Rara Hiper", estado: "NM", precio: 39.95, tipo: "psiquico", foil: true },
    { juego: "pokemon", nombre: "Umbreon ex", expansion: "Evoluciones Prismáticas", codigo: "161/131", rareza: "Rara Especial Ilustración", estado: "NM", precio: 219.00, tipo: "oscuro", foil: true },
    { juego: "pokemon", nombre: "Gardevoir ex", expansion: "Escarlata y Púrpura", codigo: "245/198", rareza: "Rara Especial Ilustración", estado: "EX", precio: 22.50, tipo: "psiquico", foil: true },
    { juego: "pokemon", nombre: "Iono", expansion: "Evoluciones en Paldea", codigo: "269/193", rareza: "Rara Especial Ilustración", estado: "NM", precio: 34.00, tipo: "incoloro", foil: true },
    { juego: "pokemon", nombre: "Greninja ex", expansion: "Máscaras del Crepúsculo", codigo: "214/167", rareza: "Rara Especial Ilustración", estado: "NM", precio: 47.95, tipo: "agua", foil: true },
    { juego: "pokemon", nombre: "Squawkabilly ex", expansion: "Destinos de Paldea", codigo: "169/091", rareza: "Rara Hiper", estado: "NM", precio: 6.50, tipo: "incoloro", foil: true },
    { juego: "magic", nombre: "The One Ring", expansion: "El Señor de los Anillos", codigo: "LTR 246", rareza: "Mítica", estado: "NM", precio: 54.00, tipo: "metal", foil: false },
    { juego: "magic", nombre: "Sheoldred, the Apocalypse", expansion: "Dominaria United", codigo: "DMU 107", rareza: "Mítica", estado: "EX", precio: 62.00, tipo: "oscuro", foil: false },
    { juego: "onepiece", nombre: "Monkey.D.Luffy", expansion: "Romance Dawn", codigo: "OP01-024", rareza: "Super Rara", estado: "NM", precio: 18.00, tipo: "lucha", foil: true },
    { juego: "lorcana", nombre: "Elsa, Spirit of Winter", expansion: "The First Chapter", codigo: "42/204", rareza: "Legendaria", estado: "NM", precio: 12.90, tipo: "agua", foil: false }
  ],

  // VENDE TU COLECCIÓN
  compra: {
    compramos: ["Colecciones completas y carpetas", "Cartas sueltas de valor (desde 2 €)", "Producto sellado: sobres, cajas y ETB", "Cartas graduadas (PSA, Beckett, CGC)"],
    noCompramos: ["Cartas falsas o de imitación", "Cartas muy dañadas o dobladas", "Lotes solo de comunes sin revisar"],
    pago: ["Efectivo en el momento", "Transferencia o Bizum", "Crédito en tienda con un 20 % más"]
  },

  // Texto del pie (quién ha hecho la web)
  credito: "Web de demostración para tiendas de cartas"
};
