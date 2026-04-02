import { z, type ZodError } from "zod";

/**
 * Returns the first human-readable validation error from a ZodError,
 * preferring field-level messages over issue-level messages.
 */
export function getFirstZodError(error: ZodError): string {
  const firstFieldMessage = Object.values(z.treeifyError(error)).flat()[0];
  if (typeof firstFieldMessage === "string") return firstFieldMessage;

  return error.issues[0]?.message ?? "Please check the form fields.";
}
