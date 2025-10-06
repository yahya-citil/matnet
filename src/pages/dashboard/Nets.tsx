import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import { useAuth } from '../../lib/auth'
import { load, save } from '../../lib/storage'
import { api, hasAPI } from '../../lib/api'
import ExamBarChart from '../../components/ExamBarChart'

type Net = {
  id: string
  date: string
  exam: string
  mat: number
  total: number
}

export default function Nets() {
  const { user } = useAuth()
  const key = `nets:${user?.id}`
  const [rows, setRows] = useState<Net[]>(() => load<Net[]>(key, []))

  useEffect(() => {
    save(key, rows)
  }, [key, rows])

  useEffect(() => {
    if (hasAPI() && user) {
      api.me.exams(user).then((list: any[]) =>
        setRows(
          list.map((x) => ({
            id: x.id,
            date: x.taken_at,
            exam: x.title,
            mat: Number(x.mat_net),
            total: Number(x.total_net),
          })),
        ),
      )
    }
  }, [user])

  const avgMat = useMemo(() => {
    if (!rows.length) return 0
    return Math.round((rows.reduce((a, b) => a + b.mat, 0) / rows.length) * 10) / 10
  }, [rows])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="font-semibold text-gray-900">Matematik Net Grafiği</div>
        <ExamBarChart data={rows.map((r) => ({ id: r.id, date: r.date, title: r.exam, mat: r.mat }))} />
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">Denemeler</div>
          <div className="text-sm text-gray-600">
            Matematik Ortalama: <span className="font-medium text-indigo-700">{avgMat}</span>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Tarih</th>
                <th className="py-2 pr-3">Deneme</th>
                <th className="py-2 pr-3">Mat Net</th>
                <th className="py-2 pr-3">Toplam Net</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pr-3">{r.date}</td>
                  <td className="py-2 pr-3">{r.exam}</td>
                  <td className="py-2 pr-3">{r.mat}</td>
                  <td className="py-2 pr-3">{r.total}</td>
                  <td className="py-2 text-right text-xs text-gray-400">—</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={5}>
                    Henüz kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

