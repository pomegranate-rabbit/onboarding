#!/usr/bin/env node
import { convert } from "../src/convert.js";

const [, , type, value, from, to] = process.argv;

if (!type || !value) {
  console.error("Usage: convert <type> <value> [from] [to]");
  process.exit(1);
}

const result = convert(type, Number(value), from, to);
console.log(result);
