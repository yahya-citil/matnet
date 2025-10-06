import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import { useAuth } from '../../lib/auth'
import { load, save } from '../../lib/storage'
import { api, hasAPI } from '../../lib/api'

type TopicDef = { id: string; name: string }
type Progress = Record<string, number>

const KEY_DEFS = 'global:topics'

export default function Topics() {
  const { user } = useAuth()
  const keyProgress = `topicProgress:${user?.id}`
  const [defs, setDefs] = useState<TopicDef[]>(() => load<TopicDef[]>(KEY_DEFS, []))
  const [progress, setProgress] = useState<Progress>(() => load<Progress>(keyProgress, {}))

  useEffect(() => { save(keyProgress, progress) }, [keyProgress, progress])
  useEffect(() => {
    if (hasAPI() && user) {
      api.me.topics(user).then(list => {
        setDefs(list.map((x:any)=>({ id:x.id, name:x.name })))
        const p: Record<string, number> = {}
        list.forEach((x:any)=>p[x.id]=Number(x.progress)||0)
        setProgress(p)
      }).catch(()=>{})
    }
  }, [user])

  const rows = useMemo(() => defs.map(d => ({ ...d, progress: progress[d.id] ?? 0 })), [defs, progress])

  function setProg(_id: string, _p: number) {
    // Öğrenci artık ilerleme güncelleyemez (read-only)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="font-semibold text-gray-900">Konu İlerlemesi</div>
        <ul className="mt-3 space-y-3">
          {rows.map(r => (
            <li key={r.id} className="flex items-center gap-3">
              <div className="w-40 text-sm text-gray-800">{r.name}</div>
              <input disabled type="range" min={0} max={100} value={r.progress} onChange={(e)=>setProg(r.id, Number(e.target.value))} className="flex-1 disabled:opacity-50" />
              <span className="w-12 text-right text-sm font-medium text-indigo-700">{r.progress}%</span>
            </li>
          ))}
          {!rows.length && <li className="text-gray-500">Henüz tanımlı konu yok. Öğretmenin eklemesini bekleyin.</li>}
        </ul>
      </Card>
    </div>
  )
}
