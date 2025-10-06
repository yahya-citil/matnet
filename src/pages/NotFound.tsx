import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Button from '../components/Button'
import { useSEO } from '../hooks/useSEO'

export default function NotFound() {
  useSEO({ title: 'Sayfa bulunamadı | MatematikNET', description: 'Sayfa bulunamadı.', canonical: '/404' })
  return (
    <Section>
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-gray-600">Aradığınız sayfa mevcut değil.</p>
        <div className="mt-6">
          <Link to="/">
            <Button>Ana sayfa</Button>
          </Link>
        </div>
      </div>
    </Section>
  )
}

