import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Card from '../../components/Card'
import { useAuth } from '../../lib/auth'
import { hasAPI, api } from '../../lib/api'
import Button from '../../components/Button'
import ExamBarChart from '../../components/ExamBarChart'

export default function StudentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [exams, setExams] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [form, setForm] = useState({ taken_at: '', title: '', mat_net: '', total_net: '' })
  const [active, setActive] = useState<any | null>(null)
  const [student, setStudent] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      if (!user || user.role!=='teacher' || !id || !hasAPI()) return
      try {
        // Fetch student basic info so we can show which student page this is
        const list = await api.teacher.students(user)
        const current = Array.isArray(list) ? list.find((s:any)=> String(s.id) === String(id)) : null
        setStudent(current || null)

        const sum = await api.teacher.studentSummary(user, id)
        setExams(sum.exams || [])
        setTopics(sum.topics || [])
        setAssignments([])
        const asg = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/students/${id}/assignments`, { headers: { 'x-user-id': user.id, 'x-user-role': user.role } }).then(r=>r.json())
        setAssignments(asg)
      } catch {}
    }
    load().catch(()=>{})
  }, [user, id])

  const avgMat = exams.length ? Math.round((exams.reduce((a:any,b:any)=>a+Number(b.mat_net||0),0)/exams.length)*10)/10 : 0
  const avgProg = topics.length ? Math.round(topics.reduce((a:any,b:any)=>a+Number(b.progress||0),0)/topics.length) : 0
  const counts = assignments.reduce((acc:any,a:any)=>{ acc[a.status]=(acc[a.status]||0)+1; return acc }, {pending:0,done:0})
  const fmtDate = (v?: string) => {
    if (!v) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y,m,d]=v.split('-'); return `${d}.${m}.${y}` }
    const dt = new Date(v as any); if (!isNaN(dt.getTime())) { const dd=String(dt.getDate()).padStart(2,'0'); const mm=String(dt.getMonth()+1).padStart(2,'0'); const yy=dt.getFullYear(); return `${dd}.${mm}.${yy}` }
    return String(v)
  }

  async function addExam() {
    if (!user || !id) return
    const payload = { ...form, mat_net: Number(form.mat_net) || 0, total_net: Number(form.total_net) || 0 }
    const created = await api.teacher.addStudentExam(user, id, payload)
    setExams([created, ...exams])
    setForm({ taken_at: '', title: '', mat_net: '', total_net: '' })
  }
  async function removeExam(eid: string) {
    if (!user || !id) return
    await api.teacher.deleteStudentExam(user, id, eid).catch(()=>{})
    setExams(exams.filter((e)=>e.id!==eid))
  }

  return (
    <div className="space-y-6">
      {/* Current student info */}
      {student && (
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">Öğrenci</div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-lg font-semibold text-gray-900 truncate">{student.name}</div>
            {student.email && <div className="text-sm text-gray-600 truncate">{student.email}</div>}
          </div>
        </Card>
      )}
      {/* Top summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="text-sm text-gray-600">Ort. Mat Net</div><div className="mt-1 text-2xl font-bold text-indigo-700">{avgMat}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">Konu İlerleme Ort.</div><div className="mt-1 text-2xl font-bold text-indigo-700">{avgProg}%</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">Açık / Tamamlanan Ödev</div><div className="mt-1 text-2xl font-bold text-indigo-700">{counts.pending} / {counts.done}</div></Card>
      </div>

      <Card className="p-4 mt-4">
        <div className="font-semibold text-gray-900">Matematik Net Grafiği</div>
        <ExamBarChart data={exams.map((e:any)=>({ id: e.id, date: e.taken_at, title: e.title, mat: Number(e.mat_net) || 0 }))} />
      </Card>

      <Card className="p-4">
        <div className="font-semibold text-gray-900">Denemeler</div>
        <div className="mt-3 grid md:grid-cols-5 gap-2">
          <input value={form.taken_at} onChange={(e)=>setForm({...form, taken_at: e.target.value})} type="date" className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          <input value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} placeholder="Deneme adı" className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          <input value={form.mat_net} onChange={(e)=>setForm({...form, mat_net: e.target.value})} placeholder="Mat. Net" inputMode="decimal" className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          <input value={form.total_net} onChange={(e)=>setForm({...form, total_net: e.target.value})} placeholder="Toplam Net" inputMode="decimal" className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          <Button onClick={addExam}>Ekle</Button>
        </div>
        <ul className="mt-4 text-sm text-gray-800 space-y-1">
          {exams.map((e)=> (
            <li key={e.id} className="flex items-center justify-between">
              <span>{e.taken_at} – {e.title} · Mat: {e.mat_net} · Toplam: {e.total_net}</span>
              <button onClick={()=>removeExam(e.id)} className="text-red-600 text-xs hover:underline">Sil</button>
            </li>
          ))}
          {!exams.length && <li>Deneme yok.</li>}
        </ul>
      </Card>
      <Card className="p-4">
        <div className="font-semibold text-gray-900">Konu İlerlemesi</div>
        <ul className="mt-3 space-y-3">
          {topics.map((t, idx)=> (
            <li key={t.id} className="flex items-center gap-3">
              <div className="w-40 text-sm text-gray-800">{t.name}</div>
              <input type="range" min={0} max={100} value={t.progress} onChange={async (e)=>{
                const val = Number(e.target.value)
                const copy = [...topics]; copy[idx] = { ...t, progress: val }; setTopics(copy)
                if (user && id && hasAPI()) await api.teacher.setStudentProgress(user, id, t.id, val).catch(()=>{})
              }} className="flex-1" />
              <span className="w-12 text-right text-sm font-medium text-indigo-700">{t.progress}%</span>
            </li>
          ))}
          {!topics.length && <li className="text-gray-500">Konu yok.</li>}
        </ul>
      </Card>
      <Card className="p-4">
        <div className="font-semibold text-gray-900">Ödevler</div>
        <ul className="mt-3 text-sm text-gray-800 space-y-3">
          {assignments.map((a)=> {
            const files = Array.isArray(a.files) ? a.files : []
            return (
              <li key={a.assignment_id} className="flex items-start justify-between gap-3">
                <button onClick={()=>setActive(a)} className="flex-1 text-left hover:bg-indigo-50/50 rounded-md px-2 py-1 transition">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{a.title}</span>
                    {a.due_date && <span className="text-xs text-gray-500">(son: {fmtDate(a.due_date)})</span>}
                  </div>
                  {a.description && <div className="text-xs text-gray-600 mt-1">{a.description}</div>}
                  {files.length>0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {files.map((f:any, idx:number)=>{
                        const r = f.url || f.dataUrl
                        const link = (typeof r==='string' && r.startsWith('/')) ? `${import.meta.env.VITE_API_URL}${r}` : r
                        return <a key={f.id||idx} href={link} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 hover:underline">{f.name || `dosya-${idx+1}`}</a>
                      })}
                    </div>
                  )}
                </button>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status==='done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{a.status==='done'?'Tamamlandı':'Bekliyor'}</span>
                  <button
                    onClick={async()=>{
                      if(!user||!id) return
                      const next = a.status==='done'?'pending':'done'
                      await api.teacher.setStudentAssignmentStatus(user, id, a.assignment_id, next).catch(()=>{})
                      setAssignments(assignments.map(x=> x.assignment_id===a.assignment_id ? { ...x, status: next } : x))
                    }}
                    className="text-indigo-700 text-xs hover:underline"
                  >
                    {a.status==='done'?'Geri Al':'Tamamla'}
                  </button>
                </div>
              </li>
            )
          })}
          {!assignments.length && <li>Ödev yok.</li>}
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
                  <button onClick={()=>setActive(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                {active.due_date && (
                  <div className="mt-1 text-xs text-gray-600">son tarih: {fmtDate(active.due_date)}</div>
                )}
                <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{active.description || 'Açıklama bulunmuyor.'}</div>
                {Array.isArray(active.files) && active.files.length>0 && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-1">Ekler</div>
                    <ul className="space-y-1">
                      {active.files.map((f:any, idx:number)=>{
                        const raw = f.url || f.dataUrl
                        const href2 = (typeof raw === 'string' && raw.startsWith('/')) ? `${import.meta.env.VITE_API_URL}${raw}` : raw
                        return (
                          <li key={f.id||idx}><a href={href2} target="_blank" rel="noreferrer" className="text-sm text-indigo-700 hover:underline">{f.name || `dosya-${idx+1}`}</a></li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 flex items-center justify-center">
                {(() => {
                  const files = Array.isArray(active.files) ? active.files : []
                  const first = files.length ? files[0] : null
                  const raw = first ? (first.url || first.dataUrl) : null
                  const href3 = raw && typeof raw === 'string' && raw.startsWith('/') ? `${import.meta.env.VITE_API_URL}${raw}` : raw
                  return href3 ? (
                    <iframe src={`${href3}#toolbar=0&navpanes=0&scrollbar=0`} className="w-[420px] h-[420px] rounded-lg border border-gray-200 bg-white" />
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
