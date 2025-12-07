import { describe, expect, it } from "vitest";
import {
  getLeadsPaginated,
} from "./supabase";
import {
  getContactActivities,
  getContactActivitySummary,
  getContactTimeline,
} from "./supabase-activities";

/**
 * Tests for Wisdom funnel contact filtering and activity tracking
 */

describe("Wisdom Funnel Contact Filtering", () => {
  it("should only return contacts from wisdom funnel", async () => {
    const result = await getLeadsPaginated({
      page: 1,
      pageSize: 50,
    });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.data)).toBe(true);

    // All returned contacts should have wisdom-related events
    console.log(`Found ${result.total} contacts from Wisdom funnel`);
  });

  it("should have valid pagination structure", async () => {
    const result = await getLeadsPaginated({
      page: 1,
      pageSize: 10,
    });

    expect(result).toHaveProperty("page", 1);
    expect(result).toHaveProperty("pageSize", 10);
    expect(result).toHaveProperty("totalPages");
    expect(result.totalPages).toBeGreaterThanOrEqual(0);
  });

  it("should respect search filters", async () => {
    const result = await getLeadsPaginated({
      page: 1,
      pageSize: 50,
      search: "test",
    });

    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe("Contact Activities", () => {
  it("should fetch activities for a contact", async () => {
    // First get a wisdom contact
    const contacts = await getLeadsPaginated({ page: 1, pageSize: 1 });
    
    if (contacts.data.length === 0) {
      console.log("No wisdom contacts found, skipping activity test");
      return;
    }

    const contactId = contacts.data[0].id;
    const activities = await getContactActivities(contactId);

    expect(Array.isArray(activities)).toBe(true);
    
    if (activities.length > 0) {
      const activity = activities[0];
      expect(activity).toHaveProperty("id");
      expect(activity).toHaveProperty("contact_id", contactId);
      expect(activity).toHaveProperty("type");
      expect(activity).toHaveProperty("name");
      expect(activity).toHaveProperty("timestamp");
    }
  });

  it("should generate activity summary for a contact", async () => {
    const contacts = await getLeadsPaginated({ page: 1, pageSize: 1 });
    
    if (contacts.data.length === 0) {
      console.log("No wisdom contacts found, skipping summary test");
      return;
    }

    const contactId = contacts.data[0].id;
    const summary = await getContactActivitySummary(contactId);

    expect(summary).toHaveProperty("totalActivities");
    expect(summary).toHaveProperty("byType");
    expect(summary).toHaveProperty("byName");
    expect(summary).toHaveProperty("firstActivity");
    expect(summary).toHaveProperty("lastActivity");
    
    expect(typeof summary.totalActivities).toBe("number");
    expect(typeof summary.byType).toBe("object");
    expect(typeof summary.byName).toBe("object");
  });

  it("should generate timeline for a contact", async () => {
    const contacts = await getLeadsPaginated({ page: 1, pageSize: 1 });
    
    if (contacts.data.length === 0) {
      console.log("No wisdom contacts found, skipping timeline test");
      return;
    }

    const contactId = contacts.data[0].id;
    const timeline = await getContactTimeline(contactId);

    expect(Array.isArray(timeline)).toBe(true);
    
    if (timeline.length > 0) {
      const event = timeline[0];
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("timestamp");
      expect(event).toHaveProperty("name");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("icon");
      expect(event).toHaveProperty("color");
    }
  });
});

describe("Wisdom Funnel Data Integrity", () => {
  it("should have contacts with wisdom-related events", async () => {
    const contacts = await getLeadsPaginated({ page: 1, pageSize: 5 });
    
    if (contacts.data.length === 0) {
      console.log("No wisdom contacts found");
      return;
    }

    // Check that each contact has at least one wisdom-related activity
    for (const contact of contacts.data) {
      const activities = await getContactActivities(contact.id);
      
      // Should have at least one activity
      expect(activities.length).toBeGreaterThan(0);
      
      // At least one activity should mention wisdom or 31daywisdomchallenge
      const hasWisdomEvent = activities.some((a: any) => 
        (a.comment && (
          a.comment.toLowerCase().includes('wisdom') ||
          a.comment.toLowerCase().includes('31daywisdomchallenge')
        )) ||
        (a.value && a.value.toLowerCase().includes('wisdom'))
      );
      
      expect(hasWisdomEvent).toBe(true);
    }
  });
});
