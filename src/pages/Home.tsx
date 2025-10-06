import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Button from '../components/Button'
import Card from '../components/Card'
import { useSEO } from '../hooks/useSEO'

export default function Home() {
  useSEO({
    title: 'MatematikNET',
    description:
      'Matematik özel ders, sınav hazırlık, deneme analizi ve koçluk ile netlerinizi artırın. Hızlı, verimli ve sonuç odaklı yaklaşım.',
    canonical: '/',
  })

  return (
    <>
      {/* HERO */}
      <Section className="pt-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white p-8 md:p-12 shadow-sm">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Matematikte Net Artıran Yaklaşım
            </h1>
            <p className="mt-4 text-indigo-50/90">
              Birebir ders, deneme analizi ve hızlandırılmış kamp ile hedefe hızlı
              ilerleyin. Basit, hızlı ve ölçülebilir sonuçlar.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link to="/fiyatlar">
                <Button size="lg" className="shadow-md">Planları Gör</Button>
              </Link>
              <Link to="/hizmetler">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/50 hover:bg-white/15">Hizmetler</Button>
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[{k:'Yıllık Deneme',v:'120+'},{k:'Memnuniyet',v:'%98'},{k:'Ders Saati',v:'1500+'}].map(x=> (
                <div key={x.k} className="rounded-lg bg-white/10 p-3">
                  <div className="text-xl font-bold">{x.v}</div>
                  <div className="text-xs opacity-80">{x.k}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -bottom-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        </div>
      </Section>

      {/* NEDEN BİZ? */}
      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Neden MatematikNET?</h2>
          <p className="mt-2 text-gray-600">Deneyim, veri odaklı yaklaşım ve düzenli takip ile fark yaratırız.</p>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {[
            {
              title: 'Bireye Özel Plan',
              desc: 'Hedef ve seviyeye göre esnek, ölçülebilir ders planları.',
            },
            {
              title: 'Veri Odaklı Takip',
              desc: 'Deneme ve ödev verilerini analiz ederek net artışı sağlar.',
            },
            {
              title: 'Sınav Odaklı İçerik',
              desc: 'TYT/AYT/LGS formatına uygun soru ve stratejiler.',
            },
          ].map((f) => (
            <Card key={f.title} className="p-6">
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-gray-600 text-sm">{f.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ÖNE ÇIKAN HİZMETLER */}
      <Section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Öne Çıkan Hizmetler</h2>
            <p className="text-gray-600">İhtiyacınıza göre hızlı başlangıç yapın.</p>
          </div>
          <Link to="/hizmetler">
            <Button variant="ghost">Tüm Hizmetler</Button>
          </Link>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-5">
          {[
            {
              title: 'Özel Ders',
              desc: 'Birebir odaklı, hızlı ilerleme',
              to: '/hizmetler/ozel-ders',
              img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop',
            },
            {
              title: 'Sınav Hazırlık',
              desc: 'TYT/AYT/LGS için kapsamlı',
              to: '/hizmetler/sinav-hazirlik',
              img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop',
            },
            {
              title: 'Deneme Analizi',
              desc: 'Net artışı için odaklı analiz',
              to: '/hizmetler/deneme-analizi',
              img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop',
            },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="block">
              <Card className="overflow-hidden">
                <img src={c.img} loading="lazy" alt={c.title} className="w-full h-44 object-cover" />
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900">{c.title}</h3>
                  <p className="mt-1 text-gray-600">{c.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* NASIL ÇALIŞIR? */}
      <Section className="bg-indigo-50/60 rounded-2xl">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center">Nasıl Çalışır?</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          {[
            { n: '1', t: 'Keşif Görüşmesi', d: 'Hedef ve seviyenizi anlıyoruz.' },
            { n: '2', t: 'Planlama', d: 'Size özel haftalık yol haritası.' },
            { n: '3', t: 'Uygulama', d: 'Ders + ödev + deneme analizi.' },
            { n: '4', t: 'Takip', d: 'Düzenli raporlama ve iyileştirme.' },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold shadow-sm">{s.n}</div>
              <div className="mt-3 font-medium text-gray-900">{s.t}</div>
              <div className="text-sm text-gray-600">{s.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* YORUMLAR */}
      <Section>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center">Öğrencilerimiz Ne Diyor?</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-5">
          {[
            {
              q: '3 ayda matematik netlerim 12 arttı. Planlı ilerleme ve deneme analizleri fark yarattı.',
              a: 'TYT Öğrencisi',
            },
            {
              q: 'Özel derste tam ihtiyacım olan konulara odaklandık. Çok verimli geçti.',
              a: 'AYT Adayı',
            },
            {
              q: 'Koçluk ve ödevlendirme sayesinde düzenim oturdu. Motivasyonum yükseldi.',
              a: 'Lise 10. Sınıf',
            },
          ].map((t, i) => (
            <Card key={i} className="p-5">
              <p className="text-gray-800">“{t.q}”</p>
              <div className="mt-3 text-sm text-gray-600">— {t.a}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="rounded-2xl border border-indigo-100 p-8 md:p-10 text-center bg-white shadow-sm">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900">Hedefe bugün başlayın</h3>
          <p className="mt-2 text-gray-600">Planları inceleyin veya bize yazın; size en uygun programı birlikte oluşturalım.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/fiyatlar">
              <Button size="lg">Planları Gör</Button>
            </Link>
            <Link to="/iletisim">
              <Button size="lg" variant="outline">İletişime Geç</Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
