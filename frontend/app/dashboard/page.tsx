'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Station } from '@/lib/types'
import { api } from '@/lib/api'

const TelemetryMap = dynamic(() => import('@/components/map/TelemetryMap'), { ssr: false })

const STATUS_COLOR: Record<string, string> = {
  normal: '#52c41a', warning: '#faad14', critical: '#f5222d', offline: '#bfbfbf',
}
const STATUS_LABEL: Record<string, string> = {
  normal: 'ปกติ', warning: 'เฝ้าระวัง', critical: 'วิกฤต', offline: 'ออฟไลน์',
}

export default function DashboardPage() {
  const router = useRouter()
  const [stations, setStations] = useState<Station[]>([])
  const [filtered, setFiltered] = useState<Station[]>([])
  const [selected, setSelected] = useState<Station | null>(null)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [clock, setClock] = useState('')
  const [clockDate, setClockDate] = useState('')

  const loadStations = useCallback(async () => {
    try {
      const data = await api.stations.list()
      setStations(data)
      setFiltered(data)
    } catch {}
  }, [])

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
    loadStations()
    const interval = setInterval(loadStations, 30_000)
    return () => clearInterval(interval)
  }, [loadStations])

  useEffect(() => {
    function tick() {
      const now = new Date()
      setClock(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setClockDate(now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q ? stations.filter(s => s.name.toLowerCase().includes(q) || String(s.id).includes(q)) : stations)
  }, [search, stations])

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const counts = {
    total: stations.length,
    normal: stations.filter(s => s.status === 'normal').length,
    warning: stations.filter(s => s.status === 'warning').length,
    critical: stations.filter(s => s.status === 'critical').length,
    offline: stations.filter(s => s.status === 'offline').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f0f2f5' }}>

      {/* ===== HEADER ===== */}
      <header style={{
        height: 64, background: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1005,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        border: '1px solid #e0e6ed', margin: '0 10px', flexShrink: 0,
      }}>
        {/* Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <img
            src="https://telerid.rid.go.th/static/media/logo.7e64c49a.png"
            style={{ height: 40, cursor: 'pointer' }}
            alt="RID Logo"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <nav style={{ display: 'flex', gap: 32, marginLeft: 48 }}>
            <span style={{ color: '#1976d2', fontWeight: 500, fontSize: 14, cursor: 'pointer', borderBottom: '2px solid #1976d2', paddingBottom: 2 }}>
              หน้าหลัก
            </span>
            {user?.role === 'admin' && (
              <span
                onClick={() => router.push('/admin')}
                style={{ color: '#64748b', fontWeight: 400, fontSize: 14, cursor: 'pointer' }}
              >
                ระบบจัดการข้อมูล
              </span>
            )}
          </nav>
        </div>

        {/* Clock */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1, marginRight: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#000' }}>{clock}</span>
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>{clockDate}</span>
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              👤 {user.username}
            </span>
          )}
          {user ? (
            <button onClick={logout} style={btnStyle}>ออกจากระบบ</button>
          ) : (
            <button onClick={() => router.push('/login')} style={btnStyle}>เข้าสู่ระบบ</button>
          )}
        </div>
      </header>

      {/* ===== MAIN MAP AREA ===== */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Map fullscreen */}
        <TelemetryMap
          stations={filtered}
          onSelect={setSelected}
          selected={selected}
        />

        {/* Search box overlay (top-left) */}
        <div style={{
          position: 'absolute', top: 40, left: 40, width: 350, zIndex: 1001,
          transform: collapsed ? 'translateX(-310px)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.7,0.3,0.1,1)',
        }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s' }}>ระบบโทรมาตร</span>
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{ background: '#fff', width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg viewBox="64 64 896 896" width="18" height="18" fill="#555">
                <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM115.4 518.9L271.7 642c5.8 4.6 14.4.5 14.4-6.9V388.9c0-7.4-8.5-11.5-14.4-6.9L115.4 505.1a8.74 8.74 0 000 13.8z" />
              </svg>
            </button>
          </h1>
          {!collapsed && (
            <>
              <p style={{ margin: '4px 0 24px', fontSize: 16, color: '#555' }}>เพื่อการพยากรณ์น้ำและเตือนภัย</p>
              <div style={{ position: 'relative', background: '#fff', borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden' }}>
                <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, fill: '#bfbfbf' }} viewBox="64 64 896 896">
                  <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-165.7-134.3-300-300-300S112 246.3 112 412s134.3 300 300 300c67 0 130.7-21.8 182.8-62.1l259.7 259.7c4.3 4.3 11.4 4.3 15.7 0l45.2-45.2c2.3-2.3 2.3-6.1 0-8.4zM412 650c-131.4 0-238-106.6-238-238s106.6-238 238-238 238 106.6 238 238-106.6 238-238 238z" />
                </svg>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสถานี..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 44px', border: 'none', fontSize: 14, outline: 'none', background: 'transparent', fontFamily: 'Kanit, Sarabun, sans-serif' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Stats overlay (bottom-left) */}
        <div style={{
          position: 'absolute', bottom: 24, left: 24, background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)', padding: 16, borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1001, border: '1px solid #e0e6ed',
        }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 500, borderBottom: '1px solid #e0e6ed', paddingBottom: 8 }}>ภาพรวมสถานีวัด</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'ทั้งหมด', val: counts.total, color: '#1976d2' },
              { label: 'ปกติ', val: counts.normal, color: '#52c41a' },
              { label: 'เฝ้าระวัง', val: counts.warning, color: '#faad14' },
              { label: 'วิกฤต', val: counts.critical, color: '#f5222d' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color }}>{val}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend (bottom-right) */}
        <div style={{
          position: 'absolute', bottom: 24, right: 24, background: '#fff',
          borderRadius: 8, padding: 14, fontSize: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, border: '1px solid #e0e6ed', minWidth: 150,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1976d2', marginBottom: 10, textTransform: 'uppercase' }}>สถานะสถานี</div>
          {[
            { label: 'ปกติ', color: '#2ecc71' },
            { label: 'เฝ้าระวัง', color: '#f39c12' },
            { label: 'วิกฤต', color: '#e74c3c' },
            { label: 'ออฟไลน์', color: '#7f8c8d' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Right detail panel */}
        {selected && (
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 350, height: '100%',
            background: '#fff', borderLeft: '1px solid #e0e6ed',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.08)', zIndex: 1002, overflowY: 'auto',
          }}>
            {/* Panel header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e6ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', flex: 1, marginRight: 8 }}>{selected.name}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b', padding: 4, borderRadius: 4 }}>✕</button>
            </div>

            {/* Status badge */}
            <div style={{ padding: '12px 24px 0' }}>
              <span style={{ background: STATUS_COLOR[selected.status] + '22', color: STATUS_COLOR[selected.status], border: `1px solid ${STATUS_COLOR[selected.status]}44`, borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 500 }}>
                {STATUS_LABEL[selected.status]}
              </span>
            </div>

            {/* Gauge values */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e6ed', padding: 20, margin: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#64748b', marginBottom: 16 }}>ค่าปัจจุบัน</div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#1976d2', lineHeight: 1.2 }}>
                    {selected.waterLevel != null ? selected.waterLevel.toFixed(2) : '--'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>เมตร</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>ระดับน้ำ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#52c41a', lineHeight: 1.2 }}>
                    {selected.rainLevel != null ? selected.rainLevel.toFixed(1) : '--'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>มม.</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>ปริมาณฝน</div>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '0 16px 16px' }}>
              {[
                { label: 'ระดับเฝ้าระวัง', val: selected.warningLevel ? selected.warningLevel.toFixed(2) + ' ม.' : '--' },
                { label: 'ตลิ่งซ้าย', val: selected.leftBank ? selected.leftBank.toFixed(2) + ' ม.' : '--' },
                { label: 'ตลิ่งขวา', val: selected.rightBank ? selected.rightBank.toFixed(2) + ' ม.' : '--' },
                { label: 'อัปเดตล่าสุด', val: selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '--' },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e0e6ed', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Readings history link */}
            <StationReadingsChart stationId={selected.id} warningLevel={selected.warningLevel} />
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Mini chart component ----
function StationReadingsChart({ stationId, warningLevel }: { stationId: number; warningLevel: number | null }) {
  const [readings, setReadings] = useState<any[]>([])

  useEffect(() => {
    api.readings.get(stationId, 24).then(setReadings).catch(() => setReadings([]))
  }, [stationId])

  if (readings.length === 0) return null

  const max = Math.max(...readings.map(r => r.waterLevel ?? 0), warningLevel ?? 0) * 1.1
  const min = Math.min(...readings.map(r => r.waterLevel ?? 0)) * 0.95
  const w = 300, h = 140, pad = { t: 10, r: 10, b: 30, l: 40 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const n = readings.length

  const points = readings.map((r, i) => {
    const x = pad.l + (i / (n - 1)) * iw
    const y = pad.t + ih - ((( r.waterLevel ?? min) - min) / (max - min)) * ih
    return `${x},${y}`
  }).join(' ')

  const warnY = warningLevel != null ? pad.t + ih - ((warningLevel - min) / (max - min)) * ih : null

  const labels = [readings[0], readings[Math.floor(n / 2)], readings[n - 1]].map((r, i) => ({
    x: pad.l + ([0, Math.floor(n / 2), n - 1][i] / (n - 1)) * iw,
    label: new Date(r.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  }))

  return (
    <div style={{ background: '#fff', border: '1px solid #e0e6ed', borderRadius: 8, padding: 20, margin: '0 16px 24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#64748b', marginBottom: 12 }}>กราฟระดับน้ำ 24 ชม.</div>
      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        {warnY != null && (
          <line x1={pad.l} y1={warnY} x2={pad.l + iw} y2={warnY} stroke="#f5222d" strokeWidth={1} strokeDasharray="4 3" />
        )}
        <polyline points={points} fill="none" stroke="#1976d2" strokeWidth={2} strokeLinejoin="round" />
        {readings.map((r, i) => (
          <circle
            key={i}
            cx={pad.l + (i / (n - 1)) * iw}
            cy={pad.t + ih - (((r.waterLevel ?? min) - min) / (max - min)) * ih}
            r={2.5} fill="#1976d2"
          />
        ))}
        {labels.map(({ x, label }) => (
          <text key={label} x={x} y={h - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">{label}</text>
        ))}
      </svg>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#1976d2', color: '#fff', border: 'none', padding: '6px 16px',
  borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Kanit, Sarabun, sans-serif',
}
