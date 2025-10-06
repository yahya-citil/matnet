import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/', label: 'Ana sayfa' },
  { to: '/hizmetler', label: 'Hizmetler' },
  { to: '/fiyatlar', label: 'Fiyatlar' },
  { to: '/egitmenler', label: 'Eğitmenler' },
  { to: '/iletisim', label: 'İletişim' },
]

export default function Header() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-indigo-100/60">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-semibold text-indigo-700">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600" />
            MatematikNET
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `hover:text-indigo-700 ${isActive ? 'text-indigo-700' : 'text-gray-700'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <NavLink
            to={user ? '/panel' : '/giris'}
            className={({ isActive }) =>
              `hover:text-indigo-700 ${isActive ? 'text-indigo-700' : 'text-gray-700'}`
            }
          >
            {user ? 'Panel' : 'Giriş'}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
