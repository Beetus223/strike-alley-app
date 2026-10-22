import { describe, expect, it } from "vitest";
import { passwordSetupFlow, staffSignInError } from "./staff-auth";

describe("staff password setup", () => {
  it("recognizes recovery links", () => {
    expect(passwordSetupFlow("#type=recovery&access_token=example")).toBe(true);
  });
  it("recognizes invitations without granting a role", () => {
    expect(passwordSetupFlow("#type=invite")).toBe(true);
  });
  it("does not allow ordinary sign-in sessions to reset a password", () => {
    expect(passwordSetupFlow("#type=signup")).toBe(false);
    expect(passwordSetupFlow("")).toBe(false);
  });
  it("distinguishes incorrect credentials from other failures", () => {
    expect(staffSignInError("invalid_credentials")).toBe("Wrong email or password.");
    expect(staffSignInError("unexpected_failure")).not.toBe("Wrong email or password.");
  });
});