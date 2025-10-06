-- MatematikNET Database Schema (PostgreSQL)
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student','teacher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- Auth columns (no registration and only provisioned users can login)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS can_login BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_can_login ON users(can_login);

-- Teacher ↔ Student relation
CREATE TABLE IF NOT EXISTS teacher_students (
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);

-- Topic definitions (created by teacher)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- unique handled via index below
);
CREATE INDEX IF NOT EXISTS idx_topics_created_by ON topics(created_by);
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_creator_lower_name ON topics(created_by, lower(name));
-- add column if schema existed before
ALTER TABLE topics ADD COLUMN IF NOT EXISTS position INTEGER;

-- Per-student topic progress
CREATE TABLE IF NOT EXISTS topic_progress (
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  progress SMALLINT NOT NULL CHECK (progress BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, topic_id)
);
CREATE INDEX IF NOT EXISTS idx_topic_progress_topic ON topic_progress(topic_id);

-- Assignment definitions (created by teacher)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON assignments(due_date);
-- add description column for assignments (backward compatible)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description TEXT;

-- Optional assignees. If no assignees for an assignment, treat as "all students of teacher".
CREATE TABLE IF NOT EXISTS assignment_assignees (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_assignment_assignees_student ON assignment_assignees(student_id);

-- Student assignment status (completion)
CREATE TABLE IF NOT EXISTS assignment_status (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_assignment_status_student ON assignment_status(student_id);

-- Exam attempts (netler)
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  taken_at DATE NOT NULL,
  title TEXT,
  mat_net NUMERIC(4,1) NOT NULL CHECK (mat_net >= 0 AND mat_net <= 100),
  total_net NUMERIC(5,1) NOT NULL CHECK (total_net >= 0 AND total_net <= 100),
  duration_minutes SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_date ON exam_attempts(student_id, taken_at DESC);

-- Helper view: visible assignments per student (directly assigned or assignments with no assignee created by their teachers)
CREATE OR REPLACE VIEW v_student_assignments AS
SELECT s.student_id,
       a.id AS assignment_id,
       a.title,
       a.due_date,
       a.created_by,
       COALESCE(st.status,'pending') AS status,
       st.completed_at
FROM (
  -- explicitly assigned
  SELECT student_id, assignment_id FROM assignment_assignees
  UNION
  -- implicitly assigned: to all students of the teacher if no specific assignees exist
  SELECT ts.student_id, a.id AS assignment_id
  FROM teacher_students ts
  JOIN assignments a ON a.created_by = ts.teacher_id
  WHERE NOT EXISTS (
    SELECT 1 FROM assignment_assignees aa WHERE aa.assignment_id = a.id
  )
) s
JOIN assignments a ON a.id = s.assignment_id AND a.is_active
LEFT JOIN assignment_status st ON st.assignment_id = a.id AND st.student_id = s.student_id;

-- Assignment files: stored on disk and returned as URLs by API
CREATE TABLE IF NOT EXISTS assignment_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assignment_files_assignment ON assignment_files(assignment_id);

-- Minimal seed data guard (no-op if users exist)
-- INSERTs should be placed in a separate seed file.
