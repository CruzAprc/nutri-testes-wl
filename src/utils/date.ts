/**
 * Retorna a data atual no fuso horario de Brasilia (UTC-3) no formato YYYY-MM-DD
 */
export function getBrasiliaDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}
