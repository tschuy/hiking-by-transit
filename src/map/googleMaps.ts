export function googleMapsUrl([longitude, latitude]: [number, number]): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
}
