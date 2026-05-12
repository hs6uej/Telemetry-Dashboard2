'use client'
import { useEffect, useState, type ReactNode, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Tab = 'stations' | 'users' | 'logs' | 'configs'

const STATUS_BADGE: Record<string, string> = { normal: '#52c41a', warning: '#faad14', critical: '#f5222d', offline: '#bfbfbf' }
const STATUS_LABEL: Record<string, string> = { normal: 'ปกติ', warning: 'เฝ้าระวัง', critical: 'วิกฤต', offline: 'ออฟไลน์' }

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('stations')
  const [user, setUser] = useState<any>(null)
  const [stations, setStations] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [configs, setConfigs] = useState<any[]>([])
  const [modal, setModal] = useState<any>(null) // { type, data }
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'admin') { router.push('/dashboard'); return }
    setUser(parsed)
    loadStations()
  }, [])

  const showAlert = (msg: string, ok = true) => { setAlert({ msg, ok }); setTimeout(() => setAlert(null), 3000) }

  async function loadStations() { try { setStations(await api.stations.list()) } catch {} }
  async function loadUsers() { try { setUsers(await api.users.list()) } catch {} }
  async function loadLogs() { try { setLogs(await api.users.logs()) } catch {} }
  async function loadConfigs() { try { setConfigs(await (api as any).configs.list()) } catch {} }

  function switchTab(t: Tab) {
    setTab(t)
    if (t === 'stations') loadStations()
    if (t === 'users') loadUsers()
    if (t === 'logs') loadLogs()
    if (t === 'configs') loadConfigs()
  }

  function openModal(type: string, data: any = {}) { setModal({ type }); setForm(data) }
  function closeModal() { setModal(null); setForm({}) }

  async function saveStation() {
    setSaving(true)
    try {
      const payload = {
        name: form.name, lat: +form.lat, lng: +form.lng,
        waterLevel: form.waterLevel !== '' ? +form.waterLevel : undefined,
        rainLevel: form.rainLevel !== '' ? +form.rainLevel : undefined,
        warningLevel: form.warningLevel !== '' ? +form.warningLevel : undefined,
        leftBank: form.leftBank !== '' ? +form.leftBank : undefined,
        rightBank: form.rightBank !== '' ? +form.rightBank : undefined,
        status: form.status || 'normal',
      }
      if (form.id) await api.stations.update(form.id, payload)
      else await api.stations.create(payload)
      showAlert('บันทึกข้อมูลสถานีสำเร็จ')
      closeModal(); loadStations()
    } catch (e: any) { showAlert(e.message || 'เกิดข้อผิดพลาด', false) }
    setSaving(false)
  }

  async function deleteStation(id: number) {
    if (!confirm('ลบสถานีนี้?')) return
    await api.stations.delete(id); showAlert('ลบสำเร็จ'); loadStations()
  }

  async function saveUser() {
    setSaving(true)
    try {
      const payload = { username: form.username, role: form.role, approved: form.approved, ...(form.password ? { password: form.password } : {}) }
      if (form.id) await api.users.update(form.id, payload)
      else await api.users.create({ ...payload, password: form.password })
      showAlert('บันทึกข้อมูลผู้ใช้สำเร็จ')
      closeModal(); loadUsers()
    } catch (e: any) { showAlert(e.message || 'เกิดข้อผิดพลาด', false) }
    setSaving(false)
  }

  async function deleteUser(id: number) {
    if (!confirm('ลบผู้ใช้?')) return
    await api.users.delete(id); showAlert('ลบสำเร็จ'); loadUsers()
  }

  async function approveUser(id: number) {
    await api.users.approve(id); showAlert('อนุมัติสำเร็จ'); loadUsers()
  }

  async function saveConfig() {
    setSaving(true)
    try {
      const payload = { name: form.name, apiEndpoint: form.apiEndpoint, apiKey: form.apiKey, sendInterval: +form.sendInterval || 300, enabled: form.enabled !== false }
      if (form.id) await (api as any).configs.update(form.id, payload)
      else await (api as any).configs.create(payload)
      showAlert('บันทึกการตั้งค่าสำเร็จ')
      closeModal(); loadConfigs()
    } catch (e: any) { showAlert(e.message || 'เกิดข้อผิดพลาด', false) }
    setSaving(false)
  }

  async function deleteConfig(id: number) {
    if (!confirm('ลบการตั้งค่านี้?')) return
    await (api as any).configs.delete(id); showAlert('ลบสำเร็จ'); loadConfigs()
  }

  async function sendConfig(id: number) {
    try {
      const r = await (api as any).configs.send(id)
      showAlert(r.message)
      loadConfigs()
    } catch (e: any) { showAlert(e.message || 'ส่งข้อมูลล้มเหลว', false) }
  }

  async function clearLogs() {
    if (!confirm('ล้างประวัติเก่าเกิน 30 วัน?')) return
    await (api as any).users.clearLogs(); showAlert('ล้างประวัติสำเร็จ'); loadLogs()
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'stations', label: 'จัดการสถานีวัดน้ำ', icon: '📍' },
    { key: 'users', label: 'จัดการผู้ใช้งาน', icon: '👥' },
    { key: 'logs', label: 'บันทึกกิจกรรม', icon: '📋' },
    { key: 'configs', label: 'ตั้งค่า API ภายนอก', icon: '☁️' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Kanit, Sarabun, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)', padding: '14px 0', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            🛡️ ระบบบริหารจัดการข้อมูลโทรมาตร
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard')} style={navBtn('light')}>🗺️ หน้าแผนที่</button>
            <button onClick={() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); router.push('/login') }} style={navBtn('outline')}>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        {/* Alert */}
        {alert && (
          <div style={{ background: alert.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${alert.ok ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '12px 20px', marginBottom: 16, color: alert.ok ? '#166534' : '#991b1b', fontWeight: 500 }}>
            {alert.ok ? '✅' : '❌'} {alert.msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => switchTab(t.key)} style={{
              padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 500,
              fontFamily: 'Kanit, Sarabun, sans-serif', fontSize: 14, transition: 'all .2s',
              background: tab === t.key ? '#1e3a8a' : '#e2e8f0',
              color: tab === t.key ? '#fff' : '#64748b',
              boxShadow: tab === t.key ? '0 4px 12px rgba(30,58,138,.3)' : 'none',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ===== STATIONS TAB ===== */}
        {tab === 'stations' && (
          <Card title="รายการสถานีวัดน้ำในระบบ" action={<Btn onClick={() => openModal('station', { status: 'normal' })}>+ เพิ่มสถานีใหม่</Btn>}>
            <Table headers={['ID', 'ชื่อสถานี', 'พิกัด', 'ระดับน้ำ / ฝน', 'สถานะ', '']}>
              {stations.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Td>{s.id}</Td>
                  <Td><b>{s.name}</b></Td>
                  <Td><small style={{ color: '#94a3b8' }}>{s.lat?.toFixed(4)}, {s.lng?.toFixed(4)}</small></Td>
                  <Td>
                    <span style={{ color: '#1976d2', fontSize: 13 }}>💧 {s.waterLevel ?? '--'} ม.</span>
                    {' / '}
                    <span style={{ color: '#52c41a', fontSize: 13 }}>🌧️ {s.rainLevel ?? '--'} มม.</span>
                  </Td>
                  <Td><StatusBadge status={s.status} /></Td>
                  <Td align="right">
                    <IconBtn onClick={() => openModal('station', { id: s.id, name: s.name, lat: s.lat, lng: s.lng, waterLevel: s.waterLevel, rainLevel: s.rainLevel, warningLevel: s.warningLevel, leftBank: s.leftBank, rightBank: s.rightBank, status: s.status })} title="แก้ไข">✏️</IconBtn>
                    <IconBtn onClick={() => deleteStation(s.id)} title="ลบ">🗑️</IconBtn>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {/* ===== USERS TAB ===== */}
        {tab === 'users' && (
          <Card title="จัดการบัญชีผู้ใช้งาน" action={<Btn onClick={() => openModal('user', { role: 'user', approved: true })}>+ เพิ่มผู้ใช้</Btn>}>
            <Table headers={['ID', 'ชื่อผู้ใช้', 'บทบาท', 'สถานะ', 'สมัครเมื่อ', '']}>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Td>{u.id}</Td>
                  <Td><b>{u.username}</b></Td>
                  <Td><span style={{ background: u.role === 'admin' ? '#fee2e2' : '#e0e7ff', color: u.role === 'admin' ? '#dc2626' : '#4338ca', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{u.role}</span></Td>
                  <Td>
                    <span style={{ background: u.approved ? '#dcfce7' : '#fef9c3', color: u.approved ? '#166534' : '#92400e', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                      {u.approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                    </span>
                    {!u.approved && <button onClick={() => approveUser(u.id)} style={{ marginLeft: 8, fontSize: 11, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>อนุมัติ</button>}
                  </Td>
                  <Td><small style={{ color: '#94a3b8' }}>{new Date(u.createdAt).toLocaleDateString('th-TH')}</small></Td>
                  <Td align="right">
                    <IconBtn onClick={() => openModal('user', { id: u.id, username: u.username, role: u.role, approved: u.approved })}>✏️</IconBtn>
                    <IconBtn onClick={() => deleteUser(u.id)}>🗑️</IconBtn>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {/* ===== LOGS TAB ===== */}
        {tab === 'logs' && (
          <Card title="ประวัติกิจกรรมล่าสุด" action={<button onClick={clearLogs} style={{ ...navBtn('outline'), background: '#fff', color: '#dc2626', border: '1px solid #fca5a5' }}>🗑️ ล้างประวัติเก่า</button>}>
            <Table headers={['เวลา', 'ผู้ใช้งาน', 'กิจกรรม', 'รายละเอียด']}>
              {logs.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Td><small style={{ color: '#94a3b8' }}>{new Date(l.timestamp).toLocaleString('th-TH')}</small></Td>
                  <Td><b>{l.user_name || 'System'}</b></Td>
                  <Td><span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>{l.action}</span></Td>
                  <Td><small>{l.details}</small></Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {/* ===== CONFIGS TAB ===== */}
        {tab === 'configs' && (
          <Card title="รายการเชื่อมต่อ API ภายนอก" action={<Btn onClick={() => openModal('config', { sendInterval: 300, enabled: true })}>+ เพิ่มการเชื่อมต่อ</Btn>}>
            <Table headers={['ชื่อ', 'Endpoint', 'ความถี่', 'ส่งล่าสุด', 'สถานะ', '']}>
              {configs.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Td><b>{c.name}</b></Td>
                  <Td><small style={{ color: '#94a3b8' }}>{c.apiEndpoint}</small></Td>
                  <Td>{Math.round((c.sendInterval || 300) / 60)} นาที</Td>
                  <Td><small>{c.lastSent ? new Date(c.lastSent).toLocaleString('th-TH') : 'ยังไม่เคยส่ง'}</small></Td>
                  <Td><span style={{ background: c.enabled ? '#dcfce7' : '#f1f5f9', color: c.enabled ? '#166534' : '#64748b', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{c.enabled ? 'เปิด' : 'ปิด'}</span></Td>
                  <Td align="right">
                    <IconBtn onClick={() => sendConfig(c.id)} title="ทดสอบส่ง">📤</IconBtn>
                    <IconBtn onClick={() => openModal('config', { id: c.id, name: c.name, apiEndpoint: c.apiEndpoint, apiKey: c.apiKey, sendInterval: c.sendInterval, enabled: c.enabled })}>✏️</IconBtn>
                    <IconBtn onClick={() => deleteConfig(c.id)}>🗑️</IconBtn>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
      </div>

      {/* ===== MODALS ===== */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: modal.type === 'station' ? 640 : 480, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {modal.type === 'station' && (form.id ? 'แก้ไขสถานีวัดน้ำ' : 'เพิ่มสถานีใหม่')}
                {modal.type === 'user' && (form.id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่')}
                {modal.type === 'config' && (form.id ? 'แก้ไขการเชื่อมต่อ API' : 'เพิ่มการเชื่อมต่อ API')}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>

              {/* Station form */}
              {modal.type === 'station' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1/-1' }}><Field label="ชื่อสถานี" value={form.name} onChange={v => setForm({ ...form, name: v })} required /></div>
                  <Field label="ละติจูด (Lat)" type="number" value={form.lat} onChange={v => setForm({ ...form, lat: v })} required />
                  <Field label="ลองจิจูด (Lng)" type="number" value={form.lng} onChange={v => setForm({ ...form, lng: v })} required />
                  <Field label="ระดับน้ำปัจจุบัน (ม.)" type="number" value={form.waterLevel} onChange={v => setForm({ ...form, waterLevel: v })} />
                  <Field label="ปริมาณฝน (มม.)" type="number" value={form.rainLevel} onChange={v => setForm({ ...form, rainLevel: v })} />
                  <Field label="ระดับเฝ้าระวัง (ม.)" type="number" value={form.warningLevel} onChange={v => setForm({ ...form, warningLevel: v })} />
                  <Field label="ตลิ่งซ้าย (ม.)" type="number" value={form.leftBank} onChange={v => setForm({ ...form, leftBank: v })} />
                  <Field label="ตลิ่งขวา (ม.)" type="number" value={form.rightBank} onChange={v => setForm({ ...form, rightBank: v })} />
                  <div>
                    <label style={labelStyle}>สถานะ</label>
                    <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="normal">ปกติ</option>
                      <option value="warning">เฝ้าระวัง</option>
                      <option value="critical">วิกฤต</option>
                      <option value="offline">ออฟไลน์</option>
                    </select>
                  </div>
                </div>
              )}

              {/* User form */}
              {modal.type === 'user' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="ชื่อผู้ใช้งาน" value={form.username} onChange={v => setForm({ ...form, username: v })} required />
                  <Field label={form.id ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน'} type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} required={!form.id} />
                  <div>
                    <label style={labelStyle}>บทบาท</label>
                    <select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="user">ผู้ใช้งานทั่วไป</option>
                      <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form.approved} onChange={e => setForm({ ...form, approved: e.target.checked })} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 14 }}>อนุมัติการใช้งาน</span>
                  </label>
                </div>
              )}

              {/* Config form */}
              {modal.type === 'config' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="ชื่อการเชื่อมต่อ" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
                  <Field label="API Endpoint (URL)" value={form.apiEndpoint} onChange={v => setForm({ ...form, apiEndpoint: v })} required />
                  <Field label="API Key (ถ้ามี)" value={form.apiKey} onChange={v => setForm({ ...form, apiKey: v })} />
                  <Field label="ความถี่ในการส่ง (วินาที)" type="number" value={form.sendInterval} onChange={v => setForm({ ...form, sendInterval: v })} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 14 }}>เปิดใช้งาน</span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontFamily: 'Kanit, Sarabun, sans-serif' }}>ยกเลิก</button>
                <button onClick={modal.type === 'station' ? saveStation : modal.type === 'user' ? saveUser : saveConfig} disabled={saving}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1e3a8a', color: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'Kanit, Sarabun, sans-serif', opacity: saving ? .7 : 1 }}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Sub-components ----
function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)', marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h5 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: 17 }}>{title}</h5>
        {action}
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  )
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h} style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '.025em', padding: '12px 20px', textAlign: 'left' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

function Td({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' | 'center' }) {
  return <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: align, fontSize: 14 }}>{children}</td>
}

function Btn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Kanit, Sarabun, sans-serif' }}>{children}</button>
}

function IconBtn({ children, onClick, title }: { children: ReactNode; onClick: () => void; title?: string }) {
  return <button onClick={onClick} title={title} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', marginLeft: 4, fontSize: 14 }}>{children}</button>
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_BADGE[status] || '#bfbfbf'
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{STATUS_LABEL[status] || status}</span>
}

function Field({ label, value, onChange, type = 'text', required }: {
  label: string; value: string | number | undefined; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <input type={type} step="any" value={value ?? ''} onChange={e => onChange(e.target.value)} required={required}
        style={inputStyle} />
    </div>
  )
}

const labelStyle: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }
const inputStyle: CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'Kanit, Sarabun, sans-serif', boxSizing: 'border-box', outline: 'none' }

function navBtn(variant: 'light' | 'outline'): CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
    fontFamily: 'Kanit, Sarabun, sans-serif',
    background: variant === 'light' ? '#fff' : 'transparent',
    color: variant === 'light' ? '#1e3a8a' : '#fff',
    border: variant === 'outline' ? '1px solid rgba(255,255,255,.5)' : 'none',
  }
}
