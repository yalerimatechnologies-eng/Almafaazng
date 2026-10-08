import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/require-super-admin";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

const NO_PORTAL_ACCOUNT = "No portal account";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [
      { data: profiles, error: profilesError },
      { data: staff, error: staffError },
      { data: teachers, error: teachersError },
      { data: students, error: studentsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          "id, email, full_name, phone, role, is_active, created_by, last_login, created_at, updated_at, avatar_path",
        )
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("staff")
        .select(
          "id, profile_id, staff_id, full_name, status, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("teachers")
        .select(
          "id, profile_id, staff_id, full_name, status, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("students")
        .select(
          "id, profile_id, admission_number, full_name, status, first_name, last_name, gender, date_of_birth, class_id, arm, created_at, updated_at, is_demo",
        )
        .order("created_at", { ascending: false }),
    ]);

    if (
      profilesError ||
      staffError ||
      teachersError ||
      studentsError
    ) {
      console.error("People directory lookup failed:", {
        profilesError,
        staffError,
        teachersError,
        studentsError,
      });

      return NextResponse.json(
        { error: "Unable to load the People & HR directory." },
        { status: 500 },
      );
    }

    const profileList = profiles ?? [];
    const staffList = staff ?? [];
    const teacherList = teachers ?? [];
    const studentList = students ?? [];

    type DirectoryPerson = {
      id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      role: string;
      is_active: boolean;
      created_by: string | null;
      last_login: string | null;
      created_at: string;
      updated_at: string;
      avatar_path: string | null;
      sourceType: "account" | "student_record" | "teacher_record" | "staff_record";
      hasPortalAccount: boolean;
      personnel: {
        staffId: string | null;
        admissionNumber: string | null;
        personnelStatus: string | null;
        className: string | null;
        arm: string | null;
        isDemoStudent: boolean;
      };
    };

    const people: DirectoryPerson[] = profileList.map((profile) => {
      const staffRecord =
        staffList.find((person) => person.profile_id === profile.id) ??
        null;

      const teacherRecord =
        teacherList.find((person) => person.profile_id === profile.id) ??
        null;

      const studentRecord =
        studentList.find((person) => person.profile_id === profile.id) ??
        null;

      return {
        ...profile,

        sourceType: "account" as const,
        hasPortalAccount: true,

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

          className: null,
          arm: studentRecord?.arm ?? null,
          isDemoStudent: studentRecord?.is_demo ?? false,
        },
      };
    });

    const profileIds = new Set(profileList.map((profile) => profile.id));

    /*
     * Standalone students:
     *
     * These are genuine student records that do not yet have
     * a Supabase authentication/profile record. They must still
     * appear in People & HR.
     */
    for (const student of studentList) {
      if (student.profile_id && profileIds.has(student.profile_id)) {
        continue;
      }

      people.push({
        id: `student:${student.id}`,
        email: NO_PORTAL_ACCOUNT,
        full_name: student.full_name,
        phone: null,
        role: "student",
        is_active: student.status === "active",
        created_by: null,
        last_login: null,
        created_at: student.created_at,
        updated_at: student.updated_at,
        avatar_path: null,

        sourceType: "student_record" as const,
        hasPortalAccount: false,

        personnel: {
          staffId: null,
          admissionNumber: student.admission_number,
          personnelStatus: student.status,
          className: null,
          arm: student.arm,
          isDemoStudent: student.is_demo,
        },
      });
    }

    /*
     * Standalone teachers.
     *
     * This allows the directory to remain useful even if a teacher
     * record exists before a portal account is created.
     */
    for (const teacher of teacherList) {
      if (teacher.profile_id && profileIds.has(teacher.profile_id)) {
        continue;
      }

      people.push({
        id: `teacher:${teacher.id}`,
        email: NO_PORTAL_ACCOUNT,
        full_name: teacher.full_name,
        phone: null,
        role: "teacher",
        is_active: teacher.status === "active",
        created_by: null,
        last_login: null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at,
        avatar_path: null,

        sourceType: "teacher_record" as const,
        hasPortalAccount: false,

        personnel: {
          staffId: teacher.staff_id,
          admissionNumber: null,
          personnelStatus: teacher.status,
          className: null,
          arm: null,
          isDemoStudent: false,
        },
      });
    }

    /*
     * Standalone staff.
     */
    for (const person of staffList) {
      if (person.profile_id && profileIds.has(person.profile_id)) {
        continue;
      }

      people.push({
        id: `staff:${person.id}`,
        email: NO_PORTAL_ACCOUNT,
        full_name: person.full_name,
        phone: null,
        role: "staff",
        is_active: person.status === "active",
        created_by: null,
        last_login: null,
        created_at: person.created_at,
        updated_at: person.updated_at,
        avatar_path: null,

        sourceType: "staff_record" as const,
        hasPortalAccount: false,

        personnel: {
          staffId: person.staff_id,
          admissionNumber: null,
          personnelStatus: person.status,
          className: null,
          arm: null,
          isDemoStudent: false,
        },
      });
    }

    /*
     * Keep account-backed people first, followed by standalone
     * personnel records.
     */
    people.sort((a, b) => {
      if (a.hasPortalAccount !== b.hasPortalAccount) {
        return a.hasPortalAccount ? -1 : 1;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    return NextResponse.json({
      success: true,
      people,
      count: people.length,
      accountCount: profileList.length,
      studentRecordCount: studentList.length,
      teacherRecordCount: teacherList.length,
      staffRecordCount: staffList.length,
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
