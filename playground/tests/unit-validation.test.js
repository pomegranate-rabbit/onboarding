import { test } from "node:test";
import { strictEqual, throws } from "node:assert";
import { convert } from "../src/convert.js";

// Tests for unit validation
// These tests ensure invalid units are rejected for each conversion type

// Temperature unit validation tests
test("rejects invalid temperature 'from' unit", () => {
  throws(
    () => convert("temperature", 100, "xyz", "F"),
    /unsupported unit.*xyz.*temperature/i,
    "Should throw error for invalid 'from' unit"
  );
});

test("rejects invalid temperature 'to' unit", () => {
  throws(
    () => convert("temperature", 100, "C", "xyz"),
    /unsupported unit.*xyz.*temperature/i,
    "Should throw error for invalid 'to' unit"
  );
});

test("accepts valid temperature units C and F", () => {
  const result1 = convert("temperature", 0, "C", "F");
  strictEqual(result1, 32);

  const result2 = convert("temperature", 32, "F", "C");
  strictEqual(result2, 0);
});

test("temperature conversion works with default units", () => {
  // Should use defaults from config (C to F)
  const result = convert("temperature", 0);
  strictEqual(result, 32);
});

// Distance unit validation tests
test("rejects invalid distance 'from' unit", () => {
  throws(
    () => convert("distance", 100, "xyz", "mi"),
    /unsupported unit.*xyz.*distance/i,
    "Should throw error for invalid 'from' unit"
  );
});

test("rejects invalid distance 'to' unit", () => {
  throws(
    () => convert("distance", 100, "km", "xyz"),
    /unsupported unit.*xyz.*distance/i,
    "Should throw error for invalid 'to' unit"
  );
});

test("rejects missing distance units", () => {
  throws(
    () => convert("distance", 100),
    /missing units.*distance/i,
    "Should throw error when units are missing"
  );
});

test("accepts valid distance units km and mi", () => {
  const result1 = convert("distance", 5, "km", "mi");
  strictEqual(result1, 3.11); // 5 * 0.621371 = 3.106855 → 3.11

  const result2 = convert("distance", 5, "mi", "km");
  strictEqual(result2, 8.05); // 5 / 0.621371 = 8.046722... → 8.05
});

// Weight unit validation tests
test("rejects invalid weight 'from' unit", () => {
  throws(
    () => convert("weight", 100, "xyz", "oz"),
    /unsupported unit.*xyz.*weight/i,
    "Should throw error for invalid 'from' unit"
  );
});

test("rejects invalid weight 'to' unit", () => {
  throws(
    () => convert("weight", 100, "g", "xyz"),
    /unsupported unit.*xyz.*weight/i,
    "Should throw error for invalid 'to' unit"
  );
});

test("rejects missing weight units", () => {
  throws(
    () => convert("weight", 100),
    /missing units.*weight/i,
    "Should throw error when units are missing"
  );
});

test("accepts valid weight units g and oz", () => {
  const result1 = convert("weight", 100, "g", "oz");
  strictEqual(result1, 3.53); // 100 / 28.3495 = 3.5273... → 3.53

  const result2 = convert("weight", 100, "oz", "g");
  strictEqual(result2, 2834.95); // 100 * 28.3495 = 2834.95
});

// Edge cases for unit validation
test("rejects case-sensitive invalid units", () => {
  // Units are case-sensitive, so lowercase "c" should be rejected
  throws(
    () => convert("temperature", 100, "c", "F"),
    /unsupported unit.*c.*temperature/i,
    "Should reject lowercase 'c' (case-sensitive)"
  );

  throws(
    () => convert("temperature", 100, "C", "f"),
    /unsupported unit.*f.*temperature/i,
    "Should reject lowercase 'f' (case-sensitive)"
  );
});

test("rejects similar but invalid unit names", () => {
  throws(
    () => convert("distance", 100, "kilometer", "mi"),
    /unsupported unit.*kilometer.*distance/i,
    "Should reject full name 'kilometer' instead of 'km'"
  );

  throws(
    () => convert("weight", 100, "gram", "oz"),
    /unsupported unit.*gram.*weight/i,
    "Should reject full name 'gram' instead of 'g'"
  );
});

test("rejects units from wrong conversion type", () => {
  throws(
    () => convert("temperature", 100, "km", "mi"),
    /unsupported unit.*km.*temperature/i,
    "Should reject distance units for temperature conversion"
  );

  throws(
    () => convert("distance", 100, "C", "F"),
    /unsupported unit.*C.*distance/i,
    "Should reject temperature units for distance conversion"
  );

  throws(
    () => convert("weight", 100, "F", "C"),
    /unsupported unit.*F.*weight/i,
    "Should reject temperature units for weight conversion"
  );
});

// Tests for newly added units: K, m, lb

test("accepts Kelvin (K) for temperature conversions", () => {
  const result1 = convert("temperature", 273.15, "K", "C");
  strictEqual(result1, 0);

  const result2 = convert("temperature", 0, "C", "K");
  strictEqual(result2, 273.15);

  const result3 = convert("temperature", 273.15, "K", "F");
  strictEqual(result3, 32);
});

test("accepts meters (m) for distance conversions", () => {
  const result1 = convert("distance", 1000, "m", "km");
  strictEqual(result1, 1);

  const result2 = convert("distance", 1, "km", "m");
  strictEqual(result2, 1000);

  const result3 = convert("distance", 1609.344, "m", "mi");
  strictEqual(result3, 1);
});

test("accepts pounds (lb) for weight conversions", () => {
  const result1 = convert("weight", 453.592, "g", "lb");
  strictEqual(result1, 1);

  const result2 = convert("weight", 1, "lb", "g");
  strictEqual(result2, 453.59); // Rounded to 2 decimal places

  const result3 = convert("weight", 16, "oz", "lb");
  strictEqual(result3, 1);
});

test("rejects invalid units even with new units added", () => {
  throws(
    () => convert("temperature", 100, "xyz", "K"),
    /unsupported unit.*xyz.*temperature/i,
    "Should still reject invalid temperature units"
  );

  throws(
    () => convert("distance", 100, "xyz", "m"),
    /unsupported unit.*xyz.*distance/i,
    "Should still reject invalid distance units"
  );

  throws(
    () => convert("weight", 100, "xyz", "lb"),
    /unsupported unit.*xyz.*weight/i,
    "Should still reject invalid weight units"
  );
});

test("rejects new units in wrong conversion types", () => {
  throws(
    () => convert("distance", 100, "K", "m"),
    /unsupported unit.*K.*distance/i,
    "Should reject Kelvin for distance conversion"
  );

  throws(
    () => convert("temperature", 100, "m", "K"),
    /unsupported unit.*m.*temperature/i,
    "Should reject meters for temperature conversion"
  );

  throws(
    () => convert("temperature", 100, "lb", "K"),
    /unsupported unit.*lb.*temperature/i,
    "Should reject pounds for temperature conversion"
  );
});
