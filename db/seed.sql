-- Seed example data for MatematikNET (PostgreSQL)
-- Run after schema.sql

-- Users
INSERT INTO users (id, name, email, role)
VALUES
  (gen_random_uuid(), 'Öğretmen Demo', 'ogretmen@matnet.local', 'teacher'),
  (gen_random_uuid(), 'Öğrenci Demo', 'ogrenci@matnet.local', 'student')
ON CONFLICT DO NOTHING;

-- Set demo passwords and enable login
UPDATE users SET can_login = TRUE,
  password_hash = crypt('123456', gen_salt('bf'))
WHERE email IN ('ogretmen@matnet.local','ogrenci@matnet.local');

-- Map teacher-student
WITH t AS (
  SELECT id AS teacher_id FROM users WHERE role='teacher' ORDER BY created_at LIMIT 1
), s AS (
  SELECT id AS student_id FROM users WHERE role='student' ORDER BY created_at LIMIT 1
)
INSERT INTO teacher_students (teacher_id, student_id)
SELECT t.teacher_id, s.student_id FROM t, s
ON CONFLICT DO NOTHING;

-- Topics by the teacher
WITH t AS (
  SELECT id AS teacher_id FROM users WHERE role='teacher' ORDER BY created_at LIMIT 1
)
INSERT INTO topics (name, created_by)
SELECT x.name, t.teacher_id
FROM t, (VALUES ('Temel Kavramlar'),('Fonksiyonlar'),('Trigonometri')) AS x(name)
ON CONFLICT DO NOTHING;

-- A couple of assignments (one to all, one specific)
WITH t AS (
  SELECT id AS teacher_id FROM users WHERE role='teacher' ORDER BY created_at LIMIT 1
), s AS (
  SELECT id AS student_id, name FROM users WHERE role='student' ORDER BY created_at LIMIT 1
), a1 AS (
  INSERT INTO assignments (title, due_date, created_by)
  SELECT 'Hafta 1 Ödev', CURRENT_DATE + 7, t.teacher_id FROM t
  RETURNING id
), a2 AS (
  INSERT INTO assignments (title, due_date, created_by)
  SELECT 'Trigonometri Çalışması', CURRENT_DATE + 10, t.teacher_id FROM t
  RETURNING id
)
INSERT INTO assignment_assignees (assignment_id, student_id)
SELECT a2.id, s.student_id FROM a2, s
ON CONFLICT DO NOTHING;

-- Example exam attempt for the student
WITH s AS (
  SELECT id AS student_id FROM users WHERE role='student' ORDER BY created_at LIMIT 1
)
INSERT INTO exam_attempts (student_id, taken_at, title, mat_net, total_net, duration_minutes)
SELECT s.student_id, CURRENT_DATE - 1, 'TYT Deneme', 22.5, 65.0, 135 FROM s;
