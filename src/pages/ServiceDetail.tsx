import { Link, useParams } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'
import { getServiceBySlug, services } from '../data/services'
import { useSEO } from '../hooks/useSEO'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = getServiceBySlug(slug)

  useSEO({
    title: service ? `${service.title} | MatematikNET` : 'Hizmet bulunamadı | MatematikNET',
    description: service ? service.shortDesc : 'Aradığınız hizmet bulunamadı.',
    canonical: `/hizmetler/${slug ?? ''}`,
  })

  if (!service) {
    const suggestions = services.filter((s) =>
      ['sinav-hazirlik', 'deneme-analizi', 'ozel-ders'].includes(s.slug),
    )
    return (
      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Hizmet bulunamadı
          </h1>
          <p className="mt-2 text-gray-600">
            Aradığınız hizmet mevcut değil. Aşağıdaki önerilere göz atın.
          </p>
          <div className="mt-6">
            <Link to="/hizmetler">
              <Button>Hizmetlere Dön</Button>
            </Link>
          </div>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {suggestions.map((s) => (
            <Link key={s.slug} to={`/hizmetler/${s.slug}`} className="block">
              <Card className="overflow-hidden">
                <img
                  loading="lazy"
                  src={s.img}
                  alt={s.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{s.shortDesc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    )
  }

  return (
    <Section>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <img
            loading="lazy"
            src={service.img}
            alt={service.title}
            className="w-full h-64 object-cover rounded-xl shadow-sm ring-1 ring-black/5"
          />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {service.title}
            </h1>
            {service.badge && (
              <span className="text-xs inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {service.badge}
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-600">{service.longDesc}</p>
          <div className="mt-5 flex items-center gap-3">
            <Link to={`/iletisim?service=${encodeURIComponent(service.title)}`}>
              <Button>İletişim</Button>
            </Link>
            <Link to="/fiyatlar">
              <Button variant="outline">Fiyatlar</Button>
            </Link>
          </div>
        </div>
      </div>

      <div id="neler-var" className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Bu hizmette neler var?
        </h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-gray-700">
          {service.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-indigo-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900">Kimler için?</h3>
          <ul className="mt-2 space-y-1 text-gray-700">
            {service.audience.map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Beklenen çıktılar</h3>
          <ul className="mt-2 space-y-1 text-gray-700">
            {service.outcomes.map((o, i) => (
              <li key={i}>• {o}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Öne çıkanlar</h3>
          <ul className="mt-2 space-y-1 text-gray-700">
            {(service.bullets ?? service.features).slice(0, 4).map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
