/* Utilidades de interfaz compartidas por todas las páginas. */
import { icono } from '../lib/iconos.ts';
import { esc } from '../lib/html.ts';

export const $ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) => raiz.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) => [...raiz.querySelectorAll<T>(sel)];

export function toast(texto: string, tipo: 'ok' | 'error' = 'ok', ms = 4200): void {
  const zona = $('#avisos');
  if (!zona) return;
  const el = document.createElement('div');
  el.className = `aviso-toast${tipo === 'error' ? ' aviso-toast--error' : ''}`;
  el.innerHTML = `${icono(tipo === 'error' ? 'alerta' : 'check')}<span>${esc(texto)}</span>`;
  zona.append(el);
  setTimeout(() => el.remove(), ms);
}

export function abrir(id: string): HTMLDialogElement | null {
  const d = document.getElementById(id) as HTMLDialogElement | null;
  if (d && !d.open) {
    d.showModal();
    d.dispatchEvent(new Event('abierto'));
  }
  return d;
}

export const mueve = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Validación simple de contacto (teléfono o email). */
export function contactoValido(v: string): boolean {
  const c = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) || (c.replace(/\D/g, '').length >= 9 && /^[+\d\s().-]+$/.test(c));
}

/** Muestra errores en un formulario: claves = name del campo. Devuelve true si no hay errores. */
export function mostrarErrores(form: HTMLElement, errores: Record<string, string | undefined>): boolean {
  let primero: HTMLElement | null = null;
  for (const p of $$<HTMLElement>('[data-error]', form)) {
    const k = p.dataset.error!;
    const msg = errores[k];
    p.hidden = !msg;
    p.textContent = msg ?? '';
    const campo = form.querySelector<HTMLElement>(`[name="${k}"]`);
    if (campo) {
      campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) {
        if (!p.id) p.id = `err-${k}-${Math.random().toString(36).slice(2, 6)}`;
        campo.setAttribute('aria-describedby', p.id);
        primero ??= campo;
      } else campo.removeAttribute('aria-describedby');
    }
  }
  primero?.focus();
  return !primero && !errores.general;
}

/** Descarga un .ics para añadir un evento al calendario personal. */
export function descargarIcs(nombre: string, inicio: string, duracionMin: number, lugar: string, descripcion: string, url: string): void {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ini = new Date(inicio);
  const fin = new Date(ini.getTime() + duracionMin * 60000);
  const limpiar = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Destello//Agenda//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${f(ini)}-${nombre.replace(/\W/g, '').slice(0, 20)}@destello`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ini)}`, `DTEND:${f(fin)}`,
    `SUMMARY:${limpiar(nombre)}`, `LOCATION:${limpiar(lugar)}`, `DESCRIPTION:${limpiar(descripcion)}`, `URL:${url}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
