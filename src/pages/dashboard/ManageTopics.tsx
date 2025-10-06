import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { load, save } from '../../lib/storage'
import { useAuth } from '../../lib/auth'
import { api, hasAPI } from '../../lib/api'

export type TopicDef = { id: string; name: string }

const KEY = 'global:topics'

export default function ManageTopics() {
  const { user } = useAuth()
  const [rows, setRows] = useState<TopicDef[]>(() =>
    load<TopicDef[]>(KEY, [
      { id: crypto.randomUUID(), name: 'Temel Matematik' },
      { id: crypto.randomUUID(), name: 'Fonksiyonlar' },
      { id: crypto.randomUUID(), name: 'Trigonometri' },
    ]),
  )
  const [name, setName] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    save(KEY, rows)
  }, [rows])

  useEffect(() => {
    if (hasAPI() && user?.role === 'teacher') {
      api.teacher
        .topics(user)
        .then((list: any[]) => setRows(list.map((x) => ({ id: x.id, name: x.name }))))
    }
  }, [user])

  async function add() {
    if (!name) return
    if (hasAPI() && user?.role === 'teacher') {
      const created = await api.teacher.addTopic(user, name)
      if (created) setRows([...rows, { id: created.id, name: created.name }])
    } else {
      setRows([...rows, { id: crypto.randomUUID(), name }])
    }
    setName('')
  }

  async function remove(id: string) {
    if (hasAPI() && user?.role === 'teacher') await api.teacher.deleteTopic(user, id).catch(() => {})
    setRows(rows.filter((r) => r.id !== id))
  }

  function onDragStart(id: string) {
    setDragId(id)
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  async function onDrop(id: string) {
    if (!dragId || dragId === id) return
    const list = [...rows]
    const from = list.findIndex((r) => r.id === dragId)
    const to = list.findIndex((r) => r.id === id)
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item)
    setRows(list)
    setDragId(null)
    if (hasAPI() && user?.role === 'teacher') {
      await api.teacher.reorderTopics(user, list.map((r) => r.id)).catch(() => {})
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLocaleLowerCase('tr')
    if (!term) return rows
    return rows.filter((r) => r.name.toLocaleLowerCase('tr').includes(term))
  }, [rows, q])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="font-semibold text-gray-900">Konu Tanımı Ekle</div>
        <div className="mt-3 grid md:grid-cols-4 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Konu adı"
            className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
          />
          <Button onClick={add}>Ekle</Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900">Konular</div>
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Konularda ara"
            className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 text-sm"
          />
        </div>
        <ul className="mt-3 divide-y">
          {filtered.map((r) => (
            <li
              key={r.id}
              draggable
              onDragStart={() => onDragStart(r.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(r.id)}
              className="py-2 flex items-center justify-between cursor-move"
              title="Sürükleyerek sırayı değiştirin"
            >
              <span className="text-gray-800 flex items-center gap-2">
                <span className="text-gray-400">≡</span>
                {editing === r.id ? (
                  <input value={editName} onChange={(e)=>setEditName(e.target.value)} className="rounded border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
                ) : (
                  r.name
                )}
              </span>
              <div className="flex items-center gap-3">
                {editing === r.id ? (
                  <>
                    <button
                      onClick={async()=>{
                        const newName = editName.trim(); if(!newName) return
                        if (hasAPI() && user?.role==='teacher') {
                          await api.teacher.updateTopic(user, r.id, newName)
                        }
                        setRows(rows.map(x=> x.id===r.id ? { ...x, name: newName } : x))
                        setEditing(null); setEditName('')
                      }}
                      className="text-indigo-700 text-sm hover:underline"
                    >Kaydet</button>
                    <button onClick={()=>{ setEditing(null); setEditName('') }} className="text-gray-600 text-sm hover:underline">Vazgeç</button>
                  </>
                ) : (
                  <button onClick={()=>{ setEditing(r.id); setEditName(r.name) }} className="text-indigo-700 text-sm hover:underline">Düzenle</button>
                )}
                <button onClick={() => remove(r.id)} className="text-red-600 text-sm hover:underline">Sil</button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
