import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/require-super-admin";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export async function GET() {
  try {
    await requireSuperAdmin();

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, full_name, phone, role, is_active, created_by, last_login, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("People profiles lookup failed:", profilesError);

      return NextResponse.json(
        { error: "Unable to load academy accounts." },
        { status: 500 },
      );
    }

    const profileIds = (profiles ?? []).map((profile) => profile.id);

    if (profileIds.length === 0) {
      return NextResponse.json({
        success: true,
        people: [],
        count: 0,
      });
    }

    const [
      { data: staff, error: staffError },
      { data: teachers, error: teachersError },
      { data: students, error: studentsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("staff")
        .select("id, profile_id, staff_id, full_name, status")
        .in("profile_id", profileIds),

      supabaseAdmin
        .from("teachers")
        .select("id, profile_id, staff_id, full_name, status")
        .in("profile_id", profileIds),

      supabaseAdmin
        .from("students")
        .select(
          "id, profile_id, admission_number, full_name, status, first_name, last_name",
        )
        .in("profile_id", profileIds),
    ]);

    if (staffError || teachersError || studentsError) {
      console.error("People personnel lookup failed:", {
        staffError,
        teachersError,
        studentsError,
      });

      return NextResponse.json(
        { error: "Unable to load linked personnel records." },
        { status: 500 },
      );
    }

    const staffByProfileId = new Map(
      (staff ?? []).map((person) => [person.profile_id, person]),
    );

    const teachersByProfileId = new Map(
      (teachers ?? []).map((person) => [person.profile_id, person]),
    );

    const studentsByProfileId = new Map(
      (students ?? []).map((person) => [person.profile_id, person]),
    );

    const people = (profiles ?? []).map((profile) => {
      const staffRecord = staffByProfileId.get(profile.id) ?? null;
      const teacherRecord =
        teachersByProfileId.get(profile.id) ?? null;
      const studentRecord =
        studentsByProfileId.get(profile.id) ?? null;

      return {
        ...profile,

        personnel: {
          staffId:
            teacherRecord?.staff_id ??
            staffRecord?.staff_id ??
            null,

          admissionNumber:
            studentRecord?.admission_number ??
            null,

          personnelStatus:
            teacherRecord?.status ??
            staffRecord?.status ??
            studentRecord?.status ??
            null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      people,
      count: people.length,
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

    console.error("People directory error:", error);

    return NextResponse.json(
      { error: "Unable to load the People & HR directory." },
      { status: 500 },
    );
  }
}
