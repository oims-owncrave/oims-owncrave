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

/**
 * Data pelengkap yang hanya boleh dilihat sebagian role (mis. isi dropdown pada
 * modal "Tambah"). Kalau role yang sedang login tidak berhak, kembalikan
 * `fallback` alih-alih melempar — supaya halaman DAFTAR tetap terbuka untuk
 * yang hanya boleh membaca.
 *
 * Hanya menelan penolakan akses. Error lain (DB mati, query salah) tetap
 * dilempar — menelan semuanya akan menyembunyikan kerusakan nyata.
 */
export async function opsional<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "";
    if (pesan === "Akses ditolak" || pesan === "Unauthenticated" || pesan === "Akun dinonaktifkan") {
      return fallback;
    }
    throw e;
  }
}

export async function requireRole(
  allowedRoles: Array<(typeof users.$inferSelect)["role"]>,
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  if (!user.isActive) throw new Error("Akun dinonaktifkan");
  if (!allowedRoles.includes(user.role)) throw new Error("Akses ditolak");
  return user;
}
