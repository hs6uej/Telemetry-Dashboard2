'use client'
import type { Station } from '@/lib/types'
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  stations: Station[]
  selected: Station | null
  onSelect: (s: Station) => void
}

export default function StationTable({ stations, selected, onSelect }: Props) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs">
            <th className="text-left py-2 px-3 font-medium">สถานี</th>
            <th className="text-right py-2 px-3 font-medium">น้ำ (ม.)</th>
            <th className="text-right py-2 px-3 font-medium">ฝน (มม.)</th>
            <th className="text-center py-2 px-3 font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {stations.map(st => (
            <tr
              key={st.id}
              onClick={() => onSelect(st)}
              className={cn(
                'border-b border-border/50 cursor-pointer transition-colors hover:bg-accent/50',
                selected?.id === st.id && 'bg-accent',
              )}
            >
              <td className="py-2.5 px-3">
                <span className="font-medium text-foreground line-clamp-1">{st.name}</span>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {st.waterLevel != null ? st.waterLevel.toFixed(2) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {st.rainLevel != null ? st.rainLevel.toFixed(1) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={cn('inline-block w-2 h-2 rounded-full mr-1.5', STATUS_COLOR[st.status])} />
                <span className="text-xs">{STATUS_LABEL[st.status]}</span>
              </td>
            </tr>
          ))}
          {stations.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                ไม่พบข้อมูลสถานี
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
