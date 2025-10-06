import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'
import { useSEO } from '../hooks/useSEO'

type Plan = {
  name: 'Başlangıç' | 'Standart' | 'Pro'
  price: string
  popular?: boolean
  features: { label: string; slug?: string }[]
}

const plans: Plan[] = [
  {
    name: 'Başlangıç',
    price: '₺800/oturum',
    features: [
      { label: 'Online Ders', slug: 'online-ders' },
      { label: 'Konu Anlatımı', slug: 'konu-anlatimi' },
      { label: 'Grup Dersleri', slug: 'grup-dersleri' },
    ],
  },
  {
    name: 'Standart',
    price: '₺1.100/oturum',
    popular: true,
    features: [
      { label: 'Özel Ders (Birebir)', slug: 'ozel-ders' },
      { label: 'Deneme Analizi', slug: 'deneme-analizi' },
      { label: 'Ödevlendirme', slug: 'odevlendirme' },
    ],
  },
  {
    name: 'Pro',
    price: '₺1.500/oturum',
    features: [
      { label: 'Hızlandırılmış Kamp', slug: 'hizlandirilmis-kamp' },
      { label: 'Sınav Hazırlık', slug: 'sinav-hazirlik' },
      { label: 'Deneme Sınavı', slug: 'deneme-sinavi' },
    ],
  },
]

export default function Pricing() {
  useSEO({
    title: 'Fiyatlar | MatematikNET',
    description:
      'Başlangıç, Standart ve Pro planları. Özelliklere tıklayarak ilgili hizmetin detaylarına gidebilirsiniz.',
    canonical: '/fiyatlar',
  })

  return (
    <Section>
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Fiyatlar</h1>
        <p className="mt-2 text-gray-600">
          İhtiyacınıza uygun planı seçin. Özellikler tıklanabilir ve ilgili
          hizmete yönlendirir.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <Card key={p.name} className="p-6 relative">
            {p.popular && (
              <span className="absolute -top-2 right-4 text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow">
                Popüler
              </span>
            )}
            <h3 className="font-semibold text-gray-900">{p.name}</h3>
            <div className="mt-1 text-2xl font-bold text-indigo-700">
              {p.price}
            </div>
            <ul className="mt-4 space-y-2 text-gray-700">
              {p.features.map((f, i) => (
                <li key={i}>
                  {f.slug ? (
                    <Link
                      className="text-indigo-700 hover:underline"
                      to={`/hizmetler/${f.slug}#neler-var`}
                    >
                      {f.label}
                    </Link>
                  ) : (
                    <span>{f.label}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link to={`/iletisim?plan=${encodeURIComponent(p.name)}`}>
                <Button className="w-full">Planı Seç</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}

