import * as temperature from "./lib/temperature.js";
import * as distance from "./lib/distance.js";
import * as weight from "./lib/weight.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaults = JSON.parse(
  readFileSync(join(__dirname, "../config/defaults.json"), "utf-8")
);

// Valid units for each conversion type
const VALID_UNITS = {
  temperature: ["C", "F", "K"],
  distance: ["km", "mi", "m"],
  weight: ["g", "oz", "lb"],
};

export function convert(type, value, from, to) {
  // Validate numeric input
  // Reject empty strings and null explicitly (Number converts them to 0)
  if (value === "" || value === null) {
    throw new Error("Invalid input: value must be a valid number");
  }

  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    throw new Error("Invalid input: value must be a valid number");
  }

  // Validate conversion type
  if (!VALID_UNITS[type]) {
    throw new Error("Unknown type " + type);
  }

  // Get default units or validate provided units
  let fromUnit = from;
  let toUnit = to;

  switch (type) {
    case "temperature":
      fromUnit = from || defaults.temperature.defaultFrom;
      toUnit = to || defaults.temperature.defaultTo;
      break;
    case "distance":
    case "weight":
      if (!from || !to) {
        throw new Error(
          `Missing units: ${type} conversion requires both 'from' and 'to' units`
        );
      }
      fromUnit = from;
      toUnit = to;
      break;
  }

  // Validate units are supported for this conversion type
  if (!VALID_UNITS[type].includes(fromUnit)) {
    throw new Error(
      `Unsupported unit '${fromUnit}' for ${type}. Valid units: ${VALID_UNITS[
        type
      ].join(", ")}`
    );
  }
  if (!VALID_UNITS[type].includes(toUnit)) {
    throw new Error(
      `Unsupported unit '${toUnit}' for ${type}. Valid units: ${VALID_UNITS[
        type
      ].join(", ")}`
    );
  }

  // Perform conversion
  let result;
  switch (type) {
    case "temperature":
      result = temperature.convertTemperature(numericValue, fromUnit, toUnit);
      break;
    case "distance":
      result = distance.convertDistance(numericValue, fromUnit, toUnit);
      break;
    case "weight":
      result = weight.convertWeight(numericValue, fromUnit, toUnit);
      break;
  }

  // Apply precision rounding
  return Number(result.toFixed(defaults.precision));
}

// Helper function to infer conversion type from a unit
function inferType(unit) {
  for (const [type, units] of Object.entries(VALID_UNITS)) {
    if (units.includes(unit)) {
      return type;
    }
  }
  return null;
}

export function compare(value1, unit1, value2, unit2) {
  // Validate numeric inputs
  if (value1 === "" || value1 === null) {
    throw new Error("Invalid input: value1 must be a valid number");
  }
  if (value2 === "" || value2 === null) {
    throw new Error("Invalid input: value2 must be a valid number");
  }

  const numericValue1 = Number(value1);
  const numericValue2 = Number(value2);

  if (isNaN(numericValue1)) {
    throw new Error("Invalid input: value1 must be a valid number");
  }
  if (isNaN(numericValue2)) {
    throw new Error("Invalid input: value2 must be a valid number");
  }

  // Infer types from units
  const type1 = inferType(unit1);
  const type2 = inferType(unit2);

  if (!type1) {
    throw new Error(`Unknown unit: ${unit1}`);
  }
  if (!type2) {
    throw new Error(`Unknown unit: ${unit2}`);
  }

  // Validate both units are of the same type
  if (type1 !== type2) {
    throw new Error(
      `Cannot compare different types: ${unit1} (${type1}) and ${unit2} (${type2})`
    );
  }

  const type = type1;

  // Convert value1 to unit2 and value2 to unit1 for comparison
  let value1InUnit2, value2InUnit1;

  switch (type) {
    case "temperature":
      value1InUnit2 = temperature.convertTemperature(
        numericValue1,
        unit1,
        unit2
      );
      value2InUnit1 = temperature.convertTemperature(
        numericValue2,
        unit2,
        unit1
      );
      break;
    case "distance":
      value1InUnit2 = distance.convertDistance(numericValue1, unit1, unit2);
      value2InUnit1 = distance.convertDistance(numericValue2, unit2, unit1);
      break;
    case "weight":
      value1InUnit2 = weight.convertWeight(numericValue1, unit1, unit2);
      value2InUnit1 = weight.convertWeight(numericValue2, unit2, unit1);
      break;
  }

  // Apply precision rounding
  value1InUnit2 = Number(value1InUnit2.toFixed(defaults.precision));
  value2InUnit1 = Number(value2InUnit1.toFixed(defaults.precision));

  // Check if values are equal (comparing value1 converted to unit2 with value2)
  const tolerance = Math.pow(10, -defaults.precision);
  const areEqual = Math.abs(value1InUnit2 - numericValue2) < tolerance;

  if (areEqual) {
    return `${numericValue1} ${unit1} is equal to ${numericValue2} ${unit2}`;
  }

  // Determine which is greater
  let result = "";
  if (numericValue1 > value2InUnit1) {
    result += `${numericValue1} ${unit1} is greater than ${numericValue2} ${unit2}\n`;
  } else {
    result += `${numericValue2} ${unit2} is greater than ${numericValue1} ${unit1}\n`;
  }

  // Add both conversions
  result += `${numericValue1} ${unit1} = ${value1InUnit2} ${unit2}\n`;
  result += `${numericValue2} ${unit2} = ${value2InUnit1} ${unit1}`;

  return result;
}
