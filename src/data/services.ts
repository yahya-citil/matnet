export type Color = 'indigo' | 'violet' | 'fuchsia' | 'rose' | 'amber' | 'teal' | 'cyan'

export type Service = {
  slug: string
  title: string
  shortDesc: string
  longDesc: string
  badge?: string
  color: Color
  img: string
  bullets?: string[]
  features: string[]
  audience: string[]
  outcomes: string[]
  plan?: 'Başlangıç' | 'Standart' | 'Pro'
  aliases?: string[]
}

// Telifsiz Unsplash örnek görselleri (yüksek kalite, lazy-load kullanılacak)
const U = {
  class: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
  study: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1600&auto=format&fit=crop',
  notes: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop',
  exam: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop',
  team: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop',
  graph: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop',
}

export const services: Service[] = [
  {
    slug: 'ozel-ders',
    title: 'Özel Ders (Birebir)',
    shortDesc:
      'Öğrenciye özel program, birebir odak ve hızlı ilerleme ile verimli ders deneyimi.',
    longDesc:
      'Birebir özel derslerimizde öğrencinin hedef ve seviyesine göre planlanan derslerle, kısa sürede ölçülebilir gelişim sağlıyoruz. Canlı geri bildirim, ödevlendirme ve düzenli takip ile motivasyon hep yüksek kalır.',
    badge: 'Popüler',
    color: 'indigo',
    img: U.class,
    bullets: ['Hedefe göre plan', 'Birebir ilgi', 'Düzenli geri bildirim'],
    features: ['Konu anlatımı', 'Soru çözümü', 'Ödevlendirme', 'Öğrenci takibi'],
    audience: ['Lise ve Üniversite', 'Temelini güçlendirmek isteyenler', 'Hızlı toparlanma ihtiyacı olanlar'],
    outcomes: ['Not artışı', 'Sınav performansında yükselme', 'Düzenli çalışma disiplini'],
    plan: 'Standart',
    aliases: ['universite-destek', 'universite-destegi'],
  },
  {
    slug: 'online-ders',
    title: 'Online Ders',
    shortDesc: 'Canlı, etkileşimli platformlar ile uzaktan verimli ders.',
    longDesc:
      'Online derslerde etkileşimli araçlar, ekran paylaşımı ve akıllı tahta kullanımı ile sınıf konforunda eğitim sunuyoruz. Kayıt imkânı ile tekrar izleyebilirsiniz.',
    color: 'violet',
    img: U.study,
    features: ['Dijital materyaller', 'Kayıt imkânı', 'Esnek saatler'],
    audience: ['Zamanı kısıtlı öğrenciler', 'Uzak bölgedekiler'],
    outcomes: ['Zaman verimliliği', 'Yer bağımsız öğrenim'],
    plan: 'Başlangıç',
  },
  {
    slug: 'grup-dersleri',
    title: 'Grup Dersleri',
    shortDesc: 'Maksimum 4 kişilik gruplarla ekonomik ve motive edici.',
    longDesc:
      'Küçük gruplarla hem ekonomik hem de rekabet ve paylaşım ile motivasyonu artıran programlar. Seviye eşleştirmesi yapılır.',
    color: 'fuchsia',
    img: U.team,
    features: ['Seviye eşleştirme', 'Ekonomik fiyat', 'Grup sinerjisi'],
    audience: ['Arkadaş grubuyla çalışmak isteyenler'],
    outcomes: ['Motivasyon artışı', 'Maliyet avantajı'],
    plan: 'Başlangıç',
  },
  {
    slug: 'sinav-hazirlik',
    title: 'Sınav Hazırlık',
    shortDesc: 'AYT / TYT / LGS odaklı kapsamlı hazırlık.',
    longDesc:
      'Sınav formatına uygun konu sıralaması, düzenli deneme ve detaylı analizlerle sınav gününe hazır hâle gelin.',
    badge: 'Sınav Odaklı',
    color: 'rose',
    img: U.exam,
    features: ['Deneme sınavı', 'Deneme analizi', 'Konu kampı'],
    audience: ['TYT/AYT, LGS adayları'],
    outcomes: ['Net sayısında artış', 'Zaman yönetimi gelişimi'],
    plan: 'Pro',
  },
  {
    slug: 'hizlandirilmis-kamp',
    title: 'Hızlandırılmış Kamp',
    shortDesc: 'Kısa sürede yoğun konu tekrarı ve soru çözümü.',
    longDesc:
      'Sıkıştırılmış takvimde yoğun konu anlatımı ve soru çözümü ile hızlı toparlanma ve eksik kapatma odaklı program.',
    color: 'amber',
    img: U.notes,
    features: ['Yoğun program', 'Soru çözüm maratonu'],
    audience: ['Kısa sürede toparlanmak isteyenler'],
    outcomes: ['Eksiklerin kapanması', 'Özgüven artışı'],
    plan: 'Pro',
  },
  {
    slug: 'deneme-analizi',
    title: 'Deneme Analizi',
    shortDesc: 'Denemelerinizin detaylı analizi ve gelişim planı.',
    longDesc:
      'Yanlış ve boş soruların kök neden analizi, konu bazlı net hedefleme ve haftalık gelişim planı ile sürdürülebilir iyileşme.',
    color: 'teal',
    img: U.graph,
    features: ['Net/konu analizi', 'Zaman yönetimi', 'Gelişim takip'],
    audience: ['Sınava hazırlanan herkes'],
    outcomes: ['Hata tekrarını azaltma', 'Net artışı'],
    plan: 'Standart',
  },
  {
    slug: 'kocluk',
    title: 'Koçluk',
    shortDesc: 'Haftalık planlama, motivasyon ve takip desteği.',
    longDesc:
      'Ders dışı koçluk desteği ile planlama, odak ve sürdürülebilir çalışma alışkanlıkları kazandırıyoruz.',
    color: 'cyan',
    img: U.study,
    features: ['Haftalık plan', 'Hedef takibi', 'Raporlama'],
    audience: ['Düzenli plan arayanlar'],
    outcomes: ['Düzenli çalışma', 'Hedef bazlı ilerleme'],
    plan: 'Standart',
  },
  // — Paket Özelliklerinden türetilmiş yeni hizmetler —
  {
    slug: 'konu-anlatimi-soru-cozumu',
    title: 'Konu Anlatımı + Soru Çözümü',
    shortDesc: 'Temel kavramlar ve bol soru ile pekiştirme.',
    longDesc:
      'Eksik konuların hızlıca tamamlanması ve konuların çok sayıda örnekle pekiştirilmesi hedeflenir.',
    color: 'indigo',
    img: U.class,
    features: ['Konu anlatımı', 'Pekiştirme'],
    audience: ['Temeli zayıf öğrenciler'],
    outcomes: ['Konu hakimiyeti'],
    aliases: ['konu-anlatimi', 'soru-cozumu'],
  },
  {
    slug: 'odevlendirme',
    title: 'Ödevlendirme',
    shortDesc: 'Haftalık çalışma kağıtları ve kontrol.',
    longDesc: 'Düzenli ödev takibi ve geri bildirim ile sürdürülebilir ilerleme.',
    color: 'violet',
    img: U.notes,
    features: ['Haftalık ödev', 'Geri bildirim'],
    audience: ['Düzen arayan öğrenciler'],
    outcomes: ['Düzenli tekrar'],
  },
  {
    slug: 'ogrenci-takibi',
    title: 'Öğrenci Takibi',
    shortDesc: 'Günlük/haftalık raporlama ve veli bilgilendirme.',
    longDesc: 'Gelişim raporları ve periyodik bilgilendirme ile şeffaf süreç.',
    color: 'teal',
    img: U.graph,
    features: ['Raporlama', 'Veli bilgilendirme'],
    audience: ['Veli takibi isteyenler'],
    outcomes: ['Şeffaf takip'],
    aliases: ['takip', 'ogrenci-destegi'],
  },
  {
    slug: 'deneme-sinavi',
    title: 'Deneme Sınavı',
    shortDesc: 'Düzenli deneme ve sektörel ölçme.',
    longDesc: 'Ölçme-değerlendirme odaklı denemeler ile gelişiminizi takip edin.',
    color: 'amber',
    img: U.exam,
    features: ['Ölçme değerlendirme'],
    audience: ['Sınava hazırlananlar'],
    outcomes: ['Net görünürlüğü'],
    aliases: ['deneme', 'mock-exam'],
  },
]

export function normalizeSlug(slug?: string) {
  if (!slug) return ''
  let s = slug
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[ _]+/g, '-')
  const map: Record<string, string> = {
    'denem-analizi': 'deneme-analizi',
    'deneme-analiz': 'deneme-analizi',
  }
  if (map[s]) return map[s]
  return s
}

export function getServiceBySlug(slug?: string) {
  const s = normalizeSlug(slug)
  const match =
    services.find((x) => x.slug === s) ||
    services.find((x) => x.aliases?.includes(s))
  return match || null
}

export const serviceSlugs = services.map((s) => s.slug)

