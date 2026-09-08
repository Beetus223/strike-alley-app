/** Shared, browser-safe helpers for the Bowler ID sign-in scheme. */

export const BOWLER_EMAIL_DOMAIN = "bowlers.vegrevillebowling.ca";

/** "vb-48291" / "48291" / " VB 48291 " all normalise to VB-48291. */
export function normalizeBowlerId(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits ? `VB-${digits}` : raw.trim().toUpperCase();
}

export function bowlerLoginEmail(bowlerId: string) {
  return `${normalizeBowlerId(bowlerId).toLowerCase()}@${BOWLER_EMAIL_DOMAIN}`;
}
