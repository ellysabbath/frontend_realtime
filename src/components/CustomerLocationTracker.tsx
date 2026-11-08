import { useEffect, useRef } from 'react'
import { locationApi } from '../lib/api'

interface Props {
  requestId: string
  status: string
}

export default function CustomerLocationTracker({ requestId, status }: Props) {
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    // Only send location if the job is active (taken or processing)
    if (!['taken', 'processing'].includes(status)) return

    let watchId: number | null = null

    const sendLocation = async (lat: number, lng: number) => {
      const now = Date.now()
      // Throttle to every 5 seconds to save battery and database writes
      if (now - lastSentRef.current < 5000) return
      
      lastSentRef.current = now
      try {
        await locationApi.update(requestId, lat, lng)
        console.log('Location sent to technician')
      } catch (err) {
        console.error('Failed to send location', err)
      }
    }

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn('GPS permission denied or error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [requestId, status])

  return null // Renders nothing, purely logic
}