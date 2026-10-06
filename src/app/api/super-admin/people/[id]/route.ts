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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, full_name, phone, role, is_active, created_by, last_login, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (profileError) {
      console.error("Person lookup failed:", profileError);

      return NextResponse.json(
        { error: "Unable to load the person." },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Person not found." },
        { status: 404 },
      );
    }

    const [
      { data: staff },
      { data: teacher },
      { data: student },
      { data: auditLogs, error: auditError },
    ] = await Promise.all([
      supabaseAdmin
        .from("staff")
        .select("id, staff_id, full_name, status, created_at, updated_at")
        .eq("full_name", profile.full_name ?? "")
        .maybeSingle(),

      supabaseAdmin
        .from("teachers")
        .select("id, staff_id, full_name, status, created_at, updated_at")
        .eq("full_name", profile.full_name ?? "")
        .maybeSingle(),

      supabaseAdmin
        .from("students")
        .select(
          "id, admission_number, full_name, status, first_name, last_name, gender, date_of_birth, class_id, arm, parent_name, parent_phone, parent_email, address, created_at, updated_at",
        )
        .eq("full_name", profile.full_name ?? "")
        .maybeSingle(),

      supabaseAdmin
        .from("audit_logs")
        .select(
          "id, actor_id, actor_email, action, target_type, target_id, target_email, metadata, created_at",
        )
        .eq("target_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (auditError) {
      console.error("Person audit lookup failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      person: {
        ...profile,
        personnel: {
          staff: staff ?? null,
          teacher: teacher ?? null,
          student: student ?? null,
        },
        auditLogs: auditLogs ?? [],
      },
    });
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

    console.error("Person details error:", error);

    return NextResponse.json(
      { error: "Unable to load person details." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const { data: target, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error("Target lookup failed:", targetError);

      return NextResponse.json(
        { error: "Unable to load the target account." },
        { status: 500 },
      );
    }

    if (!target) {
      return NextResponse.json(
        { error: "Person not found." },
        { status: 404 },
      );
    }

    const requestedRole =
      body.role === undefined ? undefined : body.role;

    const requestedActive =
      body.is_active === undefined ? undefined : body.is_active;

    if (
      requestedRole !== undefined &&
      !isAllowedRole(requestedRole)
    ) {
      return NextResponse.json(
        { error: "Invalid academy role." },
        { status: 400 },
      );
    }

    if (
      requestedActive !== undefined &&
      typeof requestedActive !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Account status must be a boolean." },
        { status: 400 },
      );
    }

    const changingRole =
      requestedRole !== undefined &&
      requestedRole !== target.role;

    const changingStatus =
      requestedActive !== undefined &&
      requestedActive !== target.is_active;

    if (!changingRole && !changingStatus) {
      return NextResponse.json({
        success: true,
        message: "No changes were required.",
      });
    }

    if (target.id === actor.id) {
      return NextResponse.json(
        {
          error:
            "The active Super Administrator cannot change their own role or account status.",
        },
        { status: 403 },
      );
    }

    if (
      target.role === "super_admin" &&
      requestedActive === false
    ) {
      const { count, error: countError } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("is_active", true);

      if (countError) {
        console.error(
          "Super Administrator count failed:",
          countError,
        );

        return NextResponse.json(
          { error: "Unable to verify Super Administrator protection." },
          { status: 500 },
        );
      }

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            error:
              "The last active Super Administrator cannot be deactivated.",
          },
          { status: 409 },
        );
      }
    }

    if (
      target.role === "super_admin" &&
      requestedRole !== undefined &&
      requestedRole !== "super_admin"
    ) {
      const { count, error: countError } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("is_active", true);

      if (countError) {
        console.error(
          "Super Administrator count failed:",
          countError,
        );

        return NextResponse.json(
          { error: "Unable to verify Super Administrator protection." },
          { status: 500 },
        );
      }

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            error:
              "The last active Super Administrator cannot be demoted.",
          },
          { status: 409 },
        );
      }
    }

    const updates: {
      role?: AllowedRole;
      is_active?: boolean;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (requestedRole !== undefined) {
      updates.role = requestedRole;
    }

    if (requestedActive !== undefined) {
      updates.is_active = requestedActive;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select(
        "id, email, full_name, phone, role, is_active, created_by, last_login, created_at, updated_at",
      )
      .single();

    if (updateError) {
      console.error("Person update failed:", updateError);

      return NextResponse.json(
        { error: "Unable to update the account." },
        { status: 500 },
      );
    }

    const changes: Record<string, unknown> = {};

    if (changingRole) {
      changes.role = {
        from: target.role,
        to: requestedRole,
      };
    }

    if (changingStatus) {
      changes.is_active = {
        from: target.is_active,
        to: requestedActive,
      };
    }

    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        actor_id: actor.id,
        actor_email: actor.email,
        action: "people.account_updated",
        target_type: "profile",
        target_id: id,
        target_email: target.email,
        metadata: {
          changes,
          previous_role: target.role,
          previous_is_active: target.is_active,
          new_role: updated.role,
          new_is_active: updated.is_active,
        },
      });

    if (auditError) {
      console.error("Audit log failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      person: updated,
      message: "Account updated successfully.",
    });
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

    console.error("Person update error:", error);

    return NextResponse.json(
      { error: "Unable to update the account." },
      { status: 500 },
    );
  }
}
