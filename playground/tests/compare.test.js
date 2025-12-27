import { test } from "node:test";
import { strictEqual, throws } from "node:assert";
import { compare } from "../src/convert.js";

// Distance comparisons
test("compares km and mi - km is greater", () => {
  const result = compare(5, "km", 3, "mi");
  strictEqual(result.includes("5 km is greater than 3 mi"), true);
  strictEqual(result.includes("5 km = 3.11 mi"), true);
  strictEqual(result.includes("3 mi = 4.83 km"), true);
});

test("compares km and mi - mi is greater", () => {
  const result = compare(2, "km", 5, "mi");
  strictEqual(result.includes("5 mi is greater than 2 km"), true);
  strictEqual(result.includes("2 km = 1.24 mi"), true);
  strictEqual(result.includes("5 mi = 8.05 km"), true);
});

test("compares m and km", () => {
  const result = compare(5000, "m", 3, "km");
  strictEqual(result.includes("5000 m is greater than 3 km"), true);
  strictEqual(result.includes("5000 m = 5 km"), true);
  strictEqual(result.includes("3 km = 3000 m"), true);
});

test("compares mi and m", () => {
  const result = compare(1, "mi", 1000, "m");
  strictEqual(result.includes("1 mi is greater than 1000 m"), true);
  strictEqual(result.includes("1 mi = 1609.34 m"), true);
  strictEqual(result.includes("1000 m = 0.62 mi"), true);
});

// Temperature comparisons
test("compares C and F - equal values", () => {
  const result = compare(0, "C", 32, "F");
  strictEqual(result, "0 C is equal to 32 F");
});

test("compares C and F - C is greater", () => {
  const result = compare(100, "C", 32, "F");
  strictEqual(result.includes("100 C is greater than 32 F"), true);
  strictEqual(result.includes("100 C = 212 F"), true);
  strictEqual(result.includes("32 F = 0 C"), true);
});

test("compares C and K", () => {
  const result = compare(0, "C", 273.15, "K");
  strictEqual(result, "0 C is equal to 273.15 K");
});

test("compares F and K", () => {
  const result = compare(32, "F", 300, "K");
  strictEqual(result.includes("300 K is greater than 32 F"), true);
  strictEqual(result.includes("32 F = 273.15 K"), true);
  strictEqual(result.includes("300 K = 80.33 F"), true);
});

// Weight comparisons
test("compares g and oz", () => {
  const result = compare(100, "g", 3, "oz");
  strictEqual(result.includes("100 g is greater than 3 oz"), true);
  strictEqual(result.includes("100 g = 3.53 oz"), true);
  strictEqual(result.includes("3 oz = 85.05 g"), true);
});

test("compares lb and g", () => {
  const result = compare(1, "lb", 400, "g");
  strictEqual(result.includes("1 lb is greater than 400 g"), true);
  strictEqual(result.includes("1 lb = 453.59 g"), true);
  strictEqual(result.includes("400 g = 0.88 lb"), true);
});

test("compares oz and lb", () => {
  const result = compare(16, "oz", 1, "lb");
  strictEqual(result, "16 oz is equal to 1 lb");
});

// Equal values tests
test("compares equal distances", () => {
  const result = compare(1, "km", 1000, "m");
  strictEqual(result, "1 km is equal to 1000 m");
});

// Error cases
test("throws error when comparing different types", () => {
  throws(
    () => compare(5, "km", 10, "C"),
    /Cannot compare different types/
  );
});

test("throws error for unknown unit1", () => {
  throws(
    () => compare(5, "xyz", 10, "km"),
    /Unknown unit: xyz/
  );
});

test("throws error for unknown unit2", () => {
  throws(
    () => compare(5, "km", 10, "abc"),
    /Unknown unit: abc/
  );
});

test("throws error for invalid value1", () => {
  throws(
    () => compare("abc", "km", 10, "mi"),
    /Invalid input: value1 must be a valid number/
  );
});

test("throws error for invalid value2", () => {
  throws(
    () => compare(5, "km", "xyz", "mi"),
    /Invalid input: value2 must be a valid number/
  );
});

test("throws error for empty value1", () => {
  throws(
    () => compare("", "km", 10, "mi"),
    /Invalid input: value1 must be a valid number/
  );
});

test("throws error for null value2", () => {
  throws(
    () => compare(5, "km", null, "mi"),
    /Invalid input: value2 must be a valid number/
  );
});

