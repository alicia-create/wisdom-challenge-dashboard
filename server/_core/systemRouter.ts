import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  triggerPerformanceAlert: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }
      
      const result = await db.execute(
        "SELECT trigger_performance_alert_check() as result"
      );
      
      return {
        success: true,
        message: "Performance alert check triggered",
      } as const;
    }),
});
