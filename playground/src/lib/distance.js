export function convertDistance(value, from, to) {
  // Direct bidirectional conversions between km, mi, and m
  // Existing km ↔ mi conversions
  if (from === "km" && to === "mi") return value * 0.621371;
  if (from === "mi" && to === "km") return value / 0.621371;

  // New km ↔ m conversions
  if (from === "km" && to === "m") return value * 1000;
  if (from === "m" && to === "km") return value / 1000;

  // New mi ↔ m conversions (1 mi = 1609.344 m)
  if (from === "mi" && to === "m") return value * 1609.344;
  if (from === "m" && to === "mi") return value / 1609.344;

  throw new Error(`Unsupported distance conversion: ${from} to ${to}`);
}
