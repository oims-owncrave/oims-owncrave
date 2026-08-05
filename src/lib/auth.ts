import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CurrentUser = typeof users.$inferSelect;

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return profile ?? null;
});

export async function requireRole(
  allowedRoles: Array<(typeof users.$inferSelect)["role"]>,
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  if (!user.isActive) throw new Error("Akun dinonaktifkan");
  if (!allowedRoles.includes(user.role)) throw new Error("Akses ditolak");
  return user;
}
