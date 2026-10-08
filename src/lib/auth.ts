import { getSupabase } from "./supabase";

export interface ResolvedAccount {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: string;
  status: string;
}

export type AccountResolution =
  | {
      ok: true;
      account: ResolvedAccount;
    }
  | {
      ok: false;
      reason:
        | "no_profile"
        | "no_role"
        | "inactive"
        | "unknown_role"
        | "error";
      message: string;
    };

/**
 * Database role values are mapped to the frontend role slugs.
 * The database stores "islamic"; the frontend uses "islamic_section".
 */
const DATABASE_ROLE_MAP: Record<string, string> = {
  super_admin: "super_admin",
  admin: "admin",
  teacher: "teacher",
  staff: "staff",
  cbt_officer: "cbt_officer",
  islamic: "islamic_section",
  islamic_section: "islamic_section",
  parent: "parent",
  student: "student",
};

/**
 * Load the authenticated user's academy profile.
 *
 * The profiles table is the source of truth for identity,
 * activation status, and role assignment.
 */
export async function resolveCurrentAccount(
  userId: string,
  email: string | null
): Promise<AccountResolution> {
  try {
    const supabase = getSupabase();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, is_active, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) { console.error("ALMAFAAZ PROFILE ERROR: message=" + String(profileError.message) + " | details=" + String(profileError.details) + " | hint=" + String(profileError.hint) + " | code=" + String(profileError.code));
      return {
        ok: false,
        reason: "error",
        message:
          "We could not load your academy profile. Check your connection and try again.",
      };
    }

    if (!profile) {
      return {
        ok: false,
        reason: "no_profile",
        message:
          "Your account is not linked to an academy profile. Please contact the academy administrator.",
      };
    }

    if (profile.is_active !== true) {
      return {
        ok: false,
        reason: "inactive",
        message:
          "Your account is not currently active. Please contact the academy administrator.",
      };
    }

    if (!profile.role) {
      return {
        ok: false,
        reason: "no_role",
        message:
          "Your account does not have an assigned academy role. Please contact the academy administrator.",
      };
    }

    const resolvedRole = DATABASE_ROLE_MAP[profile.role];

    if (!resolvedRole) {
      return {
        ok: false,
        reason: "unknown_role",
        message:
          "Your account role is not recognised by this system. Please contact the academy administrator.",
      };
    }

    return {
      ok: true,
      account: {
        userId,
        email,
        fullName: profile.full_name ?? null,
        role: resolvedRole,
        status: "active",
      },
    };
  } catch {
    return {
      ok: false,
      reason: "error",
      message:
        "We could not verify your academy account. Please try again.",
    };
  }
}
