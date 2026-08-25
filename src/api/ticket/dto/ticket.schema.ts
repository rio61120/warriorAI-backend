import { z } from "zod";
export const TicketClassificationSchema = z.object({
  category: z.enum(["BUG", "FEATURE", "QUESTION", "BILLING"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  summary: z.string().min(5).max(120),
  shouldEscalate: z.boolean(),
});
