import { describe, expect, it } from "vitest";
import { isKeapConfigured, getAllTags, getEmailEngagementMetrics } from "./keap";

describe("Keap API Integration", () => {
  it("should be configured with valid credentials", async () => {
    // Wait a bit for tokens to load from database
    await new Promise(resolve => setTimeout(resolve, 500));
    const configured = isKeapConfigured();
    expect(configured).toBe(true);
  });

  it("should fetch tags from Keap API", async () => {
    const tags = await getAllTags();
    
    // Should return an array
    expect(Array.isArray(tags)).toBe(true);
    
    // Should have tags (we know there are 42 tags from the CSVs)
    expect(tags.length).toBeGreaterThan(0);
    
    // Each tag should have required fields
    if (tags.length > 0) {
      const firstTag = tags[0];
      expect(firstTag).toHaveProperty('id');
      expect(firstTag).toHaveProperty('name');
      expect(typeof firstTag.id).toBe('number');
      expect(typeof firstTag.name).toBe('string');
    }
  });

  it("should fetch email engagement metrics", async () => {
    const metrics = await getEmailEngagementMetrics();
    
    // Should return object with expected fields
    expect(metrics).toHaveProperty('broadcastSubscribers');
    expect(metrics).toHaveProperty('reminderOptins');
    expect(metrics).toHaveProperty('replayOptins');
    expect(metrics).toHaveProperty('promoOptins');
    expect(metrics).toHaveProperty('emailClickers');
    
    // All values should be numbers
    expect(typeof metrics.broadcastSubscribers).toBe('number');
    expect(typeof metrics.reminderOptins).toBe('number');
    expect(typeof metrics.replayOptins).toBe('number');
    expect(typeof metrics.promoOptins).toBe('number');
    expect(typeof metrics.emailClickers).toBe('number');
    
    // Values should be non-negative
    expect(metrics.broadcastSubscribers).toBeGreaterThanOrEqual(0);
    expect(metrics.reminderOptins).toBeGreaterThanOrEqual(0);
    expect(metrics.replayOptins).toBeGreaterThanOrEqual(0);
    expect(metrics.promoOptins).toBeGreaterThanOrEqual(0);
    expect(metrics.emailClickers).toBeGreaterThanOrEqual(0);
  });
});
