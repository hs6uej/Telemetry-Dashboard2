'use client'
import { useEffect, useRef } from 'react'
import type { Station } from '@/lib/types'
import type Point from 'ol/geom/Point'

interface Props {
  stations: Station[]
  onSelect: (station: Station) => void
  selected: Station | null
}

const STATUS_HEX: Record<string, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  offline: '#94a3b8',
}

export default function TelemetryMap({ stations, onSelect, selected }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObjRef = useRef<any>(null)
  const overlayRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return

    import('ol/Map').then(async ({ default: Map }) => {
      const { default: View } = await import('ol/View')
      const { default: TileLayer } = await import('ol/layer/Tile')
      const { default: XYZ } = await import('ol/source/XYZ')
      const { default: VectorLayer } = await import('ol/layer/Vector')
      const { default: VectorSource } = await import('ol/source/Vector')
      const { default: Feature } = await import('ol/Feature')
      const { default: Point } = await import('ol/geom/Point')
      const { default: Style } = await import('ol/style/Style')
      const { default: CircleStyle } = await import('ol/style/Circle')
      const { default: Fill } = await import('ol/style/Fill')
      const { default: Stroke } = await import('ol/style/Stroke')
      const { default: Overlay } = await import('ol/Overlay')
      const { fromLonLat } = await import('ol/proj')

      const tileLayer = new TileLayer({
        source: new XYZ({
          url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attributions: '© OpenStreetMap © CARTO',
        }),
      })

      const features = stations.map(st => {
        const f = new Feature({ geometry: new Point(fromLonLat([st.lng, st.lat])), station: st })
        f.setId(st.id)
        return f
      })

      const vectorSource = new VectorSource({ features })

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) => {
          const st = feature.get('station') as Station
          const color = STATUS_HEX[st.status] || '#94a3b8'
          return new Style({
            image: new CircleStyle({
              radius: 8,
              fill: new Fill({ color }),
              stroke: new Stroke({ color: 'rgba(255,255,255,0.8)', width: 2 }),
            }),
          })
        },
      })

      const popup = document.createElement('div')
      popup.className = 'ol-popup'
      popup.style.cssText = `
        background: rgba(10,30,60,0.95);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        padding: 10px 14px;
        color: #e2e8f0;
        font-size: 13px;
        min-width: 180px;
        backdrop-filter: blur(8px);
        pointer-events: none;
      `

      const overlay = new Overlay({ element: popup, positioning: 'bottom-center', offset: [0, -12] })
      overlayRef.current = overlay

      const map = new Map({
        target: mapRef.current!,
        layers: [tileLayer, vectorLayer],
        overlays: [overlay],
        view: new View({
          center: fromLonLat([100.5, 15.5]),
          zoom: 6,
        }),
      })

      map.on('click', (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
        if (feature) {
          const st = feature.get('station') as Station
          onSelect(st)
        } else {
          overlay.setPosition(undefined)
        }
      })

      map.on('pointermove', (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
        if (feature) {
          const st = feature.get('station') as Station
          popup.innerHTML = `
            <div style="font-weight:600;margin-bottom:4px;color:#1abc9c">${st.name}</div>
            <div>ระดับน้ำ: ${st.waterLevel != null ? st.waterLevel.toFixed(2) + ' ม.' : '-'}</div>
            <div>ฝน: ${st.rainLevel != null ? st.rainLevel.toFixed(1) + ' มม.' : '-'}</div>
          `
          const geom = feature.getGeometry() as Point
          overlay.setPosition(geom.getCoordinates())
          map.getTargetElement().style.cursor = 'pointer'
        } else {
          overlay.setPosition(undefined)
          map.getTargetElement().style.cursor = ''
        }
      })

      mapObjRef.current = { map, vectorSource, fromLonLat, Style, CircleStyle, Fill, Stroke }
    })

    return () => {
      if (mapObjRef.current?.map) {
        mapObjRef.current.map.setTarget(undefined)
        mapObjRef.current = null
      }
    }
  }, [])

  // Update features when stations change
  useEffect(() => {
    if (!mapObjRef.current) return
    const { map, vectorSource, fromLonLat, Style, CircleStyle, Fill, Stroke } = mapObjRef.current
    const vectorLayer = map.getLayers().getArray().find((l: any) => l.getSource?.() === vectorSource)
    if (!vectorLayer) return

    import('ol/Feature').then(({ default: Feature }) =>
      import('ol/geom/Point').then(({ default: Point }) => {
        vectorSource.clear()
        const features = stations.map((st: Station) => {
          const f = new Feature({ geometry: new Point(fromLonLat([st.lng, st.lat])), station: st })
          f.setId(st.id)
          return f
        })
        vectorSource.addFeatures(features)
      }),
    )
  }, [stations])

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
}
