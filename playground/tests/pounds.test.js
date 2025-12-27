import { test } from "node:test";
import { strictEqual } from "node:assert";
import { convert } from "../src/convert.js";

// Tests for pound weight conversions

// Basic lb ↔ g conversions
test("converts pounds to grams - 1lb", () => {
  const result = convert("weight", 1, "lb", "g");
  strictEqual(result, 453.59); // Rounded to 2 decimal places
});

test("converts pounds to grams - 2lb", () => {
  const result = convert("weight", 2, "lb", "g");
  strictEqual(result, 907.18); // Rounded to 2 decimal places
});

test("converts pounds to grams - 0.5lb", () => {
  const result = convert("weight", 0.5, "lb", "g");
  strictEqual(result, 226.8); // 226.796 → 226.80 → 226.8
});

test("converts grams to pounds - 453.592g", () => {
  const result = convert("weight", 453.592, "g", "lb");
  strictEqual(result, 1);
});

test("converts grams to pounds - 1000g", () => {
  const result = convert("weight", 1000, "g", "lb");
  strictEqual(result, 2.2); // 1000 / 453.592 = 2.204624... → 2.20 → 2.2
});

test("converts grams to pounds - 100g", () => {
  const result = convert("weight", 100, "g", "lb");
  strictEqual(result, 0.22); // 100 / 453.592 = 0.220462... → 0.22
});

// Basic lb ↔ oz conversions
test("converts pounds to ounces - 1lb", () => {
  const result = convert("weight", 1, "lb", "oz");
  strictEqual(result, 16);
});

test("converts pounds to ounces - 2lb", () => {
  const result = convert("weight", 2, "lb", "oz");
  strictEqual(result, 32);
});

test("converts pounds to ounces - 0.5lb", () => {
  const result = convert("weight", 0.5, "lb", "oz");
  strictEqual(result, 8);
});

test("converts ounces to pounds - 16oz", () => {
  const result = convert("weight", 16, "oz", "lb");
  strictEqual(result, 1);
});

test("converts ounces to pounds - 32oz", () => {
  const result = convert("weight", 32, "oz", "lb");
  strictEqual(result, 2);
});

test("converts ounces to pounds - 8oz", () => {
  const result = convert("weight", 8, "oz", "lb");
  strictEqual(result, 0.5);
});

// Round-trip conversions
test("round-trip lb → g → lb maintains value", () => {
  const original = 5;
  const toGrams = convert("weight", original, "lb", "g");
  const backToPounds = convert("weight", toGrams, "g", "lb");
  strictEqual(backToPounds, original);
});

test("round-trip lb → oz → lb maintains value", () => {
  const original = 3;
  const toOunces = convert("weight", original, "lb", "oz");
  const backToPounds = convert("weight", toOunces, "oz", "lb");
  strictEqual(backToPounds, original);
});

// Verify existing g ↔ oz still works
test("g to oz conversion still works", () => {
  const result = convert("weight", 100, "g", "oz");
  strictEqual(result, 3.53); // 100 / 28.3495 = 3.5273... → 3.53
});

test("oz to g conversion still works", () => {
  const result = convert("weight", 100, "oz", "g");
  strictEqual(result, 100 * 28.3495);
});

// Small weight tests
test("converts very small weight - 0.01lb to g", () => {
  const result = convert("weight", 0.01, "lb", "g");
  strictEqual(result, 4.54); // 4.53592 → 4.54
});

test("converts very small weight - 0.01lb to oz", () => {
  const result = convert("weight", 0.01, "lb", "oz");
  strictEqual(result, 0.16);
});

test("converts very small weight - 1g to lb", () => {
  const result = convert("weight", 1, "g", "lb");
  strictEqual(result, 0); // 1 / 453.592 = 0.00220... rounds to 0.00
});

// Large weight tests
test("converts large weight - 1000lb to g", () => {
  const result = convert("weight", 1000, "lb", "g");
  strictEqual(result, 453592);
});

test("converts large weight - 1000lb to oz", () => {
  const result = convert("weight", 1000, "lb", "oz");
  strictEqual(result, 16000);
});

test("converts large weight - 10000g to lb", () => {
  const result = convert("weight", 10000, "g", "lb");
  strictEqual(result, 22.05); // 10000 / 453.592 = 22.046244... → 22.05
});

// Common weights
test("human body weight 150lb to kg (via g)", () => {
  const grams = convert("weight", 150, "lb", "g");
  strictEqual(grams, 68038.8);
});

test("quarter pound (0.25lb) to oz", () => {
  const result = convert("weight", 0.25, "lb", "oz");
  strictEqual(result, 4);
});

test("quarter pound (0.25lb) to g", () => {
  const result = convert("weight", 0.25, "lb", "g");
  strictEqual(result, 113.4); // 113.398 → 113.40 → 113.4
});
