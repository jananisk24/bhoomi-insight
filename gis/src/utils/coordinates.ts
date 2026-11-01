export type Coordinates = [number, number];

export const isValidCoordinatePair = (
  latitude: string,
  longitude: string
): boolean => {
  if (latitude.trim() === '' || longitude.trim() === '') {
    return latitude.trim() === '' && longitude.trim() === '';
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const formatCoordinates = (
  latitude: number,
  longitude: number
): Coordinates => [
  Number(latitude.toFixed(6)),
  Number(longitude.toFixed(6)),
];
