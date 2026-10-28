// Elimina acentos, diacríticos y caracteres especiales, pasando todo a minúsculas
export const normalizeSearchText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')    // Reemplaza símbolos por espacios
    .replace(/\s+/g, ' ')            // Limpia espacios múltiples
    .trim();
};

// Evalúa si TODOS los términos buscados existen en el texto objetivo (sin importar el orden)
export const matchesSmartSearch = (targetText: string, query: string): boolean => {
  const cleanQuery = normalizeSearchText(query);
  if (!cleanQuery) return true;

  const cleanTarget = normalizeSearchText(targetText);
  const queryTokens = cleanQuery.split(' ');

  return queryTokens.every((token) => cleanTarget.includes(token));
};