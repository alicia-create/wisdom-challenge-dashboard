import { describe, expect, it } from "vitest";
import { supabase } from "./supabase";

describe("Supabase Connection", () => {
  it("should connect to Supabase and fetch daily_kpis table schema", async () => {
    // Test connection by querying the daily_kpis table (should return empty array or data)
    const { data, error } = await supabase
      .from('daily_kpis')
      .select('*')
      .limit(1);

    // Connection should succeed (no error)
    expect(error).toBeNull();
    
    // Data should be an array (even if empty)
    expect(Array.isArray(data)).toBe(true);
  });

  it("should connect to Supabase and fetch Lead table schema", async () => {
    const { data, error } = await supabase
      .from('Lead')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("should connect to Supabase and fetch Order table schema", async () => {
    const { data, error } = await supabase
      .from('Order')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("should connect to Supabase and fetch ad_performance table schema", async () => {
    const { data, error } = await supabase
      .from('ad_performance')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
