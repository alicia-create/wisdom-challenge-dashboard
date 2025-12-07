import { describe, expect, it } from "vitest";
import { isFacebookConfigured, getAdAccounts, getAllAudiences } from "./facebook";

describe("Facebook API Integration", () => {
  it("should be configured with valid credentials", () => {
    expect(isFacebookConfigured()).toBe(true);
  });

  it("should fetch ad accounts from Facebook API", async () => {
    const adAccounts = await getAdAccounts();
    
    expect(adAccounts).toBeDefined();
    expect(Array.isArray(adAccounts)).toBe(true);
    
    if (adAccounts.length > 0) {
      const firstAccount = adAccounts[0];
      expect(firstAccount).toHaveProperty("id");
      expect(firstAccount).toHaveProperty("name");
      expect(firstAccount).toHaveProperty("account_id");
      
      console.log(`[Facebook] Found ${adAccounts.length} ad accounts`);
      console.log(`[Facebook] First account:`, firstAccount);
    }
  }, 10000); // 10 second timeout

  it("should fetch audiences from Facebook API", async () => {
    console.log(`[Facebook] Starting to fetch audiences...`);
    const audiences = await getAllAudiences();
    
    expect(audiences).toBeDefined();
    expect(Array.isArray(audiences)).toBe(true);
    
    console.log(`[Facebook] Found ${audiences.length} audiences total`);
    
    if (audiences.length > 0) {
      const firstAudience = audiences[0];
      expect(firstAudience).toHaveProperty("id");
      expect(firstAudience).toHaveProperty("name");
      expect(firstAudience).toHaveProperty("ad_account_id");
      
      console.log(`[Facebook] First audience:`, {
        id: firstAudience.id,
        name: firstAudience.name,
        size_lower: firstAudience.approximate_count_lower_bound,
        size_upper: firstAudience.approximate_count_upper_bound,
        type: firstAudience.subtype,
      });
    } else {
      console.log(`[Facebook] No audiences found - this is OK if account has no custom audiences`);
    }
  }, 30000); // 30 second timeout
});
