export function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}

// Las columnas DATE llegan como 'AAAA-MM-DD' o como medianoche UTC
// ('AAAA-MM-DDT00:00:00.000Z'). Convertirlas con new Date() a la zona del
// navegador (Colombia, UTC-5) las corre un día atrás, así que se toman como
// fecha de calendario. Los timestamps reales sí se convierten a hora local.
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?(?:Z|[+-]00:?00)?)?$/;

export function aFecha(dateString: string): Date {
  const m = SOLO_FECHA.exec(String(dateString ?? '').trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(dateString);
}

// Fecha de hoy como 'AAAA-MM-DD' en la zona del navegador. toISOString() da la de
// UTC y, en Colombia (UTC-5), después de las 7 p. m. devuelve la fecha de mañana.
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  const date = aFecha(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = aFecha(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
