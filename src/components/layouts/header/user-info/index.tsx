import { createClient } from "@/lib/supabase/server";
import { UserInfoClient } from "./client";

/**
 * Server Component — fetch user from Supabase auth.
 * Pass display data to client dropdown.
 */
export async function UserInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    email.split("@")[0] ??
    "User";

  return <UserInfoClient email={email} displayName={fullName} />;
}
