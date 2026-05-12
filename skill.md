# Telemetry Dashboard — Component Guide & Customization Skill

## ภาพรวม Components

ไฟล์ `telemetry.html` เป็น standalone HTML ไม่ต้องติดตั้ง backend ใด ๆ ใช้งานได้ทันทีโดยเปิดในเบราว์เซอร์

---

## โครงสร้าง Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: โลโก้ | ชื่อระบบ | ปุ่ม nav | นาฬิกา            │
├─────────────────────────────────────────────────────────────┤
│  STATUS BAR: นับสถานี ปกติ / เฝ้าระวัง / วิกฤต / ออฟไลน์ │
├──────────────┬───────────────────────────┬──────────────────┤
│  SIDEBAR     │  MAP (Leaflet.js)         │  RIGHT PANEL     │
│  ─ Filter    │  ─ tile layer (dark)      │  (detail panel)  │
│  ─ Table     │  ─ custom markers         │  ─ gauge values  │
│  ─ Chart     │  ─ popup card             │  ─ mini chart    │
│    (bottom)  │  ─ overlay: summary       │  ─ info grid     │
│              │  ─ legend                 │                  │
└──────────────┴───────────────────────────┴──────────────────┘
```

---

## Components รายละเอียด

### 1. Header
- โลโก้วงกลม (เปลี่ยนข้อความ/สีได้)
- ชื่อระบบ (บรรทัดที่ 1 = ชื่อหลัก, บรรทัดที่ 2 = คำอธิบาย)
- ปุ่ม nav: แผนที่ / ตาราง / กราฟ
- นาฬิกา real-time (auto update ทุกวินาที)

### 2. Status Bar
- นับจำนวนสถานีแยกตามสถานะ
- แสดงเวลาอัปเดตล่าสุด
- ข้อมูลดึงจาก `STATIONS` array อัตโนมัติ

### 3. Sidebar — Filter
- Dropdown กรองตาม **ลุ่มน้ำ** (region)
- Dropdown กรองตาม **สถานะ** (status)
- เพิ่ม option ได้ใน `<select id="filter-region">`

### 4. Sidebar — Station Table
- คอลัมน์: สถานี | ระดับน้ำ | ฝน | สถานะ
- คลิกแถวเพื่อเลือกสถานี → highlight + เปิด detail panel
- color-coded ตามสถานะ

### 5. Sidebar — Chart (ด้านล่าง sidebar)
- Line chart แสดงประวัติ 7 ช่วงเวลา
- Toggle: **ระดับน้ำ** / **ปริมาณฝน**
- เส้นประสีแดง = ระดับตลิ่ง (bankLevel)
- Library: Chart.js v4

### 6. แผนที่ (Leaflet.js)
- Tile: CartoDB Dark (ไม่ต้อง API key)
- Marker สีตามสถานะ (เขียว/เหลือง/แดง/เทา)
- สถานะ `critical` → marker กระพริบ (CSS animation)
- คลิก marker → popup card → ปุ่ม "ดูรายละเอียด"
- Overlay ซ้ายบน: สรุปจำนวนสถานี
- Legend ขวาล่าง: อธิบาย color coding

### 7. Right Detail Panel (เปิด/ปิดได้)
- เปิดเมื่อคลิกสถานีใด ๆ
- Gauge: ระดับน้ำ | ปริมาณฝน | อัตราไหล
- Mini chart: Bar (น้ำ) + Line (ฝน) dual-axis
- Info grid: ระดับตลิ่ง | % ความจุ | แนวโน้ม | เวลาอัปเดต
- ปุ่ม ✕ ปิดได้

---

## วิธีแก้ไขข้อมูล 5 สถานี

แก้ที่ `const STATIONS = [...]` ในไฟล์ telemetry.html

### ฟิลด์แต่ละสถานี

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|--------|-----------|
| `id` | string | รหัสสถานี เช่น `'TM001'` |
| `name` | string | ชื่อสถานี (มี prefix `'สถานีวัดน้ำ '`) |
| `region` | string | `'north'` / `'central'` / `'east'` |
| `lat` | number | Latitude (พิกัด GPS) |
| `lon` | number | Longitude (พิกัด GPS) |
| `waterLevel` | number/null | ระดับน้ำปัจจุบัน (เมตร) ใส่ `null` = ออฟไลน์ |
| `bankLevel` | number | ระดับตลิ่ง (เมตร) |
| `rain` | number/null | ปริมาณฝน (มม./ชม.) |
| `flow` | number/null | อัตราการไหล (ม³/วินาที) |
| `status` | string | `'normal'` / `'warning'` / `'critical'` / `'offline'` |
| `trend` | string | แนวโน้มระดับน้ำ เช่น `'เพิ่มขึ้น'` |
| `lastUpdate` | string | เวลาอัปเดตล่าสุด |
| `history.water` | number[] | ประวัติระดับน้ำ 7 ค่า |
| `history.rain` | number[] | ประวัติปริมาณฝน 7 ค่า |
| `history.labels` | string[] | Label เวลา 7 ค่า เช่น `['08:00','09:00',...]` |

### ตัวอย่าง

```javascript
{
  id: 'TM001',
  name: 'สถานีวัดน้ำ คลองชัยนาท',
  region: 'central',
  lat: 15.185,
  lon: 100.133,
  waterLevel: 6.52,
  bankLevel: 7.00,
  rain: 0.0,
  flow: 124.5,
  status: 'normal',
  trend: 'คงที่',
  lastUpdate: '22/04/2569 14:30',
  history: {
    water:  [5.80, 5.90, 6.10, 6.20, 6.35, 6.40, 6.52],
    rain:   [0.0,  0.0,  2.4,  0.0,  0.0,  0.0,  0.0],
    labels: ['08:00','09:00','10:00','11:00','12:00','13:00','14:00']
  }
}
```

---

## สถานะ Logic

| สถานะ | เงื่อนไขแนะนำ | สี |
|-------|--------------|-----|
| `normal` | waterLevel < bankLevel × 0.80 | เขียว `#2ecc71` |
| `warning` | waterLevel >= bankLevel × 0.80 | เหลือง `#f39c12` |
| `critical` | waterLevel >= bankLevel | แดง `#e74c3c` (กระพริบ) |
| `offline` | ไม่ได้รับข้อมูล | เทา `#7f8c8d` |

---

## Live Simulation

- ข้อมูลจะ **auto-update ทุก 30 วินาที** (จำลอง sensor)
- ปรับ interval ได้ที่บรรทัดสุดท้าย: `setInterval(() => {...}, 30000)`
- หากต้องการดึง API จริง ให้แทนที่ด้วย `fetch()` ใน interval นั้น

### ตัวอย่างดึง API จริง

```javascript
setInterval(async () => {
  const res = await fetch('https://your-api.com/stations');
  const data = await res.json();
  data.forEach(item => {
    const s = STATIONS.find(x => x.id === item.id);
    if (s) {
      s.waterLevel = item.water_level;
      s.rain = item.rainfall;
      s.status = item.status;
    }
  });
  renderTable(STATIONS);
  updateStatusBar();
}, 30000);
```

---

## Dependencies (CDN — ไม่ต้อง install)

| Library | Version | ใช้ทำอะไร |
|---------|---------|-----------|
| Leaflet.js | 1.9.4 | แผนที่ interactive |
| Chart.js | 4.4.0 | กราฟ line/bar |
| Google Fonts Sarabun | — | ฟอนต์ภาษาไทย |
| CartoDB Dark tiles | — | tile layer แผนที่ (ไม่ต้อง API key) |

---

## การปรับแต่งด่วน

### เปลี่ยนชื่อระบบ
```html
<h1>ระบบโทรมาตร</h1>
<p>เพื่อการพยากรณ์น้ำและเตือนภัย</p>
```

### เปลี่ยนโลโก้
```html
<div class="logo-circle">WT</div>  <!-- เปลี่ยนตัวอักษรหรือใส่ <img> -->
```

### เปลี่ยน color scheme หลัก
```css
/* ค้นหา #1abc9c แล้วเปลี่ยนเป็นสีที่ต้องการ */
/* ค้นหา #0a3d62 สำหรับ background หลัก */
```

### เพิ่มสถานีเกิน 5
- เพิ่ม object เข้าไปใน `const STATIONS = [...]` ได้ทันที
- แผนที่และตารางจะอัปเดตอัตโนมัติ

### เปลี่ยน tile map เป็น OpenStreetMap ปกติ
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);
```
