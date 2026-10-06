import { createSupabaseServerClient } from "./supabase-server";

export type AuthorizedSuperAdmin = {
  id: string;
  email: string;
  fullName: string | null;
  role: "super_admin";
};

export async function requireSuperAdmin(): Promise<AuthorizedSuperAdmin> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("PROFILE_LOOKUP_FAILED");
  }

  if (
    !profile ||
    profile.role !== "super_admin" ||
    profile.is_active !== true
  ) {
    throw new Error("FORBIDDEN");
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: "super_admin",
  };
}
