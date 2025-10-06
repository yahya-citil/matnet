import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import Button from './Button'
import { useAuth } from '../lib/auth'
import { api, hasAPI } from '../lib/api'

type Msg = { role: 'user' | 'assistant'; text: string }
type Result =
  | { kind: 'none' }
  | { kind: 'assignments'; studentId: string; studentName: string; status?: 'done' | 'pending'; items: any[] }
  | { kind: 'exams'; studentId: string; studentName: string; items: any[] }
  | { kind: 'students'; items: any[] }
  | { kind: 'count'; scope: 'students'; value: number }
  | { kind: 'count'; scope: 'assignments'; value: number }
  | { kind: 'topics'; items: any[] }
  | { kind: 'teacher_assignments'; items: any[] }
  | { kind: 'created_assignment'; item: any }
  | { kind: 'assigned'; assignmentId: string; count: number; students: any[] }
  | { kind: 'error'; message: string }

function norm(s: string) {
  return s.toLocaleLowerCase('tr').replace(/[\s]+/g, ' ').trim()
}

function parseQuery(q: string): { intent: 'assignments' | 'exams' | 'students' | 'count_students' | 'topics' | 'count_assignments' | 'teacher_assignments'; student?: string; status?: 'done' | 'pending' } | null {
  const t = norm(q)
  // examples: "Öğrenci Demo'nun tamamlanan ödevlerini göster"
  const isAssignments = /\bödev|assign|odev/.test(t)
  const isExams = /\bnet|deneme|sınav|sinav/.test(t)
  const mentionsStudents = /\böğrenci|öğrenciler\b/.test(t)
  const asksCount = /kaç|sayısı|sayi|adet/.test(t)
  const isTopics = /\bkonu|konular\b/.test(t)
  const isAssignmentsCount = /\bödev sayısı|aktif ödev|ödevler kaç\b/.test(t)
  const isTeachAsg = /\bödevlerimi|ödev listem|tüm ödevler(imi)?\b/.test(t)
  if (!isAssignments && !isExams && !mentionsStudents && !isTopics && !isAssignmentsCount && !isTeachAsg) return null
  let status: 'done' | 'pending' | undefined
  if (/tamamlanan|biten|done/.test(t)) status = 'done'
  if (/bekleyen|açık|pending/.test(t)) status = 'pending'
  // try to extract student name after "öğrenci" token
  let student: string | undefined
  const m = t.match(/öğrenci\s+([^'\s][^\n]+?)(?:'n|\s+için|\s+ödev|\s+odev|\s+tamamlanan|\s+bekleyen|$)/)
  if (m && m[1]) student = m[1].trim()
  if (mentionsStudents && !isAssignments && !isExams) {
    return { intent: asksCount ? 'count_students' : 'students' }
  }
  if (isTopics) return { intent: 'topics' }
  if (isAssignmentsCount) return { intent: 'count_assignments' }
  if (isTeachAsg) return { intent: 'teacher_assignments' }
  return { intent: isExams ? 'exams' : 'assignments', student, status }
}

export default function AssistantPanel() {
  const { user } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>({ kind: 'none' })
  const [source, setSource] = useState<'ai'|'fallback'|null>(null)
  const [requireAI, setRequireAI] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [students, setStudents] = useState<any[]>([])
  useEffect(()=>{
    if (hasAPI() && user?.role==='teacher') {
      api.teacher.students(user as any).then(setStudents).catch(()=>{})
    }
  },[user])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [msgs])

  const canUse = hasAPI() && user?.role === 'teacher'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input
    setMsgs((m) => [...m, { role: 'user', text }])
    setInput('')
    if (!canUse) {
      setMsgs((m) => [...m, { role: 'assistant', text: 'API kapalı ya da öğretmen değilsiniz.' }])
      return
    }
    setLoading(true)
    try {
      // Try LLM endpoint first
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': (user as any).id,
          'x-user-role': (user as any).role,
        },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.result?.kind === 'assignments') {
          setMsgs((m) => [...m, { role: 'assistant', text: `${data.result.studentName} için ödevler listelendi.` }])
          setResult({ ...data.result, kind: 'assignments' })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'exams') {
          setMsgs((m) => [...m, { role: 'assistant', text: `${data.result.studentName} için denemeler/netler listelendi.` }])
          setResult({ ...data.result, kind: 'exams' })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'students') {
          setMsgs((m) => [...m, { role: 'assistant', text: `Öğrenciler listelendi.` }])
          setResult({ kind: 'students', items: data.result.items || [] })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'topics') {
          setMsgs((m) => [...m, { role: 'assistant', text: `Konular listelendi.` }])
          setResult({ kind: 'topics', items: data.result.items || [] })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'count') {
          const scope = data.result.scope
          const val = Number(data.result.value||0)
          setMsgs((m) => [...m, { role: 'assistant', text: `${scope==='students'?'Öğrenci':'Ödev'} sayısı: ${val}` }])
          setResult({ kind: 'count', scope, value: val })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'teacher_assignments') {
          setMsgs((m)=>[...m,{ role:'assistant', text: 'Ödevleriniz listelendi.' }])
          setResult({ kind:'teacher_assignments', items: data.result.items||[] })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'created_assignment') {
          setMsgs((m)=>[...m,{ role:'assistant', text: `Ödev oluşturuldu: ${data.result.item?.title||''}` }])
          setResult({ kind:'created_assignment', item: data.result.item })
          setSource('ai')
          return
        }
        if (data?.result?.kind === 'assigned') {
          setMsgs((m)=>[...m,{ role:'assistant', text: `Ödev ${data.result.count} öğrenciye atandı.` }])
          setResult({ kind:'assigned', assignmentId: data.result.assignmentId, count: data.result.count, students: data.result.students||[] })
          setSource('ai')
          return
        }
      }
      // Fallback: local parser
      if (requireAI) {
        setMsgs((m) => [...m, { role: 'assistant', text: 'AI kullanılabilir değil (LLM). Lütfen daha sonra tekrar deneyin.' }])
        setResult({ kind: 'none' })
        setSource(null)
        return
      }
      const intent = parseQuery(text)
      if (!intent) {
        setMsgs((m) => [...m, { role: 'assistant', text: 'Bu isteği anlayamadım. Örnek: "Öğrenci Demo\'nun tamamlanan ödevlerini göster"' }])
        setResult({ kind: 'none' })
        setSource(null)
        return
      }
      const students = await api.teacher.students(user as any)
      let target = null
      if (intent.student) {
        const qname = norm(intent.student)
        target = students.find((s: any) => norm(s.name).includes(qname))
      }
      if (!target) {
        setMsgs((m) => [...m, { role: 'assistant', text: 'Öğrenci bulunamadı. Lütfen tam ad ile tekrar deneyin.' }])
        setResult({ kind: 'none' })
        setSource(null)
        return
      }
      if (intent.intent === 'students') {
        const st = await api.teacher.students(user as any)
        setMsgs((m) => [...m, { role: 'assistant', text: `Öğrenciler listelendi.` }])
        setResult({ kind: 'students', items: st })
        setSource('fallback')
      } else if (intent.intent === 'count_students') {
        const st = await api.teacher.students(user as any)
        setMsgs((m) => [...m, { role: 'assistant', text: `Öğrenci sayısı: ${st.length}` }])
        setResult({ kind: 'count', scope: 'students', value: st.length })
        setSource('fallback')
      } else if (intent.intent === 'topics') {
        const r = await api.teacher.topics(user as any)
        setMsgs((m)=>[...m,{role:'assistant', text:'Konular listelendi.'}])
        setResult({ kind:'topics', items:r })
        setSource('fallback')
      } else if (intent.intent === 'count_assignments') {
        const r = await api.teacher.assignments(user as any)
        setMsgs((m)=>[...m,{role:'assistant', text:`Ödev sayısı: ${r.length}`}])
        setResult({ kind:'count', scope:'assignments', value:r.length })
        setSource('fallback')
      } else if (intent.intent === 'assignments') {
        const asg = await api.teacher.studentAssignments(user as any, target.id)
        const items = Array.isArray(asg) ? asg.filter((a: any) => (intent.status ? a.status === intent.status : true)) : []
        setMsgs((m) => [...m, { role: 'assistant', text: `${target.name} için ödevler listelendi.` }])
        setResult({ kind: 'assignments', studentId: target.id, studentName: target.name, status: intent.status, items })
        setSource('fallback')
      } else {
        const ex = await api.teacher.studentExams(user as any, target.id)
        setMsgs((m) => [...m, { role: 'assistant', text: `${target.name} için denemeler/netler listelendi.` }])
        setResult({ kind: 'exams', studentId: target.id, studentName: target.name, items: ex })
        setSource('fallback')
      }
    } catch (e) {
      // Network/API hatası: yerel ayrıştırıcıya düş
      try {
        const intent = parseQuery(text)
        if (!intent) {
          setMsgs((m) => [...m, { role: 'assistant', text: 'Bu isteği anlayamadım.' }])
          setResult({ kind: 'none' })
          setSource(null)
        } else {
          const students = await api.teacher.students(user as any)
          const qname = intent.student ? norm(intent.student) : ''
          const target = qname ? students.find((s: any) => norm(s.name).includes(qname)) : null
          if (!target) {
            setMsgs((m) => [...m, { role: 'assistant', text: 'Öğrenci bulunamadı.' }])
            setResult({ kind: 'none' })
            setSource(null)
          } else {
            const asg = await api.teacher.studentAssignments(user as any, target.id)
            const items = Array.isArray(asg) ? asg.filter((a: any) => (intent.status ? a.status === intent.status : true)) : []
            setMsgs((m) => [...m, { role: 'assistant', text: `${target.name} için sonuçlar listelendi.` }])
        setResult({ kind: 'assignments', studentId: target.id, studentName: target.name, status: intent.status, items })
            setSource('fallback')
          }
        }
      } catch {
        setMsgs((m) => [...m, { role: 'assistant', text: 'İşlem sırasında bir hata oluştu.' }])
        setResult({ kind: 'none' })
        setSource(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const right = useMemo(() => {
    if (result.kind === 'assignments') {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">
            {result.studentName} • {result.status === 'done' ? 'Tamamlanan' : result.status === 'pending' ? 'Bekleyen' : 'Tüm'} ödevler
          </div>
          <ul className="space-y-2">
            {result.items.map((a: any) => (
              <li key={a.assignment_id} className="p-3 rounded-lg border border-gray-200">
                <Link to={`/panel/ogrenciler/${result.studentId}`} className="block">
                  <div className="font-medium text-indigo-700 hover:underline truncate">{a.title}</div>
                  {a.due_date && <div className="text-xs text-gray-600">son: {a.due_date}</div>}
                  {a.description && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{a.description}</div>}
                </Link>
              </li>
            ))}
            {!result.items.length && <li className="text-sm text-gray-500">Kayıt bulunamadı.</li>}
          </ul>
        </div>
      )
    }
    if (result.kind === 'exams') {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">{result.studentName} • Denemeler/Netler</div>
          <ul className="space-y-2">
            {result.items.map((e: any) => (
              <li key={e.id} className="p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                <Link to={`/panel/ogrenciler/${result.studentId}`} className="min-w-0">
                  <div className="font-medium text-indigo-700 hover:underline truncate">{e.title || 'Deneme'}</div>
                  <div className="text-xs text-gray-600">tarih: {e.taken_at}</div>
                </Link>
                <div className="text-sm text-indigo-700 shrink-0">Mat: {Number(e.mat_net||0)} / Toplam: {Number(e.total_net||0)}</div>
              </li>
            ))}
            {!result.items.length && <li className="text-sm text-gray-500">Kayıt bulunamadı.</li>}
          </ul>
        </div>
      )
    }
    if (result.kind === 'students') {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">Öğrenci Listesi</div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {result.items.map((s:any)=>(
              <li key={s.id} className="p-2 rounded-lg border border-gray-200">
                <Link to={`/panel/ogrenciler/${s.id}`} className="block">
                  <div className="font-medium text-indigo-700 hover:underline truncate">{s.name}</div>
                  {s.email && <div className="text-xs text-gray-600 truncate">{s.email}</div>}
                </Link>
              </li>
            ))}
            {!result.items.length && <li className="text-sm text-gray-500">Kayıt bulunamadı.</li>}
          </ul>
        </div>
      )
    }
    if (result.kind === 'topics') {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">Konular</div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {result.items.map((t:any)=>(
              <li key={t.id} className="p-2 rounded-lg border border-gray-200">
                <Link to={`/panel/yonetim/konular`} className="block">
                  <div className="font-medium text-indigo-700 hover:underline truncate">{t.name}</div>
                </Link>
              </li>
            ))}
            {!result.items.length && <li className="text-sm text-gray-500">Kayıt bulunamadı.</li>}
          </ul>
        </div>
      )
    }
    if (result.kind === 'teacher_assignments') {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">Ödevleriniz</div>
          <ul className="space-y-2">
            {result.items.map((a:any)=>(
              <li key={a.id} className="p-3 rounded-lg border border-gray-200">
                <Link to="/panel/yonetim/odevler" className="block">
                  <div className="font-medium text-indigo-700 hover:underline truncate">{a.title}</div>
                  {a.due_date && <div className="text-xs text-gray-600">son: {a.due_date}</div>}
                  {a.description && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{a.description}</div>}
                </Link>
              </li>
            ))}
            {!result.items.length && <li className="text-sm text-gray-500">Kayıt bulunamadı.</li>}
          </ul>
        </div>
      )
    }
    if (result.kind === 'created_assignment') {
      const a: any = result.item || {}
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">Ödev oluşturuldu</div>
          <div className="p-3 rounded-lg border border-gray-200">
            <div className="font-medium text-gray-900">{a.title}</div>
            {a.due_date && <div className="text-xs text-gray-600">son: {a.due_date}</div>}
            {a.description && <div className="text-sm text-gray-700 mt-1">{a.description}</div>}
            <div className="mt-2"><Link to="/panel/yonetim/odevler" className="text-indigo-700 text-sm hover:underline">Ödev Tanımları</Link></div>
          </div>
        </div>
      )
    }
    if (result.kind === 'assigned') {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-2">Atama tamamlandı</div>
          <div className="text-sm text-gray-800">{result.count} öğrenciye atandı.</div>
          <ul className="mt-2 grid sm:grid-cols-2 gap-2">
            {result.students.map((s:any)=>(
              <li key={s.id} className="p-2 rounded-lg border border-gray-200"><Link to={`/panel/ogrenciler/${s.id}`} className="text-indigo-700 hover:underline">{s.name}</Link></li>
            ))}
          </ul>
          <div className="mt-3"><Link to="/panel/yonetim/odevler" className="text-indigo-700 text-sm hover:underline">Ödev Tanımları</Link></div>
        </div>
      )
    }
    if (result.kind === 'count') {
      return <div className="text-lg font-semibold text-indigo-700">Öğrenci sayısı: {result.value}</div>
    }
    return <div className="text-sm text-gray-500">Sağda sonuçlar görünecek.</div>
  }, [result])

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4 min-h-[360px]">
        <div className="font-semibold text-gray-900 mb-3">Asistan</div>
        <div ref={listRef} className="h-56 overflow-auto space-y-2 rounded-lg bg-gray-50 p-2 border border-gray-200">
          {msgs.map((m, i) => (
            <div key={i} className={`text-sm ${m.role === 'user' ? 'text-gray-900' : 'text-indigo-700'}`}>{m.text}</div>
          ))}
          {!msgs.length && (
            <div className="text-sm text-gray-500">Örnek: "Öğrenci Demo'nun tamamlanan ödevlerini göster"</div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {students.slice(0,5).map((s:any)=> (
            <button key={s.id} type="button" onClick={()=>setInput(`Öğrenci ${s.name}'nin tamamlanan ödevlerini göster`)} className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100">{s.name}</button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesajınızı yazın"
            className="flex-1 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 px-3 py-2 text-sm"
          />
          <Button disabled={loading} type="submit">Gönder</Button>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={requireAI} onChange={(e)=>setRequireAI(e.target.checked)} />
            AI Kullan
          </label>
        </form>
      </Card>
      <Card className="p-4 min-h-[360px]">
        <div className="font-semibold text-gray-900 mb-3">Sonuçlar</div>
        {source && (
          <div className="text-xs text-gray-500 mb-2">Kaynak: {source==='ai' ? 'GPT' : 'Kurallı'}</div>
        )}
        {right}
      </Card>
    </div>
  )
}
