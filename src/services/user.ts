"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import type { UserInput, UserUpdateInput } from "@/lib/schemas/user";

// Admin client — service_role key, server-only, no session/token persistence
function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function writeAudit(
  aksi: string,
  recordId: string,
  before: unknown,
  after: unknown,
  userId: string | null,
) {
  await db.insert(auditLog).values({
    userId: userId ?? undefined,
    aksi,
    tabel: "users",
    recordId,
    dataBefore: before ? JSON.stringify(before) : null,
    dataAfter: after ? JSON.stringify(after) : null,
  });
}

/** List all users — owner only. users tabel tidak punya deletedAt (soft-disable via isActive). */
export async function listUsers() {
  await requireRole(["owner"]);
  return db.select().from(users);
}

/** Create new user — generates synthetic email, creates auth.users via Admin API, then inserts public.users. */
export async function createUser(input: UserInput) {
  const currentUser = await requireRole(["owner"]);

  const email = `${input.username.toLowerCase()}@owncrave.local`;

  // 1. Create auth.users via Admin API
  const admin = adminClient();
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        username: input.username,
        full_name: input.displayName,
      },
      app_metadata: { role: input.role, username: input.username },
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Gagal membuat akun auth" };
  }

  // 2. Insert public.users
  const [newUser] = await db
    .insert(users)
    .values({
      id: authData.user.id,
      email,
      displayName: input.displayName,
      role: input.role,
      isActive: true,
    })
    .returning();

  await writeAudit("CREATE", newUser.id, null, newUser, currentUser.id);
  return { data: newUser };
}

/** Update user role/displayName/isActive. Syncs role to auth app_metadata on role change. */
export async function updateUser(id: string, input: UserUpdateInput) {
  const currentUser = await requireRole(["owner"]);

  const [before] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!before) return { error: "User tidak ditemukan" };

  // Prevent owner demoting themselves
  if (id === currentUser.id && input.role && input.role !== "owner") {
    return { error: "Tidak bisa mengubah role diri sendiri" };
  }

  // Username change: derive new email, guard uniqueness (username = email prefix @owncrave.local)
  const beforeUsername = before.email.split("@")[0];
  const usernameChanged = !!input.username && input.username !== beforeUsername;
  let newEmail = before.email;
  if (usernameChanged) {
    newEmail = `${input.username!.toLowerCase()}@owncrave.local`;
    const [dupe] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, newEmail), ne(users.id, id)))
      .limit(1);
    if (dupe) return { error: `Username "${input.username}" sudah dipakai` };
  }

  // Strip non-column fields before db update
  const { newPassword: _pw, username: _un, ...dbInput } = input;
  const [updated] = await db
    .update(users)
    .set({ ...dbInput, ...(usernameChanged ? { email: newEmail } : {}), updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  // Sync to Supabase auth: role, password, email + username metadata
  const authUpdate: Record<string, unknown> = {};
  if (input.role && input.role !== before.role) authUpdate.app_metadata = { role: input.role, username: input.username ?? beforeUsername };
  if (input.newPassword) authUpdate.password = input.newPassword;
  // Lift ban when reactivating, set ban when deactivating via updateUser
  if (input.isActive === true && before.isActive === false) authUpdate.ban_duration = "none";
  if (input.isActive === false && before.isActive === true) authUpdate.ban_duration = "876000h";
  if (usernameChanged) {
    authUpdate.email = newEmail;
    authUpdate.user_metadata = { username: input.username, full_name: input.displayName ?? before.displayName };
    // merge username into app_metadata even if role unchanged
    authUpdate.app_metadata = { role: input.role ?? before.role, username: input.username };
  }
  if (Object.keys(authUpdate).length) {
    const admin = adminClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(id, authUpdate);
    if (authErr) return { error: `Gagal update auth: ${authErr.message}` };
  }

  await writeAudit("UPDATE", id, before, updated, currentUser.id);
  return { data: updated };
}

/** Soft-disable user — sets isActive=false + revokes Supabase sessions globally. */
export async function deactivateUser(id: string) {
  const currentUser = await requireRole(["owner"]);
  if (id === currentUser.id)
    return { error: "Tidak bisa menonaktifkan diri sendiri" };

  const [before] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!before) return { error: "User tidak ditemukan" };

  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  // Revoke all active sessions + ban from new logins
  const admin = adminClient();
  await admin.auth.admin.signOut(id, "global");
  await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });

  await writeAudit("DEACTIVATE", id, before, updated, currentUser.id);
  return { data: updated };
}
