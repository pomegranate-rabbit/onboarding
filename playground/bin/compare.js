#!/usr/bin/env node
import { compare } from "../src/convert.js";

const [, , value1, unit1, value2, unit2] = process.argv;

if (!value1 || !unit1 || !value2 || !unit2) {
  console.error("Usage: compare <value1> <unit1> <value2> <unit2>");
  process.exit(1);
}

const result = compare(Number(value1), unit1, Number(value2), unit2);
console.log(result);
