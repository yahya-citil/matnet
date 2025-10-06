import Card from '../../components/Card'
import { useAuth } from '../../lib/auth'
import AssistantPanel from '../../components/AssistantPanel'
import { useEffect, useState } from 'react'
import { api, hasAPI } from '../../lib/api'

function StudentOverview() {
  const [summary, setSummary] = useState({ avg: 0, exams: 0, progress: 0, pending: 0 })
  const { user } = useAuth()

  useEffect(() => {
    async function load() {
      if (!user) return
      if (hasAPI()) {
        const [exams, topics, assignments] = await Promise.all([
          api.me.exams(user),
          api.me.topics(user),
          api.me.assignments(user),
        ])
        const avg = exams.length ? Math.round((exams.reduce((a:any,b:any)=>a+Number(b.mat_net||b.mat||0),0)/exams.length)*10)/10 : 0
        const prog = topics.length ? Math.round(topics.reduce((a:any,b:any)=>a+Number(b.progress||0),0)/topics.length) : 0
        const pending = assignments.filter((x:any)=>x.status==='pending').length
        setSummary({ avg, exams: exams.length, progress: prog, pending })
      }
    }
    load().catch(()=>{})
  }, [user])

  const stats = [
    { label: 'Ort. Mat Net', value: summary.avg },
    { label: 'Toplam Deneme', value: summary.exams },
    { label: 'Konu İlerlemesi', value: `${summary.progress}%` },
    { label: 'Bekleyen Ödev', value: summary.pending },
  ]

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-sm text-gray-600">{s.label}</div>
            <div className="mt-2 text-2xl font-bold text-indigo-700">{s.value}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TeacherOverview() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({ students: 0, topics: 0, assignments: 0 })
  useEffect(() => {
    async function load() {
      if (!user || !hasAPI()) return
      const [students, topics, assignments] = await Promise.all([
        api.teacher.students(user),
        api.teacher.topics(user),
        api.teacher.assignments(user),
      ])
      setCounts({ students: students.length, topics: topics.length, assignments: assignments.length })
    }
    load().catch(()=>{})
  }, [user])
  const stats = [
    { label: 'Toplam Öğrenci', value: counts.students },
    { label: 'Aktif Konu', value: counts.topics },
    { label: 'Aktif Ödev', value: counts.assignments },
  ]
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-sm text-gray-600">{s.label}</div>
            <div className="mt-2 text-2xl font-bold text-indigo-700">{s.value}</div>
          </Card>
        ))}
      </div>
      <AssistantPanel />
    </div>
  )
}

export default function Overview() {
  const { user } = useAuth()
  if (user?.role === 'teacher') return <TeacherOverview />
  return <StudentOverview />
}
