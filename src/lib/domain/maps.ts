type MapsTarget = {
  name: string;
  address: string | null;
  cityName: string;
  lat: number | null;
  lng: number | null;
};

export function mapsUrl(place: MapsTarget): string {
  const query =
    place.lat && place.lng
      ? `${place.lat},${place.lng}`
      : `${place.name}, ${place.address ?? place.cityName}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
