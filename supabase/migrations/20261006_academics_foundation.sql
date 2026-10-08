-- ============================================================
-- ALMAFAAZ ACADEMY
-- ACADEMICS FOUNDATION
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILE PHOTOGRAPHS
-- ------------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;

-- ------------------------------------------------------------
-- 2. CLASS ARMS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.class_arms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  capacity integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT class_arms_capacity_positive
    CHECK (capacity IS NULL OR capacity > 0),

  CONSTRAINT class_arms_unique_name
    UNIQUE (class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_class_arms_class_id
  ON public.class_arms(class_id);

-- ------------------------------------------------------------
-- 3. SUBJECTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  category text,
  is_compulsory boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subjects_unique_name UNIQUE (name)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_code_unique
  ON public.subjects(code)
  WHERE code IS NOT NULL;

-- ------------------------------------------------------------
-- 4. SUBJECTS OFFERED BY EACH CLASS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_compulsory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT class_subjects_unique
    UNIQUE (class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id
  ON public.class_subjects(class_id);

CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id
  ON public.class_subjects(subject_id);

-- ------------------------------------------------------------
-- 5. TEACHER SUBJECT ASSIGNMENTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT teacher_subjects_unique_assignment
    UNIQUE (
      teacher_id,
      subject_id,
      class_id,
      academic_session_id,
      term_id
    )
);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher
  ON public.teacher_subjects(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject
  ON public.teacher_subjects(subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_class
  ON public.teacher_subjects(class_id);

-- ------------------------------------------------------------
-- 6. STUDENT ACADEMIC ENROLMENT
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  class_arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  exit_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT student_enrollment_status
    CHECK (
      status IN (
        'active',
        'completed',
        'withdrawn',
        'transferred',
        'promoted'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student
  ON public.student_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_session
  ON public.student_enrollments(academic_session_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_class
  ON public.student_enrollments(class_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_arm
  ON public.student_enrollments(class_arm_id);

-- Only one active enrolment per student/session.
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_active_session
  ON public.student_enrollments(student_id, academic_session_id)
  WHERE status = 'active';

-- ------------------------------------------------------------
-- 7. CLASS TEACHERS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_arm_id uuid REFERENCES public.class_arms(id) ON DELETE SET NULL,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT class_teachers_unique
    UNIQUE (
      teacher_id,
      class_id,
      class_arm_id,
      academic_session_id,
      term_id
    )
);

CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher
  ON public.class_teachers(teacher_id);

CREATE INDEX IF NOT EXISTS idx_class_teachers_class
  ON public.class_teachers(class_id);

-- ------------------------------------------------------------
-- 8. UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_academics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_class_arms_updated_at
  ON public.class_arms;

CREATE TRIGGER trg_class_arms_updated_at
BEFORE UPDATE ON public.class_arms
FOR EACH ROW
EXECUTE FUNCTION public.set_academics_updated_at();

DROP TRIGGER IF EXISTS trg_subjects_updated_at
  ON public.subjects;

CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.set_academics_updated_at();

DROP TRIGGER IF EXISTS trg_student_enrollments_updated_at
  ON public.student_enrollments;

CREATE TRIGGER trg_student_enrollments_updated_at
BEFORE UPDATE ON public.student_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_academics_updated_at();

-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE public.class_arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 10. READ ACCESS FOR AUTHENTICATED USERS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "academic authenticated read class arms"
  ON public.class_arms;

CREATE POLICY "academic authenticated read class arms"
ON public.class_arms
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "academic authenticated read subjects"
  ON public.subjects;

CREATE POLICY "academic authenticated read subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "academic authenticated read class subjects"
  ON public.class_subjects;

CREATE POLICY "academic authenticated read class subjects"
ON public.class_subjects
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "academic authenticated read teacher subjects"
  ON public.teacher_subjects;

CREATE POLICY "academic authenticated read teacher subjects"
ON public.teacher_subjects
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "academic authenticated read student enrollments"
  ON public.student_enrollments;

CREATE POLICY "academic authenticated read student enrollments"
ON public.student_enrollments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "academic authenticated read class teachers"
  ON public.class_teachers;

CREATE POLICY "academic authenticated read class teachers"
ON public.class_teachers
FOR SELECT
TO authenticated
USING (true);

-- ------------------------------------------------------------
-- 11. ADMINISTRATION WRITE ACCESS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "academic admin manage class arms"
  ON public.class_arms;

CREATE POLICY "academic admin manage class arms"
ON public.class_arms
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "academic admin manage subjects"
  ON public.subjects;

CREATE POLICY "academic admin manage subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "academic admin manage class subjects"
  ON public.class_subjects;

CREATE POLICY "academic admin manage class subjects"
ON public.class_subjects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "academic admin manage teacher subjects"
  ON public.teacher_subjects;

CREATE POLICY "academic admin manage teacher subjects"
ON public.teacher_subjects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "academic admin manage student enrollments"
  ON public.student_enrollments;

CREATE POLICY "academic admin manage student enrollments"
ON public.student_enrollments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "academic admin manage class teachers"
  ON public.class_teachers;

CREATE POLICY "academic admin manage class teachers"
ON public.class_teachers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 12. COMMENTS
-- ------------------------------------------------------------

COMMENT ON TABLE public.class_arms IS
  'Academic class arms such as JSS1A, JSS1B, SS2A.';

COMMENT ON TABLE public.subjects IS
  'Academy-wide subject catalogue.';

COMMENT ON TABLE public.class_subjects IS
  'Subjects offered by each academic class.';

COMMENT ON TABLE public.teacher_subjects IS
  'Teacher-to-subject/class academic assignments.';

COMMENT ON TABLE public.student_enrollments IS
  'Student academic enrolment history by session, term, class and arm.';

COMMENT ON TABLE public.class_teachers IS
  'Class teacher assignments by academic session and term.';

COMMENT ON COLUMN public.profiles.avatar_path IS
  'Supabase Storage object path for the profile photograph.';

-- ------------------------------------------------------------
-- COMPLETE
-- ------------------------------------------------------------
