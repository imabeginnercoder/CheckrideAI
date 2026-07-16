import test from "node:test";
import assert from "node:assert/strict";
import { daysUntilDate } from "../lib/profile.ts";

test("daysUntilDate returns a stable calendar-day countdown", () => {
  const today = new Date("2026-07-16T12:00:00");
  assert.equal(daysUntilDate("2026-07-26", today), 10);
  assert.equal(daysUntilDate("2026-07-15", today), -1);
});

test("daysUntilDate handles missing and invalid values", () => {
  assert.equal(daysUntilDate(null), null);
  assert.equal(daysUntilDate("not-a-date"), null);
});
