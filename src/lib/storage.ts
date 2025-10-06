const PREFIX = 'matnet'

function key(k: string) {
  return `${PREFIX}:${k}`
}

export function save<T>(k: string, v: T) {
  localStorage.setItem(key(k), JSON.stringify(v))
}

export function load<T>(k: string, fallback: T): T {
  const raw = localStorage.getItem(key(k))
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

