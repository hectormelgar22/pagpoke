/* Fechas: se guardan en UTC (ISO) y se muestran siempre en la hora de la tienda,
   también cuando la web se genera en un servidor de otro país. */

export const ZONA = 'Europe/Madrid';
const LOCALE = 'es-ES';

export interface Partes {
  y: number;
  m: number; // 1-12
  d: number;
  h: number;
  min: number;
  /** 1 = lunes … 7 = domingo */
  dow: number;
}

const fmtPartes = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
});
const DOW: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function partes(fecha: Date | string): Partes {
  const p: Record<string, string> = {};
  for (const x of fmtPartes.formatToParts(new Date(fecha))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, dow: DOW[p.weekday] };
}

/** Fecha en hora de la tienda -> Date (UTC). Dos pasadas para acertar con el cambio de hora. */
const desfases = new Map<string, number>();
export function desdeZona(y: number, m: number, d: number, h = 0, min = 0): Date {
  // Desfase horario de ese día (se calcula una vez por día: formatear fechas es caro en móviles)
  const k = `${y}-${m}-${d}`;
  let desfase = desfases.get(k);
  if (desfase === undefined) {
    const mediodia = Date.UTC(y, m - 1, d, 12);
    const p = partes(new Date(mediodia));
    desfase = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - mediodia;
    desfases.set(k, desfase);
  }
  return new Date(Date.UTC(y, m - 1, d, h, min) - desfase);
}

/** Clave de día "AAAA-MM-DD" en hora de la tienda. */
export function claveDia(fecha: Date | string): string {
  const p = partes(fecha);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

export function sumarDias(clave: string, n: number): string {
  const [y, m, d] = clave.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Día de la semana (1 = lunes) de una clave de día. */
export function dowDeClave(clave: string): number {
  const [y, m, d] = clave.split('-').map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
}

/**
 * Fechas de la demo. Admite ISO normal o fechas relativas a "ahora" para que la demo nunca caduque:
 *  - "S-3/6 10:00": sábado (6) de hace 3 semanas, a las 10:00
 *  - "S+1/7 09:30": domingo de la semana que viene
 *  - "AHORA-180": hace 180 minutos (redondeado a la hora)
 */
const lunesDe = new Map<number, string>();
export function resolverFecha(valor: string, ahora: Date): string {
  const s = /^S([+-]\d+)\/([1-7]) (\d{2}):(\d{2})$/.exec(valor);
  if (s) {
    let lunes = lunesDe.get(ahora.getTime());
    if (!lunes) {
      const hoy = claveDia(ahora);
      lunes = sumarDias(hoy, 1 - dowDeClave(hoy));
      lunesDe.set(ahora.getTime(), lunes);
    }
    const dia = sumarDias(lunes, +s[1] * 7 + (+s[2] - 1));
    const [y, m, d] = dia.split('-').map(Number);
    return desdeZona(y, m, d, +s[3], +s[4]).toISOString();
  }
  const a = /^AHORA([+-]\d+)$/.exec(valor);
  if (a) {
    const t = new Date(ahora.getTime() + +a[1] * 60000);
    t.setUTCMinutes(0, 0, 0);
    return t.toISOString();
  }
  return new Date(valor).toISOString();
}

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(opciones: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const k = JSON.stringify(opciones);
  let f = cache.get(k);
  if (!f) cache.set(k, (f = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, ...opciones })));
  return f;
}

/** "sáb 29 nov" */
export const fechaCorta = (iso: string) =>
  fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso)).replace(/\./g, '').replace(',', '');
/** "sábado, 29 de noviembre de 2026" */
export const fechaLarga = (iso: string) =>
  fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
/** "29 nov 2026" */
export const fechaMedia = (iso: string) =>
  fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)).replace(/\./g, '');
/** "10:00" */
export const hora = (iso: string) => fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
export const diaNumero = (iso: string) => partes(iso).d;
export const mesCorto = (iso: string) => fmt({ month: 'short' }).format(new Date(iso)).replace('.', '');
export const nombreMes = (y: number, m: number) => {
  const t = fmt({ month: 'long', year: 'numeric' }).format(desdeZona(y, m, 15, 12));
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** "hoy", "mañana", "en 6 días", "hace 3 días" */
export function relativa(iso: string, ahora: Date): string {
  const dias = Math.round(
    (Date.parse(claveDia(iso)) - Date.parse(claveDia(ahora))) / 86400000,
  );
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  if (dias > 0) return `en ${dias} días`;
  return `hace ${-dias} días`;
}

/** Desglose para cuentas atrás. Devuelve null si la fecha ya pasó. */
export function cuentaAtras(iso: string, ahora: Date) {
  const ms = Date.parse(iso) - ahora.getTime();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { dias: Math.floor(s / 86400), horas: Math.floor((s % 86400) / 3600), min: Math.floor((s % 3600) / 60), seg: s % 60 };
}

/** Fecha para archivos .ics (UTC). */
export const ics = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
