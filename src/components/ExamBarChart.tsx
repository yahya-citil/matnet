type Point = { id: string; date: string; title: string; mat: number }

export default function ExamBarChart({ data }: { data: Point[] }) {
  if (!data?.length) return <div className="mt-3 text-sm text-gray-500">Henüz deneme eklenmedi.</div>
  const items = [...data].sort((a, b) => (a.date > b.date ? 1 : -1))
  const w = 760, h = 260, m = 36
  const chartW = w - m * 2
  const chartH = h - m * 2
  const maxY = Math.max(10, ...items.map((d) => d.mat), 100)
  const barW = Math.max(18, chartW / (items.length * 1.6))
  const gap = (chartW - barW * items.length) / Math.max(1, items.length - 1)
  const x0 = m
  const y0 = h - m
  const yScale = (v: number) => (v / maxY) * chartH

  const ticks = [0, 25, 50, 75, 100]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-72">
      {/* Axes */}
      <line x1={m} x2={w - m} y1={y0} y2={y0} stroke="#e5e7eb" />
      <line x1={m} x2={m} y1={m} y2={y0} stroke="#e5e7eb" />
      {/* grid + y tick labels */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m} x2={w - m} y1={y0 - yScale(t)} y2={y0 - yScale(t)} stroke="#eef2ff" />
          <text x={m - 8} y={y0 - yScale(t)} textAnchor="end" alignmentBaseline="middle" fill="#6b7280" fontSize="10">
            {t}
          </text>
        </g>
      ))}
      {/* bars */}
      {items.map((d, i) => {
        const x = x0 + i * (barW + gap)
        const barH = yScale(d.mat)
        const y = y0 - barH
        const label = d.title.length > 14 ? `${d.title.slice(0, 13)}…` : d.title
        return (
          <g key={d.id}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill="#6366f1" opacity="0.85" />
            {/* value on top */}
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="#4f46e5">
              {d.mat}
            </text>
            {/* x labels (exam names) */}
            <text x={x + barW / 2} y={y0 + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

