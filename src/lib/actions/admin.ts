"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const setUserSuspensionSchema = z.object({
  userId: z.string().uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

export async function setUserSuspensionAction(formData: FormData) {
  const parsed = setUserSuspensionSchema.safeParse({
    userId: formData.get("userId"),
    suspend: formData.get("suspend"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.is_super_admin) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ is_suspended: parsed.data.suspend })
    .eq("id", parsed.data.userId);

  revalidatePath("/admin/users");
}
