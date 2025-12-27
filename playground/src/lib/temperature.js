export function convertTemperature(value, from, to) {
  // Hub-and-spoke pattern: convert through Celsius for better scalability
  // Step 1: Convert any input unit to Celsius
  let celsius;
  if (from === "C") {
    celsius = value;
  } else if (from === "F") {
    celsius = (value - 32) * (5 / 9);
  } else if (from === "K") {
    celsius = value - 273.15;
  } else {
    throw new Error(`Unsupported temperature unit: ${from}`);
  }

  // Step 2: Convert from Celsius to target unit
  if (to === "C") {
    return celsius;
  } else if (to === "F") {
    return celsius * (9 / 5) + 32;
  } else if (to === "K") {
    return celsius + 273.15;
  } else {
    throw new Error(`Unsupported temperature unit: ${to}`);
  }
}
