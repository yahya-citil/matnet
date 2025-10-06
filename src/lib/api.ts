const API_URL = import.meta.env.VITE_API_URL as string | undefined
const USE_API = (import.meta.env.VITE_USE_API as string | undefined) === 'true'

export function hasAPI() {
  return !!API_URL && USE_API
}

async function req(path: string, options: RequestInit = {}, user?: { id: string; role: string }) {
  if (!API_URL) throw new Error('API URL missing')
  const headers: any = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (user) {
    headers['x-user-id'] = user.id
    headers['x-user-role'] = user.role
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  login: (email: string, password: string) => req('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: {
    assignments: (user: any) => req('/api/me/assignments', {}, user),
    // student cannot set status anymore (server 403), leaving for compatibility
    setAssignmentStatus: (user: any, id: string, status: 'pending'|'done') =>
      req(`/api/me/assignments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, user),
    topics: (user: any) => req('/api/me/topics', {}, user),
    // setProgress disabled for students by server (403)
    setProgress: (user: any, id: string, progress: number) =>
      req(`/api/me/topics/${id}/progress`, { method: 'PUT', body: JSON.stringify({ progress }) }, user),
    exams: (user: any) => req('/api/me/exams', {}, user),
    addExam: (user: any, data: any) => req('/api/me/exams', { method: 'POST', body: JSON.stringify(data) }, user),
    deleteExam: (user: any, id: string) => req(`/api/me/exams/${id}`, { method: 'DELETE' }, user),
    summary: (user: any) => req('/api/me/summary', {}, user),
  },
  teacher: {
    students: (user: any) => req('/api/teacher/students', {}, user),
    topics: (user: any) => req('/api/teacher/topics', {}, user),
    addTopic: (user: any, name: string) => req('/api/teacher/topics', { method: 'POST', body: JSON.stringify({ name }) }, user),
    deleteTopic: (user: any, id: string) => req(`/api/teacher/topics/${id}`, { method: 'DELETE' }, user),
    reorderTopics: (user: any, ids: string[]) => req('/api/teacher/topics/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }, user),
    updateTopic: (user: any, id: string, name: string) => req(`/api/teacher/topics/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }, user),
    assignments: (user: any) => req('/api/teacher/assignments', {}, user),
    addAssignment: (user: any, title: string, due_date?: string, description?: string) =>
      req('/api/teacher/assignments', { method: 'POST', body: JSON.stringify({ title, due_date, description }) }, user),
    updateAssignment: (user: any, id: string, data: { title?: string; due_date?: string|null; description?: string }) =>
      req(`/api/teacher/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }, user),
    deleteAssignment: (user: any, id: string) => req(`/api/teacher/assignments/${id}`, { method: 'DELETE' }, user),
    uploadAssignmentFiles: async (user: any, id: string, files: File[]) => {
      if (!API_URL) throw new Error('API URL missing')
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      const res = await fetch(`${API_URL}/api/teacher/assignments/${id}/files`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        } as any,
        body: fd,
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    deleteAssignmentFile: async (user: any, id: string, fileId: string) => {
      if (!API_URL) throw new Error('API URL missing')
      const res = await fetch(`${API_URL}/api/teacher/assignments/${id}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        } as any,
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    assignTo: (user: any, id: string, studentIds: string[]) => req(`/api/teacher/assignments/${id}/assignees`, { method: 'POST', body: JSON.stringify({ studentIds }) }, user),
    unassignFrom: (user: any, id: string, sid: string) => req(`/api/teacher/assignments/${id}/assignees/${sid}`, { method: 'DELETE' }, user),
    studentTopics: (user: any, sid: string) => req(`/api/teacher/students/${sid}/topics`, {}, user),
    setStudentProgress: (user: any, sid: string, tid: string, progress: number) =>
      req(`/api/teacher/students/${sid}/topics/${tid}/progress`, { method: 'PUT', body: JSON.stringify({ progress }) }, user),
    studentExams: (user: any, sid: string) => req(`/api/teacher/students/${sid}/exams`, {}, user),
    addStudentExam: (user: any, sid: string, data: any) => req(`/api/teacher/students/${sid}/exams`, { method: 'POST', body: JSON.stringify(data) }, user),
    deleteStudentExam: (user: any, sid: string, id: string) => req(`/api/teacher/students/${sid}/exams/${id}`, { method: 'DELETE' }, user),
    setStudentAssignmentStatus: (user: any, sid: string, aid: string, status: 'pending'|'done') =>
      req(`/api/teacher/students/${sid}/assignments/${aid}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, user),
    studentAssignments: (user: any, sid: string) => req(`/api/teacher/students/${sid}/assignments`, {}, user),
    studentSummary: (user: any, sid: string) => req(`/api/teacher/students/${sid}/summary`, {}, user),
  },
}
