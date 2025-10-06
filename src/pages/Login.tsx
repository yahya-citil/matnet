import { useState } from 'react'
import type { FormEvent } from 'react'
import Section from '../components/Section'
import Button from '../components/Button'
import { useAuth } from '../lib/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

export default function Login() {
  useSEO({ title: 'Giriş | MatematikNET', description: 'Öğrenci paneline giriş yapın.', canonical: '/giris' })
  const { user, login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const redirect = params.get('redirect') || '/panel'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login({ name: name || (role === 'teacher' ? 'Öğretmen' : 'Öğrenci'), email, role, password })
      navigate(redirect, { replace: true })
    } catch (e) {
      setError('Giriş başarısız. Bilgilerinizi kontrol edin.')
    }
  }

  if (user) {
    navigate('/panel', { replace: true })
    return null
  }

  return (
    <Section>
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">Öğrenci Girişi</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta (opsiyonel)</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" required />
            <p className="text-xs text-gray-500 mt-1">Demo kullanıcılar için şifre: 123456</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
              <label className={`rounded-lg border p-2 cursor-pointer ${role==='student'?'border-indigo-600 bg-indigo-50':'border-gray-300'}`}>
                <input type="radio" className="mr-2" name="role" value="student" checked={role==='student'} onChange={()=>setRole('student')} /> Öğrenci
              </label>
              <label className={`rounded-lg border p-2 cursor-pointer ${role==='teacher'?'border-indigo-600 bg-indigo-50':'border-gray-300'}`}>
                <input type="radio" className="mr-2" name="role" value="teacher" checked={role==='teacher'} onChange={()=>setRole('teacher')} /> Öğretmen
              </label>
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full">Giriş Yap</Button>
        </form>
      </div>
    </Section>
  )
}
