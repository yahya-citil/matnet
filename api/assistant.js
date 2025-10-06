import { query } from './db.js'

function hasLLM() {
  return !!process.env.OPENAI_API_KEY
}

let _client = null
async function getClient() {
  if (!hasLLM()) return null
  if (_client) return _client
  try {
    const { default: OpenAI } = await import('openai')
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined })
    return _client
  } catch {
    return null
  }
}

export async function extractIntent(text) {
  const client = await getClient()
  if (!client) return null
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'
  const sys = `You are an assistant that extracts intent from Turkish natural language into strict JSON.
  Return only valid JSON. No prose.
  Schema:
{
  "action": "list_assignments" | "list_exams" | "list_students" | "count_students" | "list_topics" | "count_assignments" | "list_teacher_assignments" | "create_assignment" | "assign_students",
  "student_name": string | null,
  "status": "done" | "pending" | "all" | null,
  "title": string | null,
  "due_date": string | null,
  "description": string | null,
  "assignment_ref": string | null,
  "student_names": string[] | null,
  "date_from": string | null,
  "date_to": string | null
}
  Rules:
  - If user asks for assignments (ödev), action is list_assignments.
  - If user asks for exam scores/nets (deneme, sınav, net), action is list_exams.
  - If user asks who are the students / list of students (öğrenciler, öğrencilerimiz kimler), action is list_students.
  - If user asks how many students (kaç öğrencimiz var, öğrenci sayısı), action is count_students.
  - If user asks about topics (konular, konu listesi), action is list_topics.
  - If user asks how many active assignments we have (aktif ödev sayısı), action is count_assignments.
  - Guess student_name from phrases like "Öğrenci <Ad>" else null.
  - Map words: tamamlanan/biten => done; bekleyen/açık => pending; otherwise all.`
  const user = text || ''
  // Ollama's OpenAI-compatible endpoint may not support response_format.
  // Detect Ollama by env or base URL and omit response_format for compatibility.
  const base = process.env.OPENAI_BASE_URL || ''
  const provider = (process.env.LLM_PROVIDER || (base.includes('11434') ? 'ollama' : 'openai')).toLowerCase()
  const req = {
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
  }
  if (provider !== 'ollama') {
    // Use JSON mode only when supported
    req.response_format = { type: 'json_object' }
  }
  let r
  try {
    r = await client.chat.completions.create({ ...req, stream: false })
  } catch {
    return null
  }
  let content = r.choices?.[0]?.message?.content || ''
  if (!content && r.choices?.[0]?.message?.tool_calls?.length) {
    // Not expected here, but keep a fallback
    content = r.choices[0].message.tool_calls[0].function?.arguments || ''
  }
  // Strip code fences if any
  content = String(content).trim().replace(/^```json\s*([\s\S]*?)\s*```$/i, '$1')
  try {
    return JSON.parse(content)
  } catch {
    // Last resort: try to extract first JSON object
    const m = content.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch {}
    }
    return null
  }
}

export async function handleAssistantQuery(req, res) {
  if (req.userRole !== 'teacher') return res.status(403).json({ error: 'forbidden' })
  const { text } = req.body || {}
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' })

  const intent = await extractIntent(text)
  if (!intent || !intent.action) {
    return res.status(200).json({ message: 'unsupported', result: { kind: 'none' } })
  }
  const name = (intent.student_name || '').trim().toLowerCase()
  // Find teacher's students
  const st = await query(
    'SELECT u.id, u.name FROM teacher_students ts JOIN users u ON u.id=ts.student_id WHERE ts.teacher_id=$1',
    [req.userId],
  )
  let target = null
  if (name) target = st.rows.find((s) => s.name.toLowerCase().includes(name)) || null
  // Handle actions that don't require a specific student
  if (intent.action === 'list_students') {
    const st = await query(
      'SELECT u.id, u.name, u.email FROM teacher_students ts JOIN users u ON u.id=ts.student_id WHERE ts.teacher_id=$1',
      [req.userId],
    )
    return res.json({ result: { kind: 'students', items: st.rows } })
  }
  if (intent.action === 'count_students') {
    const st = await query('SELECT COUNT(*)::int AS cnt FROM teacher_students WHERE teacher_id=$1', [req.userId])
    const cnt = st.rows?.[0]?.cnt || 0
    return res.json({ result: { kind: 'count', scope: 'students', value: cnt } })
  }

  if (intent.action === 'list_topics') {
    const r = await query('SELECT id, name FROM topics WHERE created_by=$1 AND is_active ORDER BY position NULLS LAST, created_at', [req.userId])
    return res.json({ result: { kind: 'topics', items: r.rows } })
  }
  if (intent.action === 'count_assignments') {
    const r = await query('SELECT COUNT(*)::int AS cnt FROM assignments WHERE created_by=$1 AND is_active', [req.userId])
    const cnt = r.rows?.[0]?.cnt || 0
    return res.json({ result: { kind: 'count', scope: 'assignments', value: cnt } })
  }

  if (intent.action === 'list_teacher_assignments') {
    let sql = `SELECT id, title, due_date::text AS due_date, description FROM assignments WHERE created_by=$1 AND is_active`
    const params = [req.userId]
    if (intent.date_from) { sql += ` AND due_date >= $${params.length+1}`; params.push(intent.date_from) }
    if (intent.date_to) { sql += ` AND due_date <= $${params.length+1}`; params.push(intent.date_to) }
    sql += ' ORDER BY due_date NULLS LAST, created_at DESC'
    const r = await query(sql, params)
    return res.json({ result: { kind: 'teacher_assignments', items: r.rows } })
  }

  if (intent.action === 'create_assignment') {
    const title = (intent.title || '').trim()
    if (!title) return res.json({ result: { kind: 'error', message: 'title_required' } })
    const due = intent.due_date || null
    const desc = intent.description || null
    const r = await query('INSERT INTO assignments (title, due_date, description, created_by) VALUES ($1,$2,$3,$4) RETURNING id, title, due_date::text AS due_date, description', [title, due, desc, req.userId])
    return res.json({ result: { kind: 'created_assignment', item: r.rows[0] } })
  }

  if (intent.action === 'assign_students') {
    const aref = (intent.assignment_ref || '').trim().toLowerCase()
    const names = Array.isArray(intent.student_names) ? intent.student_names : []
    if (!aref || !names.length) return res.json({ result: { kind: 'error', message: 'assignment_or_students_required' } })
    const ra = await query('SELECT id, title FROM assignments WHERE created_by=$1 AND (lower(title)=lower($2) OR id::text=$2) LIMIT 1', [req.userId, aref])
    if (!ra.rows.length) return res.json({ result: { kind: 'error', message: 'assignment_not_found' } })
    const aid = ra.rows[0].id
    const stAll = await query('SELECT u.id, u.name FROM teacher_students ts JOIN users u ON u.id=ts.student_id WHERE ts.teacher_id=$1', [req.userId])
    const selected = stAll.rows.filter(s => names.some(n => s.name.toLowerCase().includes(String(n).toLowerCase())))
    for (const s of selected) {
      await query('INSERT INTO assignment_assignees (assignment_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [aid, s.id])
    }
    return res.json({ result: { kind: 'assigned', assignmentId: aid, count: selected.length, students: selected } })
  }

  if (!target) return res.status(200).json({ message: 'student_not_found', result: { kind: 'none' } })

  if (intent.action === 'list_assignments') {
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
    const r = await query(sql, [target.id])
    let items = r.rows.map((x) => ({ ...x, files: Array.isArray(x.files) ? x.files : JSON.parse(x.files || '[]') }))
    if (intent.status && intent.status !== 'all') items = items.filter((a) => a.status === intent.status)
    return res.json({ result: { kind: 'assignments', studentId: target.id, studentName: target.name, status: intent.status || 'all', items } })
  }

  if (intent.action === 'list_exams') {
    const r = await query('SELECT id, taken_at, title, mat_net, total_net FROM exam_attempts WHERE student_id=$1 ORDER BY taken_at DESC, created_at DESC', [target.id])
    return res.json({ result: { kind: 'exams', studentId: target.id, studentName: target.name, items: r.rows } })
  }

  return res.status(200).json({ message: 'unsupported', result: { kind: 'none' } })
}
