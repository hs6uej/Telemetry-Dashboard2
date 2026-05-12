'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Station } from '@/lib/types'
import { STATUS_COLOR } from '@/lib/types'
import { api } from '@/lib/api'
import StationTable from '@/components/stations/StationTable'
import StationDetail from '@/components/stations/StationDetail'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Droplets, LogOut, LogIn, RefreshCw, Map, Table, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react'

const TelemetryMap = dynamic(() => import('@/components/map/TelemetryMap'), { ssr: false })

function statusCounts(stations: Station[]) {
  return {
    normal:   stations.filter(s => s.status === 'normal').length,
    warning:  stations.filter(s => s.status === 'warning').length,
    critical: stations.filter(s => s.status === 'critical').length,
    offline:  stations.filter(s => s.status === 'offline').length,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stations, setStations] = useState<Station[]>([])
  const [selected, setSelected] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [tab, setTab] = useState('map')
  const [user, setUser] = useState<any>(null)

  const loadStations = useCallback(async () => {
    try {
      const data = await api.stations.list()
      setStations(data)
      setLastUpdate(new Date())
    } catch {}
  }, [])

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
    loadStations().finally(() => setLoading(false))
    const interval = setInterval(loadStations, 30_000)
    return () => clearInterval(interval)
  }, [loadStations])

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const counts = statusCounts(stations)

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-border px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">ระบบโทรมาตร</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">เพื่อการพยากรณ์น้ำและเตือนภัย</p>
          </div>
        </div>

        {/* Status summary */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          {[
            { key: 'normal',   label: 'ปกติ',     icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-400' },
            { key: 'warning',  label: 'เฝ้าระวัง', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-amber-400' },
            { key: 'critical', label: 'วิกฤต',     icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400' },
            { key: 'offline',  label: 'ออฟไลน์',   icon: <WifiOff className="w-3 h-3" />, color: 'text-slate-400' },
          ].map(({ key, label, icon, color }) => (
            <div key={key} className={cn('flex items-center gap-1', color)}>
              {icon}
              <span className="font-bold">{counts[key as keyof typeof counts]}</span>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {lastUpdate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Button variant="ghost" size="icon" onClick={loadStations} title="รีเฟรช">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {user ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:block">{user.username}</span>
              <Button variant="ghost" size="icon" onClick={logout} title="ออกจากระบบ">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => router.push('/login')} className="gap-1.5">
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เข้าสู่ระบบ</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-none border-r border-border flex flex-col overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
            <div className="flex-none px-3 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="map" className="flex-1 gap-1.5 text-xs">
                  <Map className="w-3.5 h-3.5" />แผนที่
                </TabsTrigger>
                <TabsTrigger value="table" className="flex-1 gap-1.5 text-xs">
                  <Table className="w-3.5 h-3.5" />ตาราง
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="map" className="flex-1 overflow-y-auto m-0">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-1 py-2">
                  สถานีทั้งหมด {stations.length} แห่ง
                </p>
                <StationTable stations={stations} selected={selected} onSelect={setSelected} />
              </div>
            </TabsContent>
            <TabsContent value="table" className="flex-1 overflow-y-auto m-0">
              <div className="p-2">
                <StationTable stations={stations} selected={selected} onSelect={setSelected} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-muted-foreground text-sm">กำลังโหลดข้อมูล...</div>
            </div>
          ) : (
            <TelemetryMap stations={stations} onSelect={setSelected} selected={selected} />
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-none border-l border-border overflow-hidden">
            <StationDetail station={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
