import { test } from "node:test";
import { strictEqual, throws } from "node:assert";
import { convert } from "../src/convert.js";

// Tests for input validation
// These tests should FAIL initially and pass after implementing validation

test("rejects non-numeric value", () => {
  throws(
    () => convert("temperature", "abc", "C", "F"),
    /invalid.*number|numeric/i,
    "Should throw error for non-numeric input"
  );
});

test("rejects NaN value", () => {
  throws(
    () => convert("temperature", NaN, "C", "F"),
    /invalid.*number|numeric/i,
    "Should throw error for NaN"
  );
});

test("rejects unknown conversion type", () => {
  throws(
    () => convert("volume", 100, "L", "gal"),
    /unknown.*type/i,
    "Should throw error for unsupported conversion type"
  );
});

test("accepts valid numeric strings", () => {
  // Should convert string to number and process
  const result = convert("temperature", "100", "C", "F");
  strictEqual(result, 212);
});

test("accepts negative values", () => {
  const result = convert("temperature", -40, "C", "F");
  strictEqual(result, -40); // -40°C = -40°F (special case!)
});

test("accepts zero", () => {
  const result = convert("temperature", 0, "C", "F");
  strictEqual(result, 32);
});

// Additional edge case tests
test("rejects empty string", () => {
  throws(
    () => convert("temperature", "", "C", "F"),
    /invalid.*number|numeric/i,
    "Should throw error for empty string"
  );
});

test("rejects null value", () => {
  throws(
    () => convert("temperature", null, "C", "F"),
    /invalid.*number|numeric/i,
    "Should throw error for null"
  );
});

test("rejects undefined value", () => {
  throws(
    () => convert("temperature", undefined, "C", "F"),
    /invalid.*number|numeric/i,
    "Should throw error for undefined"
  );
});

test("accepts scientific notation", () => {
  const result = convert("temperature", "1e2", "C", "F");
  strictEqual(result, 212); // 100°C = 212°F
});

test("accepts Infinity", () => {
  const result = convert("temperature", Infinity, "C", "F");
  strictEqual(result, Infinity);
});

test("accepts negative Infinity", () => {
  const result = convert("temperature", -Infinity, "C", "F");
  strictEqual(result, -Infinity);
});

test("rejects strings with non-numeric characters", () => {
  throws(
    () => convert("temperature", "12.5xyz", "C", "F"),
    /invalid.*number|numeric/i,
    "Should throw error for string with trailing non-numeric characters"
  );
});

test("accepts numeric strings with whitespace", () => {
  const result = convert("temperature", "  100  ", "C", "F");
  strictEqual(result, 212); // String trimming handled by Number()
});
