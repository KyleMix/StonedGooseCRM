// Tests for formatting/parsing helpers, including the timezone-stable date
// handling and the "blank means unknown" rules. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  money,
  formatDate,
  toDateInput,
  parseDate,
  parseNullableNumber,
  parseNumber,
  parseBool,
  str,
  isDueWithin,
} from "./utils";
import { oneOf, CONTACT_TYPES } from "./constants";

test("money formats USD and shows an em-dash for unknown (§5.3)", () => {
  assert.equal(money(1000), "$1,000");
  assert.equal(money(0), "$0");
  assert.equal(money(1234.5), "$1,234.50");
  assert.equal(money(null), "—");
  assert.equal(money(undefined), "—");
  assert.equal(money(NaN), "—");
  assert.equal(money(null, { blank: "n/a" }), "n/a");
});

test("formatDate renders the stored UTC day regardless of local zone", () => {
  // Stored as UTC midnight; must not slip a day for users west of UTC.
  assert.equal(formatDate("2026-07-13"), "Jul 13, 2026");
  assert.equal(formatDate(new Date("2026-12-25T00:00:00Z")), "Dec 25, 2026");
  assert.equal(formatDate(null), "—");
  assert.equal(formatDate("not a date"), "—");
});

test("toDateInput round-trips a date to YYYY-MM-DD", () => {
  assert.equal(toDateInput(new Date("2026-07-13T00:00:00Z")), "2026-07-13");
  assert.equal(toDateInput("2026-07-13"), "2026-07-13");
  assert.equal(toDateInput(null), "");
});

test("parseDate treats blank as null and rejects garbage", () => {
  assert.equal(parseDate(""), null);
  assert.equal(parseDate("   "), null);
  assert.equal(parseDate(null), null);
  assert.equal(parseDate("nope"), null);
  assert.equal(parseDate("2026-07-13")?.toISOString().slice(0, 10), "2026-07-13");
});

test("parseNullableNumber: blank is null, never 0 (§5.3); strips $ and commas", () => {
  assert.equal(parseNullableNumber(""), null);
  assert.equal(parseNullableNumber(null), null);
  assert.equal(parseNullableNumber("0"), 0);
  assert.equal(parseNullableNumber("1,234"), 1234);
  assert.equal(parseNullableNumber("$2,800.50"), 2800.5);
  assert.equal(parseNullableNumber("abc"), null);
});

test("parseNumber falls back when blank", () => {
  assert.equal(parseNumber("", 1), 1);
  assert.equal(parseNumber(null), 0);
  assert.equal(parseNumber("5"), 5);
});

test("parseBool accepts the usual truthy form values", () => {
  assert.equal(parseBool("on"), true);
  assert.equal(parseBool("true"), true);
  assert.equal(parseBool("1"), true);
  assert.equal(parseBool("off"), false);
  assert.equal(parseBool(null), false);
});

test("str trims to a value or null", () => {
  assert.equal(str("  hi  "), "hi");
  assert.equal(str("   "), null);
  assert.equal(str(""), null);
  assert.equal(str(null), null);
});

test("isDueWithin compares on the UTC calendar day", () => {
  const dayMs = 86_400_000;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterday = new Date(today.getTime() - dayMs);
  const tomorrow = new Date(today.getTime() + dayMs);
  const tenDays = new Date(today.getTime() + 10 * dayMs);

  assert.equal(isDueWithin(yesterday, 0), true); // overdue counts as within 0
  assert.equal(isDueWithin(today, 0), true);
  assert.equal(isDueWithin(tomorrow, 0), false);
  assert.equal(isDueWithin(tomorrow, 7), true);
  assert.equal(isDueWithin(tenDays, 7), false);
  assert.equal(isDueWithin(null, 7), false);
});

test("oneOf narrows to allowed enum values", () => {
  assert.equal(oneOf(CONTACT_TYPES, "Venue"), true);
  assert.equal(oneOf(CONTACT_TYPES, "Nope"), false);
  assert.equal(oneOf(CONTACT_TYPES, null), false);
  assert.equal(oneOf(CONTACT_TYPES, 5), false);
});
