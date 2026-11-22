import { $, $$ } from './ui.ts';
import { cargar, suscribir } from '../lib/almacen.ts';
import { PRODUCTOS, CATEGORIAS, EXPANSIONES, RAREZAS, IDIOMAS } from '../data/catalogo.ts';
import { aURL, desdeURL, filtrar, FILTROS_VACIOS, type Filtros } from '../lib/filtros.ts';
import { tarjetaProducto } from '../lib/vistas/producto.ts';
import { icono } from '../lib/iconos.ts';
import { enlaceWhatsApp } from '../data/tienda.ts';
import { esc } from '../lib/html.ts';
import { pintarProductos } from './app.ts';

const form = $<HTMLFormElement>('#filtros')!;
const q = $<HTMLInputElement>('#q')!;
const orden = $<HTMLSelectElement>('#orden')!;
const rejilla = $('#rejilla')!;
const panel = $('[data-filtros-panel]')!;
let f: Filtros = desdeURL(new URLSearchParams(location.search));

function aFormulario() {
  q.value = f.q;
  orden.value = f.orden;
  const marcar = (nombre: string, valores: string[]) => {
    for (const c of $$<HTMLInputElement>(`[name="${nombre}"]`, form)) c.checked = valores.includes(c.value);
  };
  marcar('categoria', f.categorias);
  marcar('expansion', f.expansiones);
  marcar('rareza', f.rarezas);
  marcar('idioma', f.idiomas);
  marcar('uso', f.usos);
  marcar('disponible', f.soloDisponibles ? ['1'] : []);
  ($<HTMLInputElement>('[name="min"]', form)!).value = f.min?.toString() ?? '';
  ($<HTMLInputElement>('[name="max"]', form)!).value = f.max?.toString() ?? '';
}

function desdeFormulario(): Filtros {
  const d = new FormData(form);
  const num = (k: string) => {
    const v = String(d.get(k) ?? '').trim();
    return v === '' || Number.isNaN(+v) ? null : Math.max(0, +v);
  };
  return {
    q: q.value.trim(),
    categorias: d.getAll('categoria') as Filtros['categorias'],
    expansiones: d.getAll('expansion') as string[],
    rarezas: d.getAll('rareza') as Filtros['rarezas'],
    idiomas: d.getAll('idioma') as Filtros['idiomas'],
    usos: d.getAll('uso') as Filtros['usos'],
    soloDisponibles: d.get('disponible') === '1',
    min: num('min'),
    max: num('max'),
    orden: orden.value as Filtros['orden'],
  };
}

function chipsActivos() {
  const chips: [string, () => void][] = [];
  const quitar = <K extends keyof Filtros>(k: K, v?: string) => () => {
    const actual = f[k];
    f = { ...f, [k]: Array.isArray(actual) ? (actual as string[]).filter((x) => x !== v) : FILTROS_VACIOS[k] };
    aplicar(true);
  };
  if (f.q) chips.push([`«${f.q}»`, quitar('q')]);
  f.categorias.forEach((c) => chips.push([CATEGORIAS.find((x) => x.id === c)?.plural ?? c, quitar('categorias', c)]));
  f.expansiones.forEach((c) => chips.push([EXPANSIONES.find((x) => x.id === c)?.nombre ?? c, quitar('expansiones', c)]));
  f.rarezas.forEach((c) => chips.push([RAREZAS[c]?.nombre ?? c, quitar('rarezas', c)]));
  f.idiomas.forEach((c) => chips.push([IDIOMAS[c] ?? c, quitar('idiomas', c)]));
  const USO: Record<string, string> = { coleccion: 'Para coleccionar', jugar: 'Para jugar', regalo: 'Para regalar', empezar: 'Para empezar' };
  f.usos.forEach((c) => chips.push([USO[c] ?? c, quitar('usos', c)]));
  if (f.soloDisponibles) chips.push(['Con stock', quitar('soloDisponibles')]);
  if (f.min != null) chips.push([`Desde ${f.min} €`, quitar('min')]);
  if (f.max != null) chips.push([`Hasta ${f.max} €`, quitar('max')]);
  return chips;
}

function aplicar(sincronizarFormulario = false) {
  if (sincronizarFormulario) aFormulario();
  const e = cargar();
  const res = filtrar(PRODUCTOS, e.productos, f);
  rejilla.innerHTML = res.map((p, i) => String(tarjetaProducto(p, e.productos[p.id], { cargaPrioritaria: i < 4 })).replace('<article class="producto"', `<article style="--n:${Math.min(i, 12)}" class="producto"`)).join('');
  $('[data-vacio]')!.hidden = res.length > 0;
  $<HTMLAnchorElement>('[data-preguntar]')!.href = enlaceWhatsApp(`Hola, estoy buscando ${f.q || 'una carta'} y no la encuentro en la web. ¿La tenéis?`);
  for (const el of $$('[data-cuenta-boton]')) el.textContent = String(res.length);
  $('[data-anuncio]')!.textContent = `${res.length} productos`;
  const chips = chipsActivos();
  const zona = $('[data-activos]')!;
  zona.innerHTML = chips.map(([t], i) => `<button type="button" class="activo" data-quitar="${i}" aria-label="Quitar filtro ${esc(t)}">${esc(t)}${icono('cerrar')}</button>`).join('') +
    (chips.length > 1 ? '<button type="button" class="activo" style="background:transparent;color:var(--tinta);text-decoration:underline" data-limpiar>Quitar todos</button>' : '');
  zona.onclick = (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-quitar]');
    if (b) chips[+b.dataset.quitar!][1]();
  };
  const nf = chips.filter(([t]) => !t.startsWith('«')).length;
  $('[data-num-filtros]')!.textContent = nf ? `(${nf})` : '';
  for (const b of $$('[data-cat-rapida]')) {
    const v = b.dataset.catRapida!;
    b.setAttribute('aria-pressed', String(v === '' ? f.categorias.length === 0 : f.categorias.length === 1 && f.categorias[0] === v));
  }
  history.replaceState(null, '', `${location.pathname}${aURL(f)}`);
  pintarProductos();
}

let espera: number | undefined;
q.addEventListener('input', () => {
  clearTimeout(espera);
  espera = window.setTimeout(() => {
    f = desdeFormulario();
    aplicar();
  }, 140);
});
form.addEventListener('change', () => {
  f = desdeFormulario();
  aplicar();
});
form.addEventListener('submit', (ev) => ev.preventDefault());
orden.addEventListener('change', () => {
  f = desdeFormulario();
  aplicar();
});
document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  if (t.closest('[data-limpiar]')) {
    f = { ...FILTROS_VACIOS };
    aplicar(true);
  }
  const cat = t.closest<HTMLElement>('[data-cat-rapida]');
  if (cat) {
    f = { ...f, categorias: cat.dataset.catRapida ? [cat.dataset.catRapida as Filtros['categorias'][number]] : [] };
    aplicar(true);
  }
  if (t.closest('[data-abrir-filtros]')) {
    panel.classList.add('abierto');
    document.body.style.overflow = 'hidden';
  }
  if (t.closest('[data-cerrar-filtros]') || t === panel) {
    panel.classList.remove('abierto');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && panel.classList.contains('abierto')) {
    panel.classList.remove('abierto');
    document.body.style.overflow = '';
  }
});

aFormulario();
if (location.search) aplicar();
suscribir(() => aplicar());
