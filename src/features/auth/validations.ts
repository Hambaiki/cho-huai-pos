import { z } from "zod";

export const signInSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8),
});

export const signUpSchema = z
  .object({
    displayName: z.string().min(2).max(80).trim(),
    email: z.email().trim(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const updateAccountSchema = z.object({
  displayName: z.string().min(2).max(80).trim(),
});

export const updateEmailSchema = z.object({
  email: z.email().trim(),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z
  .object({
    deleteConfirmation: z.string().trim(),
    deleteAcknowledge: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deleteConfirmation.toUpperCase() !== "DELETE") {
      ctx.addIssue({
        code: "custom",
        path: ["deleteConfirmation"],
        message: 'Type "DELETE" to confirm account deletion.',
      });
    }

    if (data.deleteAcknowledge !== "on") {
      ctx.addIssue({
        code: "custom",
        path: ["deleteAcknowledge"],
        message: "Please acknowledge this action before continuing.",
      });
    }
  });
