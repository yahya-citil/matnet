import { useEffect } from 'react'

type SEO = {
  title?: string
  description?: string
  canonical?: string
}

export function useSEO({ title, description, canonical }: SEO) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let m = document.querySelector('meta[name="description"]')
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', 'description')
        document.head.appendChild(m)
      }
      m.setAttribute('content', description)
    }

    const site = import.meta.env.VITE_SITE_URL as string | undefined
    const href = canonical
      ? site
        ? `${site.replace(/\/$/, '')}${canonical.startsWith('/') ? '' : '/'}${canonical}`
        : canonical
      : undefined
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null
    if (href) {
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = href
    }
  }, [title, description, canonical])
}

