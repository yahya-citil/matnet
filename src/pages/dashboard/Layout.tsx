import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth'

function buildNav(role: 'student' | 'teacher') {
  if (role === 'teacher') {
    return [
      { to: '/panel', label: 'Genel Bakış', end: true },
      { to: '/panel/ogrenciler', label: 'Öğrenciler' },
      { to: '/panel/yonetim/konular', label: 'Konu Tanımları' },
      { to: '/panel/yonetim/odevler', label: 'Ödev Tanımları' },
    ]
  }
  return [
    { to: '/panel', label: 'Genel Bakış', end: true },
    { to: '/panel/netler', label: 'Netler' },
    { to: '/panel/odevler', label: 'Ödevler' },
    { to: '/panel/konu-takibi', label: 'Konu Takibi' },
  ]
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = buildNav(user?.role || 'student')
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const term = q.trim().toLocaleLowerCase('tr')
    if (!term) return nav
    return nav.filter((n) => n.label.toLocaleLowerCase('tr').includes(term))
  }, [q, nav])

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="bg-white border-r border-indigo-100/60">
        <div className="h-16 flex items-center px-4 font-semibold text-indigo-700 border-b border-indigo-100/60">
          <Link to="/">MatematikNET</Link>
        </div>
        <div className="p-3 border-b border-indigo-100/60">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Menüde ara"
            className="w-full rounded-lg border border-indigo-100/60 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <nav className="p-3 space-y-1">
          {filtered.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end as any}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="min-h-full">
        <header className="h-16 bg-white border-b border-indigo-100/60 flex items-center justify-between px-4">
          <div className="text-sm text-gray-600">Hoş geldiniz, <span className="font-medium text-gray-900">{user?.name}</span></div>
          <button onClick={()=>{logout(); navigate('/')}} className="text-sm text-indigo-700 hover:underline">Çıkış</button>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
