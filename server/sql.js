import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { query } from './db.js'

function read(file) {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function splitSql(sql) {
  const out = []
  let buf = ''
  let inSingle = false
  let inDouble = false
  let inDollar = false
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next2 = sql.slice(i, i + 2)
    if (!inSingle && !inDouble && next2 === '$$') {
      inDollar = !inDollar
      buf += next2
      i++
      continue
    }
    if (!inDollar) {
      if (!inDouble && ch === "'" && sql[i - 1] !== '\\') inSingle = !inSingle
      else if (!inSingle && ch === '"' && sql[i - 1] !== '\\') inDouble = !inDouble
    }
    if (ch === ';' && !inSingle && !inDouble && !inDollar) {
      const trimmed = buf.trim()
      if (trimmed) out.push(trimmed)
      buf = ''
    } else {
      buf += ch
    }
  }
  const last = buf.trim()
  if (last) out.push(last)
  return out
}

export async function applySchema() {
  const sql = read('db/schema.sql')
  const parts = splitSql(sql)
  for (const s of parts) {
    try {
      await query(s)
    } catch (e) {
      console.error('Failed SQL:', s)
      throw e
    }
  }
}

export async function applySeed({ withTwoStudents = true } = {}) {
  let sql = read('db/seed.sql')
  if (withTwoStudents) {
    // ensure there are at least two students
    const extra = `
DO $$
DECLARE t UUID; s1 UUID; s2 UUID; BEGIN
  SELECT id INTO t FROM users WHERE role='teacher' ORDER BY created_at LIMIT 1;
  IF t IS NOT NULL THEN
    INSERT INTO users (name, email, role) VALUES ('Öğrenci Demo 2', 'ogrenci2@matnet.local', 'student')
      ON CONFLICT DO NOTHING RETURNING id INTO s2;
    IF s2 IS NULL THEN SELECT id INTO s2 FROM users WHERE email='ogrenci2@matnet.local'; END IF;
    UPDATE users SET can_login=TRUE, password_hash=crypt('123456', gen_salt('bf')) WHERE id=s2;
    INSERT INTO teacher_students (teacher_id, student_id) VALUES (t, s2) ON CONFLICT DO NOTHING;
  END IF;
END $$;`
    sql = sql + '\n' + extra
  }
  const parts = splitSql(sql)
  for (const s of parts) {
    try {
      await query(s)
    } catch (e) {
      console.error('Failed SQL (seed):', s)
      throw e
    }
  }
}
