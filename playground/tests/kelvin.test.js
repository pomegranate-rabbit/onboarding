import { test } from "node:test";
import { strictEqual } from "node:assert";
import { convert } from "../src/convert.js";

// Tests for Kelvin temperature conversions

// Basic K ↔ C conversions
test("converts Kelvin to Celsius - absolute zero", () => {
  const result = convert("temperature", 0, "K", "C");
  strictEqual(result, -273.15);
});

test("converts Kelvin to Celsius - water freezing point", () => {
  const result = convert("temperature", 273.15, "K", "C");
  strictEqual(result, 0);
});

test("converts Kelvin to Celsius - water boiling point", () => {
  const result = convert("temperature", 373.15, "K", "C");
  strictEqual(result, 100);
});

test("converts Celsius to Kelvin - absolute zero", () => {
  const result = convert("temperature", -273.15, "C", "K");
  strictEqual(result, 0);
});

test("converts Celsius to Kelvin - water freezing point", () => {
  const result = convert("temperature", 0, "C", "K");
  strictEqual(result, 273.15);
});

test("converts Celsius to Kelvin - water boiling point", () => {
  const result = convert("temperature", 100, "C", "K");
  strictEqual(result, 373.15);
});

// Basic K ↔ F conversions
test("converts Kelvin to Fahrenheit - absolute zero", () => {
  const result = convert("temperature", 0, "K", "F");
  strictEqual(result, -459.67); // Rounded to 2 decimal places
});

test("converts Kelvin to Fahrenheit - water freezing point", () => {
  const result = convert("temperature", 273.15, "K", "F");
  strictEqual(result, 32);
});

test("converts Kelvin to Fahrenheit - water boiling point", () => {
  const result = convert("temperature", 373.15, "K", "F");
  strictEqual(result, 212);
});

test("converts Fahrenheit to Kelvin - absolute zero", () => {
  const result = convert("temperature", -459.67, "F", "K");
  // Due to floating point precision, result should be very close to 0
  // -459.67°F is approximately absolute zero
  const tolerance = 0.01; // Within 0.01 K
  const expected = 0;
  const diff = Math.abs(result - expected);
  strictEqual(diff < tolerance, true, `Expected close to ${expected}, got ${result}`);
});

test("converts Fahrenheit to Kelvin - water freezing point", () => {
  const result = convert("temperature", 32, "F", "K");
  strictEqual(result, 273.15);
});

test("converts Fahrenheit to Kelvin - water boiling point", () => {
  const result = convert("temperature", 212, "F", "K");
  strictEqual(result, 373.15);
});

// Round-trip conversions
test("round-trip K → C → K maintains value", () => {
  const original = 300;
  const toCelsius = convert("temperature", original, "K", "C");
  const backToKelvin = convert("temperature", toCelsius, "C", "K");
  strictEqual(backToKelvin, original);
});

test("round-trip K → F → K maintains value", () => {
  const original = 300;
  const toFahrenheit = convert("temperature", original, "K", "F");
  const backToKelvin = convert("temperature", toFahrenheit, "F", "K");
  strictEqual(backToKelvin, original);
});

// High temperature tests
test("converts high Kelvin temperature (1000 K)", () => {
  const result = convert("temperature", 1000, "K", "C");
  strictEqual(result, 726.85);
});

test("converts very high Kelvin temperature (5000 K)", () => {
  const result = convert("temperature", 5000, "K", "F");
  // Account for floating point precision
  const expected = 8540.33;
  const tolerance = 0.01;
  const diff = Math.abs(result - expected);
  strictEqual(diff < tolerance, true, `Expected close to ${expected}, got ${result}`);
});

// Edge case: room temperature
test("converts room temperature 293.15 K to Celsius", () => {
  const result = convert("temperature", 293.15, "K", "C");
  strictEqual(result, 20);
});

test("converts room temperature 293.15 K to Fahrenheit", () => {
  const result = convert("temperature", 293.15, "K", "F");
  strictEqual(result, 68);
});
