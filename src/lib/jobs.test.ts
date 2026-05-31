// Tests for the job booking rule (§5.4): a job may only be "Booked" when BOTH
// the contract is signed AND the deposit has cleared. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canBeBooked, validateStatusChange, bookingBlockers } from "./jobs";

test("canBeBooked requires both contract and deposit", () => {
  assert.equal(canBeBooked({ contractSigned: true, depositCleared: true }), true);
  assert.equal(canBeBooked({ contractSigned: true, depositCleared: false }), false);
  assert.equal(canBeBooked({ contractSigned: false, depositCleared: true }), false);
  assert.equal(canBeBooked({ contractSigned: false, depositCleared: false }), false);
});

test("validateStatusChange blocks Booked without both flags and names what's missing", () => {
  const both = validateStatusChange("Booked", { contractSigned: false, depositCleared: false });
  assert.equal(both.ok, false);
  assert.match(both.error!, /signed contract/);
  assert.match(both.error!, /cleared deposit/);

  const noDeposit = validateStatusChange("Booked", { contractSigned: true, depositCleared: false });
  assert.equal(noDeposit.ok, false);
  assert.match(noDeposit.error!, /cleared deposit/);
  assert.doesNotMatch(noDeposit.error!, /signed contract/);
});

test("validateStatusChange allows Booked when both flags are set", () => {
  const r = validateStatusChange("Booked", { contractSigned: true, depositCleared: true });
  assert.equal(r.ok, true);
  assert.equal(r.error, undefined);
});

test("validateStatusChange never blocks non-Booked statuses", () => {
  for (const status of ["Inquiry", "Proposal", "In Prep", "Completed", "Delivered", "Archived"]) {
    const r = validateStatusChange(status, { contractSigned: false, depositCleared: false });
    assert.equal(r.ok, true, `${status} should be allowed without booking flags`);
  }
});

test("bookingBlockers lists each unmet condition", () => {
  assert.deepEqual(bookingBlockers({ contractSigned: false, depositCleared: false }), [
    "Contract not signed",
    "Deposit not cleared",
  ]);
  assert.deepEqual(bookingBlockers({ contractSigned: true, depositCleared: false }), [
    "Deposit not cleared",
  ]);
  assert.deepEqual(bookingBlockers({ contractSigned: true, depositCleared: true }), []);
});
