import { describe, expect, it } from "vitest";
import { getWorkflowErrors, getWorkflowErrorStats } from "./workflow-errors";

describe("Workflow Errors", () => {
  describe("getWorkflowErrors", () => {
    it("should fetch paginated workflow errors without errors", async () => {
      const result = await getWorkflowErrors({
        page: 1,
        pageSize: 10,
      });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return valid workflow error data structure", async () => {
      const result = await getWorkflowErrors({
        page: 1,
        pageSize: 1,
      });

      if (result.data.length > 0) {
        const error = result.data[0];
        expect(error).toHaveProperty("id");
        expect(error).toHaveProperty("created_at");
        expect(error).toHaveProperty("workflow_name");
        expect(error).toHaveProperty("error_node");
        expect(error).toHaveProperty("error_message");
        expect(error).toHaveProperty("error_timestamp");
        expect(error).toHaveProperty("execution_id");
      }
    });

    it("should filter by search term", async () => {
      const result = await getWorkflowErrors({
        page: 1,
        pageSize: 10,
        search: "foreign key",
      });

      expect(result).toHaveProperty("data");
      expect(Array.isArray(result.data)).toBe(true);
      
      // If there are results, they should contain the search term
      if (result.data.length > 0) {
        const hasSearchTerm = result.data.some((error: any) =>
          error.error_message?.toLowerCase().includes("foreign key") ||
          error.workflow_name?.toLowerCase().includes("foreign key") ||
          error.error_node?.toLowerCase().includes("foreign key")
        );
        expect(hasSearchTerm).toBe(true);
      }
    });

    it("should filter by workflow name", async () => {
      const result = await getWorkflowErrors({
        page: 1,
        pageSize: 10,
        workflowName: "Analytics",
      });

      expect(result).toHaveProperty("data");
      
      // If there are results, they should match the workflow filter
      if (result.data.length > 0) {
        result.data.forEach((error: any) => {
          expect(error.workflow_name?.toLowerCase()).toContain("analytics");
        });
      }
    });
  });

  describe("getWorkflowErrorStats", () => {
    it("should return error statistics", async () => {
      const stats = await getWorkflowErrorStats();

      expect(stats).toHaveProperty("totalErrors");
      expect(stats).toHaveProperty("last24Hours");
      expect(stats).toHaveProperty("topWorkflows");

      expect(typeof stats.totalErrors).toBe("number");
      expect(typeof stats.last24Hours).toBe("number");
      expect(Array.isArray(stats.topWorkflows)).toBe(true);

      expect(stats.totalErrors).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours).toBeLessThanOrEqual(stats.totalErrors);
    });

    it("should return top workflows with error counts", async () => {
      const stats = await getWorkflowErrorStats();

      stats.topWorkflows.forEach((workflow: any) => {
        expect(workflow).toHaveProperty("workflow_name");
        expect(workflow).toHaveProperty("error_count");
        expect(typeof workflow.workflow_name).toBe("string");
        expect(typeof workflow.error_count).toBe("number");
        expect(workflow.error_count).toBeGreaterThan(0);
      });
    });
  });
});
