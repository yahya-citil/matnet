import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { api, hasAPI } from '../../lib/api'

type FileItem = { id: string; name: string; url: string }
type Assignee = { id: string; name: string }
type Row = {
  id: string
  title: string
  due_date?: string | null
  description?: string | null
  files?: FileItem[]
  assignees?: Assignee[]
}

export default function ManageAssignments() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Assignee[]>([])
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDue, setEditDue] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [assignOpen, setAssignOpen] = useState<string | null>(null)
  const [assignSel, setAssignSel] = useState<Record<string, boolean>>({})
  const [assignFilter, setAssignFilter] = useState('')

  const canUseApi = hasAPI() && isTeacher && !!user

  useEffect(() => {
    if (!canUseApi) return
    setLoading(true)
    api.teacher
      .assignments(user as any)
      .then((list: any[]) => setRows(list as Row[]))
      .finally(() => setLoading(false))
  }, [canUseApi, user])

  useEffect(() => {
    if (!canUseApi) return
    api.teacher
      .students(user as any)
      .then((list: any[]) => setStudents(list.map((s:any)=>({ id: s.id, name: s.name }))))
      .catch(()=>{})
  }, [canUseApi, user])

  const [listQ, setListQ] = useState('')
  const sorted = useMemo(() => {
    const term = listQ.trim().toLocaleLowerCase('tr')
    let out = [...rows]
    if (term) out = out.filter(r => (r.title||'').toLocaleLowerCase('tr').includes(term) || (r.description||'').toLocaleLowerCase('tr').includes(term))
    return out
  }, [rows, listQ])

  async function add() {
    if (!canUseApi || !title.trim()) return
    const created = await api.teacher.addAssignment(user as any, title.trim(), due || undefined, description || undefined)
    setRows([created as Row, ...rows])
    setTitle('')
    setDue('')
    setDescription('')
  }

  async function saveEdit(id: string) {
    if (!canUseApi) return
    const data: any = { title: editTitle || undefined, due_date: editDue || null, description: editDescription || undefined }
    const updated = await api.teacher.updateAssignment(user as any, id, data)
    setRows(rows.map(r => (r.id === id ? { ...r, ...updated } : r)))
    setEditing(null)
  }

  async function remove(id: string) {
    if (!canUseApi) return
    await api.teacher.deleteAssignment(user as any, id).catch(() => {})
    setRows(rows.filter(r => r.id !== id))
  }

  async function uploadFiles(id: string, files: FileList | null) {
    if (!canUseApi || !files || files.length === 0) return
    const list = Array.from(files)
    const saved = await api.teacher.uploadAssignmentFiles(user as any, id, list)
    setRows(rows.map(r => (r.id === id ? { ...r, files: [...(r.files || []), ...saved] } : r)))
  }

  async function deleteFile(aid: string, fid: string) {
    if (!canUseApi) return
    await api.teacher.deleteAssignmentFile(user as any, aid, fid).catch(() => {})
    setRows(rows.map(r => (r.id === aid ? { ...r, files: (r.files || []).filter(f => f.id !== fid) } : r)))
  }

  async function applyAssignees(aid: string) {
    if (!canUseApi) return
    const current = rows.find(r=>r.id===aid)?.assignees || []
    const currentIds = new Set(current.map(a=>a.id))
    const selectedIds = Object.keys(assignSel).filter(k => assignSel[k])
    const selectedIdSet = new Set(selectedIds)
    const toAdd = selectedIds.filter(id => !currentIds.has(id))
    const toRemove = Array.from(currentIds).filter(id => !selectedIdSet.has(id))
    if (toAdd.length) {
      await api.teacher.assignTo(user as any, aid, toAdd).catch(()=>{})
    }
    if (toRemove.length) {
      await Promise.all(toRemove.map(id => api.teacher.unassignFrom(user as any, aid, id).catch(()=>{})))
    }
    const newAssignees = students.filter(s => selectedIdSet.has(s.id))
    setRows(rows.map(r => r.id===aid ? { ...r, assignees: newAssignees } : r))
    setAssignOpen(null)
  }

  // Removal of assignees is managed via the selection panel (applyAssignees)

  if (!isTeacher) {
    return (
      <Card className="p-4">
        <div className="text-gray-800">Bu sayfa yalnızca öğretmenler içindir.</div>
      </Card>
    )
  }

  if (!hasAPI()) {
    return (
      <Card className="p-4">
        <div className="text-gray-800">Yönetim için API gereklidir. Lütfen .env içinde VITE_USE_API ve VITE_API_URL ayarlayın.</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="font-semibold text-gray-900">Ödev Oluştur</div>
        <div className="mt-3 grid md:grid-cols-6 gap-2 items-start">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Başlık"
            className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 md:col-span-2"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Açıklama (opsiyonel)"
            className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 md:col-span-2"
          />
          <Button onClick={add} disabled={!title.trim()}>Ekle</Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900">Ödevler</div>
          <input
            value={listQ}
            onChange={(e)=>setListQ(e.target.value)}
            placeholder="Ödevlerde ara"
            className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 text-sm"
          />
        </div>
        {loading ? (
          <div className="mt-3 text-sm text-gray-600">Yükleniyor…</div>
        ) : (
          <ul className="mt-3 divide-y">
            {sorted.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {editing === r.id ? (
                      <div className="grid md:grid-cols-5 gap-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 md:col-span-2"
                        />
                        <input
                          type="date"
                          value={editDue}
                          onChange={(e) => setEditDue(e.target.value)}
                          className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
                        />
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 md:col-span-2"
                          placeholder="Açıklama"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-900 font-medium truncate">{r.title}</div>
                        <div className="text-xs text-gray-600 mt-0.5 flex gap-3">
                          {r.due_date && <span>son: {r.due_date}</span>}
                          {r.assignees && r.assignees.length > 0 && (
                            <span>{r.assignees.length} öğrenciye atanmış</span>
                          )}
                        </div>
                        {r.description && (
                          <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{r.description}</div>
                        )}
                      </>
                    )}

                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">PDF Ekleri</div>
                      <ul className="space-y-1">
                        {(r.files || []).map((f) => (
                          <li key={f.id} className="flex items-center justify-between gap-2">
                            <a
                              href={f.url?.startsWith('/') ? `${import.meta.env.VITE_API_URL}${f.url}` : f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-indigo-700 hover:underline truncate"
                              title={f.name}
                            >
                              {f.name}
                            </a>
                            <button
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => deleteFile(r.id, f.id)}
                            >
                              Sil
                            </button>
                          </li>
                        ))}
                        {!r.files?.length && (
                          <li className="text-sm text-gray-500">Ek yok</li>
                        )}
                      </ul>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          multiple
                          onChange={(e) => {
                            const files = e.currentTarget.files
                            // Reset input so the same file can be selected again later
                            e.currentTarget.value = ''
                            uploadFiles(r.id, files)
                          }}
                        />
                      </div>
                    </div>

                    {/* Assigned students list (compact, read-only) */}
                    <div className="mt-4">
                      <div className="text-xs text-gray-500 mb-1">Atanan Öğrenciler</div>
                      {r.assignees && r.assignees.length > 0 ? (
                        <div className="flex items-center flex-wrap gap-2">
                          {r.assignees.slice(0,5).map((a) => (
                            <span key={a.id} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full truncate max-w-[200px]" title={a.name}>{a.name}</span>
                          ))}
                          {r.assignees.length > 5 && (
                            <span className="text-xs text-gray-600">+{r.assignees.length - 5} daha</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Seçilmiş öğrenci yok (ödev tüm öğrencilere görünür).</div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex gap-3">
                    {editing === r.id ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(r.id)}>Kaydet</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Vazgeç</Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAssignOpen(assignOpen===r.id ? null : r.id)
                            const init: Record<string, boolean> = {}
                            const currentIds = new Set((r.assignees||[]).map(a=>a.id))
                            students.forEach(s => { init[s.id] = currentIds.has(s.id) })
                            setAssignSel(init)
                            setAssignFilter('')
                          }}
                        >
                          Öğrencilere Ata
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(r.id)
                            setEditTitle(r.title)
                            setEditDue(r.due_date || '')
                            setEditDescription(r.description || '')
                          }}
                        >
                          Düzenle
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove(r.id)}>Sil</Button>
                      </>
                    )}
                  </div>
                </div>

                {assignOpen === r.id && (
                  <div className="mt-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <div className="text-sm font-medium text-gray-800 mb-2">Öğrenci Seçimi</div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={assignFilter}
                        onChange={(e)=>setAssignFilter(e.target.value)}
                        placeholder="Ara: isim yazın"
                        className="rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const filtered = students.filter(s => s.name.toLowerCase().includes(assignFilter.toLowerCase()))
                          const next = { ...assignSel }
                          filtered.forEach(s => { next[s.id] = true })
                          setAssignSel(next)
                        }}
                      >Filtredekileri Seç</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const filtered = students.filter(s => s.name.toLowerCase().includes(assignFilter.toLowerCase()))
                          const next = { ...assignSel }
                          filtered.forEach(s => { next[s.id] = false })
                          setAssignSel(next)
                        }}
                      >Filtredekileri Temizle</Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2 max-h-56 overflow-auto pr-1">
                      {students
                        .filter(s => s.name.toLowerCase().includes(assignFilter.toLowerCase()))
                        .map((s)=> (
                          <label key={s.id} className="flex items-center gap-2 text-sm text-gray-800">
                            <input
                              type="checkbox"
                              checked={!!assignSel[s.id]}
                              onChange={(e)=> setAssignSel({ ...assignSel, [s.id]: e.target.checked })}
                            />
                            <span className="truncate" title={s.name}>{s.name}</span>
                          </label>
                        ))}
                      {!students.length && <div className="text-sm text-gray-500">Öğrenci bulunamadı.</div>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={()=>applyAssignees(r.id)}>Uygula</Button>
                      <Button size="sm" variant="ghost" onClick={()=>setAssignOpen(null)}>Kapat</Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {!sorted.length && <li className="py-3 text-gray-500">Ödev bulunmuyor.</li>}
          </ul>
        )}
      </Card>
    </div>
  )
}
