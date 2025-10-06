import Section from '../components/Section'
import Card from '../components/Card'
import { useSEO } from '../hooks/useSEO'

type Tutor = {
  name: string
  title: string
  about: string
  avatar: string
  tags: string[]
}

export default function Tutors() {
  useSEO({
    title: 'Eğitmenler | MatematikNET',
    description: 'Deneyimli ve öğrenci odaklı kadro.',
    canonical: '/egitmenler',
  })

  const tutors: Tutor[] = [
    {
      name: 'Elçin Özge Durgun',
      title: 'Matematik Öğretmeni',
      about:
        'TYT/AYT, LGS ve üniversite düzeyinde yılların deneyimiyle sonuç odaklı dersler.',
      avatar:
        'https://i.hizliresim.com/soe5mmp.png',
      tags: ['TYT/AYT - LGS', 'İlkokul', 'Ortaokul', 'Geometri'],
    },
  ]

  return (
    <Section>
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Eğitmenler</h1>
        <p className="mt-2 text-gray-600">Deneyimli ve öğrenci odaklı kadro.</p>
      </div>

      <div className="mt-8 space-y-5 max-w-3xl">
        {tutors.map((t) => (
          <Card key={t.name} className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <img
                src={t.avatar}
                alt={t.name}
                loading="lazy"
                className="w-16 h-16 rounded-full object-cover ring-1 ring-black/5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{t.name}</h3>
                </div>
                <div className="text-sm text-gray-600">{t.title}</div>
                <p className="mt-3 text-gray-700">{t.about}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}
