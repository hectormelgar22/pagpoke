/* Lógica de la web. Lee todo de config.js (window.TIENDA). No hace falta tocar este archivo. */
(function () {
  "use strict";

  /* ---------- Lógica pura (se prueba en test.js) ---------- */
  var DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  var DIAS_BONITO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function aMin(h) { var p = h.split(":"); return +p[0] * 60 + +p[1]; }

  // "2026-11-22" -> Date en UTC (evita líos con el cambio de hora)
  function parseISO(s) { var p = s.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function aISO(d) { return d.toISOString().slice(0, 10); }
  function diaSemana(iso) { return (parseISO(iso).getUTCDay() + 6) % 7; } // 0 = lunes

  // Día (0 = lunes) y minuto actuales en la zona horaria de la tienda
  function ahoraEn(zona, fecha) {
    var partes = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(fecha || new Date()).forEach(function (p) { partes[p.type] = p.value; });
    var iso = partes.year + "-" + partes.month + "-" + partes.day;
    return { iso: iso, dia: diaSemana(iso), min: +partes.hour * 60 + +partes.minute };
  }

  // ¿Está abierta? Devuelve { abierto, texto }
  function estadoTienda(horario, ahora) {
    var hoy = horario[DIAS[ahora.dia]] || [];
    for (var i = 0; i < hoy.length; i++) {
      if (ahora.min >= aMin(hoy[i][0]) && ahora.min < aMin(hoy[i][1])) return { abierto: true, texto: "Abierto ahora · cierra a las " + hoy[i][1] };
    }
    for (var j = 0; j < hoy.length; j++) {
      if (ahora.min < aMin(hoy[j][0])) return { abierto: false, texto: "Cerrado · abre hoy a las " + hoy[j][0] };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (ahora.dia + k) % 7, t = horario[DIAS[d]] || [];
      if (t.length) return { abierto: false, texto: "Cerrado · abre " + (k === 1 ? "mañana" : "el " + DIAS_BONITO[d].toLowerCase()) + " a las " + t[0][0] };
    }
    return { abierto: false, texto: "Cerrado" };
  }

  // Lista de eventos desde hoyISO: semanales durante N semanas + especiales futuros, ordenados
  function generarEventos(torneos, hoyISO, semanas) {
    var lista = [], inicio = parseISO(hoyISO);
    (torneos.semanales || []).forEach(function (ev) {
      var objetivo = DIAS.indexOf(ev.dia);
      for (var n = 0; n < semanas * 7; n++) {
        var d = new Date(inicio.getTime() + n * 864e5);
        if ((d.getUTCDay() + 6) % 7 === objetivo) lista.push(Object.assign({}, ev, { fecha: aISO(d), semanal: true }));
      }
    });
    (torneos.especiales || []).forEach(function (ev) { if (ev.fecha >= hoyISO) lista.push(Object.assign({}, ev)); });
    return lista.sort(function (a, b) { return (a.fecha + a.hora).localeCompare(b.fecha + b.hora); });
  }

  function fechaLarga(iso) {
    var d = parseISO(iso);
    return DIAS_BONITO[diaSemana(iso)].toLowerCase() + " " + d.getUTCDate() + " de " + MESES[d.getUTCMonth()];
  }

  function precio(n) { return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" }); }

  var logica = { aMin: aMin, diaSemana: diaSemana, ahoraEn: ahoraEn, estadoTienda: estadoTienda, generarEventos: generarEventos, fechaLarga: fechaLarga };
  if (typeof module !== "undefined") module.exports = logica;
  if (typeof document === "undefined") return;

  /* ---------- Página ---------- */
  var T = window.TIENDA, $ = function (s, r) { return (r || document).querySelector(s); };
  var pagina = document.body.dataset.pagina;
  var dir = T.direccion;
  var dirTexto = dir.calle + ", " + dir.cp + " " + dir.ciudad;
  var mapsURL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(T.nombre + ", " + dirTexto);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function wa(texto) { return "https://wa.me/" + T.whatsapp + "?text=" + encodeURIComponent(texto); }
  function juego(id) { return T.juegos[id] || { nombre: id, color: "#999" }; }

  var ICONO = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/></svg>',
    mapa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.1C4.3 2.2 2.2 4.3 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.1 3.6 2.2 5.7 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.6-.1 5.7-2.2 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.1-3.6-2.2-5.7-5.8-5.8C15 2 14.7 2 12 2Z"/></svg>'
  };

  function logoHTML(clase) {
    return T.logo ? '<img class="' + clase + '" src="' + esc(T.logo) + '" alt="' + esc(T.nombre) + '">'
                  : '<span class="' + clase + ' monograma" aria-hidden="true">' + esc(T.iniciales) + "</span>";
  }

  // Colores de marca -> variables CSS
  var raiz = document.documentElement.style;
  raiz.setProperty("--tapete", T.colores.principal);
  raiz.setProperty("--energia", T.colores.acento);
  raiz.setProperty("--tinta", T.colores.tinta);
  raiz.setProperty("--papel", T.colores.fondo);

  // Textos sueltos marcados con data-t="ruta.del.dato"
  document.querySelectorAll("[data-t]").forEach(function (el) {
    var v = el.dataset.t.split(".").reduce(function (o, k) { return o && o[k]; }, T);
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-wa]").forEach(function (el) { el.href = wa(el.dataset.wa || "Hola, os escribo desde vuestra web."); });
  document.querySelectorAll("[data-maps]").forEach(function (el) { el.href = mapsURL; });
  // Título y descripción para Google: en el HTML pone "Mazo & Mesa" y "Zaragoza"; aquí se cambian por los datos reales
  function cambiarNombres(t) { return t.split("Mazo & Mesa").join(T.nombre).split("Zaragoza").join(dir.ciudad); }
  document.title = cambiarNombres(document.title);
  document.querySelectorAll('meta[name="description"], meta[property^="og:"]').forEach(function (m) { m.content = cambiarNombres(m.content); });
  var hj = $("#hero-juegos");
  if (hj) hj.textContent = Object.keys(T.juegos).map(function (k) { return T.juegos[k].nombre; }).join(" · ");

  /* Cabecera, pie y barra móvil */
  var enlaces = [["index.html", "inicio", "Inicio"], ["torneos.html", "torneos", "Torneos"], ["vitrina.html", "vitrina", "Cartas"], ["vende.html", "vende", "Vende tus cartas"]];
  var cab = $("#cabecera");
  if (cab) cab.innerHTML =
    (T.aviso ? '<p class="aviso">' + esc(T.aviso) + "</p>" : "") +
    '<div class="cab-in"><a class="marca" href="index.html">' + logoHTML("marca-logo") + '<span class="marca-nombre">' + esc(T.nombreCorto) + "</span></a>" +
    '<a class="cab-wa" data-wa href="' + wa("Hola, os escribo desde vuestra web.") + '">' + ICONO.wa + "<span>WhatsApp</span></a></div>" +
    '<nav class="nav" aria-label="Principal">' + enlaces.map(function (e) {
      return '<a href="' + e[0] + '"' + (e[1] === pagina ? ' aria-current="page"' : "") + ">" + e[2] + "</a>";
    }).join("") + "</nav>";

  var pie = $("#pie");
  if (pie) pie.innerHTML =
    '<div class="pie-in"><div><p class="pie-nombre">' + esc(T.nombre) + "</p><p>" + esc(T.descripcion) + "</p></div>" +
    "<div><p class=\"pie-tit\">Dónde estamos</p><p>" + esc(dirTexto) + '</p><p><a href="' + mapsURL + '">Cómo llegar</a></p></div>' +
    '<div><p class="pie-tit">Contacto</p><p><a href="tel:' + T.telefono.replace(/\s/g, "") + '">' + esc(T.telefono) + '</a></p><p><a href="mailto:' + esc(T.email) + '">' + esc(T.email) + "</a></p>" +
    (T.instagram ? '<p><a href="' + esc(T.instagram) + '" rel="noopener">Instagram</a></p>' : "") + "</div></div>" +
    '<p class="pie-credito">© ' + new Date().getFullYear() + " " + esc(T.nombre) + " · " + esc(T.credito) + "</p>";

  var barra = document.createElement("div");
  barra.className = "barra-movil";
  barra.innerHTML = '<a class="bm-wa" href="' + wa("Hola, os escribo desde vuestra web.") + '">' + ICONO.wa + "WhatsApp</a>" +
    '<a href="tel:' + T.telefono.replace(/\s/g, "") + '">' + ICONO.tel + "Llamar</a>" +
    '<a href="' + mapsURL + '">' + ICONO.mapa + "Cómo llegar</a>";
  document.body.appendChild(barra);

  /* Datos para Google (schema.org HobbyShop) */
  var dias = { lunes: "Monday", martes: "Tuesday", miercoles: "Wednesday", jueves: "Thursday", viernes: "Friday", sabado: "Saturday", domingo: "Sunday" };
  var horasLD = [];
  DIAS.forEach(function (d) { (T.horario[d] || []).forEach(function (t) { horasLD.push({ "@type": "OpeningHoursSpecification", dayOfWeek: dias[d], opens: t[0], closes: t[1] }); }); });
  var negocio = {
    "@context": "https://schema.org", "@type": "HobbyShop", "@id": T.web + "/#tienda",
    name: T.nombre, description: T.descripcion, url: T.web, telephone: T.telefono.replace(/\s/g, ""), email: T.email,
    priceRange: "€€",
    address: { "@type": "PostalAddress", streetAddress: dir.calle, postalCode: dir.cp, addressLocality: dir.ciudad, addressRegion: dir.provincia, addressCountry: "ES" },
    geo: { "@type": "GeoCoordinates", latitude: dir.lat, longitude: dir.lng },
    hasMap: mapsURL, openingHoursSpecification: horasLD, sameAs: [T.instagram].filter(Boolean)
  };
  function ponerLD(obj) { var s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(obj); document.head.appendChild(s); }
  ponerLD(negocio);

  /* ---------- Bloques de cada página (se pintan si existe su hueco) ---------- */
  var ahora = ahoraEn(T.zonaHoraria);

  // Carta holográfica de la portada
  var holo = $("#holo");
  if (holo) {
    var habs = T.torneos.semanales.slice(0, 2).map(function (e) {
      return "<li><b>" + esc(e.nombre) + "</b><span>" + DIAS_BONITO[DIAS.indexOf(e.dia)] + " · " + esc(e.hora) + "</span></li>";
    }).join("") + "<li><b>Compramos tu colección</b><span>Tasación sin compromiso</span></li>";
    holo.innerHTML = '<div class="holo-in">' +
      '<div class="holo-top"><span class="holo-nombre">' + esc(T.nombre) + '</span><span class="holo-desde">Desde ' + T.desde + "</span></div>" +
      '<div class="holo-arte">' + logoHTML("holo-logo") + "</div>" +
      '<p class="holo-tipo">Tienda de cartas · ' + esc(dir.barrio) + ", " + esc(dir.ciudad) + "</p>" +
      '<ul class="holo-habs">' + habs + "</ul>" +
      '<div class="holo-pie"><span>' + (T.valoracion ? "★ " + String(T.valoracion).replace(".", ",") + " · " + T.resenas + " reseñas" : esc(dir.ciudad)) + "</span><span>" + esc(T.iniciales.replace(/[^A-Z]/gi, "").toUpperCase()) + " 001/001</span></div>" +
      '</div><div class="holo-foil" aria-hidden="true"></div><div class="holo-brillo" aria-hidden="true"></div>';
    var mover = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (mover) {
      holo.addEventListener("pointermove", function (e) {
        var r = holo.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        holo.classList.add("activa");
        holo.style.setProperty("--rx", ((0.5 - y) * 22).toFixed(2) + "deg");
        holo.style.setProperty("--ry", ((x - 0.5) * 26).toFixed(2) + "deg");
        holo.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        holo.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      holo.addEventListener("pointerleave", function () { holo.classList.remove("activa"); ["--rx", "--ry", "--mx", "--my"].forEach(function (p) { holo.style.removeProperty(p); }); });
    }
  }

  // Abierto / cerrado
  document.querySelectorAll("[data-estado]").forEach(function (el) {
    var e = estadoTienda(T.horario, ahora);
    el.textContent = e.texto;
    el.classList.toggle("abierto", e.abierto);
  });

  // Valoración
  var val = $("#valoracion");
  if (val) { if (T.valoracion) val.textContent = "★ " + String(T.valoracion).replace(".", ",") + " en Google · " + T.resenas + " reseñas"; else val.remove(); }

  // Tabla de horario
  var hor = $("#horario");
  if (hor) hor.innerHTML = DIAS.map(function (d, i) {
    var t = T.horario[d] || [];
    return "<tr" + (i === ahora.dia ? ' class="hoy"' : "") + "><th scope=\"row\">" + DIAS_BONITO[i] + (i === ahora.dia ? " <small>hoy</small>" : "") + "</th><td>" +
      (t.length ? t.map(function (x) { return x[0] + "–" + x[1]; }).join("<br>") : "Cerrado") + "</td></tr>";
  }).join("");

  // Mapa (sin clave de API)
  var mapa = $("#mapa");
  if (mapa) mapa.innerHTML = '<iframe title="Mapa: ' + esc(T.nombre) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' +
    encodeURIComponent(dir.lat + "," + dir.lng) + '&z=16&output=embed"></iframe>';
  document.querySelectorAll("[data-direccion]").forEach(function (el) { el.textContent = dirTexto; });

  /* Torneos */
  var eventos = generarEventos(T.torneos, ahora.iso, T.torneos.semanasVista);

  function filaEvento(ev, i) {
    var d = parseISO(ev.fecha), j = juego(ev.juego);
    return '<li class="evento" data-juego="' + esc(ev.juego) + '" style="--juego:' + j.color + '">' +
      '<div class="ev-fecha"><span class="ev-dia">' + d.getUTCDate() + '</span><span class="ev-sem">' + DIAS_BONITO[diaSemana(ev.fecha)].slice(0, 3) + "</span></div>" +
      '<div class="ev-info"><p class="ev-meta"><span class="chip">' + esc(j.nombre) + "</span>" + (ev.semanal ? "" : '<span class="chip chip-especial">Evento especial</span>') + "</p>" +
      "<h3>" + esc(ev.nombre) + '</h3><p class="ev-datos">' + esc(ev.hora) + " h · " + esc(ev.formato) + " · " + esc(ev.precio) + (ev.plazas ? " · " + ev.plazas + " plazas" : "") + "</p>" +
      (ev.texto ? '<p class="ev-texto">' + esc(ev.texto) + "</p>" : "") + "</div>" +
      '<button class="btn btn-sec" type="button" data-inscribir="' + i + '">Inscribirme</button></li>';
  }

  var prox = $("#proximos");
  if (prox) prox.innerHTML = eventos.slice(0, 3).map(filaEvento).join("");

  var cal = $("#calendario");
  if (cal) {
    var filtroJ = "todos";
    var pintarCal = function () {
      var mesActual = "", html = "";
      eventos.forEach(function (ev, i) {
        if (filtroJ !== "todos" && ev.juego !== filtroJ) return;
        var d = parseISO(ev.fecha), mes = MESES[d.getUTCMonth()] + " " + d.getUTCFullYear();
        if (mes !== mesActual) { html += (mesActual ? "</ol>" : "") + '<h2 class="mes">' + mes + '</h2><ol class="eventos">'; mesActual = mes; }
        html += filaEvento(ev, i);
      });
      cal.innerHTML = html ? html + "</ol>" : '<p class="vacio">No hay eventos de este juego en las próximas semanas. Escríbenos y te avisamos del siguiente.</p>';
    };
    pintarFiltros($("#filtros-torneos"), function (j) { filtroJ = j; pintarCal(); }, Object.keys(T.juegos).filter(function (k) { return eventos.some(function (e) { return e.juego === k; }); }));
    pintarCal();
    // Eventos para Google
    eventos.slice(0, 12).forEach(function (ev) {
      // shortcut: zona horaria fija +01:00 (invierno); en verano sería +02:00. Ajustar si hay eventos entre abril y octubre.
      ponerLD({ "@context": "https://schema.org", "@type": "Event", name: ev.nombre + " — " + T.nombre, startDate: ev.fecha + "T" + ev.hora + ":00+01:00",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
        description: (ev.formato + ". " + (ev.texto || "")).trim(), organizer: { "@id": negocio["@id"] },
        location: { "@type": "Place", name: T.nombre, address: negocio.address },
        offers: { "@type": "Offer", price: (/(\d+)/.exec(ev.precio) || [0, 0])[1], priceCurrency: "EUR", url: T.web + "/torneos.html", availability: "https://schema.org/InStock" } });
    });
  }

  var sem = $("#semanales");
  if (sem) sem.innerHTML = T.torneos.semanales.map(function (e) {
    return '<li style="--juego:' + juego(e.juego).color + '"><span class="sem-dia">' + DIAS_BONITO[DIAS.indexOf(e.dia)] + "</span><b>" + esc(e.nombre) + "</b><span>" + esc(e.hora) + " h · " + esc(e.precio) + "</span></li>";
  }).join("");

  // Diálogo de inscripción -> WhatsApp
  var dlg = $("#dlg-inscripcion");
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-inscribir]");
    if (!b || !dlg) return;
    var ev = eventos[+b.dataset.inscribir];
    dlg.dataset.idx = b.dataset.inscribir;
    $("#dlg-titulo").textContent = ev.nombre;
    $("#dlg-cuando").textContent = fechaLarga(ev.fecha) + " · " + ev.hora + " h · " + ev.precio;
    $("#campo-categoria").hidden = ev.juego !== "pokemon";
    $("#campo-id-label").textContent = ev.juego === "pokemon" ? "ID de jugador Pokémon (opcional)" : "Nick o ID de jugador (opcional)";
    dlg.showModal();
  });
  if (dlg) {
    $("#dlg-cerrar").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    $("#form-inscripcion").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, ev = eventos[+dlg.dataset.idx];
      var txt = "Hola, quiero inscribirme en «" + ev.nombre + "» del " + fechaLarga(ev.fecha) + " a las " + ev.hora + ".\nNombre: " + f.nombre.value.trim() +
        (f.idjugador.value.trim() ? "\nID de jugador: " + f.idjugador.value.trim() : "") +
        (ev.juego === "pokemon" ? "\nCategoría: " + f.categoria.value : "");
      window.open(wa(txt), "_blank", "noopener");
      dlg.close();
    });
  }

  /* Vitrina */
  function cartaHTML(c) {
    var j = juego(c.juego);
    var msg = "Hola, quiero reservar esta carta: " + c.nombre + " (" + c.expansion + ", " + c.codigo + ", estado " + c.estado + ") a " + precio(c.precio) + ". ¿Sigue disponible?";
    return '<li class="carta" data-juego="' + esc(c.juego) + '" data-busca="' + esc((c.nombre + " " + c.expansion + " " + c.codigo).toLowerCase()) + '">' +
      '<div class="toploader">' + (c.foto
        ? '<img class="arte arte-foto" src="' + esc(c.foto) + '" alt="' + esc(c.nombre) + '" loading="lazy">'
        : '<div class="arte tipo-' + esc(c.tipo) + (c.foil ? " foil" : "") + '"><span class="arte-glifo" aria-hidden="true">' + esc(c.nombre.charAt(0)) + '</span><span class="arte-cod">' + esc(c.codigo) + "</span></div>") +
      '<span class="pegatina">' + precio(c.precio) + "</span></div>" +
      '<p class="carta-juego" style="--juego:' + j.color + '">' + esc(j.nombre) + "</p>" +
      "<h3>" + esc(c.nombre) + '</h3><p class="carta-exp">' + esc(c.expansion) + " · " + esc(c.codigo) + "</p>" +
      '<p class="carta-tags"><span>' + esc(c.rareza) + '</span><span title="Estado de la carta">' + esc(c.estado) + "</span></p>" +
      '<a class="btn btn-wa" href="' + wa(msg) + '" target="_blank" rel="noopener">' + ICONO.wa + "Reservar por WhatsApp</a></li>";
  }

  var dest = $("#destacadas");
  if (dest) dest.innerHTML = T.cartas.slice().sort(function (a, b) { return b.precio - a.precio; }).slice(0, 4).map(cartaHTML).join("");

  var vit = $("#vitrina");
  if (vit) {
    var fJ = "todos", fTexto = "";
    vit.innerHTML = T.cartas.map(cartaHTML).join("");
    var aplicar = function () {
      var n = 0;
      vit.querySelectorAll(".carta").forEach(function (el) {
        var ok = (fJ === "todos" || el.dataset.juego === fJ) && el.dataset.busca.indexOf(fTexto) > -1;
        el.hidden = !ok; if (ok) n++;
      });
      $("#vitrina-vacia").hidden = n > 0;
      $("#vitrina-cuenta").textContent = n + (n === 1 ? " carta" : " cartas");
    };
    pintarFiltros($("#filtros-vitrina"), function (j) { fJ = j; aplicar(); }, Object.keys(T.juegos).filter(function (k) { return T.cartas.some(function (c) { return c.juego === k; }); }));
    $("#buscar").addEventListener("input", function (e) { fTexto = e.target.value.trim().toLowerCase(); aplicar(); });
    aplicar();
  }

  function pintarFiltros(cont, alCambiar, ids) {
    if (!cont) return;
    cont.innerHTML = '<button type="button" aria-pressed="true" data-j="todos">Todos</button>' + ids.map(function (k) {
      return '<button type="button" aria-pressed="false" data-j="' + k + '" style="--juego:' + juego(k).color + '">' + esc(juego(k).nombre) + "</button>";
    }).join("");
    cont.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      cont.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      alCambiar(b.dataset.j);
    });
  }

  /* Vende tu colección */
  function lista(id, arr) { var el = $(id); if (el) el.innerHTML = arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); }
  lista("#compramos", T.compra.compramos);
  lista("#no-compramos", T.compra.noCompramos);
  lista("#pago", T.compra.pago);

  var fv = $("#form-venta");
  if (fv) {
    fv.juego.innerHTML = Object.keys(T.juegos).map(function (k) { return "<option>" + esc(T.juegos[k].nombre) + "</option>"; }).join("") + "<option>Varios juegos</option>";
    fv.addEventListener("submit", function (e) {
      e.preventDefault();
      var txt = "Hola, quiero venderos cartas.\nJuego: " + fv.juego.value + "\nQué es: " + fv.que.value + "\nCantidad aproximada: " + fv.cantidad.value +
        (fv.detalle.value.trim() ? "\nDetalles: " + fv.detalle.value.trim() : "") + "\nAhora os mando unas fotos.";
      window.open(wa(txt), "_blank", "noopener");
    });
  }
})();
