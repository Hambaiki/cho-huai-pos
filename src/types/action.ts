export type Result<T = void> =
  | (T extends void
      ? { ok: true; message?: string }
      : { ok: true; data: T; message?: string })
  | { ok: false; error: string };
