import { useMemo } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import Section from '../components/Section'
import Button from '../components/Button'
import { useSEO } from '../hooks/useSEO'

export default function Contact() {
  const { search } = useLocation()
  const params = useMemo(() => new URLSearchParams(search), [search])
  const presetService = params.get('service') ?? ''
  const presetPlan = params.get('plan') ?? ''

  useSEO({
    title: 'İletişim | MatematikNET',
    description: 'Sorularınız için hızlıca iletişime geçin.',
    canonical: '/iletisim',
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    alert('Örnek form: Gönderim bu demoda yok.')
  }

  return (
    <Section>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
          İletişim
        </h1>
        <p className="mt-2 text-gray-600 text-center">
          Aşağıdaki formu doldurun, en kısa sürede dönüş yapalım.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
            <input className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input type="email" className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefon</label>
            <input className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">İlgilendiğiniz Hizmet</label>
            <input defaultValue={presetService} className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan</label>
            <input defaultValue={presetPlan} className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mesajınız</label>
            <textarea rows={4} className="mt-1 w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600" />
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">
              Gönder
            </Button>
          </div>
        </form>
      </div>
    </Section>
  )
}
