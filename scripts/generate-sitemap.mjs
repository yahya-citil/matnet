import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// SITE URL
const SITE = (process.env.VITE_SITE_URL || '').replace(/\/$/, '')
if (!SITE) {
  console.warn('VITE_SITE_URL not set. Using relative URLs in sitemap.')
}

// Collect service slugs by reading src/data/services.ts (simple regex)
const servicesFile = resolve(process.cwd(), 'src', 'data', 'services.ts')
const content = readFileSync(servicesFile, 'utf8')
const slugs = Array.from(content.matchAll(/slug:\s*'([^']+)'/g)).map((m) => m[1])

// Static routes
const routes = ['/', '/hizmetler', '/fiyatlar', '/egitmenler', '/iletisim']

const urls = [
  ...routes,
  ...slugs.map((s) => `/hizmetler/${s}`),
]

const now = new Date().toISOString()
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map((u) => {
      const loc = SITE ? `${SITE}${u}` : u
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`
    })
    .join('\n') +
  `\n</urlset>\n`

// Write public files
const pub = resolve(process.cwd(), 'public')
mkdirSync(pub, { recursive: true })
writeFileSync(resolve(pub, 'sitemap.xml'), xml, 'utf8')
writeFileSync(
  resolve(pub, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE ? SITE : ''}/sitemap.xml\n`,
  'utf8',
)

console.log(`Generated sitemap.xml with ${urls.length} URLs and robots.txt`)

