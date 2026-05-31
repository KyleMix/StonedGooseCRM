// Standard shape returned by every server action, so the client forms can
// show validation errors (e.g. the booking-rule rejection) inline.
export type ActionResult = { ok: true } | { ok: false; error: string };

export const ok: ActionResult = { ok: true };

// `error` is optional because the validation helpers return a union whose error
// branch TypeScript widens to `string | undefined`; we coerce to a safe default.
export function fail(error?: string): ActionResult {
  return { ok: false, error: error ?? "Invalid input." };
}
