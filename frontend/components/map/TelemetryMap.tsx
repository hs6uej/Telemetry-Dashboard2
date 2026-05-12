'use client'
import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import OLPoint from 'ol/geom/Point'
import type Geometry from 'ol/geom/Geometry'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Overlay from 'ol/Overlay'
import ZoomControl from 'ol/control/Zoom'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import type { Station } from '@/lib/types'

interface Props {
  stations: Station[]
  onSelect: (station: Station) => void
  selected: Station | null
}

const STATUS_COLOR: Record<string, string> = {
  normal: '#52c41a', warning: '#faad14', critical: '#f5222d', offline: '#bfbfbf',
}
const STATUS_LABEL: Record<string, string> = {
  normal: 'ปกติ', warning: 'เฝ้าระวัง', critical: 'วิกฤต', offline: 'ออฟไลน์',
}

function makeStyle(st: Station) {
  return new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: STATUS_COLOR[st.status] || '#bfbfbf' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  })
}

function buildFeatures(list: Station[]): Feature<Geometry>[] {
  return list.map(st => {
    const f = new Feature<Geometry>({ geometry: new OLPoint(fromLonLat([st.lng, st.lat])), station: st })
    f.setId(st.id)
    f.setStyle(makeStyle(st))
    return f
  })
}

export default function TelemetryMap({ stations, onSelect }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapObjRef   = useRef<Map | null>(null)
  const sourceRef   = useRef<VectorSource | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return

    // ===== Tile layers =====
    const waterLayer  = new TileLayer({ source: new XYZ({ url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', attributions: '© OpenStreetMap' }), visible: true })
    const topoLayer   = new TileLayer({ source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' }), visible: false })
    const satLayer    = new TileLayer({ source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' }), visible: false })
    const streetLayer = new TileLayer({ source: new XYZ({ url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png' }), visible: false })
    const labelsLayer = new TileLayer({ source: new XYZ({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}' }), visible: false })
    const hillshade   = new TileLayer({ source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}' }), opacity: 0.5, visible: false })

    // ===== Vector layer =====
    const vectorSource = new VectorSource({ features: buildFeatures(stations) })
    sourceRef.current  = vectorSource
    const vectorLayer  = new VectorLayer({ source: vectorSource, zIndex: 10 })

    // ===== Overlays =====
    const popupEl = document.createElement('div')
    popupEl.style.cssText = 'background:#fff;border:1px solid #e0e6ed;border-top:4px solid #1976d2;border-radius:12px;padding:12px 16px;min-width:200px;font-family:Kanit,Sarabun,sans-serif;box-shadow:0 10px 25px rgba(0,0,0,.1);'
    const popupOverlay = new Overlay({ element: popupEl, positioning: 'bottom-center', offset: [0, -14], autoPan: false })

    const tipEl = document.createElement('div')
    tipEl.style.cssText = 'background:rgba(0,51,102,.9);border-radius:4px;padding:5px 10px;color:#fff;font-size:13px;pointer-events:none;font-family:Kanit,Sarabun,sans-serif;'
    const tipOverlay = new Overlay({ element: tipEl, positioning: 'bottom-center', offset: [0, -14] })

    // ===== Map =====
    const map = new Map({
      target: mapRef.current,
      layers: [waterLayer, topoLayer, satLayer, streetLayer, hillshade, labelsLayer, vectorLayer],
      overlays: [popupOverlay, tipOverlay],
      controls: defaultControls({ zoom: false, attribution: true }),
      view: new View({ center: fromLonLat([100.5, 13.7]), zoom: 6 }),
    })
    map.addControl(new ZoomControl({ className: 'ol-zoom' }))
    mapObjRef.current = map

    // ===== Layer switcher =====
    const layerDefs = [
      { label: '🌊 เน้นแหล่งน้ำ/พื้นที่ (หลัก)', layer: waterLayer },
      { label: '⛰️ แผนที่ภูมิประเทศ',             layer: topoLayer },
      { label: '🌍 ภาพถ่ายดาวเทียม',               layer: satLayer },
      { label: '🛣️ แผนที่ถนน',                    layer: streetLayer },
      { label: '📍 ชื่อสถานที่/ขอบเขต',            layer: labelsLayer },
      { label: '🌗 แรเงาความสูงพื้นผิว',            layer: hillshade },
    ]
    const switcherEl = document.createElement('div')
    switcherEl.style.cssText = 'position:absolute;top:10px;right:10px;background:#fff;border:1px solid #e0e6ed;border-radius:8px;padding:12px 16px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,.1);font-family:Kanit,Sarabun,sans-serif;font-size:13px;min-width:220px;'
    switcherEl.innerHTML = '<div style="font-weight:600;color:#1976d2;margin-bottom:10px;font-size:12px;text-transform:uppercase;letter-spacing:.5px">เลือกชั้นแผนที่</div>'
    layerDefs.forEach(({ label, layer }) => {
      const row = document.createElement('label')
      row.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:3px 0;'
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.checked = layer.getVisible()
      cb.style.cursor = 'pointer'
      cb.addEventListener('change', () => layer.setVisible(cb.checked))
      row.appendChild(cb)
      row.appendChild(document.createTextNode(label))
      switcherEl.appendChild(row)
    })
    mapRef.current.appendChild(switcherEl)

    // ===== Events =====
    map.on('click', (evt: any) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f: any) => f)
      if (feature) {
        const st = feature.get('station') as Station
        onSelect(st)
        const geom = feature.getGeometry() as OLPoint
        popupEl.innerHTML = `
          <div style="font-size:15px;font-weight:700;color:#1976d2;margin-bottom:10px">${st.name}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px"><span style="color:#64748b">ระดับน้ำ</span><span style="font-weight:700">${st.waterLevel != null ? st.waterLevel.toFixed(2) + ' ม.' : '--'}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px"><span style="color:#64748b">ปริมาณฝน</span><span style="font-weight:700;color:#52c41a">${st.rainLevel != null ? st.rainLevel.toFixed(1) + ' มม.' : '--'}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#64748b">สถานะ</span><span style="font-weight:700;color:${STATUS_COLOR[st.status]}">${STATUS_LABEL[st.status]}</span></div>
        `
        popupOverlay.setPosition(geom.getCoordinates())
      } else {
        popupOverlay.setPosition(undefined)
      }
    })

    map.on('pointermove', (evt: any) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f: any) => f)
      if (feature) {
        const st = feature.get('station') as Station
        tipEl.innerHTML = `<div style="text-align:center"><div style="font-weight:bold;border-bottom:1px solid rgba(255,255,255,.3);margin-bottom:3px;padding-bottom:2px">${st.name}</div><div style="font-size:11px">💧 ${st.waterLevel != null ? st.waterLevel.toFixed(2) : '--'} ม. &nbsp; 🌧️ ${st.rainLevel != null ? st.rainLevel.toFixed(1) : '--'} มม.</div></div>`
        tipOverlay.setPosition((feature.getGeometry() as OLPoint).getCoordinates())
        map.getTargetElement().style.cursor = 'pointer'
      } else {
        tipOverlay.setPosition(undefined)
        map.getTargetElement().style.cursor = ''
      }
    })

    return () => {
      map.setTarget(undefined)
      mapObjRef.current = null
      sourceRef.current = null
    }
  }, [])

  // Update markers when stations change
  useEffect(() => {
    if (!sourceRef.current) return
    sourceRef.current.clear()
    sourceRef.current.addFeatures(buildFeatures(stations))
  }, [stations])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
