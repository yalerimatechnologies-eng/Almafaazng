import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/require-super-admin";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

const ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "teacher",
  "staff",
  "cbt_officer",
  "islamic",
  "parent",
  "student",
] as const;

type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isAllowedRole(value: unknown): value is AllowedRole {
  return (
    typeof value === "string" &&
    ALLOWED_ROLES.includes(value as AllowedRole)
  );
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const role = body.role;

    if (!email || !fullName || !isAllowedRole(role)) {
      return NextResponse.json(
        {
          error:
            "fullName, email and a valid academy role are required.",
        },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    const redirectTo = new URL(
      "/",
      request.url,
    ).toString();

    const {
      data: invited,
      error: inviteError,
    } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: fullName,
      },
    });

    if (inviteError || !invited.user) {
      return NextResponse.json(
        {
          error:
            inviteError?.message ??
            "Unable to create the authentication account.",
        },
        { status: 400 },
      );
    }

    const userId = invited.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name: fullName,
        phone: phone || null,
        role,
        is_active: true,
        created_by: actor.id,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            "The authentication account was created but the academy profile could not be created. The account was rolled back.",
        },
        { status: 500 },
      );
    }

    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        actor_id: actor.id,
        actor_email: actor.email,
        action: "people.account_invited",
        target_type: "profile",
        target_id: userId,
        target_email: email,
        metadata: {
          full_name: fullName,
          role,
          phone: phone || null,
          method: "email_invitation",
        },
      });

    if (auditError) {
      console.error("Audit log failed:", auditError);
    }

    return NextResponse.json(
      {
        success: true,
        userId,
        message: "Account invitation created successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Super Administrator access required." },
        { status: 403 },
      );
    }

    console.error("People invitation error:", error);

    return NextResponse.json(
      { error: "Unable to process the account invitation." },
      { status: 500 },
    );
  }
}
