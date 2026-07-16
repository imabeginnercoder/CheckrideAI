import test from "node:test";
import assert from "node:assert/strict";
import { daysUntilDate, mergeProfileWithUserMetadata, profileFromUserMetadata } from "../lib/profile.ts";

test("daysUntilDate returns a stable calendar-day countdown", () => {
  const today = new Date("2026-07-16T12:00:00");
  assert.equal(daysUntilDate("2026-07-26", today), 10);
  assert.equal(daysUntilDate("2026-07-15", today), -1);
});

test("daysUntilDate handles missing and invalid values", () => {
  assert.equal(daysUntilDate(null), null);
  assert.equal(daysUntilDate("not-a-date"), null);
});

test("profileFromUserMetadata validates and normalizes signup fields", () => {
  assert.deepEqual(profileFromUserMetadata({
    id: "pilot-1",
    user_metadata: {
      display_name: "  Amelia  ",
      preferred_aircraft: "Piper Archer III (PA-28-181)",
      checkride_date: "2026-09-12",
    },
  }), {
    id: "pilot-1",
    display_name: "Amelia",
    preferred_aircraft: "Piper Archer III (PA-28-181)",
    checkride_date: "2026-09-12",
  });
});

test("mergeProfileWithUserMetadata repairs an uninitialized profile", () => {
  const repaired = mergeProfileWithUserMetadata({
    id: "pilot-1",
    display_name: null,
    checkride_date: null,
    preferred_aircraft: "Cessna 172S",
  }, {
    id: "pilot-1",
    user_metadata: {
      display_name: "Amelia",
      preferred_aircraft: "Cessna 152",
      checkride_date: "2026-09-12",
    },
  });

  assert.equal(repaired.display_name, "Amelia");
  assert.equal(repaired.preferred_aircraft, "Cessna 152");
  assert.equal(repaired.checkride_date, "2026-09-12");
  assert.equal(repaired.onboarding_completed, false);
});
