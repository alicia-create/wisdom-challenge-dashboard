import { describe, expect, it } from "vitest";
import { getContactsWithAnyTags } from "./keap";

describe("Keap Wisdom Filtering", () => {
  it("should fetch all contacts for Wisdom tags", async () => {
    // Tokens will be loaded automatically by keap.ts

    const WISDOM_TAGS = [
      14705, // Historical - 31DWC - 2601 - Optin (15 contacts)
      14703, // Trigger - 31DWC - 2601 - Optin (0 contacts)
      14739, // Status - 31DWC - 2601 - NTN General Opt In (3 contacts)
      14741, // Status - 31DWC - 2601 - NTN VIP Opt In (0 contacts)
    ];

    const wisdomContacts = await getContactsWithAnyTags(WISDOM_TAGS);

    console.log(`Total Wisdom contacts: ${wisdomContacts.size}`);
    console.log(`Contact IDs:`, Array.from(wisdomContacts));

    // Should have at least 15 contacts (from tag 14705) + 3 (from tag 14739) = 18
    // But might be less if there's overlap
    expect(wisdomContacts.size).toBeGreaterThanOrEqual(15);
  }, 60000); // 60 second timeout for API calls
});
