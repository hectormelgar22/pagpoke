import { $, $$, mueve } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import { PRODUCTOS } from '../data/catalogo.ts';
import { filtrar, FILTROS_VACIOS, aURL, type Filtros } from '../lib/filtros.ts';
import { tarjetaProducto } from '../lib/vistas/producto.ts';
import { destacado, tarjetaTorneo, podio } from '../lib/vistas/torneo.ts';
import { calcularRanking, temporadaDe } from '../lib/ranking.ts';
import { estadoTorneo, plazas, ETIQUETA_ESTADO } from '../lib/torneo.ts';
import { fechaCorta } from '../lib/fechas.ts';
import { icono } from '../lib/iconos.ts';
import { iniciarCuentas, iniciarTilt } from './efectos.ts';
import { pintarProductos } from './app.ts';

/* Hero: la escena sigue al cursor (solo con ratón y si el usuario acepta movimiento) */
const escena = $('.hero-escena');
const hero = $('[data-hero]');
if (escena && hero && mueve() && matchMedia('(pointer: fine)').matches) {
  hero.addEventListener('pointermove', (ev) => {
    const r = hero.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    escena.style.setProperty('--ry', `${x * 14}deg`);
    escena.style.setProperty('--rx', `${-y * 8}deg`);
    escena.style.setProperty('--mx', `${50 + x * 80}%`);
  });
  hero.addEventListener('pointerleave', () => {
    escena.style.setProperty('--ry', '0deg');
    escena.style.setProperty('--rx', '0deg');
  });
}

/* Torneos con el estado guardado (inscripciones hechas en esta demo) */
function pintarTorneos() {
  const e = cargar();
  const ahora = new Date();
  const proximos = e.torneos.filter((t) => !t.finalizado && Date.parse(t.inicio) > ahora.getTime()).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const grande = proximos.find((t) => t.destacado) ?? proximos[0];
  const cont = $('[data-inicio-torneos]');
  if (cont) {
    cont.innerHTML = `${grande ? destacado(grande, ahora) : ''}<div class="rejilla-torneos">${proximos
      .filter((t) => t !== grande)
      .slice(0, 3)
      .map((t) => tarjetaTorneo(t, ahora))
      .join('')}</div>`;
    iniciarCuentas(cont);
  }
  const pod = $('[data-inicio-podio]');
  if (pod) pod.innerHTML = String(podio(calcularRanking(e.torneos, e.jugadores, temporadaDe(ahora.toISOString()).id), e.jugadores));
  const sig = $('[data-proximo-torneo]');
  const t = proximos.find((x) => ['abiertas', 'ultimas-plazas'].includes(estadoTorneo(x, ahora))) ?? proximos[0];
  if (sig && t) {
    const p = plazas(t);
    const est = estadoTorneo(t, ahora);
    sig.setAttribute('href', t.creadoEnPanel ? `/torneos/evento/?id=${t.id}` : `/torneos/${t.slug}/`);
    $('[data-texto]', sig)!.textContent = `${t.nombre} · ${fechaCorta(t.inicio)} · ${est === 'abiertas' || est === 'ultimas-plazas' ? `${p.libres} plazas` : ETIQUETA_ESTADO[est]}`;
  }
}
pintarTorneos();
suscribir(pintarTorneos);
setInterval(pintarTorneos, 60000);

/* Escaparate: pestañas y flechas del carrusel */
const carrusel = $('[data-carrusel]');
if (carrusel) {
  const pistaActiva = () => $$('[data-panel]', carrusel).find((p) => !p.hidden)!;
  const flechas = () => {
    const p = pistaActiva();
    const [a, s] = $$<HTMLButtonElement>('[data-mover]', carrusel);
    a.disabled = p.scrollLeft < 8;
    s.disabled = p.scrollLeft + p.clientWidth >= p.scrollWidth - 8;
  };
  carrusel.addEventListener('click', (ev) => {
    const tab = (ev.target as HTMLElement).closest<HTMLElement>('[data-lista]');
    if (tab) {
      for (const b of $$('[data-lista]', carrusel)) {
        const on = b === tab;
        b.setAttribute('aria-selected', String(on));
        b.setAttribute('aria-pressed', String(on));
      }
      for (const p of $$('[data-panel]', carrusel)) p.hidden = p.dataset.panel !== tab.dataset.lista;
      pistaActiva().scrollLeft = 0;
      flechas();
    }
    const mover = (ev.target as HTMLElement).closest<HTMLElement>('[data-mover]');
    if (mover) {
      const p = pistaActiva();
      p.scrollBy({ left: +mover.dataset.mover! * p.clientWidth * 0.9, behavior: mueve() ? 'smooth' : 'auto' });
    }
  });
  for (const p of $$('[data-panel]', carrusel)) p.addEventListener('scroll', flechas, { passive: true });
  flechas();
}

iniciarTilt();

/* Asistente de compra: reglas sencillas sobre el catálogo real */
const form = $<HTMLFormElement>('[data-asistente]');
const salida = $('[data-asistente-resultado]');
const CATS: Record<string, Filtros['categorias']> = { todo: [], cartas: ['cartas', 'coleccion'], sobres: ['sobres', 'cajas'], accesorios: ['accesorios', 'merch'] };
function recomendar() {
  if (!form || !salida) return;
  const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
  const [min, max] = d.presupuesto.split('-').map(Number);
  const base: Filtros = {
    ...FILTROS_VACIOS,
    categorias: CATS[d.tipo],
    usos: d.uso ? [d.uso as Filtros['usos'][number]] : [],
    expansiones: d.expansion ? [d.expansion] : [],
    min: min || null,
    max: max >= 99999 ? null : max,
    soloDisponibles: true,
  };
  const e = cargar();
  let res = filtrar(PRODUCTOS, e.productos, base);
  let aviso = '';
  if (!res.length && base.expansiones.length) {
    res = filtrar(PRODUCTOS, e.productos, { ...base, expansiones: [] });
    aviso = 'No tenemos nada de esa expansión con esos criterios; te enseñamos lo más parecido.';
  }
  if (!res.length && base.usos.length) {
    res = filtrar(PRODUCTOS, e.productos, { ...base, expansiones: [], usos: [] });
    aviso = 'No hay coincidencias exactas; te enseñamos lo más parecido dentro de tu presupuesto.';
  }
  const enlace = `/catalogo/${aURL({ ...base, soloDisponibles: true })}`;
  salida.innerHTML = res.length
    ? `<div class="fila" style="justify-content:space-between"><p><strong>${res.length} ${res.length === 1 ? 'producto encaja' : 'productos encajan'}</strong>${aviso ? ` · <span style="color:var(--gris)">${aviso}</span>` : ''}</p><a class="enlace-flecha" href="${enlace}">Verlos en el catálogo ${icono('flecha')}</a></div>
       <div class="rejilla-productos">${res.slice(0, 4).map((p) => tarjetaProducto(p, e.productos[p.id])).join('')}</div>`
    : `<div class="vacio">${icono('lupa')}<p>Con ese presupuesto no tenemos nada en stock ahora mismo. Prueba a subirlo o pregúntanos: entra producto cada semana.</p></div>`;
  pintarProductos();
}
form?.addEventListener('change', recomendar);
form?.addEventListener('submit', (ev) => ev.preventDefault());
recomendar();
suscribir(recomendar);
