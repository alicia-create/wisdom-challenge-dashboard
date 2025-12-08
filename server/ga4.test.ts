import { describe, expect, it } from "vitest";
import { testGA4Connection, isGA4Configured } from "./ga4";

describe("GA4 Integration", () => {
  it("should have GA4 credentials configured", () => {
    expect(isGA4Configured()).toBe(true);
  });

  it("should successfully connect to GA4 API", async () => {
    const isConnected = await testGA4Connection();
    expect(isConnected).toBe(true);
  }, 30000); // 30 second timeout for API call
});
