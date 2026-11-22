// Comprobación rápida de la lógica: node test.js
const assert = require("assert");
const L = require("./app.js");

const h = { lunes: [["17:00", "21:00"]], martes: [["10:30", "13:30"], ["17:00", "21:00"]], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: [] };
assert.deepStrictEqual(L.estadoTienda(h, { dia: 0, min: 18 * 60 }), { abierto: true, texto: "Abierto ahora · cierra a las 21:00" });
assert.strictEqual(L.estadoTienda(h, { dia: 1, min: 14 * 60 }).texto, "Cerrado · abre hoy a las 17:00");
assert.strictEqual(L.estadoTienda(h, { dia: 0, min: 21 * 60 }).texto, "Cerrado · abre mañana a las 10:30");
assert.strictEqual(L.estadoTienda(h, { dia: 2, min: 600 }).texto, "Cerrado · abre el lunes a las 17:00");

assert.strictEqual(L.diaSemana("2026-11-22"), 6); // domingo
const ev = L.generarEventos({
  semanales: [{ nombre: "Liga", dia: "jueves", hora: "18:00" }],
  especiales: [{ nombre: "Pasado", fecha: "2026-11-01", hora: "10:00" }, { nombre: "Cup", fecha: "2026-11-26", hora: "10:00" }]
}, "2026-11-22", 2);
assert.deepStrictEqual(ev.map(e => e.fecha + " " + e.nombre), ["2026-11-26 Cup", "2026-11-26 Liga", "2026-12-03 Liga"]);

// Hora de Madrid: 22-11-2026 23:30 UTC = 23-11 00:30 en Madrid (lunes)
assert.deepStrictEqual(L.ahoraEn("Europe/Madrid", new Date("2026-11-22T23:30:00Z")), { iso: "2026-11-23", dia: 0, min: 30 });
assert.strictEqual(L.fechaLarga("2026-12-13"), "domingo 13 de diciembre");
console.log("OK");
