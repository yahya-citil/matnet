import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import { useAuth } from '../../lib/auth'
import { api, hasAPI } from '../../lib/api'
import { Link } from 'react-router-dom'

export default function Students() {
  const { user } = useAuth()
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  useEffect(() => {
    if (user?.role === 'teacher' && hasAPI()) {
      api.teacher.students(user).then(setRows).catch(() => {})
    }
  }, [user])
  const filtered = useMemo(() => {
    const term = q.trim().toLocaleLowerCase('tr')
    if (!term) return rows
    return rows.filter((s: any) =>
      (s.name || '').toLocaleLowerCase('tr').includes(term) ||
      (s.email || '').toLocaleLowerCase('tr').includes(term),
    )
  }, [rows, q])
  return (
    <div className="space-y-3">
      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Öğrenci ara"
          className="w-full md:w-80 rounded-lg border border-indigo-100/60 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Link key={s.id} to={`/panel/ogrenciler/${s.id}`} className="block">
            <Card className="p-4">
              <div className="font-medium text-gray-900">{s.name}</div>
              <div className="text-sm text-gray-600">{s.email}</div>
            </Card>
          </Link>
        ))}
        {!filtered.length && <div className="text-gray-600">Öğrenci bulunamadı.</div>}
      </div>
    </div>
  )
}

