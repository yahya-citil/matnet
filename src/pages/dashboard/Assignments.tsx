import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import { useAuth } from '../../lib/auth'
import { load, save } from '../../lib/storage'
import { api, hasAPI } from '../../lib/api'

type TaskDef = {
  id: string
  title: string
  due?: string
  assignee?: string
  status?: 'pending' | 'done'
  description?: string
  files?: { name: string; url?: string; dataUrl?: string }[]
}
type DoneState = Record<string, boolean>

const KEY_DEFS = 'global:tasks'

export default function Assignments() {
  const { user } = useAuth()
  const keyDone = `tasksDone:${user?.id}`
  const [defs, setDefs] = useState<TaskDef[]>(() => load<TaskDef[]>(KEY_DEFS, []))
  const [done] = useState<DoneState>(() => load<DoneState>(keyDone, {}))
  const [active, setActive] = useState<TaskDef | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all'|'pending'|'done'>('all')

  // Keep local storage for fallback-only (no API)
  useEffect(() => { save(keyDone, done) }, [keyDone, done])

  useEffect(() => {
    if (hasAPI() && user) {
      api.me.assignments(user).then(list =>
        setDefs(
          list.map((x: any) => ({
            id: x.assignment_id,
            title: x.title,
            // due_date comes as YYYY-MM-DD (server cast). Keep as-is to avoid TZ shifts
            due: typeof x.due_date === 'string' ? x.due_date : undefined,
            status: x.status,
            description: x.description,
            files: x.files || x.attachments,
          }))
        )
      )
    }
  }, [user])

  const rows = useMemo(() => {
    const name = (user?.name || '').toLowerCase()
    const term = q.trim().toLocaleLowerCase('tr')
    return defs
      .filter(d => !d.assignee || d.assignee.toLowerCase() === name)
      .filter(d => {
        if (status==='all') return true
        const isDone = d.status ? d.status==='done' : !!done[d.id]
        return status==='done' ? isDone : !isDone
      })
      .filter(d => !term || (d.title||'').toLocaleLowerCase('tr').includes(term) || (d.description||'').toLocaleLowerCase('tr').includes(term))
  }, [defs, user, q, status, done])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900">Ödevlerim</div>
          <div className="flex items-center gap-2">
            <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 text-sm">
              <option value="all">Tümü</option>
              <option value="pending">Bekleyen</option>
              <option value="done">Tamamlanan</option>
            </select>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ara" className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 text-sm" />
          </div>
        </div>
        <ul className="mt-3 divide-y">
          {rows.map(r => {
            const isDone = r.status ? r.status === 'done' : !!done[r.id]
            const formatDue = (v?: string) => {
              if (!v) return ''
              if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y,m,d]=v.split('-'); return `${d}.${m}.${y}` }
              const dt = new Date(v as any)
              if (!isNaN(dt.getTime())) { const dd=String(dt.getDate()).padStart(2,'0'); const mm=String(dt.getMonth()+1).padStart(2,'0'); const yy=dt.getFullYear(); return `${dd}.${mm}.${yy}` }
              return String(v)
            }
            return (
              <li key={r.id}>
                <button onClick={()=>setActive(r)} className="w-full py-3 px-2 text-left hover:bg-indigo-50/60 rounded-md transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`truncate ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>{r.title}</div>
                    {r.due && <div className="text-xs text-gray-600 shrink-0">son: {formatDue(r.due)}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{isDone ? 'Tamamlandı' : 'Bekliyor'}</span>
                </button>
              </li>
            )
          })}
          {!rows.length && <li className="py-3 text-gray-500">Öğretmen tarafından atanmış ödev bulunmuyor.</li>}
        </ul>
      </Card>

      {active && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setActive(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              <div className="p-5 border-r border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-gray-900 truncate">{active.title}</div>
                  <button onClick={()=>setActive(null)} className="text-gray-500 hover:text-gray-700">Kapat</button>
                </div>
                {active.due && (
                  <div className="mt-1 text-xs text-gray-600">son tarih: {(/^\d{4}-\d{2}-\d{2}$/.test(active.due) ? (()=>{const [y,m,d]=active.due!.split('-'); return `${d}.${m}.${y}`;})() : (()=>{const dt=new Date(active.due!); const dd=String(dt.getDate()).padStart(2,'0'); const mm=String(dt.getMonth()+1).padStart(2,'0'); const yy=dt.getFullYear(); return `${dd}.${mm}.${yy}`;})())}</div>
                )}
                <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{active.description || 'Açıklama bulunmuyor.'}</div>
                {Array.isArray(active.files) && active.files.length>0 && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-1">Ekler</div>
                    <ul className="space-y-1">
                      {active.files.map((f:any, idx:number)=>{
                        const raw = f.url || f.dataUrl
                        const href = (typeof raw === 'string' && raw.startsWith('/')) ? `${import.meta.env.VITE_API_URL}${raw}` : raw
                        return (
                          <li key={idx}><a href={href} target="_blank" rel="noreferrer" className="text-sm text-indigo-700 hover:underline">{f.name || `dosya-${idx+1}`}</a></li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 flex items-center justify-center">
                {(() => {
                  const first = Array.isArray(active.files) && active.files.length ? (active.files[0] as any) : null
                  const raw = first ? (first.url || first.dataUrl) : null
                  const href = raw && typeof raw === 'string' && raw.startsWith('/') ? `${import.meta.env.VITE_API_URL}${raw}` : raw
                  return href ? (
                    <iframe src={`${href}#toolbar=0&navpanes=0&scrollbar=0`} className="w-[420px] h-[420px] rounded-lg border border-gray-200 bg-white" />
                  ) : (
                    <div className="text-sm text-gray-500">Önizleme için PDF bulunmuyor.</div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

