/** Only provider-issued recovery/invitation flows may set a password here. */
export function passwordSetupFlow(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" || params.get("type") === "invite";
}

export function staffSignInError(code?: string): string {
  if (code === "invalid_credentials") return "Wrong email or password.";
  if (code === "email_not_confirmed") return "Please confirm your email before signing in.";
  if (code === "over_request_rate_limit") return "Too many attempts. Please wait and try again.";
  return "Sign-in failed. Please try again shortly.";
}