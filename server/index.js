import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from './db.js'
import { applySchema, applySeed } from './sql.js'
import path from 'node:path'
import fs from 'node:fs'
import multer from 'multer'
import { handleAssistantQuery } from './assistant.js'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
// Early header reader so routes defined above main middleware can access user headers
app.use((req, _res, next) => {
  if (req.userId == null) req.userId = req.header('x-user-id') || null
  if (req.userRole == null) req.userRole = req.header('x-user-role') || null
  next()
})
// Static files for uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// Multer setup for assignment files (PDF only)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ts = Date.now()
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]+/g, '_')
    cb(null, `${ts}_${safe}`)
  },
})
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const okMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf'
    const okExt = (file.originalname || '').toLowerCase().endsWith('.pdf')
    if (okMime || okExt) cb(null, true)
    else cb(new Error('Only PDF files are allowed'))
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Assistant (LLM-backed intent → data)
app.post('/api/assistant/query', async (req, res) => {
  try {
    await handleAssistantQuery(req, res)
  } catch (e) {
    console.error('Assistant error:', e)
    res.status(500).json({ error: 'assistant_failed' })
  }
})

// Setup routes
app.post('/api/setup', async (_req, res) => {
  await applySchema()
  res.json({ ok: true })
})
app.post('/api/seed', async (_req, res) => {
  await applySeed({ withTwoStudents: true })
  res.json({ ok: true })
})

// Auth (very simple): login by email
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const r = await query(
    `SELECT id, name, email, role
       FROM users
      WHERE lower(email)=lower($1)
        AND can_login = TRUE
        AND password_hash = crypt($2, password_hash)
      LIMIT 1`,
    [email, password],
  )
  if (!r.rows.length) return res.status(401).json({ error: 'invalid_credentials' })
  res.json(r.rows[0])
})

// Middleware to read user id header
app.use((req, res, next) => {
  req.userId = req.header('x-user-id') || null
  req.userRole = req.header('x-user-role') || null
  next()
})

// Student endpoints
app.get('/api/me/assignments', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'unauthorized' })
  const sql = `
    SELECT v.student_id,
           v.assignment_id,
           v.title,
           v.due_date::text AS due_date,
           v.created_by,
           v.status,
           v.completed_at,
           a.description,
           COALESCE(
             json_agg(json_build_object('id', f.id, 'name', f.original_name, 'url', f.url))
             FILTER (WHERE f.id IS NOT NULL), '[]'::json
           ) AS files
      FROM v_student_assignments v
      JOIN assignments a ON a.id = v.assignment_id
      LEFT JOIN assignment_files f ON f.assignment_id = v.assignment_id
     WHERE v.student_id = $1
     GROUP BY v.student_id, v.assignment_id, v.title, v.due_date, v.created_by, v.status, v.completed_at, a.description
     ORDER BY v.due_date NULLS LAST, v.assignment_id`;
  const r = await query(sql, [req.userId])
  const rows = r.rows.map((x) => ({
    ...x,
    files: Array.isArray(x.files) ? x.files : JSON.parse(x.files || '[]'),
  }))
  res.json(rows)
})

// Students can no longer set their own assignment status
app.patch('/api/me/assignments/:id', async (_req, res) => {
  return res.status(403).json({ error: 'forbidden' })
})

app.get('/api/me/topics', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'unauthorized' })
  const teacherIds = await query('SELECT teacher_id FROM teacher_students WHERE student_id=$1', [req.userId])
  if (!teacherIds.rows.length) return res.json([])
  const tIds = teacherIds.rows.map((r) => r.teacher_id)
  const r = await query(
    `SELECT t.id, t.name, COALESCE(tp.progress,0) AS progress
     FROM topics t
     LEFT JOIN topic_progress tp ON tp.topic_id=t.id AND tp.student_id=$1
     WHERE t.created_by = ANY($2)
     ORDER BY t.position NULLS LAST, t.created_at`,
    [req.userId, tIds],
  )
  res.json(r.rows)
})

// Student summary: last exams, topics with progress, assignment counts
app.get('/api/me/summary', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'unauthorized' })
  const exams = await query(
    'SELECT id, taken_at, title, mat_net, total_net FROM exam_attempts WHERE student_id=$1 ORDER BY taken_at DESC, created_at DESC LIMIT 5',
    [req.userId],
  )
  const topics = await query(
    `SELECT t.id, t.name, COALESCE(tp.progress,0) AS progress
     FROM topics t
     LEFT JOIN topic_progress tp ON tp.topic_id=t.id AND tp.student_id=$1
     WHERE t.created_by IN (SELECT teacher_id FROM teacher_students WHERE student_id=$1)
     ORDER BY t.position NULLS LAST, t.created_at`,
    [req.userId],
  )
  const asg = await query(
    'SELECT status, COUNT(*)::int cnt FROM v_student_assignments WHERE student_id=$1 GROUP BY status',
    [req.userId],
  )
  const counts = { pending: 0, done: 0 }
  asg.rows.forEach((r) => (counts[r.status] = Number(r.cnt)))
  res.json({ exams: exams.rows, topics: topics.rows, assignments: counts })
})

app.put('/api/me/topics/:id/progress', async (req, res) => {
  // Disabled: students cannot update topic progress anymore
  return res.status(403).json({ error: 'forbidden' })
})

app.get('/api/me/exams', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'unauthorized' })
  const r = await query('SELECT * FROM exam_attempts WHERE student_id=$1 ORDER BY taken_at DESC, created_at DESC', [req.userId])
  res.json(r.rows)
})
app.post('/api/me/exams', async (req, res) => {
  // Students can no longer add exams; only teachers can add for a student
  return res.status(403).json({ error: 'forbidden' })
})
app.delete('/api/me/exams/:id', async (req, res) => {
  // Students cannot delete exams anymore
  return res.status(403).json({ error: 'forbidden' })
})

// Teacher endpoints
function requireTeacher(req, res, next) {
  if (req.userRole !== 'teacher') return res.status(403).json({ error: 'forbidden' })
  next()
}

app.get('/api/teacher/students', requireTeacher, async (req, res) => {
  const r = await query(
    'SELECT u.* FROM teacher_students ts JOIN users u ON u.id=ts.student_id WHERE ts.teacher_id=$1',
    [req.userId],
  )
  res.json(r.rows)
})

// Teacher: read student's data (only if linked)
async function ensureLink(teacherId, studentId) {
  const r = await query('SELECT 1 FROM teacher_students WHERE teacher_id=$1 AND student_id=$2', [teacherId, studentId])
  return !!r.rows.length
}

app.get('/api/teacher/students/:sid/exams', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const r = await query('SELECT * FROM exam_attempts WHERE student_id=$1 ORDER BY taken_at DESC', [sid])
  res.json(r.rows)
})
app.post('/api/teacher/students/:sid/exams', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const { taken_at, title, mat_net, total_net, duration_minutes } = req.body || {}
  const r = await query(
    `INSERT INTO exam_attempts (student_id, taken_at, title, mat_net, total_net, duration_minutes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sid, taken_at, title, mat_net, total_net, duration_minutes],
  )
  res.json(r.rows[0])
})
app.delete('/api/teacher/students/:sid/exams/:id', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  const id = req.params.id
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  await query('DELETE FROM exam_attempts WHERE id=$1 AND student_id=$2', [id, sid])
  res.json({ ok: true })
})
app.get('/api/teacher/students/:sid/assignments', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const sql = `
    SELECT v.student_id,
           v.assignment_id,
           v.title,
           v.due_date::text AS due_date,
           v.created_by,
           v.status,
           v.completed_at,
           a.description,
           COALESCE(
             json_agg(json_build_object('id', f.id, 'name', f.original_name, 'url', f.url))
             FILTER (WHERE f.id IS NOT NULL), '[]'::json
           ) AS files
      FROM v_student_assignments v
      JOIN assignments a ON a.id = v.assignment_id
      LEFT JOIN assignment_files f ON f.assignment_id = v.assignment_id
     WHERE v.student_id = $1
     GROUP BY v.student_id, v.assignment_id, v.title, v.due_date, v.created_by, v.status, v.completed_at, a.description
     ORDER BY v.due_date NULLS LAST, v.assignment_id`;
  const r = await query(sql, [sid])
  const rows = r.rows.map((x) => ({
    ...x,
    files: Array.isArray(x.files) ? x.files : JSON.parse(x.files || '[]'),
  }))
  res.json(rows)
})
app.put('/api/teacher/students/:sid/assignments/:aid/status', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  const aid = req.params.aid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const { status } = req.body || {}
  if (!['pending', 'done'].includes(status)) return res.status(400).json({ error: 'invalid status' })
  await query(
    `INSERT INTO assignment_status (assignment_id, student_id, status, completed_at)
     VALUES ($1,$2,$3, CASE WHEN $3='done' THEN now() ELSE NULL END)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET status=EXCLUDED.status, completed_at=EXCLUDED.completed_at`,
    [aid, sid, status],
  )
  res.json({ ok: true })
})
app.get('/api/teacher/students/:sid/topics', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const r = await query(
    `SELECT t.id, t.name, COALESCE(tp.progress,0) AS progress
     FROM topics t
     LEFT JOIN topic_progress tp ON tp.topic_id=t.id AND tp.student_id=$1
     WHERE t.created_by=$2
     ORDER BY t.position NULLS LAST, t.created_at`,
    [sid, req.userId],
  )
  res.json(r.rows)
})

// Teacher view: summary for a student
app.get('/api/teacher/students/:sid/summary', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const exams = await query(
    'SELECT id, taken_at, title, mat_net, total_net FROM exam_attempts WHERE student_id=$1 ORDER BY taken_at DESC, created_at DESC LIMIT 5',
    [sid],
  )
  const topics = await query(
    `SELECT t.id, t.name, COALESCE(tp.progress,0) AS progress
     FROM topics t
     LEFT JOIN topic_progress tp ON tp.topic_id=t.id AND tp.student_id=$1
     WHERE t.created_by=$2
     ORDER BY t.position NULLS LAST, t.created_at`,
    [sid, req.userId],
  )
  const asg = await query(
    'SELECT status, COUNT(*)::int cnt FROM v_student_assignments WHERE student_id=$1 GROUP BY status',
    [sid],
  )
  const counts = { pending: 0, done: 0 }
  asg.rows.forEach((r) => (counts[r.status] = Number(r.cnt)))
  res.json({ exams: exams.rows, topics: topics.rows, assignments: counts })
})

app.put('/api/teacher/students/:sid/topics/:tid/progress', requireTeacher, async (req, res) => {
  const sid = req.params.sid
  const tid = req.params.tid
  if (!(await ensureLink(req.userId, sid))) return res.status(403).json({ error: 'forbidden' })
  const { progress } = req.body || {}
  const p = Math.max(0, Math.min(100, Number(progress) || 0))
  await query(
    `INSERT INTO topic_progress (student_id, topic_id, progress, updated_at)
     VALUES ($1,$2,$3, now())
     ON CONFLICT (student_id, topic_id)
     DO UPDATE SET progress=EXCLUDED.progress, updated_at=now()`,
    [sid, tid, p],
  )
  res.json({ ok: true })
})

app.get('/api/teacher/topics', requireTeacher, async (req, res) => {
  const r = await query('SELECT * FROM topics WHERE created_by=$1 AND is_active ORDER BY position NULLS LAST, created_at', [req.userId])
  res.json(r.rows)
})
app.post('/api/teacher/topics', requireTeacher, async (req, res) => {
  const { name } = req.body || {}
  const next = await query('SELECT COALESCE(MAX(position),0)+1 AS pos FROM topics WHERE created_by=$1', [req.userId])
  const pos = next.rows[0].pos
  const r = await query(
    'INSERT INTO topics (name, created_by, position) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING *',
    [name, req.userId, pos],
  )
  res.json(r.rows[0] || null)
})
app.put('/api/teacher/topics/:id', requireTeacher, async (req, res) => {
  const { name } = req.body || {}
  const id = req.params.id
  const r = await query('UPDATE topics SET name=$1 WHERE id=$2 AND created_by=$3 RETURNING *', [name, id, req.userId])
  if (!r.rows.length) return res.status(404).json({ error: 'not_found' })
  res.json(r.rows[0])
})
app.delete('/api/teacher/topics/:id', requireTeacher, async (req, res) => {
  await query('DELETE FROM topics WHERE id=$1 AND created_by=$2', [req.params.id, req.userId])
  res.json({ ok: true })
})
app.put('/api/teacher/topics/reorder', requireTeacher, async (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' })
  await query(
    `WITH data AS (
       SELECT * FROM unnest($1::uuid[]) WITH ORDINALITY AS t(id,pos)
     )
     UPDATE topics t SET position = d.pos
     FROM data d
     WHERE t.id = d.id AND t.created_by = $2`,
    [ids, req.userId],
  )
  res.json({ ok: true })
})

app.get('/api/teacher/assignments', requireTeacher, async (req, res) => {
  const sql = `
    SELECT a.id, a.title, a.due_date::text AS due_date, a.created_by, a.is_active, a.created_at, a.description,
           COALESCE(
             json_agg(json_build_object('id', f.id, 'name', f.original_name, 'url', f.url))
             FILTER (WHERE f.id IS NOT NULL), '[]'::json
           ) AS files,
           (
             SELECT COALESCE(
               json_agg(json_build_object('id', u.id, 'name', u.name))
               FILTER (WHERE u.id IS NOT NULL), '[]'::json
             )
             FROM assignment_assignees aa
             JOIN users u ON u.id = aa.student_id
             WHERE aa.assignment_id = a.id
           ) AS assignees
      FROM assignments a
      LEFT JOIN assignment_files f ON f.assignment_id = a.id
     WHERE a.created_by = $1 AND a.is_active
     GROUP BY a.id
     ORDER BY a.due_date NULLS LAST, a.created_at DESC`;
  const r = await query(sql, [req.userId])
  const rows = r.rows.map((x) => ({
    ...x,
    files: Array.isArray(x.files) ? x.files : JSON.parse(x.files || '[]'),
    assignees: Array.isArray(x.assignees) ? x.assignees : JSON.parse(x.assignees || '[]'),
  }))
  res.json(rows)
})
app.post('/api/teacher/assignments', requireTeacher, async (req, res) => {
  const { title, due_date, description } = req.body || {}
  const r = await query(
    'INSERT INTO assignments (title, due_date, description, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
    [title, due_date, description ?? null, req.userId],
  )
  res.json(r.rows[0])
})
app.put('/api/teacher/assignments/:id', requireTeacher, async (req, res) => {
  const { title, due_date, description } = req.body || {}
  const id = req.params.id
  const r = await query(
    'UPDATE assignments SET title=COALESCE($1,title), due_date=$2, description=COALESCE($3,description) WHERE id=$4 AND created_by=$5 RETURNING *',
    [title ?? null, due_date ?? null, description ?? null, id, req.userId],
  )
  if (!r.rows.length) return res.status(404).json({ error: 'not_found' })
  res.json(r.rows[0])
})
app.delete('/api/teacher/assignments/:id', requireTeacher, async (req, res) => {
  await query('DELETE FROM assignments WHERE id=$1 AND created_by=$2', [req.params.id, req.userId])
  res.json({ ok: true })
})
app.post('/api/teacher/assignments/:id/assignees', requireTeacher, async (req, res) => {
  const { studentIds = [] } = req.body || {}
  for (const sid of studentIds) {
    await query('INSERT INTO assignment_assignees (assignment_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
      req.params.id,
      sid,
    ])
  }
  res.json({ ok: true })
})

// Remove a specific assignee from an assignment
app.delete('/api/teacher/assignments/:id/assignees/:sid', requireTeacher, async (req, res) => {
  const { id, sid } = req.params
  // Verify ownership
  const can = await query('SELECT 1 FROM assignments WHERE id=$1 AND created_by=$2', [id, req.userId])
  if (!can.rows.length) return res.status(403).json({ error: 'forbidden' })
  await query('DELETE FROM assignment_assignees WHERE assignment_id=$1 AND student_id=$2', [id, sid])
  res.json({ ok: true })
})

// Upload assignment files (PDF only)
app.post('/api/teacher/assignments/:id/files', requireTeacher, upload.array('files', 10), async (req, res) => {
  const id = req.params.id
  // Verify ownership
  const can = await query('SELECT 1 FROM assignments WHERE id=$1 AND created_by=$2', [id, req.userId])
  if (!can.rows.length) return res.status(403).json({ error: 'forbidden' })
  const files = req.files || []
  const saved = []
  for (const f of files) {
    const url = `/uploads/${path.basename(f.path)}`
    const r = await query(
      'INSERT INTO assignment_files (assignment_id, original_name, mime_type, file_size, url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, f.originalname, f.mimetype, f.size, url],
    )
    saved.push(r.rows[0])
  }
  res.json(saved)
})

// Delete an assignment file
app.delete('/api/teacher/assignments/:id/files/:fid', requireTeacher, async (req, res) => {
  const { id, fid } = req.params
  const can = await query('SELECT 1 FROM assignments WHERE id=$1 AND created_by=$2', [id, req.userId])
  if (!can.rows.length) return res.status(403).json({ error: 'forbidden' })
  const r = await query('DELETE FROM assignment_files WHERE id=$1 AND assignment_id=$2 RETURNING url', [fid, id])
  if (!r.rows.length) return res.status(404).json({ error: 'not_found' })
  // Best-effort unlink
  try {
    const p = r.rows[0].url
    if (typeof p === 'string' && p.startsWith('/uploads/')) {
      fs.unlinkSync(path.join(uploadsDir, path.basename(p)))
    }
  } catch {}
  res.json({ ok: true })
})

// Global error handler (including multer errors)
// Must be after routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Upload/API error:', err)
  const msg = err?.message || 'internal_error'
  const status = /Only PDF/.test(msg) ? 400 : 500
  res.status(status).json({ error: msg })
})

const port = Number(process.env.PORT || 5174)
app.listen(port, () => console.log(`API running on http://localhost:${port}`))
