'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/provider'
import { formatCurrency } from '@/lib/utils'
import { MonthlyReport } from '@/types'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ChartRow {
  period: string
  buy: number
  sell: number
  profit: number
  roi: number
}

function buildChartData(data: MonthlyReport[]): ChartRow[] {
  return [...data]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((r) => ({
      period: `${r.month.toString().padStart(2, '0')}/${r.year}`,
      buy: r.totalBuy,
      sell: r.totalSell,
      profit: r.totalProfit,
      roi: r.roi,
    }))
}

function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${Math.round(value / 1_000_000)}M`
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}%`
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 shadow-xl">
      <div className="mb-2 font-mono text-xs font-semibold text-zinc-300">{label}</div>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-zinc-500">{p.name}:</span>
            <span className="text-zinc-200">
              {p.dataKey === 'roi' ? formatPercent(p.value) : formatCurrency(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfitTrendChart({ data }: { data: ChartRow[] }) {
  const { t } = useLanguage()

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="font-mono text-sm">{t('reports.chart.profitTrend')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatPercent}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 11, fontFamily: 'monospace' }}
              />
              <ReferenceLine yAxisId="left" y={0} stroke="#52525b" strokeDasharray="4 4" />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="profit"
                name={t('common.totalProfit')}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#profitGradient)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#34d399' }}
                animationDuration={1200}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roi"
                name={t('common.overallRoi')}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1200}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function BuySellChart({ data }: { data: ChartRow[] }) {
  const { t } = useLanguage()

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="font-mono text-sm">{t('reports.chart.buySell')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 11, fontFamily: 'monospace' }}
              />
              <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />
              <Bar
                dataKey="buy"
                name={t('reports.totalBuy')}
                fill="url(#buyGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                animationDuration={1200}
              />
              <Bar
                dataKey="sell"
                name={t('reports.totalSell')}
                fill="url(#sellGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name={t('common.totalProfit')}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1200}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function MonthlyChart({ data }: { data: MonthlyReport[] }) {
  const { t } = useLanguage()
  const chartData = buildChartData(data)

  if (chartData.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="font-mono text-sm">{t('reports.chart.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center font-mono text-sm text-zinc-500">
            {t('common.noData')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ProfitTrendChart data={chartData} />
      <BuySellChart data={chartData} />
    </div>
  )
}
