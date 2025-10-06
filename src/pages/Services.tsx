import { Link, useNavigate } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'
import { services } from '../data/services'
import { useSEO } from '../hooks/useSEO'

export default function Services() {
  useSEO({
    title: 'Hizmetler | MatematikNET',
    description:
      'Özel ders, online ders, grup dersleri, sınav hazırlık, kamp ve deneme analizi dahil kapsamlı Matematik hizmetlerimiz.',
    canonical: '/hizmetler',
  })

  const navigate = useNavigate()
  return (
    <Section>
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hizmetler
        </h1>
        <p className="mt-2 text-gray-600">
          Size uygun çalışma modelini seçin. Kartlardaki etiketler planları
          temsil eder: Başlangıç, Standart, Pro.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s) => (
          <Card
            key={s.slug}
            className="overflow-hidden cursor-pointer"
            onClick={() => navigate(`/hizmetler/${s.slug}`)}
          >
            <img
              loading="lazy"
              src={s.img}
              alt={s.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                {s.badge && (
                  <span className="text-xs inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600 text-sm">{s.shortDesc}</p>
              <div className="mt-4 flex items-center gap-2">
                {['Başlangıç', 'Standart', 'Pro'].map((t) => (
                  <span
                    key={t}
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      s.plan === t ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-200'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-5">
                <Link to={`/hizmetler/${s.slug}`}>
                  <Button size="sm">Detay</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}

