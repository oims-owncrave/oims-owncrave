"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Domain sintetis: user login pakai username, Supabase tetap simpan sebagai email.
const EMAIL_DOMAIN = "owncrave.local";

export async function signInAction(formData: { username: string; password: string }) {
  const supabase = await createClient();

  const email = `${formData.username.toLowerCase()}@${EMAIL_DOMAIN}`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.password,
  });

  if (error) {
    return { error: "Username atau password salah" };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
