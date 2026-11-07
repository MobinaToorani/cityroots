/** "Kerr Village, Oakville", without repeating a city the neighbourhood already names. */
export function whereLine(neighborhood: string | null | undefined, city?: string | null): string {
  const area = neighborhood?.trim();
  if (!area) return city ?? "";
  if (!city || area.toLowerCase().includes(city.toLowerCase())) return area;
  return `${area}, ${city}`;
}
