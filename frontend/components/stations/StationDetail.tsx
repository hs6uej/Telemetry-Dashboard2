'use client'
import { useEffect, useState } from 'react'
import type { Station, StationReading } from '@/lib/types'
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { X, Droplets, CloudRain, Waves } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Props {
  station: Station
  onClose: () => void
}

const STATUS_BADGE: Record<string, any> = {
  normal: 'success',
  warning: 'warning',
  critical: 'critical',
  offline: 'offline',
}

export default function StationDetail({ station, onClose }: Props) {
  const [readings, setReadings] = useState<StationReading[]>([])

  useEffect(() => {
    api.readings.get(station.id, 24).then(setReadings).catch(() => setReadings([]))
  }, [station.id])

  const pct = station.warningLevel && station.waterLevel != null
    ? Math.min(100, (station.waterLevel / station.warningLevel) * 100)
    : null

  const chartData = readings.map(r => ({
    time: new Date(r.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    water: r.waterLevel,
    rain: r.rainLevel,
  }))

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-none">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">{station.name}</CardTitle>
            <div className="mt-1">
              <Badge variant={STATUS_BADGE[station.status]}>{STATUS_LABEL[station.status]}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-none">
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* Gauge metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold tabular-nums">
              {station.waterLevel != null ? station.waterLevel.toFixed(2) : '—'}
            </div>
            <div className="text-xs text-muted-foreground">เมตร</div>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-center">
            <CloudRain className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            <div className="text-lg font-bold tabular-nums">
              {station.rainLevel != null ? station.rainLevel.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-muted-foreground">มม./ชม.</div>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Waves className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold tabular-nums">
              {pct != null ? pct.toFixed(0) : '—'}
            </div>
            <div className="text-xs text-muted-foreground">% ความจุ</div>
          </div>
        </div>

        {/* Water level bar */}
        {pct != null && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>ระดับน้ำ</span>
              <span>{station.waterLevel?.toFixed(2)} / {station.warningLevel?.toFixed(2)} ม.</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', STATUS_COLOR[station.status])}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Station info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="text-muted-foreground">ตลิ่งซ้าย</div>
          <div>{station.leftBank?.toFixed(2) ?? '—'} ม.</div>
          <div className="text-muted-foreground">ตลิ่งขวา</div>
          <div>{station.rightBank?.toFixed(2) ?? '—'} ม.</div>
          <div className="text-muted-foreground">ระดับเฝ้าระวัง</div>
          <div>{station.warningLevel?.toFixed(2) ?? '—'} ม.</div>
          <div className="text-muted-foreground">อัปเดตล่าสุด</div>
          <div>{new Date(station.updatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">ระดับน้ำ 24 ชั่วโมงล่าสุด</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={35} />
                <Tooltip contentStyle={{ background: 'rgba(10,30,60,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                {station.warningLevel && (
                  <ReferenceLine y={station.warningLevel} stroke="#ef4444" strokeDasharray="4 2" />
                )}
                <Line type="monotone" dataKey="water" stroke="#1abc9c" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
