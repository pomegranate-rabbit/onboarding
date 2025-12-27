import { test } from "node:test";
import { strictEqual } from "node:assert";
import { convert } from "../src/convert.js";

// Tests for meter distance conversions

// Basic m ↔ km conversions
test("converts meters to kilometers - 1000m", () => {
  const result = convert("distance", 1000, "m", "km");
  strictEqual(result, 1);
});

test("converts meters to kilometers - 500m", () => {
  const result = convert("distance", 500, "m", "km");
  strictEqual(result, 0.5);
});

test("converts meters to kilometers - 1m", () => {
  const result = convert("distance", 1, "m", "km");
  strictEqual(result, 0); // Rounds to 0.00
});

test("converts kilometers to meters - 1km", () => {
  const result = convert("distance", 1, "km", "m");
  strictEqual(result, 1000);
});

test("converts kilometers to meters - 5km", () => {
  const result = convert("distance", 5, "km", "m");
  strictEqual(result, 5000);
});

test("converts kilometers to meters - 0.5km", () => {
  const result = convert("distance", 0.5, "km", "m");
  strictEqual(result, 500);
});

// Basic m ↔ mi conversions
test("converts meters to miles - 1609.344m", () => {
  const result = convert("distance", 1609.344, "m", "mi");
  strictEqual(result, 1);
});

test("converts meters to miles - 1000m", () => {
  const result = convert("distance", 1000, "m", "mi");
  strictEqual(result, 0.62); // 1000 / 1609.344 = 0.6213... → 0.62
});

test("converts meters to miles - 100m", () => {
  const result = convert("distance", 100, "m", "mi");
  strictEqual(result, 0.06); // 100 / 1609.344 = 0.0621... → 0.06
});

test("converts miles to meters - 1mi", () => {
  const result = convert("distance", 1, "mi", "m");
  strictEqual(result, 1609.34); // Rounded to 2 decimal places
});

test("converts miles to meters - 5mi", () => {
  const result = convert("distance", 5, "mi", "m");
  strictEqual(result, 8046.72);
});

test("converts miles to meters - 0.5mi", () => {
  const result = convert("distance", 0.5, "mi", "m");
  strictEqual(result, 804.67); // Rounded to 2 decimal places
});

// Round-trip conversions
test("round-trip m → km → m maintains value", () => {
  const original = 2500;
  const toKm = convert("distance", original, "m", "km");
  const backToMeters = convert("distance", toKm, "km", "m");
  strictEqual(backToMeters, original);
});

test("round-trip m → mi → m maintains value", () => {
  const original = 1609.344;
  const toMiles = convert("distance", original, "m", "mi");
  const backToMeters = convert("distance", toMiles, "mi", "m");
  strictEqual(backToMeters, 1609.34); // Precision loss due to rounding
});

// Verify existing km ↔ mi still works through meters
test("km to mi conversion still works", () => {
  const result = convert("distance", 5, "km", "mi");
  strictEqual(result, 3.11); // 5 * 0.621371 = 3.106855 → 3.11
});

test("mi to km conversion still works", () => {
  const result = convert("distance", 5, "mi", "km");
  strictEqual(result, 8.05); // 5 / 0.621371 = 8.046722... → 8.05
});

// Small distance tests
test("converts very small distance - 0.001m", () => {
  const result = convert("distance", 0.001, "m", "km");
  strictEqual(result, 0); // 0.000001 rounds to 0.00
});

test("converts very small distance - 1m to mi", () => {
  const result = convert("distance", 1, "m", "mi");
  strictEqual(result, 0); // 1 / 1609.344 = 0.000621... rounds to 0.00
});

// Large distance tests
test("converts large distance - 1000000m to km", () => {
  const result = convert("distance", 1000000, "m", "km");
  strictEqual(result, 1000);
});

test("converts large distance - 1000000m to mi", () => {
  const result = convert("distance", 1000000, "m", "mi");
  strictEqual(result, 621.37); // 1000000 / 1609.344 = 621.371... → 621.37
});

// Common distances
test("marathon distance 42195m to km", () => {
  const result = convert("distance", 42195, "m", "km");
  strictEqual(result, 42.2); // 42.195 → 42.20 → 42.2
});

test("marathon distance 42195m to mi", () => {
  const result = convert("distance", 42195, "m", "mi");
  strictEqual(result, 26.22); // 42195 / 1609.344 = 26.218757... → 26.22
});
