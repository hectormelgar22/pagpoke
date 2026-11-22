import { $, $$, contactoValido, mostrarErrores, toast } from './ui.ts';
import { mutar, nuevoId } from '../lib/almacen.ts';
import { enlaceWhatsApp } from '../data/tienda.ts';
import { icono } from '../lib/iconos.ts';
import { esc } from '../lib/html.ts';
import type { SolicitudVenta } from '../lib/tipos.ts';

const form = $<HTMLFormElement>('#form-venta')!;
const TITULOS = ['Qué quieres hacer', 'Qué tienes', 'Fotos', 'Contacto'];
let paso = 1;
const fotos: { url: string; nombre: string }[] = [];

function ir(n: number) {
  paso = n;
  for (const f of $$('[data-pv]', form)) f.hidden = f.dataset.pv !== String(n);
  $$('[data-barra-venta] span').forEach((s, i) => s.classList.toggle('hecho', i < n));
  $('[data-paso-venta-texto]')!.textContent = `Paso ${n} de 4 · ${TITULOS[n - 1]}`;
  $('[data-pv-atras]')!.hidden = n === 1;
  $('[data-pv-siguiente]')!.hidden = n === 4;
  $('[data-pv-enviar]')!.hidden = n !== 4;
  $<HTMLElement>(`[data-pv="${n}"] legend`)?.setAttribute('tabindex', '-1');
  $<HTMLElement>(`[data-pv="${n}"] legend`)?.focus();
}

$('[data-pv-siguiente]')!.addEventListener('click', () => ir(Math.min(4, paso + 1)));
$('[data-pv-atras]')!.addEventListener('click', () => ir(Math.max(1, paso - 1)));

function pintarFotos() {
  $('[data-miniaturas]')!.innerHTML = fotos
    .map((f, i) => `<li><img src="${f.url}" alt="Foto ${i + 1}: ${esc(f.nombre)}" /><button type="button" data-quitar-foto="${i}" aria-label="Quitar foto ${i + 1}">${icono('cerrar')}</button></li>`)
    .join('');
}
$<HTMLInputElement>('#v-fotos')!.addEventListener('change', (ev) => {
  const input = ev.target as HTMLInputElement;
  const errores: string[] = [];
  for (const file of [...(input.files ?? [])]) {
    if (fotos.length >= 8) {
      errores.push('Máximo 8 fotos.');
      break;
    }
    if (!file.type.startsWith('image/')) {
      errores.push(`«${file.name}» no es una imagen.`);
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      errores.push(`«${file.name}» pesa más de 10 MB.`);
      continue;
    }
    fotos.push({ url: URL.createObjectURL(file), nombre: file.name });
  }
  input.value = '';
  mostrarErrores(form, { fotos: errores.join(' ') || undefined });
  pintarFotos();
});
$('[data-miniaturas]')!.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-quitar-foto]');
  if (!b) return;
  const [f] = fotos.splice(+b.dataset.quitarFoto!, 1);
  URL.revokeObjectURL(f.url);
  pintarFotos();
});

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (paso < 4) return ir(paso + 1); // Intro en un paso intermedio = continuar
  const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
  const errores = {
    nombre: (d.nombre ?? '').trim().length < 2 ? 'Escribe tu nombre.' : undefined,
    contacto: !contactoValido(d.contacto ?? '') ? 'Escribe un teléfono o un email válido.' : undefined,
    privacidad: !d.privacidad ? 'Necesitamos tu permiso para poder responderte.' : undefined,
  };
  if (!mostrarErrores(form, errores)) return;
  const s: SolicitudVenta = {
    id: nuevoId('v'), operacion: d.operacion as SolicitudVenta['operacion'], material: d.material, cantidad: d.cantidad, estadoCartas: d.estadoCartas,
    detalle: (d.detalle ?? '').trim(), fotos: fotos.length, nombre: d.nombre.trim(), contacto: d.contacto.trim(), fecha: new Date().toISOString(), atendida: false,
  };
  mutar((e) => e.ventas.unshift(s));
  const verbo = { vender: 'vender', intercambiar: 'intercambiar', valorar: 'valorar' }[s.operacion];
  $('[data-venta-resumen]')!.textContent = `Quieres ${verbo}: ${s.material.toLowerCase()} (${s.cantidad.toLowerCase()}), ${s.fotos} ${s.fotos === 1 ? 'foto' : 'fotos'}. Te responderemos en menos de 24 h.`;
  $<HTMLAnchorElement>('[data-venta-wa]')!.href = enlaceWhatsApp(
    `Hola, soy ${s.nombre}. Acabo de enviar una solicitud para ${verbo} mi colección:\n· ${s.material}\n· ${s.cantidad}\n· Estado: ${s.estadoCartas}${s.detalle ? `\n· ${s.detalle}` : ''}\nOs adjunto las fotos aquí.`,
  );
  form.hidden = true;
  $('[data-barra-venta]')!.hidden = true;
  $('[data-paso-venta-texto]')!.hidden = true;
  $('[data-venta-ok]')!.hidden = false;
  toast('Solicitud enviada');
});

$('[data-venta-otra]')!.addEventListener('click', () => {
  form.reset();
  fotos.splice(0).forEach((f) => URL.revokeObjectURL(f.url));
  pintarFotos();
  form.hidden = false;
  $('[data-barra-venta]')!.hidden = false;
  $('[data-paso-venta-texto]')!.hidden = false;
  $('[data-venta-ok]')!.hidden = true;
  ir(1);
});
