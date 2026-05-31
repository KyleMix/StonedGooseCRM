// Job status logic — the booking rule (§5.4) lives here.
//
// A job may only be "Booked" when BOTH the contract is signed AND the deposit
// has cleared. Any attempt to set status = "Booked" without both flags is
// rejected. This is enforced server-side in the job actions, using these
// helpers, so the rule can't be bypassed by the UI.

export interface BookingFlags {
  contractSigned: boolean;
  depositCleared: boolean;
}

export function canBeBooked(flags: BookingFlags): boolean {
  return flags.contractSigned && flags.depositCleared;
}

export interface BookingValidation {
  ok: boolean;
  error?: string;
}

// Validate a requested status against the booking flags.
export function validateStatusChange(
  requestedStatus: string,
  flags: BookingFlags,
): BookingValidation {
  if (requestedStatus === "Booked" && !canBeBooked(flags)) {
    const missing: string[] = [];
    if (!flags.contractSigned) missing.push("a signed contract");
    if (!flags.depositCleared) missing.push("a cleared deposit");
    return {
      ok: false,
      error: `A job can't be marked "Booked" without ${missing.join(" and ")}.`,
    };
  }
  return { ok: true };
}

// What's blocking a job from being booked? (for UI hints)
export function bookingBlockers(flags: BookingFlags): string[] {
  const blockers: string[] = [];
  if (!flags.contractSigned) blockers.push("Contract not signed");
  if (!flags.depositCleared) blockers.push("Deposit not cleared");
  return blockers;
}
