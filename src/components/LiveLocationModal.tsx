import { useEffect, useState } from 'react'
import { MapPin, Loader2, X, Navigation, Crosshair } from 'lucide-react'
import { locationApi } from '../lib/api'

interface Props {
  requestId: string | null
  customerName: string
  onClose: () => void
}

export default function LiveLocationModal({ requestId, customerName, onClose }: Props) {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)

  // 1. Fetch customer location (poll every 2s)
  useEffect(() => {
    if (!requestId) return

    let isMounted = true

    const fetchLocation = async () => {
      try {
        const data = await locationApi.get(requestId)
        if (isMounted && data && typeof data.lat === 'number') {
          setLoc({ lat: data.lat, lng: data.lng })
        }
      } catch (err) {
        // Ignore 404 (customer hasn't sent location yet)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    setLoading(true)
    fetchLocation()
    const interval = setInterval(fetchLocation, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [requestId])

  // 2. Get the technician's own location (for the navigation link)
  useEffect(() => {
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => console.warn('Could not get technician location', err),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  if (!requestId) return null

  // 3. Build the exact Google Maps URL format you requested
  const getGoogleMapsUrl = () => {
    if (!loc) return '#'
    
    // If we have both start and end, use the full directions format
    if (myLoc) {
      return `https://www.google.com/maps/dir/${myLoc.lat},${myLoc.lng}/${loc.lat},${loc.lng}/@${loc.lat},${loc.lng},15z/data=!3m1!1e3`
    }
    
    // Fallback: Just show the destination marker
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Track Customer Location
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              {customerName || 'Customer'} • 
              {loc ? (
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                </span>
              ) : (
                <span className="text-yellow-600 font-semibold">Waiting for GPS...</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Map Area */}
        <div className="p-5">
          <div className="relative h-72 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            
            {loc ? (
              <div
                className="absolute transition-all duration-700 ease-out"
                style={{
                  left: `${((loc.lng + 180) % 360) / 3.6}%`,
                  top: `${((90 - loc.lat) / 180) * 100}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="relative">
                  <MapPin className="text-brand-600 fill-brand-100 drop-shadow-md" size={36} />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-[2px]" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm">
                <Loader2 size={24} className="animate-spin mb-2 text-brand-500" />
                Waiting for customer to share location...
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {loc && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                <div className="flex items-center gap-2 text-slate-700 font-mono">
                  <MapPin size={16} className="text-slate-400" />
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </div>
                {myLoc && (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Crosshair size={12} /> You are located
                  </div>
                )}
              </div>
              
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
              >
                <Navigation size={18} className="fill-white" />
                Start Navigation
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}