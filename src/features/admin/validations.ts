import { z } from "zod";

export const setUserSuspensionSchema = z.object({
  userId: z.uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

export const setUserSuperAdminSchema = z.object({
  userId: z.uuid(),
  makeSuperAdmin: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

export const setStoreSuspensionSchema = z.object({
  storeId: z.uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

export const setStoreStaffLimitOverrideSchema = z.object({
  storeId: z.uuid(),
  staffLimitOverride: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .refine(
      (value) =>
        value === null ||
        (Number.isInteger(value) && Number.isFinite(value) && value > 0),
      {
        message: "Staff limit must be a positive integer.",
      },
    )
    .nullable(),
});

export const setUserStoreLimitOverrideSchema = z.object({
  userId: z.uuid(),
  storeLimitOverride: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .refine(
      (value) =>
        value === null ||
        (Number.isInteger(value) && Number.isFinite(value) && value > 0),
      {
        message: "Store limit must be a positive integer.",
      },
    )
    .nullable(),
});

export const updateSitewideSettingsSchema = z.object({
  maintenanceMode: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
  announcementText: z.string().max(1000).trim(),
});
