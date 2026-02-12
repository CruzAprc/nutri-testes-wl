/**
 * Converte numeros no formato brasileiro (virgula como decimal) para number.
 * Ex: "1,5" -> 1.5, "100" -> 100, null -> 0
 */
export function parseBrazilianNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const normalized = value.toString().replace(',', '.');
  const parsed = parseFloat(normalized);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normaliza texto removendo acentos e convertendo para minusculas.
 * Util para buscas case-insensitive e accent-insensitive.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/,/g, ' ')
    .trim();
}
