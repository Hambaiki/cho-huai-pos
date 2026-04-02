import { z } from "zod";

export const inviteStaffSchema = z.object({
  storeId: z.uuid(),
  email: z.email().trim().toLowerCase(),
  role: z.enum(["manager", "cashier", "viewer"]), // Exclude 'owner' role
  note: z.string().max(255).optional(),
});
