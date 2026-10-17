-- Apply in the Supabase SQL Editor after reviewing the existing student rows.
-- This links Auth identities to the existing public.students IDs without
-- changing the string IDs referenced by applications, interviews, or notices.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.students
    WHERE registration_number IS NOT NULL
      AND BTRIM(registration_number) <> ''
    GROUP BY LOWER(BTRIM(registration_number))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate student registration numbers exist; resolve them before applying this migration.';
  END IF;
END $$;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

ALTER TABLE public.students
  ALTER COLUMN password DROP NOT NULL;

-- Person 1 application submissions retain the storage object key as a snapshot.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS resume_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_id_uidx
  ON public.students (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_registration_number_uidx
  ON public.students (LOWER(BTRIM(registration_number)))
  WHERE registration_number IS NOT NULL AND BTRIM(registration_number) <> '';

-- Link existing student rows to Auth accounts with matching email addresses.
-- Their existing student IDs remain stable for the other foreign keys.
UPDATE public.students AS student
SET auth_user_id = auth_user.id,
    password = NULL,
    updated_at = NOW()
FROM auth.users AS auth_user
WHERE student.auth_user_id IS NULL
  AND LOWER(student.email) = LOWER(auth_user.email);

CREATE OR REPLACE FUNCTION public.create_student_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  linked_student_id character varying;
BEGIN
  INSERT INTO public.students (
    id,
    auth_user_id,
    name,
    email,
    password,
    role,
    registration_number,
    cgpa,
    backlogs,
    skills,
    is_active
  ) VALUES (
    NEW.id::text,
    NEW.id,
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''), NEW.email),
    LOWER(NEW.email),
    NULL,
    'student',
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'registration_number'), ''),
    0,
    0,
    '[]'::jsonb,
    TRUE
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = COALESCE(public.students.auth_user_id, EXCLUDED.auth_user_id),
        password = NULL,
        updated_at = NOW()
    WHERE public.students.auth_user_id IS NULL
       OR public.students.auth_user_id = EXCLUDED.auth_user_id
  RETURNING id INTO linked_student_id;

  IF linked_student_id IS NULL THEN
    RAISE EXCEPTION 'This email is already linked to another student account.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_student_created ON auth.users;
CREATE TRIGGER on_auth_student_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_student_profile_for_auth_user();

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read their own linked profile" ON public.students;
CREATE POLICY "Students can read their own linked profile"
  ON public.students FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can update their own linked profile" ON public.students;
CREATE POLICY "Students can update their own linked profile"
  ON public.students FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

GRANT SELECT, UPDATE ON public.students TO authenticated;
